// Safe Operations Wrapper - Uses monitoring system for all operations
const monitoringSystem = require('./monitoring-system');
const fs = require('fs').promises;
const path = require('path');

class SafeOperations {
    constructor() {
        this.monitor = monitoringSystem;
        this.operationCounter = 0;
    }

    // Generate unique operation ID
    generateOperationId(prefix = 'op') {
        return `${prefix}_${++this.operationCounter}_${Date.now()}`;
    }

    // Safe file operations
    async readFile(filePath, options = {}) {
        const operationId = this.generateOperationId('readFile');
        return this.monitor.monitorOperation(operationId, async () => {
            return await fs.readFile(filePath, options);
        }, { timeout: 10000 });
    }

    async writeFile(filePath, data, options = {}) {
        const operationId = this.generateOperationId('writeFile');
        return this.monitor.monitorOperation(operationId, async () => {
            return await fs.writeFile(filePath, data, options);
        }, { timeout: 15000 });
    }

    async mkdir(dirPath, options = {}) {
        const operationId = this.generateOperationId('mkdir');
        return this.monitor.monitorOperation(operationId, async () => {
            return await fs.mkdir(dirPath, { recursive: true, ...options });
        }, { timeout: 10000 });
    }

    // Safe network operations
    async fetch(url, options = {}) {
        const operationId = this.generateOperationId('fetch');
        return this.monitor.monitorOperation(operationId, async () => {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response;
        }, { timeout: 60000 });
    }

    // Safe process operations
    async executeCommand(command, args = [], options = {}) {
        const operationId = this.generateOperationId('executeCommand');
        return this.monitor.monitorOperation(operationId, () => {
            return new Promise((resolve, reject) => {
                const { spawn } = require('child_process');
                const process = spawn(command, args, {
                    stdio: 'pipe',
                    shell: true,
                    ...options
                });

                let output = '';
                let errorOutput = '';

                process.stdout.on('data', (data) => {
                    output += data.toString();
                });

                process.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                process.on('close', (code) => {
                    if (code === 0) {
                        resolve({ output, error: errorOutput, exitCode: code });
                    } else {
                        reject(new Error(`Process failed with exit code ${code}: ${errorOutput}`));
                    }
                });

                process.on('error', (error) => {
                    reject(error);
                });
            });
        }, { timeout: 60000, ...options });
    }

    // Get monitoring status
    getStatus() {
        return this.monitor.getStatus();
    }

    // Kill all operations
    killAll() {
        this.monitor.killAllOperations();
    }

    // Wait for all operations to complete
    async waitForCompletion(timeout = 60000) {
        const startTime = Date.now();
        
        while (this.monitor.activeOperations.size > 0) {
            if (Date.now() - startTime > timeout) {
                throw new Error('Timeout waiting for operations to complete');
            }
            await this.monitor.sleep(1000);
        }
    }
}

// Create global instance
const safeOperations = new SafeOperations();

module.exports = safeOperations;
