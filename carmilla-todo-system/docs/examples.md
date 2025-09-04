# Carmilla System Examples

## Complete Example: Encrypted Todo with Patches

```typescript
// example-todo-with-patches.ts

import carmilla from '../src/crypto/carmilla';
import carPatcher from '../src/utils/carPatcher';
import { processTargets } from '../src/api/encryptionService';

// 1. Create a Todo class with Car() markers for extensibility
const todoClassCode = `
class TodoManager {
  constructor() {
    this.todos = [];
    Car(); // Extension point for initialization
  }
  
  addTodo(text) {
    const todo = {
      id: Date.now(),
      text,
      completed: false,
      created: new Date()
    };
    Car(); // Extension point before adding
    this.todos.push(todo);
    return todo;
  }
  
  getTodos() {
    Car(); // Extension point for filtering/processing
    return this.todos;
  }
}

const manager = new TodoManager();
manager.addTodo('Test todo');
console.log(manager.getTodos());
`;

// 2. Define patches to add encryption capability
const encryptionPatches = [
  // Patch 1: Initialize encryption in constructor
  `this.passphrase = 'default-key';
   this.encrypted = new Map();`,
  
  // Patch 2: Encrypt todo before adding
  `if (this.passphrase) {
     const encrypted = btoa(JSON.stringify(todo));
     this.encrypted.set(todo.id, encrypted);
     todo.text = '[ENCRYPTED]';
   }`,
  
  // Patch 3: Decrypt todos when retrieving
  `return this.todos.map(todo => {
     if (this.encrypted.has(todo.id)) {
       const decrypted = JSON.parse(atob(this.encrypted.get(todo.id)));
       return { ...todo, text: decrypted.text };
     }
     return todo;
   });`
];

// 3. Execute the patched code
async function runExample() {
  console.log('=== Running Todo Manager with Encryption Patches ===\n');
  
  // Apply patches and run
  const result = carPatcher.runPatchedString(todoClassCode, encryptionPatches);
  
  if (result.success) {
    console.log('✅ Patches applied successfully!');
    console.log(`📍 Patch points found: ${result.patchPoints}`);
    
    // Now encrypt the entire patched code for storage
    const encrypted = carmilla.encrypt(result.patchedCode, 'master-key');
    const packaged = carmilla.repack(encrypted, 'todo-manager-v1');
    
    console.log('\n=== Encrypted Package ===');
    console.log(`Package size: ${packaged.length} bytes`);
    
    // Later, decrypt and run
    const pack = carmilla.unpack(packaged);
    const decrypted = carmilla.decrypt(pack.data, 'master-key', pack.meta.salt);
    
    console.log('\n=== Decrypted and Ready to Run ===');
    console.log('✅ Code successfully encrypted and decrypted!');
  }
}

runExample();
```

## Example: Selective File Encryption

```typescript
// example-selective-encryption.ts

import { processTargets } from '../src/api/encryptionService';

async function selectiveEncryptionExample() {
  // Define areas to encrypt with different intents
  const targets = [
    {
      type: 'string' as const,
      data: 'This is public information',
      key: 'public-section',
      intent: 'do-not-touch' as const
    },
    {
      type: 'string' as const,
      data: 'This is sensitive user data',
      key: 'user-data',
      intent: 'encrypt' as const
    },
    {
      type: 'string' as const,
      data: 'This is a password: secretpass123',
      key: 'password',
      intent: 'encrypt' as const
    },
    {
      type: 'string' as const,
      data: 'This section has an error',
      key: 'broken-section',
      intent: 'encrypt' as const
    }
  ];
  
  // Process all targets
  const result = await processTargets(targets, 'my-secure-key');
  
  console.log('=== Selective Encryption Report ===\n');
  console.log(`Total targets: ${result.totalTargets}`);
  console.log(`Succeeded: ${result.succeeded}`);
  console.log(`Failed: ${result.failed}`);
  console.log(`Skipped: ${result.skipped}`);
  console.log(`\nDetailed Reports:`);
  
  result.reports.forEach(report => {
    console.log(`\n[${report.key}]`);
    console.log(`  Status: ${report.status}`);
    console.log(`  Intent: ${report.intent}`);
    if (report.error) {
      console.log(`  Error: ${report.error}`);
    }
    if (report.reason) {
      console.log(`  Reason: ${report.reason}`);
    }
    if (report.duration) {
      console.log(`  Duration: ${report.duration}ms`);
    }
  });
}

selectiveEncryptionExample();
```

## Example: React Component with Encryption

```tsx
// example-encrypted-component.tsx

import React, { useState } from 'react';
import { useEncryption } from '../src/hooks/useEncryption';

function EncryptedNotepad() {
  const [content, setContent] = useState('');
  const [encrypted, setEncrypted] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const { encrypt, decrypt, isAvailable } = useEncryption();
  
  const handleEncrypt = async () => {
    if (!passphrase) {
      alert('Please enter a passphrase');
      return;
    }
    
    try {
      const result = await encrypt(content, passphrase);
      setEncrypted(result);
      setContent(''); // Clear original
      alert('Content encrypted successfully!');
    } catch (error) {
      alert(`Encryption failed: ${error.message}`);
    }
  };
  
  const handleDecrypt = async () => {
    if (!passphrase || !encrypted) {
      alert('Please enter passphrase and have encrypted content');
      return;
    }
    
    try {
      const result = await decrypt(encrypted, passphrase);
      setContent(result);
      alert('Content decrypted successfully!');
    } catch (error) {
      alert(`Decryption failed: ${error.message}`);
    }
  };
  
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🔐 Encrypted Notepad</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Passphrase:</label>
        <input
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Content:</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your sensitive content here..."
          style={{ width: '100%', height: '200px', padding: '8px' }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleEncrypt} disabled={!isAvailable || !content}>
          🔒 Encrypt
        </button>
        <button onClick={handleDecrypt} disabled={!isAvailable || !encrypted}>
          🔓 Decrypt
        </button>
      </div>
      
      {encrypted && (
        <div>
          <label>Encrypted Data:</label>
          <textarea
            value={encrypted}
            readOnly
            style={{ width: '100%', height: '100px', padding: '8px', fontFamily: 'monospace' }}
          />
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        Status: {isAvailable ? '✅ Encryption Available' : '❌ Encryption Unavailable'}
      </div>
    </div>
  );
}

export default EncryptedNotepad;
```

## Example: CLI Tool

```typescript
// cli-encrypt.ts

import { program } from 'commander';
import carmilla from '../src/crypto/carmilla';
import fs from 'fs';

program
  .name('carmilla-cli')
  .description('Carmilla OpenSSL encryption CLI')
  .version('1.0.0');

program
  .command('encrypt <file>')
  .description('Encrypt a file')
  .option('-p, --passphrase <pass>', 'Encryption passphrase', 'default-key')
  .option('-o, --output <file>', 'Output file')
  .action((file, options) => {
    try {
      const data = fs.readFileSync(file, 'utf8');
      const encrypted = carmilla.encrypt(data, options.passphrase);
      const packaged = carmilla.repack(encrypted, file);
      
      const outputFile = options.output || `${file}.carmilla`;
      fs.writeFileSync(outputFile, packaged);
      
      console.log(`✅ Encrypted ${file} -> ${outputFile}`);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('decrypt <file>')
  .description('Decrypt a file')
  .option('-p, --passphrase <pass>', 'Decryption passphrase', 'default-key')
  .option('-o, --output <file>', 'Output file')
  .action((file, options) => {
    try {
      const packaged = fs.readFileSync(file, 'utf8');
      const pack = carmilla.unpack(packaged);
      const decrypted = carmilla.decrypt(pack.data, options.passphrase, pack.meta.salt);
      
      const outputFile = options.output || file.replace('.carmilla', '');
      fs.writeFileSync(outputFile, decrypted);
      
      console.log(`✅ Decrypted ${file} -> ${outputFile}`);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();
```

## Example: Testing Encryption Chain

```typescript
// test-encryption-chain.ts

import carmilla from '../src/crypto/carmilla';

function testEncryptionChain() {
  const testData = 'Test data for encryption chain';
  const passphrase = 'test-key';
  
  console.log('=== Testing Encryption Chain ===\n');
  
  // Test 1: Basic encryption/decryption
  console.log('Test 1: Basic encryption');
  const encrypted1 = carmilla.encrypt(testData, passphrase);
  const decrypted1 = carmilla.decrypt(encrypted1, passphrase);
  console.log(`✅ Basic: ${decrypted1 === testData ? 'PASSED' : 'FAILED'}`);
  
  // Test 2: With packaging
  console.log('\nTest 2: With packaging');
  const encrypted2 = carmilla.encrypt(testData, passphrase);
  const packaged2 = carmilla.repack(encrypted2, 'test-hint', ['openssl']);
  const unpacked2 = carmilla.unpack(packaged2);
  const decrypted2 = carmilla.decrypt(unpacked2.data, passphrase, unpacked2.meta.salt);
  console.log(`✅ Packaged: ${decrypted2 === testData ? 'PASSED' : 'FAILED'}`);
  
  // Test 3: Multiple runs produce different results
  console.log('\nTest 3: Unique per run');
  const encrypted3a = carmilla.encrypt(testData, passphrase);
  const encrypted3b = carmilla.encrypt(testData, passphrase);
  console.log(`✅ Unique: ${encrypted3a !== encrypted3b ? 'PASSED' : 'FAILED'}`);
  
  // Test 4: Chain metadata
  console.log('\nTest 4: Chain metadata');
  const encrypted4 = carmilla.encrypt(testData, passphrase);
  const packaged4 = carmilla.repack(encrypted4, '', ['openssl', 'future-step']);
  const unpacked4 = carmilla.unpack(packaged4);
  console.log(`✅ Chain: ${unpacked4.meta.chain.length === 2 ? 'PASSED' : 'FAILED'}`);
  console.log(`   Chain steps: ${unpacked4.meta.chain.join(' -> ')}`);
  
  console.log('\n=== All Tests Complete ===');
}

testEncryptionChain();
```

## Running the Examples

1. **Install dependencies:**
```bash
npm install
```

2. **Run TypeScript examples:**
```bash
npx ts-node docs/examples/example-todo-with-patches.ts
npx ts-node docs/examples/example-selective-encryption.ts
npx ts-node docs/examples/test-encryption-chain.ts
```

3. **Use the CLI:**
```bash
npx ts-node docs/examples/cli-encrypt.ts encrypt myfile.txt -p mypassword
npx ts-node docs/examples/cli-encrypt.ts decrypt myfile.txt.carmilla -p mypassword
```

## Key Takeaways

1. **Carmilla is plug-and-play** - Just import and use, no configuration needed
2. **Car() markers enable extensibility** - Add functionality without modifying source
3. **Selective encryption is transparent** - Every operation is reported clearly
4. **Per-run isolation ensures security** - Each encryption is unique
5. **No hidden dependencies** - Only Node.js and OpenSSL required