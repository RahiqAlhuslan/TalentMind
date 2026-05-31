import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3013;

http.createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'go_nogo_game_.html' : req.url);
  const ext = path.extname(filePath);
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain', 'X-Frame-Options': 'ALLOWALL' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Go/No-Go running on http://localhost:${PORT}`));
