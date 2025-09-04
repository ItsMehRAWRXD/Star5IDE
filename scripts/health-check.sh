#!/bin/bash

# Health Check Script
# Checks the status of your Droplet and deployed applications

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🏥 Droplet Health Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if IP file exists
if [ ! -f ".droplet_ip" ]; then
    echo -e "${RED}❌ No Droplet IP found${NC}"
    exit 1
fi

DROPLET_IP=$(cat .droplet_ip)

# Function to check service
check_service() {
    local name=$1
    local check_command=$2
    
    if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no rawr@$DROPLET_IP "$check_command" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $name"
        return 0
    else
        echo -e "${RED}✗${NC} $name"
        return 1
    fi
}

# Function to check port
check_port() {
    local port=$1
    local service=$2
    
    if nc -z -w2 $DROPLET_IP $port &> /dev/null; then
        echo -e "${GREEN}✓${NC} Port $port ($service) is open"
        return 0
    else
        echo -e "${RED}✗${NC} Port $port ($service) is closed"
        return 1
    fi
}

# SSH Connection
echo -e "${BLUE}📡 Connectivity${NC}"
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no rawr@$DROPLET_IP "echo 'Connected'" &> /dev/null; then
    echo -e "${GREEN}✓${NC} SSH connection successful"
    SSH_OK=true
else
    echo -e "${RED}✗${NC} SSH connection failed"
    SSH_OK=false
fi

# Port checks
echo
echo -e "${BLUE}🔌 Port Status${NC}"
check_port 22 "SSH"
check_port 80 "HTTP"
check_port 443 "HTTPS"
check_port 3000 "Node.js App"

if [ "$SSH_OK" = true ]; then
    # System services
    echo
    echo -e "${BLUE}⚙️  System Services${NC}"
    check_service "Docker" "sudo systemctl is-active docker"
    check_service "UFW Firewall" "sudo ufw status | grep -q 'Status: active'"
    check_service "Fail2Ban" "sudo systemctl is-active fail2ban"
    check_service "Nginx" "sudo systemctl is-active nginx 2>/dev/null || echo 'not installed'"
    
    # Application status
    echo
    echo -e "${BLUE}📦 Applications${NC}"
    
    # Check PM2
    if ssh -o StrictHostKeyChecking=no rawr@$DROPLET_IP "pm2 list" &> /dev/null; then
        PM2_STATUS=$(ssh -o StrictHostKeyChecking=no rawr@$DROPLET_IP "pm2 jlist" 2>/dev/null)
        if [ -n "$PM2_STATUS" ] && [ "$PM2_STATUS" != "[]" ]; then
            echo -e "${GREEN}✓${NC} PM2 is running"
            
            # Parse PM2 apps
            ssh -o StrictHostKeyChecking=no rawr@$DROPLET_IP "pm2 list --no-color" | grep -E "^│" | grep -v "^│─" | tail -n +2 | while read line; do
                APP_NAME=$(echo $line | awk -F'│' '{print $3}' | xargs)
                APP_STATUS=$(echo $line | awk -F'│' '{print $10}' | xargs)
                
                if [[ "$APP_STATUS" == *"online"* ]]; then
                    echo -e "  ${GREEN}✓${NC} $APP_NAME: online"
                else
                    echo -e "  ${RED}✗${NC} $APP_NAME: $APP_STATUS"
                fi
            done
        else
            echo -e "${YELLOW}⚠${NC} PM2 running but no apps deployed"
        fi
    else
        echo -e "${YELLOW}⚠${NC} PM2 not accessible"
    fi
    
    # System resources
    echo
    echo -e "${BLUE}💻 System Resources${NC}"
    ssh -o StrictHostKeyChecking=no rawr@$DROPLET_IP << 'EOF'
        # CPU and Load
        LOAD=$(uptime | awk -F'load average:' '{print $2}')
        echo "  Load Average:$LOAD"
        
        # Memory
        MEM_INFO=$(free -h | grep "^Mem")
        MEM_TOTAL=$(echo $MEM_INFO | awk '{print $2}')
        MEM_USED=$(echo $MEM_INFO | awk '{print $3}')
        MEM_FREE=$(echo $MEM_INFO | awk '{print $4}')
        echo "  Memory: $MEM_USED used / $MEM_TOTAL total ($MEM_FREE free)"
        
        # Disk
        DISK_INFO=$(df -h / | tail -1)
        DISK_USED=$(echo $DISK_INFO | awk '{print $3}')
        DISK_TOTAL=$(echo $DISK_INFO | awk '{print $2}')
        DISK_PERCENT=$(echo $DISK_INFO | awk '{print $5}')
        echo "  Disk: $DISK_USED used / $DISK_TOTAL total ($DISK_PERCENT used)"
        
        # Uptime
        UPTIME=$(uptime -p)
        echo "  Uptime: ${UPTIME#up }"
EOF
    
    # Check for updates
    echo
    echo -e "${BLUE}📦 System Updates${NC}"
    UPDATE_COUNT=$(ssh -o StrictHostKeyChecking=no rawr@$DROPLET_IP "sudo apt list --upgradable 2>/dev/null | grep -c upgradable || echo 0")
    if [ "$UPDATE_COUNT" -gt 1 ]; then
        echo -e "${YELLOW}⚠${NC} $((UPDATE_COUNT-1)) package updates available"
    else
        echo -e "${GREEN}✓${NC} System is up to date"
    fi
fi

# HTTP health check
echo
echo -e "${BLUE}🌐 HTTP Health${NC}"

# Check HTTP response
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$DROPLET_IP:3000/health 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} Application responding (HTTP $HTTP_STATUS)"
elif [ "$HTTP_STATUS" = "000" ]; then
    echo -e "${YELLOW}⚠${NC} Application not responding (connection failed)"
else
    echo -e "${YELLOW}⚠${NC} Application returned HTTP $HTTP_STATUS"
fi

# Check HTTPS if domain is configured
if [ -n "$1" ]; then
    DOMAIN=$1
    HTTPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null || echo "000")
    if [ "$HTTPS_STATUS" = "200" ]; then
        echo -e "${GREEN}✓${NC} HTTPS working for $DOMAIN"
    else
        echo -e "${YELLOW}⚠${NC} HTTPS not working for $DOMAIN (HTTP $HTTPS_STATUS)"
    fi
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 Health Check Complete${NC}"