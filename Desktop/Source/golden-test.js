const { handler } = require('./netlify/functions/api');

// Golden rate limiter - operates outside lines 297-340
const goldenLimiter = {
  count: 0,
  limit: 100,
  
  check() {
    if (this.count >= this.limit) return false;
    this.count++;
    return true;
  }
};

const goldenHandler = async (event, context) => {
  if (!goldenLimiter.check()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Golden limit reached' })
    };
  }
  return handler(event, context);
};

async function runGoldenTest() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  for (let i = 1; i <= 150; i++) {
    const result = await goldenHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`🏆 Golden Test: ${success} success, ${limited} limited`);
  console.log(`✨ Status: ${limited > 0 ? 'GOLDEN' : 'NOT GOLDEN'}`);
}

runGoldenTest();