"use strict";

const vm = require("vm");

function createHotPatcher() {
  const targets = new Map(); // name -> { original, patches: [{id, wrap}], effective }
  let nextId = 1;

  function ensure(name) {
    const rec = targets.get(name);
    if (!rec) throw new Error(`Unknown target: ${name}`);
    return rec;
  }

  function recompute(rec) {
    let fn = rec.original;
    for (const p of rec.patches) {
      try {
        fn = p.wrap(fn);
      } catch {
        // ignore broken wrapper
      }
    }
    rec.effective = fn;
  }

  function registerTarget(name, originalFn) {
    if (targets.has(name)) return;
    targets.set(name, { original: originalFn, patches: [], effective: originalFn });
  }

  function get(name) {
    const rec = ensure(name);
    return rec.effective;
  }

  function compileWrapper(source) {
    // Source must evaluate to a function with signature (next) => (...args) => any
    // Sandbox exposes only a minimal console
    const sandbox = { console: { log: console.log.bind(console), error: console.error.bind(console) } };
    const script = new vm.Script(`(function(next){ ${source} })`);
    const ctx = vm.createContext(sandbox);
    const factory = script.runInContext(ctx, { timeout: 1000 });
    if (typeof factory !== "function") throw new Error("Wrapper did not evaluate to a function");
    return (next) => {
      const wrapped = factory(next);
      if (typeof wrapped !== "function") throw new Error("Wrapper factory must return a function");
      return wrapped;
    };
  }

  function installPatch(name, wrapper) {
    const rec = ensure(name);
    const id = String(nextId++);
    const wrap = typeof wrapper === "function" ? wrapper : compileWrapper(String(wrapper));
    rec.patches.push({ id, wrap });
    recompute(rec);
    return { id, name };
  }

  function uninstallPatch(id) {
    for (const [name, rec] of targets) {
      const before = rec.patches.length;
      rec.patches = rec.patches.filter(p => p.id !== id);
      if (rec.patches.length !== before) {
        recompute(rec);
        return { removed: true, name };
      }
    }
    return { removed: false };
  }

  function clear(name) {
    const rec = ensure(name);
    rec.patches = [];
    recompute(rec);
  }

  function status() {
    const out = [];
    for (const [name, rec] of targets) {
      out.push({ name, patches: rec.patches.map(p => ({ id: p.id })), hasPatches: rec.patches.length > 0 });
    }
    return out;
  }

  return { registerTarget, get, installPatch, uninstallPatch, clear, status };
}

module.exports = { createHotPatcher };

