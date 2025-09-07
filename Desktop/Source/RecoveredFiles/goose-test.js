const { handler } = require('./netlify/functions/api');

const goose = { 
  mon: 12, 
  reverse: 21, 
  count: 0, 
  check() { 
    if (this.count >= 100) return false; 
    this.count++; 
    return true; 
  } 
};

const gooseHandler = async (event, context) => {
  if (!goose.check()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Goose limited', mon: goose.mon, reverse: goose.reverse })
    };
  }
  return handler(event, context);
};

async function testGoose() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  for (let i = 1; i <= 150; i++) {
    const result = await gooseHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`🪿 Goose (12=21): ${success} success, ${limited} limited`);
}

testGoose();