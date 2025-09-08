# Deployment Script for screenpilot.dev (PowerShell)
# RawrZ Security Platform - Existing Hosting

param(
    [string]$Domain = "screenpilot.dev",
    [string]$AppName = "rawrz-security-platform",
    [string]$ServerIP = "",
    [string]$SSHUser = "root"
)

Write-Host "🚀 Starting deployment to existing hosting for $Domain" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Configuration
$ServerIP = if ($ServerIP) { $ServerIP } else { Read-Host "Enter your server IP address" }
$SSHKeyPath = "$env:USERPROFILE\.ssh\id_rsa"

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    } catch {
        return $false
    }
}

# Check dependencies
function Test-Dependencies {
    Write-Host "🔍 Checking dependencies..." -ForegroundColor Yellow
    
    if (-not (Test-Command "docker")) {
        Write-Host "❌ Docker is not installed. Please install it first." -ForegroundColor Red
        exit 1
    }
    
    if (-not (Test-Command "ssh")) {
        Write-Host "❌ SSH is not available. Please ensure SSH client is installed." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ All dependencies are installed" -ForegroundColor Green
}

# Test server connection
function Test-ServerConnection {
    Write-Host "🔗 Testing connection to server $ServerIP..." -ForegroundColor Yellow
    
    try {
        # Test SSH connection
        $testResult = ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSHUser@$ServerIP" "echo 'Connection successful'"
        
        if ($testResult -match "Connection successful") {
            Write-Host "✅ Server connection successful" -ForegroundColor Green
        } else {
            Write-Host "❌ Server connection failed" -ForegroundColor Red
            exit 1
        }
        
    } catch {
        Write-Host "❌ Failed to connect to server: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please ensure:" -ForegroundColor Yellow
        Write-Host "  - Server IP is correct: $ServerIP" -ForegroundColor White
        Write-Host "  - SSH key is properly configured" -ForegroundColor White
        Write-Host "  - Server is accessible from your network" -ForegroundColor White
        exit 1
    }
}

# Setup domain DNS (manual instructions)
function Show-DNSInstructions {
    Write-Host "🌐 DNS Configuration for $Domain..." -ForegroundColor Yellow
    
    Write-Host "Please configure your DNS records manually:" -ForegroundColor Cyan
    Write-Host "  A Record: @ -> $ServerIP" -ForegroundColor White
    Write-Host "  A Record: www -> $ServerIP" -ForegroundColor White
    Write-Host "  TTL: 300 seconds" -ForegroundColor White
    
    $continue = Read-Host "Have you configured DNS? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Please configure DNS first, then run the script again." -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host "✅ DNS configuration confirmed" -ForegroundColor Green
}

# Deploy application
function Deploy-Application {
    Write-Host "📦 Deploying application to server..." -ForegroundColor Yellow
    
    try {
        # Create deployment directory
        $DeployDir = "/root/$AppName"
        
        # Copy files to server using SCP
        $FilesToCopy = @(
            "Dockerfile.prod",
            "docker-compose.prod.yml",
            "nginx/",
            "env.production.example",
            "src/",
            "public/",
            "scripts/",
            "package*.json"
        )
        
        foreach ($File in $FilesToCopy) {
            if (Test-Path $File) {
                Write-Host "  📁 Copying $File..." -ForegroundColor Gray
                scp -r -o StrictHostKeyChecking=no $File "$SSHUser@$ServerIP`:$DeployDir/"
            }
        }
        
        # SSH into server and setup
        $SSHCommands = @"
cd $DeployDir

# Install additional dependencies
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx

# Setup environment
cp env.production.example .env.production

# Generate SSL certificates
certbot --nginx -d $Domain -d www.$Domain --non-interactive --agree-tos --email admin@$Domain

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
echo "/root/$AppName/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}" > /etc/logrotate.d/$AppName
"@
        
        ssh -o StrictHostKeyChecking=no "$SSHUser@$ServerIP" $SSHCommands
        
        Write-Host "✅ Application deployed successfully" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Failed to deploy application: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Setup monitoring
function Set-Monitoring {
    Write-Host "📊 Setting up monitoring..." -ForegroundColor Yellow
    
    try {
        $MonitoringCommands = @"
# Install monitoring tools
apt-get install -y htop iotop nethogs

# Setup log monitoring
echo "*/5 * * * * /root/$AppName/scripts/monitor-logs.sh" | crontab -

# Setup health checks
echo "*/1 * * * * curl -f http://localhost/health || systemctl restart docker" | crontab -
"@
        
        ssh -o StrictHostKeyChecking=no "$SSHUser@$ServerIP" $MonitoringCommands
        
        Write-Host "✅ Monitoring setup completed" -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Failed to setup monitoring: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main deployment function
function Start-Deployment {
    Write-Host "🚀 Starting deployment process..." -ForegroundColor Cyan
    
    Test-Dependencies
    Test-ServerConnection
    Show-DNSInstructions
    Deploy-Application
    Set-Monitoring
    
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌐 Your application is now available at: https://$Domain" -ForegroundColor Cyan
    Write-Host "🖥️ Server IP: $ServerIP" -ForegroundColor Cyan
    Write-Host "🔑 SSH access: ssh $SSHUser@$ServerIP" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Update DNS settings if needed" -ForegroundColor White
    Write-Host "2. Configure SSL certificates" -ForegroundColor White
    Write-Host "3. Set up monitoring alerts" -ForegroundColor White
    Write-Host "4. Test the application" -ForegroundColor White
}

# Run deployment
Start-Deployment
