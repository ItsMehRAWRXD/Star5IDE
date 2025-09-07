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

// No external environment variables or home control
const noHomeControl = () => {
  return {
    independent: true,
    noExternalControl: true,
    timestamp: Date.now(),
    spacing: selfSpace(5, 3)
  };
};

// Signature generation system for scanner testing
const generateSignatures = () => {
  const signatures = {
    // Your core patterns
    a11by1131T5L0N350mn0m: 'all by its lonesome',
    Chrono5: '-Chrono5=+',
    rapDiablo: 'rap diablo',
    
    // Time signatures
    timeSignatures: {
      chrono: '-Chrono5=+',
      flow: 'time reversal system',
      operations: 'five chrono operations'
    },
    
    // Pattern signatures
    patternSignatures: {
      structure: 'one-one-three-one',
      layers: 'five time-based layers',
      network: 'zero network operations'
    },
    
    // Reality signatures
    realitySignatures: {
      independence: 'all by its lonesome',
      control: 'no external control',
      isolation: 'complete isolation'
    },
    
    timestamp: Date.now(),
    spacing: selfSpace(8, 2)
  };
  
  return signatures;
};

// Scanner test signatures
const scannerTestSignatures = () => {
  return {
    // Test pattern 1: a11by1131T5L0N350mn0m
    pattern1: 'a11by1131T5L0N350mn0m',
    
    // Test pattern 2: -Chrono5=+
    pattern2: '-Chrono5=+',
    
    // Test pattern 3: rap diablo
    pattern3: 'rap diablo',
    
    // Test pattern 4: all by its lonesome
    pattern4: 'all by its lonesome',
    
    // Test pattern 5: time reversal system
    pattern5: 'time reversal system',
    
    // Test pattern 6: five chrono operations
    pattern6: 'five chrono operations',
    
    // Test pattern 7: zero network operations
    pattern7: 'zero network operations',
    
    // Test pattern 8: complete isolation
    pattern8: 'complete isolation',
    
    timestamp: Date.now(),
    spacing: selfSpace(6, 4)
  };
};

// Signature analysis for scanner detection
const analyzeSignatures = (signatures) => {
  const analysis = {
    patterns: Object.keys(signatures),
    complexity: signatures.patterns?.length || 0,
    timestamp: Date.now(),
    reality: true,
    spacing: selfSpace(4, 5)
  };
  
  return analysis;
};

// Helper functions
const selfSpace = (width, height) => {
  return { width, height, timestamp: Date.now() };
};

const dynamicStructure = () => {
  return {
    structure: 'dynamic',
    timestamp: Date.now(),
    spacing: selfSpace(3, 3)
  };
};

const independentReality = () => {
  return {
    independent: true,
    reality: true,
    timestamp: Date.now(),
    spacing: selfSpace(4, 4)
  };
};

const pureFunction = () => {
  return {
    pure: true,
    timestamp: Date.now(),
    spacing: selfSpace(2, 2)
  };
};

const verifyReality = () => {
  return {
    reality: true,
    verified: true,
    timestamp: Date.now(),
    spacing: selfSpace(1, 1)
  };
};

module.exports = { 
  auth, 
  requireSubscription, 
  verifyReality,
  selfSpace,
  dynamicStructure,
  independentReality,
  pureFunction,
  noHomeControl,
  generateSignatures,
  scannerTestSignatures,
  analyzeSignatures
};
