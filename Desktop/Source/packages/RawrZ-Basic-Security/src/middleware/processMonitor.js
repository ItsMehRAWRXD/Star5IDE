const { logger } = require('../utils/logger');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Process monitoring and management
class ProcessMonitor {
  constructor() {
    this.startTime = Date.now();
    this.isShuttingDown = false;
    this.activeConnections = new Set();
    this.keepAliveInterval = null;
    this.monitoringInterval = null;
    this.processCheckInterval = null;
    this.nodeProcesses = new Map();
    this.processConflictDetected = false;
    this.currentPid = process.pid;
    
    this.startMonitoring();
    this.setupKeepAlive();
    this.setupGracefulShutdown();
    this.startProcessConflictDetection();
  }

  // Start continuous process monitoring
  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.monitorSystemHealth();
    }, 5000); // Monitor every 5 seconds

    logger.info('Process monitoring started');
  }

  // Start process conflict detection
  startProcessConflictDetection() {
    this.processCheckInterval = setInterval(() => {
      this.detectNodeProcessConflicts();
    }, 10000); // Check every 10 seconds

    logger.info('Process conflict detection started');
  }

  // Detect multiple Node processes
  async detectNodeProcessConflicts() {
    try {
      const nodeProcesses = await this.getNodeProcesses();
      const otherNodeProcesses = nodeProcesses.filter(proc => proc.pid !== this.currentPid);
      
      if (otherNodeProcesses.length > 0) {
        this.processConflictDetected = true;
        logger.warn('Multiple Node processes detected', {
          currentPid: this.currentPid,
          otherProcesses: otherNodeProcesses,
          totalNodeProcesses: nodeProcesses.length
        });
        
        // Check if any are using the same port
        await this.checkPortConflicts(otherNodeProcesses);
      } else {
        this.processConflictDetected = false;
      }
      
      this.nodeProcesses = new Map(nodeProcesses.map(proc => [proc.pid, proc]));
      
    } catch (error) {
      logger.error('Failed to detect Node process conflicts', error);
    }
  }

  // Get all Node processes
  async getNodeProcesses() {
    try {
      let command;
      if (process.platform === 'win32') {
        command = 'powershell -Command "Get-Process | Where-Object {$_.ProcessName -like \'*node*\'} | Select-Object Id,ProcessName,CPU,WorkingSet,StartTime | ConvertTo-Json"';
      } else {
        command = 'ps aux | grep node | grep -v grep | awk \'{print $2, $11, $3, $4, $9}\'';
      }
      
      const { stdout } = await execAsync(command);
      
      if (process.platform === 'win32') {
        const processes = JSON.parse(stdout);
        return Array.isArray(processes) ? processes.map(proc => ({
          pid: proc.Id,
          name: proc.ProcessName,
          cpu: proc.CPU,
          memory: proc.WorkingSet,
          startTime: proc.StartTime
        })) : [];
      } else {
        const lines = stdout.trim().split('\n').filter(line => line.trim());
        return lines.map(line => {
          const parts = line.split(' ');
          return {
            pid: parseInt(parts[0]),
            name: parts[1],
            cpu: parseFloat(parts[2]),
            memory: parseFloat(parts[3]),
            startTime: parts[4]
          };
        });
      }
    } catch (error) {
      logger.error('Failed to get Node processes', error);
      return [];
    }
  }

  // Check for port conflicts
  async checkPortConflicts(nodeProcesses) {
    try {
      const port = process.env.PORT || 3001;
      let command;
      
      if (process.platform === 'win32') {
        command = `netstat -ano | findstr :${port}`;
      } else {
        command = `lsof -i :${port}`;
      }
      
      const { stdout } = await execAsync(command);
      const lines = stdout.trim().split('\n').filter(line => line.trim());
      
      if (lines.length > 1) {
        logger.warn('Port conflict detected', {
          port: port,
          conflictingProcesses: lines.length - 1,
          currentPid: this.currentPid
        });
        
        // Suggest cleanup
        this.suggestProcessCleanup(nodeProcesses);
      }
      
    } catch (error) {
      // Port might not be in use, which is fine
      logger.debug('Port check completed', { port: process.env.PORT || 3001 });
    }
  }

  // Suggest process cleanup
  suggestProcessCleanup(nodeProcesses) {
    logger.warn('Process cleanup suggested', {
      message: 'Multiple Node processes detected. Consider running cleanup commands:',
      windows: 'taskkill /IM node.exe /F',
      unix: 'pkill -f node',
      processes: nodeProcesses.map(proc => ({
        pid: proc.pid,
        name: proc.name,
        memory: proc.memory
      }))
    });
  }

  // Get process conflict status
  getProcessConflictStatus() {
    return {
      conflictDetected: this.processConflictDetected,
      currentPid: this.currentPid,
      nodeProcesses: Array.from(this.nodeProcesses.values()),
      totalNodeProcesses: this.nodeProcesses.size,
      timestamp: new Date().toISOString()
    };
  }

  // Force process conflict check
  async forceProcessConflictCheck() {
    await this.detectNodeProcessConflicts();
    return this.getProcessConflictStatus();
  }

  // Monitor system health
  monitorSystemHealth() {
    try {
      const memory = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const uptime = Date.now() - this.startTime;
      
      // System metrics
      const systemMetrics = {
        uptime: uptime,
        memory: {
          rss: Math.round(memory.rss / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + ' MB',
          external: Math.round(memory.external / 1024 / 1024) + ' MB'
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        loadAverage: os.loadavg(),
        freeMemory: Math.round(os.freemem() / 1024 / 1024) + ' MB',
        totalMemory: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
        activeConnections: this.activeConnections.size,
        isShuttingDown: this.isShuttingDown
      };

      // Log metrics every minute
      if (uptime % 60000 < 5000) {
        logger.info('System metrics', systemMetrics);
      }

      // Check for potential issues
      this.checkSystemHealth(systemMetrics);

    } catch (error) {
      logger.error('System monitoring failed', error);
    }
  }

  // Check system health and take action if needed
  checkSystemHealth(metrics) {
    const memoryUsagePercent = (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;
    
    // Memory usage warning
    if (memoryUsagePercent > 85) {
      logger.warn('High memory usage detected', {
        usage: Math.round(memoryUsagePercent) + '%',
        heapUsed: metrics.memory.heapUsed,
        heapTotal: metrics.memory.heapTotal
      });
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        logger.info('Garbage collection triggered due to high memory usage');
      }
    }

    // Load average warning
    const loadAverage = metrics.loadAverage[0];
    if (loadAverage > os.cpus().length * 0.8) {
      logger.warn('High system load detected', {
        loadAverage: loadAverage,
        cpuCount: os.cpus().length
      });
    }

    // Free memory warning
    const freeMemoryMB = parseInt(metrics.freeMemory);
    if (freeMemoryMB < 100) {
      logger.warn('Low system memory', {
        freeMemory: metrics.freeMemory,
        totalMemory: metrics.totalMemory
      });
    }
  }

  // Setup keep-alive mechanism
  setupKeepAlive() {
    this.keepAliveInterval = setInterval(() => {
      if (!this.isShuttingDown) {
        // Send keep-alive signal
        process.send && process.send({ type: 'keep-alive', timestamp: Date.now() });
        logger.debug('Keep-alive signal sent');
      }
    }, 30000); // Every 30 seconds

    logger.info('Keep-alive mechanism started');
  }

  // Setup graceful shutdown
  setupGracefulShutdown() {
    // Handle different shutdown signals
    const shutdownSignals = ['SIGTERM', 'SIGINT', 'SIGUSR2', 'SIGQUIT'];
    
    shutdownSignals.forEach(signal => {
      process.on(signal, () => {
        logger.info(`Received ${signal}, initiating graceful shutdown...`);
        this.gracefulShutdown(signal);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception detected', error);
      this.handleCriticalError(error);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection detected', { reason, promise });
      this.handleCriticalError(reason);
    });

    logger.info('Graceful shutdown handlers registered');
  }

  // Graceful shutdown process
  async gracefulShutdown(signal) {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress, ignoring signal');
      return;
    }

    this.isShuttingDown = true;
    logger.info('Starting graceful shutdown process...');

    try {
      // Stop monitoring
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        logger.info('Monitoring stopped');
      }

      if (this.keepAliveInterval) {
        clearInterval(this.keepAliveInterval);
        logger.info('Keep-alive stopped');
      }

      if (this.processCheckInterval) {
        clearInterval(this.processCheckInterval);
        logger.info('Process conflict detection stopped');
      }

      // Wait for active connections to close
      if (this.activeConnections.size > 0) {
        logger.info(`Waiting for ${this.activeConnections.size} active connections to close...`);
        
        // Wait up to 30 seconds for connections to close
        let waitTime = 0;
        while (this.activeConnections.size > 0 && waitTime < 30000) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          waitTime += 1000;
        }

        if (this.activeConnections.size > 0) {
          logger.warn(`Force closing ${this.activeConnections.size} remaining connections`);
        }
      }

      // Final system metrics
      const finalMetrics = {
        uptime: Date.now() - this.startTime,
        memory: process.memoryUsage(),
        signal: signal,
        timestamp: new Date().toISOString()
      };

      logger.info('Final system metrics', finalMetrics);
      logger.info('Graceful shutdown completed');

      // Exit process
      process.exit(0);

    } catch (error) {
      logger.error('Error during graceful shutdown', error);
      process.exit(1);
    }
  }

  // Handle critical errors
  handleCriticalError(error) {
    logger.error('Critical error detected', error);
    
    // Log final state
    const errorMetrics = {
      uptime: Date.now() - this.startTime,
      memory: process.memoryUsage(),
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    logger.error('Error metrics', errorMetrics);

    // Don't exit immediately, try to continue
    logger.info('Attempting to continue despite critical error...');
  }

  // Track active connection
  trackConnection(connection) {
    this.activeConnections.add(connection);
    logger.debug(`Connection tracked, total: ${this.activeConnections.size}`);
  }

  // Untrack connection
  untrackConnection(connection) {
    this.activeConnections.delete(connection);
    logger.debug(`Connection untracked, total: ${this.activeConnections.size}`);
  }

  // Get current status
  getStatus() {
    return {
      uptime: Date.now() - this.startTime,
      isShuttingDown: this.isShuttingDown,
      activeConnections: this.activeConnections.size,
      memory: process.memoryUsage(),
      loadAverage: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      processConflicts: this.getProcessConflictStatus()
    };
  }

  // Force health check
  forceHealthCheck() {
    this.monitorSystemHealth();
    return this.getStatus();
  }
}

// Create global process monitor instance
const processMonitor = new ProcessMonitor();

// Middleware to track connections
const connectionTrackingMiddleware = (req, res, next) => {
  const connectionId = `${req.ip}-${Date.now()}`;
  
  // Track connection
  processMonitor.trackConnection(connectionId);
  
  // Untrack on response end
  res.on('finish', () => {
    processMonitor.untrackConnection(connectionId);
  });

  res.on('close', () => {
    processMonitor.untrackConnection(connectionId);
  });

  next();
};

module.exports = {
  ProcessMonitor,
  processMonitor,
  connectionTrackingMiddleware
};
