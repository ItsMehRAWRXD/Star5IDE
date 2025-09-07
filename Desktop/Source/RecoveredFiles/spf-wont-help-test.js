const { handler } = require('./netlify/functions/api');

const spf = {
  protection: false,
  count: 0,
  limit: 100,
  
  wontHelp() {
    // SPF isn't gonna help lols
    if (this.count >= this.limit) {
      this.protection = false;
      return false;
    }
    this.count++;
    return true;
  }
};

const spfHandler = async (event, context) => {
  if (!spf.wontHelp()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'SPF protection failed - wont help lols',
        protection: spf.protection
      })
    };
  }
  return handler(event, context);
};

async function testSpfWontHelp() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  for (let i = 1; i <= 150; i++) {
    const result = await spfHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`🧴 SPF Won't Help: ${success} success, ${limited} limited`);
}

testSpfWontHelp();