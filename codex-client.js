const axios = require('axios');

class CodexClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.codex.io/graphql';
    }

    async gql(query, variables = {}) {
        try {
            const response = await axios.post(this.baseURL, {
                query,
                variables
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey
                },
                timeout: 30000
            });

            if (response.data.errors) {
                throw new Error(JSON.stringify(response.data.errors));
            }

            return response.data.data;
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Codex API Key 無效或已過期');
            }
            throw new Error(`Codex API 錯誤: ${error.message}`);
        }
    }

    // 1. 搜尋代幣
    async findToken(phrase, networkId = 1) {
        const FIND_TOKEN = `
            query($phrase: String!, $networkId: Int!) {
                filterTokens(
                    phrase: $phrase
                    filters: {
                        networkIds: [$networkId]
                        minVolume24: 10000
                        minLiquidityUsd: 5000
                    }
                    rankings: [trendingScore24, volume24]
                    limit: 1
                ) {
                    nodes {
                        id
                        address
                        networkId
                        name
                        symbol
                    }
                }
            }
        `;

        const data = await this.gql(FIND_TOKEN, { phrase, networkId });
        
        if (!data.filterTokens.nodes.length) {
            throw new Error('未找到代幣');
        }

        return data.filterTokens.nodes[0];
    }

    // 2. 獲取交易事件
    async getTokenEvents(pairAddress, networkId, from, to, minUsd, side = null) {
        const GET_EVENTS = `
            query($pairAddress: String!, $networkId: Int!, $from: Int!, $to: Int!, $minUsd: Float, $side: EventSide, $limit: Int, $cursor: String) {
                getTokenEvents(
                    limit: $limit
                    cursor: $cursor
                    query: {
                        pairAddress: $pairAddress
                        networkId: $networkId
                        from: $from
                        to: $to
                        side: $side
                        minUsd: $minUsd
                        eventTypes: [SWAP]
                    }
                ) {
                    nodes {
                        id
                        txHash
                        timestamp
                        side
                        maker
                        amountUsd
                        priceUsd
                    }
                    pageInfo {
                        endCursor
                        hasNextPage
                    }
                }
            }
        `;

        const pageSize = 200;
        let cursor = undefined;
        const allEvents = [];

        do {
            const data = await this.gql(GET_EVENTS, {
                pairAddress,
                networkId,
                from,
                to,
                minUsd,
                side,
                limit: pageSize,
                cursor
            });

            allEvents.push(...data.getTokenEvents.nodes);
            cursor = data.getTokenEvents.pageInfo.hasNextPage 
                ? data.getTokenEvents.pageInfo.endCursor 
                : undefined;

        } while (cursor);

        return allEvents;
    }

    // 3. 彙總交易者數據
    aggregateTraders(events) {
        const byMaker = new Map();

        for (const event of events) {
            const maker = event.maker;
            const existing = byMaker.get(maker) || {
                wallet: maker,
                count: 0,
                totalUsd: 0,
                avgPrice: 0,
                firstTs: event.timestamp,
                lastTs: event.timestamp
            };

            existing.count += 1;
            existing.totalUsd += event.amountUsd || 0;
            
            if (event.priceUsd) {
                existing.avgPrice = existing.count === 1
                    ? event.priceUsd
                    : ((existing.avgPrice * (existing.count - 1)) + event.priceUsd) / existing.count;
            }

            existing.firstTs = Math.min(existing.firstTs, event.timestamp);
            existing.lastTs = Math.max(existing.lastTs, event.timestamp);

            byMaker.set(maker, existing);
        }

        return Array.from(byMaker.values())
            .sort((a, b) => b.totalUsd - a.totalUsd)
            .map(x => ({
                wallet: x.wallet,
                orders: x.count,
                totalUsd: Math.round(x.totalUsd),
                avgPriceUsd: x.avgPrice || null,
                window: {
                    start: x.firstTs,
                    end: x.lastTs,
                    startDate: new Date(x.firstTs * 1000).toISOString(),
                    endDate: new Date(x.lastTs * 1000).toISOString()
                }
            }));
    }

    // 4. 完整查詢流程
    async queryTraders(tokenPhrase, minUsd, networkId = 1, timeRangeHours = 24) {
        try {
            console.log(`🔍 搜尋代幣: ${tokenPhrase}`);
            
            // 1. 找到代幣
            const token = await this.findToken(tokenPhrase, networkId);
            console.log(`✅ 找到代幣: ${token.symbol} (${token.name})`);

            // 2. 計算時間範圍
            const to = Math.floor(Date.now() / 1000);
            const from = to - (timeRangeHours * 3600);

            console.log(`📅 時間範圍: ${new Date(from * 1000).toISOString()} 到 ${new Date(to * 1000).toISOString()}`);

            // 3. 獲取交易事件 (這裡需要 pairAddress，簡化處理)
            // 實際使用時需要先查詢該代幣的主要交易對
            const pairAddress = token.address; // 簡化處理，實際需要查詢 pairs

            console.log(`📊 獲取交易事件，最小金額: $${minUsd}`);
            
            const events = await this.getTokenEvents(pairAddress, networkId, from, to, minUsd);
            console.log(`✅ 獲取到 ${events.length} 個交易事件`);

            // 4. 彙總數據
            const traders = this.aggregateTraders(events);
            console.log(`👥 彙總出 ${traders.length} 個交易者`);

            return {
                success: true,
                token,
                traders,
                totalEvents: events.length,
                timeRange: { from, to, hours: timeRangeHours },
                minUsd
            };

        } catch (error) {
            console.error('❌ 查詢失敗:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = CodexClient;