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
const https = require('https');
const { URL } = require('url');
async function postJSON(urlStr, headers, body) {
    const url = new URL(urlStr);
    const payload = Buffer.from(JSON.stringify(body));
    const options = {
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
        const req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', (d) => chunks.push(d));
            res.on('end', () => {
                const text = Buffer.concat(chunks).toString('utf8');
                try {
                    resolve(JSON.parse(text));
                }
                catch {
                    resolve({ raw: text, statusCode: res.statusCode });
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}
async function callOpenAICompatibleChat(baseURL, apiKey, model, system, user) {
    const url = baseURL.replace(/\/$/, '') + '/chat/completions';
    const headers = { 'Authorization': `Bearer ${apiKey}` };
    const body = {
        model,
        messages: [],
        max_tokens: 256
    };
    if (system && system.trim().length > 0) {
        body.messages.push({ role: 'system', content: system });
    }
    body.messages.push({ role: 'user', content: user });
    return await postJSON(url, headers, body);
}
function activate(context) {
    const disposable = vscode.commands.registerCommand('hello.sayHello', async () => {
        const input = await vscode.window.showInputBox({
            title: 'LLM Prompt',
            placeHolder: 'Type your prompt...',
        });
        if (!input) {
            return;
        }
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
        }
        catch (err) {
            output.appendLine('\n[Error]\n');
            output.appendLine(String(err?.message || err));
            vscode.window.showErrorMessage('LLM request failed. See "LLM Output" panel.');
        }
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map