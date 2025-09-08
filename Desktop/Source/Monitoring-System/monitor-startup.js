// Monitor Startup - Initialize all monitoring systems with comprehensive care
const monitoringSystem = require('./monitoring-system');
const safeOperations = require('./safe-operations');
const fs = require('fs');
const path = require('path');

class MonitorStartup {
    constructor() {
        this.monitor = monitoringSystem;
        this.operations = safeOperations;
        this.isInitialized = false;
        this.startTime = Date.now();
        this.healthChecks = [];
        this.setupHealthMonitoring();
    }

    async initialize() {
        if (this.isInitialized) {
            console.log('🔄 Monitoring system already initialized');
            return;
        }

        console.log('🚀 Initializing comprehensive monitoring system...');

        try {
            // Initialize monitoring system
            console.log('📊 Setting up monitoring system...');
            this.monitor.log('INFO', 'Monitoring system initialized');

            // Initialize safe operations
            console.log('🛡️ Setting up safe operations...');
            this.operations.log('INFO', 'Safe operations initialized');

            // Setup global error handlers
            this.setupErrorHandlers();

            // Setup process monitoring
            this.setupProcessMonitoring();

            // Setup memory monitoring
            this.setupMemoryMonitoring();

            // Setup file system monitoring
            this.setupFileSystemMonitoring();

            // Setup network monitoring
            this.setupNetworkMonitoring();

            // Setup performance monitoring
            this.setupPerformanceMonitoring();

            // Create dashboard
            this.createDashboard();

            this.isInitialized = true;
            console.log('✅ Monitoring system fully initialized!');
            console.log('🛡️ All operations are now monitored and protected');
            console.log('📊 Dashboard available at: file://' + path.resolve(__dirname, 'monitor-dashboard.html'));

        } catch (error) {
            console.error('❌ Failed to initialize monitoring system:', error);
            throw error;
        }
    }

    setupErrorHandlers() {
        // Global error handler
        process.on('uncaughtException', (error) => {
            this.monitor.log('ERROR', 'Uncaught exception', { error: error.message, stack: error.stack });
            console.error('💥 Uncaught Exception:', error);
        });

        // Unhandled promise rejection handler
        process.on('unhandledRejection', (reason, promise) => {
            this.monitor.log('ERROR', 'Unhandled promise rejection', { reason: reason.toString() });
            console.error('💥 Unhandled Promise Rejection:', reason);
        });

        // Warning handler
        process.on('warning', (warning) => {
            this.monitor.log('WARN', 'Process warning', { warning: warning.message, stack: warning.stack });
            console.warn('⚠️ Process Warning:', warning);
        });
    }

    setupProcessMonitoring() {
        // Monitor process resource usage
        setInterval(() => {
            const usage = process.cpuUsage();
            const memoryUsage = process.memoryUsage();
            
            this.monitor.log('DEBUG', 'Process resource usage', {
                cpu: {
                    user: usage.user,
                    system: usage.system
                },
                memory: {
                    rss: memoryUsage.rss,
                    heapTotal: memoryUsage.heapTotal,
                    heapUsed: memoryUsage.heapUsed,
                    external: memoryUsage.external
                }
            });
        }, 30000); // Every 30 seconds
    }

    setupMemoryMonitoring() {
        // Monitor memory usage and warn if high
        setInterval(() => {
            const memoryUsage = process.memoryUsage();
            const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
            const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
            const usagePercent = (heapUsedMB / heapTotalMB) * 100;

            if (usagePercent > 80) {
                this.monitor.log('WARN', 'High memory usage detected', {
                    heapUsedMB: Math.round(heapUsedMB),
                    heapTotalMB: Math.round(heapTotalMB),
                    usagePercent: Math.round(usagePercent)
                });
            }

            if (usagePercent > 95) {
                this.monitor.log('ERROR', 'Critical memory usage', {
                    heapUsedMB: Math.round(heapUsedMB),
                    heapTotalMB: Math.round(heapTotalMB),
                    usagePercent: Math.round(usagePercent)
                });
                
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                    this.monitor.log('INFO', 'Forced garbage collection');
                }
            }
        }, 10000); // Every 10 seconds
    }

    setupFileSystemMonitoring() {
        // Monitor file system operations
        const originalWriteFile = require('fs').writeFile;
        const originalReadFile = require('fs').readFile;

        // Wrap file operations with monitoring
        require('fs').writeFile = (...args) => {
            const operationId = this.monitor.generateOperationId('fs_writeFile');
            this.monitor.log('DEBUG', 'File write operation', { file: args[0] });
            return originalWriteFile.apply(this, args);
        };

        require('fs').readFile = (...args) => {
            const operationId = this.monitor.generateOperationId('fs_readFile');
            this.monitor.log('DEBUG', 'File read operation', { file: args[0] });
            return originalReadFile.apply(this, args);
        };
    }

    setupNetworkMonitoring() {
        // Monitor network operations
        const originalFetch = global.fetch;
        if (originalFetch) {
            global.fetch = async (...args) => {
                const operationId = this.monitor.generateOperationId('network_fetch');
                this.monitor.log('DEBUG', 'Network request', { url: args[0] });
                try {
                    const result = await originalFetch.apply(this, args);
                    this.monitor.log('DEBUG', 'Network response', { 
                        url: args[0], 
                        status: result.status 
                    });
                    return result;
                } catch (error) {
                    this.monitor.log('ERROR', 'Network request failed', { 
                        url: args[0], 
                        error: error.message 
                    });
                    throw error;
                }
            };
        }
    }

    setupPerformanceMonitoring() {
        // Monitor performance metrics
        setInterval(() => {
            const performanceMetrics = {
                uptime: Date.now() - this.startTime,
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                activeOperations: this.monitor.activeOperations.size,
                timeouts: this.monitor.timeouts.size,
                heartbeats: this.monitor.heartbeats.size
            };

            this.monitor.log('DEBUG', 'Performance metrics', performanceMetrics);
        }, 60000); // Every minute
    }

    setupHealthMonitoring() {
        // Continuous health monitoring
        setInterval(() => {
            this.performHealthCheck();
        }, 30000); // Every 30 seconds
    }

    performHealthCheck() {
        try {
            const healthStatus = {
                timestamp: new Date().toISOString(),
                uptime: Date.now() - this.startTime,
                memory: process.memoryUsage(),
                activeOperations: this.monitor.activeOperations.size,
                isHealthy: true
            };

            // Check for issues
            const memoryUsagePercent = (healthStatus.memory.heapUsed / healthStatus.memory.heapTotal) * 100;
            
            if (memoryUsagePercent > 90) {
                healthStatus.isHealthy = false;
                this.monitor.log('WARN', 'Health check failed: High memory usage', {
                    usage: Math.round(memoryUsagePercent) + '%'
                });
            }

            if (this.monitor.activeOperations.size > 50) {
                healthStatus.isHealthy = false;
                this.monitor.log('WARN', 'Health check failed: Too many active operations', {
                    activeOperations: this.monitor.activeOperations.size
                });
            }

            this.healthChecks.push(healthStatus);
            
            // Keep only last 100 health checks
            if (this.healthChecks.length > 100) {
                this.healthChecks = this.healthChecks.slice(-100);
            }

            this.monitor.log('INFO', 'Health check completed', healthStatus);

        } catch (error) {
            this.monitor.log('ERROR', 'Health check failed', { error: error.message });
        }
    }

    createDashboard() {
        const dashboardPath = path.join(__dirname, 'monitor-dashboard.html');
        
        if (!fs.existsSync(dashboardPath)) {
            // Create a simple dashboard if it doesn't exist
            const dashboardHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Monitoring System Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; }
        .warning { background: #fff3cd; color: #856404; }
        .error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h1>🛡️ Monitoring System Dashboard</h1>
    <div id="status"></div>
    <script>
        function updateStatus() {
            // This would connect to the monitoring system
            document.getElementById('status').innerHTML = 
                '<div class="status success">Monitoring system is running</div>';
        }
        updateStatus();
        setInterval(updateStatus, 5000);
    </script>
</body>
</html>`;
            
            fs.writeFileSync(dashboardPath, dashboardHTML);
            console.log('📊 Dashboard created at:', dashboardPath);
        }
    }

    // Get system status
    getStatus() {
        return {
            initialized: this.isInitialized,
            monitor: this.monitor.getStatus(),
            uptime: Date.now() - this.startTime,
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            healthChecks: this.healthChecks.slice(-10) // Last 10 health checks
        };
    }

    // Graceful shutdown
    async shutdown() {
        console.log('🔄 Shutting down monitoring system...');
        
        try {
            // Wait for all operations to complete
            await this.operations.waitForCompletion(30000);
            
            // Cleanup monitoring system
            this.monitor.cleanup();
            
            console.log('✅ Monitoring system shutdown complete');
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
        }
    }
}

// Create global instance
const monitorStartup = new MonitorStartup();

// Auto-initialize if this file is run directly
if (require.main === module) {
    monitorStartup.initialize().catch(console.error);
}

module.exports = monitorStartup;
