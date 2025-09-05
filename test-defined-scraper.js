const DefinedScraper = require('./defined-scraper');

async function testDefinedScraper() {
    const scraper = new DefinedScraper();
    
    console.log('🚀 開始測試 defined.fi 數據抓取...\n');
    
    try {
        // 基本抓取
        console.log('1️⃣ 基本數據抓取...');
        const allTokens = await scraper.getTokenDiscoveryData();
        console.log(`✅ 獲得 ${allTokens.length} 個代幣數據\n`);
        
        if (allTokens.length > 0) {
            // 顯示前 5 個代幣
            console.log('📊 前 5 個代幣:');
            const formatted = scraper.formatTokenData(allTokens.slice(0, 5));
            formatted.forEach((token, i) => {
                console.log(`${i+1}. ${token.symbol} (${token.name})`);
                console.log(`   💰 價格: ${token.price}`);
                console.log(`   📈 24h變化: ${token.priceChange24h}`);
                console.log(`   💵 24h交易量: ${token.volume24h}`);
                console.log(`   🏷️ 市值: ${token.marketCap}`);
                console.log(`   🔗 地址: ${token.address}`);
                console.log(`   📡 來源: ${token.source}\n`);
            });
        }
        
        // 篩選測試
        console.log('2️⃣ 篩選測試 - 尋找高漲幅代幣...');
        const highGainers = scraper.filterTokens(allTokens, {
            minPriceChange: 5,  // 漲幅 > 5%
            minVolume: 10000    // 交易量 > 10k
        });
        
        console.log(`🔥 找到 ${highGainers.length} 個高漲幅代幣`);
        if (highGainers.length > 0) {
            const topGainers = scraper.formatTokenData(highGainers.slice(0, 3));
            topGainers.forEach((token, i) => {
                console.log(`${i+1}. ${token.symbol} - ${token.priceChange24h} (${token.volume24h})`);
            });
        }
        
        console.log('\n3️⃣ 篩選測試 - 尋找大交易量代幣...');
        const highVolume = scraper.filterTokens(allTokens, {
            minVolume: 1000000  // 交易量 > 1M
        });
        
        console.log(`💰 找到 ${highVolume.length} 個大交易量代幣`);
        if (highVolume.length > 0) {
            const topVolume = scraper.formatTokenData(highVolume.slice(0, 3));
            topVolume.forEach((token, i) => {
                console.log(`${i+1}. ${token.symbol} - ${token.volume24h}`);
            });
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    }
}

// 互動式查詢函數
async function queryTokens(criteria) {
    const scraper = new DefinedScraper();
    
    console.log('🔍 查詢條件:', JSON.stringify(criteria, null, 2));
    
    try {
        const tokens = await scraper.getTokenDiscoveryData();
        const filtered = scraper.filterTokens(tokens, criteria);
        const formatted = scraper.formatTokenData(filtered);
        
        console.log(`\n📊 找到 ${filtered.length} 個符合條件的代幣:\n`);
        
        formatted.forEach((token, i) => {
            console.log(`${i+1}. ${token.symbol} (${token.name})`);
            console.log(`   💰 ${token.price} | 📈 ${token.priceChange24h} | 💵 ${token.volume24h}`);
            console.log(`   🏷️ ${token.marketCap} | 👥 ${token.holders} 持有者`);
            console.log(`   🔗 ${token.address}\n`);
        });
        
        return formatted;
        
    } catch (error) {
        console.error('❌ 查詢失敗:', error.message);
        return [];
    }
}

// 如果直接運行此文件
if (require.main === module) {
    // 檢查命令行參數
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        // 解析查詢參數
        const criteria = {};
        
        args.forEach(arg => {
            if (arg.startsWith('--min-price=')) {
                criteria.minPrice = parseFloat(arg.split('=')[1]);
            } else if (arg.startsWith('--max-price=')) {
                criteria.maxPrice = parseFloat(arg.split('=')[1]);
            } else if (arg.startsWith('--min-volume=')) {
                criteria.minVolume = parseFloat(arg.split('=')[1]);
            } else if (arg.startsWith('--min-change=')) {
                criteria.minPriceChange = parseFloat(arg.split('=')[1]);
            } else if (arg.startsWith('--max-change=')) {
                criteria.maxPriceChange = parseFloat(arg.split('=')[1]);
            } else if (arg.startsWith('--symbols=')) {
                criteria.symbols = arg.split('=')[1].split(',');
            }
        });
        
        queryTokens(criteria);
    } else {
        testDefinedScraper();
    }
}

module.exports = { queryTokens };