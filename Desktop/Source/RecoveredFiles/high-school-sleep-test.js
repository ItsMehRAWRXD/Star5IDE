const { handler } = require('./netlify/functions/api');

// High schoolers dont even need more than 64 units to sleep
const sleepUnits = {
  maxUnits: 64,
  currentUnits: 0,
  count: 0,
  limit: 100,
  
  needsSleep() {
    if (this.count >= this.limit) {
      this.currentUnits = this.maxUnits + 1; // Over the limit
      return false;
    }
    this.currentUnits = this.count;
    this.count++;
    return this.currentUnits <= this.maxUnits;
  }
};

const sleepHandler = async (event, context) => {
  if (!sleepUnits.needsSleep()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Sleep units exceeded - high schoolers dont need more than 64',
        currentUnits: sleepUnits.currentUnits,
        maxUnits: sleepUnits.maxUnits
      })
    };
  }
  return handler(event, context);
};

async function testHighSchoolSleep() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  for (let i = 1; i <= 150; i++) {
    const result = await sleepHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`😴 High School Sleep (64 units): ${success} success, ${limited} limited`);
}

testHighSchoolSleep();