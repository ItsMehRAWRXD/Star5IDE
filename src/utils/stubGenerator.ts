// Stub generator with simple language templates and encrypt-to-file helper

import { encryptFileToPackageAsync } from './carmilla-openssl';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;

export type StubLanguage = 'node' | 'python' | 'ruby' | 'text';

function getTemplate(language: StubLanguage): string {
  switch (language) {
    case 'node':
      return [
        'function run() {',
        '  console.log("Star5IDE Node stub running!");',
        '}',
        'run();',
        ''
      ].join('\n');
    case 'python':
      return [
        'def run():',
        '    print("Star5IDE Python stub running!")',
        '',
        'if __name__ == "__main__":',
        '    run()',
        ''
      ].join('\n');
    case 'ruby':
      return [
        'def run',
        '  puts "Star5IDE Ruby stub running!"',
        'end',
        'run',
        ''
      ].join('\n');
    case 'text':
    default:
      return '42\n';
  }
}

export function generateStub(language: StubLanguage = 'node'): string {
  return getTemplate(language);
}

export async function writeAndEncryptStub(
  filePath: string,
  language: StubLanguage,
  passphrase: string,
  meta: Record<string, any> = {}
): Promise<string> {
  // Avoid node types
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs: any = require('fs');
  const content = generateStub(language);
  await fs.promises.writeFile(filePath, content, 'utf-8');
  // Package the written stub (sourcePath saved in meta)
  const packaged = await encryptFileToPackageAsync(filePath, passphrase, { ...meta, language });
  return packaged;
}

// New: package stub without writing plaintext to disk, then wrap to arbitrary target path
export async function packageStubToTarget(
  targetFilePath: string,
  language: StubLanguage,
  passphrase: string,
  meta: Record<string, any> = {}
): Promise<void> {
  // Avoid node types
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs: any = require('fs');
  const { encryptAsync, repack } = await import('./carmilla-openssl');
  const content = generateStub(language);
  const enc = await encryptAsync(content, passphrase);
  const packaged = repack(enc, { ...meta, language, wrappedTarget: targetFilePath });
  // Write the packaged data directly to the selected file, regardless of extension (including executables)
  await fs.promises.writeFile(targetFilePath, packaged, 'utf-8');
}

