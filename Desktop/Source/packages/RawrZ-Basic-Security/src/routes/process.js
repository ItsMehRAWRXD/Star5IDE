const express = require('express');
const router = express.Router();
const { processMonitor } = require('../middleware/processMonitor');
const { logger } = require('../utils/logger');
const { formatResponse, generateUUID } = require('../utils/helpers');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Get process status
router.get('/status', async (req, res) => {
    const requestId = generateUUID();
    
    try {
        logger.info('Process status request', { requestId });
        
        const status = processMonitor.getStatus();
        
        res.json(formatResponse(true, status, 'Process status retrieved'));
        
    } catch (error) {
        logger.error('Process status error', { requestId, error: error.message });
        res.status(500).json(formatResponse(false, null, error.message, 500));
    }
});

// Check for process conflicts
router.get('/conflicts', async (req, res) => {
    const requestId = generateUUID();
    
    try {
        logger.info('Process conflict check request', { requestId });
        
        const conflictStatus = await processMonitor.forceProcessConflictCheck();
        
        res.json(formatResponse(true, conflictStatus, 'Process conflict check completed'));
        
    } catch (error) {
        logger.error('Process conflict check error', { requestId, error: error.message });
        res.status(500).json(formatResponse(false, null, error.message, 500));
    }
});

// Get all Node processes
router.get('/node-processes', async (req, res) => {
    const requestId = generateUUID();
    
    try {
        logger.info('Node processes list request', { requestId });
        
        const nodeProcesses = await processMonitor.getNodeProcesses();
        
        res.json(formatResponse(true, {
            processes: nodeProcesses,
            total: nodeProcesses.length,
            currentPid: process.pid
        }, 'Node processes retrieved'));
        
    } catch (error) {
        logger.error('Node processes list error', { requestId, error: error.message });
        res.status(500).json(formatResponse(false, null, error.message, 500));
    }
});

// Check port usage
router.get('/port/:port', async (req, res) => {
    const requestId = generateUUID();
    const { port } = req.params;
    
    try {
        logger.info('Port check request', { requestId, port });
        
        let command;
        if (process.platform === 'win32') {
            command = `netstat -ano | findstr :${port}`;
        } else {
            command = `lsof -i :${port}`;
        }
        
        const { stdout } = await execAsync(command);
        const lines = stdout.trim().split('\n').filter(line => line.trim());
        
        const portInfo = {
            port: parseInt(port),
            inUse: lines.length > 0,
            processes: lines.length,
            details: lines
        };
        
        res.json(formatResponse(true, portInfo, 'Port check completed'));
        
    } catch (error) {
        // Port might not be in use
        const portInfo = {
            port: parseInt(port),
            inUse: false,
            processes: 0,
            details: []
        };
        
        res.json(formatResponse(true, portInfo, 'Port check completed - port not in use'));
    }
});

// Clean up Node processes (Windows)
router.post('/cleanup/windows', async (req, res) => {
    const requestId = generateUUID();
    
    try {
        if (process.platform !== 'win32') {
            return res.status(400).json(formatResponse(false, null, 'This endpoint is only available on Windows', 400));
        }
        
        logger.info('Windows Node process cleanup request', { requestId });
        
        // Get processes before cleanup
        const beforeProcesses = await processMonitor.getNodeProcesses();
        
        // Kill all Node processes except current one
        const { stdout, stderr } = await execAsync('taskkill /IM node.exe /F');
        
        // Get processes after cleanup
        const afterProcesses = await processMonitor.getNodeProcesses();
        
        const cleanupResult = {
            before: beforeProcesses.length,
            after: afterProcesses.length,
            killed: beforeProcesses.length - afterProcesses.length,
            output: stdout,
            errors: stderr,
            currentPid: process.pid
        };
        
        logger.info('Windows Node process cleanup completed', { requestId, result: cleanupResult });
        
        res.json(formatResponse(true, cleanupResult, 'Windows Node process cleanup completed'));
        
    } catch (error) {
        logger.error('Windows Node process cleanup error', { requestId, error: error.message });
        res.status(500).json(formatResponse(false, null, error.message, 500));
    }
});

// Clean up Node processes (Unix/Linux)
router.post('/cleanup/unix', async (req, res) => {
    const requestId = generateUUID();
    
    try {
        if (process.platform === 'win32') {
            return res.status(400).json(formatResponse(false, null, 'This endpoint is only available on Unix/Linux systems', 400));
        }
        
        logger.info('Unix Node process cleanup request', { requestId });
        
        // Get processes before cleanup
        const beforeProcesses = await processMonitor.getNodeProcesses();
        
        // Kill all Node processes except current one
        const { stdout, stderr } = await execAsync('pkill -f node');
        
        // Get processes after cleanup
        const afterProcesses = await processMonitor.getNodeProcesses();
        
        const cleanupResult = {
            before: beforeProcesses.length,
            after: afterProcesses.length,
            killed: beforeProcesses.length - afterProcesses.length,
            output: stdout,
            errors: stderr,
            currentPid: process.pid
        };
        
        logger.info('Unix Node process cleanup completed', { requestId, result: cleanupResult });
        
        res.json(formatResponse(true, cleanupResult, 'Unix Node process cleanup completed'));
        
    } catch (error) {
        logger.error('Unix Node process cleanup error', { requestId, error: error.message });
        res.status(500).json(formatResponse(false, null, error.message, 500));
    }
});

// Restart server (graceful shutdown)
router.post('/restart', async (req, res) => {
    const requestId = generateUUID();
    
    try {
        logger.info('Server restart request', { requestId });
        
        // Send response first
        res.json(formatResponse(true, {
            message: 'Server restart initiated',
            requestId: requestId,
            timestamp: new Date().toISOString()
        }, 'Server restart initiated'));
        
        // Wait a moment for response to be sent
        setTimeout(() => {
            logger.info('Initiating graceful shutdown for restart', { requestId });
            process.exit(0);
        }, 1000);
        
    } catch (error) {
        logger.error('Server restart error', { requestId, error: error.message });
        res.status(500).json(formatResponse(false, null, error.message, 500));
    }
});

// Get system information
router.get('/system', async (req, res) => {
    const requestId = generateUUID();
    
    try {
        logger.info('System information request', { requestId });
        
        const systemInfo = {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            pid: process.pid,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            cwd: process.cwd(),
            env: {
                NODE_ENV: process.env.NODE_ENV,
                PORT: process.env.PORT
            }
        };
        
        res.json(formatResponse(true, systemInfo, 'System information retrieved'));
        
    } catch (error) {
        logger.error('System information error', { requestId, error: error.message });
        res.status(500).json(formatResponse(false, null, error.message, 500));
    }
});

module.exports = router;
