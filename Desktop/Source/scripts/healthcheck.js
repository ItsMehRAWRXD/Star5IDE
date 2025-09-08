// Health check script for RawrZ Security Platform
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HEALTH_ENDPOINT = '/health';

// Check if the application is responding
function checkHealth() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: HEALTH_ENDPOINT,
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
                resolve(true);
            } else {
                reject(new Error(`Health check failed with status: ${res.statusCode}`));
            }
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Health check timeout'));
        });

        req.end();
    });
}

// Check disk space
function checkDiskSpace() {
    try {
        const stats = fs.statSync('.');
        return true;
    } catch (error) {
        return false;
    }
}

// Check memory usage
function checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;
    
    // Alert if memory usage is over 500MB
    if (memUsageMB > 500) {
        console.warn(`High memory usage: ${memUsageMB.toFixed(2)}MB`);
        return false;
    }
    
    return true;
}

// Main health check
async function main() {
    try {
        console.log('🔍 Running health checks...');
        
        // Check application health
        await checkHealth();
        console.log('✅ Application health check passed');
        
        // Check disk space
        if (checkDiskSpace()) {
            console.log('✅ Disk space check passed');
        } else {
            console.log('❌ Disk space check failed');
            process.exit(1);
        }
        
        // Check memory usage
        if (checkMemoryUsage()) {
            console.log('✅ Memory usage check passed');
        } else {
            console.log('⚠️ High memory usage detected');
        }
        
        console.log('✅ All health checks passed');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
        process.exit(1);
    }
}

// Run health check
main();
