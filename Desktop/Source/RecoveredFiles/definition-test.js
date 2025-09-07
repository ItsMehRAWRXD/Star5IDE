const { handler } = require('./netlify/functions/api');

// Check if "protagonize" gets defined
const definer = {
  count: 0,
  limit: 100,
  
  protagonize() {
    // Define: to make the main character or hero
    if (this.count >= this.limit) return false;
    this.count++;
    return true;
  },
  
  checkDefinition() {
    return typeof this.protagonize === 'function';
  }
};

const definitionHandler = async (event, context) => {
  if (!definer.protagonize()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Definition limit exceeded',
        defined: definer.checkDefinition(),
        definition: 'protagonize: to make the main character or hero'
      })
    };
  }
  return handler(event, context);
};

async function testDefinition() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  console.log(`📖 Is "protagonize" defined? ${definer.checkDefinition()}`);
  
  for (let i = 1; i <= 150; i++) {
    const result = await definitionHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`📚 Definition Test: ${success} success, ${limited} limited`);
}

testDefinition();