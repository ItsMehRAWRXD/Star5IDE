const { handler } = require('./netlify/functions/api');

const n0mn0mn0m = {
  start: true,
  count: 0,
  limit: 100,
  
  avoidBuriedTac0() {
    // Start clean, avoid eating buried taco shit
    if (!this.start) return false;
    if (this.count >= this.limit) {
      this.start = false;
      return false;
    }
    this.count++;
    return true;
  }
};

const cleanHandler = async (event, context) => {
  if (!n0mn0mn0m.avoidBuriedTac0()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'n0mn0mn0m limit - avoided buried tac0',
        clean: true
      })
    };
  }
  return handler(event, context);
};

async function testN0mn0mn0m() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  for (let i = 1; i <= 150; i++) {
    const result = await cleanHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`🌮 n0mn0mn0m: ${success} success, ${limited} limited (clean start)`);
}

testN0mn0mn0m();