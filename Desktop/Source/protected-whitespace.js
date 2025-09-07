const { handler } = require('./netlify/functions/api');




























const limiter = { count: 0, check() { return this.count++ < 100; } };
const protectedHandler = async (event, context) => {
  if (!limiter.check()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Protected whitespace limit' })
    };
  }
  return handler(event, context);
};
async function testProtected() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  for (let i = 1; i <= 150; i++) {
    const result = await protectedHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  console.log(`Protected: ${success} success, ${limited} limited`);
}
testProtected();