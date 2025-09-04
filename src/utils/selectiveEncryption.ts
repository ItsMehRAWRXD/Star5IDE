// Selective encryption utility — generic, no framework binding.
// Processes files or in-memory data targets; no fallback, explicit only.

import { encryptAsync, repack } from './carmilla-openssl';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;

export type EncryptionIntent = 'encrypt' | 'do-not-encrypt';

export type EncryptionTarget =
  | { type: 'file'; path: string; intent: EncryptionIntent; meta?: Record<string, any> }
  | { type: 'data'; key?: string; data: string; intent: EncryptionIntent; meta?: Record<string, any> };

export type EncryptionResult = {
  type: 'file' | 'data';
  path?: string;
  key?: string;
  intent: EncryptionIntent;
  status: 'encrypted' | 'skipped' | 'encryption failed';
  packaged?: string; // base64 of CarmillaPackage
  error?: string;
  meta?: Record<string, any>;
};

export async function encryptSelective(
  targets: EncryptionTarget[],
  passphrase: string
): Promise<EncryptionResult[]> {
  const results: EncryptionResult[] = [];
  for (const t of targets) {
    if (t.intent !== 'encrypt') {
      results.push({ ...(t as any), status: 'skipped' });
      continue;
    }
    try {
      if (t.type === 'file') {
        // Lazy import to avoid requiring node types globally
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs: any = require('fs');
        const raw = await fs.promises.readFile(t.path, 'utf-8');
        const enc = await encryptAsync(raw, passphrase);
        const packaged = repack(enc, { ...(t.meta || {}), area: t.path });
        results.push({ type: 'file', path: t.path, intent: t.intent, status: 'encrypted', packaged, meta: t.meta });
      } else {
        const enc = await encryptAsync(t.data, passphrase);
        const packaged = repack(enc, { ...(t.meta || {}), area: t.key ?? 'data' });
        results.push({ type: 'data', key: t.key, intent: t.intent, status: 'encrypted', packaged, meta: t.meta });
      }
    } catch (e: any) {
      results.push({ ...(t as any), status: 'encryption failed', error: e?.message ?? String(e) });
    }
  }
  return results;
}

