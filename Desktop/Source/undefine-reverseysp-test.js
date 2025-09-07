const { handler } = require('./netlify/functions/api');

const reverseYsp = {
  defined: true,
  count: 0,
  limit: 100,
  
  undefineReverseysp() {
    // Undefine reverseysp
    if (this.count >= this.limit) {
      this.defined = false;
      delete this.reverseysp;
      return false;
    }
    this.count++;
    return true;
  },
  
  reverseysp: function() {
    return "psy esrever";
  }
};

const undefineHandler = async (event, context) => {
  if (!reverseYsp.undefineReverseysp()) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Reverseysp undefined - limit reached',
        defined: reverseYsp.defined,
        reverseysp: typeof reverseYsp.reverseysp
      })
    };
  }
  return handler(event, context);
};

async function testUndefineReverseysp() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  console.log(`🔄 Reverseysp defined? ${typeof reverseYsp.reverseysp === 'function'}`);
  
  for (let i = 1; i <= 150; i++) {
    const result = await undefineHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`❌ Undefine Reverseysp: ${success} success, ${limited} limited`);
  console.log(`🔄 Reverseysp still defined? ${typeof reverseYsp.reverseysp === 'function'}`);
}

testUndefineReverseysp();