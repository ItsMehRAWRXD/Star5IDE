#!/bin/bash

# Quick Deploy Script
# Deploy your application to the Droplet with a single command

set -e

# Configuration
APP_REPO="${1:-https://github.com/YOUR_USERNAME/YOUR_REPO.git}"
APP_NAME="${2:-screenpilot}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if IP file exists
if [ ! -f ".droplet_ip" ]; then
    echo -e "${RED}❌ No Droplet IP found. Run ./deploy.sh first${NC}"
    exit 1
fi

DROPLET_IP=$(cat .droplet_ip)

echo -e "${GREEN}🚀 Quick Deploy to $DROPLET_IP${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if we can connect
echo -e "${GREEN}🔌 Testing connection...${NC}"
if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no rawr@$DROPLET_IP "echo 'Connected'" &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to server${NC}"
    echo "Make sure:"
    echo "  1. The server is running"
    echo "  2. Your SSH key is configured"
    echo "  3. Cloud-init has completed (wait 2-3 minutes after creation)"
    exit 1
fi

echo -e "${GREEN}✓ Connected successfully${NC}"

# Deploy application
echo -e "${GREEN}📦 Deploying application...${NC}"

ssh -o StrictHostKeyChecking=no rawr@$DROPLET_IP << EOF
    set -e
    
    # Create apps directory
    mkdir -p ~/apps
    cd ~/apps
    
    # Clone or update repository
    if [ -d "$APP_NAME" ]; then
        echo "📥 Updating existing repository..."
        cd $APP_NAME
        git fetch origin
        git reset --hard origin/main || git reset --hard origin/master
    else
        echo "📦 Cloning repository..."
        git clone $APP_REPO $APP_NAME
        cd $APP_NAME
    fi
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
        echo "📦 Installing dependencies..."
        npm ci --production || npm install --production
        
        # Run build if script exists
        if npm run | grep -q "build"; then
            echo "🔨 Building application..."
            npm run build
        fi
    fi
    
    # Check for ecosystem.config.js
    if [ ! -f "ecosystem.config.js" ]; then
        echo "⚙️ Creating default PM2 configuration..."
        cat > ecosystem.config.js << 'PM2CONFIG'
module.exports = {
    apps: [{
        name: '$APP_NAME',
        script: './index.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        }
    }]
};
PM2CONFIG
    fi
    
    # Start or restart with PM2
    echo "🚀 Starting application with PM2..."
    if pm2 list | grep -q "$APP_NAME"; then
        pm2 reload ecosystem.config.js --update-env
    else
        pm2 start ecosystem.config.js
    fi
    
    # Save PM2 configuration
    pm2 save
    
    # Show status
    pm2 status
    
    echo "✅ Deployment complete!"
EOF

echo
echo -e "${GREEN}🎉 Application deployed successfully!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Access your application at:"
echo "  • http://$DROPLET_IP:3000"
echo
echo "Useful commands:"
echo "  • SSH to server: ssh rawr@$DROPLET_IP"
echo "  • View logs: ssh rawr@$DROPLET_IP 'pm2 logs'"
echo "  • Restart app: ssh rawr@$DROPLET_IP 'pm2 restart all'"
echo "  • Monitor: ssh rawr@$DROPLET_IP 'pm2 monit'"