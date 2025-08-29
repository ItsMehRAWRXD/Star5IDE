/**
 * Ollama Client for VS Code Extension
 * ===================================
 * 
 * Provides integration with local Ollama instances for AI-powered
 * security analysis within the VS Code extension.
 */

import * as vscode from 'vscode';

export interface OllamaConfig {
    baseUrl: string;
    model: string;
    timeout: number;
    maxRetries: number;
}

export interface OllamaResponse {
    content: string;
    model: string;
    responseTime: number;
    tokensUsed?: number;
    error?: string;
}

export interface OllamaModel {
    name: string;
    size: number;
    modified_at: string;
    digest: string;
}

export class OllamaClient {
    private config: OllamaConfig;
    private defaultHeaders: Record<string, string>;

    constructor(config?: Partial<OllamaConfig>) {
        this.config = {
            baseUrl: 'http://localhost:11434',
            model: 'llama2',
            timeout: 30000,
            maxRetries: 3,
            ...config
        };

        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'User-Agent': 'Modern-RFI-Scanner-VSCode/2.0'
        };
    }

    /**
     * Check if Ollama is running and accessible
     */
    async checkConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/tags`, {
                method: 'GET',
                headers: this.defaultHeaders,
                signal: AbortSignal.timeout(this.config.timeout)
            });
            return response.ok;
        } catch (error) {
            console.warn('Ollama connection check failed:', error);
            return false;
        }
    }

    /**
     * List available models
     */
    async listModels(): Promise<OllamaModel[]> {
        try {
            const response = await fetch(`${this.config.baseUrl}/api/tags`, {
                method: 'GET',
                headers: this.defaultHeaders,
                signal: AbortSignal.timeout(this.config.timeout)
            });

            if (response.ok) {
                const data = await response.json();
                return data.models || [];
            } else {
                console.error(`Failed to list models: ${response.status}`);
                return [];
            }
        } catch (error) {
            console.error('Error listing models:', error);
            return [];
        }
    }

    /**
     * Generate a response from Ollama
     */
    async generateResponse(
        prompt: string,
        options?: {
            model?: string;
            systemPrompt?: string;
            temperature?: number;
            maxTokens?: number;
        }
    ): Promise<OllamaResponse> {
        const startTime = Date.now();
        const model = options?.model || this.config.model;

        const payload: any = {
            model,
            prompt,
            stream: false,
            options: {
                temperature: options?.temperature ?? 0.7
            }
        };

        if (options?.systemPrompt) {
            payload.system = options.systemPrompt;
        }

        if (options?.maxTokens) {
            payload.options.num_predict = options.maxTokens;
        }

        for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
            try {
                const response = await fetch(`${this.config.baseUrl}/api/generate`, {
                    method: 'POST',
                    headers: this.defaultHeaders,
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(this.config.timeout)
                });

                if (response.ok) {
                    const data = await response.json();
                    const responseTime = Date.now() - startTime;

                    return {
                        content: data.response || '',
                        model: data.model || model,
                        responseTime,
                        tokensUsed: data.eval_count
                    };
                } else {
                    console.error(`Ollama API error: ${response.status} - ${await response.text()}`);
                }
            } catch (error) {
                console.error(`Attempt ${attempt + 1} failed:`, error);
                if (attempt < this.config.maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                }
                continue;
            }
        }

        const responseTime = Date.now() - startTime;
        return {
            content: '',
            model,
            responseTime,
            error: 'All retry attempts failed'
        };
    }

    /**
     * Analyze scan results using AI
     */
    async analyzeScanResults(scanResults: any[]): Promise<string> {
        if (!scanResults.length) {
            return 'No scan results to analyze.';
        }

        const totalScans = scanResults.length;
        const vulnerableCount = scanResults.filter(result => result.vulnerable).length;
        const vulnerablePercentage = totalScans > 0 ? (vulnerableCount / totalScans) * 100 : 0;

        const prompt = `
Analyze the following security scan results and provide a comprehensive report:

SCAN SUMMARY:
- Total targets scanned: ${totalScans}
- Vulnerable targets found: ${vulnerableCount}
- Vulnerability rate: ${vulnerablePercentage.toFixed(2)}%

DETAILED RESULTS:
${JSON.stringify(scanResults, null, 2)}

Please provide:
1. Executive summary of findings
2. Risk assessment and severity levels
3. Recommendations for remediation
4. Technical details of vulnerabilities found
5. Best practices for prevention

Format the response as a professional security report.
        `;

        const systemPrompt = `You are a cybersecurity expert analyzing security scan results. 
Provide clear, actionable insights and professional recommendations.`;

        const response = await this.generateResponse(prompt, {
            systemPrompt,
            temperature: 0.3
        });

        return response.error ? `Analysis failed: ${response.error}` : response.content;
    }

    /**
     * Generate payload suggestions based on target analysis
     */
    async generatePayloadSuggestions(targetUrl: string, scanContext: string): Promise<string> {
        const prompt = `
Analyze the following target and scan context to suggest custom security test payloads:

TARGET: ${targetUrl}
CONTEXT: ${scanContext}

Please suggest:
1. Custom RFI payloads specific to this target
2. LFI payloads that might work
3. Additional attack vectors to consider
4. Evasion techniques to avoid detection

Provide payloads in a format that can be directly used in security testing.
        `;

        const systemPrompt = `You are a security researcher specializing in web application security testing. 
Provide practical, effective payload suggestions for authorized security testing.`;

        const response = await this.generateResponse(prompt, {
            systemPrompt,
            temperature: 0.5
        });

        return response.error ? `Payload generation failed: ${response.error}` : response.content;
    }

    /**
     * Explain a specific vulnerability in detail
     */
    async explainVulnerability(vulnerabilityData: any): Promise<string> {
        const prompt = `
Explain the following security vulnerability in detail:

VULNERABILITY DATA:
${JSON.stringify(vulnerabilityData, null, 2)}

Please provide:
1. What this vulnerability is
2. How it can be exploited
3. Potential impact and risks
4. How to fix it
5. Prevention measures

Make the explanation suitable for both technical and non-technical audiences.
        `;

        const systemPrompt = `You are a cybersecurity educator explaining security vulnerabilities 
in a clear, educational manner for authorized security testing purposes.`;

        const response = await this.generateResponse(prompt, {
            systemPrompt,
            temperature: 0.4
        });

        return response.error ? `Explanation failed: ${response.error}` : response.content;
    }
}

/**
 * VS Code extension integration functions
 */
export class OllamaExtension {
    private client: OllamaClient;
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.client = new OllamaClient();
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.updateStatusBar();
    }

    /**
     * Update the status bar to show Ollama connection status
     */
    private async updateStatusBar(): Promise<void> {
        const isConnected = await this.client.checkConnection();
        
        this.statusBarItem.text = isConnected ? '$(light-bulb) Ollama' : '$(error) Ollama';
        this.statusBarItem.tooltip = isConnected ? 'Ollama is running' : 'Ollama is not running';
        this.statusBarItem.command = 'ollama.showStatus';
        
        if (isConnected) {
            this.statusBarItem.show();
        } else {
            this.statusBarItem.hide();
        }
    }

    /**
     * Show Ollama status in a notification
     */
    async showStatus(): Promise<void> {
        const isConnected = await this.client.checkConnection();
        
        if (isConnected) {
            const models = await this.client.listModels();
            const modelNames = models.map(m => m.name).join(', ');
            
            vscode.window.showInformationMessage(
                `Ollama is running. Available models: ${modelNames || 'None'}`
            );
        } else {
            vscode.window.showErrorMessage(
                'Ollama is not running. Please start Ollama with: ollama serve'
            );
        }
    }

    /**
     * Quick query function for simple Ollama queries
     */
    async quickQuery(prompt: string, model?: string): Promise<string> {
        if (!(await this.client.checkConnection())) {
            return 'Error: Ollama is not running or not accessible';
        }

        const response = await this.client.generateResponse(prompt, { model });
        return response.error ? `Error: ${response.error}` : response.content;
    }

    /**
     * Analyze current file or selection
     */
    async analyzeCurrentFile(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const document = editor.document;
        const selection = editor.selection;
        const text = selection.isEmpty 
            ? document.getText() 
            : document.getText(selection);

        if (!text.trim()) {
            vscode.window.showErrorMessage('No text to analyze');
            return;
        }

        const prompt = `Analyze the following code for security vulnerabilities:

${text}

Please provide:
1. Potential security issues
2. Risk assessment
3. Recommendations for improvement
4. Best practices to follow`;

        const systemPrompt = 'You are a cybersecurity expert analyzing code for security vulnerabilities.';

        vscode.window.showInformationMessage('Analyzing code with Ollama...');
        
        const response = await this.client.generateResponse(prompt, {
            systemPrompt,
            temperature: 0.3
        });

        if (response.error) {
            vscode.window.showErrorMessage(`Analysis failed: ${response.error}`);
            return;
        }

        // Create a new document with the analysis results
        const analysisDoc = await vscode.workspace.openTextDocument({
            content: `# Security Analysis Results

## Original Code
\`\`\`
${text}
\`\`\`

## Analysis
${response.content}

---
*Generated by Ollama AI at ${new Date().toLocaleString()}*
`,
            language: 'markdown'
        });

        await vscode.window.showTextDocument(analysisDoc);
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        this.statusBarItem.dispose();
    }
}

// Export convenience function
export async function quickOllamaQuery(prompt: string, model: string = 'llama2'): Promise<string> {
    const client = new OllamaClient({ model });
    
    if (!(await client.checkConnection())) {
        return 'Error: Ollama is not running or not accessible';
    }
    
    const response = await client.generateResponse(prompt);
    return response.error ? `Error: ${response.error}` : response.content;
}