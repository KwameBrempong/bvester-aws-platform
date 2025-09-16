const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Set CORS headers for mobile access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from ${req.connection.remoteAddress}`);

  if (req.url === '/test') {
    try {
      const html = fs.readFileSync('test-mobile.html', 'utf8');
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(html);
    } catch (error) {
      console.error('Error reading test file:', error);
      res.writeHead(500, {'Content-Type': 'text/plain'});
      res.end('Server Error: Could not read test file');
    }
  } else if (req.url === '/' || req.url === '/index.html') {
    try {
      const html = fs.readFileSync('emergency-mobile-homepage.html', 'utf8');
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(html);
    } catch (error) {
      console.error('Error reading file:', error);
      res.writeHead(500, {'Content-Type': 'text/plain'});
      res.end('Server Error: Could not read homepage file');
    }
  } else {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.end('Not Found');
  }
});

const PORT = 9002;
const HOST = '0.0.0.0'; // Listen on all interfaces

server.listen(PORT, HOST, () => {
  console.log(`✅ Mobile-optimized server running on:`);
  console.log(`   Local:    http://localhost:${PORT}`);
  console.log(`   Network:  http://192.168.8.101:${PORT}`);
  console.log(`   Alt IP:   http://172.23.16.1:${PORT}`);
  console.log(`\n📱 Access from your phone using one of the Network URLs above`);
  console.log(`🔥 Mobile fixes active: Footer at bottom, responsive design!`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
    server.listen(PORT + 1, HOST);
  } else {
    console.error('❌ Server error:', error);
  }
});

// Log when clients connect
server.on('connection', (socket) => {
  console.log(`📱 New connection from: ${socket.remoteAddress}`);
});