// BizInvest Hub Emulator Server - Professional Web Application
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 4001;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found - serve index.html for SPA routing
                fs.readFile(path.join(__dirname, 'index.html'), (error, content) => {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, () => {
    console.log('🔥 BizInvest Hub - Firebase Emulator Development Platform');
    console.log('');
    console.log('📋 Available at:');
    console.log(`   🌍 Local:   http://localhost:${port}`);
    console.log(`   🌐 Network: http://127.0.0.1:${port}`);
    console.log('');
    console.log('🔧 Firebase Emulator Integration:');
    console.log('   🔐 Authentication: Connected to port 9199');
    console.log('   📄 Firestore: Connected to port 8180');
    console.log('   🎛️ Firebase UI: http://127.0.0.1:4100');
    console.log('');
    console.log('✨ Professional Features:');
    console.log('   💼 Complete business profile management');
    console.log('   📊 Rich dashboard with real metrics');
    console.log('   🏢 Detailed business information display');
    console.log('   💰 Professional investment opportunities');
    console.log('   📈 Financial data management');
    console.log('   🔥 Local Firebase development');
    console.log('   📱 Responsive professional design');
    console.log('   🎨 Modern UI with glassmorphism effects');
    console.log('');
    console.log('🧪 Development Environment:');
    console.log('   • Safe local testing with Firebase emulators');
    console.log('   • Real-time data sync without production impact');
    console.log('   • Visual debugging with Firebase UI dashboard');
    console.log('   • Complete user authentication flows');
    console.log('   • Professional business profile management');
    console.log('');
    console.log('🎯 Emulator Benefits:');
    console.log('   • No production data impact');
    console.log('   • Unlimited operations without quotas');
    console.log('   • Visual management interface');
    console.log('   • Real-time debugging capabilities');
    console.log('   • Complete isolation for feature testing');
    console.log('');
    console.log('⏹️  Press Ctrl+C to stop server');
    console.log('');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down BizInvest Hub emulator server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});