// Global Jest setup file
'use strict';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PS_BRIDGE_LOG_LEVEL = 'error'; // Reduce log noise during tests
process.env.PS_BRIDGE_REDACT = 'false'; // Allow full data in tests for debugging

// Global test utilities
global.testUtils = {
  // Create a temporary directory for tests
  createTempDir: async () => {
    const fs = require('fs').promises;
    const path = require('path');
    const os = require('os');
    
    const tempDir = path.join(os.tmpdir(), `jest-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  },
  
  // Clean up temporary directory
  cleanupTempDir: async (tempDir) => {
    const fs = require('fs').promises;
    try {
      await fs.rmdir(tempDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  },
  
  // Wait for a specified amount of time
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Create a mock PowerShell script
  createMockScript: (content) => {
    const fs = require('fs').promises;
    const path = require('path');
    const os = require('os');
    
    return async (scriptName = 'test.ps1') => {
      const tempDir = path.join(os.tmpdir(), `jest-script-${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });
      
      const scriptPath = path.join(tempDir, scriptName);
      await fs.writeFile(scriptPath, content, 'utf8');
      
      return { scriptPath, tempDir };
    };
  },
  
  // Mock child_process.spawn for consistent testing
  mockSpawn: (mockProcess) => {
    const { spawn } = require('child_process');
    jest.mocked(spawn).mockReturnValue(mockProcess);
  },
  
  // Create a mock process for testing
  createMockProcess: (options = {}) => {
    const {
      exitCode = 0,
      stdout = '',
      stderr = '',
      delay = 0
    } = options;
    
    const mockProcess = {
      stdout: { 
        setEncoding: jest.fn(), 
        on: jest.fn() 
      },
      stderr: { 
        setEncoding: jest.fn(), 
        on: jest.fn() 
      },
      on: jest.fn(),
      kill: jest.fn()
    };
    
    // Set up event handlers
    mockProcess.on.mockImplementation((event, callback) => {
      if (event === 'close') {
        setTimeout(() => callback(exitCode), delay);
      }
    });
    
    mockProcess.stdout.on.mockImplementation((event, callback) => {
      if (event === 'data' && stdout) {
        setTimeout(() => callback(stdout), delay);
      }
    });
    
    mockProcess.stderr.on.mockImplementation((event, callback) => {
      if (event === 'data' && stderr) {
        setTimeout(() => callback(stderr), delay);
      }
    });
    
    return mockProcess;
  }
};

// Suppress console logs during tests unless explicitly enabled
const originalConsole = { ...console };
if (process.env.JEST_VERBOSE !== 'true') {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
}

// Restore console for specific tests if needed
global.restoreConsole = () => {
  Object.assign(console, originalConsole);
};

// Global test timeout
jest.setTimeout(30000);

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests
});

// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in tests
});

// Clean up after all tests
afterAll(async () => {
  // Clean up any remaining temporary files
  const fs = require('fs').promises;
  const path = require('path');
  const os = require('os');
  
  try {
    const tempDir = os.tmpdir();
    const entries = await fs.readdir(tempDir);
    
    for (const entry of entries) {
      if (entry.startsWith('jest-') || entry.startsWith('psbridge-test-')) {
        const fullPath = path.join(tempDir, entry);
        try {
          await fs.rmdir(fullPath, { recursive: true });
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  } catch (error) {
    // Ignore cleanup errors
  }
});
