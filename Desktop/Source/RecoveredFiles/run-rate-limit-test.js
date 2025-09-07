#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration
const config = {
  url: 'https://your-app.netlify.app/.netlify/functions/api/health',
  // For local testing: 'http://localhost:8888/.netlify/functions/api/health'
  totalRequests: 150,
  concurrency: 10,
  expectedRateLimit: 100
};

// Make HTTP request
function makeRequest(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const endTime = Date.now();
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime: endTime - startTime,
          timestamp: new Date().toISOString()
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        statusCode: 0,
        error: 'Request timeout',
        responseTime: 5000,
        timestamp: new Date().toISOString()
      });
    });
  });
}

// Run concurrent requests
async function runConcurrentRequests(url, totalRequests, concurrency) {
  const results = [];
  const batches = Math.ceil(totalRequests / concurrency);
  
  console.log(`🚀 Starting rate limit test...`);
  console.log(`📊 Total requests: ${totalRequests}`);
  console.log(`⚡ Concurrency: ${concurrency}`);
  console.log(`🎯 Target URL: ${url}`);
  console.log(`📈 Expected rate limit: ${config.expectedRateLimit} requests\n`);
  
  const overallStart = Date.now();
  
  for (let batch = 0; batch < batches; batch++) {
    const batchStart = Date.now();
    const requestsInBatch = Math.min(concurrency, totalRequests - (batch * concurrency));
    
    console.log(`📦 Batch ${batch + 1}/${batches} - ${requestsInBatch} requests`);
    
    const promises = Array(requestsInBatch).fill().map(() => makeRequest(url));
    const batchResults = await Promise.all(promises);
    
    results.push(...batchResults);
    
    const batchTime = Date.now() - batchStart;
    const successCount = batchResults.filter(r => r.statusCode === 200).length;
    const rateLimitedCount = batchResults.filter(r => r.statusCode === 429).length;
    const errorCount = batchResults.filter(r => r.statusCode === 0).length;
    
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   🚫 Rate Limited (429): ${rateLimitedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⏱️  Batch time: ${batchTime}ms\n`);
    
    // Small delay between batches
    if (batch < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const overallTime = Date.now() - overallStart;
  
  // Analyze results
  console.log(`🏁 Test completed in ${overallTime}ms\n`);
  
  const statusCounts = {};
  const responseTimes = [];
  
  results.forEach(result => {
    const status = result.statusCode || 'error';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    if (result.responseTime) {
      responseTimes.push(result.responseTime);
    }
  });
  
  console.log('📊 RESULTS SUMMARY:');
  console.log('==================');
  Object.entries(statusCounts).forEach(([status, count]) => {
    const percentage = ((count / results.length) * 100).toFixed(1);
    console.log(`${status}: ${count} (${percentage}%)`);
  });
  
  if (responseTimes.length > 0) {
    const avgResponseTime = (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2);
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    console.log(`\n⏱️  PERFORMANCE:`);
    console.log(`Average response time: ${avgResponseTime}ms`);
    console.log(`Min response time: ${minResponseTime}ms`);
    console.log(`Max response time: ${maxResponseTime}ms`);
  }
  
  // Rate limiting analysis
  const rateLimitedCount = statusCounts['429'] || 0;
  const successCount = statusCounts['200'] || 0;
  
  console.log(`\n🛡️  RATE LIMITING ANALYSIS:`);
  console.log(`Expected rate limit: ${config.expectedRateLimit} requests`);
  console.log(`Successful requests: ${successCount}`);
  console.log(`Rate limited requests: ${rateLimitedCount}`);
  
  if (rateLimitedCount > 0) {
    console.log(`✅ Rate limiting is working correctly!`);
  } else if (successCount > config.expectedRateLimit) {
    console.log(`⚠️  Rate limiting may not be configured or limit is higher than expected`);
  } else {
    console.log(`ℹ️  All requests succeeded (under rate limit)`);
  }
  
  // Show first few rate limited responses
  const rateLimitedResponses = results.filter(r => r.statusCode === 429).slice(0, 3);
  if (rateLimitedResponses.length > 0) {
    console.log(`\n🚫 SAMPLE RATE LIMITED RESPONSES:`);
    rateLimitedResponses.forEach((response, index) => {
      console.log(`Response ${index + 1}:`);
      console.log(`  Status: ${response.statusCode}`);
      console.log(`  Headers: ${JSON.stringify(response.headers, null, 2)}`);
      if (response.body) {
        try {
          const body = JSON.parse(response.body);
          console.log(`  Body: ${JSON.stringify(body, null, 2)}`);
        } catch {
          console.log(`  Body: ${response.body}`);
        }
      }
      console.log('');
    });
  }
  
  return results;
}

// Main execution
async function main() {
  try {
    await runConcurrentRequests(config.url, config.totalRequests, config.concurrency);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { makeRequest, runConcurrentRequests };