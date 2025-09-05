import * as vscode from 'vscode';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const require: any;

export function activate(context: vscode.ExtensionContext) {
  const helloCmd = vscode.commands.registerCommand('hello.sayHello', () => {
    vscode.window.showInformationMessage('Hello from your extension!');
  });

  const genEncStubCmd = vscode.commands.registerCommand('carmilla.generateAndEncryptStub', async () => {
    try {
      const language = await vscode.window.showQuickPick(['node', 'python', 'ruby', 'text'], { placeHolder: 'Select stub language' });
      if (!language) return;
      const uri = await vscode.window.showSaveDialog({ saveLabel: 'Save stub before encrypting' });
      if (!uri) return;
      const passphrase = await vscode.window.showInputBox({ prompt: 'Enter passphrase for encryption', password: true });
      if (!passphrase) return;

      const mod = await import('./utils/stubGenerator');
      const packaged = await mod.writeAndEncryptStub(uri.fsPath, language as any, passphrase, { createdBy: 'VSCodeCmd' });

      // Offer to save the packaged data alongside (optional)
      const savePkg = await vscode.window.showQuickPick(['Yes', 'No'], { placeHolder: 'Save packaged (.pkg.b64) alongside stub?' });
      if (savePkg === 'Yes') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const B: any = (globalThis as any).Buffer || require('buffer').Buffer;
        const pkgUri = uri.with({ path: uri.path + '.pkg.b64' });
        await vscode.workspace.fs.writeFile(pkgUri, B.from(packaged, 'utf-8'));
      }

      vscode.window.showInformationMessage('Stub generated and encrypted successfully.');
    } catch (e: any) {
      vscode.window.showErrorMessage(`Failed to generate/encrypt stub: ${e?.message ?? e}`);
    }
  });

  context.subscriptions.push(helloCmd, genEncStubCmd);
}

export function deactivate() {}
