#!/usr/bin/env node

// CAMPSITE CLEANUP - Comprehensive desktop cleanup and self-termination (EMOJI-FREE)
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const emojiMap = {
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
    '[BOT]': '[BOT]',
    '[WEB]': '[WEB]'
};

class CampsiteCleanup {
    constructor() {
        this.isWindows = process.platform === 'win32';
        this.stats = {
            filesScanned: 0,
            filesFixed: 0,
            emojisRemoved: 0,
            processesKilled: 0,
            startTime: Date.now()
        };
    }

    // Kill all Node processes (clean camp site)
    async killAllNodeProcesses() {
        console.log('[CAMPSITE] Killing all Node processes...');
        
        return new Promise((resolve) => {
            const command = this.isWindows ? 'taskkill /IM node.exe /F' : 'pkill -f node';
            
            exec(command, (error, stdout, stderr) => {
                if (error && !error.message.includes('not found') && !error.message.includes('No tasks')) {
                    console.log('[CAMPSITE] Some processes may not exist (this is normal)');
                }
                
                console.log('[CAMPSITE] Node processes terminated');
                this.stats.processesKilled++;
                setTimeout(() => resolve(), 1000);
            });
        });
    }

    // Remove emojis from a single file
    removeEmojisFromFile(filePath) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;
            let emojiCount = 0;
            
            // Check for actual emoji characters (not the replacement text)
            const emojiPatterns = [
                /[\u1F300-\u1F9FF]/g, // Emoticons
                /[\u2600-\u26FF]/g,   // Miscellaneous Symbols
                /[\u2700-\u27BF]/g,   // Dingbats
                /[\u2000-\u206F]/g,   // General Punctuation
                /[\u2E00-\u2E7F]/g,   // Supplemental Punctuation
                /[\u3000-\u303F]/g    // CJK Symbols and Punctuation
            ];
            
            for (const pattern of emojiPatterns) {
                const matches = content.match(pattern);
                if (matches) {
                    emojiCount += matches.length;
                    content = content.replace(pattern, '[REPLACE]');
                    modified = true;
                }
            }
            
            if (modified) {
                fs.writeFileSync(filePath, content, 'utf8');
                this.stats.emojisRemoved += emojiCount;
                return true;
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }

    // Scan and fix directory recursively
    scanAndFixDirectory(dirPath, depth = 0) {
        if (depth > 8) return; // Prevent infinite recursion
        
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                
                try {
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory()) {
                        // Skip system directories
                        if (!['node_modules', '.git', 'logs', 'dist', 'build', 'System Volume Information', '$RECYCLE.BIN', 'AppData', 'Windows'].includes(item)) {
                            this.scanAndFixDirectory(fullPath, depth + 1);
                        }
                    } else if (stat.isFile()) {
                        const ext = path.extname(item).toLowerCase();
                        if (['.js', '.ts', '.jsx', '.tsx', '.json', '.yaml', '.yml', '.md', '.txt', '.html', '.css', '.php', '.py', '.java', '.cpp', '.c', '.h'].includes(ext)) {
                            this.stats.filesScanned++;
                            
                            if (this.removeEmojisFromFile(fullPath)) {
                                this.stats.filesFixed++;
                                console.log(`[FIXED] ${fullPath}`);
                            }
                        }
                    }
                } catch (error) {
                    // Skip files we can't access
                    continue;
                }
            }
        } catch (error) {
            // Skip directories we can't access
        }
    }

    // Clean up temporary files
    async cleanupTempFiles() {
        console.log('[CAMPSITE] Cleaning temporary files...');
        
        const tempDirs = [
            './logs',
            './tmp',
            './temp',
            './.cache'
        ];

        for (const dir of tempDirs) {
            if (fs.existsSync(dir)) {
                try {
                    const files = fs.readdirSync(dir);
                    files.forEach(file => {
                        const filePath = path.join(dir, file);
                        const stat = fs.statSync(filePath);
                        
                        // Delete files older than 1 hour
                        if (Date.now() - stat.mtime.getTime() > 3600000) {
                            fs.unlinkSync(filePath);
                            console.log(`[CLEANUP] Deleted old file: ${filePath}`);
                        }
                    });
                } catch (error) {
                    // Skip if can't clean
                }
            }
        }
    }

    // Main cleanup process
    async run() {
        console.log('[CAMPSITE] CAMPSITE CLEANUP STARTING...\n');
        
        try {
            // Step 1: Kill all Node processes
            console.log('=== STEP 1: CLEAN CAMP SITE ===');
            await this.killAllNodeProcesses();
            
            // Step 2: Clean temp files
            console.log('\n=== STEP 2: CLEAN TEMP FILES ===');
            await this.cleanupTempFiles();
            
            // Step 3: Scan and fix entire desktop
            console.log('\n=== STEP 3: SCAN ENTIRE DESKTOP ===');
            console.log('[CAMPSITE] Scanning desktop directory structure...');
            this.scanAndFixDirectory('.');
            
            // Step 4: Report results
            console.log('\n=== STEP 4: CLEANUP COMPLETE ===');
            const endTime = Date.now();
            const duration = endTime - this.stats.startTime;
            
            console.log(`[STATUS] CAMPSITE CLEANUP RESULTS:`);
            console.log(`   Files scanned: ${this.stats.filesScanned}`);
            console.log(`   Files fixed: ${this.stats.filesFixed}`);
            console.log(`   Emojis removed: ${this.stats.emojisRemoved}`);
            console.log(`   Processes killed: ${this.stats.processesKilled}`);
            console.log(`   Duration: ${duration}ms`);
            
            console.log('\n[OK] CAMPSITE IS CLEAN!');
            console.log('[INFO] Self-terminating in 3 seconds...');
            
            // Step 5: Self-terminate
            setTimeout(() => {
                console.log('[TERMINATED] CAMPSITE CLEANUP TERMINATED');
                process.exit(0);
            }, 3000);
            
        } catch (error) {
            console.log('\n[ERROR] CAMPSITE CLEANUP FAILED!');
            console.log('Error:', error.message);
            process.exit(1);
        }
    }
}

// Run the campsite cleanup
const campsite = new CampsiteCleanup();
campsite.run();
