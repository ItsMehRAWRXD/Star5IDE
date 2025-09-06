// Collect files by extension(s), recursively, without external deps
// Patterns like "*.txt,*.md" or ".txt,.md" or "txt,md" are normalized to extensions

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs: any = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path: any = require('path');

function normalizeExtensions(input: string): string[] {
  const parts = input
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const exts: string[] = [];
  for (const p of parts) {
    let e = p.toLowerCase();
    e = e.replace(/^\*+/, ''); // remove leading * from patterns like *.txt
    if (!e.startsWith('.')) e = '.' + e;
    exts.push(e);
  }
  return Array.from(new Set(exts));
}

export function toExtensionsArray(patternInput: string | string[]): string[] {
  if (Array.isArray(patternInput)) {
    return normalizeExtensions(patternInput.join(','));
  }
  return normalizeExtensions(patternInput);
}

export async function collectFilesByExtensions(
  rootDir: string,
  extensions: string[],
  options?: { maxFiles?: number }
): Promise<string[]> {
  const wanted = new Set(extensions.map(e => e.toLowerCase()))
  const maxFiles = options?.maxFiles ?? 10000;
  const results: string[] = [];

  async function walk(dir: string): Promise<void> {
    let entries: string[] = [];
    try {
      entries = await fs.promises.readdir(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      const full = path.join(dir, name);
      let st: any;
      try {
        st = await fs.promises.stat(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        await walk(full);
        if (results.length >= maxFiles) return;
      } else if (st.isFile()) {
        const ext = path.extname(name).toLowerCase();
        if (wanted.has(ext)) {
          results.push(full);
          if (results.length >= maxFiles) return;
        }
      }
    }
  }

  await walk(rootDir);
  return results;
}

