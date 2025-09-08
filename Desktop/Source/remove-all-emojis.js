#!/usr/bin/env node

// Remove ALL emojis from the entire codebase
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

function removeEmojisFromFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Replace each emoji
        for (const [emoji, replacement] of Object.entries(emojiMap)) {
            if (content.includes(emoji)) {
                content = content.replace(new RegExp(emoji, 'g'), replacement);
                modified = true;
            }
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`[FIXED] ${filePath}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.log(`[ERROR] ${filePath}: ${error.message}`);
        return false;
    }
}

function scanDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    let totalFixed = 0;
    
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (!['node_modules', '.git', 'logs', 'dist', 'build'].includes(item)) {
                totalFixed += scanDirectory(fullPath);
            }
        } else if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase();
            if (['.js', '.ts', '.jsx', '.tsx', '.json', '.yaml', '.yml', '.md', '.txt', '.html', '.css'].includes(ext)) {
                if (removeEmojisFromFile(fullPath)) {
                    totalFixed++;
                }
            }
        }
    }
    
    return totalFixed;
}

console.log('[CLEANUP] Removing ALL emojis from codebase...\n');

let totalFixed = 0;
totalFixed += scanDirectory('./src');
totalFixed += scanDirectory('./public');
totalFixed += scanDirectory('./scripts');

console.log(`\n[OK] Fixed ${totalFixed} files`);
console.log('[SUCCESS] All emojis removed - system should work now!');
