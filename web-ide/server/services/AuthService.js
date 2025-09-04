const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');

class AuthService {
  constructor() {
    this.secretKey = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.tokensFile = path.join(__dirname, '../../data/tokens.json');
    this.usersFile = path.join(__dirname, '../../data/users.json');
    this.sessionsFile = path.join(__dirname, '../../data/sessions.json');
    this.ready = false;
  }

  async initialize() {
    try {
      // Ensure data directory exists
      await fs.ensureDir(path.dirname(this.tokensFile));
      
      // Initialize files if they don't exist
      await this.initializeFiles();
      
      // Create default admin user if none exists
      await this.createDefaultAdmin();
      
      this.ready = true;
      console.log('✅ AuthService initialized');
    } catch (error) {
      console.error('❌ AuthService initialization failed:', error);
      this.ready = false;
    }
  }

  async initializeFiles() {
    const defaultTokens = {
      tokens: [],
      lastUpdated: new Date().toISOString()
    };

    const defaultUsers = {
      users: [],
      lastUpdated: new Date().toISOString()
    };

    const defaultSessions = {
      sessions: [],
      lastUpdated: new Date().toISOString()
    };

    if (!await fs.pathExists(this.tokensFile)) {
      await fs.writeJson(this.tokensFile, defaultTokens, { spaces: 2 });
    }

    if (!await fs.pathExists(this.usersFile)) {
      await fs.writeJson(this.usersFile, defaultUsers, { spaces: 2 });
    }

    if (!await fs.pathExists(this.sessionsFile)) {
      await fs.writeJson(this.sessionsFile, defaultSessions, { spaces: 2 });
    }
  }

  async createDefaultAdmin() {
    const users = await this.getUsers();
    const adminExists = users.some(user => user.role === 'admin');
    
    if (!adminExists) {
      const adminUser = {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@webide.local',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        permissions: ['*'], // All permissions
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true
      };

      users.push(adminUser);
      await this.saveUsers(users);
      console.log('🔑 Default admin user created (username: admin, password: admin123)');
    }
  }

  // Token Management
  async generateToken(options = {}) {
    const {
      name = 'Generated Token',
      description = '',
      permissions = ['read'],
      expiresIn = '30d',
      maxUses = null,
      createdBy = 'system'
    } = options;

    const tokenId = uuidv4();
    const tokenValue = jwt.sign(
      { 
        tokenId, 
        permissions, 
        type: 'access_token',
        iat: Math.floor(Date.now() / 1000)
      },
      this.secretKey,
      { expiresIn }
    );

    const token = {
      id: tokenId,
      value: tokenValue,
      name,
      description,
      permissions,
      expiresIn,
      maxUses,
      usedCount: 0,
      createdBy,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      isActive: true
    };

    const tokens = await this.getTokens();
    tokens.push(token);
    await this.saveTokens(tokens);

    return token;
  }

  async validateToken(tokenValue) {
    try {
      const decoded = jwt.verify(tokenValue, this.secretKey);
      const tokens = await this.getTokens();
      const token = tokens.find(t => t.id === decoded.tokenId && t.isActive);

      if (!token) {
        return { valid: false, error: 'Token not found or inactive' };
      }

      // Check if token has exceeded max uses
      if (token.maxUses && token.usedCount >= token.maxUses) {
        return { valid: false, error: 'Token usage limit exceeded' };
      }

      // Update usage count and last used
      token.usedCount++;
      token.lastUsed = new Date().toISOString();
      await this.saveTokens(tokens);

      return {
        valid: true,
        tokenId: decoded.tokenId,
        permissions: token.permissions,
        token: token
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async revokeToken(tokenId) {
    const tokens = await this.getTokens();
    const tokenIndex = tokens.findIndex(t => t.id === tokenId);
    
    if (tokenIndex !== -1) {
      tokens[tokenIndex].isActive = false;
      tokens[tokenIndex].revokedAt = new Date().toISOString();
      await this.saveTokens(tokens);
      return true;
    }
    return false;
  }

  // User Management
  async createUser(userData) {
    const {
      username,
      email,
      password,
      role = 'user',
      permissions = ['read']
    } = userData;

    const users = await this.getUsers();
    
    // Check if user already exists
    if (users.some(u => u.username === username || u.email === email)) {
      throw new Error('User already exists');
    }

    const user = {
      id: uuidv4(),
      username,
      email,
      password: await bcrypt.hash(password, 10),
      role,
      permissions,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    };

    users.push(user);
    await this.saveUsers(users);
    return user;
  }

  async authenticateUser(username, password) {
    const users = await this.getUsers();
    const user = users.find(u => u.username === username && u.isActive);

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid credentials' };
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    await this.saveUsers(users);

    // Generate session token
    const sessionToken = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role,
        permissions: user.permissions,
        type: 'session_token'
      },
      this.secretKey,
      { expiresIn: '24h' }
    );

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      sessionToken
    };
  }

  // Session Management
  async createSession(sessionData) {
    const {
      name,
      description = '',
      language = 'javascript',
      permissions = ['read', 'write'],
      maxParticipants = 10,
      createdBy
    } = sessionData;

    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      name,
      description,
      language,
      permissions,
      maxParticipants,
      createdBy,
      participants: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      isActive: true,
      files: {},
      terminal: {
        isActive: false,
        history: []
      }
    };

    const sessions = await this.getSessions();
    sessions.push(session);
    await this.saveSessions(sessions);

    return session;
  }

  async joinSession(sessionId, participantData) {
    const sessions = await this.getSessions();
    const session = sessions.find(s => s.id === sessionId && s.isActive);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.participants.length >= session.maxParticipants) {
      return { success: false, error: 'Session is full' };
    }

    const participant = {
      id: uuidv4(),
      ...participantData,
      joinedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    session.participants.push(participant);
    session.lastActivity = new Date().toISOString();
    await this.saveSessions(sessions);

    return { success: true, session, participant };
  }

  async leaveSession(sessionId, participantId) {
    const sessions = await this.getSessions();
    const session = sessions.find(s => s.id === sessionId);

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    session.participants = session.participants.filter(p => p.id !== participantId);
    session.lastActivity = new Date().toISOString();
    await this.saveSessions(sessions);

    return { success: true, session };
  }

  // Permission checking
  hasPermission(userPermissions, requiredPermission) {
    if (userPermissions.includes('*')) {
      return true; // Admin has all permissions
    }
    return userPermissions.includes(requiredPermission);
  }

  // Data persistence
  async getTokens() {
    const data = await fs.readJson(this.tokensFile);
    return data.tokens || [];
  }

  async saveTokens(tokens) {
    const data = {
      tokens,
      lastUpdated: new Date().toISOString()
    };
    await fs.writeJson(this.tokensFile, data, { spaces: 2 });
  }

  async getUsers() {
    const data = await fs.readJson(this.usersFile);
    return data.users || [];
  }

  async saveUsers(users) {
    const data = {
      users,
      lastUpdated: new Date().toISOString()
    };
    await fs.writeJson(this.usersFile, data, { spaces: 2 });
  }

  async getSessions() {
    const data = await fs.readJson(this.sessionsFile);
    return data.sessions || [];
  }

  async saveSessions(sessions) {
    const data = {
      sessions,
      lastUpdated: new Date().toISOString()
    };
    await fs.writeJson(this.sessionsFile, data, { spaces: 2 });
  }

  isReady() {
    return this.ready;
  }
}

module.exports = AuthService;