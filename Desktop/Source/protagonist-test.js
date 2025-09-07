const { handler } = require('./netlify/functions/api');

const protagonist = {
  hero: true,
  count: 0,
  limit: 100,
  
  protagonize() {
    if (!this.hero) return false;
    if (this.count >= this.limit) {
      this.hero = false;
      return false;
    }
    this.count++;
    return true;
  }
};

const heroHandler = async (event, context) => {
  if (!protagonist.protagonize()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Protagonist limit - hero fallen',
        hero: protagonist.hero
      })
    };
  }
  return handler(event, context);
};

async function testProtagonist() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  for (let i = 1; i <= 150; i++) {
    const result = await heroHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`🦸 Protagonist: ${success} success, ${limited} limited`);
}

testProtagonist();