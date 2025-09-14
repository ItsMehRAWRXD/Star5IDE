#!/bin/bash

# RawrZ Security Platform - DigitalOcean Deployment Script
# This script sets up a DigitalOcean Droplet with Docker and deploys the RawrZ Security Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DROPLET_NAME="rawrz-security-platform"
DROPLET_SIZE="s-1vcpu-1gb"  # 1GB RAM, 1 vCPU
DROPLET_REGION="nyc1"       # New York 1
DROPLET_IMAGE="docker-20-04" # Ubuntu 20.04 with Docker pre-installed
SSH_KEY_NAME="rawrz-deploy-key"

echo -e "${BLUE}🚀 RawrZ Security Platform - DigitalOcean Deployment${NC}"
echo -e "${BLUE}===================================================${NC}"

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}❌ doctl (DigitalOcean CLI) is not installed.${NC}"
    echo -e "${YELLOW}Please install doctl first:${NC}"
    echo "  curl -sL https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz | tar -xzv"
    echo "  sudo mv doctl /usr/local/bin"
    echo "  doctl auth init"
    exit 1
fi

# Check if user is authenticated
if ! doctl account get &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with DigitalOcean.${NC}"
    echo -e "${YELLOW}Please run: doctl auth init${NC}"
    exit 1
fi

echo -e "${GREEN}✅ DigitalOcean CLI authenticated${NC}"

# Create SSH key if it doesn't exist
if ! doctl compute ssh-key list | grep -q "$SSH_KEY_NAME"; then
    echo -e "${YELLOW}🔑 Creating SSH key...${NC}"
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/rawrz_deploy_key -N "" -C "rawrz-deploy"
    doctl compute ssh-key create "$SSH_KEY_NAME" --public-key-file ~/.ssh/rawrz_deploy_key.pub
    echo -e "${GREEN}✅ SSH key created${NC}"
else
    echo -e "${GREEN}✅ SSH key already exists${NC}"
fi

# Get SSH key ID
SSH_KEY_ID=$(doctl compute ssh-key list --format ID,Name --no-header | grep "$SSH_KEY_NAME" | awk '{print $1}')

# Create droplet
echo -e "${YELLOW}🖥️  Creating DigitalOcean Droplet...${NC}"
DROPLET_ID=$(doctl compute droplet create "$DROPLET_NAME" \
    --size "$DROPLET_SIZE" \
    --image "$DROPLET_IMAGE" \
    --region "$DROPLET_REGION" \
    --ssh-keys "$SSH_KEY_ID" \
    --wait \
    --format ID --no-header)

echo -e "${GREEN}✅ Droplet created with ID: $DROPLET_ID${NC}"

# Get droplet IP
DROPLET_IP=$(doctl compute droplet get "$DROPLET_ID" --format PublicIPv4 --no-header)
echo -e "${GREEN}✅ Droplet IP: $DROPLET_IP${NC}"

# Wait for droplet to be ready
echo -e "${YELLOW}⏳ Waiting for droplet to be ready...${NC}"
sleep 30

# Test SSH connection
echo -e "${YELLOW}🔐 Testing SSH connection...${NC}"
for i in {1..10}; do
    if ssh -i ~/.ssh/rawrz_deploy_key -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@"$DROPLET_IP" "echo 'SSH connection successful'" &> /dev/null; then
        echo -e "${GREEN}✅ SSH connection established${NC}"
        break
    fi
    echo -e "${YELLOW}⏳ Attempt $i/10 - Waiting for SSH...${NC}"
    sleep 10
done

# Deploy application
echo -e "${YELLOW}📦 Deploying RawrZ Security Platform...${NC}"

# Create deployment script for the droplet
cat > /tmp/deploy-app.sh << 'EOF'
#!/bin/bash
set -e

# Update system
apt-get update
apt-get upgrade -y

# Install additional tools
apt-get install -y git curl wget

# Create application directory
mkdir -p /opt/rawrz-security
cd /opt/rawrz-security

# Clone repository (replace with your actual repository URL)
# git clone https://github.com/yourusername/rawrz-security-platform.git .

# For now, we'll create a simple setup
echo "RawrZ Security Platform deployment directory created"
echo "Please upload your application files to /opt/rawrz-security/"

# Create necessary directories
mkdir -p data logs uploads downloads

# Set permissions
chown -R root:root /opt/rawrz-security
chmod -R 755 /opt/rawrz-security

echo "✅ RawrZ Security Platform deployment directory ready"
EOF

# Copy and execute deployment script
scp -i ~/.ssh/rawrz_deploy_key /tmp/deploy-app.sh root@"$DROPLET_IP":/tmp/
ssh -i ~/.ssh/rawrz_deploy_key root@"$DROPLET_IP" "chmod +x /tmp/deploy-app.sh && /tmp/deploy-app.sh"

# Create systemd service
cat > /tmp/rawrz.service << 'EOF'
[Unit]
Description=RawrZ Security Platform
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/rawrz-security
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# Install systemd service
scp -i ~/.ssh/rawrz_deploy_key /tmp/rawrz.service root@"$DROPLET_IP":/etc/systemd/system/
ssh -i ~/.ssh/rawrz_deploy_key root@"$DROPLET_IP" "systemctl daemon-reload && systemctl enable rawrz.service"

echo -e "${GREEN}✅ RawrZ Security Platform deployed successfully!${NC}"
echo -e "${BLUE}===================================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${BLUE}===================================================${NC}"
echo -e "${YELLOW}Droplet Details:${NC}"
echo -e "  Name: $DROPLET_NAME"
echo -e "  ID: $DROPLET_ID"
echo -e "  IP: $DROPLET_IP"
echo -e "  Size: $DROPLET_SIZE"
echo -e "  Region: $DROPLET_REGION"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Upload your application files to the droplet:"
echo -e "   scp -i ~/.ssh/rawrz_deploy_key -r . root@$DROPLET_IP:/opt/rawrz-security/"
echo ""
echo -e "2. SSH into the droplet:"
echo -e "   ssh -i ~/.ssh/rawrz_deploy_key root@$DROPLET_IP"
echo ""
echo -e "3. Start the application:"
echo -e "   cd /opt/rawrz-security"
echo -e "   docker-compose up -d"
echo ""
echo -e "4. Check application status:"
echo -e "   docker-compose ps"
echo -e "   docker-compose logs -f"
echo ""
echo -e "${GREEN}🔗 Access your application at: http://$DROPLET_IP${NC}"

# Clean up temporary files
rm -f /tmp/deploy-app.sh /tmp/rawrz.service

echo -e "${BLUE}===================================================${NC}"
echo -e "${GREEN}✅ Deployment script completed successfully!${NC}"