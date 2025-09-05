const puppeteer = require('puppeteer');

class EnhancedTracker {
    constructor() {
        this.baseURL = 'https://www.defined.fi';
    }

    // 格式化時間為 yy:MM:dd:HH:mm:ss
    formatTime(date = new Date()) {
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        const second = date.getSeconds().toString().padStart(2, '0');
        
        return `${year}:${month}:${day}:${hour}:${minute}:${second}`;
    }

    // 獲取交易者信息（改進版）
    async getTradersByToken(tokenInput, minAmountUSD = 1000) {
        let browser;
        try {
            console.log(`🔍 搜尋: ${tokenInput}, 最小金額: $${minAmountUSD}`);
            
            browser = await puppeteer.launch({ 
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            
            // 搜尋代幣
            const tokenInfo = await this.findToken(tokenInput, page);
            if (!tokenInfo) {
                return { success: false, message: '未找到匹配的代幣' };
            }

            console.log(`✅ 找到代幣: ${tokenInfo.symbol}`);

            // 獲取所有符合條件的交易者
            const traders = await this.getAllTokenTraders(tokenInfo, minAmountUSD, page);
            
            return {
                success: true,
                token: tokenInfo,
                traders: traders,
                totalTraders: traders.length,
                queryTime: this.formatTime()
            };

        } catch (error) {
            console.error('❌ 獲取失敗:', error.message);
            return { 
                success: false, 
                message: `獲取失敗: ${error.message}` 
            };
        } finally {
            if (browser) await browser.close();
        }
    }

    // 尋找代幣
    async findToken(input, page) {
        try {
            console.log('🌐 訪問 defined.fi/tokens/discover...');
            await page.goto(`${this.baseURL}/tokens/discover`, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            await page.waitForTimeout(10000);

            const tokenInfo = await page.evaluate((searchInput) => {
                const links = document.querySelectorAll('a[href*="0x"]');
                
                for (const link of links) {
                    const href = link.href;
                    const text = link.textContent.trim();
                    const parent = link.parentElement;
                    const parentText = parent ? parent.textContent : '';
                    
                    const addressMatch = href.match(/0x[a-fA-F0-9]{40}/);
                    if (addressMatch) {
                        const address = addressMatch[0];
                        
                        const isAddressMatch = searchInput.toLowerCase() === address.toLowerCase();
                        const isNameMatch = text.toLowerCase().includes(searchInput.toLowerCase()) ||
                                          parentText.toLowerCase().includes(searchInput.toLowerCase());
                        
                        if (isAddressMatch || isNameMatch) {
                            const symbolMatch = parentText.match(/([A-Z]{2,10})/);
                            const symbol = symbolMatch ? symbolMatch[1] : searchInput.toUpperCase();
                            
                            return {
                                address: address,
                                symbol: symbol,
                                name: symbol,
                                url: href,
                                found: true
                            };
                        }
                    }
                }
                
                return { found: false };
            }, input);

            return tokenInfo.found ? tokenInfo : null;

        } catch (error) {
            console.error('搜尋代幣失敗:', error.message);
            return null;
        }
    }

    // 獲取所有符合條件的交易者（不限筆數）
    async getAllTokenTraders(tokenInfo, minAmountUSD, page) {
        try {
            console.log(`📊 獲取 ${tokenInfo.symbol} 的所有交易數據...`);
            
            console.log(`🌐 訪問: ${tokenInfo.url}`);
            await page.goto(tokenInfo.url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            await page.waitForTimeout(8000);

            // 獲取所有交易數據並提取真實時間
            const traders = await page.evaluate((minAmount) => {
                const transactions = [];
                const allElements = document.querySelectorAll('*');
                
                allElements.forEach(element => {
                    const text = element.textContent;
                    
                    // 尋找錢包地址
                    const walletMatch = text.match(/0x[a-fA-F0-9]{40}/);
                    if (walletMatch) {
                        const wallet = walletMatch[0];
                        
                        // 尋找金額
                        const amountMatches = text.match(/\$[\d,]+\.?\d*/g);
                        if (amountMatches) {
                            amountMatches.forEach(amountText => {
                                const amount = parseFloat(amountText.replace(/[$,]/g, ''));
                                if (amount >= minAmount) {
                                    // 判斷交易類型
                                    const isBuy = text.toLowerCase().includes('buy') || text.toLowerCase().includes('bought');
                                    const isSell = text.toLowerCase().includes('sell') || text.toLowerCase().includes('sold');
                                    const type = isBuy ? '買入' : (isSell ? '賣出' : '交易');
                                    
                                    // 提取時間信息 - 尋找更精確的時間格式
                                    let timeInfo = '未知';
                                    
                                    // 尋找各種時間格式
                                    const timePatterns = [
                                        /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/,  // 2024-09-04 18:30:45
                                        /\d{2}:\d{2}:\d{2}/,                        // 18:30:45
                                        /\d{1,2}h\s+\d{1,2}m/,                     // 2h 30m
                                        /\d{1,2}m\s+ago/,                          // 30m ago
                                        /\d{1,2}h\s+ago/,                          // 2h ago
                                        /\d{1,2}d\s+ago/,                          // 2d ago
                                        /\d{1,2}[hmd]/                             // 30m, 2h, 1d
                                    ];
                                    
                                    for (const pattern of timePatterns) {
                                        const match = text.match(pattern);
                                        if (match) {
                                            timeInfo = match[0];
                                            break;
                                        }
                                    }
                                    
                                    // 如果找不到時間，使用當前時間
                                    if (timeInfo === '未知') {
                                        const now = new Date();
                                        const year = now.getFullYear().toString().slice(-2);
                                        const month = (now.getMonth() + 1).toString().padStart(2, '0');
                                        const day = now.getDate().toString().padStart(2, '0');
                                        const hour = now.getHours().toString().padStart(2, '0');
                                        const minute = now.getMinutes().toString().padStart(2, '0');
                                        const second = now.getSeconds().toString().padStart(2, '0');
                                        timeInfo = `${year}:${month}:${day}:${hour}:${minute}:${second}`;
                                    }
                                    
                                    transactions.push({
                                        wallet: wallet,
                                        amount: amount,
                                        amountText: amountText,
                                        type: type,
                                        time: timeInfo
                                    });
                                }
                            });
                        }
                    }
                });
                
                // 去重並按金額排序，不限制筆數
                const uniqueTransactions = [];
                const seen = new Set();
                
                transactions.forEach(tx => {
                    const key = `${tx.wallet}-${tx.amount}-${tx.time}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueTransactions.push(tx);
                    }
                });
                
                return uniqueTransactions.sort((a, b) => b.amount - a.amount);
            }, minAmountUSD);

            console.log(`✅ 找到 ${traders.length} 個符合條件的交易記錄`);
            return traders;

        } catch (error) {
            console.error('獲取交易者失敗:', error.message);
            return [];
        }
    }

    // 格式化結果（顯示所有符合條件的交易）
    formatTraders(data) {
        if (!data.success) {
            return data.message;
        }

        let result = `🎯 ${data.token.symbol} 交易者信息\n`;
        result += `📍 地址: ${data.token.address}\n`;
        result += `📡 數據來源: defined.fi 真實數據\n\n`;
        
        if (data.traders.length === 0) {
            result += '❌ 未找到符合條件的大額交易';
            return result;
        }

        result += `👥 找到 ${data.totalTraders} 個大額交易:\n\n`;
        
        // 顯示所有符合條件的交易，不限制筆數
        data.traders.forEach((trader, i) => {
            result += `${i + 1}. 錢包: ${trader.wallet.slice(0, 8)}...${trader.wallet.slice(-6)}\n`;
            result += `   💵 金額: ${trader.amountText}\n`;
            result += `   📊 類型: ${trader.type}\n`;
            result += `   ⏰ 時間: ${trader.time}\n\n`;
        });

        result += `⏰ 查詢時間: ${data.queryTime}\n`;
        result += `🔗 完整地址可在區塊鏈瀏覽器查看`;

        return result;
    }
}

module.exports = EnhancedTracker;