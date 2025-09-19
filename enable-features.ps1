# Enable Interactive Features - Connect Frontend to Backend API
Write-Host "Enabling Interactive Features" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

Write-Host "`nConnecting frontend to api.bvester.com..." -ForegroundColor Yellow

# API Configuration
$API_BASE_URL = "https://api.bvester.com"

# Update login.html to use live API
Write-Host "Updating login.html..." -ForegroundColor Yellow
$loginContent = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Bvester</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .login-container { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
        .logo { text-align: center; margin-bottom: 2rem; }
        .logo h1 { color: #667eea; font-size: 2rem; }
        .form-group { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.5rem; color: #333; font-weight: 500; }
        input { width: 100%; padding: 0.75rem; border: 2px solid #e1e5e9; border-radius: 5px; font-size: 1rem; transition: border-color 0.3s; }
        input:focus { outline: none; border-color: #667eea; }
        .btn { width: 100%; padding: 0.75rem; background: #667eea; color: white; border: none; border-radius: 5px; font-size: 1rem; cursor: pointer; transition: background 0.3s; }
        .btn:hover { background: #5a67d8; }
        .links { text-align: center; margin-top: 1.5rem; }
        .links a { color: #667eea; text-decoration: none; }
        .error { color: #e53e3e; margin-top: 0.5rem; font-size: 0.875rem; }
        .success { color: #38a169; margin-top: 0.5rem; font-size: 0.875rem; }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>Bvester</h1>
            <p>Welcome back!</p>
        </div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="btn">Login</button>
            
            <div id="message"></div>
        </form>
        
        <div class="links">
            <a href="signup.html">Create Account</a> | 
            <a href="/">Back to Home</a>
        </div>
    </div>

    <script>
        const API_BASE = '$API_BASE_URL';
        
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const messageDiv = document.getElementById('message');
            
            try {
                const response = await fetch(`${API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    messageDiv.innerHTML = '<div class="success">Login successful! Redirecting...</div>';
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userType', data.user.userType);
                    
                    // Redirect based on user type
                    setTimeout(() => {
                        if (data.user.userType === 'investor') {
                            window.location.href = 'investor-dashboard.html';
                        } else if (data.user.userType === 'sme') {
                            window.location.href = 'sme-dashboard.html';
                        } else {
                            window.location.href = 'premium-dashboard.html';
                        }
                    }, 1500);
                } else {
                    messageDiv.innerHTML = `<div class="error">${data.message || 'Login failed'}</div>`;
                }
            } catch (error) {
                messageDiv.innerHTML = '<div class="error">Network error. Please try again.</div>';
                console.error('Login error:', error);
            }
        });
    </script>
</body>
</html>
"@

$loginContent | Out-File -FilePath "login.html" -Encoding UTF8

# Update signup.html to use live API
Write-Host "Updating signup.html..." -ForegroundColor Yellow
$signupContent = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign Up - Bvester</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .signup-container { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); width: 100%; max-width: 500px; }
        .logo { text-align: center; margin-bottom: 2rem; }
        .logo h1 { color: #667eea; font-size: 2rem; }
        .form-group { margin-bottom: 1.5rem; }
        label { display: block; margin-bottom: 0.5rem; color: #333; font-weight: 500; }
        input, select { width: 100%; padding: 0.75rem; border: 2px solid #e1e5e9; border-radius: 5px; font-size: 1rem; transition: border-color 0.3s; }
        input:focus, select:focus { outline: none; border-color: #667eea; }
        .btn { width: 100%; padding: 0.75rem; background: #667eea; color: white; border: none; border-radius: 5px; font-size: 1rem; cursor: pointer; transition: background 0.3s; }
        .btn:hover { background: #5a67d8; }
        .links { text-align: center; margin-top: 1.5rem; }
        .links a { color: #667eea; text-decoration: none; }
        .error { color: #e53e3e; margin-top: 0.5rem; font-size: 0.875rem; }
        .success { color: #38a169; margin-top: 0.5rem; font-size: 0.875rem; }
    </style>
</head>
<body>
    <div class="signup-container">
        <div class="logo">
            <h1>Bvester</h1>
            <p>Join our investment community!</p>
        </div>
        
        <form id="signupForm">
            <div class="form-group">
                <label for="name">Full Name</label>
                <input type="text" id="name" name="name" required>
            </div>
            
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <div class="form-group">
                <label for="userType">Account Type</label>
                <select id="userType" name="userType" required>
                    <option value="">Select account type</option>
                    <option value="investor">Investor</option>
                    <option value="sme">SME Owner</option>
                    <option value="premium">Premium User</option>
                </select>
            </div>
            
            <button type="submit" class="btn">Create Account</button>
            
            <div id="message"></div>
        </form>
        
        <div class="links">
            <a href="login.html">Already have an account?</a> | 
            <a href="/">Back to Home</a>
        </div>
    </div>

    <script>
        const API_BASE = '$API_BASE_URL';
        
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                userType: document.getElementById('userType').value
            };
            
            const messageDiv = document.getElementById('message');
            
            try {
                const response = await fetch(`${API_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    messageDiv.innerHTML = '<div class="success">Account created successfully! Redirecting to login...</div>';
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    messageDiv.innerHTML = `<div class="error">${data.message || 'Registration failed'}</div>`;
                }
            } catch (error) {
                messageDiv.innerHTML = '<div class="error">Network error. Please try again.</div>';
                console.error('Registration error:', error);
            }
        });
    </script>
</body>
</html>
"@

$signupContent | Out-File -FilePath "signup.html" -Encoding UTF8

# Upload updated files to S3
Write-Host "`nUploading updated files to S3..." -ForegroundColor Yellow

aws s3 cp login.html s3://bvester-website-public/login.html --content-type "text/html"
aws s3 cp signup.html s3://bvester-website-public/signup.html --content-type "text/html"

# Invalidate CloudFront cache
Write-Host "Invalidating CloudFront cache..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id E2QJJZQZQZQZQZ --paths "/login.html" "/signup.html"

Write-Host "`nTesting API connection..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "$API_BASE_URL/health" -Method GET -TimeoutSec 10
    Write-Host "API Health Check: PASSED" -ForegroundColor Green
    Write-Host "API Response: $($healthCheck | ConvertTo-Json)" -ForegroundColor White
} catch {
    Write-Host "API Health Check: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nInteractive features enabled!" -ForegroundColor Green
Write-Host "Users can now:" -ForegroundColor Cyan
Write-Host "  - Register new accounts at https://bvester.com/signup.html" -ForegroundColor White
Write-Host "  - Login at https://bvester.com/login.html" -ForegroundColor White
Write-Host "  - Access their dashboards based on user type" -ForegroundColor White

Write-Host "`nNext: Run launch-marketing.ps1 to complete deployment!" -ForegroundColor Yellow