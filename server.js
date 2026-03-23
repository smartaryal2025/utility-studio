const http = require('http');
const fs = require('fs');
const path = require('path');

// Grab the port from the batch file, default to 8080 if not provided
const PORT = process.argv[2] || 8080;

http.createServer((req, res) => {
    // 1. Strip query parameters (like ?v=1)
    let urlPath = req.url.split('?')[0];
    
    // 2. Map root to Master Hub index.html, else use the exact folder path
    let filePath = '.' + (urlPath === '/' ? '/index.html' : urlPath);

    // 3. Automatically serve index.html if the path is a directory (e.g., /Projects/Image-Tools/)
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    const ext = String(path.extname(filePath)).toLowerCase();
    
    // 4. Expanded MIME types for your tools and assets
    const mime = { 
        '.html': 'text/html', 
        '.js': 'text/javascript', 
        '.css': 'text/css', 
        '.wasm': 'application/wasm',
        '.json': 'application/json',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.ttf': 'font/ttf',
        '.otf': 'font/otf',
        '.ico': 'image/x-icon'
    };
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            console.error(`[404] File not found: ${filePath}`);
            res.writeHead(404);
            return res.end('File not found');
        }
        
        // The magic security headers that unlock FFmpeg and SharedArrayBuffers for Media Studio
        res.writeHead(200, {
            'Content-Type': mime[ext] || 'application/octet-stream',
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cache-Control': 'no-cache' // Ensures you always see your latest CSS/JS edits during local testing
        });
        res.end(content, 'utf-8');
    });
}).listen(PORT, () => console.log(`[SERVER] Utility Studio running at: http://localhost:${PORT}`));