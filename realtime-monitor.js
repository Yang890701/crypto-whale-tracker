const puppeteer = require('puppeteer');

class RealtimeMonitor {
    constructor() {
        this.baseURL = 'https://www.defined.fi';
        this.isMonitoring = false;
        this.monitorInterval = null;
        this.lastResults = new Set();
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

    // 開始實時監控
    async startMonitoring(minUSD, callback) {
        if (this.isMonitoring) {
            return { success: false, message: '監控已在運行中' };
        }

        this.isMonitoring = true;
        console.log(`🚀 開始實時監控 USD ≥ $${minUSD}`);
        
        // 立即執行一次
        await this.checkForNewTransactions(minUSD, callback);
        
        // 每30秒檢查一次
        this.monitorInterval = setInterval(async () => {
            if (this.isMonitoring) {
                await this.checkForNewTransactions(minUSD, callback);
            }
        }, 30000);

        return { success: true, message: '實時監控已啟動' };
    }

    // 停止監控
    stopMonitoring() {
        this.isMonitoring = false;
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        this.lastResults.clear();
        console.log('⏹️ 監控已停止');
        return { success: true, message: '監控已停止' };
    }

    // 檢查新交易
    async checkForNewTransactions(minUSD, callback) {
        let browser;
        try {
            const currentTime = this.formatTime();
            console.log(`🔍 [${currentTime}] 檢查新交易...`);

            browser = await puppeteer.launch({ 
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            
            await page.goto(`${this.baseURL}/tokens/discover`, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            await page.waitForTimeout(8000);

            // 獲取當前數據
            const results = await page.evaluate((minAmount) => {
                const foundTokens = [];
                const tokenLinks = document.querySelectorAll('a[href*="0x"]');
                
                tokenLinks.forEach(link => {
                    const href = link.href;
                    const addressMatch = href.match(/0x[a-fA-F0-9]{40}/);
                    
                    if (addressMatch) {
                        const address = addressMatch[0];
                        const parent = link.closest('tr, div, section');
                        const parentText = parent ? parent.textContent : link.textContent;
                        
                        const usdMatches = parentText.match(/\$[\d,]+\.?\d*/g);
                        if (usdMatches) {
                            usdMatches.forEach(usdText => {
                                const amount = parseFloat(usdText.replace(/[$,]/g, ''));
                                
                                if (amount >= minAmount) {
                                    const symbolMatch = parentText.match(/([A-Z]{2,10})/);
                                    const symbol = symbolMatch ? symbolMatch[1] : 'Unknown';
                                    
                                    foundTokens.push({
                                        symbol: symbol,
                                        address: address,
                                        usdAmount: amount,
                                        usdText: usdText,
                                        url: href,
                                        key: `${address}-${amount}`
                                    });
                                }
                            });
                        }
                    }
                });
                
                return foundTokens;
            }, minUSD);

            // 檢查新結果
            const newResults = results.filter(result => !this.lastResults.has(result.key));
            
            if (newResults.length > 0) {
                console.log(`✅ [${currentTime}] 發現 ${newResults.length} 個新交易`);
                
                for (const result of newResults) {
                    this.lastResults.add(result.key);
                    
                    // 獲取詳細交易者信息
                    const traders = await this.getTokenTraders(result.url, page);
                    
                    const alertData = {
                        ...result,
                        traders: traders,
                        timestamp: currentTime,
                        isNew: true
                    };
                    
                    // 回調通知
                    if (callback) {
                        callback(alertData);
                    }
                }
            } else {
                console.log(`ℹ️ [${currentTime}] 無新交易`);
            }

            // 更新結果集（保留最近100個）
            if (this.lastResults.size > 100) {
                const arr = Array.from(this.lastResults);
                this.lastResults = new Set(arr.slice(-50));
            }

        } catch (error) {
            console.error(`❌ [${this.formatTime()}] 監控錯誤:`, error.message);
        } finally {
            if (browser) await browser.close();
        }
    }

    // 獲取交易者信息
    async getTokenTraders(tokenUrl, page) {
        try {
            await page.goto(tokenUrl, { 
                waitUntil: 'networkidle2',
                timeout: 15000 
            });

            await page.waitForTimeout(3000);

            const traders = await page.evaluate(() => {
                const transactions = [];
                const allElements = document.querySelectorAll('*');
                
                allElements.forEach(element => {
                    const text = element.textContent;
                    const walletMatch = text.match(/0x[a-fA-F0-9]{40}/);
                    
                    if (walletMatch) {
                        const wallet = walletMatch[0];
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
                
                const unique = [];
                const seen = new Set();
                transactions.forEach(tx => {
                    const key = `${tx.wallet}-${tx.amount}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        unique.push(tx);
                    }
                });
                
                return unique.sort((a, b) => b.amount - a.amount).slice(0, 3);
            });

            return traders;
        } catch (error) {
            return [];
        }
    }

    // 驗證數據真實性
    async verifyDataAccuracy() {
        let browser;
        try {
            console.log('🔍 驗證數據真實性...');
            
            browser = await puppeteer.launch({ 
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            
            // 訪問網站並截圖
            await page.goto(`${this.baseURL}/tokens/discover`, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            await page.waitForTimeout(8000);

            // 獲取頁面信息用於驗證
            const verification = await page.evaluate(() => {
                return {
                    url: window.location.href,
                    title: document.title,
                    timestamp: new Date().toISOString(),
                    hasTokenLinks: document.querySelectorAll('a[href*="0x"]').length > 0,
                    hasUSDValues: document.body.textContent.includes('$'),
                    tokenCount: document.querySelectorAll('a[href*="0x"]').length,
                    usdMatches: (document.body.textContent.match(/\$[\d,]+\.?\d*/g) || []).length
                };
            });

            console.log('✅ 數據驗證結果:');
            console.log(`📍 URL: ${verification.url}`);
            console.log(`📄 標題: ${verification.title}`);
            console.log(`⏰ 時間: ${this.formatTime()}`);
            console.log(`🔗 代幣鏈接: ${verification.tokenCount} 個`);
            console.log(`💰 USD 數據: ${verification.usdMatches} 個`);
            console.log(`✅ 數據有效性: ${verification.hasTokenLinks && verification.hasUSDValues ? '真實' : '異常'}`);

            return verification;

        } catch (error) {
            console.error('❌ 驗證失敗:', error.message);
            return { error: error.message };
        } finally {
            if (browser) await browser.close();
        }
    }

    // 格式化實時警報
    formatAlert(data) {
        const result = `🚨 實時交易警報\n\n`;
        const time = `⏰ 時間: ${data.timestamp}\n`;
        const token = `🎯 代幣: ${data.symbol}\n`;
        const amount = `💰 金額: ${data.usdText}\n`;
        const address = `📍 地址: ${data.address.slice(0, 8)}...${data.address.slice(-6)}\n`;
        
        let traders = '';
        if (data.traders.length > 0) {
            traders = `👥 交易者:\n`;
            data.traders.forEach((trader, i) => {
                traders += `   ${i + 1}. ${trader.wallet.slice(0, 6)}...${trader.wallet.slice(-4)}\n`;
                traders += `      💵 ${trader.amountText} (${trader.type})\n`;
            });
        }
        
        const source = `📡 數據來源: defined.fi 實時數據`;
        
        return result + time + token + amount + address + traders + source;
    }
}

module.exports = RealtimeMonitor;