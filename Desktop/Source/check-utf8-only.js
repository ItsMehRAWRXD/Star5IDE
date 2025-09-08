#!/usr/bin/env node

// UTF-8 Only Checker - Scans entire source for non-ASCII characters
const fs = require('fs');
const path = require('path');

class UTF8Checker {
    constructor() {
        this.violations = [];
        this.totalFiles = 0;
        this.checkedFiles = 0;
        
        // Common non-ASCII patterns to look for
        this.nonAsciiPatterns = [
            // Emojis
            /[\u1F300-\u1F9FF]/g, // Emoticons
            /[\u2600-\u26FF]/g,   // Miscellaneous Symbols
            /[\u2700-\u27BF]/g,   // Dingbats
            
            // Other common Unicode
            /[\u2000-\u206F]/g,   // General Punctuation
            /[\u2E00-\u2E7F]/g,   // Supplemental Punctuation
            /[\u3000-\u303F]/g,   // CJK Symbols and Punctuation
            
            // Any non-ASCII character
            /[^\x00-\x7F]/g
        ];
        
        this.emojiMap = {
            '[OK]': '[OK]',
            '[ERROR]': '[ERROR]',
            '[WARN]': '[WARN]',
            '[ALERT]': '[ALERT]',
            '[INFO]': '[INFO]',
            '[DEBUG]': '[DEBUG]',
            '[CONNECT]': '[CONNECT]',
            '[START]': '[START]',
            '[STATUS]': '[STATUS]',
            '[LOG]': '[LOG]',
            '[SEARCH]': '[SEARCH]',
            '[SECURITY]': '[SECURITY]',
            '[CHAT]': '[CHAT]',
            '[BOT]': '[BOT]'
        };
    }
    
    // Check if a file contains non-ASCII characters
    checkFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const violations = [];
            
            // Check each line for non-ASCII characters
            const lines = content.split('\n');
            lines.forEach((line, lineNumber) => {
                for (const pattern of this.nonAsciiPatterns) {
                    const matches = line.match(pattern);
                    if (matches) {
                        matches.forEach(match => {
                            violations.push({
                                file: filePath,
                                line: lineNumber + 1,
                                column: line.indexOf(match) + 1,
                                character: match,
                                context: line.trim(),
                                suggestion: this.emojiMap[match] || '[REPLACE]'
                            });
                        });
                    }
                }
            });
            
            return violations;
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error.message);
            return [];
        }
    }
    
    // Recursively scan directory
    scanDirectory(dirPath) {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Skip node_modules, .git, logs, etc.
                if (!['node_modules', '.git', 'logs', 'dist', 'build'].includes(item)) {
                    this.scanDirectory(fullPath);
                }
            } else if (stat.isFile()) {
                // Only check text files
                const ext = path.extname(item).toLowerCase();
                if (['.js', '.ts', '.jsx', '.tsx', '.json', '.yaml', '.yml', '.md', '.txt', '.html', '.css'].includes(ext)) {
                    this.totalFiles++;
                    const violations = this.checkFile(fullPath);
                    if (violations.length > 0) {
                        this.violations.push(...violations);
                    }
                    this.checkedFiles++;
                }
            }
        }
    }
    
    // Generate report
    generateReport() {
        console.log('\n=== UTF-8 ONLY CHECKER REPORT ===\n');
        console.log(`Total files scanned: ${this.checkedFiles}/${this.totalFiles}`);
        console.log(`Files with violations: ${new Set(this.violations.map(v => v.file)).size}`);
        console.log(`Total violations: ${this.violations.length}\n`);
        
        if (this.violations.length === 0) {
            console.log('[OK] ALL FILES ARE UTF-8 COMPLIANT!');
            return;
        }
        
        // Group violations by file
        const violationsByFile = {};
        this.violations.forEach(violation => {
            if (!violationsByFile[violation.file]) {
                violationsByFile[violation.file] = [];
            }
            violationsByFile[violation.file].push(violation);
        });
        
        // Report violations
        Object.keys(violationsByFile).forEach(file => {
            console.log(`\n[FOLDER] ${file}:`);
            violationsByFile[file].forEach(violation => {
                console.log(`  Line ${violation.line}:${violation.column} - Found: "${violation.character}"`);
                console.log(`    Context: ${violation.context}`);
                console.log(`    Suggestion: Replace with "${violation.suggestion}"`);
            });
        });
        
        // Generate fix script
        this.generateFixScript();
    }
    
    // Generate a script to automatically fix violations
    generateFixScript() {
        const fixScript = `#!/usr/bin/env node
// Auto-generated fix script for UTF-8 violations
const fs = require('fs');

const fixes = [
${this.violations.map(v => 
    `    { file: '${v.file}', line: ${v.line}, old: '${v.character}', new: '${v.suggestion}' }`
).join(',\n')}
];

console.log('Applying UTF-8 fixes...');
let fixedCount = 0;

fixes.forEach(fix => {
    try {
        const content = fs.readFileSync(fix.file, 'utf8');
        const lines = content.split('\\n');
        if (lines[fix.line - 1]) {
            lines[fix.line - 1] = lines[fix.line - 1].replace(fix.old, fix.new);
            fs.writeFileSync(fix.file, lines.join('\\n'), 'utf8');
            fixedCount++;
        }
    } catch (error) {
        console.error(\`Error fixing \${fix.file}:\`, error.message);
    }
});

console.log(\`Fixed \${fixedCount} violations.\`);
`;
        
        fs.writeFileSync('fix-utf8-violations.js', fixScript);
        console.log('\n[CHAR][CHAR] Generated fix script: fix-utf8-violations.js');
        console.log('   Run: node fix-utf8-violations.js');
    }
    
    // Main execution
    run() {
        console.log('[SEARCH] Scanning source directory for non-UTF-8 characters...\n');
        
        const startTime = Date.now();
        this.scanDirectory('./src');
        this.scanDirectory('./public');
        this.scanDirectory('./scripts');
        const endTime = Date.now();
        
        console.log(`\n[CHAR][CHAR]  Scan completed in ${endTime - startTime}ms`);
        this.generateReport();
    }
}

// Run the checker
const checker = new UTF8Checker();
checker.run();
