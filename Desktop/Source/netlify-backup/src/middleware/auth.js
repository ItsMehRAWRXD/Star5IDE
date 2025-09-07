const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const requireSubscription = (plan) => {
  return (req, res, next) => {
    if (!req.user.subscription.plan === 'free' && plan !== 'free') {
      return res.status(403).json({ 
        message: 'Subscription required for this feature' 
      });
    }
    
    if (req.user.subscription.status !== 'active') {
      return res.status(403).json({ 
        message: 'Active subscription required' 
      });
    }
    
    next();
  };
};

module.exports = { auth, requireSubscription };
