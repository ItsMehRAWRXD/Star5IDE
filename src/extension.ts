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

  const genEncStubToAnyCmd = vscode.commands.registerCommand('carmilla.generateAndEncryptStubToAny', async () => {
    try {
      const language = await vscode.window.showQuickPick(['node', 'python', 'ruby', 'text'], { placeHolder: 'Select stub language' });
      if (!language) return;
      const uri = await vscode.window.showSaveDialog({ saveLabel: 'Save packaged stub as (any extension allowed)' });
      if (!uri) return;
      const passphrase = await vscode.window.showInputBox({ prompt: 'Enter passphrase for encryption', password: true });
      if (!passphrase) return;

      const mod = await import('./utils/stubGenerator');
      await mod.packageStubToTarget(uri.fsPath, language as any, passphrase, { createdBy: 'VSCodeCmd' });

      vscode.window.showInformationMessage('Packaged stub written successfully to selected file.');
    } catch (e: any) {
      vscode.window.showErrorMessage(`Failed to package stub to target: ${e?.message ?? e}`);
    }
  });

  const packageTextAndFilesCmd = vscode.commands.registerCommand('carmilla.packageTextAndFilesToAny', async () => {
    try {
      const targetUri = await vscode.window.showSaveDialog({ saveLabel: 'Save encrypted package as (any extension allowed)' });
      if (!targetUri) return;
      const text = await vscode.window.showInputBox({ prompt: 'Optional: enter text to include (leave blank to skip)' });
      const passphrase = await vscode.window.showInputBox({ prompt: 'Enter passphrase for encryption', password: true });
      if (!passphrase) return;

      // Collect selected files from the Explorer selection if available
      // @ts-ignore VS Code API typing available at runtime
      const selected: vscode.Uri[] | undefined = (vscode as any)?.window?.activeTextEditor?.selections ? undefined : undefined;
      // Fallback: ask for URIs via open dialog with multi-select
      const pickFiles = await vscode.window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: true, openLabel: 'Select files to include (optional)' });
      const filePaths = (pickFiles ?? []).map(u => u.fsPath);

      const mod = await import('./utils/payloadWrapper');
      const summary = await mod.createEncryptedPayloadToFile(targetUri.fsPath, { text: text ?? '', filePaths }, passphrase, { createdBy: 'VSCodeCmd' });

      vscode.window.showInformationMessage(`Encrypted package written (${summary.filesCount} files, text=${summary.hasText}).`);
    } catch (e: any) {
      vscode.window.showErrorMessage(`Failed to package text/files: ${e?.message ?? e}`);
    }
  });

  context.subscriptions.push(helloCmd, genEncStubCmd, genEncStubToAnyCmd, packageTextAndFilesCmd);
}

export function deactivate() {}
