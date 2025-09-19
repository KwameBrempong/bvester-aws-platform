// Full BizInvest Hub Web App Server
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;

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
    console.log('🚀 BizInvest Hub - Full Web Application');
    console.log('');
    console.log('📋 Available at:');
    console.log(`   🌍 Local:   http://localhost:${port}`);
    console.log(`   🌐 Network: http://127.0.0.1:${port}`);
    console.log('');
    console.log('✨ Complete Features Available:');
    console.log('   🌟 4-slide animated welcome experience');
    console.log('   👥 Role-based user type selection');
    console.log('   📋 Complete onboarding flows (6-8 steps)');
    console.log('   🏆 Achievement system with notifications');
    console.log('   💰 Investment opportunities discovery');
    console.log('   📊 Personal dashboard with progress');
    console.log('   👤 User profile management');
    console.log('   🔥 Firebase authentication & data');
    console.log('   📱 Responsive mobile-friendly design');
    console.log('');
    console.log('🎯 User Journeys:');
    console.log('   • Business owners: List opportunities, get investment');
    console.log('   • Investors: Discover SMEs, make impact investments');
    console.log('');
    console.log('⏹️  Press Ctrl+C to stop server');
    console.log('');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down BizInvest Hub web server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});