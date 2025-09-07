module.exports = {
  PORT: process.env.PORT || 3001,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://garrettaosborne_db_user:bibbles11@cluster0.sjccoyd.mongodb.net/',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || 'your_sendgrid_key',
  SENDGRID_USERNAME: process.env.SENDGRID_USERNAME || 'your_sendgrid_username',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@yourcompany.com',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3001'
};
