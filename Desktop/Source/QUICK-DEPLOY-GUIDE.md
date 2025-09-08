# 🚀 RawrZ Security Platform - Quick Deploy Guide

## Current Status
✅ **Repository cleaned up** (removed 119,618 files of bloat!)  
✅ **Deployment files ready** (Dockerfile.prod, docker-compose files)  
✅ **Local code is clean and optimized**  

## 🎯 RECOMMENDED: Deploy to DigitalOcean App Platform

### Step 1: Create Deployment Package
```bash
# Run this to create the deployment package
.\DEPLOY-NOW.bat
```

### Step 2: Create New App on DigitalOcean
1. Go to: https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Choose **"Upload Source Code"**
4. Upload: `rawrz-deployment.zip`
5. Configure:
   - **Dockerfile**: Use `Dockerfile.prod`
   - **Port**: 3000
   - **Environment**: Production

### Step 3: Deploy
- Click **"Create Resources"**
- Wait for deployment to complete
- Get your app URL

## 🌐 Domain Setup (screenpilot.dev)

### Current Domain Status
- **Domain**: screenpilot.dev
- **Registrar**: Porkbun
- **Nameservers**: Need to update to DigitalOcean
- **Current IP**: 167.71.102.248 (droplet)

### DNS Configuration
1. **Update Nameservers in Porkbun**:
   ```
   ns1.digitalocean.com
   ns2.digitalocean.com
   ns3.digitalocean.com
   ```

2. **Add A Record in DigitalOcean**:
   ```
   Type: A
   Name: @
   Value: [Your App Platform URL IP]
   TTL: 3600
   ```

## 🔧 Alternative: Deploy to Existing Droplet

### Direct Droplet Deployment
```bash
# Upload files to droplet
scp -r src/ public/ package.json Dockerfile.prod root@167.71.102.248:/root/rawrz/

# SSH into droplet
ssh root@167.71.102.248

# Deploy
cd /root/rawrz
docker build -f Dockerfile.prod -t rawrz-platform .
docker run -d -p 3000:3000 --name rawrz-app rawrz-platform
```

## 📋 Environment Variables
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://garrettaosborne_db_user:bibbles11@cluster0.sjccoyd.mongodb.net/
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=https://screenpilot.dev
```

## 🎉 Success Indicators
- ✅ App accessible at DigitalOcean URL
- ✅ RawrZ Security Platform loads
- ✅ All crypto engines working
- ✅ Domain points to app
- ✅ SSL certificate active

## 🆘 Troubleshooting
- **Git freezing**: Use direct upload method
- **Docker build fails**: Check Dockerfile.prod syntax
- **Domain not working**: Verify nameservers updated
- **App not starting**: Check environment variables

---
**Ready to deploy! Run `.\DEPLOY-NOW.bat` to start!** 🚀
