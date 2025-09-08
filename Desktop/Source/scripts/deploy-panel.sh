#!/bin/bash

# Deploy RawrZ Security Platform as Panel to lionfish-app
# https://lionfish-app-ey7kn.ondigitalocean.app/panel

set -e

echo "🚀 Deploying RawrZ Security Platform as Panel"
echo "=============================================="
echo "Target: https://lionfish-app-ey7kn.ondigitalocean.app/panel"
echo ""

# Configuration
DOMAIN="lionfish-app-ey7kn.ondigitalocean.app"
PANEL_PATH="/panel"
APP_NAME="rawrz-security-panel"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get server IP from user
read -p "Enter your DigitalOcean droplet IP: " SERVER_IP
read -p "Enter SSH username (default: root): " SSH_USER
SSH_USER=${SSH_USER:-root}

print_status "Deploying to: $SSH_USER@$SERVER_IP"
print_status "Panel will be available at: https://$DOMAIN$PANEL_PATH"

# Test connection
print_status "Testing connection to server..."
if ! ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "echo 'Connection successful'" > /dev/null 2>&1; then
    print_error "Failed to connect to server. Please check your IP and SSH key."
    exit 1
fi
print_success "Connection successful"

# Create deployment directory
print_status "Creating deployment directory..."
ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "mkdir -p /root/$APP_NAME"

# Copy files
print_status "Copying application files..."
scp -r -o StrictHostKeyChecking=no \
    Dockerfile.prod \
    docker-compose.panel.yml \
    nginx/panel-nginx.conf \
    env.panel.example \
    src/ \
    public/ \
    scripts/ \
    package*.json \
    "$SSH_USER@$SERVER_IP:/root/$APP_NAME/"

# Deploy on server
print_status "Deploying application on server..."
ssh -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" << EOF
    cd /root/$APP_NAME
    
    # Install dependencies
    apt-get update
    apt-get install -y nginx docker.io docker-compose
    
    # Setup environment
    cp env.panel.example .env.production
    
    # Build and start application
    docker-compose -f docker-compose.panel.yml up -d --build
    
    # Setup nginx
    cp nginx/panel-nginx.conf /etc/nginx/sites-available/rawrz-panel
    ln -sf /etc/nginx/sites-available/rawrz-panel /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx config
    nginx -t
    
    # Restart nginx
    systemctl restart nginx
    systemctl enable nginx
    
    # Setup firewall
    ufw allow 22
    ufw allow 80
    ufw allow 443
    ufw --force enable
    
    echo "✅ Panel deployment completed"
EOF

print_success "🎉 RawrZ Security Platform deployed as panel!"
print_status "Panel URL: https://$DOMAIN$PANEL_PATH"
print_status "Health Check: https://$DOMAIN$PANEL_PATH/health"
print_status "SSH Access: ssh $SSH_USER@$SERVER_IP"

echo ""
echo "Next steps:"
echo "1. Wait 2-3 minutes for the application to fully start"
echo "2. Visit: https://$DOMAIN$PANEL_PATH"
echo "3. Check logs: ssh $SSH_USER@$SERVER_IP 'cd /root/$APP_NAME && docker-compose -f docker-compose.panel.yml logs -f'"
echo "4. Monitor health: curl https://$DOMAIN$PANEL_PATH/health"
