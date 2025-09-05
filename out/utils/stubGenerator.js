"use strict";
// Stub generator with simple language templates and encrypt-to-file helper
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStub = generateStub;
exports.writeAndEncryptStub = writeAndEncryptStub;
const carmilla_openssl_1 = require("./carmilla-openssl");
function getTemplate(language) {
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
function generateStub(language = 'node') {
    return getTemplate(language);
}
async function writeAndEncryptStub(filePath, language, passphrase, meta = {}) {
    // Avoid node types
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs');
    const content = generateStub(language);
    await fs.promises.writeFile(filePath, content, 'utf-8');
    // Package the written stub (sourcePath saved in meta)
    const packaged = await (0, carmilla_openssl_1.encryptFileToPackageAsync)(filePath, passphrase, { ...meta, language });
    return packaged;
}
//# sourceMappingURL=stubGenerator.js.map