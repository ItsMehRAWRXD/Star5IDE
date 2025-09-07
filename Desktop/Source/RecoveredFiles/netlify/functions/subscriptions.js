const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Subscription model
const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, required: true, enum: ['free', 'start', 'pro', 'business', 'special'] },
  status: { type: String, required: true, enum: ['active', 'cancelled', 'expired'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  features: [{ type: String }],
  price: { type: Number, default: 0 },
  cryptsPerDay: { type: Number, default: 0 },
  accessDuration: { type: String, default: '1 month' }
});

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  
  try {
    const mongoURI = process.env.MONGODB_URI.endsWith('/') 
      ? process.env.MONGODB_URI + 'saas-app'
      : process.env.MONGODB_URI + '/saas-app';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

// Verify JWT token
const verifyToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.substring(7);
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (err) {
    return null;
  }
};

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Connect to database
    await connectDB();
    
    const Subscription = mongoose.model('Subscription', subscriptionSchema);
    const path = event.path.replace('/.netlify/functions/subscriptions', '').replace('/api/subscriptions', '');
    const body = event.body ? JSON.parse(event.body) : {};

    // Verify authentication for all subscription endpoints
    const decoded = verifyToken(event.headers.authorization);
    if (!decoded) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Access token required' })
      };
    }

    if (event.httpMethod === 'GET') {
      if (path === '/my-subscription' || path === '/my-subscription/') {
        // Get user's current subscription
        const subscription = await Subscription.findOne({ 
          userId: decoded.userId, 
          status: 'active' 
        });

        if (!subscription) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              subscription: {
                plan: 'free',
                status: 'active',
                features: ['Basic encryption', 'Limited requests'],
                price: 0,
                cryptsPerDay: 0,
                accessDuration: 'Lifetime'
              }
            })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ subscription })
        };
      }

      if (path === '/plans' || path === '/plans/') {
        // Return available subscription plans based on Cryptify model
        const plans = [
          {
            id: 'start',
            name: 'START',
            price: 29,
            accessDuration: '1 Week Access',
            cryptsPerDay: 5,
            features: [
              'Hidden startup',
              'Undetectable',
              'Semi Private Stub',
              'Output .vbs .bat',
              'Support Included'
            ],
            popular: false
          },
          {
            id: 'pro',
            name: 'PRO',
            price: 59,
            accessDuration: '1 Month Access',
            cryptsPerDay: 10,
            features: [
              'Hidden Startup',
              'Undetectable',
              'Semi Private Stub',
              'Output .vbs .bat',
              'Support Included'
            ],
            popular: true
          },
          {
            id: 'business',
            name: 'BUSINESS',
            price: 249,
            accessDuration: '1 Month Access',
            cryptsPerDay: 10,
            features: [
              'Hidden Startup',
              'Fully Undetectable',
              'Private Stub',
              'Output .vbs .bat .js',
              'Support Included'
            ],
            popular: false
          },
          {
            id: 'special',
            name: 'SPECIAL',
            price: 499,
            accessDuration: '3 Months Access',
            cryptsPerDay: 20,
            features: [
              'Hidden Startup',
              'Fully Undetectable',
              'Private Stub',
              'Output .vbs .bat .js',
              'Custom Options',
              'Support Included'
            ],
            popular: false
          }
        ];

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            plans,
            note: 'Prices can change anytime without any notice.'
          })
        };
      }
    }

    if (event.httpMethod === 'POST') {
      if (path === '/upgrade' || path === '/upgrade/') {
        const { plan } = body;

        if (!plan || !['start', 'pro', 'business', 'special'].includes(plan)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Valid plan required (start, pro, business, or special)' })
          };
        }

        // Cancel current active subscription
        await Subscription.updateMany(
          { userId: decoded.userId, status: 'active' },
          { status: 'cancelled' }
        );

        // Plan configurations
        const planConfigs = {
          start: {
            features: ['Hidden startup', 'Undetectable', 'Semi Private Stub', 'Output .vbs .bat', 'Support Included'],
            price: 29,
            cryptsPerDay: 5,
            accessDuration: '1 Week Access',
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          },
          pro: {
            features: ['Hidden Startup', 'Undetectable', 'Semi Private Stub', 'Output .vbs .bat', 'Support Included'],
            price: 59,
            cryptsPerDay: 10,
            accessDuration: '1 Month Access',
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          },
          business: {
            features: ['Hidden Startup', 'Fully Undetectable', 'Private Stub', 'Output .vbs .bat .js', 'Support Included'],
            price: 249,
            cryptsPerDay: 10,
            accessDuration: '1 Month Access',
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          },
          special: {
            features: ['Hidden Startup', 'Fully Undetectable', 'Private Stub', 'Output .vbs .bat .js', 'Custom Options', 'Support Included'],
            price: 499,
            cryptsPerDay: 20,
            accessDuration: '3 Months Access',
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
          }
        };

        const config = planConfigs[plan];
        const subscription = new Subscription({
          userId: decoded.userId,
          plan,
          features: config.features,
          price: config.price,
          cryptsPerDay: config.cryptsPerDay,
          accessDuration: config.accessDuration,
          endDate: config.endDate
        });

        await subscription.save();

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            message: 'Subscription upgraded successfully',
            subscription: {
              plan: subscription.plan,
              status: subscription.status,
              features: subscription.features,
              price: subscription.price,
              cryptsPerDay: subscription.cryptsPerDay,
              accessDuration: subscription.accessDuration,
              endDate: subscription.endDate
            }
          })
        };
      }
    }

    if (event.httpMethod === 'PUT') {
      if (path === '/cancel' || path === '/cancel/') {
        // Cancel current subscription
        const result = await Subscription.updateMany(
          { userId: decoded.userId, status: 'active' },
          { status: 'cancelled' }
        );

        if (result.modifiedCount === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'No active subscription found' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            message: 'Subscription cancelled successfully',
            note: 'You will continue to have access until the end of your billing period'
          })
        };
      }
    }

    // Default response for unknown endpoints
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: 'Endpoint not found',
        availableEndpoints: ['/my-subscription', '/plans', '/upgrade', '/cancel'],
        message: 'Check the API documentation for available endpoints'
      })
    };

  } catch (error) {
    console.error('Subscriptions function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
