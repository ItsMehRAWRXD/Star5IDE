#!/bin/bash

# Backup Script
# Creates a snapshot of your Droplet for disaster recovery

set -e

# Configuration
DROPLET_NAME="${DROPLET_NAME:-forge-droplet}"
SNAPSHOT_PREFIX="${DROPLET_NAME}-backup"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}💾 Droplet Backup Script${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}❌ doctl CLI is not installed${NC}"
    exit 1
fi

# Check if Droplet exists
if ! doctl compute droplet get $DROPLET_NAME &> /dev/null; then
    echo -e "${RED}❌ Droplet not found: $DROPLET_NAME${NC}"
    exit 1
fi

# Get Droplet info
DROPLET_ID=$(doctl compute droplet get $DROPLET_NAME --format ID --no-header)
DROPLET_IP=$(doctl compute droplet get $DROPLET_NAME --format PublicIPv4 --no-header)

echo "Droplet: $DROPLET_NAME (ID: $DROPLET_ID)"
echo "IP: $DROPLET_IP"

# Generate snapshot name
SNAPSHOT_NAME="${SNAPSHOT_PREFIX}-$(date +%Y%m%d-%H%M%S)"

echo -e "${GREEN}📸 Creating snapshot: $SNAPSHOT_NAME${NC}"
echo "This may take a few minutes..."

# Create snapshot
if doctl compute droplet-action snapshot $DROPLET_ID \
    --snapshot-name "$SNAPSHOT_NAME" \
    --wait; then
    
    echo -e "${GREEN}✅ Snapshot created successfully!${NC}"
    
    # List recent snapshots
    echo
    echo -e "${GREEN}📋 Recent snapshots:${NC}"
    doctl compute snapshot list --resource-type droplet \
        | grep "$SNAPSHOT_PREFIX" \
        | head -5
    
    # Check if we should clean old snapshots
    SNAPSHOT_COUNT=$(doctl compute snapshot list --resource-type droplet \
        | grep "$SNAPSHOT_PREFIX" \
        | wc -l)
    
    if [ $SNAPSHOT_COUNT -gt 5 ]; then
        echo
        echo -e "${YELLOW}ℹ️  You have $SNAPSHOT_COUNT snapshots${NC}"
        echo "Consider cleaning old ones to save costs"
        echo "Each snapshot costs ~$0.05/GB/month"
    fi
    
else
    echo -e "${RED}❌ Failed to create snapshot${NC}"
    exit 1
fi

echo
echo -e "${GREEN}💡 Snapshot Tips:${NC}"
echo "• Restore from snapshot: Create new Droplet → Choose snapshot as image"
echo "• List all snapshots: doctl compute snapshot list"
echo "• Delete old snapshot: doctl compute snapshot delete SNAPSHOT_ID"