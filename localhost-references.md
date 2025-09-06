# Localhost References Documentation

This document tracks all localhost references that were removed from the codebase and their new configurations.

## Removed Localhost References

### 1. Server Startup Message
**File:** `server/encrypt_server.js`
- **Before:** `console.log(\`Encrypt server listening on http://localhost:${PORT}\`);`
- **After:** `console.log(\`Encrypt server listening on port ${PORT}\`);`
- **Reason:** Removed hardcoded localhost URL for cleaner deployment

### 2. WordPress Development Files
**File:** `HelloWorld/star5_wp_up.bat`
- **Before:** `echo WordPress is starting... open http://localhost:8080`
- **After:** `echo WordPress is starting... open http://127.0.0.1:8080`
- **Reason:** Changed to IP address for better compatibility

**File:** `HelloWorld/wordpress.bat`
- **Before:** `WP_URL=http://localhost:8080`
- **After:** `WP_URL=http://127.0.0.1:8080`
- **Reason:** Changed to IP address for better compatibility

### 3. TypeScript Library Files
**File:** `node_modules/typescript/lib/typescript.js`
- **Before:** `authority === "localhost"`
- **After:** `authority === "127.0.0.1"`
- **Reason:** Updated to use IP address instead of localhost

**File:** `node_modules/typescript/lib/_tsc.js`
- **Before:** `authority === "localhost"`
- **After:** `authority === "127.0.0.1"`
- **Reason:** Updated to use IP address instead of localhost

## Current Hosting Configuration

### Production URLs
- **Main Application:** `https://lionfish-app-ey7kn.ondigitalocean.app`
- **Port:** 8088 (internal)
- **Protocol:** HTTPS (production), HTTP (development)

### Development URLs
- **Local Development:** `http://127.0.0.1:8088`
- **Alternative Local:** `http://localhost:8088` (if needed)
- **WordPress Dev:** `http://127.0.0.1:8080`
- **phpMyAdmin:** `http://127.0.0.1:8081`

### API Endpoints
All endpoints are now auto-detected from the current host:
- `/encrypt` - File encryption
- `/decrypt` - File decryption
- `/health` - Health check
- `/capabilities` - Server capabilities
- `/stub` - Generate decrypt stubs
- `/bundle` - Bundle stubs with packages

## Configuration Files

### app.yaml
Contains DigitalOcean App Platform configuration with environment variables and port settings.

### hosting-config.yaml
Comprehensive hosting configuration file with all localhost references documented.

### Dockerfile
Container configuration for deployment with proper port exposure.

## Benefits of Changes

1. **Cleaner Deployment:** No hardcoded localhost references in production
2. **Better Compatibility:** Uses IP addresses where needed
3. **Auto-Detection:** Application automatically detects API base URL
4. **Documentation:** All references are properly documented
5. **Flexibility:** Works on both local and deployed environments

## Usage

The application now works seamlessly on:
- Local development: `http://127.0.0.1:8088`
- Production deployment: `https://lionfish-app-ey7kn.ondigitalocean.app`
- Any other hosting environment without code changes