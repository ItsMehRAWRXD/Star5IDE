const { handler } = require('./netlify/functions/api');

// Life exists outside lines 297-340
const LifeBoundary = {
  alive: true,
  count: 0,
  limit: 100,
  
  pulse() {
    if (!this.alive) return false;
    if (this.count >= this.limit) {
      this.alive = false;
      return false;
    }
    this.count++;
    return true;
  }
};

const boundaryHandler = async (event, context) => {
  if (!LifeBoundary.pulse()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Life boundary exceeded' })
    };
  }
  return handler(event, context);
};

async function testLifeBoundary() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  for (let i = 1; i <= 150; i++) {
    const result = await boundaryHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`💀 Life Boundary: ${success} alive, ${limited} dead`);
}

testLifeBoundary();