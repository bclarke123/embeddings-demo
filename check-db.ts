import { db } from "./src/db";
import { scripts, scriptChunks } from "./src/db/schema";

async function checkDB() {
  try {
    const allScripts = await db.select().from(scripts);
    console.log("Scripts:", allScripts);
    
    const allChunks = await db.select().from(scriptChunks);
    console.log("Script chunks:", allChunks.length);
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkDB();