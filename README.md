# Defined.fi 即時數據抓取機器人

專門抓取 https://www.defined.fi/tokens/discover 網站即時數據的 Telegram 機器人。

## 🚀 快速開始

1. 安裝依賴: `npm install`
2. 配置 `.env` 文件
3. 啟動機器人: `npm run defined`

## 📱 主要功能

- 🔍 即時抓取 defined.fi 代幣數據
- 📊 熱門代幣排行榜
- 📈 漲幅榜和交易量排行
- 🔎 代幣搜尋功能
- 🔧 自定義篩選條件
- 👥 **真實交易者追蹤** - 根據代幣地址/名稱獲取交易者錢包地址和交易詳情

## 💬 Telegram 命令

### 基本查詢
- `/query` - 獲取即時數據
- `/top 5` - 熱門代幣 TOP 5
- `/gainers` - 漲幅榜
- `/search BTC` - 搜尋代幣
- `/filter price>0.01 change>5` - 自定義篩選

### 🔥 交易者追蹤
- `/traders 0x地址 金額` - 根據代幣地址查詢交易者
- `/traders 代幣名稱 金額` - 根據代幣名稱查詢交易者
- `/usd 金額` - 根據 USD 金額篩選代幣

### 🚀 實時監控 (新功能)
- `/monitor 金額` - 開始實時監控，符合條件即時通知
- `/stop` - 停止監控
- `/verify` - 驗證數據真實性

**範例:**
```
/traders 0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b 1000
/usd 1000
/monitor 1000  # 實時監控 USD ≥ $1000
/stop          # 停止監控
/verify        # 驗證數據真實性
```

### ✨ 特色功能
- 🕰️ **準確時間**: 所有結果顯示 24 小時制時間 (yy:MM:dd:HH:mm:ss)
- 🚀 **實時通知**: 符合條件的交易立即通知，直到手動停止
- ☁️ **雲端運行**: 部署到雲端服務器，24/7 持續監控
- 💾 **狀態持久化**: 電腦關機重啟後自動恢復監控任務
- 🔍 **數據驗證**: 可驗證所抓取的數據是否為 defined.fi 真實數據

## ☁️ 雲端部署

### 快速部署到 Railway
1. 推送代碼到 GitHub
2. 在 [railway.app](https://railway.app) 連接倉庫
3. 設置環境變數 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_CHAT_ID`
4. 自動部署完成

### 本地測試
```bash
npm start          # 啟動雲端版本
npm run local      # 啟動本地版本
```

詳細部署指南請查看 [deploy-guide.md](deploy-guide.md)

詳細說明請查看 [DEFINED-README.md](DEFINED-README.md)