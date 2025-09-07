const { handler } = require('./netlify/functions/api');

const rateLimiter = {
  requests: {},
  maxRequests: 100,
  
  isAllowed(ip = 'test-ip') {
    if (!this.requests[ip]) this.requests[ip] = 0;
    if (this.requests[ip] >= this.maxRequests) return false;
    this.requests[ip]++;
    return true;
  }
};

const rateLimitedHandler = async (event, context) => {
  if (!rateLimiter.isAllowed()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Too Many Requests' })
    };
  }
  return handler(event, context);
};

async function testConstrained() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  for (let i = 1; i <= 150; i++) {
    const result = await rateLimitedHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`Success: ${success}, Limited: ${limited}`);
}

testConstrained();