#!/bin/bash

# DigitalOcean Droplet Deployment Script
# This script automates the creation of a "can't-break-it" Droplet with cloud-init

set -e  # Exit on any error

# Configuration variables
DROPLET_NAME="screenpilot"
REGION="nyc3"
IMAGE="ubuntu-22-04-x64"
SIZE="s-2vcpu-2gb"
TAGS="web,prod,automated"
CLOUDINIT_FILE="do_cloudinit.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if doctl is installed
check_doctl() {
    if ! command -v doctl &> /dev/null; then
        print_error "doctl is not installed. Please install it first:"
        echo "  curl -sL https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz | tar -xzv"
        echo "  sudo mv doctl /usr/local/bin"
        exit 1
    fi
    print_success "doctl is installed"
}

# Check if user is authenticated
check_auth() {
    if ! doctl account get &> /dev/null; then
        print_error "Not authenticated with DigitalOcean. Please run:"
        echo "  doctl auth init"
        exit 1
    fi
    print_success "Authenticated with DigitalOcean"
}

# Check if cloud-init file exists
check_cloudinit() {
    if [ ! -f "$CLOUDINIT_FILE" ]; then
        print_error "Cloud-init file '$CLOUDINIT_FILE' not found!"
        echo "Please make sure the file exists in the current directory."
        exit 1
    fi
    print_success "Cloud-init file found: $CLOUDINIT_FILE"
}

# Get SSH keys
get_ssh_keys() {
    print_status "Retrieving SSH keys..."
    SSH_KEYS=$(doctl compute ssh-key list --no-header --format ID | tr '\n' ',' | sed 's/,$//')
    
    if [ -z "$SSH_KEYS" ]; then
        print_warning "No SSH keys found in DigitalOcean account"
        print_warning "Please add your SSH key to DigitalOcean first:"
        echo "  1. Go to DigitalOcean Dashboard → Settings → Security → SSH Keys"
        echo "  2. Add your public key"
        echo "  3. Or use: doctl compute ssh-key import <name> --public-key-file ~/.ssh/id_ed25519.pub"
        exit 1
    fi
    
    print_success "Found SSH keys: $SSH_KEYS"
}

# Create the droplet
create_droplet() {
    print_status "Creating Droplet '$DROPLET_NAME'..."
    print_status "Region: $REGION"
    print_status "Image: $IMAGE"
    print_status "Size: $SIZE"
    print_status "Tags: $TAGS"
    
    # Create the droplet and capture the output
    DROPLET_OUTPUT=$(doctl compute droplet create "$DROPLET_NAME" \
        --region "$REGION" \
        --image "$IMAGE" \
        --size "$SIZE" \
        --ssh-keys "$SSH_KEYS" \
        --user-data-file "$CLOUDINIT_FILE" \
        --tag-names "$TAGS" \
        --wait \
        --format ID,Name,PublicIPv4,Status)
    
    if [ $? -eq 0 ]; then
        print_success "Droplet created successfully!"
        echo "$DROPLET_OUTPUT"
        
        # Extract the IP address
        DROPLET_IP=$(echo "$DROPLET_OUTPUT" | grep -o '[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}')
        
        if [ -n "$DROPLET_IP" ]; then
            print_success "Droplet IP: $DROPLET_IP"
            echo ""
            print_status "Next steps:"
            echo "  1. Wait 2-3 minutes for cloud-init to complete"
            echo "  2. SSH into your server: ssh rawr@$DROPLET_IP"
            echo "  3. Check setup status: ssh rawr@$DROPLET_IP 'sudo journalctl -u cloud-init-final'"
            echo "  4. Deploy your app: ssh rawr@$DROPLET_IP 'git clone https://github.com/you/your-app.git && cd your-app && pm2 start ecosystem.config.js'"
            echo ""
            print_status "Health check: curl http://$DROPLET_IP/health"
        fi
    else
        print_error "Failed to create Droplet"
        exit 1
    fi
}

# Main execution
main() {
    echo "🚀 DigitalOcean Droplet Deployment Script"
    echo "=========================================="
    echo ""
    
    check_doctl
    check_auth
    check_cloudinit
    get_ssh_keys
    echo ""
    create_droplet
    
    echo ""
    print_success "Deployment complete! 🎉"
}

# Run main function
main "$@"