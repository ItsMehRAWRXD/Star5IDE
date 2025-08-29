import * as vscode from 'vscode';
import { OllamaExtension } from './ollama-client';

let ollamaExtension: OllamaExtension;

export function activate(context: vscode.ExtensionContext) {
  // Initialize Ollama extension
  ollamaExtension = new OllamaExtension();

  // Register commands
  const commands = [
    vscode.commands.registerCommand('hello.sayHello', () => {
      vscode.window.showInformationMessage('Hello from your extension!');
    }),
    
    vscode.commands.registerCommand('ollama.showStatus', () => {
      ollamaExtension.showStatus();
    }),
    
    vscode.commands.registerCommand('ollama.analyzeFile', () => {
      ollamaExtension.analyzeCurrentFile();
    }),
    
    vscode.commands.registerCommand('ollama.quickQuery', async () => {
      const prompt = await vscode.window.showInputBox({
        prompt: 'Enter your question for Ollama:',
        placeHolder: 'e.g., Explain what RFI vulnerability is'
      });
      
      if (prompt) {
        vscode.window.showInformationMessage('Querying Ollama...');
        const response = await ollamaExtension.quickQuery(prompt);
        
        // Show response in a new document
        const doc = await vscode.workspace.openTextDocument({
          content: `# Ollama Response

## Query
${prompt}

## Response
${response}

---
*Generated at ${new Date().toLocaleString()}*
`,
          language: 'markdown'
        });
        
        await vscode.window.showTextDocument(doc);
      }
    })
  ];

  // Add all commands to subscriptions
  commands.forEach(cmd => context.subscriptions.push(cmd));
  
  // Add Ollama extension to subscriptions for cleanup
  context.subscriptions.push(ollamaExtension);
}

export function deactivate() {
  if (ollamaExtension) {
    ollamaExtension.dispose();
  }
}
