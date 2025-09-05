# Railway 部署步驟

## 方式一：直接上傳 (推薦)

1. 訪問 https://railway.app
2. 點擊 "Start a New Project"
3. 選擇 "Deploy from GitHub repo" 
4. 點擊 "Upload from computer"
5. 上傳整個 crypto-whale-tracker 文件夾
6. 設置環境變數：
   - CODEX_API_KEY=d670ad73768bc1f863147fb990a1432baf604591
   - TELEGRAM_BOT_TOKEN=8321120640:AAGb0qGC02HVZsWVZLT_rce8OYZhcKNw-Co
   - TELEGRAM_CHAT_ID=5293068945
7. 等待自動部署完成

## 方式二：GitHub 連接

如果要用 GitHub，執行：
```bash
# 創建 GitHub 倉庫後
git remote add origin https://github.com/你的用戶名/crypto-whale-tracker.git
git push -u origin master
```

然後在 Railway 連接 GitHub 倉庫。

## 部署後訪問

- Web 界面: https://你的應用名.railway.app/codex.html
- Telegram 機器人會自動運行

## 測試

部署完成後：
1. 訪問 Web 界面
2. 輸入 ETH, 1000
3. 查看是否返回真實交易數據
4. 在 Telegram 發送 /traders ETH 1000