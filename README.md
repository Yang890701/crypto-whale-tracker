# 🔍 Codex API 加密貨幣交易者追蹤系統

使用 Codex GraphQL API 獲取真實的 defined.fi 交易數據。

## 🚀 快速開始

```bash
npm install
npm start
```

訪問: http://localhost:3000/codex.html

## 📋 環境變數

在 `.env` 文件中設置：
```env
CODEX_API_KEY=your_codex_api_key
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

## 🎯 功能

- **Web 界面**: 查詢交易者信息
- **Telegram 機器人**: `/traders ETH 1000`
- **真實數據**: 來自 Codex GraphQL API
- **LOG 記錄**: 驗證數據真實性

## 📊 使用範例

### Web 界面
1. 輸入代幣: `ETH` 或 `0x...`
2. 設定金額: `1000`
3. 選擇網絡: `Ethereum`
4. 查看交易者錢包地址和交易詳情

### Telegram 機器人
```
/traders ETH 1000
/traders BTC 5000
```

## 🔧 部署

### Railway
1. 推送到 GitHub
2. 在 Railway 連接倉庫
3. 設置環境變數
4. 自動部署

### Heroku
```bash
heroku create crypto-tracker
heroku config:set CODEX_API_KEY=your_key
git push heroku main
```

## 📡 數據來源

- **Codex GraphQL API**: defined.fi 的官方數據源
- **真實交易事件**: 不是模擬數據
- **完整 LOG 記錄**: 可驗證所有 API 調用