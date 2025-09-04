#!/bin/bash

# Initialize Droplet Forge Repository
# This script sets up your GitHub repository for the first time

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔨 Droplet Forge - Repository Setup${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${GREEN}📦 Initializing git repository...${NC}"
    git init
    git branch -M main
fi

# Get GitHub username
echo
read -p "Enter your GitHub username: " GITHUB_USER
read -p "Make repository public? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    VISIBILITY="--public"
    echo -e "${GREEN}✓ Repository will be public${NC}"
else
    VISIBILITY="--private"
    echo -e "${YELLOW}✓ Repository will be private${NC}"
fi

# Update package.json with username
if [ -f "package.json" ]; then
    sed -i.bak "s/YOUR_USERNAME/$GITHUB_USER/g" package.json
    rm -f package.json.bak
    echo -e "${GREEN}✓ Updated package.json${NC}"
fi

# Update README with username
if [ -f "README.md" ]; then
    sed -i.bak "s/YOUR_USERNAME/$GITHUB_USER/g" README.md
    sed -i.bak "s/YOUR_REPO/droplet-forge/g" README.md
    rm -f README.md.bak
    echo -e "${GREEN}✓ Updated README.md${NC}"
fi

# Add all files
echo -e "${GREEN}📝 Staging files...${NC}"
git add -A

# Initial commit
echo -e "${GREEN}💾 Creating initial commit...${NC}"
git commit -m "🔨 Initial commit - Droplet Forge infrastructure setup" || echo "Already committed"

# Create GitHub repository using gh CLI if available
if command -v gh &> /dev/null; then
    echo
    echo -e "${GREEN}🌐 Creating GitHub repository...${NC}"
    
    if gh auth status &> /dev/null; then
        # Create the repository
        gh repo create droplet-forge \
            --description "🔨 Bulletproof DigitalOcean Droplet deployment - destroy and rebuild identical servers in 60 seconds" \
            $VISIBILITY \
            --source=. \
            --remote=origin \
            --push
        
        echo -e "${GREEN}✅ Repository created and pushed to GitHub!${NC}"
        echo -e "${GREEN}🔗 View at: https://github.com/$GITHUB_USER/droplet-forge${NC}"
    else
        echo -e "${YELLOW}⚠️  GitHub CLI not authenticated${NC}"
        echo "Run: gh auth login"
        echo
        echo "Or manually create repository and run:"
        echo -e "${BLUE}git remote add origin git@github.com:$GITHUB_USER/droplet-forge.git${NC}"
        echo -e "${BLUE}git push -u origin main${NC}"
    fi
else
    echo
    echo -e "${YELLOW}ℹ️  GitHub CLI not installed${NC}"
    echo "To install: https://cli.github.com/"
    echo
    echo "Manual steps:"
    echo "1. Create repository at: https://github.com/new"
    echo "   Name: droplet-forge"
    echo "2. Run these commands:"
    echo
    echo -e "${BLUE}git remote add origin git@github.com:$GITHUB_USER/droplet-forge.git${NC}"
    echo -e "${BLUE}git push -u origin main${NC}"
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo
echo "Next steps:"
echo "1. Add your SSH key to do_cloudinit.yml"
echo "2. Set up DigitalOcean: doctl auth init"
echo "3. Deploy your Droplet: ./deploy.sh"
echo "4. Star the repo if you find it useful! ⭐"