// Configuration for Netlify Functions
module.exports = {
  // MongoDB connection string
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://garrettaosborne_db_user:bibbles11@cluster0.sjccoyd.mongodb.net/',
  
  // JWT secret for authentication
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  
  // Stripe configuration
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret',
  
  // SendGrid configuration
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || 'your_sendgrid_key',
  SENDGRID_USERNAME: process.env.SENDGRID_USERNAME || 'your_sendgrid_username',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@yourcompany.com',
  
  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://your-app.netlify.app',
  
  // API configuration
  API_VERSION: 'v1',
  MAX_ENCRYPTION_SIZE: 1024 * 1024, // 1MB
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100 // 100 requests per window
};
