#!/bin/bash

# RawrZ Security Platform - Quick Deploy Script
# For rapid deployment on Digital Ocean

set -e

echo "⚡ RawrZ Security Platform - Quick Deploy"
echo "========================================"

# Configuration
DOMAIN="${1:-localhost}"
EMAIL="${2:-admin@localhost}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Quick setup
log_info "Setting up RawrZ Security Platform..."

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    log_info "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    log_info "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create SSL directory and certificates
log_info "Creating SSL certificates..."
sudo mkdir -p ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem \
    -out ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=RawrZ/CN=$DOMAIN"

# Start the application
log_info "Starting RawrZ Security Platform..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

log_success "🚀 RawrZ Security Platform is now running!"
echo ""
echo "📋 Access your application:"
echo "  - HTTP:  http://$DOMAIN"
echo "  - HTTPS: https://$DOMAIN"
echo ""
echo "🔧 Management commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop: docker-compose down"
echo "  - Restart: docker-compose restart"
echo "  - Update: docker-compose pull && docker-compose up -d"
echo ""
echo "⚠️  For production deployment, run: ./deploy.sh"