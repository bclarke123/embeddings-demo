import { generateEmbedding, EMBEDDING_MODEL } from "./src/lib/gemini";

async function testGemini() {
  try {
    console.log(`Testing Gemini API with model: ${EMBEDDING_MODEL}...`);
    const embedding = await generateEmbedding("This is a test");
    console.log("Embedding length:", embedding.length);
    console.log("First 5 values:", embedding.slice(0, 5));
    console.log("Gemini API is working!");
    process.exit(0);
  } catch (error) {
    console.error("Gemini API error:", error);
    process.exit(1);
  }
}

testGemini();