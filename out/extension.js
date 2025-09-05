"use strict";
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    const helloCmd = vscode.commands.registerCommand('hello.sayHello', () => {
        vscode.window.showInformationMessage('Hello from your extension!');
    });
    const genEncStubCmd = vscode.commands.registerCommand('carmilla.generateAndEncryptStub', async () => {
        try {
            const language = await vscode.window.showQuickPick(['node', 'python', 'ruby', 'text'], { placeHolder: 'Select stub language' });
            if (!language)
                return;
            const uri = await vscode.window.showSaveDialog({ saveLabel: 'Save stub before encrypting' });
            if (!uri)
                return;
            const passphrase = await vscode.window.showInputBox({ prompt: 'Enter passphrase for encryption', password: true });
            if (!passphrase)
                return;
            const mod = await Promise.resolve().then(() => __importStar(require('./utils/stubGenerator')));
            const packaged = await mod.writeAndEncryptStub(uri.fsPath, language, passphrase, { createdBy: 'VSCodeCmd' });
            // Offer to save the packaged data alongside (optional)
            const savePkg = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Save packaged (.pkg.b64) alongside stub?' });
            if (savePkg === 'Yes') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const B = globalThis.Buffer || require('buffer').Buffer;
                const pkgUri = uri.with({ path: uri.path + '.pkg.b64' });
                await vscode.workspace.fs.writeFile(pkgUri, B.from(packaged, 'utf-8'));
            }
            vscode.window.showInformationMessage('Stub generated and encrypted successfully.');
        }
        catch (e) {
            vscode.window.showErrorMessage(`Failed to generate/encrypt stub: ${e?.message ?? e}`);
        }
    });
    context.subscriptions.push(helloCmd, genEncStubCmd);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map