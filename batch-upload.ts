#!/usr/bin/env bun
// CLI script for batch uploading files from a folder to the embeddings API

import { parseArgs } from "util";
import path from "path";
import fs from "fs/promises";

const API_URL = process.env.API_URL || "http://localhost:3000";

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

function printHelp() {
  console.log(`
${colors.bright}Batch Upload Script${colors.reset}

Upload multiple files from a folder to the embeddings API.

${colors.bright}Usage:${colors.reset}
  bun batch-upload.ts <folder-path> [options]

${colors.bright}Options:${colors.reset}
  --extensions, -e    File extensions to process (comma-separated)
                      Default: txt,md,js,ts,json,html,css
  --recursive, -r     Process subfolders recursively
  --dry-run, -d       Show what would be uploaded without uploading
  --batch-size, -b    Number of files to upload per batch (max 50)
                      Default: 10
  --api-url           API URL (default: http://localhost:3000)
  --help, -h          Show this help message

${colors.bright}Examples:${colors.reset}
  # Upload all txt and md files from a folder
  bun batch-upload.ts ./documents --extensions txt,md

  # Upload all files recursively from a folder
  bun batch-upload.ts ./my-project --recursive

  # Dry run to see what would be uploaded
  bun batch-upload.ts ./documents --dry-run

  # Upload with custom batch size
  bun batch-upload.ts ./documents --batch-size 5
`);
}

async function getFiles(
  folderPath: string, 
  extensions: string[], 
  recursive: boolean
): Promise<Array<{ path: string; name: string }>> {
  const files: Array<{ path: string; name: string }> = [];
  
  async function scanDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && recursive) {
        await scanDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase().slice(1);
        if (extensions.includes(ext)) {
          files.push({
            path: fullPath,
            name: entry.name
          });
        }
      }
    }
  }
  
  await scanDir(folderPath);
  return files;
}

async function readFileContent(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function uploadBatch(files: Array<{ title: string; content: string }>): Promise<any> {
  const response = await fetch(`${API_URL}/api/scripts/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files })
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

async function main() {
  const { values, positionals } = parseArgs({
    args: Bun.argv,
    options: {
      extensions: {
        type: 'string',
        short: 'e',
        default: 'txt,md,js,ts,json,html,css'
      },
      recursive: {
        type: 'boolean',
        short: 'r',
        default: false
      },
      'dry-run': {
        type: 'boolean',
        short: 'd',
        default: false
      },
      'batch-size': {
        type: 'string',
        short: 'b',
        default: '10'
      },
      'api-url': {
        type: 'string',
        default: API_URL
      },
      help: {
        type: 'boolean',
        short: 'h',
        default: false
      }
    },
    strict: true,
    allowPositionals: true,
  });
  
  // Skip first two args (bun and script name)
  const folderPath = positionals[2];
  
  if (values.help || !folderPath) {
    printHelp();
    process.exit(0);
  }
  
  // Validate folder exists
  try {
    const stats = await fs.stat(folderPath);
    if (!stats.isDirectory()) {
      console.error(`${colors.red}Error: ${folderPath} is not a directory${colors.reset}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}Error: Cannot access ${folderPath}${colors.reset}`);
    process.exit(1);
  }
  
  const extensions = values.extensions!.split(',').map(ext => ext.trim().toLowerCase());
  const batchSize = Math.min(50, Math.max(1, parseInt(values['batch-size']!) || 10));
  const apiUrl = values['api-url'];
  
  console.log(`${colors.bright}Batch Upload Configuration:${colors.reset}`);
  console.log(`  Folder: ${colors.blue}${folderPath}${colors.reset}`);
  console.log(`  Extensions: ${colors.blue}${extensions.join(', ')}${colors.reset}`);
  console.log(`  Recursive: ${colors.blue}${values.recursive ? 'Yes' : 'No'}${colors.reset}`);
  console.log(`  Batch size: ${colors.blue}${batchSize}${colors.reset}`);
  console.log(`  API URL: ${colors.blue}${apiUrl}${colors.reset}`);
  console.log(`  Mode: ${values['dry-run'] ? colors.yellow + 'DRY RUN' : colors.green + 'UPLOAD'} ${colors.reset}\n`);
  
  // Get files to process
  console.log(`${colors.gray}Scanning for files...${colors.reset}`);
  const files = await getFiles(folderPath, extensions, values.recursive);
  
  if (files.length === 0) {
    console.log(`${colors.yellow}No files found matching the criteria.${colors.reset}`);
    process.exit(0);
  }
  
  console.log(`${colors.green}Found ${files.length} files to process${colors.reset}\n`);
  
  if (values['dry-run']) {
    console.log(`${colors.bright}Files that would be uploaded:${colors.reset}`);
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name} ${colors.gray}(${file.path})${colors.reset}`);
    });
    console.log(`\n${colors.yellow}Dry run complete. No files were uploaded.${colors.reset}`);
    process.exit(0);
  }
  
  // Process files in batches
  const totalBatches = Math.ceil(files.length / batchSize);
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (let i = 0; i < totalBatches; i++) {
    const batchStart = i * batchSize;
    const batchEnd = Math.min((i + 1) * batchSize, files.length);
    const batchFiles = files.slice(batchStart, batchEnd);
    
    console.log(`\n${colors.bright}Processing batch ${i + 1}/${totalBatches}${colors.reset} (${batchFiles.length} files)`);
    
    // Read file contents
    const batchData: Array<{ title: string; content: string }> = [];
    
    for (const file of batchFiles) {
      try {
        console.log(`  ${colors.gray}Reading ${file.name}...${colors.reset}`);
        const content = await readFileContent(file.path);
        batchData.push({
          title: file.name,
          content
        });
      } catch (error) {
        console.error(`  ${colors.red}✗ Failed to read ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}${colors.reset}`);
        totalFailed++;
      }
    }
    
    if (batchData.length === 0) {
      continue;
    }
    
    // Upload batch
    try {
      console.log(`  ${colors.blue}Uploading batch...${colors.reset}`);
      const result = await uploadBatch(batchData);
      
      // Display results
      result.results.forEach((fileResult: any) => {
        if (fileResult.success) {
          console.log(`  ${colors.green}✓ ${fileResult.filename} - ${fileResult.chunksCreated} chunks created${colors.reset}`);
          totalSuccess++;
        } else {
          console.log(`  ${colors.red}✗ ${fileResult.filename} - ${fileResult.error}${colors.reset}`);
          totalFailed++;
        }
      });
    } catch (error) {
      console.error(`  ${colors.red}✗ Batch upload failed: ${error instanceof Error ? error.message : 'Unknown error'}${colors.reset}`);
      totalFailed += batchData.length;
    }
    
    // Add delay between batches
    if (i < totalBatches - 1) {
      console.log(`  ${colors.gray}Waiting before next batch...${colors.reset}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log(`\n${colors.bright}Upload Complete!${colors.reset}`);
  console.log(`  ${colors.green}✓ Successful: ${totalSuccess}${colors.reset}`);
  if (totalFailed > 0) {
    console.log(`  ${colors.red}✗ Failed: ${totalFailed}${colors.reset}`);
  }
  console.log(`  ${colors.blue}Total: ${files.length}${colors.reset}`);
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}${colors.reset}`);
  process.exit(1);
});