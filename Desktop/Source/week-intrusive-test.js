const { handler } = require('./netlify/functions/api');

const weekSimulator = {
  days: 7,
  hours: 24,
  minutes: 60,
  count: 0,
  limit: 100,
  
  simulateWeek() {
    // Acts like it's been an entire week
    return this.days * this.hours * this.minutes;
  },
  
  getIntrusive() {
    // Gets all up in your business
    const weekTime = this.simulateWeek();
    if (this.count >= this.limit) return false;
    this.count++;
    return true;
  }
};

const intrusiveHandler = async (event, context) => {
  if (!weekSimulator.getIntrusive()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Week simulation intrusive limit',
        weekMinutes: weekSimulator.simulateWeek()
      })
    };
  }
  return handler(event, context);
};

async function testWeekIntrusive() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  for (let i = 1; i <= 150; i++) {
    const result = await intrusiveHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`📅 Week Intrusive: ${success} success, ${limited} limited`);
}

testWeekIntrusive();