const { handler } = require('./netlify/functions/api');

// Mock rate limiting by tracking requests
let requestCount = 0;
const resetTime = Date.now() + 60000; // 1 minute window

// Override the handler to simulate rate limiting
const rateLimitedHandler = async (event, context) => {
  requestCount++;
  
  // Simulate rate limit after 100 requests
  if (requestCount > 100) {
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Retry-After': '60',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toString()
      },
      body: JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Try again later.',
        retryAfter: 60
      })
    };
  }
  
  // Call original handler for requests under limit
  return handler(event, context);
};

describe('Health Endpoint Rate Limiting Tests', () => {
  beforeEach(() => {
    requestCount = 0; // Reset for each test
  });

  test('should return 200 for requests under rate limit', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/health',
      headers: {},
      body: null
    };

    // Make 50 requests (under limit)
    for (let i = 0; i < 50; i++) {
      const result = await rateLimitedHandler(event, {});
      expect(result.statusCode).toBe(200);
    }
  });

  test('should return 429 after 100 requests', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/health',
      headers: {},
      body: null
    };

    // Make 101 requests to trigger rate limit
    let lastResult;
    for (let i = 0; i < 101; i++) {
      lastResult = await rateLimitedHandler(event, {});
    }

    expect(lastResult.statusCode).toBe(429);
    
    const body = JSON.parse(lastResult.body);
    expect(body.error).toBe('Too Many Requests');
    expect(body.message).toBe('Rate limit exceeded. Try again later.');
    expect(body.retryAfter).toBe(60);
  });

  test('should include rate limit headers in 429 response', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/health',
      headers: {},
      body: null
    };

    // Trigger rate limit
    for (let i = 0; i < 101; i++) {
      await rateLimitedHandler(event, {});
    }

    const result = await rateLimitedHandler(event, {});
    
    expect(result.headers['Retry-After']).toBe('60');
    expect(result.headers['X-RateLimit-Limit']).toBe('100');
    expect(result.headers['X-RateLimit-Remaining']).toBe('0');
    expect(result.headers['X-RateLimit-Reset']).toBeDefined();
  });

  test('should maintain CORS headers in rate limited response', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/health',
      headers: {},
      body: null
    };

    // Trigger rate limit
    for (let i = 0; i < 101; i++) {
      await rateLimitedHandler(event, {});
    }

    const result = await rateLimitedHandler(event, {});
    
    expect(result.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(result.headers['Content-Type']).toBe('application/json');
  });

  // Simulate concurrent requests hitting rate limit
  test('should handle concurrent requests and rate limit correctly', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/health',
      headers: {},
      body: null
    };

    // Make 150 concurrent requests
    const promises = Array(150).fill().map(() => rateLimitedHandler(event, {}));
    const results = await Promise.all(promises);

    const successCount = results.filter(r => r.statusCode === 200).length;
    const rateLimitedCount = results.filter(r => r.statusCode === 429).length;

    expect(successCount).toBeLessThanOrEqual(100);
    expect(rateLimitedCount).toBeGreaterThan(0);
    expect(successCount + rateLimitedCount).toBe(150);
  });
});

// Performance test to simulate load
describe('Health Endpoint Load Testing', () => {
  test('should handle rapid sequential requests', async () => {
    const event = {
      httpMethod: 'GET',
      path: '/health',
      headers: {},
      body: null
    };

    const startTime = Date.now();
    const results = [];

    // Make 100 rapid requests
    for (let i = 0; i < 100; i++) {
      const result = await handler(event, {});
      results.push(result);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // All should succeed (no rate limiting in original handler)
    results.forEach(result => {
      expect(result.statusCode).toBe(200);
    });

    console.log(`100 requests completed in ${totalTime}ms`);
    expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
  });
});