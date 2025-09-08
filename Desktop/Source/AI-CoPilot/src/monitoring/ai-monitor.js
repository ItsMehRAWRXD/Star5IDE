// AI Co-Pilot Monitoring System - Comprehensive monitoring for AI operations
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class AIMonitor extends EventEmitter {
    constructor() {
        super();
        this.startTime = Date.now();
        this.activeOperations = new Map();
        this.timeouts = new Map();
        this.heartbeats = new Map();
        this.logFile = path.join(__dirname, '../../logs/ai-monitor.log');
        this.config = {
            defaultTimeout: 60000,        // 60 seconds for AI operations
            heartbeatInterval: 5000,      // 5 seconds
            maxRetries: 3,
            cleanupInterval: 60000,       // 1 minute
            logRetention: 7 * 24 * 60 * 60 * 1000 // 7 days
        };
        
        this.ensureLogDirectory();
        this.startCleanupTimer();
        this.setupGlobalHandlers();
    }

    // Ensure log directory exists
    ensureLogDirectory() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    // Log monitoring events
    log(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data,
            pid: process.pid
        };
        
        const logLine = `[${timestamp}] [${level}] ${message} ${JSON.stringify(data)}\n`;
        fs.appendFileSync(this.logFile, logLine);
        
        // Emit event for real-time monitoring
        this.emit('log', logEntry);
        
        // Console output with colors
        const colors = {
            INFO: '\x1b[36m',    // Cyan
            WARN: '\x1b[33m',    // Yellow
            ERROR: '\x1b[31m',   // Red
            SUCCESS: '\x1b[32m', // Green
            DEBUG: '\x1b[35m'    // Magenta
        };
        console.log(`${colors[level] || ''}[AI-MONITOR] ${message}\x1b[0m`);
    }

    // Monitor AI operations with timeout and heartbeat
    monitorAIOperation(operationId, operation, options = {}) {
        return new Promise((resolve, reject) => {
            const config = {
                timeout: options.timeout || this.config.defaultTimeout,
                retries: options.retries || this.config.maxRetries,
                heartbeat: options.heartbeat !== false,
                ...options
            };

            this.log('INFO', `Starting AI operation: ${operationId}`, config);

            const operationData = {
                id: operationId,
                startTime: Date.now(),
                config,
                retryCount: 0,
                lastHeartbeat: Date.now(),
                status: 'running',
                type: 'ai_operation'
            };

            this.activeOperations.set(operationId, operationData);

            // Set up timeout
            const timeoutId = setTimeout(() => {
                this.handleTimeout(operationId, resolve, reject);
            }, config.timeout);

            this.timeouts.set(operationId, timeoutId);

            // Set up heartbeat if enabled
            if (config.heartbeat) {
                const heartbeatId = setInterval(() => {
                    this.sendHeartbeat(operationId);
                }, this.config.heartbeatInterval);
                this.heartbeats.set(operationId, heartbeatId);
            }

            // Execute the operation
            this.executeWithRetry(operationId, operation, config, resolve, reject);
        });
    }

    // Execute operation with retry logic
    async executeWithRetry(operationId, operation, config, resolve, reject) {
        try {
            const result = await operation();
            this.completeOperation(operationId, result, resolve);
        } catch (error) {
            const operationData = this.activeOperations.get(operationId);
            
            if (operationData.retryCount < config.retries) {
                operationData.retryCount++;
                this.log('WARN', `AI operation ${operationId} failed, retrying (${operationData.retryCount}/${config.retries})`, {
                    error: error.message
                });
                
                // Wait before retry with exponential backoff
                await this.sleep(1000 * Math.pow(2, operationData.retryCount));
                this.executeWithRetry(operationId, operation, config, resolve, reject);
            } else {
                this.failOperation(operationId, error, reject);
            }
        }
    }

    // Complete operation successfully
    completeOperation(operationId, result, resolve) {
        const operationData = this.activeOperations.get(operationId);
        if (operationData) {
            operationData.status = 'completed';
            operationData.endTime = Date.now();
            operationData.duration = operationData.endTime - operationData.startTime;
            
            this.log('SUCCESS', `AI operation completed: ${operationId}`, {
                duration: operationData.duration,
                type: operationData.type
            });
        }

        this.cleanupOperation(operationId);
        resolve(result);
    }

    // Fail operation
    failOperation(operationId, error, reject) {
        const operationData = this.activeOperations.get(operationId);
        if (operationData) {
            operationData.status = 'failed';
            operationData.endTime = Date.now();
            operationData.duration = operationData.endTime - operationData.startTime;
            operationData.error = error.message;
            
            this.log('ERROR', `AI operation failed: ${operationId}`, {
                error: error.message,
                duration: operationData.duration,
                retries: operationData.retryCount,
                type: operationData.type
            });
        }

        this.cleanupOperation(operationId);
        reject(error);
    }

    // Handle timeout
    handleTimeout(operationId, resolve, reject) {
        const operationData = this.activeOperations.get(operationId);
        if (operationData && operationData.status === 'running') {
            operationData.status = 'timeout';
            operationData.endTime = Date.now();
            operationData.duration = operationData.endTime - operationData.startTime;
            
            this.log('ERROR', `AI operation timed out: ${operationId}`, {
                duration: operationData.duration,
                timeout: operationData.config.timeout,
                type: operationData.type
            });

            this.cleanupOperation(operationId);
            reject(new Error(`AI operation ${operationId} timed out after ${operationData.config.timeout}ms`));
        }
    }

    // Send heartbeat
    sendHeartbeat(operationId) {
        const operationData = this.activeOperations.get(operationId);
        if (operationData) {
            operationData.lastHeartbeat = Date.now();
            this.emit('heartbeat', { operationId, timestamp: Date.now() });
        }
    }

    // Cleanup operation resources
    cleanupOperation(operationId) {
        // Clear timeout
        const timeoutId = this.timeouts.get(operationId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.timeouts.delete(operationId);
        }

        // Clear heartbeat
        const heartbeatId = this.heartbeats.get(operationId);
        if (heartbeatId) {
            clearInterval(heartbeatId);
            this.heartbeats.delete(operationId);
        }

        // Remove from active operations
        this.activeOperations.delete(operationId);
    }

    // Monitor OpenAI API calls
    async monitorOpenAICall(apiKey, prompt, options = {}) {
        const operationId = `openai_${Date.now()}`;
        return this.monitorAIOperation(operationId, async () => {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: options.model || 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: options.maxTokens || 1000,
                    temperature: options.temperature || 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        }, { timeout: 120000, ...options });
    }

    // Monitor code analysis operations
    async monitorCodeAnalysis(code, language, options = {}) {
        const operationId = `code_analysis_${Date.now()}`;
        return this.monitorAIOperation(operationId, async () => {
            // This would integrate with your AI service
            // For now, simulate the operation
            await this.sleep(2000); // Simulate processing time
            return {
                analysis: 'Code analysis completed',
                suggestions: ['Consider adding error handling', 'Optimize for performance'],
                issues: ['Potential memory leak', 'Unused variable']
            };
        }, { timeout: 30000, ...options });
    }

    // Monitor code generation operations
    async monitorCodeGeneration(requirements, language, options = {}) {
        const operationId = `code_generation_${Date.now()}`;
        return this.monitorAIOperation(operationId, async () => {
            // This would integrate with your AI service
            await this.sleep(3000); // Simulate processing time
            return {
                code: '// Generated code here',
                explanation: 'This code implements the requested functionality',
                tests: '// Generated tests here'
            };
        }, { timeout: 60000, ...options });
    }

    // Get system status
    getStatus() {
        const now = Date.now();
        const activeOps = Array.from(this.activeOperations.values());
        
        return {
            activeOperations: activeOps.length,
            operations: activeOps.map(op => ({
                id: op.id,
                status: op.status,
                duration: now - op.startTime,
                retryCount: op.retryCount,
                lastHeartbeat: op.lastHeartbeat,
                type: op.type,
                config: op.config
            })),
            timeouts: this.timeouts.size,
            heartbeats: this.heartbeats.size,
            uptime: now - this.startTime,
            memory: process.memoryUsage()
        };
    }

    // Kill all operations
    killAllOperations() {
        this.log('WARN', 'Killing all active AI operations');
        
        for (const [operationId] of this.activeOperations) {
            this.cleanupOperation(operationId);
        }
        
        this.activeOperations.clear();
    }

    // Start cleanup timer
    startCleanupTimer() {
        setInterval(() => {
            this.cleanupOldLogs();
            this.cleanupStaleOperations();
        }, this.config.cleanupInterval);
    }

    // Cleanup old logs
    cleanupOldLogs() {
        try {
            if (fs.existsSync(this.logFile)) {
                const stats = fs.statSync(this.logFile);
                const age = Date.now() - stats.mtime.getTime();
                
                if (age > this.config.logRetention) {
                    fs.unlinkSync(this.logFile);
                    this.log('INFO', 'Cleaned up old log file');
                }
            }
        } catch (error) {
            // Log file doesn't exist or can't be accessed
        }
    }

    // Cleanup stale operations
    cleanupStaleOperations() {
        const now = Date.now();
        const staleThreshold = 5 * 60 * 1000; // 5 minutes
        
        for (const [operationId, operationData] of this.activeOperations) {
            if (now - operationData.lastHeartbeat > staleThreshold) {
                this.log('WARN', `Cleaning up stale AI operation: ${operationId}`);
                this.cleanupOperation(operationId);
            }
        }
    }

    // Setup global handlers
    setupGlobalHandlers() {
        this.startTime = Date.now();
        
        process.on('exit', () => this.cleanup());
        process.on('SIGINT', () => {
            this.cleanup();
            process.exit(0);
        });
        process.on('SIGTERM', () => {
            this.cleanup();
            process.exit(0);
        });
    }

    // Cleanup on exit
    cleanup() {
        this.log('INFO', 'Cleaning up AI monitoring system');
        this.killAllOperations();
    }

    // Utility: Sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create global instance
const aiMonitor = new AIMonitor();

module.exports = aiMonitor;
