# Netlify Deployment Guide for SaaS Encryption Platform

## Overview
This guide will help you deploy your SaaS Encryption Platform to Netlify using Netlify Functions for the backend API.

## Prerequisites
- [Netlify account](https://app.netlify.com)
- [Git repository](https://github.com) (optional but recommended)
- MongoDB Atlas database (already configured)

## Setting up Netlify Deployment for Your SaaS Project

Based on your project structure, you have a Node.js backend that needs to be deployed as serverless functions on Netlify. Here's what we need to do:

### 1. Create a `netlify.toml` Configuration File

```toml:netlify.toml
[build]
  command = "npm run build"
  publish = "public"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

### 2. Create the Netlify Functions Structure

You'll need to create a `netlify/functions` directory and convert your Express app to serverless functions:

```javascript:netlify/functions/api.js
const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('../../src/routes/auth');
const subscriptionRoutes = require('../../src/routes/subscriptions');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Database connection
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/saas-app';
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.log('⚠️ MongoDB connection error:', err.message);
  }
};

// Connect to database
connectDB();

// Routes
app.use('/.netlify/functions/api/auth', authRoutes);
app.use('/.netlify/functions/api/subscriptions', authRoutes);

// Health check
app.get('/.netlify/functions/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    message: 'SaaS Backend is running on Netlify!'
  });
});

// Root endpoint
app.get('/.netlify/functions/api', (req, res) => {
  res.json({ 
    message: '🚀 SaaS Backend API is running on Netlify!',
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    endpoints: {
      root: '/.netlify/functions/api',
      health: '/.netlify/functions/api/health',
      auth: '/.netlify/functions/api/auth',
      subscriptions: '/.netlify/functions/api/subscriptions'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Export the serverless handler
exports.handler = serverless(app);
```

### 3. Update Your Package.json

```json:package.json
{
  "name": "saas-backend",
  "version": "1.0.0",
  "description": "Complete SaaS Backend",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "build": "echo 'Build completed'",
    "test": "jest"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^6.8.1",
    "express-validator": "^7.0.1",
    "helmet": "^7.0.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^7.5.0",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^6.9.4",
    "serverless-http": "^3.2.0",
    "socket.io": "^4.7.2",
    "stripe": "^12.18.0"
  },
  "devDependencies": {
    "jest": "^29.6.4",
    "netlify-cli": "^23.5.0",
    "nodemon": "^3.0.1"
  }
}
```

### 4. Create Environment Variables

Create a `.env` file in your project root (make sure to add this to `.gitignore`):

```env:.env
MONGODB_URI=mongodb+srv://garrettaosborne_db_user:bibbles11@cluster0.sjccoyd.mongodb.net/saas-app
JWT_SECRET=your-super-secret-jwt-key-change-in-production
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_USERNAME=your_sendgrid_username
EMAIL_FROM=noreply@yourcompany.com
FRONTEND_URL=https://your-netlify-app.netlify.app
```

### 5. Install Required Dependencies

```bash
npm install serverless-http
```

### 6. Deploy to Netlify

1. **Connect your repository:**
   - Go to [Netlify](https://app.netlify.com/)
   - Click "New site from Git"
   - Connect your GitHub/GitLab/Bitbucket repository

2. **Set build settings:**
   - Build command: `npm run build`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`

3. **Set environment variables:**
   - In your Netlify dashboard, go to Site settings > Environment variables
   - Add all the variables from your `.env` file

4. **Deploy:**
   - Netlify will automatically deploy when you push to your main branch
   - Or you can trigger a manual deploy

### 7. Test Your Deployment

After deployment, test these endpoints:
- `https://your-app.netlify.app/.netlify/functions/api/health`
- `https://your-app.netlify.app/.netlify/functions/api`

### Important Notes:

1. **MongoDB Connection**: Your MongoDB Atlas connection should work from Netlify's servers
2. **Rate Limiting**: Netlify has built-in rate limiting, so your Express rate limiting is additional
3. **File Uploads**: For file uploads, you'll need to use Netlify's form handling or integrate with a service like Cloudinary
4. **WebSockets**: Socket.io won't work on Netlify - consider using Pusher or similar for real-time features

Would you like me to help you with any specific part of this setup, or do you have questions about the deployment process?
