const fs = require('fs-extra');
const path = require('path');
const { spawn, exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const vm = require('vm');

class ScriptInjectionService {
  constructor() {
    this.scriptRegistry = new Map();
    this.languageExtensions = new Map();
    this.ideExtensions = new Map();
    this.customRuntimes = new Map();
    this.injectionPoints = new Map();
    this.ready = false;
    this.scriptsDir = path.join(__dirname, '../../scripts');
    this.extensionsDir = path.join(__dirname, '../../extensions');
    this.runtimesDir = path.join(__dirname, '../../runtimes');
  }

  async initialize() {
    try {
      // Ensure directories exist
      await fs.ensureDir(this.scriptsDir);
      await fs.ensureDir(this.extensionsDir);
      await fs.ensureDir(this.runtimesDir);

      // Load all script types
      await this.loadLanguageExtensions();
      await this.loadIDEExtensions();
      await this.loadCustomRuntimes();
      await this.loadInjectionScripts();

      this.ready = true;
      console.log('✅ ScriptInjectionService initialized');
      console.log(`📦 Loaded ${this.languageExtensions.size} language extensions`);
      console.log(`🔧 Loaded ${this.ideExtensions.size} IDE extensions`);
      console.log(`⚡ Loaded ${this.customRuntimes.size} custom runtimes`);
      console.log(`💉 Loaded ${this.injectionPoints.size} injection points`);
    } catch (error) {
      console.error('❌ ScriptInjectionService initialization failed:', error);
      this.ready = false;
    }
  }

  // Language Extension System
  async loadLanguageExtensions() {
    const languagesDir = path.join(this.extensionsDir, 'languages');
    await fs.ensureDir(languagesDir);

    try {
      const languageDirs = await fs.readdir(languagesDir);
      
      for (const langDir of languageDirs) {
        const langPath = path.join(languagesDir, langDir);
        const stat = await fs.stat(langPath);
        
        if (stat.isDirectory()) {
          await this.loadLanguageExtension(langDir, langPath);
        }
      }
    } catch (error) {
      console.log('No language extensions found, creating default structure');
      await this.createDefaultLanguageExtensions();
    }
  }

  async loadLanguageExtension(language, extensionPath) {
    try {
      const manifestPath = path.join(extensionPath, 'manifest.json');
      const manifest = await fs.readJson(manifestPath);

      const extension = {
        id: manifest.id || language,
        name: manifest.name || language,
        version: manifest.version || '1.0.0',
        description: manifest.description || '',
        language: language,
        path: extensionPath,
        manifest,
        scripts: {},
        compilers: {},
        runtimes: {},
        syntax: {},
        features: manifest.features || []
      };

      // Load language-specific scripts
      await this.loadExtensionScripts(extension, 'compiler');
      await this.loadExtensionScripts(extension, 'runtime');
      await this.loadExtensionScripts(extension, 'syntax');
      await this.loadExtensionScripts(extension, 'linter');
      await this.loadExtensionScripts(extension, 'formatter');

      this.languageExtensions.set(language, extension);
      console.log(`✅ Loaded language extension: ${language}`);
    } catch (error) {
      console.error(`❌ Failed to load language extension ${language}:`, error);
    }
  }

  async loadExtensionScripts(extension, scriptType) {
    const scriptDir = path.join(extension.path, scriptType);
    
    try {
      if (await fs.pathExists(scriptDir)) {
        const scripts = await fs.readdir(scriptDir);
        
        for (const script of scripts) {
          if (script.endsWith('.js') || script.endsWith('.py') || script.endsWith('.sh')) {
            const scriptPath = path.join(scriptDir, script);
            const scriptContent = await fs.readFile(scriptPath, 'utf8');
            
            extension.scripts[scriptType] = {
              path: scriptPath,
              content: scriptContent,
              type: this.detectScriptType(script),
              executable: true
            };
          }
        }
      }
    } catch (error) {
      console.log(`No ${scriptType} scripts found for ${extension.language}`);
    }
  }

  // IDE Extension System
  async loadIDEExtensions() {
    const ideDir = path.join(this.extensionsDir, 'ide');
    await fs.ensureDir(ideDir);

    try {
      const ideFiles = await fs.readdir(ideDir);
      
      for (const ideFile of ideFiles) {
        if (ideFile.endsWith('.js') || ideFile.endsWith('.json')) {
          await this.loadIDEExtension(path.join(ideDir, ideFile));
        }
      }
    } catch (error) {
      console.log('No IDE extensions found, creating default structure');
      await this.createDefaultIDEExtensions();
    }
  }

  async loadIDEExtension(extensionPath) {
    try {
      const extension = await fs.readJson(extensionPath);
      
      const ideExtension = {
        id: extension.id,
        name: extension.name,
        version: extension.version,
        description: extension.description,
        type: extension.type || 'theme',
        path: extensionPath,
        config: extension.config || {},
        scripts: extension.scripts || {},
        ui: extension.ui || {},
        features: extension.features || []
      };

      this.ideExtensions.set(extension.id, ideExtension);
      console.log(`✅ Loaded IDE extension: ${extension.name}`);
    } catch (error) {
      console.error(`❌ Failed to load IDE extension ${extensionPath}:`, error);
    }
  }

  // Custom Runtime System
  async loadCustomRuntimes() {
    const runtimesDir = path.join(this.runtimesDir);
    
    try {
      const runtimeFiles = await fs.readdir(runtimesDir);
      
      for (const runtimeFile of runtimeFiles) {
        if (runtimeFile.endsWith('.js') || runtimeFile.endsWith('.py')) {
          await this.loadCustomRuntime(path.join(runtimesDir, runtimeFile));
        }
      }
    } catch (error) {
      console.log('No custom runtimes found, creating default structure');
      await this.createDefaultRuntimes();
    }
  }

  async loadCustomRuntime(runtimePath) {
    try {
      const runtimeContent = await fs.readFile(runtimePath, 'utf8');
      const runtimeName = path.basename(runtimePath, path.extname(runtimePath));
      
      const runtime = {
        id: runtimeName,
        name: runtimeName,
        path: runtimePath,
        content: runtimeContent,
        type: this.detectScriptType(runtimePath),
        executable: true,
        config: this.extractRuntimeConfig(runtimeContent)
      };

      this.customRuntimes.set(runtimeName, runtime);
      console.log(`✅ Loaded custom runtime: ${runtimeName}`);
    } catch (error) {
      console.error(`❌ Failed to load custom runtime ${runtimePath}:`, error);
    }
  }

  // Injection Point System
  async loadInjectionScripts() {
    const injectionsDir = path.join(this.scriptsDir, 'injections');
    await fs.ensureDir(injectionsDir);

    try {
      const injectionFiles = await fs.readdir(injectionsDir);
      
      for (const injectionFile of injectionFiles) {
        if (injectionFile.endsWith('.js')) {
          await this.loadInjectionScript(path.join(injectionsDir, injectionFile));
        }
      }
    } catch (error) {
      console.log('No injection scripts found, creating default structure');
      await this.createDefaultInjections();
    }
  }

  async loadInjectionScript(scriptPath) {
    try {
      const scriptContent = await fs.readFile(scriptPath, 'utf8');
      const scriptName = path.basename(scriptPath, '.js');
      
      // Extract injection metadata from script
      const metadata = this.extractInjectionMetadata(scriptContent);
      
      const injection = {
        id: metadata.id || scriptName,
        name: metadata.name || scriptName,
        path: scriptPath,
        content: scriptContent,
        injectionPoints: metadata.injectionPoints || [],
        dependencies: metadata.dependencies || [],
        config: metadata.config || {},
        executable: true
      };

      this.injectionPoints.set(injection.id, injection);
      console.log(`✅ Loaded injection script: ${injection.name}`);
    } catch (error) {
      console.error(`❌ Failed to load injection script ${scriptPath}:`, error);
    }
  }

  // Script Execution Engine
  async executeScript(scriptId, context = {}, options = {}) {
    const script = this.scriptRegistry.get(scriptId) || 
                   this.languageExtensions.get(scriptId) ||
                   this.ideExtensions.get(scriptId) ||
                   this.customRuntimes.get(scriptId) ||
                   this.injectionPoints.get(scriptId);

    if (!script) {
      throw new Error(`Script not found: ${scriptId}`);
    }

    const executionContext = {
      ...context,
      scriptId,
      timestamp: new Date().toISOString(),
      options
    };

    try {
      switch (script.type) {
        case 'javascript':
          return await this.executeJavaScript(script, executionContext);
        case 'python':
          return await this.executePython(script, executionContext);
        case 'shell':
          return await this.executeShell(script, executionContext);
        case 'native':
          return await this.executeNative(script, executionContext);
        default:
          return await this.executeGeneric(script, executionContext);
      }
    } catch (error) {
      console.error(`Script execution failed for ${scriptId}:`, error);
      throw error;
    }
  }

  async executeJavaScript(script, context) {
    return new Promise((resolve, reject) => {
      const sandbox = {
        console,
        require: (module) => {
          // Allow safe modules
          const allowedModules = ['fs', 'path', 'crypto', 'util', 'events'];
          if (allowedModules.includes(module)) {
            return require(module);
          }
          throw new Error(`Module ${module} not allowed in sandbox`);
        },
        ...context
      };

      try {
        const vmContext = vm.createContext(sandbox);
        const result = vm.runInContext(script.content, vmContext, {
          timeout: 5000,
          displayErrors: true
        });
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  async executePython(script, context) {
    return new Promise((resolve, reject) => {
      const tempFile = path.join(__dirname, '../../temp', `script_${uuidv4()}.py`);
      
      // Prepare script with context injection
      const scriptWithContext = this.injectContextIntoPython(script.content, context);
      
      fs.writeFile(tempFile, scriptWithContext)
        .then(() => {
          const pythonProcess = spawn('python3', [tempFile], {
            stdio: ['pipe', 'pipe', 'pipe']
          });

          let output = '';
          let error = '';

          pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
          });

          pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
          });

          pythonProcess.on('close', (code) => {
            fs.unlink(tempFile).catch(() => {}); // Clean up temp file
            
            if (code === 0) {
              resolve({ output, success: true });
            } else {
              reject(new Error(`Python script failed: ${error}`));
            }
          });
        })
        .catch(reject);
    });
  }

  async executeShell(script, context) {
    return new Promise((resolve, reject) => {
      const tempFile = path.join(__dirname, '../../temp', `script_${uuidv4()}.sh`);
      
      // Prepare script with context injection
      const scriptWithContext = this.injectContextIntoShell(script.content, context);
      
      fs.writeFile(tempFile, scriptWithContext)
        .then(() => {
          fs.chmod(tempFile, '755')
            .then(() => {
              exec(`bash ${tempFile}`, (error, stdout, stderr) => {
                fs.unlink(tempFile).catch(() => {}); // Clean up temp file
                
                if (error) {
                  reject(new Error(`Shell script failed: ${stderr}`));
                } else {
                  resolve({ output: stdout, success: true });
                }
              });
            })
            .catch(reject);
        })
        .catch(reject);
    });
  }

  // Language Support Injection
  async injectLanguageSupport(language, code, options = {}) {
    const extension = this.languageExtensions.get(language);
    
    if (!extension) {
      throw new Error(`Language extension not found: ${language}`);
    }

    const context = {
      code,
      language,
      options,
      extension
    };

    // Execute language-specific processing
    if (extension.scripts.compiler) {
      const compileResult = await this.executeScript(extension.scripts.compiler.path, context);
      context.compileResult = compileResult;
    }

    if (extension.scripts.runtime) {
      const runtimeResult = await this.executeScript(extension.scripts.runtime.path, context);
      context.runtimeResult = runtimeResult;
    }

    return context;
  }

  // IDE Feature Injection
  async injectIDEFeature(featureId, context = {}) {
    const extension = this.ideExtensions.get(featureId);
    
    if (!extension) {
      throw new Error(`IDE extension not found: ${featureId}`);
    }

    const injectionContext = {
      ...context,
      extension,
      featureId
    };

    return await this.executeScript(extension.id, injectionContext);
  }

  // Dynamic Script Registration
  async registerScript(scriptData) {
    const scriptId = scriptData.id || uuidv4();
    
    const script = {
      id: scriptId,
      name: scriptData.name,
      type: scriptData.type || 'javascript',
      content: scriptData.content,
      config: scriptData.config || {},
      executable: true,
      registeredAt: new Date().toISOString()
    };

    this.scriptRegistry.set(scriptId, script);
    
    // Save to persistent storage
    await this.saveScriptToDisk(script);
    
    return scriptId;
  }

  // Utility Methods
  detectScriptType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const typeMap = {
      '.js': 'javascript',
      '.py': 'python',
      '.sh': 'shell',
      '.bat': 'shell',
      '.ps1': 'powershell',
      '.rb': 'ruby',
      '.php': 'php',
      '.lua': 'lua'
    };
    return typeMap[ext] || 'generic';
  }

  extractRuntimeConfig(content) {
    // Extract configuration from script comments or metadata
    const configMatch = content.match(/\/\*\s*@config\s*([\s\S]*?)\s*\*\//);
    if (configMatch) {
      try {
        return JSON.parse(configMatch[1]);
      } catch (error) {
        return {};
      }
    }
    return {};
  }

  extractInjectionMetadata(content) {
    const metadataMatch = content.match(/\/\*\s*@injection\s*([\s\S]*?)\s*\*\//);
    if (metadataMatch) {
      try {
        return JSON.parse(metadataMatch[1]);
      } catch (error) {
        return {};
      }
    }
    return {};
  }

  injectContextIntoPython(content, context) {
    const contextVars = Object.entries(context)
      .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
      .join('\n');
    
    return `${contextVars}\n\n${content}`;
  }

  injectContextIntoShell(content, context) {
    const contextVars = Object.entries(context)
      .map(([key, value]) => `export ${key}='${JSON.stringify(value)}'`)
      .join('\n');
    
    return `#!/bin/bash\n${contextVars}\n\n${content}`;
  }

  async saveScriptToDisk(script) {
    const scriptPath = path.join(this.scriptsDir, `${script.id}.js`);
    await fs.writeFile(scriptPath, script.content);
  }

  // Default Structure Creation
  async createDefaultLanguageExtensions() {
    const defaultLanguages = ['rust', 'go', 'kotlin', 'swift', 'dart', 'elixir'];
    
    for (const lang of defaultLanguages) {
      const langDir = path.join(this.extensionsDir, 'languages', lang);
      await fs.ensureDir(langDir);
      
      const manifest = {
        id: lang,
        name: lang.charAt(0).toUpperCase() + lang.slice(1),
        version: '1.0.0',
        description: `Language support for ${lang}`,
        language: lang,
        features: ['syntax', 'compiler', 'runtime', 'linter']
      };
      
      await fs.writeJson(path.join(langDir, 'manifest.json'), manifest, { spaces: 2 });
    }
  }

  async createDefaultIDEExtensions() {
    const defaultExtensions = [
      {
        id: 'dark-theme',
        name: 'Dark Theme',
        type: 'theme',
        description: 'Dark theme for the IDE'
      },
      {
        id: 'code-folding',
        name: 'Code Folding',
        type: 'feature',
        description: 'Code folding functionality'
      }
    ];
    
    for (const ext of defaultExtensions) {
      const extPath = path.join(this.extensionsDir, 'ide', `${ext.id}.json`);
      await fs.writeJson(extPath, ext, { spaces: 2 });
    }
  }

  async createDefaultRuntimes() {
    const defaultRuntimes = [
      {
        name: 'custom-js',
        content: 'console.log("Custom JavaScript runtime loaded");',
        type: 'javascript'
      }
    ];
    
    for (const runtime of defaultRuntimes) {
      const runtimePath = path.join(this.runtimesDir, `${runtime.name}.js`);
      await fs.writeFile(runtimePath, runtime.content);
    }
  }

  async createDefaultInjections() {
    const defaultInjections = [
      {
        name: 'auto-complete',
        content: `/* @injection
        {
          "id": "auto-complete",
          "name": "Auto Complete",
          "injectionPoints": ["editor", "terminal"],
          "dependencies": []
        }
        */
        console.log("Auto-complete injection loaded");`,
        type: 'javascript'
      }
    ];
    
    for (const injection of defaultInjections) {
      const injectionPath = path.join(this.scriptsDir, 'injections', `${injection.name}.js`);
      await fs.writeFile(injectionPath, injection.content);
    }
  }

  // Getters
  getLanguageExtensions() {
    return Array.from(this.languageExtensions.values());
  }

  getIDEExtensions() {
    return Array.from(this.ideExtensions.values());
  }

  getCustomRuntimes() {
    return Array.from(this.customRuntimes.values());
  }

  getInjectionPoints() {
    return Array.from(this.injectionPoints.values());
  }

  isReady() {
    return this.ready;
  }
}

module.exports = ScriptInjectionService;