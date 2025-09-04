/**
 * In-Memory Patch Editor with Car(); markers
 * Allows dynamic code injection at runtime without modifying source files
 * 
 * Usage: Place Car(); on its own line anywhere in code
 * The patcher will inject code at those points when running
 */

import fs from 'fs';
import vm from 'vm';
import path from 'path';

export interface PatchPoint {
  line: number;
  code: string;
}

export interface PatchResult {
  success: boolean;
  patchedCode?: string;
  executionResult?: any;
  error?: string;
  patchPoints?: number[];
}

/**
 * Find all Car(); markers in source code
 */
function findCarMarkers(source: string): number[] {
  const lines = source.split('\n');
  const markers: number[] = [];
  
  lines.forEach((line, index) => {
    // Match Car(); on its own line (with optional whitespace)
    if (/^\s*Car\(\);\s*$/.test(line)) {
      markers.push(index);
    }
  });
  
  return markers;
}

/**
 * Patch source code at Car(); markers
 */
export function patchCode(source: string, patches: string[]): string {
  const lines = source.split('\n');
  const markers = findCarMarkers(source);
  
  // Replace each Car(); with corresponding patch
  markers.forEach((lineIndex, patchIndex) => {
    if (patchIndex < patches.length) {
      // Preserve indentation
      const indent = lines[lineIndex].match(/^\s*/)?.[0] || '';
      const patchLines = patches[patchIndex].split('\n').map(l => indent + l);
      lines[lineIndex] = patchLines.join('\n');
    } else {
      // Remove Car(); if no patch provided
      lines[lineIndex] = '';
    }
  });
  
  return lines.join('\n');
}

/**
 * Load, patch, and execute code in memory
 */
export function runWithPatches(
  filePath: string,
  patches: string[],
  context: any = {}
): PatchResult {
  try {
    // Read source file
    const source = fs.readFileSync(filePath, 'utf8');
    
    // Find patch points
    const patchPoints = findCarMarkers(source);
    
    // Patch the code
    const patchedCode = patchCode(source, patches);
    
    // Create VM context with globals
    const sandbox = {
      console,
      require,
      process,
      Buffer,
      setTimeout,
      setInterval,
      clearTimeout,
      clearInterval,
      ...context,
      // Add Car function that does nothing (in case any Car(); remain)
      Car: () => {}
    };
    
    // Execute patched code in VM
    const script = new vm.Script(patchedCode, {
      filename: path.basename(filePath),
      lineOffset: 0,
      columnOffset: 0
    });
    
    const result = script.runInNewContext(sandbox, {
      timeout: 10000 // 10 second timeout
    });
    
    return {
      success: true,
      patchedCode,
      executionResult: result,
      patchPoints
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Async version for non-blocking execution
 */
export async function runWithPatchesAsync(
  filePath: string,
  patches: string[],
  context: any = {}
): Promise<PatchResult> {
  return new Promise((resolve) => {
    const result = runWithPatches(filePath, patches, context);
    resolve(result);
  });
}

/**
 * Preview patches without executing
 */
export function previewPatches(
  filePath: string,
  patches: string[]
): PatchResult {
  try {
    const source = fs.readFileSync(filePath, 'utf8');
    const patchPoints = findCarMarkers(source);
    const patchedCode = patchCode(source, patches);
    
    return {
      success: true,
      patchedCode,
      patchPoints
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Load code with Car(); markers from string (not file)
 */
export function patchString(source: string, patches: string[]): string {
  return patchCode(source, patches);
}

/**
 * Execute patched string code
 */
export function runPatchedString(
  source: string,
  patches: string[],
  context: any = {}
): PatchResult {
  try {
    const patchPoints = findCarMarkers(source);
    const patchedCode = patchCode(source, patches);
    
    const sandbox = {
      console,
      require,
      process,
      Buffer,
      ...context,
      Car: () => {}
    };
    
    const script = new vm.Script(patchedCode);
    const result = script.runInNewContext(sandbox, { timeout: 10000 });
    
    return {
      success: true,
      patchedCode,
      executionResult: result,
      patchPoints
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Export for plug-and-play usage
export default {
  patchCode,
  runWithPatches,
  runWithPatchesAsync,
  previewPatches,
  patchString,
  runPatchedString,
  findCarMarkers
};