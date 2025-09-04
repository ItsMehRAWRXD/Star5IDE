#!/bin/bash

# SSL Setup Script with Let's Encrypt
# Sets up HTTPS for your domain using Certbot

set -e

# Configuration
DOMAIN="${1}"
EMAIL="${2}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔒 SSL Setup with Let's Encrypt${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check parameters
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Usage: $0 <domain> [email]${NC}"
    echo "Example: $0 screenpilot.dev admin@screenpilot.dev"
    exit 1
fi

# Check if IP file exists
if [ ! -f ".droplet_ip" ]; then
    echo -e "${RED}❌ No Droplet IP found. Run ./deploy.sh first${NC}"
    exit 1
fi

DROPLET_IP=$(cat .droplet_ip)

echo "Domain: $DOMAIN"
echo "Server IP: $DROPLET_IP"
[ -n "$EMAIL" ] && echo "Email: $EMAIL"

# Check DNS
echo -e "${GREEN}🔍 Checking DNS configuration...${NC}"
DNS_IP=$(dig +short $DOMAIN | head -n1)

if [ "$DNS_IP" != "$DROPLET_IP" ]; then
    echo -e "${YELLOW}⚠️  DNS not properly configured${NC}"
    echo "Current DNS points to: $DNS_IP"
    echo "Should point to: $DROPLET_IP"
    echo
    echo "Please update your DNS records:"
    echo "  • A record: @ → $DROPLET_IP"
    echo "  • CNAME record: www → $DOMAIN"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ DNS properly configured${NC}"
fi

# Setup SSL on server
echo -e "${GREEN}🔐 Setting up SSL on server...${NC}"

ssh -o StrictHostKeyChecking=no rawr@$DROPLET_IP << EOF
    set -e
    
    # Install nginx if not installed
    if ! command -v nginx &> /dev/null; then
        echo "📦 Installing nginx..."
        sudo apt-get update
        sudo apt-get install -y nginx
        sudo systemctl enable nginx
        sudo systemctl start nginx
    fi
    
    # Create nginx configuration
    echo "⚙️ Configuring nginx..."
    sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << 'NGINX'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_cache_bypass \\\$http_upgrade;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
NGINX
    
    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl reload nginx
    
    # Setup SSL with Certbot
    echo "🔐 Setting up SSL certificate..."
    CERTBOT_ARGS="--nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --redirect"
    
    if [ -n "$EMAIL" ]; then
        sudo certbot \$CERTBOT_ARGS --email $EMAIL
    else
        sudo certbot \$CERTBOT_ARGS --register-unsafely-without-email
    fi
    
    # Setup auto-renewal
    echo "⏰ Setting up auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 0,12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    echo "✅ SSL setup complete!"
EOF

echo
echo -e "${GREEN}🎉 SSL Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Your site is now available at:"
echo "  • https://$DOMAIN"
echo "  • https://www.$DOMAIN"
echo
echo "Certificate will auto-renew every 60 days"
echo
echo "Test your SSL configuration at:"
echo "  • https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"