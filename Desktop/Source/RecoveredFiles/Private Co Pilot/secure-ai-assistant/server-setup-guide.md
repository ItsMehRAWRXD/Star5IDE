# Secure DigitalOcean Server Setup Guide

## Overview
This guide will help you set up a secure, private AI API server on DigitalOcean for your business, integrated with your Chrome extension.

## Step 1: DigitalOcean Droplet Setup

### 1.1 Create a New Droplet
1. Log into DigitalOcean dashboard
2. Click "Create" → "Droplets"
3. **Choose Image**: Ubuntu 24.04 LTS
4. **Choose Plan**: Basic plan ($6/month) - can scale later
5. **Choose Region**: Select closest to your users
6. **Authentication**: SSH Key (CRITICAL - never use password)
7. **Hostname**: `your-business-ai-server`
8. Click "Create Droplet"

### 1.2 Initial Server Security
```bash
# Connect to your server
ssh root@YOUR_SERVER_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Create non-root user
adduser yourusername
usermod -aG sudo yourusername

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart ssh

# Setup firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
sudo ufw status
```

## Step 2: Install Required Software

### 2.1 Install Node.js and Dependencies
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install other dependencies
sudo apt install -y nginx certbot python3-certbot-nginx git
```

### 2.2 Setup Project Directory
```bash
# Create project directory
mkdir -p /home/yourusername/ai-server
cd /home/yourusername/ai-server

# Initialize project
npm init -y
```

## Step 3: DigitalOcean Spaces Setup

### 3.1 Create a Space
1. In DigitalOcean dashboard, go to "Spaces"
2. Click "Create a Space"
3. **Name**: `your-business-files`
4. **Region**: Same as your Droplet
5. **File Listing**: Restricted
6. Click "Create a Space"

### 3.2 Generate API Keys
1. Go to "API" in DigitalOcean dashboard
2. Click "Generate New Key"
3. **Name**: `ai-server-spaces-access`
4. **Scopes**: Spaces (Read/Write)
5. Save the Access Key and Secret Key securely

## Step 4: Environment Configuration

### 4.1 Create Environment File
```bash
# Create .env file
nano /home/yourusername/ai-server/.env
```

Add the following content:
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# DigitalOcean Spaces Configuration
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
DO_SPACES_BUCKET=your-business-files
DO_SPACES_ACCESS_KEY=your_spaces_access_key
DO_SPACES_SECRET_KEY=your_spaces_secret_key

# Security
JWT_SECRET=your_super_secure_jwt_secret_here
EXTENSION_ID=your_chrome_extension_id_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4.2 Secure Environment File
```bash
# Set proper permissions
chmod 600 /home/yourusername/ai-server/.env
chown yourusername:yourusername /home/yourusername/ai-server/.env
```

## Step 5: SSL Certificate Setup

### 5.1 Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/ai-server
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.2 Enable Site and Get SSL Certificate
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/ai-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate (if you have a domain)
sudo certbot --nginx -d yourdomain.com
```

## Step 6: Security Hardening

### 6.1 Additional Security Measures
```bash
# Install fail2ban
sudo apt install fail2ban -y

# Configure fail2ban
sudo nano /etc/fail2ban/jail.local
```

Add this configuration:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
```

### 6.2 Setup Log Monitoring
```bash
# Create log directory
mkdir -p /home/yourusername/ai-server/logs

# Setup log rotation
sudo nano /etc/logrotate.d/ai-server
```

Add:
```
/home/yourusername/ai-server/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 yourusername yourusername
}
```

## Step 7: Backup Strategy

### 7.1 Automated Backups
```bash
# Create backup script
nano /home/yourusername/backup-script.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/yourusername/backups"
PROJECT_DIR="/home/yourusername/ai-server"

mkdir -p $BACKUP_DIR

# Backup project files
tar -czf $BACKUP_DIR/ai-server-$DATE.tar.gz -C $PROJECT_DIR .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "ai-server-*.tar.gz" -mtime +7 -delete

echo "Backup completed: ai-server-$DATE.tar.gz"
```

### 7.2 Setup Cron Job
```bash
# Make script executable
chmod +x /home/yourusername/backup-script.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/yourusername/backup-script.sh
```

## Step 8: Monitoring Setup

### 8.1 Install Monitoring Tools
```bash
# Install htop for system monitoring
sudo apt install htop -y

# Install netstat for network monitoring
sudo apt install net-tools -y
```

### 8.2 Create Health Check Script
```bash
# Create health check
nano /home/yourusername/health-check.sh
```

Add:
```bash
#!/bin/bash
# Check if server is running
if ! pgrep -f "node.*server.js" > /dev/null; then
    echo "Server is down! Restarting..."
    cd /home/yourusername/ai-server
    pm2 restart ai-server
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Warning: Disk usage is ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "Warning: Memory usage is ${MEMORY_USAGE}%"
fi
```

## Next Steps
1. Deploy the API server code (see server.js file)
2. Test the server endpoints
3. Update your Chrome extension to communicate with the server
4. Monitor server performance and logs
5. Set up alerts for any issues

## Security Checklist
- [ ] SSH key authentication enabled
- [ ] Root login disabled
- [ ] Firewall configured
- [ ] SSL certificate installed
- [ ] Environment variables secured
- [ ] Fail2ban configured
- [ ] Regular backups scheduled
- [ ] Monitoring in place
- [ ] Log rotation configured
- [ ] Non-root user for application
