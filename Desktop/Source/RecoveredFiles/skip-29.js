const { handler } = require('./netlify/functions/api');




























const limiter = { count: 0, limit: 100, check() { if (this.count >= this.limit) return false; this.count++; return true; } };
const skipHandler = async (event, context) => { if (!limiter.check()) { return { statusCode: 429, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Skip 29 limited' }) }; } return handler(event, context); };
async function testSkip29() { const event = { httpMethod: 'GET', path: '/health', headers: {} }; let success = 0, limited = 0; for (let i = 1; i <= 150; i++) { const result = await skipHandler(event, {}); if (result.statusCode === 200) success++; else if (result.statusCode === 429) limited++; } console.log(`Skip 29: ${success} success, ${limited} limited`); }
testSkip29();