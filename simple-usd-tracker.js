const puppeteer = require('puppeteer');

class SimpleUSDTracker {
    constructor() {
        this.baseURL = 'https://www.defined.fi';
    }

    // 根據 USD 金額篩選代幣並獲取交易者
    async getTokensByUSDAmount(minUSD = 1000) {
        let browser;
        try {
            console.log(`🔍 搜尋 USD ≥ $${minUSD} 的代幣...`);
            
            browser = await puppeteer.launch({ 
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            
            console.log('🌐 訪問 defined.fi/tokens/discover...');
            await page.goto(`${this.baseURL}/tokens/discover`, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            await page.waitForTimeout(10000);

            // 獲取符合條件的代幣
            const results = await page.evaluate((minAmount) => {
                const foundTokens = [];
                
                // 尋找所有包含代幣地址的鏈接
                const tokenLinks = document.querySelectorAll('a[href*="0x"]');
                
                tokenLinks.forEach(link => {
                    const href = link.href;
                    const addressMatch = href.match(/0x[a-fA-F0-9]{40}/);
                    
                    if (addressMatch) {
                        const address = addressMatch[0];
                        
                        // 尋找該鏈接附近的 USD 金額
                        const parent = link.closest('tr, div, section');
                        const parentText = parent ? parent.textContent : link.textContent;
                        
                        // 提取所有 USD 金額
                        const usdMatches = parentText.match(/\$[\d,]+\.?\d*/g);
                        if (usdMatches) {
                            usdMatches.forEach(usdText => {
                                const amount = parseFloat(usdText.replace(/[$,]/g, ''));
                                
                                if (amount >= minAmount) {
                                    // 提取代幣符號
                                    const symbolMatch = parentText.match(/([A-Z]{2,10})/);
                                    const symbol = symbolMatch ? symbolMatch[1] : 'Unknown';
                                    
                                    // 提取時間信息
                                    const timeMatch = parentText.match(/\d{1,2}[hmd]|\d{1,2}:\d{2}|ago/);
                                    const time = timeMatch ? timeMatch[0] : '未知';
                                    
                                    foundTokens.push({
                                        symbol: symbol,
                                        address: address,
                                        usdAmount: amount,
                                        usdText: usdText,
                                        time: time,
                                        url: href
                                    });
                                }
                            });
                        }
                    }
                });
                
                // 去重並按金額排序
                const uniqueTokens = [];
                const seen = new Set();
                
                foundTokens.forEach(token => {
                    const key = `${token.address}-${token.usdAmount}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueTokens.push(token);
                    }
                });
                
                return uniqueTokens.sort((a, b) => b.usdAmount - a.usdAmount);
                
            }, minUSD);

            console.log(`✅ 找到 ${results.length} 個符合條件的代幣`);
            
            // 為前幾個代幣獲取交易者信息
            const detailedResults = [];
            for (const token of results.slice(0, 3)) {
                console.log(`📊 獲取 ${token.symbol} 的交易者信息...`);
                const traders = await this.getTokenTraders(token.url, page);
                detailedResults.push({
                    ...token,
                    traders: traders
                });
            }

            return {
                success: true,
                tokens: detailedResults,
                totalFound: results.length
            };

        } catch (error) {
            console.error('❌ 獲取失敗:', error.message);
            return { 
                success: false, 
                message: `無法獲取數據: ${error.message}` 
            };
        } finally {
            if (browser) await browser.close();
        }
    }

    // 獲取代幣交易者信息
    async getTokenTraders(tokenUrl, page) {
        try {
            console.log(`🔗 訪問: ${tokenUrl}`);
            await page.goto(tokenUrl, { 
                waitUntil: 'networkidle2',
                timeout: 20000 
            });

            await page.waitForTimeout(5000);

            // 獲取交易者數據
            const traders = await page.evaluate(() => {
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
                                if (amount >= 100) {
                                    const isBuy = text.toLowerCase().includes('buy');
                                    const isSell = text.toLowerCase().includes('sell');
                                    const type = isBuy ? '買入' : (isSell ? '賣出' : '交易');
                                    
                                    transactions.push({
                                        wallet: wallet,
                                        amount: amount,
                                        amountText: amountText,
                                        type: type
                                    });
                                }
                            });
                        }
                    }
                });
                
                // 去重並排序
                const unique = [];
                const seen = new Set();
                transactions.forEach(tx => {
                    const key = `${tx.wallet}-${tx.amount}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        unique.push(tx);
                    }
                });
                
                return unique.sort((a, b) => b.amount - a.amount).slice(0, 5);
            });

            console.log(`✅ 找到 ${traders.length} 個交易記錄`);
            return traders;

        } catch (error) {
            console.error('獲取交易者失敗:', error.message);
            return [];
        }
    }

    // 格式化結果
    formatResults(data) {
        if (!data.success) {
            return `❌ ${data.message}`;
        }

        if (data.tokens.length === 0) {
            return '❌ 未找到符合條件的代幣';
        }

        let result = `🎯 找到 ${data.totalFound} 個 USD 金額符合條件的代幣\n`;
        result += `📊 顯示前 ${data.tokens.length} 個:\n\n`;

        data.tokens.forEach((token, i) => {
            result += `${i + 1}. ${token.symbol}\n`;
            result += `💰 USD 金額: ${token.usdText}\n`;
            result += `📍 地址: ${token.address.slice(0, 8)}...${token.address.slice(-6)}\n`;
            result += `⏰ 時間: ${token.time}\n`;
            
            if (token.traders.length > 0) {
                result += `👥 交易者 (${token.traders.length}個):\n`;
                token.traders.forEach((trader, j) => {
                    result += `   ${j + 1}. ${trader.wallet.slice(0, 6)}...${trader.wallet.slice(-4)}\n`;
                    result += `      💵 ${trader.amountText} (${trader.type})\n`;
                });
            } else {
                result += `❌ 暫無大額交易記錄\n`;
            }
            result += '\n';
        });

        result += `⏰ 查詢時間: ${new Date().toLocaleString()}\n`;
        result += `📡 數據來源: defined.fi 真實數據`;
        return result;
    }
}

module.exports = SimpleUSDTracker;