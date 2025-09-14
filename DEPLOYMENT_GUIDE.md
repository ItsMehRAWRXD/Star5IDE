# RawrZ Security Platform - DigitalOcean Deployment Guide

This guide will help you deploy your RawrZ Security Platform to DigitalOcean using Docker containers.

## 🚀 Quick Start

### Prerequisites

1. **DigitalOcean Account**: Sign up at [digitalocean.com](https://digitalocean.com)
2. **DigitalOcean API Token**: Generate one in your DigitalOcean control panel
3. **doctl CLI**: DigitalOcean command-line tool
4. **SSH Key**: For secure access to your droplet

### 1. Install DigitalOcean CLI (doctl)

#### Linux/macOS:
```bash
# Download and install doctl
curl -sL https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz | tar -xzv
sudo mv doctl /usr/local/bin

# Verify installation
doctl version
```

#### Windows:
```powershell
# Using Chocolatey
choco install doctl

# Or download from GitHub releases
# https://github.com/digitalocean/doctl/releases
```

### 2. Authenticate with DigitalOcean

```bash
# Initialize authentication
doctl auth init

# Enter your API token when prompted
# You can find your API token at: https://cloud.digitalocean.com/account/api/tokens
```

### 3. Deploy Using the Automated Script

```bash
# Make the deployment script executable
chmod +x deploy-digitalocean.sh

# Run the deployment script
./deploy-digitalocean.sh
```

The script will:
- Create a DigitalOcean Droplet (Ubuntu 20.04 with Docker)
- Set up SSH keys
- Install necessary dependencies
- Create the application directory structure
- Set up systemd service for auto-start

## 🛠️ Manual Deployment Steps

If you prefer to deploy manually or need more control:

### 1. Create a DigitalOcean Droplet

```bash
# Create droplet with Docker pre-installed
doctl compute droplet create rawrz-security-platform \
    --size s-1vcpu-1gb \
    --image docker-20-04 \
    --region nyc1 \
    --ssh-keys YOUR_SSH_KEY_ID \
    --wait
```

### 2. Connect to Your Droplet

```bash
# Get droplet IP
doctl compute droplet list

# SSH into the droplet
ssh root@YOUR_DROPLET_IP
```

### 3. Set Up the Application

```bash
# Update system
apt-get update && apt-get upgrade -y

# Create application directory
mkdir -p /opt/rawrz-security
cd /opt/rawrz-security

# Upload your application files
# You can use scp, rsync, or git clone
scp -r /path/to/your/app/* root@YOUR_DROPLET_IP:/opt/rawrz-security/
```

### 4. Configure Environment

```bash
# Copy environment template
cp .env.template .env

# Edit environment variables
nano .env

# Update the following important variables:
# - SECRET_KEY (generate a strong random key)
# - JWT_SECRET (generate a strong random key)
# - ENCRYPTION_KEY (generate a strong random key)
```

### 5. Deploy with Docker Compose

```bash
# Build and start the application
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 6. Set Up SSL (Optional but Recommended)

```bash
# Install Certbot for Let's Encrypt
apt-get install certbot python3-certbot-nginx

# Generate SSL certificate
certbot --nginx -d yourdomain.com

# Auto-renewal
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Configuration Options

### Droplet Sizes

| Size | vCPUs | RAM | Storage | Price/Month | Recommended For |
|------|-------|-----|---------|-------------|-----------------|
| s-1vcpu-1gb | 1 | 1GB | 25GB | $6 | Development/Testing |
| s-1vcpu-2gb | 1 | 2GB | 50GB | $12 | Small Production |
| s-2vcpu-2gb | 2 | 2GB | 50GB | $18 | Medium Production |
| s-2vcpu-4gb | 2 | 4GB | 80GB | $36 | Large Production |

### Regions

Choose the region closest to your users:
- `nyc1`, `nyc2`, `nyc3` - New York
- `sfo1`, `sfo2`, `sfo3` - San Francisco
- `lon1` - London
- `fra1` - Frankfurt
- `sgp1` - Singapore
- `tor1` - Toronto

### Environment Variables

Key environment variables to configure:

```bash
# Security (REQUIRED - Change these!)
SECRET_KEY=your-very-long-random-secret-key-here
JWT_SECRET=your-jwt-secret-key-here
ENCRYPTION_KEY=your-encryption-key-here

# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# File uploads
MAX_FILE_SIZE=100MB
UPLOAD_DIR=/app/uploads

# Security features
ANTI_ANALYSIS_ENABLED=true
STEALTH_MODE_ENABLED=true
```

## 🔒 Security Best Practices

### 1. Firewall Configuration

```bash
# Configure UFW firewall
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Check status
ufw status
```

### 2. SSH Security

```bash
# Disable root login (create a user first)
adduser rawrz
usermod -aG sudo rawrz
usermod -aG docker rawrz

# Configure SSH
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no

# Restart SSH
systemctl restart ssh
```

### 3. Docker Security

```bash
# Run containers as non-root user (already configured in Dockerfile)
# Use secrets for sensitive data
# Regularly update base images
docker system prune -a
```

### 4. SSL/TLS Configuration

The Nginx configuration includes:
- TLS 1.2+ only
- Strong cipher suites
- HSTS headers
- Security headers

## 📊 Monitoring and Maintenance

### 1. Health Checks

```bash
# Check application health
curl http://localhost:3000/health

# Check Docker containers
docker-compose ps

# Check system resources
htop
df -h
```

### 2. Logs

```bash
# Application logs
docker-compose logs -f rawrz-security

# Nginx logs
docker-compose logs -f nginx

# System logs
journalctl -u rawrz.service -f
```

### 3. Backups

```bash
# Create backup script
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /opt/backups/rawrz_backup_$DATE.tar.gz /opt/rawrz-security/data
find /opt/backups -name "rawrz_backup_*.tar.gz" -mtime +30 -delete
EOF

chmod +x /opt/backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /opt/backup.sh
```

### 4. Updates

```bash
# Update application
cd /opt/rawrz-security
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Update system
apt-get update && apt-get upgrade -y
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check logs
docker-compose logs rawrz-security

# Check if port is in use
netstat -tlnp | grep :3000

# Rebuild container
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### 2. SSL Certificate Issues
```bash
# Check certificate
openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout

# Test SSL
curl -I https://yourdomain.com
```

#### 3. Permission Issues
```bash
# Fix file permissions
chown -R 1001:1001 /opt/rawrz-security/data
chmod -R 755 /opt/rawrz-security/data
```

#### 4. Memory Issues
```bash
# Check memory usage
free -h
docker stats

# Increase swap if needed
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

### Getting Help

1. Check application logs: `docker-compose logs -f`
2. Check system logs: `journalctl -u rawrz.service -f`
3. Verify configuration: `docker-compose config`
4. Test connectivity: `curl http://localhost:3000/health`

## 💰 Cost Optimization

### 1. Right-size Your Droplet
- Start with the smallest size that meets your needs
- Monitor usage and scale up as needed
- Use DigitalOcean's monitoring to track resource usage

### 2. Use Snapshots
```bash
# Create snapshot before major changes
doctl compute droplet-action snapshot DROPLET_ID --snapshot-name "rawrz-backup-$(date +%Y%m%d)"
```

### 3. Enable Monitoring
- Use DigitalOcean's built-in monitoring
- Set up alerts for high CPU/memory usage
- Monitor bandwidth usage

## 🎯 Next Steps

After successful deployment:

1. **Test all functionality** - Verify all 110+ security features work
2. **Set up monitoring** - Configure alerts and dashboards
3. **Create backups** - Implement automated backup strategy
4. **Document access** - Keep track of credentials and access methods
5. **Plan scaling** - Monitor usage and plan for growth

## 📞 Support

- **DigitalOcean Support**: [help.digitalocean.com](https://help.digitalocean.com)
- **Docker Documentation**: [docs.docker.com](https://docs.docker.com)
- **RawrZ Security Platform**: Check the main README.md for application-specific help

---

**Happy Deploying! 🚀**

Your RawrZ Security Platform is now ready to provide enterprise-level security tools in the cloud!