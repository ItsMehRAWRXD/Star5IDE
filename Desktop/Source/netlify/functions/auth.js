const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// User model (simplified for Netlify Functions)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  subscription: { type: String, default: 'free' },
  createdAt: { type: Date, default: Date.now }
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

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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
    
    const User = mongoose.model('User', userSchema);
    const path = event.path.replace('/.netlify/functions/auth', '').replace('/api/auth', '');
    const body = event.body ? JSON.parse(event.body) : {};

    if (event.httpMethod === 'POST') {
      if (path === '/register' || path === '/register/') {
        const { email, password } = body;

        if (!email || !password) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Email and password are required' })
          };
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'User already exists' })
          };
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const user = new User({
          email,
          password: hashedPassword
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
          { userId: user._id, email: user.email },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '24h' }
        );

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            message: 'User registered successfully',
            token,
            user: {
              id: user._id,
              email: user.email,
              subscription: user.subscription
            }
          })
        };
      }

      if (path === '/login' || path === '/login/') {
        const { email, password } = body;

        if (!email || !password) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Email and password are required' })
          };
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Invalid credentials' })
          };
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Invalid credentials' })
          };
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user._id, email: user.email },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '24h' }
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            message: 'Login successful',
            token,
            user: {
              id: user._id,
              email: user.email,
              subscription: user.subscription
            }
          })
        };
      }
    }

    if (event.httpMethod === 'GET') {
      if (path === '/profile' || path === '/profile/') {
        // Get token from Authorization header
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Access token required' })
          };
        }

        const token = authHeader.substring(7);
        
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          const user = await User.findById(decoded.userId).select('-password');
          
          if (!user) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'User not found' })
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              user: {
                id: user._id,
                email: user.email,
                subscription: user.subscription,
                createdAt: user.createdAt
              }
            })
          };
        } catch (err) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Invalid token' })
          };
        }
      }
    }

    // Default response for unknown endpoints
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: 'Endpoint not found',
        availableEndpoints: ['/register', '/login', '/profile'],
        message: 'Check the API documentation for available endpoints'
      })
    };

  } catch (error) {
    console.error('Auth function error:', error);
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
