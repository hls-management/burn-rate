#!/usr/bin/env node

/**
 * Simple static file server for the Burn Rate web version
 * This script serves the built web files from dist/web
 */

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';
const WEB_DIR = join(__dirname, '..', 'dist', 'web');

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

/**
 * Get MIME type for file extension
 */
function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Serve static files
 */
async function serveFile(res, filePath) {
  try {
    const fullPath = join(WEB_DIR, filePath);
    
    // Security check - ensure file is within web directory
    if (!fullPath.startsWith(WEB_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    // Check if file exists
    const stats = await stat(fullPath);
    
    if (stats.isDirectory()) {
      // Serve index.html for directories
      return serveFile(res, join(filePath, 'index.html'));
    }

    // Read and serve file
    const content = await readFile(fullPath);
    const mimeType = getMimeType(fullPath);
    
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Content-Length': content.length,
      'Cache-Control': 'public, max-age=3600', // 1 hour cache
      'Access-Control-Allow-Origin': '*', // Allow CORS for development
    });
    
    res.end(content);
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File not found - serve index.html for SPA routing
      try {
        const indexPath = join(WEB_DIR, 'index.html');
        const indexContent = await readFile(indexPath);
        
        res.writeHead(200, {
          'Content-Type': 'text/html',
          'Content-Length': indexContent.length,
        });
        
        res.end(indexContent);
      } catch (indexError) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    } else {
      console.error('Server error:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  }
}

/**
 * Create and start the server
 */
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let filePath = url.pathname;
  
  // Remove leading slash and decode URI
  filePath = decodeURIComponent(filePath.substring(1));
  
  // Default to index.html for root
  if (filePath === '') {
    filePath = 'index.html';
  }
  
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  await serveFile(res, filePath);
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`🚀 Burn Rate Web Server started!`);
  console.log(`📍 Server running at http://${HOST}:${PORT}`);
  console.log(`📁 Serving files from: ${WEB_DIR}`);
  console.log(`⏹️  Press Ctrl+C to stop the server`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});