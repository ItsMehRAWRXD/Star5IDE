"use strict";
// Stub generator with simple language templates and encrypt-to-file helper
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStub = generateStub;
exports.writeAndEncryptStub = writeAndEncryptStub;
exports.packageStubToTarget = packageStubToTarget;
const camellia = require("./carmilla-openssl");
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
    const packaged = await camellia.encryptFileToPackageAsync(filePath, passphrase, { ...meta, language });
    return packaged;
}
// New: package stub without writing plaintext to disk, then wrap to arbitrary target path
async function packageStubToTarget(targetFilePath, language, passphrase, meta = {}) {
    // Avoid node types
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('fs');
    const { encryptAsync, repack } = await Promise.resolve().then(() => __importStar(require('./carmilla-openssl')));
    const content = generateStub(language);
    // Write ciphertext matching the user's target (text base64 or raw binary based on extension)
    await camellia.writeEncryptedToFile(targetFilePath, content, passphrase, { outputMode: 'match' });
}
//# sourceMappingURL=stubGenerator.js.map