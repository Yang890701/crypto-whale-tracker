const axios = require('axios');
const puppeteer = require('puppeteer');

async function testRealNetworkConnection() {
    console.log('🌐 測試真實網絡連接...\n');
    
    // 測試 1: 基本網絡連接
    console.log('1️⃣ 測試基本網絡連接');
    try {
        const response = await axios.get('https://httpbin.org/ip', { timeout: 5000 });
        console.log('✅ 網絡連接正常');
        console.log(`📍 IP: ${response.data.origin}`);
    } catch (error) {
        console.log('❌ 網絡連接失敗:', error.message);
        return false;
    }
    
    // 測試 2: defined.fi 網站連接
    console.log('\n2️⃣ 測試 defined.fi 連接');
    try {
        const response = await axios.get('https://www.defined.fi', { 
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        console.log('✅ defined.fi 可訪問');
        console.log(`📊 狀態碼: ${response.status}`);
        console.log(`📄 內容長度: ${response.data.length} 字符`);
    } catch (error) {
        console.log('❌ defined.fi 連接失敗:', error.message);
        return false;
    }
    
    // 測試 3: Puppeteer 瀏覽器測試
    console.log('\n3️⃣ 測試 Puppeteer 瀏覽器');
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.goto('https://www.defined.fi/tokens/discover', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        const title = await page.title();
        const tokenLinks = await page.$$eval('a[href*="0x"]', links => links.length);
        
        console.log('✅ Puppeteer 測試成功');
        console.log(`📄 頁面標題: ${title}`);
        console.log(`🔗 找到代幣鏈接: ${tokenLinks} 個`);
        
        return true;
        
    } catch (error) {
        console.log('❌ Puppeteer 測試失敗:', error.message);
        return false;
    } finally {
        if (browser) await browser.close();
    }
}

// 真實 API 測試
async function testRealDefinedAPI() {
    console.log('\n🔍 測試真實 defined.fi API...\n');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // 監聽網絡請求
        const apiCalls = [];
        page.on('response', async (response) => {
            const url = response.url();
            if (url.includes('api') || url.includes('graphql')) {
                apiCalls.push({
                    url: url,
                    status: response.status(),
                    headers: response.headers()
                });
            }
        });
        
        await page.goto('https://www.defined.fi/tokens/discover', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        await page.waitForTimeout(10000);
        
        console.log(`📡 攔截到 ${apiCalls.length} 個 API 調用:`);
        apiCalls.forEach((call, i) => {
            console.log(`${i + 1}. ${call.url} (${call.status})`);
        });
        
        // 嘗試提取真實數據
        const realData = await page.evaluate(() => {
            const links = document.querySelectorAll('a[href*="0x"]');
            const data = [];
            
            links.forEach(link => {
                const href = link.href;
                const text = link.textContent;
                const parent = link.parentElement;
                const parentText = parent ? parent.textContent : '';
                
                const addressMatch = href.match(/0x[a-fA-F0-9]{40}/);
                if (addressMatch) {
                    const usdMatches = parentText.match(/\$[\d,]+\.?\d*/g);
                    data.push({
                        address: addressMatch[0],
                        text: text.trim(),
                        usdValues: usdMatches || [],
                        url: href
                    });
                }
            });
            
            return data.slice(0, 5); // 只返回前5個
        });
        
        console.log('\n💰 真實數據樣本:');
        realData.forEach((item, i) => {
            console.log(`${i + 1}. 地址: ${item.address}`);
            console.log(`   文本: ${item.text}`);
            console.log(`   USD: ${item.usdValues.join(', ')}`);
            console.log(`   URL: ${item.url}\n`);
        });
        
        return realData.length > 0;
        
    } catch (error) {
        console.log('❌ 真實 API 測試失敗:', error.message);
        return false;
    } finally {
        if (browser) await browser.close();
    }
}

// 運行測試
async function runAllTests() {
    console.log('🧪 開始網絡連接測試\n');
    
    const networkOK = await testRealNetworkConnection();
    
    if (networkOK) {
        console.log('\n' + '='.repeat(60));
        await testRealDefinedAPI();
    }
    
    console.log('\n🎉 測試完成');
    
    if (!networkOK) {
        console.log('\n⚠️  網絡連接問題，可能的原因:');
        console.log('1. 防火牆阻擋');
        console.log('2. 代理設置問題');
        console.log('3. DNS 解析失敗');
        console.log('4. 網絡不穩定');
        console.log('\n💡 建議:');
        console.log('- 檢查網絡連接');
        console.log('- 嘗試使用 VPN');
        console.log('- 部署到雲端服務器');
    }
}

if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { testRealNetworkConnection, testRealDefinedAPI };