# Batch Upload Guide

The embeddings demo now supports batch uploading of multiple files at once, making it easy to process entire folders of documents.

## Methods for Batch Upload

### 1. Web Interface

The web UI now includes a batch upload section:

1. Navigate to the "Upload" tab
2. Look for the "Batch Upload Files" section
3. Click "Choose Files" and select multiple files
4. Click "Upload X Files" to process them all
5. Progress will be shown as files are processed

**Supported formats**: `.txt`, `.md`, `.js`, `.ts`, `.jsx`, `.tsx`, `.json`, `.html`, `.css`, `.xml`, `.yml`, `.yaml`

### 2. CLI Script

Use the `batch-upload.ts` script for command-line batch uploads:

```bash
# Basic usage - upload all txt and md files from a folder
bun batch-upload.ts ./documents

# Upload specific file types
bun batch-upload.ts ./documents --extensions txt,md,js

# Upload recursively from subfolders
bun batch-upload.ts ./my-project --recursive

# Dry run to preview what will be uploaded
bun batch-upload.ts ./documents --dry-run

# Custom batch size (default is 10, max is 50)
bun batch-upload.ts ./documents --batch-size 5

# Show help
bun batch-upload.ts --help
```

#### CLI Options

- `--extensions, -e`: File extensions to process (default: txt,md,js,ts,json,html,css)
- `--recursive, -r`: Process subfolders recursively
- `--dry-run, -d`: Show what would be uploaded without uploading
- `--batch-size, -b`: Number of files per batch (max 50, default 10)
- `--api-url`: Custom API URL (default: http://localhost:3000)

### 3. Direct API

You can also use the batch upload API endpoint directly:

```bash
curl -X POST http://localhost:3000/api/scripts/batch \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      {
        "title": "document1.txt",
        "content": "Content of document 1..."
      },
      {
        "title": "document2.txt", 
        "content": "Content of document 2..."
      }
    ]
  }'
```

## Features

- **Progress Tracking**: Both UI and CLI show upload progress
- **Error Handling**: Failed files are reported but don't stop the batch
- **Rate Limit Aware**: Automatic delays between uploads to respect rate limits
- **Batch Processing**: Files are processed in configurable batch sizes
- **File Validation**: Each file is validated before processing
- **Memory Efficient**: Files are streamed and processed sequentially

## Rate Limits

The batch upload respects the following rate limits:
- Upload rate limit: 25 uploads per hour
- Batch size limit: Maximum 50 files per batch
- File size limit: Each file must be less than 1MB
- Content length: Each file must have 10-1,000,000 characters

## Examples

### Upload documentation folder
```bash
bun batch-upload.ts ./docs --extensions md,txt --recursive
```

### Upload code files from a project
```bash
bun batch-upload.ts ./src --extensions js,ts,jsx,tsx --recursive
```

### Preview what will be uploaded
```bash
bun batch-upload.ts ./documents --dry-run --recursive
```

### Upload with custom API endpoint
```bash
bun batch-upload.ts ./documents --api-url https://api.example.com
```

## Tips

1. **Start with dry run**: Use `--dry-run` to preview files before uploading
2. **Use appropriate batch sizes**: Smaller batches (5-10) for large files, larger batches (20-50) for small files
3. **Monitor rate limits**: The upload rate limit is 25 per hour, plan accordingly
4. **File naming**: Files are uploaded with their original names as titles
5. **Error recovery**: Failed uploads are reported but don't stop the batch - you can re-run for failed files