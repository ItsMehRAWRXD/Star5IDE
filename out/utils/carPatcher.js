"use strict";
// In-memory Car() patcher — replaces lines containing only `Car();` with provided snippets.
// Provides helpers to patch source content or run a JS file with patches applied via a temp file.
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchSourceWithCarMarkers = patchSourceWithCarMarkers;
exports.patchFileContent = patchFileContent;
exports.runJsWithPatches = runJsWithPatches;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const os = require('os');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cp = require('child_process');
function patchSourceWithCarMarkers(sourceCode, patches) {
    const lines = sourceCode.split(/\r?\n/);
    const carRegex = /^\s*Car\(\);\s*$/;
    let patchIndex = 0;
    const output = [];
    for (const line of lines) {
        if (carRegex.test(line) && patchIndex < patches.length) {
            output.push(patches[patchIndex++] ?? '');
        }
        else {
            output.push(line);
        }
    }
    return output.join('\n');
}
function patchFileContent(filePath, patches) {
    const original = fs.readFileSync(filePath, 'utf-8');
    return patchSourceWithCarMarkers(original, patches);
}
function runJsWithPatches(filePath, patches) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'car-'));
    const tmpFile = path.join(tmpDir, path.basename(filePath).replace(/\.(t|j)sx?$/, '.js'));
    try {
        const patched = patchFileContent(filePath, patches);
        fs.writeFileSync(tmpFile, patched, 'utf-8');
        const result = cp.spawnSync(process.execPath, [tmpFile], { encoding: 'utf-8' });
        return { code: result.status ?? 0, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
    }
    finally {
        try {
            fs.unlinkSync(tmpFile);
        }
        catch { }
        try {
            fs.rmdirSync(tmpDir);
        }
        catch { }
    }
}
//# sourceMappingURL=carPatcher.js.map