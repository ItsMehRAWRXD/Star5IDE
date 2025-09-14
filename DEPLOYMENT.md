# RawrZ Security Platform - DigitalOcean Deployment Guide

This guide will help you deploy your RawrZ Security Platform to DigitalOcean using multiple deployment methods.

## 🚀 Quick Start

### Prerequisites
- DigitalOcean account
- Domain name (optional but recommended)
- SSH key pair

### 1. Create DigitalOcean Droplet

1. **Login to DigitalOcean Console**
2. **Create a new Droplet:**
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: Basic plan, 2GB RAM minimum (4GB recommended)
   - **Region**: Choose closest to your users
   - **Authentication**: SSH Key (recommended)
   - **Hostname**: rawrz-security

3. **Wait for droplet creation** and note the IP address

### 2. Connect to Your Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### 3. Deploy the Application

Choose one of the deployment methods below:

## 📦 Deployment Method 1: Automated Script (Recommended)

### Step 1: Upload Your Code

```bash
# On your local machine
scp -r /path/to/rawrz-security-platform root@YOUR_DROPLET_IP:/tmp/
```

### Step 2: Run Deployment Script

```bash
# On the droplet
cd /tmp/rawrz-security-platform
chmod +x deploy.sh

# For full deployment with Docker
sudo ./deploy.sh full

# Or for direct Node.js deployment
sudo ./deploy.sh direct

# Or for Docker-only deployment
sudo ./deploy.sh docker
```

### Step 3: Configure Domain (Optional)

If you have a domain name:

```bash
# Set your domain and email
export DOMAIN="yourdomain.com"
export EMAIL="your-email@example.com"

# Re-run deployment with SSL
sudo ./deploy.sh full
```

## 🐳 Deployment Method 2: Docker Compose

### Step 1: Install Docker and Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### Step 2: Deploy with Docker Compose

```bash
# Clone or upload your code
cd /opt
git clone https://github.com/yourusername/rawrz-security-platform.git
cd rawrz-security-platform

# Start the application
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
```

## 🔧 Deployment Method 3: Direct Node.js

### Step 1: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs
```

### Step 2: Setup Application

```bash
# Create application user
useradd -r -s /bin/bash -d /opt/rawrz-security -m rawrz

# Setup application
cd /opt/rawrz-security
# Upload your code here
chown -R rawrz:rawrz /opt/rawrz-security

# Install dependencies
sudo -u rawrz npm install --production
```

### Step 3: Create Systemd Service

```bash
# Copy service file
cp rawrz-security.service /etc/systemd/system/

# Enable and start service
systemctl daemon-reload
systemctl enable rawrz-security
systemctl start rawrz-security

# Check status
systemctl status rawrz-security
```

## 🌐 Web Server Configuration

### Install and Configure Nginx

```bash
# Install nginx
apt install -y nginx

# Configure nginx (use provided nginx.conf)
cp nginx.conf /etc/nginx/nginx.conf

# Test configuration
nginx -t

# Restart nginx
systemctl restart nginx
systemctl enable nginx
```

### SSL Certificate with Let's Encrypt

```bash
# Install certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d yourdomain.com --non-interactive --agree-tos --email your-email@example.com

# Auto-renewal
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔒 Security Configuration

### Firewall Setup

```bash
# Enable UFW
ufw --force enable

# Allow essential ports
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

# Check status
ufw status
```

### Fail2Ban Setup

```bash
# Install fail2ban
apt install -y fail2ban

# Enable and start
systemctl enable fail2ban
systemctl start fail2ban
```

## 📊 Monitoring and Maintenance

### Check Application Status

```bash
# Docker deployment
docker-compose ps
docker-compose logs rawrz-security

# Direct deployment
systemctl status rawrz-security
journalctl -u rawrz-security -f

# Check resource usage
htop
df -h
free -h
```

### Application Logs

```bash
# Application logs
tail -f /opt/rawrz-security/logs/*.log

# System logs
journalctl -u rawrz-security -f
journalctl -u nginx -f
```

### Backup Strategy

```bash
# Create backup script
cat > /opt/backup-rawrz.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR

# Backup application data
tar -czf $BACKUP_DIR/rawrz-data-$DATE.tar.gz /opt/rawrz-security/data /opt/rawrz-security/uploads

# Keep only last 7 days
find $BACKUP_DIR -name "rawrz-data-*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/backup-rawrz.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /opt/backup-rawrz.sh
```

## 🧪 Testing Your Deployment

### Basic Health Check

```bash
# Test local connection
curl http://localhost:3000/health

# Test external connection
curl http://YOUR_DROPLET_IP

# Test HTTPS (if configured)
curl https://yourdomain.com
```

### CLI Commands Test

```bash
# Test CLI functionality
cd /opt/rawrz-security
node rawrz-standalone.js help
node rawrz-standalone.js sysinfo
node rawrz-standalone.js encrypt aes256 "test data"
```

## 🔧 Troubleshooting

### Common Issues

1. **Port 3000 not accessible**
   ```bash
   # Check if service is running
   systemctl status rawrz-security
   
   # Check port binding
   netstat -tlnp | grep 3000
   
   # Check firewall
   ufw status
   ```

2. **SSL certificate issues**
   ```bash
   # Check certificate status
   certbot certificates
   
   # Renew certificate
   certbot renew --dry-run
   ```

3. **Docker issues**
   ```bash
   # Check Docker status
   docker-compose ps
   docker-compose logs
   
   # Rebuild containers
   docker-compose down
   docker-compose up -d --build
   ```

### Log Locations

- Application logs: `/opt/rawrz-security/logs/`
- System logs: `journalctl -u rawrz-security`
- Nginx logs: `/var/log/nginx/`
- Docker logs: `docker-compose logs`

## 📈 Performance Optimization

### Resource Monitoring

```bash
# Install monitoring tools
apt install -y htop iotop nethogs

# Monitor in real-time
htop
iotop
nethogs
```

### Optimize Node.js

```bash
# Set Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=1024"

# Update service file with optimization
systemctl edit rawrz-security
# Add:
# [Service]
# Environment=NODE_OPTIONS=--max-old-space-size=1024
```

## 🔄 Updates and Maintenance

### Update Application

```bash
# Backup current version
cp -r /opt/rawrz-security /opt/rawrz-security.backup

# Update code
cd /opt/rawrz-security
git pull origin main  # or upload new files

# Restart services
systemctl restart rawrz-security
# or
docker-compose down && docker-compose up -d --build
```

### System Updates

```bash
# Update system packages
apt update && apt upgrade -y

# Reboot if kernel updated
reboot
```

## 📞 Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Check logs and system resources
2. **Monthly**: Update system packages
3. **Quarterly**: Review security settings and certificates

### Monitoring Commands

```bash
# Check system health
df -h                    # Disk usage
free -h                  # Memory usage
systemctl --failed       # Failed services
journalctl -p err        # Error logs
```

---

## 🎉 Deployment Complete!

Your RawrZ Security Platform is now deployed on DigitalOcean. You can:

- **Access via CLI**: SSH to your droplet and use `node rawrz-standalone.js`
- **Web Interface**: Visit your domain (if configured)
- **API Access**: Use the REST endpoints (if implemented)

### Next Steps

1. **Configure your domain DNS** to point to your droplet IP
2. **Set up monitoring** and alerting
3. **Configure backups** for your data
4. **Review security settings** and harden as needed
5. **Set up CI/CD** for automated deployments

For support and updates, refer to the main README.md file.