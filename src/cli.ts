#!/usr/bin/env bun
import { generateEmbedding } from "./lib/gemini";
import { ScriptService } from "./services/script-service";
import { SearchService } from "./services/search-service";
import { db } from "./db";
import { scriptChunks, scripts } from "./db/schema";
import { sql } from "drizzle-orm";

const args = Bun.argv.slice(2);
const command = args[0];

// Initialize services
const scriptService = new ScriptService();
const searchService = new SearchService();

if (!command || command === "help") {
  console.log(`
Usage:
  bun src/cli.ts embed <text>                    Generate embedding for text
  bun src/cli.ts query <text> [limit]            Find similar embeddings in PostgreSQL
  bun src/cli.ts upload <file> <title> [chunk]   Upload file, chunk it, and store in PostgreSQL
  bun src/cli.ts list                            List all uploaded scripts
  bun src/cli.ts delete <id>                     Delete a script by ID
  bun src/cli.ts help                            Show this help message

Options for upload:
  file:   Path to text file
  title:  Title for the script/document
  chunk:  Chunk size (default: 800)
`);
  process.exit(0);
}

try {
  switch (command) {
    case "embed": {
      const text = args.slice(1).join(" ");
      if (!text) {
        console.error("Error: Please provide text to embed");
        process.exit(1);
      }
      
      console.log("Generating embedding...");
      const embedding = await generateEmbedding(text);
      console.log(`Embedding (${embedding.length} dimensions):`);
      console.log(JSON.stringify(embedding.slice(0, 10)) + "...");
      break;
    }
    
    case "list": {
      const allScripts = await scriptService.getAllScripts();
      
      if (allScripts.length === 0) {
        console.log("No scripts uploaded yet.");
      } else {
        console.log("\nUploaded scripts:");
        for (const script of allScripts) {
          // Get chunk count for each script
          const [chunkInfo] = await db.select({
            chunkCount: sql<number>`count(*)`.as('chunk_count')
          })
          .from(scriptChunks)
          .where(sql`${scriptChunks.scriptId} = ${script.id}`);
          
          console.log(`\n- ID: ${script.id}`);
          console.log(`  Title: ${script.title}`);
          console.log(`  Chunks: ${chunkInfo?.chunkCount || 0}`);
          console.log(`  Uploaded: ${script.uploadedAt}`);
        }
      }
      break;
    }
    
    case "query": {
      const lastArg = args[args.length - 1];
      const queryText = args.slice(1, -1).join(" ") || args[1];
      const limit = lastArg ? parseInt(lastArg) : 5;
      
      if (!queryText) {
        console.error("Error: Please provide query text");
        process.exit(1);
      }
      
      console.log("Searching...");
      const response = await searchService.search({ query: queryText, limit });
      
      if (response.results.length === 0) {
        console.log("No results found. Upload some documents first with 'upload' command.");
        break;
      }
      
      console.log(`\nTop ${response.results.length} results${response.cached ? ' (cached)' : ''}:`);
      response.results.forEach((result, i) => {
        console.log(`\n${i + 1}. ${result.scriptTitle}`);
        console.log(`   Similarity: ${(result.avgSimilarity * 100).toFixed(2)}%`);
        console.log(`   Text: ${result.content.substring(0, 200)}${result.content.length > 200 ? '...' : ''}`);
      });
      break;
    }
    
    case "upload": {
      const filePath = args[1];
      const title = args[2];
      const chunkSizeArg = args[3];
      const chunkSize = chunkSizeArg ? parseInt(chunkSizeArg) : 800;
      
      if (!filePath || !title) {
        console.error("Error: Please provide file path and title");
        process.exit(1);
      }
      
      // Read file
      const file = Bun.file(filePath);
      const exists = await file.exists();
      
      if (!exists) {
        console.error(`Error: File not found: ${filePath}`);
        process.exit(1);
      }
      
      const content = await file.text();
      console.log(`Read file: ${filePath} (${content.length} characters)`);
      
      // Use the script service to handle the upload with custom chunk options
      const result = await scriptService.createScript(
        { title, content },
        { chunkSize, overlap: 100 }
      );
      
      if (result.success) {
        console.log(`\nSuccessfully uploaded "${title}"`);
        console.log(`Script ID: ${result.scriptId}`);
        console.log(`Chunks created: ${result.chunksCreated}/${result.totalChunks}`);
        if (result.errors && result.errors.length > 0) {
          console.log("\nWarnings:");
          result.errors.forEach(error => console.log(`  - ${error}`));
        }
      } else {
        console.error(`\nFailed to upload "${title}"`);
        if (result.errors) {
          console.error("Errors:");
          result.errors.forEach(error => console.error(`  - ${error}`));
        }
      }
      break;
    }
    
    case "delete": {
      const scriptIdArg = args[1];
      const scriptId = scriptIdArg ? parseInt(scriptIdArg) : NaN;
      
      if (!scriptId || isNaN(scriptId)) {
        console.error("Error: Please provide a valid script ID");
        process.exit(1);
      }
      
      // Check if script exists
      const [script] = await db.select().from(scripts).where(sql`${scripts.id} = ${scriptId}`);
      if (!script) {
        console.error(`Error: Script with ID ${scriptId} not found`);
        process.exit(1);
      }
      
      console.log(`Deleting script "${script.title}" (ID: ${scriptId})...`);
      await scriptService.deleteScript(scriptId);
      console.log("Script deleted successfully");
      break;
    }
    
    default:
      console.error(`Unknown command: ${command}`);
      console.log("Run 'bun src/cli.ts help' for usage information");
      process.exit(1);
  }
  
  process.exit(0);
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}