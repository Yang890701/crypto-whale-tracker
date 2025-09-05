const express = require('express');
const path = require('path');
const EnhancedTracker = require('./enhanced-tracker');
const fs = require('fs');

const app = express();
const tracker = new EnhancedTracker();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(express.json());
app.use(express.static('public'));

// LOG 記錄
const logFile = path.join(__dirname, 'api-logs.txt');

function writeLog(type, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type}: ${message}${data ? ' | Data: ' + JSON.stringify(data) : ''}\n`;
    
    console.log(logEntry.trim());
    fs.appendFileSync(logFile, logEntry);
}

// API 路由
app.get('/api/search', async (req, res) => {
    const { token, minAmount } = req.query;
    
    writeLog('API_REQUEST', `搜尋請求 - Token: ${token}, MinAmount: ${minAmount}`);
    
    try {
        writeLog('API_CALL', `開始調用 defined.fi API`, { token, minAmount });
        
        const result = await tracker.getTradersByToken(token, parseInt(minAmount) || 1000);
        
        if (result.success) {
            writeLog('API_SUCCESS', `成功獲取 ${result.traders.length} 筆交易記錄`);
            res.json({
                success: true,
                data: result,
                source: 'defined.fi',
                timestamp: new Date().toISOString()
            });
        } else {
            writeLog('API_ERROR', `搜尋失敗: ${result.message}`);
            res.json({
                success: false,
                message: result.message,
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

// 獲取 LOG 記錄
app.get('/api/logs', (req, res) => {
    try {
        const logs = fs.readFileSync(logFile, 'utf8').split('\n').filter(line => line.trim()).slice(-50);
        res.json({ logs });
    } catch (error) {
        res.json({ logs: [] });
    }
});

// 驗證 API 連接
app.get('/api/verify', async (req, res) => {
    try {
        writeLog('VERIFY_REQUEST', '開始驗證 defined.fi 連接');
        
        // 簡單的連接測試
        const testResult = await tracker.verifyDataAccuracy();
        
        writeLog('VERIFY_SUCCESS', '驗證完成', testResult);
        
        res.json({
            success: true,
            verification: testResult,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        writeLog('VERIFY_ERROR', `驗證失敗: ${error.message}`);
        res.status(500).json({
            success: false,
            message: '驗證失敗',
            error: error.message
        });
    }
});

// 啟動服務器
app.listen(PORT, () => {
    writeLog('SERVER_START', `Web 服務器啟動在端口 ${PORT}`);
    console.log(`🌐 Web 界面: http://localhost:${PORT}`);
});

module.exports = app;