# 🚀 立即部署指南

## 方案一：Railway (最簡單)

### 1. 推送到 GitHub
```bash
git init
git add .
git commit -m "Codex API crypto tracker"
git remote add origin https://github.com/你的用戶名/crypto-whale-tracker.git
git push -u origin main
```

### 2. 部署到 Railway
1. 訪問 [railway.app](https://railway.app)
2. 點擊 "Deploy from GitHub repo"
3. 選擇你的倉庫
4. 設置環境變數：
   - `CODEX_API_KEY` = `d670ad73768bc1f863147fb990a1432baf604591`
   - `TELEGRAM_BOT_TOKEN` = `8321120640:AAGb0qGC02HVZsWVZLT_rce8OYZhcKNw-Co`
   - `TELEGRAM_CHAT_ID` = `5293068945`
5. 自動部署完成

### 3. 訪問系統
- Web 界面: `https://你的應用名.railway.app/codex.html`
- Telegram 機器人會自動運行

## 方案二：Heroku

### 1. 安裝 Heroku CLI
下載：https://devcenter.heroku.com/articles/heroku-cli

### 2. 部署
```bash
heroku login
heroku create crypto-whale-tracker
heroku config:set CODEX_API_KEY=d670ad73768bc1f863147fb990a1432baf604591
heroku config:set TELEGRAM_BOT_TOKEN=8321120640:AAGb0qGC02HVZsWVZLT_rce8OYZhcKNw-Co
heroku config:set TELEGRAM_CHAT_ID=5293068945
git push heroku main
```

## 方案三：本地網絡測試

### 1. 檢查網絡
```bash
# 測試基本連接
ping api.codex.io

# 測試 HTTPS
curl -I https://api.codex.io/graphql
```

### 2. 如果可以連接
```bash
npm run codex
# 訪問 http://localhost:3000/codex.html
```

## 方案四：VPS 服務器

### 便宜的 VPS 選項
- DigitalOcean: $5/月
- Vultr: $2.50/月  
- Linode: $5/月

### 部署步驟
```bash
# 連接 VPS
ssh root@你的服務器IP

# 安裝 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git

# 克隆代碼
git clone https://github.com/你的用戶名/crypto-whale-tracker.git
cd crypto-whale-tracker

# 安裝依賴
npm install

# 設置環境變數
echo "CODEX_API_KEY=d670ad73768bc1f863147fb990a1432baf604591" > .env
echo "TELEGRAM_BOT_TOKEN=8321120640:AAGb0qGC02HVZsWVZLT_rce8OYZhcKNw-Co" >> .env
echo "TELEGRAM_CHAT_ID=5293068945" >> .env

# 安裝 PM2
npm install -g pm2

# 啟動服務
pm2 start codex-web-server.js --name crypto-tracker
pm2 startup
pm2 save
```

## 🎯 推薦順序

1. **Railway** - 最簡單，免費額度
2. **本地測試** - 如果網絡允許
3. **VPS** - 完全控制
4. **Heroku** - 備選方案

選擇任一方案後，系統就能獲取真實的 Codex API 數據了！