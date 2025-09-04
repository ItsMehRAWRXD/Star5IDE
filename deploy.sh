#!/bin/bash

# DigitalOcean Droplet Deployment Script
# This script creates a production-ready Droplet with a single command

set -e

# Configuration
DROPLET_NAME="${DROPLET_NAME:-forge-droplet}"
REGION="${REGION:-nyc3}"
SIZE="${SIZE:-s-2vcpu-2gb}"
IMAGE="${IMAGE:-ubuntu-22-04-x64}"
TAGS="${TAGS:-web,prod}"
USER_DATA_FILE="do_cloudinit.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 DigitalOcean Droplet Deployment Script${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}❌ doctl CLI is not installed${NC}"
    echo "Install it from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

# Check if authenticated
if ! doctl auth whoami &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with DigitalOcean${NC}"
    echo "Run: doctl auth init"
    exit 1
fi

# Check if cloud-init file exists
if [ ! -f "$USER_DATA_FILE" ]; then
    echo -e "${RED}❌ Cloud-init file not found: $USER_DATA_FILE${NC}"
    exit 1
fi

# Check if SSH key is configured in the cloud-init file
if grep -q "YOUR_PUBLIC_KEY_HERE" "$USER_DATA_FILE"; then
    echo -e "${YELLOW}⚠️  Warning: You need to add your SSH public key to $USER_DATA_FILE${NC}"
    echo "Generate one with: ssh-keygen -t ed25519 -C 'rawr@screenpilot'"
    echo "Then replace YOUR_PUBLIC_KEY_HERE in the cloud-init file"
    exit 1
fi

# Get all SSH keys from DigitalOcean account
echo -e "${GREEN}📝 Fetching SSH keys from your DigitalOcean account...${NC}"
SSH_KEYS=$(doctl compute ssh-key list --no-header --format ID | tr '\n' ',' | sed 's/,$//')

if [ -z "$SSH_KEYS" ]; then
    echo -e "${YELLOW}⚠️  No SSH keys found in your DigitalOcean account${NC}"
    echo "Add your SSH key at: https://cloud.digitalocean.com/account/security"
    read -p "Continue without account SSH keys? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Display configuration
echo -e "${GREEN}📋 Configuration:${NC}"
echo "  • Name: $DROPLET_NAME"
echo "  • Region: $REGION"
echo "  • Size: $SIZE"
echo "  • Image: $IMAGE"
echo "  • Tags: $TAGS"
echo "  • User Data: $USER_DATA_FILE"
[ -n "$SSH_KEYS" ] && echo "  • SSH Keys: Found $(echo $SSH_KEYS | tr ',' '\n' | wc -l) key(s)"

# Confirmation
read -p "Create Droplet with this configuration? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Create the Droplet
echo -e "${GREEN}🔨 Creating Droplet...${NC}"

DROPLET_CREATE_CMD="doctl compute droplet create $DROPLET_NAME \
  --region $REGION \
  --image $IMAGE \
  --size $SIZE \
  --user-data-file $USER_DATA_FILE \
  --tag-names $TAGS \
  --wait"

# Add SSH keys if available
if [ -n "$SSH_KEYS" ]; then
    DROPLET_CREATE_CMD="$DROPLET_CREATE_CMD --ssh-keys $SSH_KEYS"
fi

# Execute the command
if eval $DROPLET_CREATE_CMD; then
    echo -e "${GREEN}✅ Droplet created successfully!${NC}"
    
    # Get the Droplet IP
    DROPLET_IP=$(doctl compute droplet get $DROPLET_NAME --format PublicIPv4 --no-header)
    
    if [ -n "$DROPLET_IP" ]; then
        echo -e "${GREEN}📍 Droplet IP: $DROPLET_IP${NC}"
        echo
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo -e "${GREEN}🎉 Next Steps:${NC}"
        echo
        echo "1. Update your DNS records to point to: $DROPLET_IP"
        echo "   • A record: @ → $DROPLET_IP"
        echo "   • CNAME record: www → your-domain.com"
        echo
        echo "2. Wait 2-3 minutes for cloud-init to complete setup"
        echo
        echo "3. SSH into your server:"
        echo "   ssh rawr@$DROPLET_IP"
        echo
        echo "4. Deploy your application:"
        echo "   ssh rawr@$DROPLET_IP \"git clone https://github.com/your/repo.git && cd repo && pm2 start\""
        echo
        echo "5. (Optional) Set up SSL with Let's Encrypt:"
        echo "   ssh rawr@$DROPLET_IP"
        echo "   sudo certbot --nginx -d your-domain.com -d www.your-domain.com"
        echo
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Save connection info
        echo "$DROPLET_IP" > .droplet_ip
        echo -e "${GREEN}💾 IP saved to .droplet_ip for convenience${NC}"
    fi
else
    echo -e "${RED}❌ Failed to create Droplet${NC}"
    exit 1
fi