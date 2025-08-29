import * as vscode from 'vscode';

declare function require(name: string): any;
const https: any = require('https');
const { URL }: any = require('url');

async function postJSON(urlStr: string, headers: Record<string, string>, body: any): Promise<any> {
  const url = new URL(urlStr);
  const payload = Buffer.from(JSON.stringify(body));
  const options: any = {
    method: 'POST',
    hostname: url.hostname,
    path: url.pathname + (url.search || ''),
    port: url.port || 443,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length,
      ...headers
    }
  };
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res: any) => {
      const chunks: Buffer[] = [];
      res.on('data', (d: Buffer) => chunks.push(d));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          resolve(JSON.parse(text));
        } catch {
          resolve({ raw: text, statusCode: res.statusCode });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function callOpenAICompatibleChat(baseURL: string, apiKey: string, model: string, system: string | undefined, user: string) {
  const url = baseURL.replace(/\/$/, '') + '/chat/completions';
  const headers: Record<string, string> = { 'Authorization': `Bearer ${apiKey}` };
  const body: any = {
    model,
    messages: [] as Array<{ role: string; content: string }>,
    max_tokens: 256
  };
  if (system && system.trim().length > 0) {
    body.messages.push({ role: 'system', content: system });
  }
  body.messages.push({ role: 'user', content: user });
  return await postJSON(url, headers, body);
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('hello.sayHello', async () => {
    const input = await vscode.window.showInputBox({
      title: 'LLM Prompt',
      placeHolder: 'Type your prompt...',
    });
    if (!input) { return; }

    const apiKey = process.env.API_KEY || process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY || '';
    const baseURL = process.env.BASE_URL || process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    const model = process.env.MODEL || process.env.OPENROUTER_MODEL || 'nousresearch/hermes-3-llama-3.1-8b';
    const system = process.env.SYSTEM || 'You are a helpful assistant. Be concise.';

    if (!apiKey) {
      vscode.window.showErrorMessage('API key not set. Export API_KEY (or provider-specific key) and try again.');
      return;
    }

    const output = vscode.window.createOutputChannel('LLM Output');
    output.show(true);
    output.appendLine(`[Request] baseURL=${baseURL}, model=${model}`);

    try {
      const res = await callOpenAICompatibleChat(baseURL, apiKey, model, system, input);
      const text = (res?.choices?.[0]?.message?.content) || res?.raw || JSON.stringify(res, null, 2);
      output.appendLine('\n[Response]\n');
      output.appendLine(text);
    } catch (err: any) {
      output.appendLine('\n[Error]\n');
      output.appendLine(String(err?.message || err));
      vscode.window.showErrorMessage('LLM request failed. See "LLM Output" panel.');
    }
  });
  context.subscriptions.push(disposable);
}

export function deactivate() {}

