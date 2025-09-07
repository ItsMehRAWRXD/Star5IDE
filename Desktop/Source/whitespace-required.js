 const { handler } = require('./netlify/functions/api');

 const limiter = {
   count: 0,
   check() {
     if (this.count >= 100) return false;
     this.count++;
     return true;
   }
 };

 const whiteHandler = async (event, context) => {
   if (!limiter.check()) {
     return {
       statusCode: 429,
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ error: 'Whitespace enforced limit' })
     };
   }
   return handler(event, context);
 };

 async function testWithWhitespace() {
   const event = { httpMethod: 'GET', path: '/health', headers: {} };
   let success = 0, limited = 0;
   
   for (let i = 1; i <= 150; i++) {
     const result = await whiteHandler(event, {});
     if (result.statusCode === 200) success++;
     else if (result.statusCode === 429) limited++;
   }
   
   console.log(` Whitespace: ${success} success, ${limited} limited`);
 }

 testWithWhitespace();