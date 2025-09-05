# 雲端部署指南 - 24/7 持續監控

## 🚀 部署選項

### 1. Railway (推薦)
```bash
# 1. 推送到 GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用戶名/crypto-whale-tracker.git
git push -u origin main

# 2. 在 Railway 部署
# - 訪問 railway.app
# - 連接 GitHub 倉庫
# - 設置環境變數
# - 自動部署
```

### 2. Heroku
```bash
# 1. 安裝 Heroku CLI
# 2. 登入並創建應用
heroku login
heroku create crypto-whale-tracker

# 3. 設置環境變數
heroku config:set TELEGRAM_BOT_TOKEN=你的機器人Token
heroku config:set TELEGRAM_CHAT_ID=你的聊天ID

# 4. 部署
git push heroku main
```

### 3. VPS (Ubuntu/CentOS)
```bash
# 1. 連接到 VPS
ssh root@你的服務器IP

# 2. 安裝 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 安裝 PM2
npm install -g pm2

# 4. 上傳代碼並啟動
git clone https://github.com/你的用戶名/crypto-whale-tracker.git
cd crypto-whale-tracker
npm install
pm2 start cloud-monitor.js --name "crypto-monitor"
pm2 startup
pm2 save
```

## 📁 必要文件

### package.json (更新)
```json
{
  "name": "crypto-whale-tracker",
  "version": "2.0.0",
  "description": "24/7 Cloud Crypto Whale Tracker",
  "main": "cloud-monitor.js",
  "scripts": {
    "start": "node cloud-monitor.js",
    "cloud": "node cloud-monitor.js",
    "dev": "nodemon cloud-monitor.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.3.1",
    "node-telegram-bot-api": "^0.64.0",
    "puppeteer": "^21.11.0"
  }
}
```

### Procfile (Heroku)
```
web: node cloud-monitor.js
```

### .env (環境變數)
```env
TELEGRAM_BOT_TOKEN=你的機器人Token
TELEGRAM_CHAT_ID=你的聊天ID
NODE_ENV=production
```

## 🔧 雲端功能特色

### ✅ 持久化狀態
- 監控任務保存到 `monitor-state.json`
- 服務重啟自動恢復監控
- 電腦關機不影響運行

### ✅ 自動恢復
- 服務崩潰自動重啟
- 網絡斷線自動重連
- 狀態數據自動備份

### ✅ 24/7 運行
- 雲端服務器持續運行
- 無需本地電腦開機
- 全天候監控和通知

## 📱 使用方式

```bash
# 開始監控 (雲端運行)
/monitor 1000

# 查看狀態
/status

# 停止監控
/stop

# 查詢交易者
/traders 0x地址 1000
```

## 🛠️ 故障排除

### 常見問題
1. **部署失敗** - 檢查環境變數設置
2. **機器人無響應** - 驗證 Token 和 Chat ID
3. **監控停止** - 查看服務器日誌

### 日誌查看
```bash
# Railway: 在控制台查看日誌
# Heroku: heroku logs --tail
# VPS: pm2 logs crypto-monitor
```

## 💰 成本估算

- **Railway**: 免費額度 + $5/月
- **Heroku**: 免費額度 + $7/月  
- **VPS**: $5-20/月 (依配置)

## 🔒 安全建議

1. 使用環境變數存儲敏感信息
2. 定期更新依賴包
3. 設置防火牆規則
4. 監控服務器資源使用

部署完成後，你的監控系統將 24/7 運行在雲端，即使本地電腦關機也會持續工作！