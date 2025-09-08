#!/bin/bash

# DigitalOcean Deployment Script for screenpilot.dev
# RawrZ Security Platform

set -e

echo "🚀 Starting DigitalOcean deployment for screenpilot.dev"
echo "=================================================="

# Configuration
DOMAIN="screenpilot.dev"
APP_NAME="rawrz-security-platform"
DROPLET_IP=""
SSH_KEY_PATH="~/.ssh/id_rsa"

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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v doctl &> /dev/null; then
        print_error "doctl is not installed. Please install it first:"
        echo "https://docs.digitalocean.com/reference/doctl/how-to/install/"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Create DigitalOcean droplet
create_droplet() {
    print_status "Creating DigitalOcean droplet..."
    
    # Create droplet with Docker pre-installed
    doctl compute droplet create $APP_NAME \
        --size s-2vcpu-4gb \
        --image docker-20-04 \
        --region nyc1 \
        --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
        --wait
    
    # Get droplet IP
    DROPLET_IP=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep $APP_NAME | awk '{print $2}')
    
    print_success "Droplet created with IP: $DROPLET_IP"
}

# Setup domain DNS
setup_domain() {
    print_status "Setting up domain DNS for $DOMAIN..."
    
    # Add A record for domain
    doctl compute domain records create $DOMAIN \
        --record-type A \
        --record-name @ \
        --record-data $DROPLET_IP \
        --record-ttl 300
    
    # Add A record for www subdomain
    doctl compute domain records create $DOMAIN \
        --record-type A \
        --record-name www \
        --record-data $DROPLET_IP \
        --record-ttl 300
    
    print_success "DNS records created for $DOMAIN"
}

# Deploy application to droplet
deploy_app() {
    print_status "Deploying application to droplet..."
    
    # Copy files to droplet
    scp -r -o StrictHostKeyChecking=no \
        Dockerfile.prod \
        docker-compose.prod.yml \
        nginx/ \
        env.production.example \
        src/ \
        public/ \
        scripts/ \
        package*.json \
        root@$DROPLET_IP:/root/$APP_NAME/
    
    # SSH into droplet and setup
    ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << EOF
        cd /root/$APP_NAME
        
        # Install additional dependencies
        apt-get update
        apt-get install -y nginx certbot python3-certbot-nginx
        
        # Setup environment
        cp env.production.example .env.production
        
        # Generate SSL certificates
        certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        
        # Build and start application
        docker-compose -f docker-compose.prod.yml up -d --build
        
        # Setup nginx
        cp nginx/nginx.conf /etc/nginx/nginx.conf
        systemctl restart nginx
        systemctl enable nginx
        
        # Setup firewall
        ufw allow 22
        ufw allow 80
        ufw allow 443
        ufw --force enable
        
        # Setup log rotation
        echo "/root/$APP_NAME/logs/*.log {
            daily
            missingok
            rotate 7
            compress
            delaycompress
            notifempty
            create 644 root root
        }" > /etc/logrotate.d/$APP_NAME
EOF
    
    print_success "Application deployed successfully"
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << EOF
        # Install monitoring tools
        apt-get install -y htop iotop nethogs
        
        # Setup log monitoring
        echo "*/5 * * * * /root/$APP_NAME/scripts/monitor-logs.sh" | crontab -
        
        # Setup health checks
        echo "*/1 * * * * curl -f http://localhost/health || systemctl restart docker" | crontab -
EOF
    
    print_success "Monitoring setup completed"
}

# Main deployment function
main() {
    print_status "Starting deployment process..."
    
    check_dependencies
    create_droplet
    setup_domain
    deploy_app
    setup_monitoring
    
    print_success "🎉 Deployment completed successfully!"
    print_status "Your application is now available at: https://$DOMAIN"
    print_status "Droplet IP: $DROPLET_IP"
    print_status "SSH access: ssh root@$DROPLET_IP"
    
    echo ""
    echo "Next steps:"
    echo "1. Update DNS settings if needed"
    echo "2. Configure SSL certificates"
    echo "3. Set up monitoring alerts"
    echo "4. Test the application"
}

# Run main function
main "$@"
