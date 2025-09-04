# ⚡ Car(); Patch System Guide

## Overview

The Car(); patch system allows dynamic, in-memory code modification using simple markers. Place `Car();` on its own line anywhere in your JavaScript/TypeScript code to create injection points for runtime patches.

## Key Features

### 🔧 Core Capabilities
- **In-memory patching** - never modifies files on disk
- **Dynamic code injection** at runtime
- **Isolated VM execution** for security
- **Security validation** blocks dangerous operations
- **Timeout protection** prevents infinite loops

### 🛡️ Security Features
- **Sandboxed execution** in Node.js VM
- **Dangerous operation blocking** (fs, child_process, eval, etc.)
- **Input validation** prevents code injection
- **5-second timeout** protection
- **No persistent side effects**

## Basic Usage

### 1. Add Car(); Markers to Your Code

```javascript
function myFunction() {
  console.log("Starting function");
  Car(); // <-- Patch injection point
  
  const data = { value: 42 };
  Car(); // <-- Another injection point
  
  console.log("Function complete");
  return data;
}

// Call the function
myFunction();
```

### 2. Apply Patches

```typescript
import { executePatched } from './patch/carPatcher';

const sourceCode = `
function myFunction() {
  console.log("Starting function");
  Car();
  
  const data = { value: 42 };
  Car();
  
  console.log("Function complete");
  return data;
}

myFunction();
`;

const patches = [
  'console.log("🚗 First patch executed!");',
  'data.patched = true; console.log("🔧 Data modified by patch");'
];

const result = executePatched(sourceCode, patches);
console.log(result.executionResult);
```

### 3. Result

The patched code becomes:

```javascript
function myFunction() {
  console.log("Starting function");
  console.log("🚗 First patch executed!");
  
  const data = { value: 42 };
  data.patched = true; console.log("🔧 Data modified by patch");
  
  console.log("Function complete");
  return data;
}

myFunction();
```

## API Reference

### Core Functions

#### `findCarMarkers(sourceCode: string): PatchPoint[]`

Find all Car(); markers in source code.

```typescript
import { findCarMarkers } from './patch/carPatcher';

const code = `
function demo() {
  Car();
  console.log("test");
  Car();
}
`;

const markers = findCarMarkers(code);
console.log(markers);
// [
//   { line: 3, column: 2, originalLine: "  Car();" },
//   { line: 5, column: 2, originalLine: "  Car();" }
// ]
```

#### `applyPatches(sourceCode: string, patches: string[]): PatchResult`

Apply patches to source code (preview only, no execution).

```typescript
import { applyPatches } from './patch/carPatcher';

const result = applyPatches(sourceCode, patches);
console.log(result.patchedCode); // View patched code
console.log(result.patchPoints); // See where patches were applied
```

#### `executePatched(sourceCode: string, patches: string[], context?: any): PatchResult`

Apply patches and execute in isolated VM.

```typescript
import { executePatched } from './patch/carPatcher';

const result = executePatched(
  sourceCode, 
  patches,
  { customVar: "Hello from context!" } // Optional context
);

console.log(result.executionResult); // Execution return value
console.log(result.error); // Any execution errors
```

#### `runWithPatches(filePath: string, patches: string[], context?: any): PatchResult`

Load file, apply patches, and execute.

```typescript
import { runWithPatches } from './patch/carPatcher';

// Load and patch demo.js
const result = runWithPatches('./demo.js', [
  'console.log("Patched at runtime!");'
]);
```

### Utility Functions

#### `generateRandomPatches(count?: number): string[]`

Generate random patches for testing.

```typescript
import { generateRandomPatches } from './patch/carPatcher';

const patches = generateRandomPatches(3);
console.log(patches);
// [
//   'console.log("🚗 Patch injected at runtime!");',
//   'const patchId = "abc123";',
//   'console.log("Dynamic patch execution:", new Date().toISOString());'
// ]
```

#### `validatePatch(patchCode: string): {valid: boolean, reason?: string}`

Validate patch code for security.

```typescript
import { validatePatch } from './patch/carPatcher';

console.log(validatePatch('console.log("safe");')); 
// { valid: true }

console.log(validatePatch('require("fs").unlinkSync("/etc/passwd");'));
// { valid: false, reason: "Dangerous pattern detected: require\\s*\\(\\s*['\"]fs['\"]" }
```

## Web API Usage

### Find Markers

```javascript
const response = await fetch('/api/patch/find-markers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceCode: 'function demo() {\n  Car();\n}'
  })
});

const data = await response.json();
console.log(data.markers); // Array of marker positions
```

### Apply Patches (Preview)

```javascript
const response = await fetch('/api/patch/apply-patches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceCode: 'function demo() {\n  Car();\n}',
    patches: ['console.log("Patched!");']
  })
});

const data = await response.json();
console.log(data.result.patchedCode); // See patched code
```

### Execute Patched Code

```javascript
const response = await fetch('/api/patch/execute-patched', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceCode: 'function demo() {\n  Car();\n  return 42;\n}\ndemo();',
    patches: ['console.log("Executing patch!");'],
    context: { myVar: 'Hello!' }
  })
});

const data = await response.json();
console.log(data.result.executionResult); // 42
```

## Advanced Usage

### Multi-line Patches

```javascript
const patches = [
  `
  if (data.value > 50) {
    console.log("Value is high!");
    data.category = "high";
  } else {
    console.log("Value is normal");
    data.category = "normal";
  }
  `
];
```

### Context Variables

```javascript
const result = executePatched(sourceCode, patches, {
  userId: "john",
  debugMode: true,
  apiUrl: "https://api.example.com"
});

// Patches can access context variables:
const contextPatches = [
  'console.log("User:", userId);',
  'if (debugMode) console.log("Debug info:", data);',
  'data.apiUrl = apiUrl;'
];
```

### Conditional Patching

```javascript
function createConditionalPatch(condition: boolean, patch: string): string {
  return condition ? patch : '// Patch skipped';
}

const patches = [
  createConditionalPatch(process.env.NODE_ENV === 'development', 
    'console.log("Development mode patch");'
  ),
  createConditionalPatch(user.isAdmin, 
    'data.adminFeatures = true;'
  )
];
```

### Patch Chaining

```javascript
// Patches are applied in order, each can reference previous patches
const chainedPatches = [
  'const patchId = Math.random().toString(36).substring(7);',
  'console.log("Patch ID:", patchId);',
  'data.patchId = patchId;',
  'data.patchTimestamp = Date.now();'
];
```

## Security Guidelines

### Allowed Operations

✅ **Safe operations:**
- `console.log()`, `console.error()`, etc.
- Variable assignments and modifications
- Mathematical operations
- String manipulation
- Date/time operations
- JSON operations
- Basic control flow (if/else, loops)

### Blocked Operations

❌ **Dangerous operations (automatically blocked):**
- File system access (`require('fs')`)
- Process control (`require('child_process')`)
- Operating system access (`require('os')`)
- Process exit (`process.exit()`)
- Dynamic code evaluation (`eval()`, `Function()`)
- File deletion (`.unlink`, `.rmdir`)
- File writing (`.writeFile`)

### Security Validation

```javascript
// The system automatically validates patches
const dangerousPatches = [
  'require("fs").readFileSync("/etc/passwd")',    // ❌ Blocked
  'eval("malicious code")',                       // ❌ Blocked
  'process.exit(1)',                              // ❌ Blocked
  'new Function("return process")().exit()',      // ❌ Blocked
];

// Safe patches pass validation
const safePatches = [
  'console.log("Hello world");',                  // ✅ Allowed
  'data.timestamp = Date.now();',                 // ✅ Allowed
  'if (x > 0) console.log("Positive");',          // ✅ Allowed
];
```

## Use Cases

### 1. Development & Debugging

```javascript
// Add debug logging without modifying source
const debugPatches = [
  'console.log("Debug: function called with:", arguments);',
  'console.log("Debug: current data state:", JSON.stringify(data));'
];
```

### 2. A/B Testing

```javascript
// Test different behaviors dynamically
const testPatches = user.testGroup === 'A' ? [
  'data.feature = "version_a";'
] : [
  'data.feature = "version_b"; data.enhanced = true;'
];
```

### 3. Runtime Configuration

```javascript
// Modify behavior based on runtime conditions
const configPatches = [
  `data.apiEndpoint = "${process.env.API_URL}";`,
  `data.timeout = ${config.requestTimeout};`,
  `data.retries = ${config.maxRetries};`
];
```

### 4. Error Injection (Testing)

```javascript
// Inject errors for testing error handling
const errorTestPatches = [
  'if (Math.random() < 0.1) throw new Error("Simulated error");'
];
```

### 5. Performance Monitoring

```javascript
// Add timing measurements
const performancePatches = [
  'const startTime = performance.now();',
  'const endTime = performance.now(); console.log("Execution time:", endTime - startTime, "ms");'
];
```

## Best Practices

### 1. Marker Placement

```javascript
// ✅ Good: Place markers at logical points
function processData(input) {
  Car(); // Good: function entry point
  
  const validated = validateInput(input);
  Car(); // Good: after validation
  
  const result = transform(validated);
  Car(); // Good: after transformation
  
  return result;
}

// ❌ Bad: Too many markers
function badExample() {
  Car();
  const x = 1;
  Car();
  const y = 2;
  Car();
  return x + y;
  Car(); // Unreachable
}
```

### 2. Patch Organization

```javascript
// ✅ Good: Organized, purposeful patches
const patches = [
  // Entry logging
  'console.log("Function started at:", new Date().toISOString());',
  
  // Data validation
  'if (!data || typeof data !== "object") throw new Error("Invalid data");',
  
  // Exit logging  
  'console.log("Function completed successfully");'
];

// ❌ Bad: Random, unclear patches
const badPatches = [
  'console.log("stuff");',
  'x = 42;', // What is x?
  'doSomething();' // What does this do?
];
```

### 3. Error Handling

```javascript
const result = executePatched(sourceCode, patches);

if (result.error) {
  console.error('Patch execution failed:', result.error);
  // Handle error appropriately
} else {
  console.log('Patches applied successfully');
  console.log('Result:', result.executionResult);
}
```

### 4. Testing Patches

```javascript
// Test patches separately before applying
patches.forEach((patch, index) => {
  const validation = validatePatch(patch);
  if (!validation.valid) {
    console.error(`Patch ${index} is invalid:`, validation.reason);
  }
});
```

## Troubleshooting

### Common Issues

1. **"Car(); not found"**
   - Ensure `Car();` is on its own line
   - Check for typos (case-sensitive)
   - Verify proper semicolon

2. **"Patch validation failed"**
   - Review blocked operations list
   - Check for dangerous function calls
   - Validate syntax

3. **"Execution timeout"**
   - Patches have 5-second timeout
   - Avoid infinite loops
   - Optimize patch performance

4. **"Context variable undefined"**
   - Ensure context variables are passed
   - Check variable names for typos
   - Verify context object structure

### Debug Tips

```javascript
// Enable detailed logging
const result = executePatched(sourceCode, patches, {
  debug: true // Add to context
});

// Check intermediate results
console.log('Original code:', result.originalCode);
console.log('Patched code:', result.patchedCode);
console.log('Patch points:', result.patchPoints);
console.log('Applied patches:', result.patches);
```

## Integration Examples

### Express.js Route

```javascript
app.post('/api/execute-with-patches', async (req, res) => {
  const { sourceCode, patches } = req.body;
  
  try {
    const result = executePatched(sourceCode, patches, {
      userId: req.user.id,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      result: result.executionResult,
      patchCount: result.patches.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});
```

### Plugin System

```javascript
class PluginManager {
  async loadPlugin(pluginCode: string, userPatches: string[] = []) {
    // Add Car(); markers to plugin code automatically
    const patchedCode = this.addMarkers(pluginCode);
    
    // Apply user patches
    const result = executePatched(patchedCode, userPatches, {
      pluginAPI: this.getAPI(),
      config: this.getConfig()
    });
    
    return result;
  }
  
  addMarkers(code: string): string {
    // Implementation to automatically add Car(); markers
    // at strategic points in plugin code
  }
}
```