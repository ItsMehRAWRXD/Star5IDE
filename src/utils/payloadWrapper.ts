// Payload wrapper: packages arbitrary text and selected files into an
// encrypted base64 text payload, written to any target file.

import { encryptAsync, repack, writeEncryptedToFile } from './carmilla-openssl';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;

export type PayloadInput = {
  text?: string;
  filePaths?: string[];
};

export type PackagedSummary = {
  filesCount: number;
  hasText: boolean;
  totalBytesBase64: number;
};

// Avoid Node types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs: any = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path: any = require('path');

export async function createEncryptedPayloadToFile(
  targetFilePath: string,
  input: PayloadInput,
  passphrase: string,
  meta: Record<string, any> = {}
): Promise<PackagedSummary> {
  const files = Array.isArray(input.filePaths) ? input.filePaths : [];
  const fileEntries: any[] = [];
  for (const p of files) {
    try {
      const data = await fs.promises.readFile(p);
      const stat = await fs.promises.stat(p);
      const entry = {
        path: p,
        name: path.basename(p),
        size: stat.size,
        mtimeMs: stat.mtimeMs,
        encoding: 'base64',
        data: data.toString('base64'),
      };
      fileEntries.push(entry);
    } catch (e) {
      // Include an error note instead of failing the whole batch
      fileEntries.push({ path: p, error: (e as any)?.message ?? String(e) });
    }
  }

  const payload = {
    version: 1,
    createdAt: new Date().toISOString(),
    text: input.text ?? '',
    files: fileEntries,
  };

  const plain = JSON.stringify(payload);
  // Write ciphertext matching user's target (text base64 if texty ext; binary if binary ext)
  await writeEncryptedToFile(targetFilePath, plain, passphrase, { outputMode: 'match' });

  return {
    filesCount: fileEntries.length,
    hasText: !!input.text,
    totalBytesBase64: (await fs.promises.stat(targetFilePath)).size,
  };
}

