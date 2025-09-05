require('dotenv').config();
const express = require('express');
const path = require('path');
const CodexClient = require('./codex-client');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(express.json());
app.use(express.static('public'));

// Codex 客戶端
const codexClient = new CodexClient(process.env.CODEX_API_KEY);

// LOG 記錄
const logFile = path.join(__dirname, 'codex-logs.txt');

function writeLog(type, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type}: ${message}${data ? ' | Data: ' + JSON.stringify(data) : ''}\n`;
    
    console.log(logEntry.trim());
    fs.appendFileSync(logFile, logEntry);
}

// API 路由
app.get('/api/traders', async (req, res) => {
    const { token, minAmount, networkId, timeRange } = req.query;
    
    writeLog('API_REQUEST', `查詢交易者 - Token: ${token}, MinAmount: ${minAmount}, Network: ${networkId}`);
    
    if (!process.env.CODEX_API_KEY) {
        writeLog('API_ERROR', 'Codex API Key 未設置');
        return res.status(400).json({
            success: false,
            message: '請設置 CODEX_API_KEY 環境變數'
        });
    }

    try {
        writeLog('CODEX_CALL', `開始調用 Codex API`, { token, minAmount, networkId });
        
        const result = await codexClient.queryTraders(
            token,
            parseInt(minAmount) || 1000,
            parseInt(networkId) || 1,
            parseInt(timeRange) || 24
        );
        
        if (result.success) {
            writeLog('CODEX_SUCCESS', `成功獲取 ${result.traders.length} 個交易者，${result.totalEvents} 個事件`);
            res.json({
                success: true,
                data: result,
                source: 'Codex GraphQL API',
                timestamp: new Date().toISOString()
            });
        } else {
            writeLog('CODEX_ERROR', `查詢失敗: ${result.error}`);
            res.json({
                success: false,
                message: result.error,
                timestamp: new Date().toISOString()
            });
        }
        
    } catch (error) {
        writeLog('API_EXCEPTION', `系統錯誤: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '系統錯誤',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 測試 Codex 連接
app.get('/api/test-codex', async (req, res) => {
    try {
        writeLog('CODEX_TEST', '測試 Codex API 連接');
        
        if (!process.env.CODEX_API_KEY) {
            throw new Error('CODEX_API_KEY 未設置');
        }

        // 測試簡單查詢
        const testResult = await codexClient.findToken('ETH', 1);
        
        writeLog('CODEX_TEST_SUCCESS', '連接測試成功', testResult);
        
        res.json({
            success: true,
            message: 'Codex API 連接正常',
            testResult,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        writeLog('CODEX_TEST_ERROR', `連接測試失敗: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Codex API 連接失敗',
            error: error.message
        });
    }
});

// 獲取 LOG 記錄
app.get('/api/logs', (req, res) => {
    try {
        const logs = fs.readFileSync(logFile, 'utf8').split('\n').filter(line => line.trim()).slice(-50);
        res.json({ logs });
    } catch (error) {
        res.json({ logs: [] });
    }
});

// 啟動服務器
app.listen(PORT, () => {
    writeLog('SERVER_START', `Codex Web 服務器啟動在端口 ${PORT}`);
    console.log(`🌐 Codex Web 界面: http://localhost:${PORT}`);
    console.log(`🔑 Codex API Key: ${process.env.CODEX_API_KEY ? '已設置' : '未設置'}`);
});

module.exports = app;