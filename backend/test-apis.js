/**
 * Test script for new API endpoints
 * Run: node test-apis.js
 */

const BASE_URL = 'http://localhost:3001';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(name, method, url, body = null) {
  try {
    log(`\n🧪 Testing: ${name}`, 'blue');
    log(`   ${method} ${url}`, 'yellow');
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
      log(`   Body: ${JSON.stringify(body)}`, 'yellow');
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      log(`   ✅ Success (${response.status})`, 'green');
      log(`   Response: ${JSON.stringify(data, null, 2)}`, 'green');
      return { success: true, data };
    } else {
      log(`   ❌ Failed (${response.status})`, 'red');
      log(`   Error: ${JSON.stringify(data, null, 2)}`, 'red');
      return { success: false, error: data };
    }
  } catch (error) {
    log(`   ❌ Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n═══════════════════════════════════════════════════════', 'blue');
  log('   API Endpoint Tests', 'blue');
  log('═══════════════════════════════════════════════════════\n', 'blue');
  
  // Test calculation endpoints (don't require Firebase)
  await testEndpoint(
    'SKU Price Calculation',
    'POST',
    `${BASE_URL}/api/skus/calculate`,
    { quantity: 5, unitPrice: 10.5 }
  );
  
  await testEndpoint(
    'Order Totals Calculation',
    'POST',
    `${BASE_URL}/api/orders/calculate-totals`,
    {
      items: [
        { price: 10, quantity: 2 },
        { price: 15.5, quantity: 3 }
      ]
    }
  );
  
  await testEndpoint(
    'Stock Total Calculation',
    'POST',
    `${BASE_URL}/api/stock/calculate-total`,
    {
      products: [
        { price: 20, quantity: 5 },
        { price: 30, quantity: 3 }
      ]
    }
  );
  
  // Test with invalid data
  await testEndpoint(
    'SKU Calculate - Missing quantity',
    'POST',
    `${BASE_URL}/api/skus/calculate`,
    { unitPrice: 10 }
  );
  
  await testEndpoint(
    'SKU Calculate - Missing unitPrice',
    'POST',
    `${BASE_URL}/api/skus/calculate`,
    { quantity: 5 }
  );
  
  log('\n═══════════════════════════════════════════════════════', 'blue');
  log('   Tests Complete', 'blue');
  log('═══════════════════════════════════════════════════════\n', 'blue');
  log('Note: Firebase-dependent endpoints require valid userId and Firebase credentials', 'yellow');
  log('      Test those endpoints manually with real user IDs from your Firebase database\n', 'yellow');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ fetch is not available. Please use Node.js 18+ or install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);

