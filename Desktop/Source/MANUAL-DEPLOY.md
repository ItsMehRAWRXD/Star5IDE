# Manual Deployment Guide for screenpilot.dev

Since automated scripts are freezing, here's a step-by-step manual deployment guide:

## Step 1: Get Your Server Information

1. **Find your droplet IP:**
   ```bash
   doctl compute droplet list
   ```

2. **Note down:**
   - Server IP address
   - SSH username (usually `root`)

## Step 2: Copy Files to Server

Run these commands one by one (replace `YOUR_SERVER_IP` with your actual IP):

```bash
# Copy main files
scp Dockerfile.prod root@YOUR_SERVER_IP:/root/rawrz-security-platform/
scp docker-compose.prod.yml root@YOUR_SERVER_IP:/root/rawrz-security-platform/
scp env.production.example root@YOUR_SERVER_IP:/root/rawrz-security-platform/

# Copy directories
scp -r nginx/ root@YOUR_SERVER_IP:/root/rawrz-security-platform/
scp -r src/ root@YOUR_SERVER_IP:/root/rawrz-security-platform/
scp -r public/ root@YOUR_SERVER_IP:/root/rawrz-security-platform/
scp -r scripts/ root@YOUR_SERVER_IP:/root/rawrz-security-platform/

# Copy package files
scp package*.json root@YOUR_SERVER_IP:/root/rawrz-security-platform/
```

## Step 3: SSH into Server and Setup

```bash
ssh root@YOUR_SERVER_IP
```

Once connected, run these commands:

```bash
# Navigate to app directory
cd /root/rawrz-security-platform

# Update system
apt-get update

# Install dependencies
apt-get install -y nginx certbot python3-certbot-nginx

# Setup environment
cp env.production.example .env.production

# Build and start application
docker-compose -f docker-compose.prod.yml up -d --build

# Setup nginx
cp nginx/nginx.conf /etc/nginx/nginx.conf
systemctl restart nginx
systemctl enable nginx

# Generate SSL certificates
certbot --nginx -d screenpilot.dev -d www.screenpilot.dev --non-interactive --agree-tos --email admin@screenpilot.dev

# Setup firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable
```

## Step 4: Configure DNS

In your domain registrar (where you bought screenpilot.dev):

1. Add A record: `@` → `YOUR_SERVER_IP`
2. Add A record: `www` → `YOUR_SERVER_IP`
3. Set TTL to 300 seconds

## Step 5: Test Deployment

1. Wait 5-10 minutes for DNS propagation
2. Visit: https://screenpilot.dev
3. Check health: https://screenpilot.dev/health

## Troubleshooting

### If SSL fails:
```bash
certbot --nginx -d screenpilot.dev -d www.screenpilot.dev --non-interactive --agree-tos --email admin@screenpilot.dev --force-renewal
```

### If app won't start:
```bash
docker-compose -f docker-compose.prod.yml logs
```

### If nginx fails:
```bash
systemctl status nginx
tail -f /var/log/nginx/error.log
```

### Check if everything is running:
```bash
docker ps
systemctl status nginx
```

## Quick Commands Reference

```bash
# Restart app
docker-compose -f docker-compose.prod.yml restart

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Update app
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build

# Check status
curl -f https://screenpilot.dev/health
```

## What You'll Have After Deployment

- ✅ RawrZ Security Platform running on https://screenpilot.dev
- ✅ SSL certificates (Let's Encrypt)
- ✅ Nginx reverse proxy
- ✅ Docker containerization
- ✅ Health monitoring
- ✅ Firewall protection

Your RawrZ Security Platform will be live at: **https://screenpilot.dev** 🚀
