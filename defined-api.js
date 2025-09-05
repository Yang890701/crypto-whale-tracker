const axios = require('axios');

class DefinedAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.defined.fi';
        this.headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    // 搜尋代幣
    async searchTokens(query) {
        try {
            const response = await axios.get(`${this.baseURL}/tokens/search`, {
                params: { q: query, limit: 10 },
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            console.error('搜尋代幣失敗:', error.message);
            return [];
        }
    }

    // 獲取代幣詳細資訊
    async getTokenDetails(address) {
        try {
            const response = await axios.get(`${this.baseURL}/tokens/${address}`, {
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            console.error('獲取代幣詳情失敗:', error.message);
            return null;
        }
    }

    // 獲取大額交易
    async getLargeTransactions(address, options = {}) {
        const {
            minAmount = 1000,
            timeframe = '24h',
            limit = 50,
            type = null // 'buy', 'sell', or null for both
        } = options;

        try {
            const params = {
                minAmountUSD: minAmount,
                timeframe,
                limit
            };
            
            if (type) params.type = type;

            const response = await axios.get(`${this.baseURL}/tokens/${address}/transactions`, {
                params,
                headers: this.headers
            });
            
            return response.data.filter(tx => tx.amountUSD >= minAmount);
        } catch (error) {
            console.error('獲取大額交易失敗:', error.message);
            return [];
        }
    }

    // 獲取持有者分布
    async getHolders(address, limit = 50) {
        try {
            const response = await axios.get(`${this.baseURL}/tokens/${address}/holders`, {
                params: { limit },
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            console.error('獲取持有者失敗:', error.message);
            return [];
        }
    }

    // 獲取錢包交易歷史
    async getWalletTransactions(walletAddress, tokenAddress = null, options = {}) {
        const {
            limit = 100,
            timeframe = '30d'
        } = options;

        try {
            const params = { limit, timeframe };
            if (tokenAddress) params.token = tokenAddress;

            const response = await axios.get(`${this.baseURL}/wallets/${walletAddress}/transactions`, {
                params,
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            console.error('獲取錢包交易失敗:', error.message);
            return [];
        }
    }

    // 分析錢包持倉
    async getWalletHoldings(walletAddress) {
        try {
            const response = await axios.get(`${this.baseURL}/wallets/${walletAddress}/holdings`, {
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            console.error('獲取錢包持倉失敗:', error.message);
            return [];
        }
    }

    // 獲取熱門代幣
    async getTrendingTokens(timeframe = '1h') {
        try {
            const response = await axios.get(`${this.baseURL}/tokens/trending`, {
                params: { timeframe, limit: 20 },
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            console.error('獲取熱門代幣失敗:', error.message);
            return [];
        }
    }

    // 獲取價格歷史
    async getPriceHistory(address, timeframe = '1d') {
        try {
            const response = await axios.get(`${this.baseURL}/tokens/${address}/price-history`, {
                params: { timeframe },
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            console.error('獲取價格歷史失敗:', error.message);
            return [];
        }
    }
}

module.exports = DefinedAPI;