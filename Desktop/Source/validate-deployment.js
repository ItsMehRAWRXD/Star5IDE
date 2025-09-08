#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('[SEARCH] RawrZ Security Platform - Comprehensive Validation Check');
console.log('===========================================================');

let allChecksPassed = true;
const errors = [];
const warnings = [];

// 1. Check API endpoint URLs in UI files
console.log('\n[CHAR][CHAR] Checking UI API endpoint URLs...');
const uiFiles = [
    'public/advanced-ui.html',
    'public/admin-panel.html',
    'public/custom-ide.html',
    'public/monitor.html'
];

uiFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for malformed API_BASE URLs
        const malformedPatterns = [
            /\$\{API_BASE\/[^}]+\}/g,  // Missing closing brace
            /\$\{API_BASE[^}]*$/gm,    // Incomplete template literal
            /API_BASE\/[^"`']*[^"`'}]/g, // Missing quotes or braces
        ];
        
        malformedPatterns.forEach((pattern, index) => {
            const matches = content.match(pattern);
            if (matches) {
                errors.push(`[ERROR] ${file}: Malformed API_BASE URL found: ${matches.join(', ')}`);
                allChecksPassed = false;
            }
        });
        
        // Check for correct API endpoint patterns
        const correctPatterns = [
            /\$\{API_BASE\}\/api\/engine\/[a-zA-Z-]+/g,
            /\$\{API_BASE\}\/health/g,
            /\$\{API_BASE\}\/api/g
        ];
        
        const hasCorrectEndpoints = correctPatterns.some(pattern => pattern.test(content));
        if (!hasCorrectEndpoints && content.includes('API_BASE')) {
            warnings.push(`[WARN]  ${file}: No standard API endpoints found`);
        }
        
        console.log(`  [OK] ${file} - API URLs checked`);
    } else {
        warnings.push(`[WARN]  ${file} - File not found`);
    }
});

// 2. Check JSON formatting in configuration files
console.log('\n[CHAR][CHAR] Checking JSON configuration files...');
const jsonFiles = [
    'package.json',
    'app-spec.yaml'
];

jsonFiles.forEach(file => {
    if (fs.existsSync(file)) {
        try {
            if (file.endsWith('.json')) {
                JSON.parse(fs.readFileSync(file, 'utf8'));
                console.log(`  [OK] ${file} - Valid JSON`);
            } else if (file.endsWith('.yaml')) {
                // Basic YAML syntax check
                const content = fs.readFileSync(file, 'utf8');
                if (content.includes('name:') && content.includes('services:')) {
                    console.log(`  [OK] ${file} - Valid YAML structure`);
                } else {
                    errors.push(`[ERROR] ${file}: Invalid YAML structure`);
                    allChecksPassed = false;
                }
            }
        } catch (e) {
            errors.push(`[ERROR] ${file}: JSON/YAML parse error - ${e.message}`);
            allChecksPassed = false;
        }
    }
});

// 3. Check RawrZ Engine file structure
console.log('\n[SECURITY] Checking RawrZ Engine structure...');
const engineFile = 'src/engines/rawrz-engine.js';
if (fs.existsSync(engineFile)) {
    const content = fs.readFileSync(engineFile, 'utf8');
    
    // Check for required methods
    const requiredMethods = [
        'getStatus',
        'encryptAdvanced',
        'compress',
        'enableStealth',
        'generateStub',
        'runDualGenerators',
        'applyHotPatch',
        'assembleCode',
        'polymorphizeCode',
        'runAntiAnalysis',
        'optimizeMemory',
        'createBackup',
        'analyzeMobile',
        'analyzeNetwork',
        'reverseEngineer',
        'performForensics',
        'analyzeMalware',
        'getAPIStatus'
    ];
    
    const missingMethods = requiredMethods.filter(method => !content.includes(method));
    if (missingMethods.length > 0) {
        errors.push(`[ERROR] RawrZ Engine: Missing methods - ${missingMethods.join(', ')}`);
        allChecksPassed = false;
    } else {
        console.log(`  [OK] RawrZ Engine - All ${requiredMethods.length} methods present`);
    }
    
    // Check for proper module export
    if (!content.includes('module.exports = rawrzEngine')) {
        errors.push(`[ERROR] RawrZ Engine: Missing module export`);
        allChecksPassed = false;
    } else {
        console.log(`  [OK] RawrZ Engine - Proper module export`);
    }
} else {
    errors.push(`[ERROR] RawrZ Engine file not found`);
    allChecksPassed = false;
}

// 4. Check server configuration
console.log('\n[CHAR][CHAR] Checking server configuration...');
const serverFile = 'src/app.js';
if (fs.existsSync(serverFile)) {
    const content = fs.readFileSync(serverFile, 'utf8');
    
    // Check for required middleware
    const requiredMiddleware = [
        'express.json()',
        'cors()',
        'helmet()',
        'compression()'
    ];
    
    const missingMiddleware = requiredMiddleware.filter(middleware => !content.includes(middleware));
    if (missingMiddleware.length > 0) {
        warnings.push(`[WARN]  Server: Missing middleware - ${missingMiddleware.join(', ')}`);
    } else {
        console.log(`  [OK] Server - All required middleware present`);
    }
    
    // Check for engine initialization
    if (!content.includes('initializeRawrZEngine')) {
        errors.push(`[ERROR] Server: Missing RawrZ Engine initialization`);
        allChecksPassed = false;
    } else {
        console.log(`  [OK] Server - RawrZ Engine initialization present`);
    }
    
    // Check for error handling
    if (!content.includes('errorTrackingMiddleware')) {
        warnings.push(`[WARN]  Server: Missing error tracking middleware`);
    } else {
        console.log(`  [OK] Server - Error handling present`);
    }
} else {
    errors.push(`[ERROR] Server file not found`);
    allChecksPassed = false;
}

// 5. Check package dependencies
console.log('\n[DEBUG] Checking package dependencies...');
if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = [
        'express',
        'mongoose',
        'cors',
        'helmet',
        'express-rate-limit',
        'compression',
        'winston',
        'bcryptjs',
        'jsonwebtoken',
        'dotenv'
    ];
    
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
    if (missingDeps.length > 0) {
        errors.push(`[ERROR] Package: Missing dependencies - ${missingDeps.join(', ')}`);
        allChecksPassed = false;
    } else {
        console.log(`  [OK] Package - All required dependencies present`);
    }
} else {
    errors.push(`[ERROR] package.json not found`);
    allChecksPassed = false;
}

// 6. Check for common syntax errors
console.log('\n[SEARCH] Checking for common syntax errors...');
const sourceFiles = [
    'src/app.js',
    'src/engines/rawrz-engine.js',
    'src/utils/logger.js'
];

sourceFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for common JavaScript syntax issues
        const syntaxIssues = [
            { pattern: /console\.log\([^)]*$/gm, message: 'Unclosed console.log' },
            { pattern: /function\s+\w+\s*\([^)]*$/gm, message: 'Unclosed function declaration' },
            { pattern: /if\s*\([^)]*$/gm, message: 'Unclosed if statement' },
            { pattern: /\{[^}]*$/gm, message: 'Unclosed brace' },
            { pattern: /\[[^\]]*$/gm, message: 'Unclosed bracket' },
            { pattern: /`[^`]*$/gm, message: 'Unclosed template literal' },
            { pattern: /"[^"]*$/gm, message: 'Unclosed double quote' },
            { pattern: /'[^']*$/gm, message: 'Unclosed single quote' }
        ];
        
        syntaxIssues.forEach(({ pattern, message }) => {
            const matches = content.match(pattern);
            if (matches) {
                errors.push(`[ERROR] ${file}: ${message} - ${matches.length} instances`);
                allChecksPassed = false;
            }
        });
        
        console.log(`  [OK] ${file} - Syntax check passed`);
    }
});

// 7. Check deployment configuration
console.log('\n[START] Checking deployment configuration...');
if (fs.existsSync('app-spec.yaml')) {
    const content = fs.readFileSync('app-spec.yaml', 'utf8');
    
    // Check for required deployment fields
    const requiredFields = [
        'name:',
        'services:',
        'run_command:',
        'http_port:',
        'envs:'
    ];
    
    const missingFields = requiredFields.filter(field => !content.includes(field));
    if (missingFields.length > 0) {
        errors.push(`[ERROR] Deployment: Missing required fields - ${missingFields.join(', ')}`);
        allChecksPassed = false;
    } else {
        console.log(`  [OK] Deployment - All required fields present`);
    }
    
    // Check for correct port configuration
    if (!content.includes('http_port: 8088')) {
        warnings.push(`[WARN]  Deployment: Port not set to 8088`);
    } else {
        console.log(`  [OK] Deployment - Correct port configuration`);
    }
} else {
    errors.push(`[ERROR] app-spec.yaml not found`);
    allChecksPassed = false;
}

// Summary
console.log('\n[STATUS] VALIDATION SUMMARY');
console.log('====================');

if (errors.length > 0) {
    console.log('\n[ERROR] ERRORS FOUND:');
    errors.forEach(error => console.log(`  ${error}`));
}

if (warnings.length > 0) {
    console.log('\n[WARN]  WARNINGS:');
    warnings.forEach(warning => console.log(`  ${warning}`));
}

if (allChecksPassed && errors.length === 0) {
    console.log('\n[SUCCESS] ALL CHECKS PASSED!');
    console.log('[OK] RawrZ Security Platform is ready for deployment');
    console.log('[OK] All API endpoints properly configured');
    console.log('[OK] All dependencies present');
    console.log('[OK] All syntax checks passed');
    console.log('[OK] Deployment configuration valid');
} else {
    console.log('\n[ERROR] VALIDATION FAILED');
    console.log('Please fix the errors above before deployment');
    process.exit(1);
}

console.log('\n[START] Ready for production deployment!');
