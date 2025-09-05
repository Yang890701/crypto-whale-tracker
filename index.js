require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send(`
        <h1>🚀 Codex API 服務器</h1>
        <p>✅ 運行正常</p>
        <p>🔑 API Key: ${process.env.CODEX_API_KEY ? '已設置' : '未設置'}</p>
        <a href="/test">測試 Codex API</a>
    `);
});

app.get('/test', async (req, res) => {
    try {
        const response = await axios.post('https://api.codex.io/graphql', {
            query: 'query { filterTokens(phrase: "ETH", filters: { networkIds: [1] }, limit: 1) { nodes { address name symbol } } }'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CODEX_API_KEY
            }
        });

        res.json({
            success: true,
            data: response.data.data
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;