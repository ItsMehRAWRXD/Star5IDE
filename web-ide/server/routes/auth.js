const express = require('express');
const { authenticateToken, requireAdmin, authService } = require('../middleware/auth');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    }

    const result = await authService.authenticateUser(username, password);
    
    if (!result.success) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: result.user,
      sessionToken: result.sessionToken
    });
  } catch (error) {
    res.status(500).json({
      error: 'Login failed',
      message: error.message
    });
  }
});

// Token generation endpoint (admin only)
router.post('/tokens/generate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      permissions,
      expiresIn,
      maxUses
    } = req.body;

    const token = await authService.generateToken({
      name: name || 'Generated Token',
      description: description || '',
      permissions: permissions || ['read'],
      expiresIn: expiresIn || '30d',
      maxUses: maxUses || null,
      createdBy: req.token.name || 'admin'
    });

    res.json({
      success: true,
      message: 'Token generated successfully',
      token: {
        id: token.id,
        name: token.name,
        description: token.description,
        permissions: token.permissions,
        expiresIn: token.expiresIn,
        maxUses: token.maxUses,
        createdAt: token.createdAt,
        value: token.value // Include the actual token value
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Token generation failed',
      message: error.message
    });
  }
});

// List all tokens (admin only)
router.get('/tokens', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const tokens = await authService.getTokens();
    
    // Remove sensitive token values from response
    const safeTokens = tokens.map(token => ({
      id: token.id,
      name: token.name,
      description: token.description,
      permissions: token.permissions,
      expiresIn: token.expiresIn,
      maxUses: token.maxUses,
      usedCount: token.usedCount,
      createdBy: token.createdBy,
      createdAt: token.createdAt,
      lastUsed: token.lastUsed,
      isActive: token.isActive
    }));

    res.json({
      success: true,
      tokens: safeTokens
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve tokens',
      message: error.message
    });
  }
});

// Revoke token (admin only)
router.delete('/tokens/:tokenId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { tokenId } = req.params;
    const success = await authService.revokeToken(tokenId);

    if (success) {
      res.json({
        success: true,
        message: 'Token revoked successfully'
      });
    } else {
      res.status(404).json({
        error: 'Token not found',
        message: 'The specified token does not exist'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Token revocation failed',
      message: error.message
    });
  }
});

// Create user (admin only)
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role, permissions } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Username, email, and password are required'
      });
    }

    const user = await authService.createUser({
      username,
      email,
      password,
      role: role || 'user',
      permissions: permissions || ['read']
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'User creation failed',
      message: error.message
    });
  }
});

// List users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await authService.getUsers();
    
    // Remove password hashes from response
    const safeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      isActive: user.isActive
    }));

    res.json({
      success: true,
      users: safeUsers
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve users',
      message: error.message
    });
  }
});

// Create coding session
router.post('/sessions', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      language,
      permissions,
      maxParticipants
    } = req.body;

    const session = await authService.createSession({
      name: name || 'Coding Session',
      description: description || '',
      language: language || 'javascript',
      permissions: permissions || ['read', 'write'],
      maxParticipants: maxParticipants || 10,
      createdBy: req.token.name || 'anonymous'
    });

    res.status(201).json({
      success: true,
      message: 'Coding session created successfully',
      session
    });
  } catch (error) {
    res.status(500).json({
      error: 'Session creation failed',
      message: error.message
    });
  }
});

// Join coding session
router.post('/sessions/:sessionId/join', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { name, role } = req.body;

    const result = await authService.joinSession(sessionId, {
      name: name || 'Anonymous',
      role: role || 'participant',
      tokenId: req.tokenId
    });

    if (!result.success) {
      return res.status(400).json({
        error: 'Failed to join session',
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Joined session successfully',
      session: result.session,
      participant: result.participant
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to join session',
      message: error.message
    });
  }
});

// Leave coding session
router.post('/sessions/:sessionId/leave', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { participantId } = req.body;

    const result = await authService.leaveSession(sessionId, participantId);

    if (!result.success) {
      return res.status(400).json({
        error: 'Failed to leave session',
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Left session successfully',
      session: result.session
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to leave session',
      message: error.message
    });
  }
});

// List active sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await authService.getSessions();
    const activeSessions = sessions.filter(s => s.isActive);

    res.json({
      success: true,
      sessions: activeSessions
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve sessions',
      message: error.message
    });
  }
});

// Get session details
router.get('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessions = await authService.getSessions();
    const session = sessions.find(s => s.id === sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'The requested session does not exist'
      });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve session',
      message: error.message
    });
  }
});

// Validate token endpoint
router.get('/validate', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    token: {
      id: req.tokenId,
      permissions: req.permissions
    }
  });
});

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const users = await authService.getUsers();
    const user = users.find(u => u.id === req.token.userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User associated with token not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve user info',
      message: error.message
    });
  }
});

module.exports = router;