const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  // Serve from the dist/ folder created by Vite build
  let reqUrl = req.url === '/' ? '/index.html' : req.url;
  let filePath = path.join(__dirname, 'dist', reqUrl);
  
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // For SPA routing, fallback to index.html if file is not found
      if (req.url !== '/' && !ext) {
        const indexHtml = path.join(__dirname, 'dist', 'index.html');
        fs.readFile(indexHtml, (err2, data2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data2);
        });
        return;
      }
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Scientifica React Server running at http://localhost:${PORT}`);
  console.log('Serving production build from ./dist');
  console.log('For phone access, find your computer IP (ipconfig) and visit http://<ip>:' + PORT);
});
