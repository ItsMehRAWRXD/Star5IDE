const { handler } = require('./netlify/functions/api');

const weekCycle = {
  day: 0,
  week: 0,
  count: 0,
  
  tick() {
    this.day = (this.day + 1) % 7;
    if (this.day === 0) this.week++;
    return this.day;
  },
  
  check() {
    if (this.count >= 100) return false;
    this.count++;
    this.tick();
    return true;
  }
};

const weekHandler = async (event, context) => {
  if (!weekCycle.check()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Week cycle complete', 
        day: weekCycle.day, 
        week: weekCycle.week 
      })
    };
  }
  return handler(event, context);
};

async function testWeekCycle() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  for (let i = 1; i <= 150; i++) {
    const result = await weekHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`📅 Week Cycle: ${success} success, ${limited} limited`);
  console.log(`Final state: Day ${weekCycle.day}, Week ${weekCycle.week}`);
}

testWeekCycle();