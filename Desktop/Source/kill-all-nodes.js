#!/usr/bin/env node

// Quick Node Process Killer - Clean Camp Site
const { exec } = require('child_process');

console.log('[CLEANUP] Cleaning camp site - killing all Node processes...');

const isWindows = process.platform === 'win32';
const command = isWindows ? 'taskkill /IM node.exe /F' : 'pkill -f node';

exec(command, (error, stdout, stderr) => {
    if (error && !error.message.includes('not found') && !error.message.includes('No tasks')) {
        console.log('[WARN] Some processes may not exist (this is normal)');
    }
    
    console.log('[OK] Node processes terminated');
    console.log('[CLEAN] Camp site is clean!');
    
    // Show remaining processes
    setTimeout(() => {
        const checkCommand = isWindows ? 'tasklist | findstr node' : 'ps aux | grep node';
        exec(checkCommand, (checkError, checkStdout, checkStderr) => {
            if (checkStdout && checkStdout.trim()) {
                console.log('[LIST] Remaining Node processes:');
                console.log(checkStdout);
            } else {
                console.log('[CLEARED] All Node processes cleared!');
            }
        });
    }, 1000);
});
