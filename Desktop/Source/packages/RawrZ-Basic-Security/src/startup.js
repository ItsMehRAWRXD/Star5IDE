#!/usr/bin/env node

const { logger } = require('./utils/logger');
const { processMonitor } = require('./middleware/processMonitor');
const { healthChecker } = require('./middleware/healthCheck');

// Startup script with comprehensive monitoring
class StartupManager {
  constructor() {
    this.startTime = Date.now();
    this.isRunning = true;
    this.restartCount = 0;
    this.maxRestarts = 5;
    
    this.setupStartupMonitoring();
    this.setupProcessHandlers();
  }

  // Setup startup monitoring
  setupStartupMonitoring() {
    logger.info('Starting RawrZ Security Platform...');
    
    // Monitor startup process
    const startupInterval = setInterval(() => {
      if (this.isRunning) {
        const uptime = Date.now() - this.startTime;
        logger.info(`Platform running for ${Math.round(uptime / 1000)}s`);
        
        // Log system status every 5 minutes
        if (uptime % 300000 < 5000) {
          const status = processMonitor.getStatus();
          logger.info('System status', status);
        }
      }
    }, 30000); // Every 30 seconds

    // Store interval for cleanup
    this.startupInterval = startupInterval;
  }

  // Setup process handlers
  setupProcessHandlers() {
    // Handle process exit
    process.on('exit', (code) => {
      logger.info(`Process exiting with code ${code}`);
      this.cleanup();
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception in startup', error);
      this.handleCriticalError(error);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection in startup', { reason, promise });
      this.handleCriticalError(reason);
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      this.gracefulShutdown();
    });

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      this.gracefulShutdown();
    });

    // Handle SIGUSR2 (nodemon restart)
    process.on('SIGUSR2', () => {
      logger.info('Received SIGUSR2, restarting...');
      this.restart();
    });
  }

  // Handle critical errors
  handleCriticalError(error) {
    logger.error('Critical error detected', error);
    
    // Log final state
    const errorState = {
      uptime: Date.now() - this.startTime,
      restartCount: this.restartCount,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    logger.error('Error state', errorState);

    // Attempt restart if under limit
    if (this.restartCount < this.maxRestarts) {
      logger.info(`Attempting restart ${this.restartCount + 1}/${this.maxRestarts}`);
      this.restart();
    } else {
      logger.error('Max restarts reached, exiting...');
      this.forceExit();
    }
  }

  // Graceful shutdown
  async gracefulShutdown() {
    if (!this.isRunning) {
      logger.warn('Shutdown already in progress');
      return;
    }

    this.isRunning = false;
    logger.info('Starting graceful shutdown...');

    try {
      // Stop startup monitoring
      if (this.startupInterval) {
        clearInterval(this.startupInterval);
        logger.info('Startup monitoring stopped');
      }

      // Get final health status
      const finalHealth = healthChecker.getHealthStatus();
      logger.info('Final health status', finalHealth);

      // Get final system status
      const finalStatus = processMonitor.getStatus();
      logger.info('Final system status', finalStatus);

      // Log shutdown completion
      const shutdownTime = Date.now() - this.startTime;
      logger.info(`Graceful shutdown completed after ${Math.round(shutdownTime / 1000)}s`);

      // Exit process
      process.exit(0);

    } catch (error) {
      logger.error('Error during graceful shutdown', error);
      this.forceExit();
    }
  }

  // Restart process
  restart() {
    this.restartCount++;
    logger.info(`Restarting process (attempt ${this.restartCount})`);
    
    // Cleanup current instance
    this.cleanup();
    
    // Restart
    setTimeout(() => {
      process.exit(0); // Let process manager restart
    }, 1000);
  }

  // Force exit
  forceExit() {
    logger.error('Force exiting process...');
    this.cleanup();
    process.exit(1);
  }

  // Cleanup resources
  cleanup() {
    logger.info('Cleaning up resources...');
    
    // Clear intervals
    if (this.startupInterval) {
      clearInterval(this.startupInterval);
    }

    // Log final metrics
    const finalMetrics = {
      uptime: Date.now() - this.startTime,
      restartCount: this.restartCount,
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };

    logger.info('Final metrics', finalMetrics);
    logger.info('Cleanup completed');
  }

  // Get startup status
  getStatus() {
    return {
      isRunning: this.isRunning,
      uptime: Date.now() - this.startTime,
      restartCount: this.restartCount,
      maxRestarts: this.maxRestarts,
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
}

// Create startup manager instance
const startupManager = new StartupManager();

// Export for use in other modules
module.exports = {
  StartupManager,
  startupManager
};

// Log startup completion
logger.info('Startup manager initialized');
logger.info('RawrZ Security Platform startup monitoring active');
