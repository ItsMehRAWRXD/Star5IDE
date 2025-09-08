# DigitalOcean Deployment Guide for screenpilot.dev

This guide will help you deploy the RawrZ Security Platform to DigitalOcean under the domain `screenpilot.dev`.

## Prerequisites

1. **DigitalOcean Account**: Sign up at [digitalocean.com](https://digitalocean.com)
2. **Domain**: Ensure you own `screenpilot.dev` and can manage its DNS
3. **SSH Key**: Generate and add an SSH key to DigitalOcean
4. **doctl CLI**: Install the DigitalOcean CLI tool
5. **Docker**: Install Docker on your local machine

## Quick Deployment

### Option 1: PowerShell Script (Windows)
```powershell
# Make sure you're authenticated with DigitalOcean
doctl auth init

# Run the deployment script
powershell -ExecutionPolicy Bypass -File "scripts\deploy-digitalocean.ps1"
```

### Option 2: Bash Script (Linux/Mac)
```bash
# Make sure you're authenticated with DigitalOcean
doctl auth init

# Make script executable and run
chmod +x scripts/deploy-digitalocean.sh
./scripts/deploy-digitalocean.sh
```

### Option 3: Manual Deployment

1. **Create Droplet**:
   ```bash
   doctl compute droplet create rawrz-security-platform \
     --size s-2vcpu-4gb \
     --image docker-20-04 \
     --region nyc1 \
     --ssh-keys YOUR_SSH_KEY_ID
   ```

2. **Setup DNS**:
   ```bash
   # Get droplet IP
   DROPLET_IP=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep rawrz-security-platform | awk '{print $2}')
   
   # Add A records
   doctl compute domain records create screenpilot.dev \
     --record-type A --record-name @ --record-data $DROPLET_IP
   ```

3. **Deploy Application**:
   ```bash
   # Copy files to droplet
   scp -r * root@$DROPLET_IP:/root/rawrz-security-platform/
   
   # SSH and setup
   ssh root@$DROPLET_IP
   cd /root/rawrz-security-platform
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

## Configuration

### Environment Variables
Copy `env.production.example` to `.env.production` and update:

```bash
# Required settings
NODE_ENV=production
DOMAIN=screenpilot.dev
JWT_SECRET=your-super-secure-jwt-secret
MONGODB_URI=mongodb://localhost:27017/rawrz_production

# Email settings (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### SSL Certificates
The deployment script automatically generates SSL certificates using Let's Encrypt:

```bash
certbot --nginx -d screenpilot.dev -d www.screenpilot.dev --non-interactive --agree-tos --email admin@screenpilot.dev
```

## Architecture

```
[CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR]    [CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR]    [CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR]
[CHAR]   CloudFlare    [CHAR]    [CHAR]   DigitalOcean  [CHAR]    [CHAR]   RawrZ App     [CHAR]
[CHAR]   (DNS/CDN)     [CHAR][CHAR][CHAR][CHAR][CHAR][CHAR]   Droplet       [CHAR][CHAR][CHAR][CHAR][CHAR][CHAR]   (Docker)      [CHAR]
[CHAR]                 [CHAR]    [CHAR]   - Nginx       [CHAR]    [CHAR]   - Node.js     [CHAR]
[CHAR]                 [CHAR]    [CHAR]   - SSL         [CHAR]    [CHAR]   - MongoDB     [CHAR]
[CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR]    [CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR]    [CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR][CHAR]
```

## Services

- **Nginx**: Reverse proxy, SSL termination, static file serving
- **RawrZ App**: Main application (Node.js)
- **MongoDB**: Database (if using external)
- **Docker**: Containerization

## Monitoring

The deployment includes:

- **Health Checks**: Automatic application health monitoring
- **Log Rotation**: Automatic log cleanup
- **SSL Renewal**: Automatic SSL certificate renewal
- **Firewall**: UFW configured for security

## Security Features

- **SSL/TLS**: Automatic HTTPS with Let's Encrypt
- **Security Headers**: HSTS, XSS protection, etc.
- **Rate Limiting**: API and login rate limiting
- **Firewall**: Only necessary ports open
- **Non-root User**: Application runs as non-root user

## Maintenance

### Update Application
```bash
ssh root@$DROPLET_IP
cd /root/rawrz-security-platform
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

### View Logs
```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Backup
```bash
# Backup application data
tar -czf backup-$(date +%Y%m%d).tar.gz /root/rawrz-security-platform

# Backup database (if using external MongoDB)
mongodump --uri="mongodb://localhost:27017/rawrz_production" --out backup-db-$(date +%Y%m%d)
```

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**:
   ```bash
   certbot renew --dry-run
   ```

2. **Application Not Starting**:
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

3. **DNS Not Propagating**:
   - Wait up to 24 hours for DNS propagation
   - Check DNS with: `nslookup screenpilot.dev`

4. **Port Issues**:
   ```bash
   ufw status
   netstat -tlnp
   ```

### Support

- Check application logs: `docker-compose logs -f`
- Check system resources: `htop`, `df -h`
- Check network: `netstat -tlnp`

## Cost Estimation

- **Droplet**: $24/month (s-2vcpu-4gb)
- **Domain**: $10-15/year
- **SSL**: Free (Let's Encrypt)
- **Total**: ~$25/month

## Next Steps

1. [OK] Deploy to DigitalOcean
2. [CHAR][CHAR] Configure monitoring alerts
3. [STATUS] Set up analytics
4. [LOCK] Implement additional security measures
5. [CHAR][CHAR] Scale as needed

Your RawrZ Security Platform will be available at: **https://screenpilot.dev**
