# 🚀 DigitalOcean Droplet One-Shot Deployment

> **"Can't break it" production server setup** - Destroy and rebuild your entire infrastructure in 60 seconds with identical configuration every time.

This repository contains everything you need to deploy a hardened, production-ready DigitalOcean Droplet with Docker, Node.js, PM2, and automatic security updates. The entire setup is **idempotent** - run it as many times as you want, you'll get the same result.

## ✨ Features

- **🔒 Security First**: UFW firewall, Fail2Ban, automatic security updates
- **🐳 Docker Ready**: Pre-installed Docker and Docker Compose
- **📦 Node.js Stack**: Node.js, npm, PM2 for process management
- **🔄 Fully Idempotent**: Destroy and rebuild gets you the exact same server
- **⚡ One Command Deploy**: Single command to create and configure everything
- **🎯 Zero Manual Setup**: Everything configured via cloud-init
- **📝 Infrastructure as Code**: Version control your entire server setup

## 📋 Prerequisites

1. **DigitalOcean Account** with API token
2. **doctl CLI** installed ([Installation Guide](https://docs.digitalocean.com/reference/doctl/how-to/install/))
3. **SSH Key** generated and added to DigitalOcean

## 🚀 Quick Start

### Step 0: Generate SSH Key (if needed)

```bash
# Generate a new SSH key
ssh-keygen -t ed25519 -C "rawr@screenpilot"

# View your public key
cat ~/.ssh/id_ed25519.pub
```

Add this key to:
1. DigitalOcean: **Settings → Security → SSH Keys**
2. The `do_cloudinit.yml` file (replace `YOUR_PUBLIC_KEY_HERE`)

### Step 1: Configure Cloud-Init

Edit `do_cloudinit.yml` and add your SSH public key:

```yaml
ssh_authorized_keys:
  - ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... # Your actual key here
```

### Step 2: Deploy the Droplet

```bash
# Authenticate with DigitalOcean
doctl auth init

# Deploy the Droplet
./deploy.sh
```

That's it! Your server will be ready in ~2-3 minutes.

### Step 3: Deploy Your Application

```bash
# Quick deploy from GitHub
./scripts/quick-deploy.sh https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Or manually
ssh rawr@YOUR_DROPLET_IP "git clone https://github.com/YOUR/REPO.git && cd REPO && pm2 start"
```

## 📁 Project Structure

```
.
├── do_cloudinit.yml          # Cloud-init configuration (THE MAGIC FILE)
├── deploy.sh                 # Main deployment script
├── ecosystem.config.js       # PM2 configuration template
├── scripts/
│   ├── destroy-and-rebuild.sh   # Destroy and recreate Droplet
│   ├── quick-deploy.sh          # Deploy application to Droplet
│   └── setup-ssl.sh             # Configure SSL with Let's Encrypt
└── .github/
    └── workflows/
        └── deploy.yml        # GitHub Actions auto-deployment
```

## 🔧 Configuration

### Cloud-Init Features

The `do_cloudinit.yml` file configures:

- ✅ Non-root user (`rawr`) with sudo access
- ✅ UFW firewall (ports 22, 80, 443, 3000)
- ✅ Fail2Ban for brute-force protection
- ✅ Docker and Docker Compose
- ✅ Node.js and PM2
- ✅ Automatic security updates
- ✅ 2GB swap file
- ✅ Optimized sysctl settings

### Environment Variables

```bash
# Deployment configuration
export DROPLET_NAME="screenpilot"
export REGION="nyc3"
export SIZE="s-2vcpu-2gb"
export TAGS="web,prod"
```

### PM2 Configuration

Edit `ecosystem.config.js` for your application:

```javascript
module.exports = {
  apps: [{
    name: 'app',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster'
  }]
}
```

## 🔄 The "Can't Break It" Workflow

The beauty of this setup is its resilience:

```bash
# Something wrong? Just rebuild!
./scripts/destroy-and-rebuild.sh

# 60 seconds later, you have an identical fresh server
./scripts/quick-deploy.sh https://github.com/YOUR/REPO.git

# Back in business! 🎉
```

## 🌐 DNS Configuration

Point your domain to the Droplet:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| **A** | @ | YOUR_DROPLET_IP | 600 |
| **CNAME** | www | your-domain.com | 600 |

## 🔒 SSL Setup

Enable HTTPS with Let's Encrypt:

```bash
./scripts/setup-ssl.sh your-domain.com your-email@example.com
```

This will:
- Install and configure nginx
- Obtain SSL certificate from Let's Encrypt
- Set up auto-renewal
- Configure security headers

## 🤖 GitHub Actions Deployment

### Setup Secrets

Add these secrets to your GitHub repository:

1. **DROPLET_IP**: Your Droplet's IP address
2. **SSH_PRIVATE_KEY**: Your private SSH key

```bash
# Copy your private key
cat ~/.ssh/id_ed25519
# Add to GitHub: Settings → Secrets → Actions
```

### Auto-Deploy on Push

The included GitHub Actions workflow will:
1. Run tests
2. Build your application
3. Deploy to your Droplet
4. Run health checks

## 📊 Monitoring

### View Logs

```bash
# Application logs
ssh rawr@YOUR_IP "pm2 logs"

# System logs
ssh rawr@YOUR_IP "sudo journalctl -f"

# Nginx logs
ssh rawr@YOUR_IP "sudo tail -f /var/log/nginx/access.log"
```

### Monitor Resources

```bash
# PM2 monitoring
ssh rawr@YOUR_IP "pm2 monit"

# System resources
ssh rawr@YOUR_IP "htop"

# Docker containers
ssh rawr@YOUR_IP "docker ps"
```

## 🛠️ Troubleshooting

### Check Cloud-Init Status

```bash
ssh rawr@YOUR_IP "cloud-init status --wait"
ssh rawr@YOUR_IP "sudo cat /var/log/cloud-init-output.log"
```

### Restart Services

```bash
# Restart application
ssh rawr@YOUR_IP "pm2 restart all"

# Restart nginx
ssh rawr@YOUR_IP "sudo systemctl restart nginx"

# Restart Docker
ssh rawr@YOUR_IP "sudo systemctl restart docker"
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Can't SSH | Wait 2-3 minutes for cloud-init to complete |
| Port 3000 blocked | Check UFW: `sudo ufw status` |
| PM2 not starting | Check logs: `pm2 logs` |
| SSL fails | Ensure DNS is pointed correctly |

## 🚀 Advanced Usage

### Multiple Environments

```bash
# Production
DROPLET_NAME=prod-app REGION=nyc3 ./deploy.sh

# Staging
DROPLET_NAME=staging-app REGION=sfo3 SIZE=s-1vcpu-1gb ./deploy.sh
```

### Custom Droplet Sizes

Available sizes:
- `s-1vcpu-1gb` - $6/month
- `s-2vcpu-2gb` - $18/month (recommended)
- `s-2vcpu-4gb` - $24/month
- `s-4vcpu-8gb` - $48/month

### Adding Services

Edit `do_cloudinit.yml` to add more services:

```yaml
packages:
  - postgresql
  - redis-server
  - elasticsearch

runcmd:
  - systemctl enable --now postgresql
  - systemctl enable --now redis-server
```

## 🔐 Security Best Practices

This setup implements:

1. **Non-root user** with sudo privileges
2. **SSH key-only** authentication
3. **UFW firewall** with minimal open ports
4. **Fail2Ban** to prevent brute-force attacks
5. **Automatic security updates**
6. **Regular system updates** via unattended-upgrades

## 📝 License

MIT - Use this however you want!

## 🤝 Contributing

Found a bug or want to add a feature? PRs welcome!

## 💬 Support

- Create an issue for bugs
- Star the repo if you find it useful
- Fork and customize for your needs

---

## 🎯 One-Liner Deployment Commands

```bash
# First time setup
doctl auth init && ./deploy.sh

# Deploy app
ssh rawr@$(cat .droplet_ip) "git clone YOUR_REPO && cd YOUR_REPO && pm2 start"

# Rebuild everything
./scripts/destroy-and-rebuild.sh

# Setup SSL
./scripts/setup-ssl.sh your-domain.com

# View logs
ssh rawr@$(cat .droplet_ip) "pm2 logs"
```

---

**Remember**: The entire configuration lives in `do_cloudinit.yml`. Edit that file, destroy the Droplet, recreate it, and you're back to an identical setup. No manual configuration needed, ever! 🚀

Built with ❤️ for developers who value simplicity and reliability.