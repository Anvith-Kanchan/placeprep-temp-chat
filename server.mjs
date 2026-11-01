import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const useDist = process.argv.includes('--dist');
const root = resolve(here, useDist ? 'dist' : '.');
const portArg = process.argv.find((part) => part.startsWith('--port='));
const portIndex = process.argv.indexOf('--port');
const port = Number(portArg?.split('=')[1] ?? (portIndex >= 0 ? process.argv[portIndex + 1] : 4173));
const hostArg = process.argv.find((part) => part.startsWith('--host='));
const host = hostArg?.split('=')[1] ?? process.env.HOST ?? '127.0.0.1';
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { response.writeHead(400).end('Bad request'); return; }
  const safePath = normalize(pathname).replace(/^([/\\]|\.\.(?:[/\\]|$))+/, '');
  let file = resolve(root, safePath || 'index.html');
  if (!file.startsWith(root)) { response.writeHead(403).end('Forbidden'); return; }
  if (!existsSync(file) || !statSync(file).isFile()) file = join(root, 'index.html');
  if (!existsSync(file)) { response.writeHead(404).end('Not found'); return; }
  response.writeHead(200, {
    'Content-Type': types[extname(file)] ?? 'application/octet-stream',
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  });
  createReadStream(file).pipe(response);
});

server.listen(port, host, () => {
  console.log(`RoundZero is running at http://${host}:${port}`);
});
