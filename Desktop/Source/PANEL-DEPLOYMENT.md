# RawrZ Security Platform - Panel Deployment

Deploy the RawrZ Security Platform as a panel to your existing DigitalOcean app:
**https://lionfish-app-ey7kn.ondigitalocean.app/panel**

## [TARGET] What This Does

- Attaches RawrZ Security Platform as a `/panel` route to your existing app
- Maintains your main app functionality
- Adds advanced security tools and crypto engines
- Provides a unified interface

## [START] Quick Deploy

### Option 1: Automated Script
```bash
chmod +x scripts/deploy-panel.sh
./scripts/deploy-panel.sh
```

### Option 2: Manual Steps

1. **Get your droplet IP:**
   ```bash
   doctl compute droplet list
   ```

2. **Copy files to server:**
   ```bash
   scp -r Dockerfile.prod root@YOUR_SERVER_IP:/root/rawrz-security-panel/
   scp -r docker-compose.panel.yml root@YOUR_SERVER_IP:/root/rawrz-security-panel/
   scp -r nginx/panel-nginx.conf root@YOUR_SERVER_IP:/root/rawrz-security-panel/
   scp -r env.panel.example root@YOUR_SERVER_IP:/root/rawrz-security-panel/
   scp -r src/ root@YOUR_SERVER_IP:/root/rawrz-security-panel/
   scp -r public/ root@YOUR_SERVER_IP:/root/rawrz-security-panel/
   scp -r scripts/ root@YOUR_SERVER_IP:/root/rawrz-security-panel/
   scp -r package*.json root@YOUR_SERVER_IP:/root/rawrz-security-panel/
   ```

3. **SSH and deploy:**
   ```bash
   ssh root@YOUR_SERVER_IP
   cd /root/rawrz-security-panel
   
   # Install dependencies
   apt-get update
   apt-get install -y nginx docker.io docker-compose
   
   # Setup environment
   cp env.panel.example .env.production
   
   # Deploy
   docker-compose -f docker-compose.panel.yml up -d --build
   
   # Setup nginx
   cp nginx/panel-nginx.conf /etc/nginx/sites-available/rawrz-panel
   ln -sf /etc/nginx/sites-available/rawrz-panel /etc/nginx/sites-enabled/
   rm -f /etc/nginx/sites-enabled/default
   
   # Restart nginx
   nginx -t
   systemctl restart nginx
   ```

## [FOLDER] File Structure

```
lionfish-app-ey7kn.ondigitalocean.app/
[CHAR][CHAR][CHAR] /                    # Your main app
[CHAR][CHAR][CHAR] /panel               # RawrZ Security Platform
    [CHAR][CHAR][CHAR] /api/            # Security APIs
    [CHAR][CHAR][CHAR] /crypto/         # Crypto engines
    [CHAR][CHAR][CHAR] /tools/          # Security tools
    [CHAR][CHAR][CHAR] /health          # Health check
```

## [CHAR][CHAR] Configuration

The panel is configured to:
- Run on port 3001 (to avoid conflicts)
- Use `/panel` as the base path
- Integrate with your existing domain
- Maintain separate database (`rawrz_panel`)

## [SECURITY] Features Available

- **Dual Crypto Engine** (AES + Camellia)
- **Advanced Encryption** tools
- **Process Monitoring**
- **Hot Patching** capabilities
- **Security Analysis** tools
- **File Processing** utilities

## [SEARCH] Testing

1. **Health Check:**
   ```bash
   curl https://lionfish-app-ey7kn.ondigitalocean.app/panel/health
   ```

2. **Main Panel:**
   ```
   https://lionfish-app-ey7kn.ondigitalocean.app/panel
   ```

3. **API Endpoints:**
   ```
   https://lionfish-app-ey7kn.ondigitalocean.app/panel/api/
   ```

## [STATUS] Monitoring

```bash
# View logs
ssh root@YOUR_SERVER_IP
cd /root/rawrz-security-panel
docker-compose -f docker-compose.panel.yml logs -f

# Check status
docker ps
systemctl status nginx

# Monitor health
curl https://lionfish-app-ey7kn.ondigitalocean.app/panel/health
```

## [INFO] Updates

```bash
# Update panel
ssh root@YOUR_SERVER_IP
cd /root/rawrz-security-panel
git pull origin main
docker-compose -f docker-compose.panel.yml up -d --build
```

## [ALERT] Troubleshooting

### Panel not loading:
```bash
# Check nginx config
nginx -t

# Check container status
docker ps

# View logs
docker-compose -f docker-compose.panel.yml logs
```

### 502 Bad Gateway:
```bash
# Restart services
docker-compose -f docker-compose.panel.yml restart
systemctl restart nginx
```

### SSL issues:
```bash
# Check SSL certificates
certbot certificates
```

## [SUCCESS] Result

After deployment, you'll have:
- [OK] Your main app at: `https://lionfish-app-ey7kn.ondigitalocean.app/`
- [OK] RawrZ Security Panel at: `https://lionfish-app-ey7kn.ondigitalocean.app/panel`
- [OK] Unified interface with advanced security tools
- [OK] Separate databases and configurations
- [OK] Independent scaling and monitoring

Your RawrZ Security Platform will be accessible at:
**https://lionfish-app-ey7kn.ondigitalocean.app/panel** [START]
