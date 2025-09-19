// Vercel Serverless Function
const crypto = require('crypto');

// In-memory storage (resets on each deploy)
const users = new Map();

function hashPassword(password) {
    return crypto.createHash('sha256').update(password + 'bvester-salt').digest('hex');
}

function createToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', 'bvester-secret-2024')
        .update(`${header}.${body}`)
        .digest('base64url');
    return `${header}.${body}.${signature}`;
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    // Health check
    if (pathname === '/api/auth' || pathname === '/api/auth/health') {
        return res.status(200).json({
            status: 'healthy',
            message: 'Bvester Backend API',
            timestamp: new Date().toISOString()
        });
    }

    // Signup
    if (pathname === '/api/auth/signup' && req.method === 'POST') {
        const { email, password, name, userType } = req.body;

        if (!email || !password || !name || !userType) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const normalizedEmail = email.toLowerCase();

        if (users.has(normalizedEmail)) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        users.set(normalizedEmail, {
            email: normalizedEmail,
            password: hashPassword(password),
            name,
            userType
        });

        const token = createToken({ email: normalizedEmail, name, userType });

        return res.status(201).json({
            message: 'Account created successfully',
            token,
            user: { email: normalizedEmail, name, userType }
        });
    }

    // Login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const normalizedEmail = email.toLowerCase();
        const user = users.get(normalizedEmail);

        if (!user || user.password !== hashPassword(password)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = createToken({
            email: user.email,
            name: user.name,
            userType: user.userType
        });

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: { email: user.email, name: user.name, userType: user.userType }
        });
    }

    return res.status(404).json({ error: 'Route not found' });
};