#!/usr/bin/env node

// Scan entire desktop directory structure for emojis
const fs = require('fs');
const path = require('path');

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

function scanFileForEmojis(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const foundEmojis = [];
        
        for (const emoji of Object.keys(emojiMap)) {
            if (content.includes(emoji)) {
                const matches = content.match(new RegExp(emoji, 'g'));
                foundEmojis.push({
                    emoji: emoji,
                    count: matches ? matches.length : 0,
                    replacement: emojiMap[emoji]
                });
            }
        }
        
        return foundEmojis;
    } catch (error) {
        return [];
    }
}

function scanDirectoryRecursive(dirPath, depth = 0) {
    if (depth > 10) return []; // Prevent infinite recursion
    
    const results = [];
    
    try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const fullPath = path.join(dirPath, item);
            
            try {
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // Skip system directories
                    if (!['node_modules', '.git', 'logs', 'dist', 'build', 'System Volume Information', '$RECYCLE.BIN'].includes(item)) {
                        results.push(...scanDirectoryRecursive(fullPath, depth + 1));
                    }
                } else if (stat.isFile()) {
                    const ext = path.extname(item).toLowerCase();
                    if (['.js', '.ts', '.jsx', '.tsx', '.json', '.yaml', '.yml', '.md', '.txt', '.html', '.css', '.php', '.py', '.java', '.cpp', '.c', '.h'].includes(ext)) {
                        const emojis = scanFileForEmojis(fullPath);
                        if (emojis.length > 0) {
                            results.push({
                                file: fullPath,
                                emojis: emojis
                            });
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
    
    return results;
}

function removeEmojisFromFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        for (const [emoji, replacement] of Object.entries(emojiMap)) {
            if (content.includes(emoji)) {
                content = content.replace(new RegExp(emoji, 'g'), replacement);
                modified = true;
            }
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            return true;
        }
        
        return false;
    } catch (error) {
        return false;
    }
}

console.log('[SEARCH] Scanning entire desktop directory structure for emojis...\n');

const startTime = Date.now();
const results = scanDirectoryRecursive('.');

console.log(`[STATUS] Scan Results:`);
console.log(`   Total files with emojis: ${results.length}`);

let totalEmojis = 0;
let fixedFiles = 0;

results.forEach(result => {
    const emojiCount = result.emojis.reduce((sum, e) => sum + e.count, 0);
    totalEmojis += emojiCount;
    
    console.log(`\n[FOLDER] ${result.file}:`);
    result.emojis.forEach(emoji => {
        console.log(`   ${emoji.emoji} (${emoji.count}x) [CHAR] ${emoji.replacement}`);
    });
    
    // Fix the file
    if (removeEmojisFromFile(result.file)) {
        fixedFiles++;
        console.log(`   [OK] FIXED`);
    }
});

const endTime = Date.now();

console.log(`\n[TARGET] Summary:`);
console.log(`   Files scanned: ${results.length}`);
console.log(`   Total emojis found: ${totalEmojis}`);
console.log(`   Files fixed: ${fixedFiles}`);
console.log(`   Scan time: ${endTime - startTime}ms`);

if (totalEmojis > 0) {
    console.log(`\n[OK] All emojis removed from desktop!`);
} else {
    console.log(`\n[SUCCESS] No emojis found - desktop is clean!`);
}
