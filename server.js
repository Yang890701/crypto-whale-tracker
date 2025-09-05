require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 測試 Codex API
app.get('/api/test', async (req, res) => {
    const apiKey = process.env.CODEX_API_KEY;
    
    if (!apiKey) {
        return res.json({
            success: false,
            message: '請設置 CODEX_API_KEY 環境變數'
        });
    }

    try {
        const response = await axios.post('https://api.codex.io/graphql', {
            query: `
                query {
                    filterTokens(
                        phrase: "ETH"
                        filters: { networkIds: [1] }
                        limit: 1
                    ) {
                        nodes {
                            address
                            name
                            symbol
                        }
                    }
                }
            `
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            }
        });

        res.json({
            success: true,
            message: 'Codex API 連接成功',
            data: response.data.data,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.json({
            success: false,
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 根路由
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Codex API 測試</title>
            <style>body{font-family:Arial;padding:20px;}</style>
        </head>
        <body>
            <h1>🔍 Codex API 測試</h1>
            <p>✅ 服務器運行正常</p>
            <p>🔑 API Key: ${process.env.CODEX_API_KEY ? '已設置' : '未設置'}</p>
            <p>🌐 URL: ${req.get('host')}</p>
            <a href="/api/test" style="background:#007bff;color:white;padding:10px;text-decoration:none;border-radius:5px;">測試 Codex API</a>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🌐 服務器運行在端口 ${PORT}`);
    console.log(`🔑 Codex API Key: ${process.env.CODEX_API_KEY ? '已設置' : '未設置'}`);
});

module.exports = app;