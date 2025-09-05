const axios = require('axios');
const puppeteer = require('puppeteer');

class DefinedScraper {
    constructor() {
        this.baseURL = 'https://www.defined.fi';
        this.apiURL = 'https://api.defined.fi';
    }

    // 獲取 defined.fi 的即時代幣數據
    async getTokenDiscoveryData(filters = {}) {
        try {
            console.log('🔍 抓取 defined.fi 即時數據...');
            
            // 嘗試直接 API 調用
            const apiData = await this.tryDirectAPI(filters);
            if (apiData) return apiData;
            
            // 如果 API 失敗，使用網頁抓取
            return await this.scrapeWebData(filters);
            
        } catch (error) {
            console.error('抓取失敗:', error.message);
            return [];
        }
    }

    // 嘗試直接 API 調用
    async tryDirectAPI(filters) {
        try {
            // defined.fi 可能的 API 端點
            const endpoints = [
                '/graphql',
                '/api/tokens/discover',
                '/api/v1/tokens/trending',
                '/tokens/discover/api'
            ];

            for (const endpoint of endpoints) {
                try {
                    const response = await axios.post(`${this.apiURL}${endpoint}`, {
                        query: this.buildGraphQLQuery(filters),
                        variables: filters
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Referer': 'https://www.defined.fi/tokens/discover'
                        },
                        timeout: 10000
                    });

                    if (response.data && response.data.data) {
                        console.log(`✅ API 成功: ${endpoint}`);
                        return this.parseAPIResponse(response.data);
                    }
                } catch (err) {
                    console.log(`❌ API 失敗: ${endpoint} - ${err.message}`);
                }
            }
            
            return null;
        } catch (error) {
            console.error('API 調用失敗:', error.message);
            return null;
        }
    }

    // 構建 GraphQL 查詢
    buildGraphQLQuery(filters) {
        return `
        query GetTokens($filters: TokenFilters) {
            tokens(filters: $filters, limit: 50) {
                address
                symbol
                name
                price
                priceChange24h
                volume24h
                marketCap
                holders
                transactions24h
                liquidity
                createdAt
                network
            }
        }`;
    }

    // 網頁抓取方式
    async scrapeWebData(filters) {
        let browser;
        try {
            console.log('🌐 使用網頁抓取方式...');
            
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            
            // 設置請求攔截
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (req.resourceType() === 'stylesheet' || req.resourceType() === 'image') {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            // 監聽網絡請求
            const apiResponses = [];
            page.on('response', async (response) => {
                const url = response.url();
                if (url.includes('api') || url.includes('graphql')) {
                    try {
                        const data = await response.json();
                        apiResponses.push({ url, data });
                    } catch (e) {
                        // 忽略非 JSON 響應
                    }
                }
            });

            await page.goto('https://www.defined.fi/tokens/discover', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // 等待數據加載
            await page.waitForTimeout(5000);

            // 嘗試從攔截的 API 響應中獲取數據
            if (apiResponses.length > 0) {
                console.log(`✅ 攔截到 ${apiResponses.length} 個 API 響應`);
                return this.parseInterceptedData(apiResponses);
            }

            // 如果沒有攔截到 API，直接抓取頁面數據
            return await this.scrapePageData(page);

        } catch (error) {
            console.error('網頁抓取失敗:', error.message);
            return [];
        } finally {
            if (browser) await browser.close();
        }
    }

    // 抓取頁面數據
    async scrapePageData(page) {
        try {
            const tokens = await page.evaluate(() => {
                const rows = document.querySelectorAll('[data-testid="token-row"], .token-item, tr');
                const results = [];

                rows.forEach(row => {
                    try {
                        const symbol = row.querySelector('[data-testid="symbol"], .symbol, .token-symbol')?.textContent?.trim();
                        const name = row.querySelector('[data-testid="name"], .name, .token-name')?.textContent?.trim();
                        const price = row.querySelector('[data-testid="price"], .price')?.textContent?.trim();
                        const change = row.querySelector('[data-testid="change"], .change, .price-change')?.textContent?.trim();
                        const volume = row.querySelector('[data-testid="volume"], .volume')?.textContent?.trim();
                        const marketCap = row.querySelector('[data-testid="market-cap"], .market-cap')?.textContent?.trim();

                        if (symbol && price) {
                            results.push({
                                symbol,
                                name,
                                price,
                                priceChange24h: change,
                                volume24h: volume,
                                marketCap,
                                source: 'page-scrape'
                            });
                        }
                    } catch (e) {
                        // 忽略解析錯誤
                    }
                });

                return results;
            });

            console.log(`✅ 頁面抓取獲得 ${tokens.length} 個代幣`);
            return tokens;

        } catch (error) {
            console.error('頁面數據解析失敗:', error.message);
            return [];
        }
    }

    // 解析攔截的數據
    parseInterceptedData(apiResponses) {
        const tokens = [];
        
        apiResponses.forEach(({ url, data }) => {
            try {
                if (data.data && data.data.tokens) {
                    tokens.push(...data.data.tokens);
                } else if (Array.isArray(data)) {
                    tokens.push(...data);
                } else if (data.tokens) {
                    tokens.push(...data.tokens);
                }
            } catch (e) {
                console.log(`解析響應失敗: ${url}`);
            }
        });

        return tokens.map(token => ({
            address: token.address || token.contract_address,
            symbol: token.symbol,
            name: token.name,
            price: token.price || token.priceUsd,
            priceChange24h: token.priceChange24h || token.price_change_24h,
            volume24h: token.volume24h || token.volume_24h,
            marketCap: token.marketCap || token.market_cap,
            holders: token.holders || token.holder_count,
            transactions24h: token.transactions24h || token.txns_24h,
            liquidity: token.liquidity,
            network: token.network || token.chain,
            source: 'api-intercept'
        }));
    }

    // 解析 API 響應
    parseAPIResponse(data) {
        if (data.data && data.data.tokens) {
            return data.data.tokens.map(token => ({
                ...token,
                source: 'direct-api'
            }));
        }
        return [];
    }

    // 根據條件篩選代幣
    filterTokens(tokens, criteria = {}) {
        const {
            minPrice = 0,
            maxPrice = Infinity,
            minVolume = 0,
            minMarketCap = 0,
            minPriceChange = -Infinity,
            maxPriceChange = Infinity,
            symbols = [],
            networks = []
        } = criteria;

        return tokens.filter(token => {
            const price = parseFloat(token.price) || 0;
            const volume = parseFloat(token.volume24h) || 0;
            const marketCap = parseFloat(token.marketCap) || 0;
            const priceChange = parseFloat(token.priceChange24h) || 0;

            return (
                price >= minPrice &&
                price <= maxPrice &&
                volume >= minVolume &&
                marketCap >= minMarketCap &&
                priceChange >= minPriceChange &&
                priceChange <= maxPriceChange &&
                (symbols.length === 0 || symbols.includes(token.symbol)) &&
                (networks.length === 0 || networks.includes(token.network))
            );
        });
    }

    // 格式化輸出
    formatTokenData(tokens) {
        return tokens.map(token => {
            const price = parseFloat(token.price) || 0;
            const change = parseFloat(token.priceChange24h) || 0;
            const volume = parseFloat(token.volume24h) || 0;
            const marketCap = parseFloat(token.marketCap) || 0;

            return {
                symbol: token.symbol,
                name: token.name,
                address: token.address,
                price: price.toFixed(price < 1 ? 6 : 2),
                priceChange24h: `${change > 0 ? '+' : ''}${change.toFixed(2)}%`,
                volume24h: volume > 1000000 ? `$${(volume/1000000).toFixed(2)}M` : `$${volume.toLocaleString()}`,
                marketCap: marketCap > 1000000 ? `$${(marketCap/1000000).toFixed(2)}M` : `$${marketCap.toLocaleString()}`,
                holders: token.holders || 'N/A',
                network: token.network || 'Unknown',
                source: token.source
            };
        });
    }
}

module.exports = DefinedScraper;