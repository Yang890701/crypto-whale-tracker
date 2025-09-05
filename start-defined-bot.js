require('dotenv').config();

console.log('🚀 啟動 Defined.fi 數據機器人...\n');

// 檢查環境變數
if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ 缺少 TELEGRAM_BOT_TOKEN');
    process.exit(1);
}

if (!process.env.TELEGRAM_CHAT_ID) {
    console.error('❌ 缺少 TELEGRAM_CHAT_ID');
    process.exit(1);
}

console.log('✅ 環境變數檢查通過');
console.log(`📱 Bot Token: ${process.env.TELEGRAM_BOT_TOKEN.slice(0, 10)}...`);
console.log(`💬 Chat ID: ${process.env.TELEGRAM_CHAT_ID}`);

// 啟動機器人
try {
    require('./defined-telegram-bot');
    console.log('\n🎉 機器人啟動成功！');
    console.log('💡 在 Telegram 中發送 /start 開始使用');
    console.log('🔍 使用 /query 獲取即時數據');
    console.log('📈 使用 /gainers 查看漲幅榜');
    console.log('💰 使用 /volume 查看交易量排行');
    console.log('🔎 使用 /search BTC 搜尋特定代幣');
    console.log('🔧 使用 /filter price>0.01 change>5 自定義篩選');
} catch (error) {
    console.error('❌ 機器人啟動失敗:', error.message);
    process.exit(1);
}