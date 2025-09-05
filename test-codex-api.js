require('dotenv').config();
const CodexClient = require('./codex-client');

async function testCodexAPI() {
    console.log('🧪 測試 Codex API 連接\n');
    
    const apiKey = process.env.CODEX_API_KEY;
    console.log(`🔑 API Key: ${apiKey ? apiKey.substring(0, 8) + '...' : '未設置'}`);
    
    if (!apiKey) {
        console.log('❌ 請在 .env 文件中設置 CODEX_API_KEY');
        return;
    }
    
    const client = new CodexClient(apiKey);
    
    try {
        console.log('1️⃣ 測試代幣搜尋...');
        const token = await client.findToken('ETH', 1);
        console.log('✅ 代幣搜尋成功:');
        console.log(`   符號: ${token.symbol}`);
        console.log(`   名稱: ${token.name}`);
        console.log(`   地址: ${token.address}`);
        console.log(`   網絡: ${token.networkId}\n`);
        
        console.log('2️⃣ 測試交易者查詢...');
        const result = await client.queryTraders('ETH', 1000, 1, 24);
        
        if (result.success) {
            console.log('✅ 交易者查詢成功:');
            console.log(`   代幣: ${result.token.symbol}`);
            console.log(`   交易事件: ${result.totalEvents} 個`);
            console.log(`   交易者: ${result.traders.length} 個`);
            
            if (result.traders.length > 0) {
                console.log('\n📊 前3個交易者:');
                result.traders.slice(0, 3).forEach((trader, i) => {
                    console.log(`${i + 1}. ${trader.wallet.substring(0, 8)}...`);
                    console.log(`   交易額: $${trader.totalUsd.toLocaleString()}`);
                    console.log(`   次數: ${trader.orders}`);
                });
            }
        } else {
            console.log('❌ 交易者查詢失敗:', result.error);
        }
        
    } catch (error) {
        console.log('❌ 測試失敗:', error.message);
    }
}

testCodexAPI();