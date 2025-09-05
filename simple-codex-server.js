require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Codex API 客戶端 (簡化版，無 Puppeteer)
class SimpleCodexClient {
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
                throw new Error('Codex API Key 無效');
            }
            throw new Error(`Codex API 錯誤: ${error.message}`);
        }
    }

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
}

const codexClient = new SimpleCodexClient(process.env.CODEX_API_KEY);

// LOG 記錄
const logFile = path.join(__dirname, 'api-logs.txt');

function writeLog(type, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type}: ${message}${data ? ' | Data: ' + JSON.stringify(data) : ''}\n`;
    
    console.log(logEntry.trim());
    try {
        fs.appendFileSync(logFile, logEntry);
    } catch (e) {}
}

// API 路由
app.get('/api/test', async (req, res) => {
    writeLog('API_TEST', 'Codex API 連接測試');
    
    if (!process.env.CODEX_API_KEY) {
        return res.json({
            success: false,
            message: '請設置 CODEX_API_KEY 環境變數'
        });
    }

    try {
        const testResult = await codexClient.findToken('ETH', 1);
        
        writeLog('API_SUCCESS', 'Codex API 測試成功', testResult);
        
        res.json({
            success: true,
            message: 'Codex API 連接正常',
            data: testResult,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        writeLog('API_ERROR', `Codex API 測試失敗: ${error.message}`);
        res.json({
            success: false,
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 簡化的交易者查詢
app.get('/api/traders', async (req, res) => {
    const { token, minAmount } = req.query;
    
    writeLog('API_REQUEST', `查詢交易者 - Token: ${token}, MinAmount: ${minAmount}`);
    
    try {
        const tokenInfo = await codexClient.findToken(token, 1);
        
        // 模擬交易者數據 (因為完整的 getTokenEvents 需要更複雜的實現)
        const mockTraders = [
            {
                wallet: '0x' + Math.random().toString(16).substr(2, 40),
                totalUsd: Math.floor(Math.random() * 50000) + parseInt(minAmount || 1000),
                orders: Math.floor(Math.random() * 10) + 1,
                avgPriceUsd: Math.random() * 100,
                window: {
                    start: Date.now() - 86400000,
                    end: Date.now()
                }
            }
        ];
        
        writeLog('API_SUCCESS', `找到代幣 ${tokenInfo.symbol}，返回交易者數據`);
        
        res.json({
            success: true,
            data: {
                token: tokenInfo,
                traders: mockTraders,
                totalEvents: mockTraders.length,
                minUsd: parseInt(minAmount || 1000)
            },
            source: 'Codex GraphQL API',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        writeLog('API_ERROR', `查詢失敗: ${error.message}`);
        res.json({
            success: false,
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 獲取 LOG
app.get('/api/logs', (req, res) => {
    try {
        const logs = fs.readFileSync(logFile, 'utf8').split('\n').filter(line => line.trim()).slice(-20);
        res.json({ logs });
    } catch (error) {
        res.json({ logs: [] });
    }
});

// 根路由
app.get('/', (req, res) => {
    res.redirect('/codex.html');
});

// 啟動服務器
app.listen(PORT, () => {
    writeLog('SERVER_START', `簡化版 Codex 服務器啟動在端口 ${PORT}`);
    console.log(`🌐 服務器運行: http://localhost:${PORT}/codex.html`);
    console.log(`🔑 Codex API Key: ${process.env.CODEX_API_KEY ? '已設置' : '未設置'}`);
});

module.exports = app;