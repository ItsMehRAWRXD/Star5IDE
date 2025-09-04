# 🏠 Not at Home - Universal Encrypted Stub Generator

> **They can see the Java, but it doesn't matter - nothing is exposed.**

Not at Home is a revolutionary deployment stub generator that encrypts your DigitalOcean and GitHub configurations into JSONL, then wraps them in completely irrelevant Java code. The generated Java appears to be generic utility classes but contains your encrypted deployment configurations.

## 🎯 Key Features

- **JSONL Encryption**: Each configuration line independently encrypted
- **Java Obfuscation**: Generated code looks completely unrelated to deployments
- **Browser Compatible**: Works in any console, even browser DevTools
- **Unlimited Generation**: Create infinite unique stubs from templates
- **Zero Exposure**: Even if someone reads the Java, they see nothing useful

## 🚀 Quick Start

### Browser Console (Mobile Friendly)

Open any browser console and paste:

```javascript
// Load Not at Home in browser
fetch('https://raw.githubusercontent.com/YOUR_USERNAME/not-at-home/main/not-at-home.js')
  .then(r => r.text())
  .then(eval);

// Generate DigitalOcean stub
NotAtHome.digitalOcean("my-app", "nyc3");

// Generate GitHub Actions stub  
NotAtHome.github("my-repo", "main");
```

### Node.js

```bash
# Generate DigitalOcean stub
node not-at-home.js do my-app nyc3

# Generate GitHub Actions stub
node not-at-home.js gh my-repo main

# Generate 100 unique stubs
node not-at-home.js generate 100

# Get browser console code
node not-at-home.js browser
```

### Java

```bash
# Compile
javac NotAtHome.java

# Generate stubs
java NotAtHome do my-app nyc3
java NotAtHome gh my-repo main
java NotAtHome generate 50
```

## 🔐 How It Works

1. **Configuration** → Your deployment settings
2. **JSONL Encryption** → Each setting encrypted independently
3. **Java Generation** → Wrapped in irrelevant utility code
4. **Deployment** → Looks like normal Java utilities

### Example Output

Your configuration:
```json
{
  "provider": "digitalocean",
  "droplet_name": "my-app",
  "region": "nyc3"
}
```

Becomes this Java:
```java
public class Util8x3mq7p2 {
    private static final String RES_0 = "eyJ0IjoxNzA5...";
    private static final String RES_1 = "eyJrIjoicCIs...";
    
    public static double getMetric(String name) {
        return Math.random() * 100;
    }
    // ... more irrelevant code
}
```

**They see Java utilities. You see encrypted deployments.**

## 📋 Templates

Pre-configured templates in `templates.jsonl`:

- `do-basic` - Basic DigitalOcean droplet
- `do-production` - Production setup with monitoring
- `do-kubernetes` - Kubernetes cluster
- `gh-actions` - GitHub Actions workflow
- `gh-pages` - GitHub Pages deployment
- `hybrid-do-gh` - Combined DO + GitHub
- `multi-region` - Multi-region deployment
- `docker-swarm` - Docker Swarm cluster

## 🔄 Unlimited Generation

Generate infinite unique stubs:

```javascript
// Browser
for(let i = 0; i < 1000; i++) {
    NotAtHome.digitalOcean(`app-${i}`, "nyc3");
}

// Node.js
node not-at-home.js generate 1000

// Java
java NotAtHome generate 1000
```

Each stub is unique but functionally identical.

## 🌐 Browser Console Usage

Perfect for mobile or restricted environments:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Paste the loader code
4. Generate stubs directly

Works on:
- Chrome DevTools
- Firefox Console
- Safari Web Inspector
- Edge DevTools
- Mobile browsers (with console access)

## 🛡️ Security Features

- **AES-256-GCM encryption** with authentication
- **PBKDF2 key derivation** with random salts
- **Independent line encryption** in JSONL
- **No correlation** between Java code and encrypted data
- **Timestamp validation** prevents replay attacks

## 📦 Installation

### Option 1: NPM
```bash
npm install -g not-at-home
```

### Option 2: Direct Download
```bash
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/not-at-home/main/not-at-home.js
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/not-at-home/main/NotAtHome.java
```

### Option 3: Browser Bookmark
```javascript
javascript:(function(){fetch('https://raw.githubusercontent.com/YOUR_USERNAME/not-at-home/main/not-at-home.js').then(r=>r.text()).then(eval)})();
```

## 🎯 Use Cases

1. **CI/CD Pipelines** - Encrypted deployment configs
2. **Mobile Deployments** - Deploy from phone browser
3. **Secure Templates** - Share configs without exposing secrets
4. **Disaster Recovery** - Encrypted backup configurations
5. **Multi-Environment** - Generate stubs for dev/staging/prod

## 🔧 Advanced Usage

### Custom Encryption Key
```javascript
NotAtHome.setKey("your-secret-key");
NotAtHome.digitalOcean("app", "nyc3");
```

### Batch Generation
```javascript
const configs = [
  {name: "web", region: "nyc3"},
  {name: "api", region: "sfo3"},
  {name: "db", region: "ams3"}
];

configs.forEach(c => NotAtHome.digitalOcean(c.name, c.region));
```

### Template Extension
```javascript
NotAtHome.addTemplate("custom", {
  provider: "custom",
  // your config
});

NotAtHome.fromTemplate("custom", 100); // Generate 100
```

## 📊 Performance

- Generates 1000 stubs in < 1 second
- Each stub ~2KB encrypted data
- Browser compatible (no dependencies)
- Works offline once loaded

## 🤝 Contributing

1. Fork the repository
2. Add your templates to `templates.jsonl`
3. Submit PR with new providers

## 📝 License

MIT - Use anywhere, anytime, for anything.

## 🔗 Links

- [GitHub Repository](https://github.com/YOUR_USERNAME/not-at-home)
- [NPM Package](https://www.npmjs.com/package/not-at-home)
- [Documentation](https://not-at-home.dev)

---

**Remember**: They see Java. You see deployments. Nothing is exposed.

```
IF (anyone_reads_the_java) {
    they_see = "generic utility code";
    you_have = "encrypted deployments";
    exposed = NOTHING;
}
```

🏠 **Not at Home** - Because your configs should be everywhere, but visible nowhere.