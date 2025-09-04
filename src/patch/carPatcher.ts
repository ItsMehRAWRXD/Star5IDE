import fs from "fs";
import vm from "vm";
import { randomBytes } from "crypto";

export type PatchConfig = {
  patches: string[];
  randomizeOrder?: boolean;
  addFakePatches?: boolean;
  preserveOriginal?: boolean;
};

export type PatchResult = {
  originalFile: string;
  patchedFile: string;
  patchesApplied: number;
  executionResult?: any;
  errors?: string[];
};

/**
 * Car(); In-Memory Patch System
 * 
 * Usage:
 * 1. Place Car(); on its own line anywhere in your source code
 * 2. Use CarPatcher to load, patch, and execute code in memory
 * 3. Patches are applied in order (or randomized if configured)
 * 4. No changes to disk files - all patching is in-memory
 */
export class CarPatcher {
  private static readonly CAR_MARKER = "Car();";
  private static readonly CAR_REGEX = /^(\s*)Car\(\);\s*$/gm;

  /**
   * Load a file and replace Car(); markers with patch code
   */
  static async loadAndPatch(
    filePath: string, 
    config: PatchConfig
  ): Promise<PatchResult> {
    try {
      const originalContent = await fs.promises.readFile(filePath, 'utf-8');
      
      // Count Car(); markers
      const matches = originalContent.match(this.CAR_REGEX);
      const markerCount = matches ? matches.length : 0;
      
      if (markerCount === 0) {
        return {
          originalFile: originalContent,
          patchedFile: originalContent,
          patchesApplied: 0,
          errors: ["No Car(); markers found in file"]
        };
      }

      // Prepare patches
      let patches = [...config.patches];
      
      // Add fake patches if requested
      if (config.addFakePatches) {
        const fakePatches = this.generateFakePatches(markerCount);
        patches = [...patches, ...fakePatches];
      }

      // Randomize order if requested
      if (config.randomizeOrder) {
        patches = this.shuffleArray(patches);
      }

      // Apply patches
      let patchedContent = originalContent;
      let patchesApplied = 0;
      const errors: string[] = [];

      patchedContent = patchedContent.replace(this.CAR_REGEX, (match, indent) => {
        if (patchesApplied < patches.length) {
          const patch = patches[patchesApplied];
          patchesApplied++;
          
          // Preserve indentation
          const indentedPatch = patch
            .split('\n')
            .map(line => line.trim() ? indent + line : line)
            .join('\n');
          
          return indentedPatch;
        }
        return match; // Keep original if no more patches
      });

      return {
        originalFile: originalContent,
        patchedFile: patchedContent,
        patchesApplied,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      return {
        originalFile: "",
        patchedFile: "",
        patchesApplied: 0,
        errors: [`Failed to load file: ${error.message}`]
      };
    }
  }

  /**
   * Execute patched code in a sandboxed context
   */
  static async executePatched(
    patchedContent: string,
    context: Record<string, any> = {}
  ): Promise<any> {
    try {
      // Create sandboxed context
      const sandbox = {
        console,
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval,
        Buffer,
        process: {
          env: process.env,
          cwd: process.cwd,
          exit: process.exit
        },
        ...context
      };

      // Execute in sandbox
      const script = new vm.Script(patchedContent);
      const result = script.runInNewContext(sandbox, {
        timeout: 5000,
        displayErrors: true
      });

      return result;
    } catch (error) {
      throw new Error(`Execution failed: ${error.message}`);
    }
  }

  /**
   * Complete workflow: load, patch, and execute
   */
  static async runWithPatches(
    filePath: string,
    config: PatchConfig,
    context: Record<string, any> = {}
  ): Promise<PatchResult> {
    const patchResult = await this.loadAndPatch(filePath, config);
    
    if (patchResult.errors && patchResult.errors.length > 0) {
      return patchResult;
    }

    try {
      const executionResult = await this.executePatched(patchResult.patchedFile, context);
      return {
        ...patchResult,
        executionResult
      };
    } catch (error) {
      return {
        ...patchResult,
        errors: [...(patchResult.errors || []), `Execution error: ${error.message}`]
      };
    }
  }

  /**
   * Generate fake patches to confuse reverse engineering
   */
  private static generateFakePatches(count: number): string[] {
    const fakePatches = [
      `console.log("Fake patch ${randomBytes(4).toString('hex')}");`,
      `const fakeVar${randomBytes(2).toString('hex')} = "${randomBytes(8).toString('hex')}";`,
      `if (Math.random() > 0.5) { console.log("Fake condition"); }`,
      `setTimeout(() => {}, ${Math.floor(Math.random() * 1000)});`,
      `const fakeObj = { id: "${randomBytes(4).toString('hex')}", value: Math.random() };`
    ];

    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(fakePatches[Math.floor(Math.random() * fakePatches.length)]);
    }
    return result;
  }

  /**
   * Shuffle array in place
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Scan file for Car(); markers without patching
   */
  static async scanMarkers(filePath: string): Promise<{ count: number; locations: number[] }> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const locations: number[] = [];
      
      lines.forEach((line, index) => {
        if (line.trim() === "Car();") {
          locations.push(index + 1); // 1-based line numbers
        }
      });

      return {
        count: locations.length,
        locations
      };
    } catch (error) {
      throw new Error(`Scan failed: ${error.message}`);
    }
  }

  /**
   * Batch process multiple files
   */
  static async batchProcess(
    filePaths: string[],
    config: PatchConfig,
    context: Record<string, any> = {}
  ): Promise<Map<string, PatchResult>> {
    const results = new Map<string, PatchResult>();
    
    for (const filePath of filePaths) {
      try {
        const result = await this.runWithPatches(filePath, config, context);
        results.set(filePath, result);
      } catch (error) {
        results.set(filePath, {
          originalFile: "",
          patchedFile: "",
          patchesApplied: 0,
          errors: [`Batch processing error: ${error.message}`]
        });
      }
    }

    return results;
  }
}

export default CarPatcher;