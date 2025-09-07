const { handler } = require('./netlify/functions/api');

const limiter = { c: 0, check() { return this.c++ < 100; } };

const finalHandler = async (event, context) => {
  if (!limiter.check()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Rate limited' })
    };
  }
  return handler(event, context);
};

async function run() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let s = 0, l = 0;
  
  for (let i = 1; i <= 150; i++) {
    const r = await finalHandler(event, {});
    if (r.statusCode === 200) s++;
    else if (r.statusCode === 429) l++;
  }
  
  console.log(`Final: ${s} success, ${l} limited`);
}

run();