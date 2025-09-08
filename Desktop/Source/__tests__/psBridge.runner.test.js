'use strict';

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Mock child_process.spawn to avoid real PowerShell execution in unit tests
jest.mock('child_process');

// Mock the error classification and handler modules
jest.mock('../psBridge.security', () => ({
  sanitizeNamedParams: jest.fn((params) => params),
  redact: jest.fn((data) => data)
}));

jest.mock('../PowerShellErrors', () => ({
  ExecutionPolicyError: class extends Error {
    constructor(message) {
      super(message);
      this.name = 'ExecutionPolicyError';
      this.code = 'EXECUTION_POLICY_ERROR';
    }
  },
  PermissionError: class extends Error {
    constructor(message) {
      super(message);
      this.name = 'PermissionError';
      this.code = 'PERMISSION_ERROR';
    }
  },
  DependencyError: class extends Error {
    constructor(message) {
      super(message);
      this.name = 'DependencyError';
      this.code = 'DEPENDENCY_ERROR';
    }
  },
  PowerShellError: class extends Error {
    constructor(message) {
      super(message);
      this.name = 'PowerShellError';
      this.code = 'POWERSHELL_ERROR';
    }
  }
}));

jest.mock('../PowerShellErrorHandler', () => ({
  analyzeError: jest.fn((error) => ({
    type: 'PowerShellError',
    code: 'POWERSHELL_ERROR',
    message: error.message
  }))
}));

jest.mock('../classifyAndThrow', () => ({
  classifyAndThrow: jest.fn((error) => {
    throw error;
  })
}));

// Import the module under test after mocking
const { runScript, runScriptWithFiles } = require('../psBridge');

describe('PowerShell Bridge Runner', () => {
  let mockSpawn;
  let mockProcess;
  let tempDir;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a mock process
    mockProcess = {
      stdout: { setEncoding: jest.fn(), on: jest.fn() },
      stderr: { setEncoding: jest.fn(), on: jest.fn() },
      on: jest.fn(),
      kill: jest.fn()
    };

    // Mock spawn to return our mock process
    mockSpawn = spawn;
    mockSpawn.mockReturnValue(mockProcess);

    // Create a temporary directory for tests
    tempDir = path.join(os.tmpdir(), `psbridge-test-${Date.now()}`);
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rmdir(tempDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Basic Script Execution', () => {
    it('should execute a PowerShell script with parameters', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test', Age: 25 };
      
      // Mock successful execution
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END==='), 10);
        }
      });

      const result = await runScript(scriptPath, params);

      expect(mockSpawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass'
        ]),
        expect.any(Object)
      );
      expect(result.json).toEqual({ result: 'success' });
      expect(result.exitCode).toBe(0);
    });

    it('should handle JSON parsing with fallback', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('{"result": "success"}'), 10);
        }
      });

      const result = await runScript(scriptPath, params);

      expect(result.json).toEqual({ result: 'success' });
    });

    it('should handle non-zero exit codes', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10);
        }
      });

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('Error: Something went wrong'), 10);
        }
      });

      await expect(runScript(scriptPath, params)).rejects.toThrow();
    });
  });

  describe('PowerShell Executable Detection', () => {
    it('should use powershell.exe on Windows', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END==='), 10);
        }
      });

      await runScript(scriptPath, params);

      expect(mockSpawn).toHaveBeenCalledWith(
        'powershell.exe',
        expect.any(Array),
        expect.any(Object)
      );

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should use pwsh on non-Windows platforms', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END==='), 10);
        }
      });

      await runScript(scriptPath, params);

      expect(mockSpawn).toHaveBeenCalledWith(
        'pwsh',
        expect.any(Array),
        expect.any(Object)
      );

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('Parameter Handling', () => {
    it('should handle boolean parameters correctly', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { 
        Name: 'Test', 
        IsActive: true, 
        IsDisabled: false,
        Count: 0
      };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END==='), 10);
        }
      });

      await runScript(scriptPath, params);

      expect(mockSpawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          '-Name', 'Test',
          '-IsActive', 'true',
          '-IsDisabled', 'false',
          '-Count', '0'
        ]),
        expect.any(Object)
      );
    });

    it('should escape special characters in parameter values', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { 
        Message: 'Hello "World" & Special!',
        Path: 'C:\\Program Files\\Test',
        Command: 'Get-Process | Where-Object {$_.Name -eq "test"}'
      };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END==='), 10);
        }
      });

      await runScript(scriptPath, params);

      expect(mockSpawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          '-Message', 'Hello "World" & Special!',
          '-Path', 'C:\\Program Files\\Test',
          '-Command', 'Get-Process | Where-Object {$_.Name -eq "test"}'
        ]),
        expect.any(Object)
      );
    });

    it('should handle empty parameter objects', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = {};
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END==='), 10);
        }
      });

      await runScript(scriptPath, params);

      expect(mockSpawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass'
        ]),
        expect.any(Object)
      );
    });

    it('should handle very large parameter values', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const largeValue = 'A'.repeat(10000);
      const params = { LargeData: largeValue };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END==='), 10);
        }
      });

      await runScript(scriptPath, params);

      expect(mockSpawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          '-LargeData', largeValue
        ]),
        expect.any(Object)
      );
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long-running scripts', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          // Never call close to simulate timeout
        }
      });

      await expect(runScript(scriptPath, params, { timeoutMs: 100 })).rejects.toThrow('timeout');
    });

    it('should handle timeout during data streaming', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          // Never call close to simulate timeout
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          // Simulate slow data streaming
          setTimeout(() => callback('partial data'), 200);
        }
      });

      await expect(runScript(scriptPath, params, { timeoutMs: 100 })).rejects.toThrow('timeout');
    });
  });

  describe('Error Classification', () => {
    it('should classify execution policy errors', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10);
        }
      });

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('ExecutionPolicyError: Cannot run script'), 10);
        }
      });

      await expect(runScript(scriptPath, params)).rejects.toThrow();
    });

    it('should classify permission errors', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10);
        }
      });

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('Access denied'), 10);
        }
      });

      await expect(runScript(scriptPath, params)).rejects.toThrow();
    });

    it('should classify dependency errors', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10);
        }
      });

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('Module not found'), 10);
        }
      });

      await expect(runScript(scriptPath, params)).rejects.toThrow();
    });
  });

  describe('File I/O Operations', () => {
    it('should handle file-based script execution', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END==='), 10);
        }
      });

      await runScript(scriptPath, params);

      expect(mockSpawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          '-File', scriptPath
        ]),
        expect.any(Object)
      );
    });

    it('should handle binary data with files', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const inputData = Buffer.from('test binary data');
      const extraParams = { Mode: 'Process' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END==='), 10);
        }
      });

      const result = await runScriptWithFiles(scriptPath, { input: inputData, extraParams });

      expect(result.json).toEqual({ result: 'success' });
    });
  });

  describe('Concurrent Execution', () => {
    it('should handle multiple concurrent script executions', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params1 = { Name: 'Test1' };
      const params2 = { Name: 'Test2' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END==='), 10);
        }
      });

      const [result1, result2] = await Promise.all([
        runScript(scriptPath, params1),
        runScript(scriptPath, params2)
      ]);

      expect(result1.json).toEqual({ result: 'success' });
      expect(result2.json).toEqual({ result: 'success' });
      expect(mockSpawn).toHaveBeenCalledTimes(2);
    });
  });

  describe('JSON Parsing Edge Cases', () => {
    it('should handle malformed JSON fences gracefully', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END===\n===JSON-BEGIN===\n{"duplicate": "data"}\n===JSON-END==='), 10);
        }
      });

      const result = await runScript(scriptPath, params);

      expect(result.json).toEqual({ result: 'success' });
    });

    it('should handle mixed stdout/stderr streams', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END==='), 10);
        }
      });

      mockProcess.stderr.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('Warning: This is a warning'), 10);
        }
      });

      const result = await runScript(scriptPath, params);

      expect(result.json).toEqual({ result: 'success' });
      expect(result.stderr).toContain('Warning: This is a warning');
    });

    it('should handle non-zero exit with no stderr', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END==='), 10);
        }
      });

      await expect(runScript(scriptPath, params)).rejects.toThrow();
    });
  });

  describe('Spawn Error Handling', () => {
    it('should handle immediate spawn errors', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockSpawn.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      await expect(runScript(scriptPath, params)).rejects.toThrow('ENOENT');
    });

    it('should handle spawn errors with detailed information', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      const spawnError = new Error('PowerShell not found');
      spawnError.code = 'ENOENT';
      spawnError.errno = -2;
      spawnError.syscall = 'spawn';
      spawnError.path = 'powershell.exe';

      mockSpawn.mockImplementation(() => {
        throw spawnError;
      });

      await expect(runScript(scriptPath, params)).rejects.toThrow('PowerShell not found');
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle rapid successive executions', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 5);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END==='), 5);
        }
      });

      const startTime = Date.now();
      const promises = Array.from({ length: 10 }, () => runScript(scriptPath, params));
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should measure execution overhead', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END==='), 10);
        }
      });

      const startTime = Date.now();
      await runScript(scriptPath, params);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be fast with mocked execution
    });
  });

  describe('SafeUnlink Retry Mechanism', () => {
    it('should handle ENOENT errors gracefully', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END==='), 10);
        }
      });

      // Mock fs.unlink to throw ENOENT
      const originalUnlink = fs.unlink;
      fs.unlink = jest.fn().mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const result = await runScript(scriptPath, params);

      expect(result.json).toEqual({ result: 'success' });
      
      // Restore original unlink
      fs.unlink = originalUnlink;
    });

    it('should retry on persistent errors', async () => {
      const scriptPath = path.join(tempDir, 'test.ps1');
      const params = { Name: 'Test' };
      
      mockProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockProcess.stdout.on.mockImplementation((event, callback) => {
        if (event === 'data') {
          setTimeout(() => callback('===JSON-BEGIN===\n{"result": "success"}\n===JSON-END==='), 10);
        }
      });

      // Mock fs.unlink to fail twice then succeed
      const originalUnlink = fs.unlink;
      let unlinkCallCount = 0;
      fs.unlink = jest.fn().mockImplementation(() => {
        unlinkCallCount++;
        if (unlinkCallCount <= 2) {
          return Promise.reject(new Error('EBUSY: resource busy'));
        }
        return Promise.resolve();
      });

      const result = await runScript(scriptPath, params);

      expect(result.json).toEqual({ result: 'success' });
      expect(unlinkCallCount).toBe(3); // Should retry twice then succeed
      
      // Restore original unlink
      fs.unlink = originalUnlink;
    });
  });

  describe('End-to-End Tests (Optional)', () => {
    // These tests require real PowerShell and are skipped in CI by default
    const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
    
    if (!isCI) {
      it('should execute real PowerShell scripts', async () => {
        // Create a real PowerShell script for testing
        const scriptPath = path.join(tempDir, 'e2e-test.ps1');
        const scriptContent = `
# UTF-8 BOM
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$ProgressPreference = 'SilentlyContinue'

param(
    [string]$Name,
    [int]$Age,
    [string]$Mode = 'Echo'
)

$result = @{
    Name = $Name
    Age = $Age
    Mode = $Mode
    Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Success = $true
}

Write-Output "===JSON-BEGIN==="
$result | ConvertTo-Json -Depth 10
Write-Output "===JSON-END==="
        `;

        await fs.writeFile(scriptPath, scriptContent, 'utf8');

        const params = { Name: 'E2E Test', Age: 42, Mode: 'Test' };
        const result = await runScript(scriptPath, params, { timeoutMs: 10000 });

        expect(result.json).toBeDefined();
        expect(result.json.Name).toBe('E2E Test');
        expect(result.json.Age).toBe(42);
        expect(result.json.Mode).toBe('Test');
        expect(result.json.Success).toBe(true);
        expect(result.exitCode).toBe(0);
      });

      it('should handle real binary data processing', async () => {
        const scriptPath = path.join(tempDir, 'e2e-binary.ps1');
        const scriptContent = `
# UTF-8 BOM
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$ProgressPreference = 'SilentlyContinue'

param(
    [string]$InputData,
    [string]$Mode = 'Echo'
)

$inputBytes = [System.Convert]::FromBase64String($InputData)
$result = @{
    OriginalSize = $inputBytes.Length
    Mode = $Mode
    Success = $true
}

if ($Mode -eq 'Hash') {
    $hash = [System.Security.Cryptography.SHA256]::Create()
    $hashBytes = $hash.ComputeHash($inputBytes)
    $result.Hash = [System.Convert]::ToBase64String($hashBytes)
} elseif ($Mode -eq 'Upper') {
    $text = [System.Text.Encoding]::UTF8.GetString($inputBytes)
    $upperText = $text.ToUpper()
    $result.ProcessedData = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($upperText))
} else {
    $result.ProcessedData = $InputData
}

Write-Output "===JSON-BEGIN==="
$result | ConvertTo-Json -Depth 10
Write-Output "===JSON-END==="

if ($Mode -eq 'Hash') {
    $hashBytes | Set-Content -Path $env:TEMP\\e2e-output.dat -AsByteStream
} elseif ($Mode -eq 'Upper') {
    $upperBytes = [System.Text.Encoding]::UTF8.GetBytes($upperText)
    $upperBytes | Set-Content -Path $env:TEMP\\e2e-output.dat -AsByteStream
} else {
    $inputBytes | Set-Content -Path $env:TEMP\\e2e-output.dat -AsByteStream
}
        `;

        await fs.writeFile(scriptPath, scriptContent, 'utf8');

        const testData = Buffer.from('Hello, PowerShell Bridge! 🚀');
        const extraParams = { Mode: 'Upper' };
        
        const result = await runScriptWithFiles(scriptPath, { input: testData, extraParams }, { timeoutMs: 15000 });

        expect(result.json).toBeDefined();
        expect(result.json.OriginalSize).toBe(testData.length);
        expect(result.json.Mode).toBe('Upper');
        expect(result.json.Success).toBe(true);
        expect(result.data).toBeDefined();
        
        const processedText = result.data.toString();
        expect(processedText).toBe('HELLO, POWERSHELL BRIDGE! 🚀');
      });

      it('should handle real error scenarios', async () => {
        const scriptPath = path.join(tempDir, 'e2e-error.ps1');
        const scriptContent = `
# UTF-8 BOM
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'
$ProgressPreference = 'SilentlyContinue'

param(
    [bool]$ShouldFail = $false
)

if ($ShouldFail) {
    throw "Intentional test error"
}

$result = @{
    Success = $true
    Message = "No error occurred"
}

Write-Output "===JSON-BEGIN==="
$result | ConvertTo-Json -Depth 10
Write-Output "===JSON-END==="
        `;

        await fs.writeFile(scriptPath, scriptContent, 'utf8');

        // Test successful execution
        const successResult = await runScript(scriptPath, { ShouldFail: false }, { timeoutMs: 10000 });
        expect(successResult.json.Success).toBe(true);

        // Test error handling
        await expect(runScript(scriptPath, { ShouldFail: true }, { timeoutMs: 10000 })).rejects.toThrow();
      });
    } else {
      it.skip('E2E tests are skipped in CI environment', () => {
        // This test is skipped in CI
      });
    }
  });
});
