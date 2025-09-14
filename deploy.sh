#!/bin/bash

# RawrZ Security Platform - Digital Ocean Deployment Script
# This script automates the deployment process on Digital Ocean

set -e

echo "🚀 RawrZ Security Platform - Digital Ocean Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="rawrz-security-platform"
DOMAIN="${DOMAIN:-your-domain.com}"
EMAIL="${EMAIL:-admin@your-domain.com}"
DROPLET_IP="${DROPLET_IP:-}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should not be run as root for security reasons"
        exit 1
    fi
}

# Update system packages
update_system() {
    log_info "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    log_success "System packages updated"
}

# Install Docker and Docker Compose
install_docker() {
    log_info "Installing Docker and Docker Compose..."
    
    # Remove old versions
    sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Install dependencies
    sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    log_success "Docker installed successfully"
}

# Install additional tools
install_tools() {
    log_info "Installing additional tools..."
    sudo apt install -y git curl wget unzip htop nano vim ufw fail2ban
    log_success "Additional tools installed"
}

# Configure firewall
configure_firewall() {
    log_info "Configuring firewall..."
    sudo ufw --force reset
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow ssh
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    log_success "Firewall configured"
}

# Configure fail2ban
configure_fail2ban() {
    log_info "Configuring fail2ban..."
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    log_success "Fail2ban configured"
}

# Create SSL certificates
create_ssl_certificates() {
    log_info "Creating SSL certificates..."
    
    # Create SSL directory
    sudo mkdir -p /etc/nginx/ssl
    
    # Generate self-signed certificate (replace with Let's Encrypt in production)
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/key.pem \
        -out /etc/nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    # Set permissions
    sudo chmod 600 /etc/nginx/ssl/key.pem
    sudo chmod 644 /etc/nginx/ssl/cert.pem
    
    log_success "SSL certificates created"
}

# Deploy application
deploy_application() {
    log_info "Deploying RawrZ Security Platform..."
    
    # Create application directory
    sudo mkdir -p /opt/$APP_NAME
    sudo chown $USER:$USER /opt/$APP_NAME
    
    # Copy application files
    cp -r . /opt/$APP_NAME/
    cd /opt/$APP_NAME
    
    # Build and start containers
    docker compose down 2>/dev/null || true
    docker compose build --no-cache
    docker compose up -d
    
    log_success "Application deployed successfully"
}

# Setup monitoring
setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Create monitoring script
    cat > /opt/$APP_NAME/monitor.sh << 'EOF'
#!/bin/bash
# RawrZ Security Platform Monitoring Script

APP_NAME="rawrz-security-platform"
LOG_FILE="/opt/$APP_NAME/logs/monitor.log"

# Check if containers are running
check_containers() {
    if ! docker compose ps | grep -q "Up"; then
        echo "$(date): Containers are down, restarting..." >> $LOG_FILE
        cd /opt/$APP_NAME
        docker compose restart
    fi
}

# Check disk space
check_disk_space() {
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        echo "$(date): Disk usage is high: ${DISK_USAGE}%" >> $LOG_FILE
    fi
}

# Check memory usage
check_memory() {
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
    if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
        echo "$(date): Memory usage is high: ${MEMORY_USAGE}%" >> $LOG_FILE
    fi
}

# Run checks
check_containers
check_disk_space
check_memory
EOF

    chmod +x /opt/$APP_NAME/monitor.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/$APP_NAME/monitor.sh") | crontab -
    
    log_success "Monitoring setup completed"
}

# Create systemd service
create_systemd_service() {
    log_info "Creating systemd service..."
    
    sudo tee /etc/systemd/system/$APP_NAME.service > /dev/null << EOF
[Unit]
Description=RawrZ Security Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/$APP_NAME
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0
User=$USER
Group=$USER

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable $APP_NAME.service
    
    log_success "Systemd service created"
}

# Main deployment function
main() {
    log_info "Starting deployment process..."
    
    check_root
    update_system
    install_docker
    install_tools
    configure_firewall
    configure_fail2ban
    create_ssl_certificates
    deploy_application
    setup_monitoring
    create_systemd_service
    
    log_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update your domain DNS to point to this server: $DROPLET_IP"
    echo "2. Replace self-signed SSL certificates with Let's Encrypt certificates"
    echo "3. Update the .env file with your production settings"
    echo "4. Access your application at: https://$DOMAIN"
    echo ""
    echo "🔧 Useful commands:"
    echo "  - View logs: docker compose logs -f"
    echo "  - Restart: sudo systemctl restart $APP_NAME"
    echo "  - Status: sudo systemctl status $APP_NAME"
    echo "  - Stop: sudo systemctl stop $APP_NAME"
    echo ""
    echo "⚠️  Important: Change default passwords and secrets in production!"
}

# Run main function
main "$@"