# [CHAR][CHAR] Unified Standards for All Projects

This document establishes the same level of care, monitoring, and quality standards across all projects in the ecosystem.

## [TARGET] Core Principles

### **1. Comprehensive Monitoring**
Every project must have:
- [OK] **Process Monitoring** - CPU, memory, uptime tracking
- [OK] **Health Checks** - Regular system health validation
- [OK] **Error Tracking** - Complete error logging and analysis
- [OK] **Performance Metrics** - Response times, throughput monitoring
- [OK] **Graceful Shutdown** - Clean exit procedures

### **2. Safety & Reliability**
Every project must implement:
- [OK] **Timeout Protection** - All operations have timeouts
- [OK] **Retry Logic** - Automatic retry with exponential backoff
- [OK] **Resource Cleanup** - Prevent memory leaks
- [OK] **Error Recovery** - Continue operation despite errors
- [OK] **Heartbeat Monitoring** - Detect frozen operations

### **3. Documentation & Standards**
Every project must include:
- [OK] **Comprehensive README** - Setup, usage, configuration
- [OK] **API Documentation** - Clear endpoint documentation
- [OK] **Error Codes** - Standardized error responses
- [OK] **Configuration Guide** - Environment setup instructions
- [OK] **Troubleshooting Guide** - Common issues and solutions

## [STATUS] Monitoring Standards

### **Health Check Endpoints**
All projects must provide:
```javascript
GET /health
GET /health-check
GET /status
```

**Response Format:**
```json
{
  "status": "OK|WARNING|ERROR",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600000,
  "memory": {
    "used": "150 MB",
    "total": "512 MB",
    "usagePercent": "29%"
  },
  "cpu": {
    "user": 1234567,
    "system": 987654
  },
  "requests": {
    "total": 1000,
    "errors": 5,
    "errorRate": "0.5%"
  },
  "healthy": true
}
```

### **Logging Standards**
All projects must use structured logging:
```javascript
logger.info('Operation completed', { 
  operationId: 'op_123',
  duration: 1500,
  success: true 
});

logger.error('Operation failed', { 
  operationId: 'op_124',
  error: 'Connection timeout',
  retryCount: 3 
});
```

### **Error Handling Standards**
All projects must implement:
```javascript
// Standard error response format
{
  "success": false,
  "error": {
    "code": "TIMEOUT_ERROR",
    "message": "Operation timed out",
    "details": {
      "operationId": "op_123",
      "timeout": 30000,
      "retryCount": 3
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## [SECURITY] Safety Standards

### **Timeout Configuration**
| Operation Type | Default Timeout | Max Retries | Heartbeat |
|----------------|-----------------|-------------|-----------|
| **File Operations** | 15s | 3 | 5s |
| **Network Requests** | 60s | 3 | 5s |
| **Process Commands** | 60s | 3 | 5s |
| **Database Queries** | 45s | 3 | 5s |
| **AI API Calls** | 120s | 3 | 5s |
| **Archive Operations** | 300s | 2 | 10s |

### **Memory Management**
- **Warning Threshold**: 85% memory usage
- **Critical Threshold**: 95% memory usage
- **Auto GC**: Force garbage collection at 90%
- **Memory Limit**: Monitor and alert on memory growth

### **Resource Limits**
- **Max Active Operations**: 50 concurrent operations
- **Max File Size**: 100MB for file operations
- **Max Request Size**: 10MB for API requests
- **Rate Limiting**: 100 requests per minute per IP

## [FOLDER] Project Structure Standards

### **Required Directories**
```
ProjectName/
[CHAR][CHAR][CHAR] src/                          # Source code
[CHAR]   [CHAR][CHAR][CHAR] monitoring/              # Monitoring systems
[CHAR]   [CHAR][CHAR][CHAR] middleware/              # Express middleware
[CHAR]   [CHAR][CHAR][CHAR] utils/                   # Utility functions
[CHAR]   [CHAR][CHAR][CHAR] routes/                  # API routes
[CHAR][CHAR][CHAR] logs/                        # Log files
[CHAR][CHAR][CHAR] docs/                        # Documentation
[CHAR][CHAR][CHAR] tests/                       # Test files
[CHAR][CHAR][CHAR] package.json                 # Dependencies
[CHAR][CHAR][CHAR] README.md                    # Project documentation
[CHAR][CHAR][CHAR] .env.example                 # Environment template
[CHAR][CHAR][CHAR] docker-compose.yml           # Container configuration
```

### **Required Files**
- [OK] `package.json` - Dependencies and scripts
- [OK] `README.md` - Comprehensive documentation
- [OK] `.env.example` - Environment variable template
- [OK] `src/monitoring/` - Monitoring system
- [OK] `src/middleware/health-check.js` - Health monitoring
- [OK] `src/middleware/process-monitor.js` - Process monitoring
- [OK] `logs/` - Log file directory

## [CHAR][CHAR] Configuration Standards

### **Environment Variables**
All projects must support:
```bash
# Core Configuration
NODE_ENV=development|production|test
PORT=3000
LOG_LEVEL=info|warn|error|debug

# Monitoring Configuration
MONITORING_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
MEMORY_WARNING_THRESHOLD=85
MEMORY_CRITICAL_THRESHOLD=95

# Timeout Configuration
DEFAULT_TIMEOUT=30000
MAX_RETRIES=3
HEARTBEAT_INTERVAL=5000

# Logging Configuration
LOG_RETENTION_DAYS=7
LOG_MAX_SIZE=10MB
LOG_MAX_FILES=5
```

### **Package.json Scripts**
All projects must include:
```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "health": "curl http://localhost:3000/health",
    "monitor": "node src/monitoring/monitor.js",
    "logs": "tail -f logs/combined.log",
    "clean": "rm -rf logs/*.log",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix"
  }
}
```

## [START] Deployment Standards

### **Docker Configuration**
All projects must include:
```dockerfile
# Use Node.js LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### **Health Check Integration**
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    environment:
      - NODE_ENV=production
      - MONITORING_ENABLED=true
```

## [CHAR][CHAR] Performance Standards

### **Response Time Targets**
- **Health Checks**: < 100ms
- **API Endpoints**: < 500ms
- **File Operations**: < 1s
- **Database Queries**: < 2s
- **AI Operations**: < 30s

### **Availability Targets**
- **Uptime**: 99.9% availability
- **Error Rate**: < 1% error rate
- **Recovery Time**: < 30s for automatic recovery
- **Graceful Degradation**: Continue operation with reduced functionality

## [SEARCH] Testing Standards

### **Test Coverage Requirements**
- **Unit Tests**: 80% code coverage
- **Integration Tests**: All API endpoints
- **Health Check Tests**: All monitoring endpoints
- **Error Handling Tests**: All error scenarios
- **Performance Tests**: Load testing for critical paths

### **Test Structure**
```javascript
// Example test structure
describe('Health Check', () => {
  test('should return healthy status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body.healthy).toBe(true);
  });
});
```

## [LIST] Compliance Checklist

### **Project Setup**
- [ ] Comprehensive README.md
- [ ] Environment variable template
- [ ] Docker configuration
- [ ] Health check endpoints
- [ ] Monitoring system
- [ ] Error handling
- [ ] Logging system
- [ ] Test suite
- [ ] Documentation

### **Monitoring**
- [ ] Process monitoring
- [ ] Memory monitoring
- [ ] Health checks
- [ ] Error tracking
- [ ] Performance metrics
- [ ] Graceful shutdown
- [ ] Resource cleanup
- [ ] Timeout protection

### **Safety**
- [ ] Timeout configuration
- [ ] Retry logic
- [ ] Heartbeat monitoring
- [ ] Resource limits
- [ ] Error recovery
- [ ] Memory management
- [ ] Connection tracking
- [ ] Graceful degradation

## [TARGET] Quality Assurance

### **Code Review Checklist**
- [ ] Follows coding standards
- [ ] Includes error handling
- [ ] Has proper logging
- [ ] Includes tests
- [ ] Updates documentation
- [ ] Follows security practices
- [ ] Implements monitoring
- [ ] Handles edge cases

### **Deployment Checklist**
- [ ] All tests pass
- [ ] Health checks working
- [ ] Monitoring active
- [ ] Logs configured
- [ ] Environment variables set
- [ ] Security measures in place
- [ ] Performance targets met
- [ ] Documentation updated

## [CHAR][CHAR] Excellence Standards

Every project in the ecosystem must meet these standards to ensure:
- **Reliability** - Consistent, dependable operation
- **Safety** - Protected against failures and attacks
- **Observability** - Complete visibility into system health
- **Maintainability** - Easy to update and extend
- **Performance** - Meets or exceeds performance targets
- **Documentation** - Clear, comprehensive documentation

**These standards ensure that every project receives the same level of care and attention, creating a robust, reliable ecosystem.** [SUCCESS]
