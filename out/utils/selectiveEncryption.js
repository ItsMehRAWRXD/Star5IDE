"use strict";
// Selective encryption utility — generic, no framework binding.
// Processes files or in-memory data targets; no fallback, explicit only.
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptSelective = encryptSelective;
const carmilla_openssl_1 = require("./carmilla-openssl");
async function encryptSelective(targets, passphrase) {
    const results = [];
    for (const t of targets) {
        if (t.intent !== 'encrypt') {
            results.push({ ...t, status: 'skipped' });
            continue;
        }
        try {
            if (t.type === 'file') {
                // Lazy import to avoid requiring node types globally
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const fs = require('fs');
                const raw = await fs.promises.readFile(t.path, 'utf-8');
                const enc = await (0, carmilla_openssl_1.encryptAsync)(raw, passphrase);
                const packaged = (0, carmilla_openssl_1.repack)(enc, { ...(t.meta || {}), area: t.path });
                results.push({ type: 'file', path: t.path, intent: t.intent, status: 'encrypted', packaged, meta: t.meta });
            }
            else {
                const enc = await (0, carmilla_openssl_1.encryptAsync)(t.data, passphrase);
                const packaged = (0, carmilla_openssl_1.repack)(enc, { ...(t.meta || {}), area: t.key ?? 'data' });
                results.push({ type: 'data', key: t.key, intent: t.intent, status: 'encrypted', packaged, meta: t.meta });
            }
        }
        catch (e) {
            results.push({ ...t, status: 'encryption failed', error: e?.message ?? String(e) });
        }
    }
    return results;
}
//# sourceMappingURL=selectiveEncryption.js.map