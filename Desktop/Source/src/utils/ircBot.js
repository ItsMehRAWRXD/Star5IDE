// IRC Bot for Chatterbox Agent - Real-time communication of script statuses and errors
const { chatterbox } = require('./chatterbox');
const { logger } = require('./logger');

class IRCBot {
    constructor(config = {}) {
        this.config = {
            server: config.server || 'irc.libera.chat',
            port: config.port || 6667,
            channels: config.channels || ['#rawrz-monitoring'],
            nick: config.nick || 'RawrZBot',
            username: config.username || 'rawrzbot',
            realname: config.realname || 'RawrZ Security Platform Monitor',
            ...config
        };
        
        this.connected = false;
        this.socket = null;
        this.channels = new Set(this.config.channels);
        this.messageQueue = [];
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        this.initializeIRC();
    }

    initializeIRC() {
        logger.info('🤖 IRC Bot initializing...');
        
        // Set up event listeners from chatterbox
        this.setupChatterboxListeners();
        
        // Connect to IRC
        this.connect();
    }

    setupChatterboxListeners() {
        // Listen for script status changes
        chatterbox.on('script_registered', (data) => {
            this.sendToIRC(`📝 Script registered: ${data.scriptId} (${data.script.name})`);
        });

        chatterbox.on('status_change', (data) => {
            this.sendToIRC(`🔄 ${data.script.name}: ${data.oldStatus} → ${data.newStatus}`);
        });

        chatterbox.on('script_error', (data) => {
            this.sendToIRC(`❌ ERROR in ${data.scriptName}: ${data.error}`);
            if (data.requestId) {
                this.sendToIRC(`🔍 RequestID: ${data.requestId}`);
            }
        });

        chatterbox.on('script_stuck', (data) => {
            this.sendToIRC(`⚠️ STUCK SCRIPT: ${data.scriptName} (${Math.round(data.duration/1000)}s) - Status: ${data.lastStatus}`);
        });

        chatterbox.on('requestid_error', (data) => {
            this.sendToIRC(`🚨 REQUESTID ERROR: ${data.requestId} - ${data.error}`);
        });

        chatterbox.on('heartbeat_overdue', (data) => {
            this.sendToIRC(`💓 Heartbeat overdue: ${data.scriptName} (${Math.round(data.timeSinceHeartbeat/1000)}s)`);
        });

        chatterbox.on('process_error', (data) => {
            this.sendToIRC(`💥 PROCESS ERROR: ${data.type} - ${data.error}`);
        });
    }

    connect() {
        try {
            const net = require('net');
            this.socket = new net.Socket();
            
            this.socket.connect(this.config.port, this.config.server, () => {
                logger.info(`🤖 Connected to IRC server: ${this.config.server}:${this.config.port}`);
                this.connected = true;
                this.reconnectAttempts = 0;
                this.authenticate();
            });

            this.socket.on('data', (data) => {
                this.handleIRCData(data.toString());
            });

            this.socket.on('close', () => {
                logger.warn('🤖 IRC connection closed');
                this.connected = false;
                this.reconnect();
            });

            this.socket.on('error', (error) => {
                logger.error(`🤖 IRC connection error: ${error.message}`);
                this.connected = false;
                this.reconnect();
            });

        } catch (error) {
            logger.error(`🤖 Failed to connect to IRC: ${error.message}`);
            this.reconnect();
        }
    }

    authenticate() {
        this.sendRaw(`NICK ${this.config.nick}`);
        this.sendRaw(`USER ${this.config.username} 0 * :${this.config.realname}`);
        
        // Identify with nickserv if password is provided
        if (this.config.password) {
            setTimeout(() => {
                this.sendRaw(`PRIVMSG NickServ :IDENTIFY ${this.config.password}`);
                logger.info('🤖 IRC: Identifying with NickServ');
            }, 3000);
        }
    }

    handleIRCData(data) {
        const lines = data.split('\r\n').filter(line => line.trim());
        
        for (const line of lines) {
            this.handleIRCLine(line);
        }
    }

    handleIRCLine(line) {
        logger.debug(`🤖 IRC: ${line}`);
        
        // Handle PING
        if (line.startsWith('PING')) {
            const server = line.split(' ')[1];
            this.sendRaw(`PONG ${server}`);
            return;
        }

        // Handle numeric responses
        const parts = line.split(' ');
        const numeric = parts[1];
        
        switch (numeric) {
            case '001': // RPL_WELCOME
                logger.info('🤖 IRC: Successfully authenticated');
                this.joinChannels();
                break;
            case '433': // ERR_NICKNAMEINUSE
                logger.warn('🤖 IRC: Nickname in use, trying alternative');
                this.config.nick += '_';
                this.sendRaw(`NICK ${this.config.nick}`);
                break;
            case '376': // RPL_ENDOFMOTD
            case '422': // ERR_NOMOTD
                this.joinChannels();
                break;
        }

        // Handle PRIVMSG (channel messages)
        if (line.includes('PRIVMSG')) {
            this.handleChannelMessage(line);
        }
    }

    joinChannels() {
        for (const channel of this.channels) {
            this.sendRaw(`JOIN ${channel}`);
            logger.info(`🤖 IRC: Joining channel ${channel}`);
        }
        
        // Send initial status
        setTimeout(() => {
            this.sendToIRC('🤖 RawrZ Security Platform Monitor online!');
            this.sendSystemStatus();
        }, 2000);
    }

    handleChannelMessage(line) {
        const match = line.match(/:([^!]+)![^@]+@[^ ]+ PRIVMSG ([^ ]+) :(.+)/);
        if (!match) return;

        const [, nick, channel, message] = match;
        
        // Handle commands
        if (message.startsWith('!')) {
            this.handleCommand(nick, channel, message);
        }
    }

    handleCommand(nick, channel, message) {
        const command = message.toLowerCase().trim();
        
        switch (command) {
            case '!status':
                this.sendSystemStatus();
                break;
            case '!scripts':
                this.sendScriptStatus();
                break;
            case '!errors':
                this.sendRecentErrors();
                break;
            case '!stuck':
                this.sendStuckScripts();
                break;
            case '!requestid':
                this.sendRequestIdErrors();
                break;
            case '!help':
                this.sendHelp();
                break;
            default:
                this.sendToIRC(`Unknown command: ${command}. Use !help for available commands.`);
        }
    }

    sendSystemStatus() {
        const status = chatterbox.getStatusReport();
        const health = status.health;
        
        this.sendToIRC(`📊 System Status: ${health.status.toUpperCase()}`);
        this.sendToIRC(`📈 Scripts: ${status.activeScripts} active, ${status.stuckScripts} stuck`);
        this.sendToIRC(`❌ Errors: ${status.totalErrors} total, ${status.recentErrors.length} recent`);
        this.sendToIRC(`🔗 Channels: ${status.communicationChannels} active`);
    }

    sendScriptStatus() {
        const scripts = chatterbox.getAllScriptStatuses();
        
        if (scripts.length === 0) {
            this.sendToIRC('📝 No active scripts');
            return;
        }

        this.sendToIRC(`📝 Active Scripts (${scripts.length}):`);
        for (const script of scripts.slice(0, 5)) { // Limit to 5 to avoid spam
            const uptime = Math.round((Date.now() - script.startTime) / 1000);
            this.sendToIRC(`  • ${script.name}: ${script.status} (${uptime}s)`);
        }
        
        if (scripts.length > 5) {
            this.sendToIRC(`  ... and ${scripts.length - 5} more`);
        }
    }

    sendRecentErrors() {
        const errors = chatterbox.getErrorLog(5);
        
        if (errors.length === 0) {
            this.sendToIRC('✅ No recent errors');
            return;
        }

        this.sendToIRC(`❌ Recent Errors (${errors.length}):`);
        for (const error of errors) {
            const timeAgo = Math.round((Date.now() - error.timestamp) / 1000);
            this.sendToIRC(`  • ${error.scriptName || 'Unknown'}: ${error.error} (${timeAgo}s ago)`);
        }
    }

    sendStuckScripts() {
        const stuck = chatterbox.getStuckScripts();
        
        if (stuck.length === 0) {
            this.sendToIRC('✅ No stuck scripts');
            return;
        }

        this.sendToIRC(`⚠️ Stuck Scripts (${stuck.length}):`);
        for (const script of stuck) {
            const duration = Math.round(script.duration / 1000);
            this.sendToIRC(`  • ${script.scriptName}: ${duration}s (Status: ${script.lastStatus})`);
        }
    }

    sendRequestIdErrors() {
        const requestIdErrors = chatterbox.getRequestIdErrors();
        
        if (requestIdErrors.length === 0) {
            this.sendToIRC('✅ No RequestID errors');
            return;
        }

        this.sendToIRC(`🚨 RequestID Errors (${requestIdErrors.length}):`);
        for (const [requestId, errors] of requestIdErrors.slice(0, 3)) { // Limit to 3
            const latestError = errors[errors.length - 1];
            const timeAgo = Math.round((Date.now() - latestError.timestamp) / 1000);
            this.sendToIRC(`  • ${requestId}: ${latestError.error} (${timeAgo}s ago)`);
        }
    }

    sendHelp() {
        this.sendToIRC('🤖 Available commands:');
        this.sendToIRC('  !status - System status');
        this.sendToIRC('  !scripts - Active scripts');
        this.sendToIRC('  !errors - Recent errors');
        this.sendToIRC('  !stuck - Stuck scripts');
        this.sendToIRC('  !requestid - RequestID errors');
        this.sendToIRC('  !help - This help');
    }

    sendToIRC(message) {
        if (!this.connected || !this.socket) {
            this.messageQueue.push(message);
            return;
        }

        // Send to all channels
        for (const channel of this.channels) {
            this.sendRaw(`PRIVMSG ${channel} :${message}`);
        }
    }

    sendRaw(command) {
        if (this.socket && this.connected) {
            this.socket.write(command + '\r\n');
        }
    }

    reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('🤖 Max reconnection attempts reached, giving up');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
        
        logger.info(`🤖 Reconnecting to IRC in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            this.connect();
        }, delay);
    }

    // Send periodic status updates
    startPeriodicUpdates() {
        setInterval(() => {
            if (this.connected) {
                const status = chatterbox.getStatusReport();
                const health = status.health;
                
                // Only send updates if there are issues
                if (health.status !== 'healthy' || status.stuckScripts > 0 || status.recentErrors.length > 0) {
                    this.sendSystemStatus();
                }
            }
        }, 300000); // Every 5 minutes
    }

    // Add channel
    addChannel(channel) {
        if (!channel.startsWith('#')) {
            channel = '#' + channel;
        }
        
        this.channels.add(channel);
        if (this.connected) {
            this.sendRaw(`JOIN ${channel}`);
            logger.info(`🤖 IRC: Added channel ${channel}`);
        }
    }

    // Remove channel
    removeChannel(channel) {
        if (!channel.startsWith('#')) {
            channel = '#' + channel;
        }
        
        this.channels.delete(channel);
        if (this.connected) {
            this.sendRaw(`PART ${channel}`);
            logger.info(`🤖 IRC: Removed channel ${channel}`);
        }
    }

    // Disconnect
    disconnect() {
        if (this.connected && this.socket) {
            this.sendToIRC('🤖 RawrZ Monitor disconnecting...');
            this.sendRaw('QUIT :RawrZ Security Platform Monitor shutting down');
            this.socket.end();
        }
    }
}

// Create IRC bot instance
const ircBot = new IRCBot({
    server: process.env.IRC_SERVER || 'irc.rizon.net',
    port: parseInt(process.env.IRC_PORT) || 6667,
    channels: (process.env.IRC_CHANNELS || '#rawr').split(','),
    nick: process.env.IRC_NICK || 'RawrZBot',
    username: process.env.IRC_USERNAME || 'bibbles11',
    realname: process.env.IRC_REALNAME || 'RawrZ Security Platform Monitor',
    password: process.env.IRC_PASSWORD || 'bibbles11'
});

// Start periodic updates
ircBot.startPeriodicUpdates();

// Graceful shutdown
process.on('SIGTERM', () => {
    ircBot.disconnect();
});

process.on('SIGINT', () => {
    ircBot.disconnect();
});

module.exports = {
    IRCBot,
    ircBot
};
