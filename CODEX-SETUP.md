# 🔑 Codex API 設置指南

## 📋 必要步驟

### 1. 申請 Codex API Key
1. 訪問 [Codex Dashboard](https://api.codex.io)
2. 註冊帳號並登入
3. 創建新的 API Key
4. 複製 API Key

### 2. 設置環境變數
在 `.env` 文件中添加：
```env
CODEX_API_KEY=your_actual_codex_api_key_here
```

### 3. 啟動系統
```bash
# 安裝依賴
npm install

# 啟動 Codex API 服務器
npm run codex

# 訪問界面
http://localhost:3000/codex.html
```

## 🧪 測試步驟

### 1. 測試 API 連接
```bash
# 在界面中點擊「測試 Codex」按鈕
# 或直接訪問
curl http://localhost:3000/api/test-codex
```

### 2. 查詢交易者
- 輸入代幣: `ETH` 或 `0x...`
- 設定金額: `1000`
- 選擇網絡: `Ethereum (1)`
- 時間範圍: `24 小時`

## 📊 功能說明

### GraphQL 查詢流程
1. **filterTokens** - 搜尋代幣
2. **getTokenEvents** - 獲取交易事件
3. **聚合分析** - 按錢包地址彙總

### 返回數據
- 錢包地址
- 交易次數
- 總交易額 (USD)
- 平均成交價
- 交易時間區間

## 🔍 真實數據驗證

### LOG 記錄包含
- Codex API 調用記錄
- GraphQL 查詢語句
- 返回的原始數據
- 處理結果統計

### 驗證方式
1. 查看 `codex-logs.txt` 文件
2. 點擊「查看 LOG」按鈕
3. 對比 Codex Dashboard 的查詢記錄

## ⚠️ 注意事項

1. **API Key 必須有效** - 無效 Key 會返回 401 錯誤
2. **網絡 ID 要正確** - Ethereum=1, BSC=56, Polygon=137
3. **時間格式為 Unix 時間戳** - 系統自動轉換
4. **分頁處理** - 大量數據會自動分頁獲取

## 🚨 常見錯誤

### API Key 錯誤
```
❌ Codex API Key 無效或已過期
```
**解決**: 檢查 `.env` 文件中的 `CODEX_API_KEY`

### 代幣未找到
```
❌ 未找到代幣
```
**解決**: 
- 檢查代幣名稱拼寫
- 嘗試使用合約地址
- 確認網絡選擇正確

### 無交易數據
```
✅ 成功找到 0 個交易者
```
**原因**: 
- 時間範圍內無大額交易
- 最小金額設置過高
- 代幣流動性不足

## 💡 最佳實踐

1. **從主流代幣開始測試** (ETH, BTC, USDT)
2. **設置合理的金額門檻** (1000-10000 USD)
3. **選擇適當的時間範圍** (24小時為佳)
4. **定期檢查 LOG 記錄** 確保數據真實性

這樣就能獲取到真實的 defined.fi 交易數據，而不是模擬數據！