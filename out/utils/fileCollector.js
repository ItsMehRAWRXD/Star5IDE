"use strict";
// Collect files by extension(s), recursively, without external deps
// Patterns like "*.txt,*.md" or ".txt,.md" or "txt,md" are normalized to extensions
Object.defineProperty(exports, "__esModule", { value: true });
exports.toExtensionsArray = toExtensionsArray;
exports.collectFilesByExtensions = collectFilesByExtensions;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
function normalizeExtensions(input) {
    const parts = input
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    const exts = [];
    for (const p of parts) {
        let e = p.toLowerCase();
        e = e.replace(/^\*+/, ''); // remove leading * from patterns like *.txt
        if (!e.startsWith('.'))
            e = '.' + e;
        exts.push(e);
    }
    return Array.from(new Set(exts));
}
function toExtensionsArray(patternInput) {
    if (Array.isArray(patternInput)) {
        return normalizeExtensions(patternInput.join(','));
    }
    return normalizeExtensions(patternInput);
}
async function collectFilesByExtensions(rootDir, extensions, options) {
    const wanted = new Set(extensions.map(e => e.toLowerCase()));
    const maxFiles = options?.maxFiles ?? 10000;
    const results = [];
    async function walk(dir) {
        let entries = [];
        try {
            entries = await fs.promises.readdir(dir);
        }
        catch {
            return;
        }
        for (const name of entries) {
            const full = path.join(dir, name);
            let st;
            try {
                st = await fs.promises.stat(full);
            }
            catch {
                continue;
            }
            if (st.isDirectory()) {
                await walk(full);
                if (results.length >= maxFiles)
                    return;
            }
            else if (st.isFile()) {
                const ext = path.extname(name).toLowerCase();
                if (wanted.has(ext)) {
                    results.push(full);
                    if (results.length >= maxFiles)
                        return;
                }
            }
        }
    }
    await walk(rootDir);
    return results;
}
//# sourceMappingURL=fileCollector.js.map