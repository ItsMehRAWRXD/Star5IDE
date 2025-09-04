// Car Patcher Utility (runtime injection at `Car();` markers)
// Usage example:
//   const { runWithPatches } = require('./utils/carPatcher');
//   runWithPatches('./scripts/demo.js', ["console.log('Injected 1')", "console.log('Injected 2')"]);
// Every occurrence of a standalone `Car();` on its own line will be replaced, in order, by the provided patches.
// No disk files are modified; the patched code is executed in-memory via Node's `vm` module.

const fs = require('fs');
const vm = require('vm');
const path = require('path');

function applyPatches(source, patches) {
  const lines = source.split(/\r?\n/);
  let patchIdx = 0;
  const patched = lines.map((ln) => {
    if (/^\s*Car\(\);\s*$/.test(ln)) {
      const replacement = patches[patchIdx++] || '';
      return replacement;
    }
    return ln;
  });
  return patched.join('\n');
}

function runWithPatches(entryFile, patches = [], context = {}) {
  const absPath = path.resolve(entryFile);
  const src = fs.readFileSync(absPath, 'utf8');
  const patchedSrc = applyPatches(src, patches);

  const script = new vm.Script(patchedSrc, { filename: absPath });
  const ctx = vm.createContext({ console, require, module, __dirname: path.dirname(absPath), __filename: absPath, ...context });
  return script.runInContext(ctx);
}

module.exports = { applyPatches, runWithPatches };