const { handler } = require('./netlify/functions/api');

// .NET-style reflection watcher
const ReflectionWatcher = {
  assemblies: new Map(),
  types: new Map(),
  
  loadAssembly(name, obj) {
    this.assemblies.set(name, obj);
    return this;
  },
  
  getType(name) {
    return this.types.get(name) || null;
  },
  
  invoke(typeName, methodName, ...args) {
    const type = this.getType(typeName);
    if (type && type[methodName]) {
      return type[methodName](...args);
    }
    return null;
  }
};

// Rate limiter as .NET-style type
const RateLimiterType = {
  _count: 0,
  _limit: 100,
  
  IsAllowed() {
    if (this._count >= this._limit) return false;
    this._count++;
    return true;
  },
  
  Reset() {
    this._count = 0;
  }
};

// Register types
ReflectionWatcher.types.set('RateLimiter', RateLimiterType);

const reflectionHandler = async (event, context) => {
  const allowed = ReflectionWatcher.invoke('RateLimiter', 'IsAllowed');
  
  if (!allowed) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: '.NET Reflection Rate Limited' })
    };
  }
  
  return handler(event, context);
};

async function testReflection() {
  const event = { httpMethod: 'GET', path: '/health', headers: {} };
  let success = 0, limited = 0;
  
  for (let i = 1; i <= 150; i++) {
    const result = await reflectionHandler(event, {});
    if (result.statusCode === 200) success++;
    else if (result.statusCode === 429) limited++;
  }
  
  console.log(`🔍 .NET Reflection Test: ${success} success, ${limited} limited`);
}

testReflection();