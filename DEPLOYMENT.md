# RawrZ Security Platform - Digital Ocean Deployment Guide

This guide will help you deploy the RawrZ Security Platform on Digital Ocean using Docker containers.

## 🚀 Quick Start

### Option 1: Quick Deploy (Development/Testing)
```bash
# Clone your repository
git clone <your-repo-url>
cd rawrz-security-platform

# Run quick deploy
./quick-deploy.sh your-domain.com admin@your-domain.com
```

### Option 2: Full Production Deploy
```bash
# Run the full deployment script
./deploy.sh
```

## 📋 Prerequisites

### Digital Ocean Droplet Requirements
- **OS**: Ubuntu 20.04 LTS or newer
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB SSD
- **CPU**: 1 vCPU minimum (2 vCPU recommended)
- **Network**: Public IP address

### Domain Setup
- Point your domain's A record to your Digital Ocean droplet's IP address
- Ensure DNS propagation is complete before deployment

## 🔧 Manual Deployment Steps

### 1. Create Digital Ocean Droplet
1. Log into your Digital Ocean account
2. Create a new droplet:
   - Choose Ubuntu 20.04 LTS
   - Select appropriate size (2GB RAM minimum)
   - Add your SSH key
   - Choose a datacenter region
3. Note down the droplet's IP address

### 2. Connect to Your Droplet
```bash
ssh root@YOUR_DROPLET_IP
```

### 3. Create a Non-Root User
```bash
# Create user
adduser rawrz
usermod -aG sudo rawrz

# Switch to the new user
su - rawrz
```

### 4. Upload Your Application
```bash
# Clone your repository
git clone <your-repo-url>
cd rawrz-security-platform

# Or upload via SCP
scp -r . rawrz@YOUR_DROPLET_IP:/home/rawrz/rawrz-security-platform
```

### 5. Run Deployment Script
```bash
# Make scripts executable
chmod +x deploy.sh quick-deploy.sh

# Run full deployment
./deploy.sh
```

## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Build and start containers
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Manual Docker Commands
```bash
# Build the image
docker build -t rawrz-security-platform .

# Run the container
docker run -d \
  --name rawrz-security \
  -p 3000:3000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  rawrz-security-platform
```

## 🔒 SSL/TLS Configuration

### Option 1: Self-Signed Certificates (Development)
The deployment script automatically creates self-signed certificates.

### Option 2: Let's Encrypt (Production)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🌐 Nginx Configuration

The deployment includes a pre-configured Nginx reverse proxy with:
- SSL/TLS termination
- Rate limiting
- Security headers
- Gzip compression
- Health checks

### Custom Nginx Configuration
Edit `/opt/rawrz-security-platform/nginx.conf` and restart:
```bash
sudo systemctl restart rawrz-security-platform
```

## 📊 Monitoring and Logs

### View Application Logs
```bash
# Docker logs
docker-compose logs -f

# System logs
sudo journalctl -u rawrz-security-platform -f

# Application logs
tail -f /opt/rawrz-security-platform/logs/rawrz.log
```

### Health Checks
```bash
# Check container status
docker-compose ps

# Check application health
curl https://your-domain.com/health

# System status
sudo systemctl status rawrz-security-platform
```

### Monitoring Script
The deployment includes an automated monitoring script that:
- Checks container health
- Monitors disk space
- Monitors memory usage
- Automatically restarts failed containers

## 🔧 Configuration

### Environment Variables
Edit `/opt/rawrz-security-platform/.env`:
```bash
# Application settings
NODE_ENV=production
PORT=3000

# Security settings (CHANGE THESE!)
SECRET_KEY=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here

# File upload settings
MAX_FILE_SIZE=100MB
ALLOWED_EXTENSIONS=.exe,.dll,.txt,.pdf,.zip,.rar,.7z
```

### Firewall Configuration
```bash
# Check firewall status
sudo ufw status

# Allow additional ports if needed
sudo ufw allow 8080/tcp
```

## 🚨 Security Considerations

### 1. Change Default Credentials
- Update all default passwords and secrets in `.env`
- Use strong, unique passwords
- Consider using a password manager

### 2. Firewall Rules
- Only open necessary ports (22, 80, 443)
- Consider using fail2ban for additional protection
- Regularly review and update firewall rules

### 3. SSL/TLS
- Use Let's Encrypt certificates for production
- Enable HSTS headers
- Regularly update certificates

### 4. Updates
- Keep the system updated: `sudo apt update && sudo apt upgrade`
- Regularly update Docker images: `docker-compose pull`
- Monitor security advisories

## 🔄 Backup and Recovery

### Backup Script
```bash
#!/bin/bash
# Create backup
tar -czf rawrz-backup-$(date +%Y%m%d).tar.gz \
  /opt/rawrz-security-platform/uploads \
  /opt/rawrz-security-platform/data \
  /opt/rawrz-security-platform/logs
```

### Recovery
```bash
# Restore from backup
tar -xzf rawrz-backup-YYYYMMDD.tar.gz -C /
```

## 🆘 Troubleshooting

### Common Issues

#### 1. Containers Won't Start
```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Check memory
free -h
```

#### 2. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout

# Regenerate certificates
sudo rm /etc/nginx/ssl/*
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/key.pem \
  -out /etc/nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=RawrZ/CN=your-domain.com"
```

#### 3. Permission Issues
```bash
# Fix ownership
sudo chown -R rawrz:rawrz /opt/rawrz-security-platform

# Fix permissions
chmod +x /opt/rawrz-security-platform/*.sh
```

#### 4. Port Conflicts
```bash
# Check what's using port 80/443
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Stop conflicting services
sudo systemctl stop apache2  # if Apache is running
```

### Getting Help
1. Check the logs first: `docker-compose logs -f`
2. Verify configuration: `docker-compose config`
3. Test connectivity: `curl -I https://your-domain.com`
4. Check system resources: `htop`, `df -h`

## 📈 Performance Optimization

### 1. Resource Limits
Add to `docker-compose.yml`:
```yaml
services:
  rawrz-security:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

### 2. Caching
Enable Redis for caching (optional):
```yaml
services:
  redis:
    image: redis:alpine
    restart: unless-stopped
```

### 3. Load Balancing
For high traffic, consider multiple instances behind a load balancer.

## 🎯 Production Checklist

- [ ] Domain DNS pointing to droplet IP
- [ ] SSL certificates installed and valid
- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] Default passwords changed
- [ ] Monitoring and logging configured
- [ ] Backup strategy implemented
- [ ] Security updates applied
- [ ] Health checks working
- [ ] Performance monitoring active

## 📞 Support

For deployment issues:
1. Check this documentation
2. Review application logs
3. Verify system requirements
4. Test network connectivity
5. Contact support if needed

---

**RawrZ Security Platform v2.0.0** - Enterprise-level security tools deployed on Digital Ocean.