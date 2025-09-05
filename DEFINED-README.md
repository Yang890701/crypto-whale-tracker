# Defined.fi 即時數據抓取機器人

專門抓取 https://www.defined.fi/tokens/discover 網站即時數據的 Telegram 機器人。

## 🚀 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 配置環境變數
確保 `.env` 文件包含：
```env
TELEGRAM_BOT_TOKEN=你的機器人Token
TELEGRAM_CHAT_ID=你的聊天ID
```

### 3. 啟動機器人
```bash
npm run defined
```

### 4. 測試數據抓取
```bash
npm run test-defined
```

## 📱 Telegram 命令

### 基本查詢
- `/start` - 開始使用並查看所有命令
- `/query` - 獲取前10個代幣的即時數據
- `/status` - 查看機器人狀態

### 排行榜查詢
- `/top` - 熱門代幣 TOP 10 (按交易量)
- `/top 5` - 熱門代幣 TOP 5
- `/gainers` - 漲幅榜 TOP 10
- `/gainers 5` - 漲幅榜 TOP 5
- `/volume` - 交易量排行 TOP 10
- `/volume 5` - 交易量排行 TOP 5

### 搜尋功能
- `/search BTC` - 搜尋 BTC 相關代幣
- `/search ETH USDT` - 搜尋多個代幣
- `/search Uniswap` - 按名稱搜尋

### 自定義篩選
- `/filter price>0.01` - 價格大於 0.01 的代幣
- `/filter volume>100000` - 交易量大於 10萬的代幣
- `/filter change>5` - 漲幅大於 5% 的代幣
- `/filter price>0.01 volume>100000 change>5` - 組合條件

## 🔧 篩選條件語法

### 支持的字段
- `price` - 代幣價格
- `volume` - 24小時交易量
- `change` - 24小時漲跌幅
- `marketcap` 或 `cap` - 市值

### 支持的操作符
- `>` - 大於
- `<` - 小於
- `>=` - 大於等於
- `<=` - 小於等於

### 範例
```
/filter price>0.001 volume>50000 change>3
/filter cap>1000000 change<-5
/filter price>0.01 price<1 volume>100000
```

## 📊 返回數據格式

每個代幣包含以下信息：
- **符號和名稱** - 如 BTC (Bitcoin)
- **當前價格** - 美元計價
- **24小時漲跌幅** - 百分比
- **24小時交易量** - 美元計價
- **市值** - 美元計價
- **持有者數量** - 如果可用
- **合約地址** - 區塊鏈地址
- **網絡** - 如 Ethereum, BSC 等

## 🛠️ 技術特性

### 多重數據獲取策略
1. **直接 API 調用** - 嘗試 defined.fi 的 GraphQL API
2. **網絡請求攔截** - 使用 Puppeteer 攔截網頁 API 請求
3. **頁面數據抓取** - 直接解析網頁 DOM 元素

### 智能錯誤處理
- 自動重試機制
- 多種數據源備援
- 詳細錯誤日誌

### 高效數據處理
- 數據緩存機制
- 智能篩選算法
- 格式化輸出

## 🔍 使用範例

### 查找高潛力代幣
```
/filter price<0.01 volume>500000 change>10
```
尋找價格低於 0.01、交易量大於 50萬、漲幅超過 10% 的代幣

### 查找穩定大盤股
```
/filter cap>100000000 volume>1000000 change>-5 change<5
```
尋找市值超過 1億、交易量超過 100萬、漲跌幅在 ±5% 內的代幣

### 搜尋特定項目
```
/search Uniswap Sushiswap Pancake
```
搜尋 DEX 相關代幣

## 📈 數據更新頻率

- **即時查詢** - 每次命令都獲取最新數據
- **數據來源** - defined.fi 官方網站
- **更新延遲** - 通常 < 30秒

## ⚠️ 注意事項

1. **數據僅供參考** - 不構成投資建議
2. **網絡依賴** - 需要穩定的網絡連接
3. **頻率限制** - 避免過於頻繁的查詢
4. **數據準確性** - 以 defined.fi 官網為準

## 🐛 故障排除

### 常見問題
1. **查詢失敗** - 檢查網絡連接
2. **無數據返回** - 嘗試調整篩選條件
3. **機器人無響應** - 檢查 Token 和 Chat ID

### 調試命令
```bash
# 測試數據抓取
npm run test-defined

# 檢查環境配置
node -e "console.log(process.env.TELEGRAM_BOT_TOKEN ? '✅' : '❌', 'Bot Token')"
```

## 📞 支持

如有問題或建議，請檢查：
1. 環境變數配置
2. 網絡連接狀態
3. defined.fi 網站可訪問性