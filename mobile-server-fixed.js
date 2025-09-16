const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9003;
const HOST = '0.0.0.0';

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const clientIP = req.connection.remoteAddress || req.socket.remoteAddress;
  console.log(`📱 ${new Date().toISOString()} - ${req.method} ${req.url} from ${clientIP}`);

  let filePath;
  let contentType = 'text/html; charset=utf-8';

  // Route handling
  if (req.url === '/test') {
    filePath = path.join(__dirname, 'test-mobile.html');
  } else if (req.url === '/' || req.url === '/index.html') {
    filePath = path.join(__dirname, 'emergency-mobile-homepage.html');
  } else {
    // 404 for other paths
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end(`
      <html>
        <body style="font-family: Arial; padding: 20px; background: #f0f0f0;">
          <h1>🔍 Page Not Found</h1>
          <p>Available pages:</p>
          <ul>
            <li><a href="/">📱 Main App (BizInvest Hub)</a></li>
            <li><a href="/test">🧪 Connection Test</a></li>
          </ul>
          <p><strong>Your IP:</strong> ${clientIP}</p>
          <p><strong>Requested:</strong> ${req.url}</p>
        </body>
      </html>
    `);
    return;
  }

  // Read and serve file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(`❌ Error reading ${filePath}:`, err);
      res.writeHead(500, {'Content-Type': 'text/html'});
      res.end(`
        <html>
          <body style="font-family: Arial; padding: 20px; background: #ffe6e6;">
            <h1>❌ Server Error</h1>
            <p>Could not load file: ${path.basename(filePath)}</p>
            <p>Error: ${err.message}</p>
            <p><a href="/">← Try Main Page</a></p>
          </body>
        </html>
      `);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(data);
    console.log(`✅ Successfully served ${path.basename(filePath)} to ${clientIP}`);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 MOBILE SERVER RUNNING`);
  console.log(`======================`);
  console.log(`📱 Test URL:  http://192.168.8.101:${PORT}/test`);
  console.log(`🏠 Main App:  http://192.168.8.101:${PORT}`);
  console.log(`🔄 Alt IP:    http://172.23.16.1:${PORT}/test`);
  console.log(`\n💡 Try the TEST URL first on your phone!`);
  console.log(`✅ No SSL errors - using plain HTTP`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} in use, trying ${PORT + 1}...`);
    server.listen(PORT + 1, HOST);
  }
});

server.on('connection', (socket) => {
  console.log(`🔌 New connection from: ${socket.remoteAddress}`);
});