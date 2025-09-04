#!/bin/bash

# Complete validation script for Droplet Forge
# Ensures all files are well-formed and no secrets are exposed

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Droplet Forge Validation${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ERRORS=0

# 1. Check for exposed secrets
echo -e "${BLUE}🔐 Scanning for secrets...${NC}"
if grep -RPn --exclude-dir=node_modules --exclude-dir=.git \
     -E '(ghp_[A-Za-z0-9]{36}|dop_v1_[a-f0-9]{64}|sk_live_|AKIA[0-9A-Z]{16})' . 2>/dev/null; then
    echo -e "${RED}❌ SECRETS FOUND! Remove them immediately!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ No secrets detected${NC}"
fi

# 2. Check for merge conflicts
echo -e "${BLUE}🔀 Checking for merge conflicts...${NC}"
if grep -rn --exclude-dir=.git "<<<<<<\|>>>>>>" . 2>/dev/null; then
    echo -e "${RED}❌ MERGE CONFLICTS FOUND!${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ No merge conflicts${NC}"
fi

# 3. Validate YAML files
echo -e "${BLUE}📋 Validating YAML files...${NC}"
for file in $(find . -name "*.yml" -o -name "*.yaml" | grep -v node_modules); do
    if python -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}❌ MALFORMED: $file${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# 4. Validate shell scripts
echo -e "${BLUE}🐚 Validating shell scripts...${NC}"
for file in $(find . -name "*.sh" | grep -v node_modules); do
    if bash -n "$file" 2>/dev/null; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}❌ SYNTAX ERROR: $file${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# 5. Check JSON files
echo -e "${BLUE}📦 Validating JSON files...${NC}"
for file in $(find . -name "*.json" | grep -v node_modules); do
    if python -m json.tool "$file" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}❌ MALFORMED JSON: $file${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

# 6. Check for placeholder values
echo -e "${BLUE}🔤 Checking for placeholders...${NC}"
PLACEHOLDERS=$(grep -r "YOUR_PUBLIC_KEY_HERE\|YOUR_USERNAME\|YOUR_REPO\|YOUR_DROPLET_IP\|YOUR_STAGING_IP" . --exclude-dir=.git --exclude-dir=node_modules --exclude="*.md" | wc -l)
if [ $PLACEHOLDERS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $PLACEHOLDERS placeholder values (OK for template)${NC}"
fi

# Results
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All validation checks passed!${NC}"
    echo -e "${GREEN}Repository is well-formed and ready to ship!${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS validation errors!${NC}"
    echo -e "${RED}Fix these issues before committing.${NC}"
    exit 1
fi