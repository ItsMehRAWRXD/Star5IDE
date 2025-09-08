// AI Co-Pilot Health Check System - Comprehensive health monitoring
const { logger } = require('../utils/logger');
const aiMonitor = require('./ai-monitor');

class AIHealthChecker {
    constructor() {
        this.startTime = Date.now();
        this.requestCount = 0;
        this.errorCount = 0;
        this.lastHealthCheck = Date.now();
        this.memoryUsage = process.memoryUsage();
        this.cpuUsage = process.cpuUsage();
        this.isHealthy = true;
        this.aiOperationsCount = 0;
        this.aiErrorsCount = 0;
        
        // Start periodic health monitoring
        this.startHealthMonitoring();
        this.setupAIMonitoring();
    }

    // Start continuous health monitoring
    startHealthMonitoring() {
        setInterval(() => {
            this.performHealthCheck();
        }, 30000); // Check every 30 seconds

        // Memory monitoring
        setInterval(() => {
            this.monitorMemory();
        }, 10000); // Check every 10 seconds

        // Process monitoring
        setInterval(() => {
            this.monitorProcess();
        }, 5000); // Check every 5 seconds

        // AI operations monitoring
        setInterval(() => {
            this.monitorAIOperations();
        }, 15000); // Check every 15 seconds
    }

    // Setup AI monitoring event listeners
    setupAIMonitoring() {
        aiMonitor.on('log', (logEntry) => {
            if (logEntry.level === 'ERROR') {
                this.aiErrorsCount++;
            }
        });

        aiMonitor.on('heartbeat', (heartbeat) => {
            // Track AI operation heartbeats
            this.aiOperationsCount++;
        });
    }

    // Comprehensive health check
    performHealthCheck() {
        try {
            const now = Date.now();
            const uptime = now - this.startTime;
            const currentMemory = process.memoryUsage();
            const currentCpu = process.cpuUsage(this.cpuUsage);
            const aiStatus = aiMonitor.getStatus();
            
            // Check memory usage
            const memoryUsagePercent = (currentMemory.heapUsed / currentMemory.heapTotal) * 100;
            
            // Check if system is responsive
            const responseTime = now - this.lastHealthCheck;
            
            // Health status
            const healthStatus = {
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: uptime,
                memory: {
                    used: Math.round(currentMemory.heapUsed / 1024 / 1024) + ' MB',
                    total: Math.round(currentMemory.heapTotal / 1024 / 1024) + ' MB',
                    usagePercent: Math.round(memoryUsagePercent) + '%'
                },
                cpu: {
                    user: currentCpu.user,
                    system: currentCpu.system
                },
                requests: {
                    total: this.requestCount,
                    errors: this.errorCount,
                    errorRate: this.requestCount > 0 ? Math.round((this.errorCount / this.requestCount) * 100) + '%' : '0%'
                },
                ai: {
                    activeOperations: aiStatus.activeOperations,
                    totalOperations: this.aiOperationsCount,
                    errors: this.aiErrorsCount,
                    errorRate: this.aiOperationsCount > 0 ? Math.round((this.aiErrorsCount / this.aiOperationsCount) * 100) + '%' : '0%'
                },
                responseTime: responseTime + 'ms',
                healthy: this.isHealthy
            };

            // Log health status
            logger.info('AI Co-Pilot Health Check', healthStatus);

            // Check for potential issues
            if (memoryUsagePercent > 90) {
                logger.warn('High memory usage detected', { usage: memoryUsagePercent + '%' });
                this.isHealthy = false;
            }

            if (responseTime > 5000) {
                logger.warn('Slow response time detected', { responseTime: responseTime + 'ms' });
                this.isHealthy = false;
            }

            if (this.errorCount > this.requestCount * 0.1) {
                logger.warn('High error rate detected', { errorRate: healthStatus.requests.errorRate });
                this.isHealthy = false;
            }

            if (this.aiErrorsCount > this.aiOperationsCount * 0.2) {
                logger.warn('High AI error rate detected', { errorRate: healthStatus.ai.errorRate });
                this.isHealthy = false;
            }

            this.lastHealthCheck = now;
            this.memoryUsage = currentMemory;
            this.cpuUsage = process.cpuUsage();

            return healthStatus;
        } catch (error) {
            logger.error('AI Co-Pilot health check failed', error);
            this.isHealthy = false;
            return {
                status: 'ERROR',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Memory monitoring
    monitorMemory() {
        try {
            const memory = process.memoryUsage();
            const usagePercent = (memory.heapUsed / memory.heapTotal) * 100;
            
            if (usagePercent > 85) {
                logger.warn('AI Co-Pilot memory usage warning', {
                    usage: Math.round(usagePercent) + '%',
                    heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + ' MB',
                    heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + ' MB'
                });
                
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                    logger.info('Garbage collection triggered for AI Co-Pilot');
                }
            }
        } catch (error) {
            logger.error('AI Co-Pilot memory monitoring failed', error);
        }
    }

    // Process monitoring
    monitorProcess() {
        try {
            // Check if process is still responsive
            const now = Date.now();
            const timeSinceLastCheck = now - this.lastHealthCheck;
            
            if (timeSinceLastCheck > 60000) { // 1 minute
                logger.error('AI Co-Pilot process appears to be frozen', {
                    timeSinceLastCheck: timeSinceLastCheck + 'ms'
                });
                this.isHealthy = false;
            }
        } catch (error) {
            logger.error('AI Co-Pilot process monitoring failed', error);
        }
    }

    // AI operations monitoring
    monitorAIOperations() {
        try {
            const aiStatus = aiMonitor.getStatus();
            
            // Check for stuck AI operations
            const now = Date.now();
            for (const operation of aiStatus.operations) {
                if (operation.status === 'running' && (now - operation.lastHeartbeat) > 120000) { // 2 minutes
                    logger.warn('AI operation appears to be stuck', {
                        operationId: operation.id,
                        duration: operation.duration,
                        lastHeartbeat: operation.lastHeartbeat
                    });
                }
            }

            // Check for too many active operations
            if (aiStatus.activeOperations > 10) {
                logger.warn('High number of active AI operations', {
                    activeOperations: aiStatus.activeOperations
                });
            }
        } catch (error) {
            logger.error('AI operations monitoring failed', error);
        }
    }

    // Request tracking
    trackRequest() {
        this.requestCount++;
    }

    // Error tracking
    trackError() {
        this.errorCount++;
    }

    // Get current health status
    getHealthStatus() {
        return this.performHealthCheck();
    }

    // Force health check
    forceHealthCheck() {
        return this.performHealthCheck();
    }
}

// Create global health checker instance
const aiHealthChecker = new AIHealthChecker();

// Health check middleware
const healthCheckMiddleware = (req, res, next) => {
    // Track request
    aiHealthChecker.trackRequest();
    
    // Add health check endpoint
    if (req.path === '/health' || req.path === '/health-check') {
        const healthStatus = aiHealthChecker.getHealthStatus();
        return res.json(healthStatus);
    }
    
    next();
};

// Error tracking middleware
const errorTrackingMiddleware = (err, req, res, next) => {
    // Track error
    aiHealthChecker.trackError();
    
    logger.error('AI Co-Pilot request error', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });
    
    next(err);
};

// Graceful shutdown handler
const gracefulShutdown = (signal) => {
    logger.info(`AI Co-Pilot received ${signal}. Starting graceful shutdown...`);
    
    // Perform final health check
    const finalHealth = aiHealthChecker.getHealthStatus();
    logger.info('AI Co-Pilot final health status', finalHealth);
    
    // Cleanup AI monitor
    aiMonitor.cleanup();
    
    // Close server gracefully
    process.exit(0);
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

// Uncaught exception handler
process.on('uncaughtException', (err) => {
    logger.error('AI Co-Pilot Uncaught Exception', err);
    aiHealthChecker.trackError();
    
    // Don't exit immediately, log and continue
    logger.info('AI Co-Pilot continuing despite uncaught exception...');
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
    logger.error('AI Co-Pilot Unhandled Rejection', { reason, promise });
    aiHealthChecker.trackError();
    
    // Don't exit immediately, log and continue
    logger.info('AI Co-Pilot continuing despite unhandled rejection...');
});

module.exports = {
    healthCheckMiddleware,
    errorTrackingMiddleware,
    aiHealthChecker,
    gracefulShutdown
};
