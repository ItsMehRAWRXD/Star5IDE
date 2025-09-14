#!/bin/bash

# RawrZ Security Platform - Health Check Script
# This script performs comprehensive health checks on the deployed application

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="rawrz-security-platform"
DOMAIN="${DOMAIN:-localhost}"
PORT="${PORT:-3000}"

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

# Check if Docker is running
check_docker() {
    log_info "Checking Docker status..."
    if systemctl is-active --quiet docker; then
        log_success "Docker is running"
    else
        log_error "Docker is not running"
        return 1
    fi
}

# Check container status
check_containers() {
    log_info "Checking container status..."
    
    if docker-compose ps | grep -q "Up"; then
        log_success "Containers are running"
        
        # Check individual containers
        if docker-compose ps | grep -q "rawrz-security.*Up"; then
            log_success "RawrZ Security container is healthy"
        else
            log_error "RawrZ Security container is not running"
            return 1
        fi
        
        if docker-compose ps | grep -q "nginx.*Up"; then
            log_success "Nginx container is healthy"
        else
            log_warning "Nginx container is not running"
        fi
    else
        log_error "No containers are running"
        return 1
    fi
}

# Check application health endpoint
check_health_endpoint() {
    log_info "Checking application health endpoint..."
    
    # Try HTTP first
    if curl -f -s http://localhost:$PORT/health > /dev/null 2>&1; then
        log_success "Application health endpoint is responding (HTTP)"
    elif curl -f -s https://localhost/health > /dev/null 2>&1; then
        log_success "Application health endpoint is responding (HTTPS)"
    else
        log_warning "Application health endpoint is not responding"
    fi
}

# Check system resources
check_system_resources() {
    log_info "Checking system resources..."
    
    # Check disk space
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -lt 80 ]; then
        log_success "Disk usage is healthy: ${DISK_USAGE}%"
    else
        log_warning "Disk usage is high: ${DISK_USAGE}%"
    fi
    
    # Check memory usage
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ $MEMORY_USAGE -lt 80 ]; then
        log_success "Memory usage is healthy: ${MEMORY_USAGE}%"
    else
        log_warning "Memory usage is high: ${MEMORY_USAGE}%"
    fi
    
    # Check CPU load
    CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    if (( $(echo "$CPU_LOAD < 2.0" | bc -l) )); then
        log_success "CPU load is healthy: $CPU_LOAD"
    else
        log_warning "CPU load is high: $CPU_LOAD"
    fi
}

# Check network connectivity
check_network() {
    log_info "Checking network connectivity..."
    
    # Check if ports are listening
    if netstat -tlnp | grep -q ":$PORT "; then
        log_success "Application port $PORT is listening"
    else
        log_warning "Application port $PORT is not listening"
    fi
    
    if netstat -tlnp | grep -q ":80 "; then
        log_success "HTTP port 80 is listening"
    else
        log_warning "HTTP port 80 is not listening"
    fi
    
    if netstat -tlnp | grep -q ":443 "; then
        log_success "HTTPS port 443 is listening"
    else
        log_warning "HTTPS port 443 is not listening"
    fi
}

# Check SSL certificates
check_ssl() {
    log_info "Checking SSL certificates..."
    
    if [ -f "ssl/cert.pem" ] && [ -f "ssl/key.pem" ]; then
        log_success "SSL certificates exist"
        
        # Check certificate validity
        CERT_EXPIRY=$(openssl x509 -in ssl/cert.pem -noout -enddate | cut -d= -f2)
        CERT_EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s)
        CURRENT_EPOCH=$(date +%s)
        DAYS_UNTIL_EXPIRY=$(( (CERT_EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
        
        if [ $DAYS_UNTIL_EXPIRY -gt 30 ]; then
            log_success "SSL certificate is valid for $DAYS_UNTIL_EXPIRY days"
        else
            log_warning "SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
        fi
    else
        log_warning "SSL certificates not found"
    fi
}

# Check application logs
check_logs() {
    log_info "Checking application logs..."
    
    if [ -f "logs/rawrz.log" ]; then
        log_success "Application log file exists"
        
        # Check for recent errors
        ERROR_COUNT=$(tail -100 logs/rawrz.log | grep -i error | wc -l)
        if [ $ERROR_COUNT -eq 0 ]; then
            log_success "No recent errors in logs"
        else
            log_warning "Found $ERROR_COUNT recent errors in logs"
        fi
    else
        log_warning "Application log file not found"
    fi
}

# Check firewall
check_firewall() {
    log_info "Checking firewall status..."
    
    if command -v ufw > /dev/null; then
        if ufw status | grep -q "Status: active"; then
            log_success "Firewall is active"
            
            # Check if required ports are open
            if ufw status | grep -q "80/tcp"; then
                log_success "HTTP port 80 is open"
            else
                log_warning "HTTP port 80 is not open"
            fi
            
            if ufw status | grep -q "443/tcp"; then
                log_success "HTTPS port 443 is open"
            else
                log_warning "HTTPS port 443 is not open"
            fi
        else
            log_warning "Firewall is not active"
        fi
    else
        log_warning "UFW firewall not installed"
    fi
}

# Test application functionality
test_application() {
    log_info "Testing application functionality..."
    
    # Test basic CLI functionality
    if docker-compose exec -T rawrz-security node rawrz-standalone.js sysinfo > /dev/null 2>&1; then
        log_success "Application CLI is working"
    else
        log_warning "Application CLI test failed"
    fi
    
    # Test encryption functionality
    if docker-compose exec -T rawrz-security node rawrz-standalone.js encrypt aes256 "test" .test > /dev/null 2>&1; then
        log_success "Encryption functionality is working"
    else
        log_warning "Encryption functionality test failed"
    fi
}

# Generate health report
generate_report() {
    log_info "Generating health report..."
    
    REPORT_FILE="health-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "RawrZ Security Platform - Health Report"
        echo "Generated: $(date)"
        echo "========================================"
        echo ""
        
        echo "System Information:"
        echo "  Hostname: $(hostname)"
        echo "  OS: $(lsb_release -d | cut -f2)"
        echo "  Kernel: $(uname -r)"
        echo "  Uptime: $(uptime -p)"
        echo ""
        
        echo "Docker Status:"
        docker-compose ps
        echo ""
        
        echo "System Resources:"
        echo "  Disk Usage: $(df -h / | awk 'NR==2 {print $5}')"
        echo "  Memory Usage: $(free -h | awk 'NR==2 {print $3 "/" $2}')"
        echo "  CPU Load: $(uptime | awk -F'load average:' '{print $2}')"
        echo ""
        
        echo "Network Status:"
        netstat -tlnp | grep -E ":(80|443|3000) "
        echo ""
        
        echo "Recent Logs (last 10 lines):"
        if [ -f "logs/rawrz.log" ]; then
            tail -10 logs/rawrz.log
        else
            echo "No log file found"
        fi
        
    } > $REPORT_FILE
    
    log_success "Health report generated: $REPORT_FILE"
}

# Main health check function
main() {
    echo "🔍 RawrZ Security Platform - Health Check"
    echo "=========================================="
    echo ""
    
    local exit_code=0
    
    check_docker || exit_code=1
    check_containers || exit_code=1
    check_health_endpoint || exit_code=1
    check_system_resources
    check_network
    check_ssl
    check_logs
    check_firewall
    test_application
    generate_report
    
    echo ""
    if [ $exit_code -eq 0 ]; then
        log_success "🎉 All critical health checks passed!"
    else
        log_error "❌ Some critical health checks failed!"
    fi
    
    echo ""
    echo "📋 Next steps:"
    echo "  - Review the generated health report"
    echo "  - Check logs for any issues: docker-compose logs -f"
    echo "  - Monitor system resources regularly"
    echo "  - Keep the system updated"
    
    exit $exit_code
}

# Run main function
main "$@"