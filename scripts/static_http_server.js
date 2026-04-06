import { createReadStream, existsSync, statSync } from 'fs';
import { extname, join, normalize, resolve } from 'path';
import { createServer } from 'http';

const port = Number(process.argv[2] || process.env.PORT || 8080);
const rootDir = resolve(process.argv[3] || process.cwd());

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
};

function getFilePath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const relativePath = normalize(decodedPath === '/' ? '/index.html' : decodedPath).replace(/^([.][.][\\/])+/, '');
  const absolutePath = resolve(join(rootDir, `.${relativePath}`));

  if (!absolutePath.startsWith(rootDir)) {
    return null;
  }

  if (existsSync(absolutePath) && statSync(absolutePath).isDirectory()) {
    return join(absolutePath, 'index.html');
  }

  return absolutePath;
}

const server = createServer((request, response) => {
  const filePath = getFilePath(request.url || '/');

  if (!filePath || !existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'Cache-Control': 'no-store',
    'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream',
  });

  createReadStream(filePath).pipe(response);
});

server.listen(port, () => {
  console.log(`Serving ${rootDir} on http://localhost:${port}`);
});