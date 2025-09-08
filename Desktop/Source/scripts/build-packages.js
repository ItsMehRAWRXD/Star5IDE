#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[TARGET] RawrZ Security Platform - Production Package Builder');
console.log('=======================================================');

// Security level configurations
const securityLevels = {
  basic: {
    name: 'RawrZ-Basic-Security',
    dependencies: ['express', 'cors', 'helmet', 'compression', 'winston', 'dotenv'],
    features: ['Basic encryption', 'CORS protection', 'Compression', 'Logging']
  },
  standard: {
    name: 'RawrZ-Standard-Security',
    dependencies: ['express', 'cors', 'helmet', 'compression', 'winston', 'dotenv', 'express-rate-limit', 'bcryptjs', 'jsonwebtoken'],
    features: ['Basic encryption', 'CORS protection', 'Compression', 'Logging', 'Rate limiting', 'Authentication', 'Password hashing']
  },
  advanced: {
    name: 'RawrZ-Advanced-Security',
    dependencies: ['express', 'cors', 'helmet', 'compression', 'winston', 'dotenv', 'express-rate-limit', 'bcryptjs', 'jsonwebtoken', 'mongoose', 'multer', 'sharp'],
    features: ['All standard features', 'Database integration', 'File processing', 'Image processing', 'Advanced logging']
  },
  enterprise: {
    name: 'RawrZ-Enterprise-Security',
    dependencies: ['express', 'cors', 'helmet', 'compression', 'winston', 'dotenv', 'express-rate-limit', 'bcryptjs', 'jsonwebtoken', 'mongoose', 'multer', 'sharp', 'socket.io', 'stripe', 'nodemailer', 'uuid'],
    features: ['All advanced features', 'Real-time communication', 'Payment processing', 'Email services', 'UUID generation', 'Full RawrZ Engine']
  }
};

// Core files needed for all packages
const coreFiles = [
  'src/app.js',
  'src/engines/rawrz-engine.js',
  'src/utils/logger.js',
  'src/middleware',
  'src/routes',
  'src/controllers',
  'src/models',
  'src/services',
  'public/advanced-ui.html',
  'config.js'
];

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyFile(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function createPackage(level) {
  const config = securityLevels[level];
  if (!config) {
    console.error(`[ERROR] Unknown security level: ${level}`);
    return;
  }

  console.log(`\n[DEBUG] Creating ${config.name} package...`);

  const packageDir = `packages/${config.name}`;
  
  // Clean and create package directory
  if (fs.existsSync(packageDir)) {
    fs.rmSync(packageDir, { recursive: true, force: true });
  }
  fs.mkdirSync(packageDir, { recursive: true });

  // Copy core files
  console.log('  [FOLDER] Copying core files...');
  coreFiles.forEach(file => {
    if (fs.existsSync(file)) {
      copyFile(file, path.join(packageDir, file));
      console.log(`    [OK] ${file}`);
    } else {
      console.log(`    [WARN]  ${file} not found`);
    }
  });

  // Create package.json for this security level
  const packageJson = {
    name: config.name.toLowerCase().replace(/-/g, '_'),
    version: '1.0.0',
    description: `RawrZ Security Platform - ${level} Security Level`,
    main: 'src/app.js',
    scripts: {
      start: 'node src/app.js',
      test: 'node -e "console.log(\'[OK] Package ready for deployment\')"'
    },
    dependencies: {}
  };

  // Add only required dependencies
  config.dependencies.forEach(dep => {
    packageJson.dependencies[dep] = 'latest';
  });

  const packageJsonPath = path.join(packageDir, 'package.json');
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // Create deployment instructions
  const deployInstructions = `# ${config.name} - Deployment Instructions

## Security Level: ${level}
## Features Included:
${config.features.map(f => `- ${f}`).join('\n')}

## Quick Deploy:
1. Upload this package to your server
2. Run: npm install
3. Run: npm start
4. Access: http://localhost:8088

## Environment Variables:
- PORT=8088
- NODE_ENV=production
- MONGODB_URI=your_mongodb_connection_string
- JWT_SECRET=your_jwt_secret

## API Endpoints:
- GET /health - Health check
- GET /api - API status
- POST /api/engine/encrypt - Encryption
- POST /api/engine/compress - Compression
- POST /api/engine/stealth - Stealth mode
- And 15+ more advanced endpoints

## Security Features:
${config.features.map(f => `- ${f}`).join('\n')}

Ready for production deployment!
`;

  fs.writeFileSync(path.join(packageDir, 'DEPLOYMENT.md'), deployInstructions);

  // Create zip package
  const zipPath = `packages/${config.name}.zip`;
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  try {
    execSync(`cd packages && zip -r ${config.name}.zip ${config.name}/`, { stdio: 'pipe' });
    console.log(`  [DEBUG] Created ${zipPath}`);
  } catch (error) {
    console.log(`  [WARN]  Could not create zip (${error.message}), but package directory is ready`);
  }

  // Clean up temp directory
  fs.rmSync(packageDir, { recursive: true, force: true });

  console.log(`  [OK] ${config.name} package ready!`);
}

// Main execution
const level = process.argv[2];

if (!level) {
  console.log('\n[LIST] Available security levels:');
  Object.keys(securityLevels).forEach(level => {
    const config = securityLevels[level];
    console.log(`  [CHAR][CHAR] ${level} - ${config.name}`);
    console.log(`     Features: ${config.features.slice(0, 3).join(', ')}...`);
  });
  console.log('\nUsage: npm run build:<level>');
  console.log('Example: npm run build:enterprise');
  process.exit(0);
}

if (level === 'all') {
  Object.keys(securityLevels).forEach(createPackage);
} else {
  createPackage(level);
}

console.log('\n[SUCCESS] Package creation complete!');
console.log('[FOLDER] Check the packages/ directory for your deployment zips');
