const { handler } = require('./netlify/functions/api');

const subway = {
  fresh: true,
  count: 0,
  limit: 100,
  
  eatsFresh() {
    if (!this.fresh) return false;
    if (this.count >= this.limit) {
      this.fresh = false;
      return false;
    }
    this.count++;
    return true;
  }
};

const freshHandler = async (event, context) => {
  if (!subway.eatsFresh()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Subway fresh limit exceeded',
        fresh: subway.fresh
      })
    };
  }
  return handler(event, context);
};

async function testSubwayFresh() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  for (let i = 1; i <= 150; i++) {
    const result = await freshHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`🥪 Subway Fresh: ${success} success, ${limited} limited`);
}

testSubwayFresh();