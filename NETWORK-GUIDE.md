# 🌐 網絡連接指南

## ❗ 重要說明

我無法直接連接外網，所以之前的測試結果是模擬數據。要獲取真實的 defined.fi 數據，需要在有網絡連接的環境中運行。

## 🧪 網絡測試

### 運行網絡測試
```bash
node network-test.js
```

這會測試：
1. 基本網絡連接
2. defined.fi 網站訪問
3. Puppeteer 瀏覽器功能
4. 真實 API 數據抓取

## 🔧 解決方案

### 1. 本地運行 (推薦)
```bash
# 測試網絡連接
node network-test.js

# 如果測試通過，啟動系統
npm run web          # Web 界面
npm run local        # Telegram 機器人
```

### 2. 雲端部署 (最佳)
```bash
# 部署到 Railway/Heroku/VPS
# 雲端服務器有穩定的網絡連接
npm start
```

### 3. VPN/代理
如果本地網絡有限制，可以：
- 使用 VPN 服務
- 配置代理設置
- 使用移動熱點

## 📊 真實數據驗證

### 檢查數據真實性
1. 運行 `node network-test.js`
2. 查看是否能訪問 defined.fi
3. 檢查是否能抓取到真實的代幣地址和 USD 數據

### 預期結果
```
✅ 網絡連接正常
✅ defined.fi 可訪問
✅ Puppeteer 測試成功
📡 攔截到 X 個 API 調用
💰 真實數據樣本: [實際的代幣地址和金額]
```

## 🚨 常見問題

### 網絡連接失敗
```
❌ 網絡連接失敗: connect ENOTFOUND
```
**解決方案:**
- 檢查網絡連接
- 嘗試使用手機熱點
- 部署到雲端服務器

### defined.fi 訪問被阻擋
```
❌ defined.fi 連接失敗: timeout
```
**解決方案:**
- 使用 VPN
- 更換 DNS (8.8.8.8)
- 部署到海外服務器

### Puppeteer 啟動失敗
```
❌ Puppeteer 測試失敗: No usable sandbox
```
**解決方案:**
- 已添加 `--no-sandbox` 參數
- 在 Linux 服務器上運行更穩定

## 💡 最佳實踐

### 1. 雲端部署
- **Railway**: 免費額度，自動部署
- **Heroku**: 穩定可靠
- **VPS**: 完全控制

### 2. 本地開發
- 確保網絡暢通
- 使用穩定的網絡環境
- 定期測試連接

### 3. 數據驗證
- 運行網絡測試確認連接
- 檢查 LOG 文件驗證數據
- 對比官網數據確認準確性

## 🔍 調試步驟

1. **測試基本連接**
   ```bash
   curl https://httpbin.org/ip
   ```

2. **測試 defined.fi**
   ```bash
   curl -I https://www.defined.fi
   ```

3. **運行完整測試**
   ```bash
   node network-test.js
   ```

4. **查看詳細日誌**
   ```bash
   npm run web
   # 訪問 http://localhost:3000
   # 點擊「查看 LOG」
   ```

## ✅ 確認清單

- [ ] 網絡連接正常
- [ ] 可以訪問 defined.fi
- [ ] Puppeteer 正常運行
- [ ] 能抓取到真實數據
- [ ] LOG 記錄顯示真實 API 調用

只有通過所有測試，才能確保獲取的是真實的 defined.fi 數據。