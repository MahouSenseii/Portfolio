// Test-only static host: deliberately serves the same compiled output at both bases.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, process.env.PORTFOLIO_TEST_SOURCE === '1' ? '..' : '../dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
http.createServer(async (req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://test').pathname).replace(/^\/Portfolio(?=\/)/, '');
  const file = path.resolve(root, '.' + (name.endsWith('/') ? name + 'index.html' : name));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); res.end(await fs.readFile(file)); }
  catch { res.writeHead(404).end(); }
}).listen(4173, '127.0.0.1');
