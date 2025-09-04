/**
 * In-memory patcher for Car(); markers.
 * Allows dynamic code injection at runtime without modifying files on disk.
 * 
 * Usage:
 *   Place Car(); on its own line anywhere in your code
 *   Use runWithPatches() to load, patch, and execute with injected code
 */
import fs from "fs";
import vm from "vm";
import { randomBytes } from "crypto";

export interface PatchPoint {
  line: number;
  column: number;
  originalLine: string;
}

export interface PatchResult {
  originalCode: string;
  patchedCode: string;
  patchPoints: PatchPoint[];
  patches: string[];
  executionResult?: any;
  error?: string;
}

/**
 * Find all Car(); markers in source code
 */
export function findCarMarkers(sourceCode: string): PatchPoint[] {
  const lines = sourceCode.split('\n');
  const markers: PatchPoint[] = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed === 'Car();' || trimmed.startsWith('Car();')) {
      markers.push({
        line: index + 1,
        column: line.indexOf('Car();'),
        originalLine: line
      });
    }
  });
  
  return markers;
}

/**
 * Replace Car(); markers with patch code in memory
 */
export function applyPatches(sourceCode: string, patches: string[]): PatchResult {
  const markers = findCarMarkers(sourceCode);
  let patchedCode = sourceCode;
  let patchIndex = 0;
  
  // Replace each Car(); with corresponding patch (in reverse order to maintain line numbers)
  for (let i = markers.length - 1; i >= 0; i--) {
    const marker = markers[i];
    const patch = patches[patchIndex % patches.length] || '// No patch available';
    
    const lines = patchedCode.split('\n');
    const originalLine = lines[marker.line - 1];
    const indentation = originalLine.match(/^(\s*)/)?.[1] || '';
    
    // Replace Car(); with indented patch code
    const patchedLine = originalLine.replace('Car();', patch.split('\n').map((line, idx) => 
      idx === 0 ? line : indentation + line
    ).join('\n'));
    
    lines[marker.line - 1] = patchedLine;
    patchedCode = lines.join('\n');
    patchIndex++;
  }
  
  return {
    originalCode: sourceCode,
    patchedCode,
    patchPoints: markers,
    patches: patches.slice(0, markers.length)
  };
}

/**
 * Load a file, apply patches, and execute in a VM context
 */
export function runWithPatches(
  filePath: string, 
  patches: string[], 
  context: any = {}
): PatchResult {
  try {
    const sourceCode = fs.readFileSync(filePath, 'utf8');
    const result = applyPatches(sourceCode, patches);
    
    // Create isolated VM context
    const vmContext = vm.createContext({
      console,
      require,
      module: { exports: {} },
      exports: {},
      __filename: filePath,
      __dirname: require('path').dirname(filePath),
      Car: () => {}, // Define Car as no-op in case it's called
      ...context
    });
    
    try {
      // Execute patched code in VM
      const executionResult = vm.runInContext(result.patchedCode, vmContext, {
        filename: filePath,
        timeout: 5000 // 5 second timeout for safety
      });
      
      result.executionResult = executionResult;
    } catch (execError) {
      result.error = `Execution error: ${execError.message}`;
    }
    
    return result;
  } catch (error) {
    return {
      originalCode: '',
      patchedCode: '',
      patchPoints: [],
      patches: [],
      error: `File error: ${error.message}`
    };
  }
}

/**
 * Apply patches to source code string (without file I/O)
 */
export function patchSourceCode(
  sourceCode: string, 
  patches: string[]
): PatchResult {
  return applyPatches(sourceCode, patches);
}

/**
 * Execute patched code in memory without file I/O
 */
export function executePatched(
  sourceCode: string, 
  patches: string[], 
  context: any = {}
): PatchResult {
  const result = applyPatches(sourceCode, patches);
  
  // Create isolated VM context
  const vmContext = vm.createContext({
    console,
    require,
    module: { exports: {} },
    exports: {},
    Car: () => {}, // Define Car as no-op
    ...context
  });
  
  try {
    // Execute patched code in VM
    const executionResult = vm.runInContext(result.patchedCode, vmContext, {
      timeout: 5000 // 5 second timeout for safety
    });
    
    result.executionResult = executionResult;
  } catch (execError) {
    result.error = `Execution error: ${execError.message}`;
  }
  
  return result;
}

/**
 * Generate random patch injection points (for testing/demo)
 */
export function generateRandomPatches(count: number = 3): string[] {
  const patches = [
    'console.log("🚗 Patch injected at runtime!");',
    'const patchId = "' + randomBytes(4).toString('hex') + '";',
    'console.log("Dynamic patch execution:", new Date().toISOString());',
    '// Runtime patch: ' + Math.random().toString(36).substring(7),
    'console.log("Car() marker replaced successfully!");',
    'const runtimeValue = Math.floor(Math.random() * 1000);'
  ];
  
  return patches.sort(() => Math.random() - 0.5).slice(0, count);
}

/**
 * Security: Validate patch code to prevent dangerous operations
 */
export function validatePatch(patchCode: string): { valid: boolean; reason?: string } {
  const dangerousPatterns = [
    /require\s*\(\s*['"]fs['"]/,
    /require\s*\(\s*['"]child_process['"]/,
    /require\s*\(\s*['"]os['"]/,
    /process\.exit/,
    /eval\s*\(/,
    /Function\s*\(/,
    /\.unlink/,
    /\.rmdir/,
    /\.writeFile/
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(patchCode)) {
      return { 
        valid: false, 
        reason: `Dangerous pattern detected: ${pattern.source}` 
      };
    }
  }
  
  return { valid: true };
}