# SaaS Backend Setup Guide

## Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start MongoDB
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
# or
mongod
```

### 3. Run the Application
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/saas-app
JWT_SECRET=your-super-secret-jwt-key-change-in-production
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_USERNAME=your_sendgrid_username
EMAIL_FROM=noreply@yourcompany.com
FRONTEND_URL=http://localhost:3001
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Subscriptions
- `POST /api/subscriptions/create-checkout-session` - Create Stripe checkout
- `GET /api/subscriptions/plans` - Get available plans
- `POST /api/subscriptions/webhook` - Stripe webhook handler

### System
- `GET /` - API information
- `GET /health` - Health check

## Testing the API

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 3. User Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Frontend Integration

The backend is designed to work with the provided HTML frontend. Update the frontend JavaScript to use the actual API endpoints:

```javascript
// Replace simulateAPICall with actual API calls
async function loginUser(email, password) {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.token) {
      localStorage.setItem('token', data.token);
      showDashboard(data.user);
    } else {
      alert('Login failed: ' + data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Login failed. Please try again.');
  }
}
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check if the port 27017 is available
- Verify the database name in MONGODB_URI

### Port Already in Use
- Change the PORT in your .env file
- Kill the process using the port: `netstat -ano | findstr :3000`

### JWT Issues
- Ensure JWT_SECRET is set in your .env file
- Check token expiration (default: 7 days)

## Development

### File Structure
```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic services
├── utils/           # Utility functions
└── app.js          # Main application file
```

### Adding New Routes
1. Create a new route file in `src/routes/`
2. Add the route to `src/app.js`
3. Create corresponding controller in `src/controllers/`

### Database Models
- User model includes authentication, subscription, and preferences
- SubscriptionPlan model for managing different tiers
- Extend models as needed for your business logic

## Production Deployment

### Environment Variables
- Set NODE_ENV=production
- Use strong, unique JWT_SECRET
- Configure production MongoDB URI
- Set up proper CORS origins

### Security
- Enable Helmet security headers
- Configure rate limiting
- Use HTTPS in production
- Validate all inputs

### Monitoring
- Health check endpoint: `/health`
- Log errors and requests
- Monitor MongoDB performance
- Set up Stripe webhook monitoring

## Support

For issues and questions:
1. Check the console logs
2. Verify environment variables
3. Test individual endpoints
4. Check MongoDB connection
