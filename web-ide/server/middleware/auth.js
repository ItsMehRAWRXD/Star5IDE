const AuthService = require('../services/AuthService');

const authService = new AuthService();

// Initialize auth service
authService.initialize();

// Middleware to authenticate requests
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      message: 'Please provide a valid access token in the Authorization header'
    });
  }

  try {
    const validation = await authService.validateToken(token);
    
    if (!validation.valid) {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        message: validation.error
      });
    }

    // Add token info to request
    req.token = validation.token;
    req.tokenId = validation.tokenId;
    req.permissions = validation.permissions;
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      error: 'Token validation failed',
      message: error.message
    });
  }
};

// Middleware to check specific permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.permissions) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
    }

    if (!authService.hasPermission(req.permissions, permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Permission '${permission}' required`
      });
    }

    next();
  };
};

// Middleware for admin-only routes
const requireAdmin = (req, res, next) => {
  if (!req.permissions) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please authenticate first'
    });
  }

  if (!authService.hasPermission(req.permissions, '*')) {
    return res.status(403).json({ 
      error: 'Admin access required',
      message: 'This endpoint requires administrator privileges'
    });
  }

  next();
};

// Middleware for session-based authentication
const authenticateSession = async (req, res, next) => {
  const sessionId = req.params.sessionId || req.body.sessionId;
  const participantId = req.headers['x-participant-id'];

  if (!sessionId) {
    return res.status(400).json({ 
      error: 'Session ID required',
      message: 'Please provide a valid session ID'
    });
  }

  try {
    const sessions = await authService.getSessions();
    const session = sessions.find(s => s.id === sessionId && s.isActive);

    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found',
        message: 'The requested session does not exist or is inactive'
      });
    }

    // Check if participant is in the session
    if (participantId) {
      const participant = session.participants.find(p => p.id === participantId);
      if (!participant) {
        return res.status(403).json({ 
          error: 'Not a session participant',
          message: 'You are not authorized to access this session'
        });
      }
      req.participant = participant;
    }

    req.session = session;
    next();
  } catch (error) {
    return res.status(500).json({ 
      error: 'Session validation failed',
      message: error.message
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const validation = await authService.validateToken(token);
      if (validation.valid) {
        req.token = validation.token;
        req.tokenId = validation.tokenId;
        req.permissions = validation.permissions;
      }
    } catch (error) {
      // Silently ignore token validation errors for optional auth
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireAdmin,
  authenticateSession,
  optionalAuth,
  authService
};