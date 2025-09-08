// Comprehensive Monitoring System - Prevents all types of hanging
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class MonitoringSystem extends EventEmitter {
    constructor() {
        super();
        this.activeOperations = new Map();
        this.timeouts = new Map();
        this.heartbeats = new Map();
        this.logFile = path.join(__dirname, 'monitoring-system.log');
        this.config = {
            defaultTimeout: 30000,        // 30 seconds
            heartbeatInterval: 5000,      // 5 seconds
            maxRetries: 3,
            cleanupInterval: 60000,       // 1 minute
            logRetention: 7 * 24 * 60 * 60 * 1000 // 7 days
        };
        
        this.startCleanupTimer();
        this.setupGlobalHandlers();
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
        console.log(`${colors[level] || ''}[MONITOR] ${message}\x1b[0m`);
    }

    // Monitor any operation with timeout and heartbeat
    monitorOperation(operationId, operation, options = {}) {
        return new Promise((resolve, reject) => {
            const config = {
                timeout: options.timeout || this.config.defaultTimeout,
                retries: options.retries || this.config.maxRetries,
                heartbeat: options.heartbeat !== false,
                ...options
            };

            this.log('INFO', `Starting monitored operation: ${operationId}`, config);

            const operationData = {
                id: operationId,
                startTime: Date.now(),
                config,
                retryCount: 0,
                lastHeartbeat: Date.now(),
                status: 'running'
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
                this.log('WARN', `Operation ${operationId} failed, retrying (${operationData.retryCount}/${config.retries})`, {
                    error: error.message
                });
                
                // Wait before retry
                await this.sleep(1000 * operationData.retryCount);
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
            
            this.log('SUCCESS', `Operation completed: ${operationId}`, {
                duration: operationData.duration
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
            
            this.log('ERROR', `Operation failed: ${operationId}`, {
                error: error.message,
                duration: operationData.duration,
                retries: operationData.retryCount
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
            
            this.log('ERROR', `Operation timed out: ${operationId}`, {
                duration: operationData.duration,
                timeout: operationData.config.timeout
            });

            this.cleanupOperation(operationId);
            reject(new Error(`Operation ${operationId} timed out after ${operationData.config.timeout}ms`));
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
                config: op.config
            })),
            timeouts: this.timeouts.size,
            heartbeats: this.heartbeats.size,
            uptime: now - this.startTime
        };
    }

    // Kill all operations
    killAllOperations() {
        this.log('WARN', 'Killing all active operations');
        
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
            const stats = fs.statSync(this.logFile);
            const age = Date.now() - stats.mtime.getTime();
            
            if (age > this.config.logRetention) {
                fs.unlinkSync(this.logFile);
                this.log('INFO', 'Cleaned up old log file');
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
                this.log('WARN', `Cleaning up stale operation: ${operationId}`);
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
        this.log('INFO', 'Cleaning up monitoring system');
        this.killAllOperations();
    }

    // Utility: Sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create global instance
const monitoringSystem = new MonitoringSystem();

module.exports = monitoringSystem;
