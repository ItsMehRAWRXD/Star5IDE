const { handler } = require('./netlify/functions/api');

const reflect = { 
  mirror: function(obj) { return Object.assign({}, obj); },
  count: 0,
  limit: 100,
  check() { 
    const state = this.mirror({ count: this.count, limit: this.limit });
    if (state.count >= state.limit) return false;
    this.count++;
    return true;
  }
};

const reflectiveHandler = async (event, context) => {
  if (!reflect.check()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Reflective limit reached' })
    };
  }
  return handler(event, context);
};

async function testReflective() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  for (let i = 1; i <= 150; i++) {
    const result = await reflectiveHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`🪞 Reflective: ${success} success, ${limited} limited`);
}

testReflective();