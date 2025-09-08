#!/usr/bin/env node

// UTF-8 ENFORCEMENT MASTER - Comprehensive system for API, generators, templates, stubs, exploits, PowerShell
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class UTF8EnforcementMaster {
    constructor() {
        this.violations = [];
        this.fixedFiles = [];
        this.scannedFiles = 0;
        this.isWindows = process.platform === 'win32';
        
        // UTF-8 violation patterns
        this.patterns = {
            'NON_ASCII': /[^\x00-\x7F]/g,
            'EMOJIS': /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
            'CORRUPTED_CHARS': /[CHAR][CHAR][[CHAR]-[CHAR]]|[CHAR][CHAR][[CHAR]-[CHAR]]/g,
            'UNICODE_CONTROL': /[\u2000-\u206F\u2E00-\u2E7F\u3000-\u303F]/g
        };
        
        // File extensions to scan
        this.scanExtensions = [
            '.js', '.ts', '.jsx', '.tsx', '.json', '.yaml', '.yml',
            '.html', '.css', '.scss', '.less', '.xml', '.svg',
            '.bat', '.cmd', '.ps1', '.sh', '.bash',
            '.md', '.txt', '.log', '.conf', '.config',
            '.py', '.java', '.cpp', '.c', '.h', '.hpp',
            '.php', '.rb', '.go', '.rs', '.swift', '.kt'
        ];
        
        // Directories to scan
        this.scanDirectories = [
            './src', './public', './scripts', './config',
            './packages', './netlify', './nginx', './temp'
        ];
    }
    
    // Scan entire codebase for UTF-8 violations
    async scanCodebase() {
        console.log('[UTF8_MASTER] Starting comprehensive UTF-8 enforcement scan...');
        
        for (const dir of this.scanDirectories) {
            if (fs.existsSync(dir)) {
                await this.scanDirectory(dir);
            }
        }
        
        // Scan root files
        const rootFiles = fs.readdirSync('.').filter(file => {
            const ext = path.extname(file);
            return this.scanExtensions.includes(ext) || file.endsWith('.bat') || file.endsWith('.ps1');
        });
        
        for (const file of rootFiles) {
            await this.scanFile(file);
        }
        
        this.generateReport();
    }
    
    // Scan directory recursively
    async scanDirectory(dirPath) {
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    await this.scanDirectory(fullPath);
                } else if (stat.isFile()) {
                    const ext = path.extname(item);
                    if (this.scanExtensions.includes(ext)) {
                        await this.scanFile(fullPath);
                    }
                }
            }
        } catch (error) {
            console.log(`[WARN] Could not scan directory ${dirPath}: ${error.message}`);
        }
    }
    
    // Scan individual file for UTF-8 violations
    async scanFile(filePath) {
        try {
            this.scannedFiles++;
            const content = fs.readFileSync(filePath, 'utf8');
            const violations = this.detectViolations(content, filePath);
            
            if (violations.length > 0) {
                this.violations.push({
                    file: filePath,
                    violations: violations,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`[VIOLATION] ${filePath}: ${violations.length} UTF-8 violations detected`);
                
                // Auto-fix if possible
                const fixed = await this.autoFixFile(filePath, content, violations);
                if (fixed) {
                    this.fixedFiles.push(filePath);
                    console.log(`[FIXED] ${filePath}: Auto-fixed UTF-8 violations`);
                }
            }
        } catch (error) {
            console.log(`[ERROR] Could not scan file ${filePath}: ${error.message}`);
        }
    }
    
    // Detect UTF-8 violations in content
    detectViolations(content, filePath) {
        const violations = [];
        
        for (const [type, pattern] of Object.entries(this.patterns)) {
            const matches = content.match(pattern);
            if (matches) {
                violations.push({
                    type: type,
                    pattern: pattern.toString(),
                    matches: matches.slice(0, 10), // First 10 matches
                    count: matches.length,
                    severity: this.getSeverity(type)
                });
            }
        }
        
        return violations;
    }
    
    // Get severity level for violation type
    getSeverity(type) {
        const severityMap = {
            'NON_ASCII': 'CRITICAL',
            'EMOJIS': 'HIGH',
            'CORRUPTED_CHARS': 'CRITICAL',
            'UNICODE_CONTROL': 'MEDIUM'
        };
        return severityMap[type] || 'LOW';
    }
    
    // Auto-fix UTF-8 violations
    async autoFixFile(filePath, content, violations) {
        let fixedContent = content;
        let wasFixed = false;
        
        // Fix emojis with text equivalents
        const emojiMap = {
            '[OK]': '[OK]', '[ERROR]': '[ERROR]', '[WARN]': '[WARN]', '[ALERT]': '[ALERT]',
            '[INFO]': '[INFO]', '[DEBUG]': '[DEBUG]', '[CONNECT]': '[CONNECT]', '[START]': '[START]',
            '[STATUS]': '[STATUS]', '[LOG]': '[LOG]', '[SEARCH]': '[SEARCH]', '[SECURITY]': '[SECURITY]',
            '[CHAT]': '[CHAT]', '[BOT]': '[BOT]', '[WEB]': '[WEB]', '[TARGET]': '[TARGET]',
            '[SUCCESS]': '[SUCCESS]', '[FOLDER]': '[FOLDER]', '[LIST]': '[LIST]', '[CLEAN]': '[CLEAN]',
            '[CLEANUP]': '[CLEANUP]', '[SAVE]': '[SAVE]', '[LOCK]': '[LOCK]', '[UNLOCK]': '[UNLOCK]'
        };
        
        for (const [emoji, replacement] of Object.entries(emojiMap)) {
            if (fixedContent.includes(emoji)) {
                fixedContent = fixedContent.replace(new RegExp(emoji, 'g'), replacement);
                wasFixed = true;
            }
        }
        
        // Remove other non-ASCII characters (replace with safe alternatives)
        const nonAsciiMatches = fixedContent.match(/[^\x00-\x7F]/g);
        if (nonAsciiMatches) {
            const uniqueChars = [...new Set(nonAsciiMatches)];
            for (const char of uniqueChars) {
                fixedContent = fixedContent.replace(new RegExp(char, 'g'), '[CHAR]');
                wasFixed = true;
            }
        }
        
        if (wasFixed) {
            try {
                fs.writeFileSync(filePath, fixedContent, 'utf8');
                return true;
            } catch (error) {
                console.log(`[ERROR] Could not write fixed file ${filePath}: ${error.message}`);
                return false;
            }
        }
        
        return false;
    }
    
    // Generate comprehensive report
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('UTF-8 ENFORCEMENT MASTER - COMPREHENSIVE REPORT');
        console.log('='.repeat(80));
        
        console.log(`\n[SCAN_STATS]`);
        console.log(`Files scanned: ${this.scannedFiles}`);
        console.log(`Files with violations: ${this.violations.length}`);
        console.log(`Files auto-fixed: ${this.fixedFiles.length}`);
        
        if (this.violations.length > 0) {
            console.log(`\n[VIOLATIONS_DETAILED]`);
            this.violations.forEach((violation, index) => {
                console.log(`\n${index + 1}. ${violation.file}`);
                violation.violations.forEach(v => {
                    console.log(`   - ${v.type} (${v.severity}): ${v.count} occurrences`);
                    console.log(`     Examples: ${v.matches.slice(0, 3).join(', ')}`);
                });
            });
        }
        
        if (this.fixedFiles.length > 0) {
            console.log(`\n[AUTO_FIXED_FILES]`);
            this.fixedFiles.forEach(file => {
                console.log(`   - ${file}`);
            });
        }
        
        console.log(`\n[RECOMMENDATIONS]`);
        if (this.violations.length === 0) {
            console.log('   - [SUCCESS] No UTF-8 violations detected!');
            console.log('   - [SUCCESS] Codebase is UTF-8 compliant');
        } else {
            console.log('   - [WARN] Manual review required for unfixed violations');
            console.log('   - [WARN] Consider running this script again after manual fixes');
        }
        
        console.log('\n' + '='.repeat(80));
        
        // Save report to file
        const report = {
            timestamp: new Date().toISOString(),
            scannedFiles: this.scannedFiles,
            violations: this.violations,
            fixedFiles: this.fixedFiles,
            summary: {
                totalViolations: this.violations.reduce((sum, v) => sum + v.violations.length, 0),
                criticalViolations: this.violations.reduce((sum, v) => 
                    sum + v.violations.filter(viol => viol.severity === 'CRITICAL').length, 0),
                autoFixed: this.fixedFiles.length
            }
        };
        
        fs.writeFileSync('utf8-enforcement-report.json', JSON.stringify(report, null, 2));
        console.log(`\n[REPORT] Detailed report saved to: utf8-enforcement-report.json`);
    }
}

// Run UTF-8 enforcement master
async function main() {
    const master = new UTF8EnforcementMaster();
    await master.scanCodebase();
    
    // Exit with appropriate code
    process.exit(master.violations.length === 0 ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = UTF8EnforcementMaster;
