#!/bin/bash

# Deploy Star5IDE to DigitalOcean Droplet
# Repository: https://github.com/ItsMehRAWRXD/Star5IDE/tree/cursor/fetch-all-uncensored-apis-2a77

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🌟 Star5IDE Deployment to DigitalOcean${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Configuration
REPO_URL="https://github.com/ItsMehRAWRXD/Star5IDE.git"
BRANCH="cursor/fetch-all-uncensored-apis-2a77"
APP_NAME="star5ide"
APP_PATH="/home/rawr/apps/${APP_NAME}"

# Check if IP file exists
if [ ! -f ".droplet_ip" ]; then
    echo -e "${YELLOW}⚠️  No Droplet IP found. Creating new Droplet...${NC}"
    ./deploy.sh
    sleep 60  # Wait for cloud-init to complete
fi

DROPLET_IP=$(cat .droplet_ip)

echo -e "${GREEN}📍 Deploying to: $DROPLET_IP${NC}"

# Deploy Star5IDE
echo -e "${BLUE}🚀 Deploying Star5IDE...${NC}"

ssh -o StrictHostKeyChecking=no rawr@$DROPLET_IP << 'DEPLOY'
set -e

# Colors for remote output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

APP_NAME="star5ide"
APP_PATH="/home/rawr/apps/${APP_NAME}"
REPO_URL="https://github.com/ItsMehRAWRXD/Star5IDE.git"
BRANCH="cursor/fetch-all-uncensored-apis-2a77"

echo -e "${BLUE}📦 Setting up Star5IDE...${NC}"

# Create apps directory
mkdir -p ~/apps
cd ~/apps

# Clone or update repository
if [ -d "$APP_NAME" ]; then
    echo -e "${YELLOW}📥 Updating existing repository...${NC}"
    cd $APP_NAME
    git fetch origin
    git checkout $BRANCH
    git reset --hard origin/$BRANCH
else
    echo -e "${GREEN}📦 Cloning Star5IDE repository...${NC}"
    git clone -b $BRANCH $REPO_URL $APP_NAME
    cd $APP_NAME
fi

echo -e "${BLUE}📋 Repository structure:${NC}"
ls -la

# Check for package.json
if [ -f "package.json" ]; then
    echo -e "${GREEN}📦 Installing Node.js dependencies...${NC}"
    npm ci --production 2>/dev/null || npm install --production
    
    # Check for build script
    if npm run | grep -q "build"; then
        echo -e "${BLUE}🔨 Building application...${NC}"
        npm run build
    fi
    
    # Check for start script
    if npm run | grep -q "start"; then
        START_SCRIPT="npm start"
    else
        # Look for common entry points
        if [ -f "index.js" ]; then
            START_SCRIPT="node index.js"
        elif [ -f "server.js" ]; then
            START_SCRIPT="node server.js"
        elif [ -f "app.js" ]; then
            START_SCRIPT="node app.js"
        else
            START_SCRIPT="node ."
        fi
    fi
fi

# Check for Python requirements
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}🐍 Installing Python dependencies...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    
    # Look for Python entry points
    if [ -f "main.py" ]; then
        START_SCRIPT="python3 main.py"
    elif [ -f "app.py" ]; then
        START_SCRIPT="python3 app.py"
    elif [ -f "server.py" ]; then
        START_SCRIPT="python3 server.py"
    fi
fi

# Check for Docker
if [ -f "Dockerfile" ]; then
    echo -e "${GREEN}🐳 Building Docker image...${NC}"
    sudo docker build -t $APP_NAME .
    
    if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
        echo -e "${BLUE}🐳 Starting with Docker Compose...${NC}"
        sudo docker-compose up -d
    else
        echo -e "${BLUE}🐳 Starting Docker container...${NC}"
        sudo docker run -d \
            --name $APP_NAME \
            --restart unless-stopped \
            -p 3000:3000 \
            -p 8080:8080 \
            $APP_NAME
    fi
    
    echo -e "${GREEN}✅ Docker container started!${NC}"
    sudo docker ps
else
    # Use PM2 for Node.js apps
    if [ -f "package.json" ]; then
        echo -e "${BLUE}🚀 Creating PM2 configuration...${NC}"
        
        # Create PM2 ecosystem file if it doesn't exist
        if [ ! -f "ecosystem.config.js" ]; then
            cat > ecosystem.config.js << 'PM2CONFIG'
module.exports = {
    apps: [{
        name: 'star5ide',
        script: './index.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'production',
            PORT: process.env.PORT || 3000
        },
        error_file: './logs/error.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true,
        max_memory_restart: '500M'
    }]
};
PM2CONFIG
        fi
        
        echo -e "${GREEN}🚀 Starting with PM2...${NC}"
        pm2 stop star5ide 2>/dev/null || true
        pm2 delete star5ide 2>/dev/null || true
        pm2 start ecosystem.config.js
        pm2 save
        
        echo -e "${GREEN}✅ Application started with PM2!${NC}"
        pm2 status
    fi
fi

# Check what ports are being used
echo -e "${BLUE}🔌 Active ports:${NC}"
sudo netstat -tlnp | grep -E ':(3000|8080|8000|5000|4000)'

echo -e "${GREEN}✅ Star5IDE deployment complete!${NC}"
DEPLOY

# Health check
echo
echo -e "${BLUE}🏥 Running health check...${NC}"

# Wait for application to start
sleep 5

# Check common ports
for PORT in 3000 8080 8000 5000 4000; do
    if curl -s -o /dev/null -w "%{http_code}" http://$DROPLET_IP:$PORT 2>/dev/null | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✅ Application responding on port $PORT${NC}"
        APP_URL="http://$DROPLET_IP:$PORT"
        break
    fi
done

# Final summary
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Star5IDE Deployment Complete!${NC}"
echo
echo "Repository: $REPO_URL"
echo "Branch: $BRANCH"
echo "Server IP: $DROPLET_IP"
[ -n "$APP_URL" ] && echo "Application URL: $APP_URL"
echo
echo "SSH Access: ssh rawr@$DROPLET_IP"
echo "View logs: ssh rawr@$DROPLET_IP 'pm2 logs'"
echo "Monitor: ssh rawr@$DROPLET_IP 'pm2 monit'"
echo
echo -e "${YELLOW}📝 Note: If the app requires specific environment variables or configuration,${NC}"
echo -e "${YELLOW}    you may need to set them up manually.${NC}"