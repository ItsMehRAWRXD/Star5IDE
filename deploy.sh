#!/bin/bash

# RawrZ Security Platform - DigitalOcean Deployment Script
# This script automates the deployment process on a DigitalOcean droplet

set -e

echo "🚀 RawrZ Security Platform - DigitalOcean Deployment"
echo "=================================================="

# Configuration
APP_NAME="rawrz-security"
APP_DIR="/opt/rawrz-security"
SERVICE_USER="rawrz"
DOMAIN="${DOMAIN:-your-domain.com}"
EMAIL="${EMAIL:-admin@your-domain.com}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_status "Starting deployment process..."

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y \
    curl \
    wget \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban \
    htop \
    unzip

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Install Node.js (for direct deployment option)
print_status "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

# Create application user
print_status "Creating application user..."
if ! id "$SERVICE_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d $APP_DIR -m $SERVICE_USER
fi

# Create application directory
print_status "Setting up application directory..."
mkdir -p $APP_DIR
chown $SERVICE_USER:$SERVICE_USER $APP_DIR

# Configure firewall
print_status "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

# Configure fail2ban
print_status "Configuring fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# Setup SSL certificate with Let's Encrypt
setup_ssl() {
    if [[ "$DOMAIN" != "your-domain.com" ]]; then
        print_status "Setting up SSL certificate for $DOMAIN..."
        certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL
    else
        print_warning "Domain not configured. Skipping SSL setup."
        print_warning "Update DOMAIN variable and run: certbot --nginx -d your-domain.com"
    fi
}

# Deploy application
deploy_app() {
    print_status "Deploying RawrZ Security Platform..."
    
    # Copy application files
    if [[ -f "package.json" ]]; then
        cp -r . $APP_DIR/
        chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR
        
        # Install dependencies
        cd $APP_DIR
        sudo -u $SERVICE_USER npm install --production
        
        # Create systemd service
        create_systemd_service
        
        # Start service
        systemctl enable rawrz-security
        systemctl start rawrz-security
        
        print_status "Application deployed successfully!"
    else
        print_error "package.json not found. Make sure you're running this from the application directory."
        exit 1
    fi
}

# Create systemd service
create_systemd_service() {
    print_status "Creating systemd service..."
    cat > /etc/systemd/system/rawrz-security.service << EOF
[Unit]
Description=RawrZ Security Platform
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node rawrz-standalone.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$APP_DIR/uploads $APP_DIR/data $APP_DIR/logs

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
}

# Configure nginx
configure_nginx() {
    print_status "Configuring nginx..."
    
    # Backup default config
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
    
    # Create new config
    cat > /etc/nginx/sites-available/rawrz-security << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable site
    ln -sf /etc/nginx/sites-available/rawrz-security /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx config
    nginx -t && systemctl restart nginx
}

# Main deployment flow
main() {
    case "${1:-full}" in
        "docker")
            print_status "Deploying with Docker..."
            docker-compose up -d --build
            ;;
        "direct")
            print_status "Deploying directly..."
            deploy_app
            configure_nginx
            setup_ssl
            ;;
        "full"|*)
            print_status "Full deployment with Docker and nginx..."
            deploy_app
            configure_nginx
            setup_ssl
            docker-compose up -d --build
            ;;
    esac
    
    print_status "Deployment completed!"
    print_status "Your RawrZ Security Platform is now running."
    
    if [[ "$DOMAIN" != "your-domain.com" ]]; then
        print_status "Access your application at: https://$DOMAIN"
    else
        print_status "Access your application at: http://$(curl -s ifconfig.me)"
    fi
    
    print_status "To check service status: systemctl status rawrz-security"
    print_status "To check logs: journalctl -u rawrz-security -f"
}

# Run main function
main "$@"