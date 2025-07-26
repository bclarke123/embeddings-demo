#!/usr/bin/env bun
// Script to reset the database - removes all data but keeps the schema

import { db } from "./src/db";
import { scripts, scriptChunks, searches } from "./src/db/schema";
import { redis } from "./src/lib/redis";

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

async function resetDatabase() {
  console.log(`${colors.bright}${colors.yellow}⚠️  Database Reset Tool${colors.reset}\n`);
  
  console.log("This will DELETE ALL DATA from:");
  console.log("  • All uploaded scripts");
  console.log("  • All script chunks and embeddings");
  console.log("  • All search history");
  console.log("  • All Redis cache data\n");
  
  // Check for --force flag
  const forceFlag = process.argv.includes('--force') || process.argv.includes('-f');
  
  if (!forceFlag) {
    // Confirm with user
    console.log(`${colors.yellow}Are you sure you want to continue? Type 'yes' to confirm:${colors.reset}`);
    
    const confirmation = await new Promise<string>((resolve) => {
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim());
      });
    });
    
    if (confirmation.toLowerCase() !== 'yes') {
      console.log(`${colors.red}Reset cancelled.${colors.reset}`);
      process.exit(0);
    }
  } else {
    console.log(`${colors.yellow}Force flag detected, skipping confirmation...${colors.reset}`);
  }
  
  console.log(`\n${colors.blue}Starting database reset...${colors.reset}`);
  
  try {
    // Step 1: Delete all script chunks (this will cascade delete due to foreign key)
    console.log("  Deleting script chunks...");
    const deletedChunks = await db.delete(scriptChunks);
    console.log(`  ${colors.green}✓${colors.reset} Deleted all script chunks`);
    
    // Step 2: Delete all scripts
    console.log("  Deleting scripts...");
    const deletedScripts = await db.delete(scripts);
    console.log(`  ${colors.green}✓${colors.reset} Deleted all scripts`);
    
    // Step 3: Delete all searches
    console.log("  Deleting search history...");
    const deletedSearches = await db.delete(searches);
    console.log(`  ${colors.green}✓${colors.reset} Deleted all search history`);
    
    // Step 4: Clear Redis cache
    console.log("  Clearing Redis cache...");
    const keys = await redis.keys('*');
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`  ${colors.green}✓${colors.reset} Cleared ${keys.length} cache entries`);
    } else {
      console.log(`  ${colors.green}✓${colors.reset} Cache already empty`);
    }
    
    console.log(`\n${colors.bright}${colors.green}✅ Database reset complete!${colors.reset}`);
    console.log("Your database is now clean and ready for fresh data.\n");
    
  } catch (error) {
    console.error(`${colors.red}Error resetting database:${colors.reset}`, error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Show warning and start reset
console.log(`${colors.bright}${colors.red}🗑️  WARNING: This will permanently delete all data!${colors.reset}\n`);

resetDatabase().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});