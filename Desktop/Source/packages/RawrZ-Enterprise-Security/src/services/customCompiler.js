const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils/logger');
const { generateUUID } = require('../utils/helpers');

class RawrZCompiler {
    constructor() {
        this.supportedLanguages = {
            'cpp': { extension: '.cpp', compiler: 'g++', flags: ['-std=c++17', '-O2'] },
            'c': { extension: '.c', compiler: 'gcc', flags: ['-std=c11', '-O2'] },
            'js': { extension: '.js', compiler: 'node', flags: [] },
            'py': { extension: '.py', compiler: 'python', flags: [] },
            'java': { extension: '.java', compiler: 'javac', flags: [] },
            'cs': { extension: '.cs', compiler: 'csc', flags: [] }
        };
        
        this.compilationQueue = new Map();
        this.buildCache = new Map();
    }

    async compileCode(sourceCode, language, options = {}) {
        const requestId = generateUUID();
        const timestamp = Date.now();
        
        try {
            logger.info('Starting compilation', { requestId, language, timestamp });
            
            // Validate language
            if (!this.supportedLanguages[language]) {
                throw new Error(`Unsupported language: ${language}`);
            }

            // Create temporary files
            const tempDir = path.join(__dirname, '../../temp');
            await this.ensureDirectory(tempDir);
            
            const sourceFile = path.join(tempDir, `source_${requestId}${this.supportedLanguages[language].extension}`);
            const outputFile = path.join(tempDir, `output_${requestId}`);
            
            // Write source code to file
            await fs.writeFile(sourceFile, sourceCode, 'utf8');
            
            // Compile based on language
            const result = await this.executeCompilation(sourceFile, outputFile, language, options);
            
            // Clean up temporary files
            await this.cleanup([sourceFile, outputFile]);
            
            logger.info('Compilation completed', { requestId, success: result.success });
            
            return {
                success: result.success,
                output: result.output,
                errors: result.errors,
                warnings: result.warnings,
                executable: result.executable,
                requestId,
                timestamp
            };
            
        } catch (error) {
            logger.error('Compilation failed', { requestId, error: error.message });
            return {
                success: false,
                output: '',
                errors: [error.message],
                warnings: [],
                executable: null,
                requestId,
                timestamp
            };
        }
    }

    async executeCompilation(sourceFile, outputFile, language, options) {
        const langConfig = this.supportedLanguages[language];
        
        return new Promise((resolve) => {
            let command;
            let args = [];
            
            switch (language) {
                case 'cpp':
                case 'c':
                    command = langConfig.compiler;
                    args = [...langConfig.flags, sourceFile, '-o', outputFile];
                    break;
                    
                case 'js':
                    // JavaScript doesn't need compilation, just validation
                    resolve({
                        success: true,
                        output: 'JavaScript syntax validated',
                        errors: [],
                        warnings: [],
                        executable: sourceFile
                    });
                    return;
                    
                case 'py':
                    // Python syntax check
                    command = 'python';
                    args = ['-m', 'py_compile', sourceFile];
                    break;
                    
                case 'java':
                    command = langConfig.compiler;
                    args = [sourceFile];
                    break;
                    
                case 'cs':
                    command = langConfig.compiler;
                    args = ['/out:' + outputFile + '.exe', sourceFile];
                    break;
                    
                default:
                    resolve({
                        success: false,
                        output: '',
                        errors: [`Unsupported language: ${language}`],
                        warnings: [],
                        executable: null
                    });
                    return;
            }
            
            const fullCommand = `${command} ${args.join(' ')}`;
            logger.info('Executing compilation command', { command: fullCommand });
            
            exec(fullCommand, { timeout: 30000 }, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        success: false,
                        output: stdout,
                        errors: stderr.split('\n').filter(line => line.trim()),
                        warnings: [],
                        executable: null
                    });
                } else {
                    resolve({
                        success: true,
                        output: stdout,
                        errors: [],
                        warnings: stderr.split('\n').filter(line => line.trim()),
                        executable: outputFile
                    });
                }
            });
        });
    }

    async runCode(executable, language, input = '') {
        const requestId = generateUUID();
        
        try {
            logger.info('Running compiled code', { requestId, language });
            
            let command;
            let args = [];
            
            switch (language) {
                case 'cpp':
                case 'c':
                    command = executable;
                    break;
                    
                case 'js':
                    command = 'node';
                    args = [executable];
                    break;
                    
                case 'py':
                    command = 'python';
                    args = [executable];
                    break;
                    
                case 'java':
                    const className = path.basename(executable, '.class');
                    command = 'java';
                    args = ['-cp', path.dirname(executable), className];
                    break;
                    
                case 'cs':
                    command = executable + '.exe';
                    break;
                    
                default:
                    throw new Error(`Cannot run language: ${language}`);
            }
            
            return new Promise((resolve) => {
                const fullCommand = `${command} ${args.join(' ')}`;
                logger.info('Executing code', { command: fullCommand });
                
                exec(fullCommand, { 
                    timeout: 10000,
                    input: input 
                }, (error, stdout, stderr) => {
                    resolve({
                        success: !error,
                        output: stdout,
                        errors: stderr.split('\n').filter(line => line.trim()),
                        requestId
                    });
                });
            });
            
        } catch (error) {
            logger.error('Code execution failed', { requestId, error: error.message });
            return {
                success: false,
                output: '',
                errors: [error.message],
                requestId
            };
        }
    }

    async analyzeCode(sourceCode, language) {
        const requestId = generateUUID();
        
        try {
            const analysis = {
                lines: sourceCode.split('\n').length,
                characters: sourceCode.length,
                functions: this.extractFunctions(sourceCode, language),
                classes: this.extractClasses(sourceCode, language),
                imports: this.extractImports(sourceCode, language),
                complexity: this.calculateComplexity(sourceCode),
                requestId
            };
            
            logger.info('Code analysis completed', { requestId, analysis });
            return analysis;
            
        } catch (error) {
            logger.error('Code analysis failed', { requestId, error: error.message });
            return {
                lines: 0,
                characters: 0,
                functions: [],
                classes: [],
                imports: [],
                complexity: 0,
                error: error.message,
                requestId
            };
        }
    }

    extractFunctions(sourceCode, language) {
        const functions = [];
        const lines = sourceCode.split('\n');
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            
            // Simple function detection patterns
            const patterns = {
                'cpp': /^\s*(?:static\s+)?(?:inline\s+)?(?:const\s+)?\w+\s+\w+\s*\([^)]*\)\s*(?:const\s*)?\s*{?/,
                'c': /^\s*(?:static\s+)?(?:inline\s+)?\w+\s+\w+\s*\([^)]*\)\s*{?/,
                'js': /^\s*(?:async\s+)?(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|class\s+\w+)/,
                'py': /^\s*def\s+\w+\s*\([^)]*\):|^\s*class\s+\w+/,
                'java': /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?\w+\s+\w+\s*\([^)]*\)\s*{?/,
                'cs': /^\s*(?:public|private|protected|internal)?\s*(?:static\s+)?(?:virtual\s+)?\w+\s+\w+\s*\([^)]*\)\s*{?/
            };
            
            if (patterns[language] && patterns[language].test(trimmed)) {
                functions.push({
                    name: this.extractFunctionName(trimmed, language),
                    line: index + 1,
                    signature: trimmed
                });
            }
        });
        
        return functions;
    }

    extractClasses(sourceCode, language) {
        const classes = [];
        const lines = sourceCode.split('\n');
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            
            const patterns = {
                'cpp': /^\s*class\s+\w+/,
                'c': /^\s*struct\s+\w+/,
                'js': /^\s*class\s+\w+/,
                'py': /^\s*class\s+\w+/,
                'java': /^\s*(?:public|private|protected)?\s*class\s+\w+/,
                'cs': /^\s*(?:public|private|protected|internal)?\s*class\s+\w+/
            };
            
            if (patterns[language] && patterns[language].test(trimmed)) {
                classes.push({
                    name: this.extractClassName(trimmed, language),
                    line: index + 1,
                    signature: trimmed
                });
            }
        });
        
        return classes;
    }

    extractImports(sourceCode, language) {
        const imports = [];
        const lines = sourceCode.split('\n');
        
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            
            const patterns = {
                'cpp': /^\s*#include\s*[<"][^>"]+[>"]/,
                'c': /^\s*#include\s*[<"][^>"]+[>"]/,
                'js': /^\s*(?:import\s+.*\s+from\s+['"][^'"]+['"]|require\s*\(\s*['"][^'"]+['"]\s*\))/,
                'py': /^\s*(?:import\s+\w+|from\s+\w+\s+import)/,
                'java': /^\s*import\s+[\w.]+/,
                'cs': /^\s*using\s+[\w.]+/
            };
            
            if (patterns[language] && patterns[language].test(trimmed)) {
                imports.push({
                    module: this.extractImportName(trimmed, language),
                    line: index + 1,
                    statement: trimmed
                });
            }
        });
        
        return imports;
    }

    calculateComplexity(sourceCode) {
        // Simple cyclomatic complexity calculation
        const lines = sourceCode.split('\n');
        let complexity = 1; // Base complexity
        
        lines.forEach(line => {
            const trimmed = line.trim();
            
            // Count decision points
            if (/\b(if|while|for|switch|case|catch|&&|\|\|)\b/.test(trimmed)) {
                complexity++;
            }
        });
        
        return complexity;
    }

    extractFunctionName(line, language) {
        const patterns = {
            'cpp': /(\w+)\s*\(/,
            'c': /(\w+)\s*\(/,
            'js': /(?:function\s+(\w+)|const\s+(\w+)\s*=|class\s+(\w+))/,
            'py': /(?:def\s+(\w+)|class\s+(\w+))/,
            'java': /(\w+)\s*\(/,
            'cs': /(\w+)\s*\(/
        };
        
        const match = line.match(patterns[language]);
        return match ? match[1] || match[2] || match[3] : 'unknown';
    }

    extractClassName(line, language) {
        const patterns = {
            'cpp': /class\s+(\w+)/,
            'c': /struct\s+(\w+)/,
            'js': /class\s+(\w+)/,
            'py': /class\s+(\w+)/,
            'java': /class\s+(\w+)/,
            'cs': /class\s+(\w+)/
        };
        
        const match = line.match(patterns[language]);
        return match ? match[1] : 'unknown';
    }

    extractImportName(line, language) {
        const patterns = {
            'cpp': /#include\s*[<"]([^>"]+)[>"]/,
            'c': /#include\s*[<"]([^>"]+)[>"]/,
            'js': /(?:import\s+.*\s+from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/,
            'py': /(?:import\s+(\w+)|from\s+(\w+)\s+import)/,
            'java': /import\s+([\w.]+)/,
            'cs': /using\s+([\w.]+)/
        };
        
        const match = line.match(patterns[language]);
        return match ? match[1] || match[2] : 'unknown';
    }

    async ensureDirectory(dir) {
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async cleanup(files) {
        for (const file of files) {
            try {
                await fs.unlink(file);
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    }

    getSupportedLanguages() {
        return Object.keys(this.supportedLanguages);
    }

    getLanguageInfo(language) {
        return this.supportedLanguages[language] || null;
    }
}

module.exports = new RawrZCompiler();
