// Test validation specifically
const BASE_URL = "http://localhost:3000";

async function testValidation() {
  console.log("🧪 Testing Validation Only\n");

  // Test validation with completely invalid JSON
  console.log("1. Testing empty title validation...");
  try {
    const response = await fetch(`${BASE_URL}/api/scripts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '', content: 'This is some content that is longer than 10 characters' })
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data)}`);
    console.log(`   ✅ Empty title validation: ${response.status === 400 ? 'WORKING' : 'NOT WORKING'}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}\n`);
  }

  // Wait a moment then test short content
  await Bun.sleep(100);
  
  console.log("2. Testing short content validation...");
  try {
    const response = await fetch(`${BASE_URL}/api/scripts`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Valid Title', content: 'short' })
    });
    
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data)}`);
    console.log(`   ✅ Short content validation: ${response.status === 400 ? 'WORKING' : 'NOT WORKING'}\n`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}\n`);
  }
}

testValidation().catch(console.error);