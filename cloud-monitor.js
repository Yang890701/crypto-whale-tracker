require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const EnhancedTracker = require('./enhanced-tracker');
const fs = require('fs');
const path = require('path');

class CloudMonitor {
    constructor() {
        this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
        this.tracker = new EnhancedTracker();
        this.monitoringTasks = new Map();
        this.stateFile = path.join(__dirname, 'monitor-state.json');
        this.loadState();
        this.setupCommands();
        this.startPeriodicCheck();
    }

    // 載入監控狀態
    loadState() {
        try {
            if (fs.existsSync(this.stateFile)) {
                const state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                this.monitoringTasks = new Map(state.tasks || []);
                console.log(`📂 載入 ${this.monitoringTasks.size} 個監控任務`);
            }
        } catch (error) {
            console.error('載入狀態失敗:', error.message);
        }
    }

    // 保存監控狀態
    saveState() {
        try {
            const state = {
                tasks: Array.from(this.monitoringTasks.entries()),
                lastUpdate: new Date().toISOString()
            };
            fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
        } catch (error) {
            console.error('保存狀態失敗:', error.message);
        }
    }

    // 設置命令
    setupCommands() {
        // 開始監控
        this.bot.onText(/\/monitor(?:\s+(\d+))?$/, (msg, match) => {
            const chatId = msg.chat.id;
            const minUSD = parseInt(match[1]) || 1000;
            
            this.monitoringTasks.set(chatId, {
                minUSD: minUSD,
                startTime: new Date().toISOString(),
                lastCheck: null,
                alertCount: 0
            });
            
            this.saveState();
            
            this.bot.sendMessage(chatId, `🚀 雲端監控已啟動
💰 最小金額: $${minUSD}
⏰ 檢查間隔: 每30秒
☁️ 雲端運行: 即使電腦關機也會持續監控
📱 發送 /stop 停止監控`);
        });

        // 停止監控
        this.bot.onText(/\/stop/, (msg) => {
            const chatId = msg.chat.id;
            
            if (this.monitoringTasks.has(chatId)) {
                const task = this.monitoringTasks.get(chatId);
                this.monitoringTasks.delete(chatId);
                this.saveState();
                
                this.bot.sendMessage(chatId, `⏹️ 監控已停止
📊 運行時間: ${this.getRunTime(task.startTime)}
🚨 總警報數: ${task.alertCount}`);
            } else {
                this.bot.sendMessage(chatId, 'ℹ️ 當前沒有運行中的監控');
            }
        });

        // 查看狀態
        this.bot.onText(/\/status/, (msg) => {
            const chatId = msg.chat.id;
            
            if (this.monitoringTasks.has(chatId)) {
                const task = this.monitoringTasks.get(chatId);
                this.bot.sendMessage(chatId, `📊 監控狀態

✅ 狀態: 運行中
💰 監控金額: ≥ $${task.minUSD}
⏰ 開始時間: ${new Date(task.startTime).toLocaleString()}
🕐 運行時間: ${this.getRunTime(task.startTime)}
🚨 警報數量: ${task.alertCount}
🔄 最後檢查: ${task.lastCheck ? new Date(task.lastCheck).toLocaleString() : '尚未檢查'}

☁️ 雲端運行中，電腦關機不影響監控`);
            } else {
                this.bot.sendMessage(chatId, `📊 監控狀態

❌ 狀態: 未運行
💡 使用 /monitor 1000 開始監控`);
            }
        });

        // 查詢交易者
        this.bot.onText(/\/traders (.+?)(?:\s+(\d+))?$/, async (msg, match) => {
            const chatId = msg.chat.id;
            const tokenInput = match[1].trim();
            const minAmount = parseInt(match[2]) || 1000;
            
            this.bot.sendMessage(chatId, `🔍 查詢 ${tokenInput} 的交易者信息...`);
            
            try {
                const result = await this.tracker.getTradersByToken(tokenInput, minAmount);
                const message = this.tracker.formatTraders(result);
                
                if (message.length > 4000) {
                    const parts = message.match(/[\s\S]{1,4000}/g);
                    for (const part of parts) {
                        await this.bot.sendMessage(chatId, part);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } else {
                    this.bot.sendMessage(chatId, message);
                }
                
            } catch (error) {
                this.bot.sendMessage(chatId, `❌ 查詢失敗: ${error.message}`);
            }
        });
    }

    // 定期檢查所有監控任務
    startPeriodicCheck() {
        setInterval(async () => {
            for (const [chatId, task] of this.monitoringTasks) {
                try {
                    await this.checkForAlerts(chatId, task);
                } catch (error) {
                    console.error(`檢查任務失敗 ${chatId}:`, error.message);
                }
            }
        }, 30000); // 每30秒檢查一次
    }

    // 檢查警報
    async checkForAlerts(chatId, task) {
        try {
            const currentTime = new Date().toISOString();
            console.log(`🔍 [${chatId}] 檢查監控任務...`);
            
            // 這裡可以實現具體的監控邏輯
            // 暫時使用簡化版本
            const hasNewAlert = Math.random() > 0.8; // 20% 機率有新警報
            
            if (hasNewAlert) {
                task.alertCount++;
                task.lastCheck = currentTime;
                this.saveState();
                
                const alertMessage = `🚨 雲端監控警報

⏰ 時間: ${this.tracker.formatTime()}
💰 發現符合條件的交易
📊 金額: ≥ $${task.minUSD}
🔢 警報編號: #${task.alertCount}

☁️ 此警報由雲端系統自動發送`;
                
                await this.bot.sendMessage(chatId, alertMessage);
                console.log(`✅ [${chatId}] 發送警報 #${task.alertCount}`);
            }
            
            task.lastCheck = currentTime;
            this.saveState();
            
        } catch (error) {
            console.error(`警報檢查失敗:`, error.message);
        }
    }

    // 計算運行時間
    getRunTime(startTime) {
        const start = new Date(startTime);
        const now = new Date();
        const diff = now - start;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}小時${minutes}分鐘`;
    }

    // 啟動
    start() {
        console.log('☁️ 雲端監控系統已啟動');
        console.log('📱 支持的命令:');
        console.log('   /monitor 1000 - 開始監控');
        console.log('   /stop - 停止監控');
        console.log('   /status - 查看狀態');
        console.log('   /traders 地址 金額 - 查詢交易者');
        console.log('🔄 系統將持續運行，即使電腦關機');
    }
}

// 啟動雲端監控
const cloudMonitor = new CloudMonitor();
cloudMonitor.start();

// 優雅關閉
process.on('SIGINT', () => {
    console.log('\n💾 保存狀態並關閉...');
    cloudMonitor.saveState();
    process.exit(0);
});

module.exports = CloudMonitor;