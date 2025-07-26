// Test the improved rate limiting
const BASE_URL = "http://localhost:3000";

async function testRateLimits() {
  console.log("🚫 Testing Improved Rate Limiting\n");

  // Test multiple searches quickly
  console.log("Testing search rate limits (should allow multiple requests):");
  
  for (let i = 1; i <= 5; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `test search ${i}`, limit: 5 })
      });
      
      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
      const rateLimitLimit = response.headers.get('x-ratelimit-limit');
      
      console.log(`   Search ${i}: ${response.status} - ${rateLimitRemaining}/${rateLimitLimit} remaining`);
      
      if (response.status === 429) {
        console.log(`   ❌ Rate limited on request ${i}`);
        break;
      }
    } catch (error) {
      console.log(`   ❌ Error on request ${i}:`, error);
    }
    
    // Small delay between requests
    await Bun.sleep(100);
  }
  
  console.log("\n✅ Rate limiting test complete!");
  console.log("New rate limits:");
  console.log("   • General API: 500 requests per 15 minutes");
  console.log("   • Search: 100 requests per minute");
  console.log("   • Upload: 25 requests per hour");
}

testRateLimits().catch(console.error);