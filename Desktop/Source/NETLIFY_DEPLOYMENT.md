# Netlify Functions Deployment Guide

## Current Issues and Solutions

### [OK] Issues Fixed:
1. **Static Site vs Node.js Backend Mismatch** - Converted Express app to Netlify Functions
2. **Express to Serverless Conversion** - All routes now use Netlify Functions
3. **Environment Variables** - Configured for Netlify deployment

## [START] Quick Setup

### 1. Install Dependencies
```bash
cd netlify/functions
npm install
```

### 2. Environment Variables
Set these in your Netlify dashboard under **Site settings > Environment variables**:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

### 3. Deploy
```bash
# Install Netlify CLI if you haven't
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

## [CHAR][CHAR] Function Structure

### Authentication Function (`/api/auth/*`)
- **POST** `/api/auth/register` - User registration
- **POST** `/api/auth/login` - User login  
- **GET** `/api/auth/profile` - Get user profile (requires auth)

### Subscriptions Function (`/api/subscriptions/*`)
- **GET** `/api/subscriptions/my-subscription` - Get current subscription
- **GET** `/api/subscriptions/plans` - View available plans
- **POST** `/api/subscriptions/upgrade` - Upgrade subscription
- **PUT** `/api/subscriptions/cancel` - Cancel subscription

### Crypto API Function (`/api/*`)
- **POST** `/api/encrypt` - Encrypt data
- **POST** `/api/decrypt` - Decrypt data
- **POST** `/api/hash` - Generate hashes

## [WEB] API Endpoints

All endpoints are now available at:
- **Local Dev**: `http://localhost:8888/api/*`
- **Production**: `https://yoursite.netlify.app/api/*`

## [LOCK] Authentication

JWT tokens are required for protected endpoints. Include in headers:
```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## [SAVE] Database

MongoDB connection is handled automatically by each function. The connection is established per request and closed after completion.

## [CHAR][CHAR] Testing

### Test Authentication:
```bash
# Register
curl -X POST https://yoursite.netlify.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST https://yoursite.netlify.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Subscriptions:
```bash
# Get plans (no auth required)
curl https://yoursite.netlify.app/api/subscriptions/plans

# Get my subscription (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://yoursite.netlify.app/api/subscriptions/my-subscription
```

## [ALERT] Common Issues

### 1. Function Timeout
- Default timeout is 10 seconds
- Increase in `netlify.toml` if needed:
```toml
[functions]
  node_bundler = "esbuild"
  external_node_modules = []
  timeout = 30
```

### 2. MongoDB Connection Issues
- Check your `MONGODB_URI` environment variable
- Ensure MongoDB Atlas allows connections from Netlify's IP ranges
- Add `0.0.0.0/0` to IP whitelist temporarily for testing

### 3. CORS Issues
- CORS headers are already set in all functions
- If you need custom origins, modify the `Access-Control-Allow-Origin` header

## [CHAR][CHAR] Frontend Integration

Your frontend can now call these endpoints directly:

```javascript
// Example: User registration
const registerUser = async (email, password) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

// Example: Get subscription plans
const getPlans = async () => {
  const response = await fetch('/api/subscriptions/plans');
  return response.json();
};
```

## [TARGET] Next Steps

1. **Test all endpoints** locally using `netlify dev`
2. **Deploy to staging** first
3. **Set up monitoring** for function performance
4. **Configure custom domain** in Netlify
5. **Set up CI/CD** if needed

## [SEARCH] Monitoring

Monitor your functions in the Netlify dashboard:
- **Functions** tab shows execution logs
- **Analytics** tab shows function performance
- **Deploys** tab shows deployment status

## [CHAR][CHAR] Pro Tips

- Use `netlify dev` for local development
- Functions are automatically scaled by Netlify
- Cold starts are minimal with proper optimization
- Consider using Netlify's edge functions for global performance
