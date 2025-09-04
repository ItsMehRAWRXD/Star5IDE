/**
 * Basic Usage Examples for Carmilla Encryption System
 * 
 * This file demonstrates the core functionality of the Carmilla encryption system
 * including encryption, decryption, selective encryption, and the Car(); patch system.
 */

import Carmilla from '../src/crypto/carmilla';
import CarPatcher from '../src/patch/carPatcher';

async function basicEncryptionExample() {
  console.log('=== Basic Encryption Example ===');
  
  const data = "This is sensitive data that needs encryption";
  const passphrase = "my-secure-passphrase";
  
  try {
    // Encrypt data
    const encrypted = await Carmilla.encrypt(data, passphrase);
    console.log('Encrypted:', encrypted.substring(0, 50) + '...');
    
    // Decrypt data
    const decrypted = await Carmilla.decrypt(encrypted, passphrase);
    console.log('Decrypted:', decrypted);
    
    // Verify data integrity
    console.log('Data matches:', data === decrypted);
  } catch (error) {
    console.error('Encryption error:', error.message);
  }
}

async function packagingExample() {
  console.log('\n=== Packaging Example ===');
  
  const data = "Configuration data with metadata";
  const passphrase = "config-passphrase";
  
  try {
    // Encrypt and package with metadata
    const packaged = await Carmilla.encryptAndPack(data, passphrase, {
      passphrase_hint: "config-encryption",
      chain: ["openssl", "argon2"],
      custom_field: "production-config"
    });
    
    console.log('Packaged:', packaged.substring(0, 100) + '...');
    
    // Unpack and decrypt
    const decrypted = await Carmilla.unpackAndDecrypt(packaged, passphrase);
    console.log('Decrypted from package:', decrypted);
    
    // Inspect package metadata
    const unpacked = Carmilla.unpack(packaged);
    console.log('Package metadata:', unpacked.meta);
  } catch (error) {
    console.error('Packaging error:', error.message);
  }
}

async function selectiveEncryptionExample() {
  console.log('\n=== Selective Encryption Example ===');
  
  const targets = [
    {
      type: "obj" as const,
      key: "apiKey",
      data: "sk-1234567890abcdef",
      intent: "encrypt" as const
    },
    {
      type: "obj" as const,
      key: "publicData",
      data: "This is public information",
      intent: "do-not-encrypt" as const
    },
    {
      type: "obj" as const,
      key: "lockedData",
      data: "This cannot be encrypted",
      intent: "cannot-encrypt" as const
    }
  ];
  
  const passphrase = "selective-passphrase";
  
  try {
    const results = await Carmilla.processTargets(targets, passphrase, {
      timestamp: new Date().toISOString(),
      source: "example-script"
    });
    
    console.log('Selective encryption results:');
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.key}: ${result.status}`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
      if (result.reason) {
        console.log(`     Reason: ${result.reason}`);
      }
    });
    
    // Summary
    const summary = {
      total: results.length,
      encrypted: results.filter(r => r.status === "encrypted").length,
      failed: results.filter(r => r.status === "encryption failed").length,
      skipped: results.filter(r => r.status === "skipped").length,
      cannot_encrypt: results.filter(r => r.status === "cannot encrypt").length
    };
    
    console.log('Summary:', summary);
  } catch (error) {
    console.error('Selective encryption error:', error.message);
  }
}

async function patchSystemExample() {
  console.log('\n=== Car(); Patch System Example ===');
  
  // Create a sample file with Car(); markers
  const sampleCode = `
function myFunction() {
  console.log("Before patch");
  Car();
  console.log("After patch");
  
  const data = "some data";
  Car();
  
  return data;
}

function anotherFunction() {
  Car();
  console.log("This function has a patch marker");
}
`;
  
  const tempFile = '/tmp/sample.ts';
  
  try {
    // Write sample file
    const fs = require('fs');
    fs.writeFileSync(tempFile, sampleCode);
    console.log('Created sample file with Car(); markers');
    
    // Scan for markers
    const scanResult = await CarPatcher.scanMarkers(tempFile);
    console.log(`Found ${scanResult.count} Car(); markers at lines:`, scanResult.locations);
    
    // Apply patches
    const patchResult = await CarPatcher.runWithPatches(tempFile, {
      patches: [
        'console.log("First patch applied!");',
        'const debug = true;',
        'console.log("Second patch applied!");'
      ],
      randomizeOrder: true,
      addFakePatches: true,
      preserveOriginal: true
    });
    
    console.log(`Applied ${patchResult.patchesApplied} patches`);
    
    if (patchResult.errors && patchResult.errors.length > 0) {
      console.log('Errors:', patchResult.errors);
    }
    
    // Show patched content (first 500 chars)
    console.log('Patched content preview:');
    console.log(patchResult.patchedFile.substring(0, 500) + '...');
    
    // Clean up
    fs.unlinkSync(tempFile);
    console.log('Cleaned up temporary file');
    
  } catch (error) {
    console.error('Patch system error:', error.message);
  }
}

async function batchProcessingExample() {
  console.log('\n=== Batch Processing Example ===');
  
  // Create multiple sample files
  const files = [
    { path: '/tmp/file1.ts', content: 'console.log("File 1");\nCar();\nconsole.log("End 1");' },
    { path: '/tmp/file2.js', content: 'console.log("File 2");\nCar();\nCar();\nconsole.log("End 2");' },
    { path: '/tmp/file3.py', content: 'print("File 3")\n# Car();\nprint("End 3")' }
  ];
  
  try {
    const fs = require('fs');
    
    // Create files
    files.forEach(file => {
      fs.writeFileSync(file.path, file.content);
    });
    console.log('Created sample files for batch processing');
    
    // Batch process
    const batchResults = await CarPatcher.batchProcess(
      files.map(f => f.path),
      {
        patches: [
          'console.log("Batch patch applied!");',
          'const batchMode = true;'
        ],
        randomizeOrder: false,
        addFakePatches: true
      }
    );
    
    console.log('Batch processing results:');
    batchResults.forEach((result, filePath) => {
      console.log(`  ${filePath}: ${result.patchesApplied} patches applied`);
      if (result.errors && result.errors.length > 0) {
        console.log(`    Errors: ${result.errors.length}`);
      }
    });
    
    // Clean up
    files.forEach(file => {
      fs.unlinkSync(file.path);
    });
    console.log('Cleaned up temporary files');
    
  } catch (error) {
    console.error('Batch processing error:', error.message);
  }
}

async function perRunIsolationExample() {
  console.log('\n=== Per-Run Isolation Example ===');
  
  const data = "Same data, different runs";
  const passphrase = "same-passphrase";
  
  try {
    // Encrypt the same data multiple times
    const results = [];
    for (let i = 0; i < 3; i++) {
      const encrypted = await Carmilla.encrypt(data, passphrase);
      results.push(encrypted);
      console.log(`Run ${i + 1}: ${encrypted.substring(0, 30)}...`);
    }
    
    // Verify all results are different (unique salt/IV)
    const allDifferent = results.every((result, index) => 
      results.every((other, otherIndex) => 
        index === otherIndex || result !== other
      )
    );
    
    console.log('All encryption results are unique:', allDifferent);
    
    // Verify all can be decrypted to same original data
    const decryptedResults = await Promise.all(
      results.map(encrypted => Carmilla.decrypt(encrypted, passphrase))
    );
    
    const allDecryptCorrectly = decryptedResults.every(decrypted => decrypted === data);
    console.log('All decrypt to original data:', allDecryptCorrectly);
    
  } catch (error) {
    console.error('Per-run isolation error:', error.message);
  }
}

// Run all examples
async function runAllExamples() {
  console.log('🚀 Running Carmilla Encryption System Examples\n');
  
  try {
    await basicEncryptionExample();
    await packagingExample();
    await selectiveEncryptionExample();
    await patchSystemExample();
    await batchProcessingExample();
    await perRunIsolationExample();
    
    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Example execution failed:', error.message);
  }
}

// Export for use in other modules
export {
  basicEncryptionExample,
  packagingExample,
  selectiveEncryptionExample,
  patchSystemExample,
  batchProcessingExample,
  perRunIsolationExample,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}