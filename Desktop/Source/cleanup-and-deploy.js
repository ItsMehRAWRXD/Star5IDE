#!/usr/bin/env node

// RawrZ Security Platform - Cleanup and Deploy Script
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeploymentManager {
    constructor() {
        this.isWindows = process.platform === 'win32';
        this.cleanupCommands = [];
        this.deploymentSteps = [];
    }

    // Kill all Node processes (clean camp site)
    async killAllNodeProcesses() {
        console.log('[CLEANUP] Killing all Node processes...');
        
        return new Promise((resolve, reject) => {
            const command = this.isWindows ? 'taskkill /IM node.exe /F' : 'pkill -f node';
            
            exec(command, (error, stdout, stderr) => {
                if (error && !error.message.includes('not found') && !error.message.includes('No tasks')) {
                    console.log('[CLEANUP] Some processes may not exist (this is normal)');
                }
                
                console.log('[CLEANUP] Node processes terminated');
                setTimeout(() => resolve(), 2000); // Wait 2 seconds for cleanup
            });
        });
    }

    // Check for port conflicts
    async checkPortConflicts(port = 3001) {
        console.log(`[CHECK] Checking port ${port} conflicts...`);
        
        return new Promise((resolve) => {
            const command = this.isWindows 
                ? `netstat -ano | findstr :${port}`
                : `lsof -i :${port}`;
            
            exec(command, (error, stdout, stderr) => {
                if (stdout && stdout.trim()) {
                    console.log(`[WARN] Port ${port} is in use:`);
                    console.log(stdout);
                    resolve(true);
                } else {
                    console.log(`[OK] Port ${port} is available`);
                    resolve(false);
                }
            });
        });
    }

    // Clean up temporary files
    async cleanupTempFiles() {
        console.log('[CLEANUP] Cleaning temporary files...');
        
        const tempDirs = [
            './logs',
            './tmp',
            './temp',
            './.cache'
        ];

        for (const dir of tempDirs) {
            if (fs.existsSync(dir)) {
                try {
                    const files = fs.readdirSync(dir);
                    files.forEach(file => {
                        const filePath = path.join(dir, file);
                        const stat = fs.statSync(filePath);
                        
                        // Delete files older than 1 hour
                        if (Date.now() - stat.mtime.getTime() > 3600000) {
                            fs.unlinkSync(filePath);
                            console.log(`[CLEANUP] Deleted old file: ${filePath}`);
                        }
                    });
                } catch (error) {
                    console.log(`[CLEANUP] Could not clean ${dir}: ${error.message}`);
                }
            }
        }
    }

    // Validate deployment files
    async validateDeploymentFiles() {
        console.log('[VALIDATE] Checking deployment files...');
        
        const requiredFiles = [
            'package.json',
            'src/app.js',
            'app-spec.yaml'
        ];

        const missingFiles = [];
        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                missingFiles.push(file);
            }
        }

        if (missingFiles.length > 0) {
            console.log('[ERROR] Missing required files:', missingFiles);
            return false;
        }

        console.log('[OK] All required files present');
        return true;
    }

    // Install dependencies
    async installDependencies() {
        console.log('[INSTALL] Installing dependencies...');
        
        return new Promise((resolve, reject) => {
            exec('npm install --production', (error, stdout, stderr) => {
                if (error) {
                    console.log('[ERROR] Failed to install dependencies:', error.message);
                    reject(error);
                } else {
                    console.log('[OK] Dependencies installed');
                    resolve();
                }
            });
        });
    }

    // Start the application
    async startApplication() {
        console.log('[START] Starting RawrZ Security Platform...');
        
        return new Promise((resolve, reject) => {
            const child = spawn('node', ['src/app.js'], {
                stdio: 'inherit',
                detached: false
            });

            child.on('error', (error) => {
                console.log('[ERROR] Failed to start application:', error.message);
                reject(error);
            });

            child.on('spawn', () => {
                console.log('[OK] Application started successfully');
                console.log('[INFO] PID:', child.pid);
                resolve(child);
            });

            // Handle graceful shutdown
            process.on('SIGINT', () => {
                console.log('[SHUTDOWN] Gracefully shutting down...');
                child.kill('SIGINT');
                process.exit(0);
            });
        });
    }

    // Monitor application health
    async monitorHealth(port = 3001) {
        console.log('[MONITOR] Starting health monitoring...');
        
        const healthCheck = () => {
            const http = require('http');
            const options = {
                hostname: 'localhost',
                port: port,
                path: '/health',
                method: 'GET',
                timeout: 5000
            };

            const req = http.request(options, (res) => {
                if (res.statusCode === 200) {
                    console.log('[HEALTH] Application is healthy');
                } else {
                    console.log(`[WARN] Health check returned status: ${res.statusCode}`);
                }
            });

            req.on('error', (error) => {
                console.log('[WARN] Health check failed:', error.message);
            });

            req.on('timeout', () => {
                console.log('[WARN] Health check timeout');
                req.destroy();
            });

            req.end();
        };

        // Initial health check after 10 seconds
        setTimeout(healthCheck, 10000);
        
        // Periodic health checks every 30 seconds
        setInterval(healthCheck, 30000);
    }

    // Main deployment process
    async deploy() {
        console.log('[START] RawrZ Security Platform - Clean Deployment\n');
        
        try {
            // Step 1: Clean camp site
            console.log('=== STEP 1: CLEAN CAMP SITE ===');
            await this.killAllNodeProcesses();
            await this.cleanupTempFiles();
            
            // Step 2: Check environment
            console.log('\n=== STEP 2: ENVIRONMENT CHECK ===');
            const portInUse = await this.checkPortConflicts();
            if (portInUse) {
                console.log('[WARN] Port 3001 is in use, but continuing...');
            }
            
            // Step 3: Validate files
            console.log('\n=== STEP 3: VALIDATE FILES ===');
            const filesValid = await this.validateDeploymentFiles();
            if (!filesValid) {
                throw new Error('Deployment validation failed');
            }
            
            // Step 4: Install dependencies
            console.log('\n=== STEP 4: INSTALL DEPENDENCIES ===');
            await this.installDependencies();
            
            // Step 5: Start application
            console.log('\n=== STEP 5: START APPLICATION ===');
            const appProcess = await this.startApplication();
            
            // Step 6: Monitor health
            console.log('\n=== STEP 6: HEALTH MONITORING ===');
            await this.monitorHealth();
            
            console.log('\n[OK] DEPLOYMENT COMPLETE!');
            console.log('[STATUS] Application running on port 3001');
            console.log('[SEARCH] Health check: http://localhost:3001/health');
            console.log('[LOG] Logs: ./logs/');
            console.log('\nPress Ctrl+C to stop the application');
            
        } catch (error) {
            console.log('\n[ERROR] DEPLOYMENT FAILED!');
            console.log('Error:', error.message);
            process.exit(1);
        }
    }
}

// Run deployment if called directly
if (require.main === module) {
    const deployer = new DeploymentManager();
    deployer.deploy();
}

module.exports = DeploymentManager;
