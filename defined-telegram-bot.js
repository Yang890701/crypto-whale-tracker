require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const DefinedScraper = require('./defined-scraper');
const EnhancedTracker = require('./enhanced-tracker');
const SimpleUSDTracker = require('./simple-usd-tracker');
const RealtimeMonitor = require('./realtime-monitor');

// 配置
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const CHAT_IDS = process.env.TELEGRAM_CHAT_ID.split(',').map(id => id.trim());
const scraper = new DefinedScraper();
const traderTracker = new EnhancedTracker();
const usdTracker = new SimpleUSDTracker();
const monitor = new RealtimeMonitor();
const activeMonitors = new Map(); // 存儲每個用戶的監控狀態

// 啟動消息
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `
🔍 Defined.fi 即時數據查詢機器人

📱 Chat ID: ${chatId}

🔧 可用命令:
/query - 查詢所有代幣
/top - 熱門代幣 TOP 10
/gainers - 今日漲幅榜
/volume - 交易量排行
/search [代幣符號] - 搜尋特定代幣
/filter [條件] - 自定義篩選
/traders [代幣] [金額] - 獲取真實交易者信息
/usd [金額] - 根據 USD 金額篩選代幣和交易者
/monitor [金額] - 開始實時監控 (持續通知)
/stop - 停止監控
/verify - 驗證數據真實性

📋 篩選條件格式:
/filter price>0.001 volume>100000 change>5

💡 範例:
/search BTC ETH
/filter price>0.01 change>10
/traders 0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b 1000
/traders PEPE 5000
/usd 1000 - 搜尋 USD ≥ $1000 的代幣和交易者
/monitor 1000 - 實時監控 USD ≥ $1000 的交易
/stop - 停止監控
/verify - 驗證數據真實性
/top 5
    `);
});

// 查詢所有代幣
bot.onText(/\/query/, async (msg) => {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, '🔍 正在抓取 defined.fi 即時數據...');
    
    try {
        const tokens = await scraper.getTokenDiscoveryData();
        const formatted = scraper.formatTokenData(tokens.slice(0, 10));
        
        let message = `📊 Defined.fi 即時數據 (前10個)\n\n`;
        
        formatted.forEach((token, i) => {
            message += `${i+1}. ${token.symbol} ${token.name}\n`;
            message += `💰 $${token.price} | 📈 ${token.priceChange24h}\n`;
            message += `💵 24h量: ${token.volume24h}\n`;
            message += `🏷️ 市值: ${token.marketCap}\n\n`;
        });
        
        message += `⏰ 更新時間: ${new Date().toLocaleString()}\n`;
        message += `📡 數據來源: defined.fi`;
        
        bot.sendMessage(chatId, message);
        
    } catch (error) {
        bot.sendMessage(chatId, `❌ 查詢失敗: ${error.message}`);
    }
});

// 熱門代幣 TOP N
bot.onText(/\/top(?:\s+(\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const limit = parseInt(match[1]) || 10;
    
    bot.sendMessage(chatId, `🔍 獲取 TOP ${limit} 熱門代幣...`);
    
    try {
        const tokens = await scraper.getTokenDiscoveryData();
        
        // 按交易量排序
        const sorted = tokens
            .filter(t => parseFloat(t.volume24h) > 0)
            .sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
            .slice(0, limit);
            
        const formatted = scraper.formatTokenData(sorted);
        
        let message = `🏆 TOP ${limit} 熱門代幣 (按交易量)\n\n`;
        
        formatted.forEach((token, i) => {
            message += `${i+1}. ${token.symbol}\n`;
            message += `💵 ${token.volume24h} | 📈 ${token.priceChange24h}\n`;
            message += `💰 $${token.price}\n\n`;
        });
        
        bot.sendMessage(chatId, message);
        
    } catch (error) {
        bot.sendMessage(chatId, `❌ 查詢失敗: ${error.message}`);
    }
});

// 漲幅榜
bot.onText(/\/gainers(?:\s+(\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const limit = parseInt(match[1]) || 10;
    
    bot.sendMessage(chatId, `📈 獲取漲幅 TOP ${limit}...`);
    
    try {
        const tokens = await scraper.getTokenDiscoveryData();
        
        // 按漲幅排序
        const gainers = tokens
            .filter(t => parseFloat(t.priceChange24h) > 0)
            .sort((a, b) => parseFloat(b.priceChange24h) - parseFloat(a.priceChange24h))
            .slice(0, limit);
            
        const formatted = scraper.formatTokenData(gainers);
        
        let message = `🚀 漲幅榜 TOP ${limit}\n\n`;
        
        formatted.forEach((token, i) => {
            message += `${i+1}. ${token.symbol} 🔥\n`;
            message += `📈 ${token.priceChange24h} | 💰 $${token.price}\n`;
            message += `💵 ${token.volume24h}\n\n`;
        });
        
        bot.sendMessage(chatId, message);
        
    } catch (error) {
        bot.sendMessage(chatId, `❌ 查詢失敗: ${error.message}`);
    }
});

// 交易量排行
bot.onText(/\/volume(?:\s+(\d+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const limit = parseInt(match[1]) || 10;
    
    bot.sendMessage(chatId, `💰 獲取交易量 TOP ${limit}...`);
    
    try {
        const tokens = await scraper.getTokenDiscoveryData();
        
        const highVolume = tokens
            .filter(t => parseFloat(t.volume24h) > 10000)
            .sort((a, b) => parseFloat(b.volume24h) - parseFloat(a.volume24h))
            .slice(0, limit);
            
        const formatted = scraper.formatTokenData(highVolume);
        
        let message = `💎 交易量排行 TOP ${limit}\n\n`;
        
        formatted.forEach((token, i) => {
            message += `${i+1}. ${token.symbol}\n`;
            message += `💵 ${token.volume24h} | 📈 ${token.priceChange24h}\n`;
            message += `🏷️ ${token.marketCap}\n\n`;
        });
        
        bot.sendMessage(chatId, message);
        
    } catch (error) {
        bot.sendMessage(chatId, `❌ 查詢失敗: ${error.message}`);
    }
});

// 搜尋特定代幣
bot.onText(/\/search (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const symbols = match[1].toUpperCase().split(/\s+/);
    
    bot.sendMessage(chatId, `🔍 搜尋代幣: ${symbols.join(', ')}`);
    
    try {
        const tokens = await scraper.getTokenDiscoveryData();
        
        const found = tokens.filter(token => 
            symbols.some(symbol => 
                token.symbol.toUpperCase().includes(symbol) ||
                token.name.toUpperCase().includes(symbol)
            )
        );
        
        if (found.length === 0) {
            bot.sendMessage(chatId, '❌ 未找到匹配的代幣');
            return;
        }
        
        const formatted = scraper.formatTokenData(found);
        
        let message = `🎯 搜尋結果 (${found.length}個)\n\n`;
        
        formatted.forEach((token, i) => {
            message += `${i+1}. ${token.symbol} (${token.name})\n`;
            message += `💰 $${token.price} | 📈 ${token.priceChange24h}\n`;
            message += `💵 ${token.volume24h} | 🏷️ ${token.marketCap}\n`;
            message += `🔗 ${token.address}\n\n`;
        });
        
        bot.sendMessage(chatId, message);
        
    } catch (error) {
        bot.sendMessage(chatId, `❌ 搜尋失敗: ${error.message}`);
    }
});

// 自定義篩選
bot.onText(/\/filter (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const filterStr = match[1];
    
    bot.sendMessage(chatId, `🔧 應用篩選條件: ${filterStr}`);
    
    try {
        // 解析篩選條件
        const criteria = parseFilterString(filterStr);
        
        const tokens = await scraper.getTokenDiscoveryData();
        const filtered = scraper.filterTokens(tokens, criteria);
        
        if (filtered.length === 0) {
            bot.sendMessage(chatId, '❌ 沒有代幣符合篩選條件');
            return;
        }
        
        const formatted = scraper.formatTokenData(filtered.slice(0, 15));
        
        let message = `🎯 篩選結果 (${filtered.length}個)\n`;
        message += `📋 條件: ${filterStr}\n\n`;
        
        formatted.forEach((token, i) => {
            message += `${i+1}. ${token.symbol}\n`;
            message += `💰 $${token.price} | 📈 ${token.priceChange24h}\n`;
            message += `💵 ${token.volume24h}\n\n`;
        });
        
        if (filtered.length > 15) {
            message += `... 還有 ${filtered.length - 15} 個結果`;
        }
        
        bot.sendMessage(chatId, message);
        
    } catch (error) {
        bot.sendMessage(chatId, `❌ 篩選失敗: ${error.message}`);
    }
});

// 解析篩選字符串
function parseFilterString(filterStr) {
    const criteria = {};
    
    // 解析條件: price>0.01 volume>100000 change>5
    const conditions = filterStr.split(/\s+/);
    
    conditions.forEach(condition => {
        const match = condition.match(/^(\w+)([><=]+)(.+)$/);
        if (match) {
            const [, field, operator, value] = match;
            const numValue = parseFloat(value);
            
            switch (field.toLowerCase()) {
                case 'price':
                    if (operator.includes('>')) criteria.minPrice = numValue;
                    if (operator.includes('<')) criteria.maxPrice = numValue;
                    break;
                case 'volume':
                    if (operator.includes('>')) criteria.minVolume = numValue;
                    break;
                case 'change':
                    if (operator.includes('>')) criteria.minPriceChange = numValue;
                    if (operator.includes('<')) criteria.maxPriceChange = numValue;
                    break;
                case 'marketcap':
                case 'cap':
                    if (operator.includes('>')) criteria.minMarketCap = numValue;
                    break;
            }
        }
    });
    
    return criteria;
}

// 查詢真實交易者信息
bot.onText(/\/traders (.+?)(?:\s+(\d+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const tokenInput = match[1].trim();
    const minAmount = parseInt(match[2]) || 1000;
    
    bot.sendMessage(chatId, `🔍 正在抓取 ${tokenInput} 的真實交易者信息...
最小金額: $${minAmount}`);
    
    try {
        const result = await traderTracker.getTradersByToken(tokenInput, minAmount);
        const message = traderTracker.formatTraders(result);
        
        // 分割長消息
        if (message.length > 4000) {
            const parts = message.match(/[\s\S]{1,4000}/g);
            for (const part of parts) {
                await bot.sendMessage(chatId, part);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } else {
            bot.sendMessage(chatId, message);
        }
        
    } catch (error) {
        bot.sendMessage(chatId, `❌ 獲取失敗: ${error.message}`);
    }
});

// USD PAIR created 搜尋
bot.onText(/\/usd(?:\s+(\d+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const minUSD = parseInt(match[1]) || 1000;
    
    bot.sendMessage(chatId, `🔍 正在搜尋 USD ≥ $${minUSD} 的代幣和交易者...`);
    
    try {
        const result = await usdTracker.getTokensByUSDAmount(minUSD);
        const message = usdTracker.formatResults(result);
        
        // 分割長消息
        if (message.length > 4000) {
            const parts = message.match(/[\s\S]{1,4000}/g);
            for (const part of parts) {
                await bot.sendMessage(chatId, part);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } else {
            bot.sendMessage(chatId, message);
        }
        
    } catch (error) {
        bot.sendMessage(chatId, `❌ 搜尋失敗: ${error.message}`);
    }
});

// 實時監控
bot.onText(/\/monitor(?:\s+(\d+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const minUSD = parseInt(match[1]) || 1000;
    
    // 停止現有監控
    if (activeMonitors.has(chatId)) {
        monitor.stopMonitoring();
        activeMonitors.delete(chatId);
    }
    
    bot.sendMessage(chatId, `🚀 開始實時監控 USD ≥ $${minUSD}\n⚡ 每30秒檢查一次\n🕰️ 時間格式: yy:MM:dd:HH:mm:ss\n\n發送 /stop 停止監控`);
    
    try {
        const result = await monitor.startMonitoring(minUSD, (alertData) => {
            // 實時通知回調
            const alertMessage = monitor.formatAlert(alertData);
            bot.sendMessage(chatId, alertMessage);
        });
        
        if (result.success) {
            activeMonitors.set(chatId, { minUSD, startTime: new Date() });
        } else {
            bot.sendMessage(chatId, `❌ ${result.message}`);
        }
        
    } catch (error) {
        bot.sendMessage(chatId, `❌ 監控啟動失敗: ${error.message}`);
    }
});

// 停止監控
bot.onText(/\/stop/, (msg) => {
    const chatId = msg.chat.id;
    
    if (activeMonitors.has(chatId)) {
        monitor.stopMonitoring();
        activeMonitors.delete(chatId);
        bot.sendMessage(chatId, '⏹️ 實時監控已停止');
    } else {
        bot.sendMessage(chatId, 'ℹ️ 當前沒有運行中的監控');
    }
});

// 驗證數據真實性
bot.onText(/\/verify/, async (msg) => {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, '🔍 正在驗證數據真實性...');
    
    try {
        const verification = await monitor.verifyDataAccuracy();
        
        if (verification.error) {
            bot.sendMessage(chatId, `❌ 驗證失敗: ${verification.error}`);
        } else {
            const verifyMessage = `
🔍 數據真實性驗證

📍 URL: ${verification.url}
📄 標題: ${verification.title}
🕰️ 時間: ${monitor.formatTime()}
🔗 代幣鏈接: ${verification.tokenCount} 個
💰 USD 數據: ${verification.usdMatches} 個
✅ 數據有效性: ${verification.hasTokenLinks && verification.hasUSDValues ? '真實' : '異常'}

📡 數據來源: defined.fi 官方網站
            `;
            
            bot.sendMessage(chatId, verifyMessage);
        }
        
    } catch (error) {
        bot.sendMessage(chatId, `❌ 驗證失敗: ${error.message}`);
    }
});

// 狀態檢查
bot.onText(/\/status/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `
🤖 Defined.fi 數據機器人

✅ 狀態: 運行中
🌐 數據源: defined.fi (真實數據)
⚡ 即時抓取: 支持
🔧 篩選功能: 支持
👥 交易者追蹤: 支持
🚀 實時監控: 支持
🕰️ 時間格式: yy:MM:dd:HH:mm:ss

📊 可查詢數據:
• 代幣價格和漲跌幅
• 24小時交易量
• 市值和持有者數量
• 真實交易者錢包地址
• 買賣單詳細時間和金額
• 實時監控和自動通知
• 數據真實性驗證
    `);
});

console.log('🚀 Defined.fi 數據機器人已啟動');
console.log('🔍 支持即時抓取 defined.fi 數據');
console.log('💡 使用 /start 查看所有命令');