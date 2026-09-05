/**
 * UNNATI Local Unified Gateway (SIH 2026)
 * Zero external dependencies. Uses Node.js native http and net modules.
 * - Serves Vite production SPA build (dist/) with client-side routing fallback (index.html)
 * - Proxies /api/ and /admin/ to Daphne (127.0.0.1:8000)
 * - Proxies /ws/ WebSocket connections to Daphne via native TCP HTTP Upgrade tunnel
 * - Serves /static/ backend static files
 * - Responds to /healthz health check
 */

import http from 'http';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '5173', 10);
const BACKEND_HOST = '127.0.0.1';
const BACKEND_PORT = 8000;
const DIST_DIR = path.resolve(__dirname, '../frontend/dist');
const STATIC_DIR = path.resolve(__dirname, '../backend/staticfiles');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File Not Found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
    });
    res.end(data);
  });
}

function proxyHttpRequest(req, res) {
  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${BACKEND_HOST}:${BACKEND_PORT}`,
      'x-forwarded-for': req.socket.remoteAddress || '127.0.0.1',
      'x-forwarded-proto': 'https',
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`[Proxy Error] ${req.method} ${req.url} -> ${err.message}`);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend unreachable', details: err.message }));
    }
  });

  req.pipe(proxyReq, { end: true });
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  const cleanPath = url.split('?')[0];

  // Health check endpoint
  if (cleanPath === '/healthz' || cleanPath === '/healthz/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('healthy\n');
    return;
  }

  // Django Static files (/static/...)
  if (cleanPath.startsWith('/static/')) {
    const relPath = cleanPath.slice('/static/'.length);
    const fullPath = path.join(STATIC_DIR, relPath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      serveFile(res, fullPath);
      return;
    }
  }

  // Backend API and Admin endpoints (/api/..., /admin/...)
  if (cleanPath.startsWith('/api/') || cleanPath.startsWith('/admin/')) {
    proxyHttpRequest(req, res);
    return;
  }

  // Frontend Static Assets & SPA routing (dist/...)
  const diskPath = path.join(DIST_DIR, cleanPath.replace(/^\//, ''));
  if (fs.existsSync(diskPath) && fs.statSync(diskPath).isFile()) {
    serveFile(res, diskPath);
    return;
  }

  // SPA fallback to index.html
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    serveFile(res, indexPath);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('UNNATI Frontend dist build not found. Please run npm run build.');
  }
});

// Upgrade handler: Tunnel WebSockets (/ws/...) to Daphne
server.on('upgrade', (req, clientSocket, head) => {
  const url = req.url || '/';
  if (url.startsWith('/ws/')) {
    const targetSocket = net.connect(BACKEND_PORT, BACKEND_HOST, () => {
      // Reconstruct HTTP Upgrade request for Daphne
      let rawReq = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
      for (const [key, value] of Object.entries(req.headers)) {
        if (key.toLowerCase() === 'host') {
          rawReq += `Host: ${BACKEND_HOST}:${BACKEND_PORT}\r\n`;
        } else {
          rawReq += `${key}: ${value}\r\n`;
        }
      }
      rawReq += '\r\n';

      targetSocket.write(rawReq);
      if (head && head.length > 0) {
        targetSocket.write(head);
      }

      // Bi-directional pipe
      clientSocket.pipe(targetSocket);
      targetSocket.pipe(clientSocket);
    });

    targetSocket.on('error', (err) => {
      console.error(`[WebSocket Upgrade Error] ${err.message}`);
      clientSocket.destroy();
    });

    clientSocket.on('error', () => {
      targetSocket.destroy();
    });
  } else {
    clientSocket.destroy();
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[UNNATI Local Gateway] Live at http://127.0.0.1:${PORT}`);
  console.log(`  - Frontend SPA:   http://127.0.0.1:${PORT}/`);
  console.log(`  - Health Check:   http://127.0.0.1:${PORT}/healthz`);
  console.log(`  - Backend API:    http://127.0.0.1:${PORT}/api/`);
  console.log(`  - WebSockets:     ws://127.0.0.1:${PORT}/ws/`);
});
