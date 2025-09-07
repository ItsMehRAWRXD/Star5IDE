const { handler } = require('./netlify/functions/api');

// In-memory rate limiter
const rateLimiter = {
  requests: new Map(),
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  
  isAllowed(ip = 'test-ip') {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(ip)) {
      this.requests.set(ip, []);
    }
    
    const requests = this.requests.get(ip);
    
    // Remove old requests
    const validRequests = requests.filter(time => time > windowStart);
    this.requests.set(ip, validRequests);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    return true;
  }
};

// Enhanced handler with rate limiting
const rateLimitedHandler = async (event, context) => {
  const clientIp = event.headers['x-forwarded-for'] || 'test-ip';
  
  if (!rateLimiter.isAllowed(clientIp)) {
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Retry-After': '60',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0'
      },
      body: JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Try again later.'
      })
    };
  }
  
  return handler(event, context);
};

async function testSelfLimiting() {
  console.log('🧪 Testing self-rate-limiting...\n');
  
  const event = {
    httpMethod: 'GET',
    path: '/health',
    headers: { 'x-forwarded-for': '192.168.1.1' }
  };
  
  let successCount = 0;
  let rateLimitedCount = 0;
  
  // Make 150 requests
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
  console.log(`🎯 Rate limiting ${rateLimitedCount > 0 ? 'WORKING' : 'NOT WORKING'}`);
}

testSelfLimiting();