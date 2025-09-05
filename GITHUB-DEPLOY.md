# 📧 GitHub 部署指南

## 🚀 快速 GitHub 部署步驟

### 1. 創建 GitHub 倉庫
1. 訪問 https://github.com
2. 點擊右上角 "+" → "New repository"
3. 倉庫名稱: `crypto-whale-tracker`
4. 設為 Public
5. 點擊 "Create repository"

### 2. 推送代碼
在你的項目文件夾中執行：
```bash
git remote add origin https://github.com/你的GitHub用戶名/crypto-whale-tracker.git
git branch -M main
git push -u origin main
```

### 3. Railway 部署
1. 訪問 https://railway.app
2. 點擊 "Start a New Project"
3. 選擇 "Deploy from GitHub repo"
4. 選擇你的 `crypto-whale-tracker` 倉庫
5. 設置環境變數：
   ```
   CODEX_API_KEY=d670ad73768bc1f863147fb990a1432baf604591
   TELEGRAM_BOT_TOKEN=8321120640:AAGb0qGC02HVZsWVZLT_rce8OYZhcKNw-Co
   TELEGRAM_CHAT_ID=5293068945
   ```
6. 點擊 "Deploy"

### 4. 測試部署
部署完成後：
- 訪問: `https://你的應用名.railway.app/codex.html`
- 測試查詢: ETH, 1000
- Telegram 機器人: `/traders ETH 1000`

## 📁 項目文件清單
- codex-client.js (Codex API 客戶端)
- codex-web-server.js (Web 服務器)
- cloud-monitor.js (雲端監控)
- defined-telegram-bot.js (Telegram 機器人)
- public/codex.html (Web 界面)
- package.json (依賴配置)
- .env (環境變數 - 不會上傳到 GitHub)
- Procfile (Railway 部署配置)

## ⚠️ 重要提醒
.env 文件不會上傳到 GitHub (在 .gitignore 中)，所以需要在 Railway 手動設置環境變數。

## 🔧 如果遇到問題
1. 確認 GitHub 倉庫是 Public
2. 確認環境變數設置正確
3. 查看 Railway 部署日誌
4. 測試 Codex API 連接