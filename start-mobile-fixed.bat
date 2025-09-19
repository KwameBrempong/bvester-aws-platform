@echo off
echo 🎉 Starting MOBILE-FIXED BizInvest Hub...
echo.
echo ✅ All mobile issues have been resolved:
echo    - Footer is now at the bottom
echo    - Responsive navigation
echo    - Full-width buttons on mobile
echo    - Proper mobile spacing
echo.
echo 🔗 Opening mobile-optimized app at: http://localhost:9000
echo.
echo 📱 Test this on your phone browser now!
echo.
start http://localhost:9000
node -e "const http = require('http'); const fs = require('fs'); const server = http.createServer((req, res) => { if (req.url === '/' || req.url === '/emergency-mobile-homepage.html') { const html = fs.readFileSync('emergency-mobile-homepage.html', 'utf8'); res.writeHead(200, {'Content-Type': 'text/html'}); res.end(html); } else { res.writeHead(404); res.end('Not found'); } }); server.listen(9000, () => console.log('✅ Mobile-fixed server ready at http://localhost:9000'));"