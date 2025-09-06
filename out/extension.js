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
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
// Main extension activation
function activate(context) {
    console.log('Hello World Extension is now active!');
    // Register the hello command
    let helloCommand = vscode.commands.registerCommand('hello.sayHello', () => {
        vscode.window.showInformationMessage('Hello from Hello World Ext!');
    });
    // Register encryption commands
    let encryptCommand = vscode.commands.registerCommand('hello.encryptFile', async () => {
        await encryptCurrentFile();
    });
    let decryptCommand = vscode.commands.registerCommand('hello.decryptFile', async () => {
        await decryptCurrentFile();
    });
    // Register scanner commands
    let scannerCommand = vscode.commands.registerCommand('hello.runScanner', async () => {
        await runRFIScanner();
    });
    // Register server start command
    let serverCommand = vscode.commands.registerCommand('hello.startServer', async () => {
        await startEncryptServer();
    });
    context.subscriptions.push(helloCommand, encryptCommand, decryptCommand, scannerCommand, serverCommand);
}
// Encrypt the currently active file
async function encryptCurrentFile() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active file to encrypt');
        return;
    }
    const filePath = editor.document.fileName;
    const password = await vscode.window.showInputBox({
        prompt: 'Enter encryption password',
        password: true
    });
    if (!password) {
        vscode.window.showErrorMessage('Password is required');
        return;
    }
    try {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            throw new Error('No workspace folder found');
        }
        const cliPath = path.join(workspaceRoot, 'tools', 'carmilla-openssl.js');
        const outputPath = `${filePath}.pkg`;
        await runCommand('node', [cliPath, 'encrypt', '--pass', password, '--in', filePath, '--out', outputPath]);
        vscode.window.showInformationMessage(`File encrypted to: ${outputPath}`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Encryption failed: ${error}`);
    }
}
// Decrypt a selected file
async function decryptCurrentFile() {
    const files = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectMany: false,
        filters: {
            'Package Files': ['pkg'],
            'All Files': ['*']
        }
    });
    if (!files || files.length === 0) {
        return;
    }
    const filePath = files[0].fsPath;
    const password = await vscode.window.showInputBox({
        prompt: 'Enter decryption password',
        password: true
    });
    if (!password) {
        vscode.window.showErrorMessage('Password is required');
        return;
    }
    try {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            throw new Error('No workspace folder found');
        }
        const cliPath = path.join(workspaceRoot, 'tools', 'carmilla-openssl.js');
        const outputPath = filePath.replace(/\.pkg$/, '.decrypted');
        await runCommand('node', [cliPath, 'decrypt', '--pass', password, '--in', filePath, '--out', outputPath]);
        // Open the decrypted file
        const document = await vscode.workspace.openTextDocument(outputPath);
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage(`File decrypted to: ${outputPath}`);
    }
    catch (error) {
        vscode.window.showErrorMessage(`Decryption failed: ${error}`);
    }
}
// Run the RFI/LFI scanner
async function runRFIScanner() {
    const url = await vscode.window.showInputBox({
        prompt: 'Enter target URL to scan (e.g., http://example.com/page.php?id=)',
        placeHolder: 'http://example.com/page.php?id='
    });
    if (!url) {
        return;
    }
    const scanType = await vscode.window.showQuickPick(['rfi', 'lfi'], {
        placeHolder: 'Select scan type'
    });
    if (!scanType) {
        return;
    }
    try {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            throw new Error('No workspace folder found');
        }
        const scannerPath = path.join(workspaceRoot, 'modern_rfi_scanner.py');
        // Create output channel for scanner results
        const outputChannel = vscode.window.createOutputChannel('RFI/LFI Scanner');
        outputChannel.show();
        outputChannel.appendLine(`Starting ${scanType.toUpperCase()} scan of: ${url}`);
        outputChannel.appendLine('---');
        const result = await runCommand('python3', [scannerPath, '--url', url, '--type', scanType, '--verbose'], {
            cwd: workspaceRoot
        });
        outputChannel.appendLine(result);
        vscode.window.showInformationMessage('Scan completed. Check output channel for results.');
    }
    catch (error) {
        vscode.window.showErrorMessage(`Scanner failed: ${error}`);
    }
}
// Start the encryption server
async function startEncryptServer() {
    try {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            throw new Error('No workspace folder found');
        }
        const serverPath = path.join(workspaceRoot, 'server', 'encrypt_server.js');
        // Start server in background
        const serverProcess = (0, child_process_1.spawn)('node', [serverPath], {
            cwd: workspaceRoot,
            detached: true,
            stdio: 'pipe'
        });
        // Create output channel for server logs
        const outputChannel = vscode.window.createOutputChannel('Encrypt Server');
        outputChannel.show();
        serverProcess.stdout?.on('data', (data) => {
            outputChannel.appendLine(data.toString());
        });
        serverProcess.stderr?.on('data', (data) => {
            outputChannel.appendLine(`ERROR: ${data.toString()}`);
        });
        serverProcess.on('close', (code) => {
            outputChannel.appendLine(`Server exited with code ${code}`);
        });
        vscode.window.showInformationMessage('Encrypt server started on http://localhost:8088');
        // Open the server interface in browser
        vscode.env.openExternal(vscode.Uri.parse('http://localhost:8088'));
    }
    catch (error) {
        vscode.window.showErrorMessage(`Failed to start server: ${error}`);
    }
}
// Helper function to run commands
function runCommand(command, args, options) {
    return new Promise((resolve, reject) => {
        const process = (0, child_process_1.spawn)(command, args, options);
        let output = '';
        let error = '';
        process.stdout?.on('data', (data) => {
            output += data.toString();
        });
        process.stderr?.on('data', (data) => {
            error += data.toString();
        });
        process.on('close', (code) => {
            if (code === 0) {
                resolve(output);
            }
            else {
                reject(new Error(error || `Process exited with code ${code}`));
            }
        });
        process.on('error', (err) => {
            reject(err);
        });
    });
}
function deactivate() { }
//# sourceMappingURL=extension.js.map