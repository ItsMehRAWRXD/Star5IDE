// RawrZ API Status - Comprehensive API monitoring and status system
const EventEmitter = require('events');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

class APIStatus extends EventEmitter {
    constructor() {
        super();
        this.apis = new Map();
        this.statusChecks = new Map();
        this.healthMetrics = {
            totalChecks: 0,
            successfulChecks: 0,
            failedChecks: 0,
            averageResponseTime: 0,
            uptime: Date.now()
        };
        
        this.initializeAPIs();
        this.startPeriodicChecks();
    }

    async initialize(config) {
        this.config = config;
        logger.info('API Status initialized');
    }

    // Initialize all APIs
    initializeAPIs() {
        // Core RawrZ APIs
        this.apis.set('rawrz-engine', {
            name: 'RawrZ Engine',
            url: 'http://localhost:3000/api/engine/status',
            type: 'internal',
            critical: true,
            timeout: 5000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('compression-engine', {
            name: 'Compression Engine',
            url: 'http://localhost:3000/api/compression/status',
            type: 'internal',
            critical: true,
            timeout: 3000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('stealth-engine', {
            name: 'Stealth Engine',
            url: 'http://localhost:3000/api/stealth/status',
            type: 'internal',
            critical: true,
            timeout: 3000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('stub-generator', {
            name: 'Stub Generator',
            url: 'http://localhost:3000/api/stub/status',
            type: 'internal',
            critical: true,
            timeout: 5000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('dual-generators', {
            name: 'Dual Generators',
            url: 'http://localhost:3000/api/dual-generators/status',
            type: 'internal',
            critical: true,
            timeout: 5000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('hot-patchers', {
            name: 'Hot Patchers',
            url: 'http://localhost:3000/api/patchers/status',
            type: 'internal',
            critical: true,
            timeout: 3000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('full-assembly', {
            name: 'Full Assembly',
            url: 'http://localhost:3000/api/assembly/status',
            type: 'internal',
            critical: true,
            timeout: 5000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('polymorphic-engine', {
            name: 'Polymorphic Engine',
            url: 'http://localhost:3000/api/polymorphic/status',
            type: 'internal',
            critical: false,
            timeout: 5000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('anti-analysis', {
            name: 'Anti-Analysis',
            url: 'http://localhost:3000/api/anti-analysis/status',
            type: 'internal',
            critical: false,
            timeout: 3000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('memory-manager', {
            name: 'Memory Manager',
            url: 'http://localhost:3000/api/memory/status',
            type: 'internal',
            critical: true,
            timeout: 3000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('backup-system', {
            name: 'Backup System',
            url: 'http://localhost:3000/api/backup/status',
            type: 'internal',
            critical: false,
            timeout: 5000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('mobile-tools', {
            name: 'Mobile Tools',
            url: 'http://localhost:3000/api/mobile/status',
            type: 'internal',
            critical: false,
            timeout: 5000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('network-tools', {
            name: 'Network Tools',
            url: 'http://localhost:3000/api/network/status',
            type: 'internal',
            critical: false,
            timeout: 3000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('advanced-crypto', {
            name: 'Advanced Crypto',
            url: 'http://localhost:3000/api/crypto/status',
            type: 'internal',
            critical: true,
            timeout: 3000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('reverse-engineering', {
            name: 'Reverse Engineering',
            url: 'http://localhost:3000/api/reverse/status',
            type: 'internal',
            critical: false,
            timeout: 5000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('digital-forensics', {
            name: 'Digital Forensics',
            url: 'http://localhost:3000/api/forensics/status',
            type: 'internal',
            critical: false,
            timeout: 5000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('malware-analysis', {
            name: 'Malware Analysis',
            url: 'http://localhost:3000/api/malware/status',
            type: 'internal',
            critical: false,
            timeout: 5000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        // External APIs
        this.apis.set('openai-api', {
            name: 'OpenAI API',
            url: 'https://api.openai.com/v1/models',
            type: 'external',
            critical: false,
            timeout: 10000,
            retries: 2,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        this.apis.set('github-api', {
            name: 'GitHub API',
            url: 'https://api.github.com/zen',
            type: 'external',
            critical: false,
            timeout: 5000,
            retries: 2,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });
    }

    // Start periodic status checks
    startPeriodicChecks() {
        // Check all APIs every 30 seconds
        setInterval(() => {
            this.checkAllAPIs();
        }, 30000);

        // Check critical APIs every 10 seconds
        setInterval(() => {
            this.checkCriticalAPIs();
        }, 10000);

        logger.info('Periodic API status checks started');
    }

    // Check all APIs
    async checkAllAPIs() {
        const checkPromises = Array.from(this.apis.keys()).map(apiId => 
            this.checkAPI(apiId).catch(error => {
                logger.error(`API check failed: ${apiId}`, error);
                return { apiId, error: error.message };
            })
        );

        const results = await Promise.allSettled(checkPromises);
        
        logger.info(`API status check completed: ${results.length} APIs checked`);
        this.emit('status-check-complete', results);
    }

    // Check critical APIs only
    async checkCriticalAPIs() {
        const criticalAPIs = Array.from(this.apis.entries())
            .filter(([_, api]) => api.critical)
            .map(([apiId, _]) => apiId);

        const checkPromises = criticalAPIs.map(apiId => 
            this.checkAPI(apiId).catch(error => {
                logger.error(`Critical API check failed: ${apiId}`, error);
                return { apiId, error: error.message };
            })
        );

        const results = await Promise.allSettled(checkPromises);
        
        logger.debug(`Critical API status check completed: ${results.length} APIs checked`);
        this.emit('critical-status-check-complete', results);
    }

    // Check individual API
    async checkAPI(apiId) {
        const api = this.apis.get(apiId);
        if (!api) {
            throw new Error(`API not found: ${apiId}`);
        }

        const startTime = Date.now();
        const checkId = crypto.randomUUID();

        try {
            // Simulate API check (in real implementation, this would make actual HTTP requests)
            const response = await this.simulateAPICheck(api);
            
            const responseTime = Date.now() - startTime;
            
            // Update API status
            api.status = response.status;
            api.lastCheck = new Date().toISOString();
            api.responseTime = responseTime;
            api.errorCount = 0;

            // Update health metrics
            this.updateHealthMetrics(true, responseTime);

            // Store check result
            this.statusChecks.set(checkId, {
                id: checkId,
                apiId,
                status: response.status,
                responseTime,
                timestamp: new Date().toISOString(),
                success: true
            });

            logger.debug(`API check successful: ${apiId}`, {
                status: response.status,
                responseTime: `${responseTime}ms`
            });

            this.emit('api-check-success', { apiId, status: response.status, responseTime });

            return {
                apiId,
                status: response.status,
                responseTime,
                success: true
            };

        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            // Update API status
            api.status = 'error';
            api.lastCheck = new Date().toISOString();
            api.responseTime = responseTime;
            api.errorCount++;

            // Update health metrics
            this.updateHealthMetrics(false, responseTime);

            // Store check result
            this.statusChecks.set(checkId, {
                id: checkId,
                apiId,
                status: 'error',
                responseTime,
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message
            });

            logger.warn(`API check failed: ${apiId}`, {
                error: error.message,
                responseTime: `${responseTime}ms`,
                errorCount: api.errorCount
            });

            this.emit('api-check-error', { apiId, error: error.message, responseTime });

            throw error;
        }
    }

    // Simulate API check
    async simulateAPICheck(api) {
        // Simulate network delay
        await this.simulateNetworkDelay(api.timeout);
        
        // Simulate different response scenarios
        const random = Math.random();
        
        if (random < 0.9) {
            // 90% success rate
            return {
                status: 'healthy',
                data: {
                    uptime: Math.floor(Math.random() * 86400), // Random uptime in seconds
                    memory: Math.floor(Math.random() * 100), // Random memory usage percentage
                    cpu: Math.floor(Math.random() * 100) // Random CPU usage percentage
                }
            };
        } else if (random < 0.95) {
            // 5% degraded performance
            return {
                status: 'degraded',
                data: {
                    uptime: Math.floor(Math.random() * 86400),
                    memory: Math.floor(Math.random() * 100),
                    cpu: Math.floor(Math.random() * 100)
                }
            };
        } else {
            // 5% error
            throw new Error('API temporarily unavailable');
        }
    }

    // Simulate network delay
    async simulateNetworkDelay(maxTimeout) {
        const delay = Math.floor(Math.random() * maxTimeout * 0.5); // Random delay up to half the timeout
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // Update health metrics
    updateHealthMetrics(success, responseTime) {
        this.healthMetrics.totalChecks++;
        
        if (success) {
            this.healthMetrics.successfulChecks++;
        } else {
            this.healthMetrics.failedChecks++;
        }

        // Update average response time
        this.healthMetrics.averageResponseTime = 
            (this.healthMetrics.averageResponseTime + responseTime) / 2;
    }

    // Get overall API status
    getStatus() {
        const apis = Array.from(this.apis.values());
        const criticalAPIs = apis.filter(api => api.critical);
        const healthyAPIs = apis.filter(api => api.status === 'healthy');
        const degradedAPIs = apis.filter(api => api.status === 'degraded');
        const errorAPIs = apis.filter(api => api.status === 'error');
        const criticalHealthyAPIs = criticalAPIs.filter(api => api.status === 'healthy');

        const overallStatus = this.calculateOverallStatus(apis, criticalAPIs);

        return {
            overall: {
                status: overallStatus,
                uptime: Date.now() - this.healthMetrics.uptime,
                lastCheck: new Date().toISOString()
            },
            summary: {
                total: apis.length,
                healthy: healthyAPIs.length,
                degraded: degradedAPIs.length,
                error: errorAPIs.length,
                critical: criticalAPIs.length,
                criticalHealthy: criticalHealthyAPIs.length
            },
            health: {
                ...this.healthMetrics,
                successRate: this.healthMetrics.totalChecks > 0 
                    ? (this.healthMetrics.successfulChecks / this.healthMetrics.totalChecks * 100).toFixed(2) + '%'
                    : '0%'
            },
            apis: apis.map(api => ({
                id: this.getAPIId(api),
                name: api.name,
                type: api.type,
                critical: api.critical,
                status: api.status,
                lastCheck: api.lastCheck,
                responseTime: api.responseTime,
                errorCount: api.errorCount
            }))
        };
    }

    // Calculate overall status
    calculateOverallStatus(apis, criticalAPIs) {
        const criticalHealthy = criticalAPIs.filter(api => api.status === 'healthy').length;
        const criticalTotal = criticalAPIs.length;
        
        if (criticalTotal === 0) {
            return 'unknown';
        }
        
        const criticalHealthRatio = criticalHealthy / criticalTotal;
        
        if (criticalHealthRatio === 1) {
            return 'healthy';
        } else if (criticalHealthRatio >= 0.8) {
            return 'degraded';
        } else {
            return 'error';
        }
    }

    // Get API ID from API object
    getAPIId(api) {
        for (const [id, apiObj] of this.apis.entries()) {
            if (apiObj === api) {
                return id;
            }
        }
        return 'unknown';
    }

    // Get API status by ID
    getAPIStatus(apiId) {
        const api = this.apis.get(apiId);
        if (!api) {
            return null;
        }

        return {
            id: apiId,
            name: api.name,
            type: api.type,
            critical: api.critical,
            status: api.status,
            lastCheck: api.lastCheck,
            responseTime: api.responseTime,
            errorCount: api.errorCount,
            url: api.url
        };
    }

    // Get status history
    getStatusHistory(limit = 100) {
        return Array.from(this.statusChecks.values())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    // Get critical API alerts
    getCriticalAlerts() {
        const criticalAPIs = Array.from(this.apis.entries())
            .filter(([_, api]) => api.critical)
            .map(([apiId, api]) => ({ apiId, ...api }));

        return criticalAPIs.filter(api => 
            api.status === 'error' || api.status === 'degraded'
        );
    }

    // Add custom API
    addAPI(apiId, apiConfig) {
        this.apis.set(apiId, {
            name: apiConfig.name,
            url: apiConfig.url,
            type: apiConfig.type || 'external',
            critical: apiConfig.critical || false,
            timeout: apiConfig.timeout || 5000,
            retries: apiConfig.retries || 3,
            status: 'unknown',
            lastCheck: null,
            responseTime: 0,
            errorCount: 0
        });

        logger.info(`Custom API added: ${apiId}`, apiConfig);
    }

    // Remove API
    removeAPI(apiId) {
        const removed = this.apis.delete(apiId);
        if (removed) {
            logger.info(`API removed: ${apiId}`);
        }
        return removed;
    }

    // Force check specific API
    async forceCheckAPI(apiId) {
        logger.info(`Force checking API: ${apiId}`);
        return await this.checkAPI(apiId);
    }

    // Get API statistics
    getAPIStatistics() {
        const apis = Array.from(this.apis.values());
        
        return {
            total: apis.length,
            internal: apis.filter(api => api.type === 'internal').length,
            external: apis.filter(api => api.type === 'external').length,
            critical: apis.filter(api => api.critical).length,
            healthy: apis.filter(api => api.status === 'healthy').length,
            degraded: apis.filter(api => api.status === 'degraded').length,
            error: apis.filter(api => api.status === 'error').length,
            unknown: apis.filter(api => api.status === 'unknown').length,
            averageResponseTime: apis.reduce((sum, api) => sum + api.responseTime, 0) / apis.length,
            totalErrors: apis.reduce((sum, api) => sum + api.errorCount, 0)
        };
    }

    // Cleanup
    async cleanup() {
        this.apis.clear();
        this.statusChecks.clear();
        logger.info('API Status cleanup completed');
    }
}

// Create and export instance
const apiStatus = new APIStatus();

module.exports = apiStatus;
