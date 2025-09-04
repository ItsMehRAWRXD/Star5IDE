#!/bin/bash

# Destroy and Rebuild Droplet Script
# This script destroys the existing Droplet and creates a new one with the same configuration

set -e

# Configuration
DROPLET_NAME="${DROPLET_NAME:-screenpilot}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  Destroy and Rebuild Droplet${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}❌ doctl CLI is not installed${NC}"
    exit 1
fi

# Check if Droplet exists
if doctl compute droplet get $DROPLET_NAME &> /dev/null; then
    echo -e "${GREEN}✓ Found existing Droplet: $DROPLET_NAME${NC}"
    
    # Get current IP for reference
    OLD_IP=$(doctl compute droplet get $DROPLET_NAME --format PublicIPv4 --no-header)
    echo "  Current IP: $OLD_IP"
    
    # Confirmation
    echo -e "${YELLOW}⚠️  This will DESTROY the Droplet and all its data!${NC}"
    read -p "Are you sure you want to continue? Type 'yes' to confirm: " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        echo "Operation cancelled"
        exit 0
    fi
    
    # Optional: Create snapshot before destroying
    read -p "Create a snapshot before destroying? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}📸 Creating snapshot...${NC}"
        SNAPSHOT_NAME="${DROPLET_NAME}-$(date +%Y%m%d-%H%M%S)"
        doctl compute droplet-action snapshot $DROPLET_NAME --snapshot-name $SNAPSHOT_NAME --wait
        echo -e "${GREEN}✓ Snapshot created: $SNAPSHOT_NAME${NC}"
    fi
    
    # Destroy the Droplet
    echo -e "${RED}🗑️  Destroying Droplet...${NC}"
    doctl compute droplet delete $DROPLET_NAME --force
    echo -e "${GREEN}✓ Droplet destroyed${NC}"
    
    # Wait a moment
    sleep 2
else
    echo -e "${YELLOW}ℹ️  No existing Droplet found${NC}"
fi

# Create new Droplet
echo -e "${GREEN}🔨 Creating new Droplet...${NC}"
cd "$(dirname "$0")/.."
./deploy.sh

echo -e "${GREEN}✅ Rebuild complete!${NC}"