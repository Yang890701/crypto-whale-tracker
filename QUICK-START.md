# ⚡ 快速開始指南

## 🎯 你需要做的 3 步驟

### 步驟 1: 創建 GitHub 倉庫
1. 去 https://github.com
2. 點擊 "New repository"
3. 名稱: `crypto-whale-tracker`
4. 設為 Public
5. 創建倉庫

### 步驟 2: 上傳代碼
複製 GitHub 給你的命令，類似：
```bash
git remote add origin https://github.com/你的用戶名/crypto-whale-tracker.git
git branch -M main
git push -u origin main
```

### 步驟 3: Railway 部署
1. 去 https://railway.app
2. "Deploy from GitHub repo"
3. 選擇你的倉庫
4. 添加環境變數：
   - `CODEX_API_KEY` = `d670ad73768bc1f863147fb990a1432baf604591`
   - `TELEGRAM_BOT_TOKEN` = `8321120640:AAGb0qGC02HVZsWVZLT_rce8OYZhcKNw-Co`
   - `TELEGRAM_CHAT_ID` = `5293068945`
5. 部署完成

## ✅ 完成後測試
- Web: `https://你的應用.railway.app/codex.html`
- Telegram: `/traders ETH 1000`

## 📧 需要幫助？
如果需要項目文件，可以：
1. 從這個文件夾複製所有文件
2. 或使用生成的 `crypto-whale-tracker.tar.gz` 壓縮包

所有配置都已準備好，只需要上傳到 GitHub 即可！