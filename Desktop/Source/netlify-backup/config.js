/**
 * Application Configuration
 * Centralized configuration management for the SaaS Encryption Platform
 */

const config = {
  // Server Configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/saas-encryption',
  MONGODB_OPTIONS: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,
    retryWrites: true,
    w: 'majority'
  },
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  
  // Stripe Configuration
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret',
  STRIPE_CURRENCY: process.env.STRIPE_CURRENCY || 'usd',
  
  // Email Configuration (SendGrid)
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || 'your_sendgrid_key',
  SENDGRID_USERNAME: process.env.SENDGRID_USERNAME || 'your_sendgrid_username',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@yourcompany.com',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'SaaS Encryption Platform',
  
  // Frontend Configuration
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  
  // Security Configuration
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  SLOW_DOWN_WINDOW_MS: parseInt(process.env.SLOW_DOWN_WINDOW_MS) || 15 * 60 * 1000,
  SLOW_DOWN_DELAY_AFTER: parseInt(process.env.SLOW_DOWN_DELAY_AFTER) || 100,
  SLOW_DOWN_DELAY_MS: parseInt(process.env.SLOW_DOWN_DELAY_MS) || 500,
  
  // Encryption Configuration
  ENCRYPTION_ALGORITHM: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
  HASH_ALGORITHM: process.env.HASH_ALGORITHM || 'sha256',
  KEY_LENGTH: parseInt(process.env.KEY_LENGTH) || 256,
  
  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log',
  
  // API Configuration
  API_VERSION: process.env.API_VERSION || 'v1',
  API_PREFIX: process.env.API_PREFIX || '/api',
  
  // CORS Configuration
  CORS_OPTIONS: {
    origin: function (origin, callback) {
      if (!origin || config.ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  // Helmet Configuration
  HELMET_OPTIONS: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }
};

// Validation function
const validateConfig = () => {
  const required = ['JWT_SECRET', 'MONGODB_URI'];
  const missing = required.filter(key => !config[key] || config[key].includes('your_'));
  
  if (missing.length > 0) {
    console.warn(`⚠️  Warning: Missing or default configuration for: ${missing.join(', ')}`);
    if (config.NODE_ENV === 'production') {
      throw new Error(`Production environment requires proper configuration for: ${missing.join(', ')}`);
    }
  }
  
  return true;
};

// Validate configuration on load
validateConfig();

module.exports = config;
