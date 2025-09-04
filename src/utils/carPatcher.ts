// In-memory Car() patcher — replaces lines containing only `Car();` with provided snippets.
// Provides helpers to patch source content or run a JS file with patches applied via a temp file.

// Avoid @types/node; use require with any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs: any = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const os: any = require('os');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path: any = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cp: any = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any;

export function patchSourceWithCarMarkers(sourceCode: string, patches: string[]): string {
  const lines = sourceCode.split(/\r?\n/);
  const carRegex = /^\s*Car\(\);\s*$/;
  let patchIndex = 0;
  const output: string[] = [];
  for (const line of lines) {
    if (carRegex.test(line) && patchIndex < patches.length) {
      output.push(patches[patchIndex++] ?? '');
    } else {
      output.push(line);
    }
  }
  return output.join('\n');
}

export function patchFileContent(filePath: string, patches: string[]): string {
  const original = fs.readFileSync(filePath, 'utf-8');
  return patchSourceWithCarMarkers(original, patches);
}

export function runJsWithPatches(filePath: string, patches: string[]): { code: number; stdout: string; stderr: string } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'car-'));
  const tmpFile = path.join(tmpDir, path.basename(filePath).replace(/\.(t|j)sx?$/, '.js'));
  try {
    const patched = patchFileContent(filePath, patches);
    fs.writeFileSync(tmpFile, patched, 'utf-8');
    const result = cp.spawnSync(process.execPath, [tmpFile], { encoding: 'utf-8' });
    return { code: result.status ?? 0, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
    try { fs.rmdirSync(tmpDir); } catch {}
  }
}

