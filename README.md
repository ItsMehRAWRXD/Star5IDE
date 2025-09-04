# 🏁 DigitalOcean "Can't-Break-It" Droplet Setup

A complete, production-ready DigitalOcean Droplet configuration that hardens the server, installs Docker + Node.js + PM2, sets up security, and provides a bulletproof deployment process.

## 🚀 Quick Start

### Prerequisites

1. **DigitalOcean Account** with API token
2. **SSH Key** added to DigitalOcean
3. **doctl CLI** installed and authenticated

### One-Command Deployment

```bash
# Make the script executable and run it
chmod +x deploy-droplet.sh
./deploy-droplet.sh
```

That's it! Your Droplet will be created and configured automatically.

## 📋 What Gets Installed & Configured

### 🔒 Security Hardening
- **UFW Firewall** - Only allows SSH (22), HTTP (80), HTTPS (443)
- **Fail2Ban** - Intrusion prevention with SSH protection
- **Non-root user** (`rawr`) with sudo access
- **SSH key authentication** (password auth disabled)

### 🐳 Container Runtime
- **Docker** - Latest stable version
- **Docker Compose** - Multi-container orchestration
- **Docker daemon** configured with log rotation

### 🟢 Node.js Stack
- **Node.js** - Latest LTS version
- **npm** - Package manager
- **PM2** - Process manager with clustering
- **nodemon** - Development tool
- **yarn** - Alternative package manager

### 🌐 Web Server
- **Nginx** - Reverse proxy and static file serving
- **Certbot** - SSL certificate automation
- **Health check endpoint** at `/health`

### 📊 Monitoring & Logging
- **PM2 log rotation** - Prevents disk space issues
- **System monitoring** with htop
- **Centralized logging** in `/home/rawr/logs/`

## 📁 File Structure

```
/workspace/
├── do_cloudinit.yml          # Cloud-init configuration
├── deploy-droplet.sh         # Automated deployment script
├── ecosystem.config.js       # PM2 configuration
├── package.json              # Node.js dependencies
├── app.js                    # Sample Express.js application
├── terraform/                # Infrastructure as Code (optional)
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── README.md                 # This file
```

## 🔧 Manual Setup (Alternative)

If you prefer manual setup or want to customize the configuration:

### 1. Generate SSH Key (if needed)

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
cat ~/.ssh/id_ed25519.pub
```

### 2. Add SSH Key to DigitalOcean

```bash
doctl compute ssh-key import my-key --public-key-file ~/.ssh/id_ed25519.pub
```

### 3. Update Cloud-Init Configuration

Edit `do_cloudinit.yml` and replace the SSH key:

```yaml
ssh_authorized_keys:
  - ssh-ed25519 AAAA...YOUR_ACTUAL_PUBLIC_KEY_HERE...
```

### 4. Create Droplet

```bash
doctl compute droplet create screenpilot \
  --region nyc3 \
  --image ubuntu-22-04-x64 \
  --size s-2vcpu-2gb \
  --ssh-keys $(doctl compute ssh-key list --no-header --format ID | tr '\n' ',') \
  --user-data-file do_cloudinit.yml \
  --tag-names web,prod \
  --wait
```

## 🌐 DNS Configuration

After your Droplet is created, configure your DNS:

| Type      | Host          | Value (your Droplet IP) | TTL |
| --------- | ------------- | ----------------------- | --- |
| **A**     | *blank* (`@`) | `YOUR_DROPLET_IP`       | 600 |
| **CNAME** | `www`         | `yourdomain.com`        | 600 |

## 🚀 Deploy Your Application

### Option 1: Direct SSH Deployment

```bash
# SSH into your server
ssh rawr@YOUR_DROPLET_IP

# Clone your repository
git clone https://github.com/yourusername/your-app.git
cd your-app

# Install dependencies
npm install

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### Option 2: PM2 Deployment

Configure the `deploy` section in `ecosystem.config.js`:

```javascript
deploy: {
  production: {
    user: 'rawr',
    host: 'YOUR_DROPLET_IP',
    ref: 'origin/main',
    repo: 'https://github.com/yourusername/your-repo.git',
    path: '/home/rawr/apps/production',
    'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
  }
}
```

Then deploy:

```bash
pm2 deploy ecosystem.config.js production
```

## 🔄 Disaster Recovery

If something goes wrong, recovery is simple:

1. **Destroy the Droplet** in DigitalOcean dashboard
2. **Re-run the deployment script**: `./deploy-droplet.sh`
3. **Deploy your code again**

The entire configuration is in the cloud-init file, so you get an identical environment every time.

## 🛠️ Customization

### Adding More Packages

Edit `do_cloudinit.yml` and add to the `packages` section:

```yaml
packages:
  - ufw
  - fail2ban
  - git
  - curl
  - nodejs
  - npm
  - docker.io
  - mysql-server        # Add MySQL
  - redis-server        # Add Redis
  - postgresql          # Add PostgreSQL
```

### Adding Custom Commands

Add to the `runcmd` section:

```yaml
runcmd:
  - ufw allow OpenSSH
  - ufw allow 80
  - ufw allow 443
  - ufw --force enable
  - systemctl enable --now docker
  - npm install -g pm2
  - # Your custom commands here
  - echo "Custom setup complete" | systemd-cat -t cloud-init
```

### Environment Variables

Create a `.env` file on your server:

```bash
# SSH into your server
ssh rawr@YOUR_DROPLET_IP

# Create environment file
cat > /home/rawr/apps/your-app/.env << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
EOF
```

## 📊 Monitoring & Maintenance

### PM2 Commands

```bash
# View running processes
pm2 list

# View logs
pm2 logs

# Monitor resources
pm2 monit

# Restart application
pm2 restart ecosystem.config.js

# Reload application (zero-downtime)
pm2 reload ecosystem.config.js

# Stop application
pm2 stop ecosystem.config.js
```

### System Monitoring

```bash
# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check running services
systemctl status docker
systemctl status fail2ban
systemctl status nginx
```

### Log Files

```bash
# PM2 logs
tail -f /home/rawr/logs/combined.log

# System logs
sudo journalctl -u cloud-init-final
sudo journalctl -u docker
sudo journalctl -u fail2ban
```

## 🔐 Security Best Practices

### SSH Security

- SSH keys are required (password authentication disabled)
- Fail2Ban protects against brute force attacks
- UFW firewall blocks unnecessary ports

### Application Security

- Helmet.js for security headers
- CORS properly configured
- Environment variables for secrets
- Regular security updates via `package_update: true`

### Server Hardening

- Non-root user with sudo access
- Firewall configured (UFW)
- Intrusion detection (Fail2Ban)
- Log rotation to prevent disk space issues

## 🆘 Troubleshooting

### Common Issues

**SSH Connection Refused**
```bash
# Check if cloud-init is still running
ssh rawr@YOUR_DROPLET_IP 'sudo journalctl -u cloud-init-final'

# Wait 2-3 minutes for setup to complete
```

**PM2 Not Starting**
```bash
# Check PM2 logs
pm2 logs

# Check if Node.js is installed
node --version
npm --version
```

**Port Already in Use**
```bash
# Check what's using the port
sudo netstat -tlnp | grep :3000

# Kill the process
sudo kill -9 PID
```

**Docker Permission Denied**
```bash
# Add user to docker group
sudo usermod -aG docker rawr

# Log out and back in
exit
ssh rawr@YOUR_DROPLET_IP
```

### Getting Help

1. Check the logs: `sudo journalctl -u cloud-init-final`
2. Verify services: `systemctl status docker fail2ban nginx`
3. Check PM2: `pm2 logs` and `pm2 list`
4. Review firewall: `sudo ufw status`

## 🎯 Next Steps

1. **Set up SSL certificates** with Certbot
2. **Configure Nginx** as a reverse proxy
3. **Set up monitoring** with tools like New Relic or DataDog
4. **Implement CI/CD** with GitHub Actions
5. **Add database backups** and disaster recovery
6. **Set up log aggregation** with ELK stack

## 📚 Additional Resources

- [DigitalOcean Cloud-Init Documentation](https://docs.digitalocean.com/products/droplets/how-to/provide-user-data/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [UFW Firewall Guide](https://help.ubuntu.com/community/UFW)
- [Fail2Ban Documentation](https://www.fail2ban.org/wiki/index.php/Main_Page)

---

**Happy Deploying! 🚀**

This setup gives you a production-ready server that's secure, scalable, and easy to rebuild. The "can't-break-it" philosophy means you can always start fresh with the same configuration.