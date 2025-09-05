# 項目結構說明

## 📁 核心文件

```
crypto-whale-tracker/
├── .env                      # 環境變數配置
├── .gitignore               # Git 忽略文件
├── package.json             # 項目依賴和腳本
├── README.md                # 項目簡介
├── DEFINED-README.md        # 詳細使用說明
└── PROJECT-STRUCTURE.md     # 本文件

## 🔧 功能模組
├── defined-scraper.js       # 核心數據抓取引擎
├── defined-telegram-bot.js  # Telegram 機器人主程序
├── defined-api.js          # API 調用工具類
├── start-defined-bot.js    # 機器人啟動腳本
└── test-defined-scraper.js # 測試腳本
```

## 🚀 使用方式

### 啟動機器人
```bash
npm start
# 或
npm run defined
```

### 測試功能
```bash
npm test
```

## 📋 文件說明

- **defined-scraper.js** - 主要的數據抓取邏輯，支持多種抓取策略
- **defined-telegram-bot.js** - Telegram 機器人界面，處理用戶命令
- **defined-api.js** - 舊版 API 工具，保留作為參考
- **start-defined-bot.js** - 啟動腳本，包含環境檢查
- **test-defined-scraper.js** - 測試腳本，驗證抓取功能

## 🔄 工作流程

1. 用戶發送 Telegram 命令
2. 機器人解析命令和參數
3. 調用數據抓取引擎
4. 格式化並返回結果

## 📦 依賴說明

- **axios** - HTTP 請求
- **puppeteer** - 網頁抓取
- **node-telegram-bot-api** - Telegram 機器人
- **dotenv** - 環境變數管理