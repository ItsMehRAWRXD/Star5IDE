const { handler } = require('./netlify/functions/api');

const sitter = {
  sitting: true,
  count: 0,
  limit: 100,
  
  sitsAllDay() {
    // Probably isn't defined since it just sits all day
    if (!this.sitting) return false;
    if (this.count >= this.limit) {
      this.sitting = false;
      return false;
    }
    this.count++;
    return true;
  }
};

const sittingHandler = async (event, context) => {
  if (!sitter.sitsAllDay()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Sitting all day limit - too sedentary',
        sitting: sitter.sitting,
        note: 'probably not defined since it just sits'
      })
    };
  }
  return handler(event, context);
};

async function testSittingAllDay() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  for (let i = 1; i <= 150; i++) {
    const result = await sittingHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`🪑 Sitting All Day: ${success} success, ${limited} limited`);
}

testSittingAllDay();