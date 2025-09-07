const { handler } = require('./netlify/functions/api');

const wontWork = {
  working: false,
  count: 0,
  limit: 100,
  
  tryToWork() {
    // That won't work
    if (this.count >= this.limit) {
      this.working = false;
      return false;
    }
    this.count++;
    return !this.working; // Returns true because it won't work
  }
};

const brokenHandler = async (event, context) => {
  if (!wontWork.tryToWork()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'That wont work - broken by design',
        working: wontWork.working
      })
    };
  }
  return handler(event, context);
};

async function testWontWork() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  for (let i = 1; i <= 150; i++) {
    const result = await brokenHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`❌ Won't Work: ${success} success, ${limited} limited`);
}

testWontWork();