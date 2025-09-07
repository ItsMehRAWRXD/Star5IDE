const { handler } = require('./netlify/functions/api');

// Pure JS rate limiter without memcpy operations
const rateLimiter = {
  requests: {},
  windowMs: 60000,
  maxRequests: 100,
  
  isAllowed(ip = 'test-ip') {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests[ip]) {
      this.requests[ip] = [];
    }
    
    // Filter without memcpy - create new array
    const validRequests = [];
    for (let i = 0; i < this.requests[ip].length; i++) {
      if (this.requests[ip][i] > windowStart) {
        validRequests[validRequests.length] = this.requests[ip][i];
      }
    }
    
    this.requests[ip] = validRequests;
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests[validRequests.length] = now;
    return true;
  }
};

const rateLimitedHandler = async (event, context) => {
  const clientIp = event.headers['x-forwarded-for'] || 'test-ip';
  
  if (!rateLimiter.isAllowed(clientIp)) {
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Retry-After': '60'
      },
      body: JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded'
      })
    };
  }
  
  return handler(event, context);
};

async function testNoMemcpy() {
  console.log('🧪 Testing without memcpy operations...\n');
  
  const event = {
    httpMethod: 'GET',
    path: '/health',
    headers: { 'x-forwarded-for': '192.168.1.1' }
  };
  
  let successCount = 0;
  let rateLimitedCount = 0;
  
  for (let i = 1; i <= 150; i++) {
    const result = await rateLimitedHandler(event, {});
    
    if (result.statusCode === 200) {
      successCount++;
    } else if (result.statusCode === 429) {
      rateLimitedCount++;
      if (rateLimitedCount === 1) {
        console.log(`🚫 First 429 at request ${i}`);
      }
    }
    
    if (i % 25 === 0) {
      console.log(`📊 Request ${i}: Success=${successCount}, Limited=${rateLimitedCount}`);
    }
  }
  
  console.log(`\n✅ Final: ${successCount} success, ${rateLimitedCount} rate-limited`);
  console.log(`🎯 No-memcpy rate limiting ${rateLimitedCount > 0 ? 'WORKING' : 'NOT WORKING'}`);
}

testNoMemcpy();