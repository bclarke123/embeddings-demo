// Test script for Phase 1 improvements
const BASE_URL = "http://localhost:3000";

async function testAPI(endpoint: string, method: string, body?: any) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = await response.json().catch(() => null);
    return { 
      status: response.status, 
      data, 
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok 
    };
  } catch (error) {
    console.log(`   ❌ Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { error: error instanceof Error ? error.message : 'Unknown error', status: 0 };
  }
}

async function runTests() {
  console.log("🧪 Testing Phase 1 Improvements\n");

  // Test 1: Validation - Invalid upload
  console.log("1. Testing validation (should fail)...");
  const invalidUpload = await testAPI('/api/scripts', 'POST', { title: '', content: 'too short' });
  console.log(`   Status: ${invalidUpload.status}, Data: ${JSON.stringify(invalidUpload.data)}`);
  console.log(`   ✅ Validation working: ${invalidUpload.status === 400 ? 'YES' : 'NO'}\n`);

  // Test 2: Rate limiting headers
  console.log("2. Testing rate limiting headers...");
  const validRequest = await testAPI('/api/scripts', 'GET');
  console.log(`   Status: ${validRequest.status}`);
  console.log(`   Rate limit headers: ${validRequest.headers?.['x-ratelimit-limit'] ? 'YES' : 'NO'}`);
  console.log(`   Remaining: ${validRequest.headers?.['x-ratelimit-remaining']}\n`);

  // Test 3: Error handling
  console.log("3. Testing error handling...");
  const invalidParam = await testAPI('/api/scripts/invalid', 'DELETE');
  console.log(`   Status: ${invalidParam.status}, Error: ${invalidParam.data?.error}`);
  console.log(`   ✅ Error handling working: ${invalidParam.status === 400 ? 'YES' : 'NO'}\n`);

  // Test 4: Search validation
  console.log("4. Testing search validation...");
  const invalidSearch = await testAPI('/api/search', 'POST', { query: '', limit: 100 });
  console.log(`   Status: ${invalidSearch.status}, Error: ${invalidSearch.data?.error}`);
  console.log(`   ✅ Search validation working: ${invalidSearch.status === 400 ? 'YES' : 'NO'}\n`);

  // Test 5: Valid operations still work
  console.log("5. Testing valid operations...");
  const scripts = await testAPI('/api/scripts', 'GET');
  console.log(`   Get scripts status: ${scripts.status}`);
  console.log(`   ✅ Valid operations working: ${scripts.status === 200 ? 'YES' : 'NO'}\n`);

  console.log("🎉 Phase 1 testing complete!");
}

runTests().catch(console.error);