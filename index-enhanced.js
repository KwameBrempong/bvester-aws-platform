const crypto = require('crypto');

// Configuration
const CONFIG = {
    JWT_SECRET: process.env.JWT_SECRET || 'bvester-secret-2024',
    SALT: process.env.SALT || 'bvester-salt',
    CORS_ORIGINS: ['https://bvester.com', 'https://www.bvester.com', 'http://localhost'],
    MAX_REQUEST_SIZE: 1048576, // 1MB
    RATE_LIMIT_WINDOW: 60000, // 1 minute
    RATE_LIMIT_MAX: 10 // max requests per window
};

// In-memory store (replace with DynamoDB in production)
const users = new Map();
const rateLimits = new Map();

// Initialize admin user
users.set('admin@bvester.com', {
    email: 'admin@bvester.com',
    password: hashPassword('admin123'),
    name: 'Admin User',
    userType: 'admin',
    isEmailVerified: true,
    createdAt: new Date().toISOString()
});

// JWT implementation
function createToken(payload, expiresIn = '24h') {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const exp = Math.floor(Date.now() / 1000) + (expiresIn === '24h' ? 86400 : 3600);
    const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
    const signature = crypto
        .createHmac('sha256', CONFIG.JWT_SECRET)
        .update(`${header}.${body}`)
        .digest('base64url');
    return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
    try {
        const [header, body, signature] = token.split('.');
        const expectedSignature = crypto
            .createHmac('sha256', CONFIG.JWT_SECRET)
            .update(`${header}.${body}`)
            .digest('base64url');

        if (signature !== expectedSignature) {
            return null;
        }

        const payload = JSON.parse(Buffer.from(body, 'base64url').toString());

        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return payload;
    } catch (error) {
        return null;
    }
}

// Password hashing with better security
function hashPassword(password) {
    return crypto
        .pbkdf2Sync(password, CONFIG.SALT, 10000, 64, 'sha512')
        .toString('hex');
}

// Rate limiting
function checkRateLimit(identifier) {
    const now = Date.now();
    const windowStart = now - CONFIG.RATE_LIMIT_WINDOW;

    if (!rateLimits.has(identifier)) {
        rateLimits.set(identifier, []);
    }

    const requests = rateLimits.get(identifier).filter(time => time > windowStart);

    if (requests.length >= CONFIG.RATE_LIMIT_MAX) {
        return false;
    }

    requests.push(now);
    rateLimits.set(identifier, requests);
    return true;
}

// Input validation
function validateInput(data, required) {
    for (const field of required) {
        if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
            return { valid: false, error: `${field} is required` };
        }
    }
    return { valid: true };
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// CORS handling
function getCorsHeaders(origin) {
    const allowedOrigin = CONFIG.CORS_ORIGINS.find(allowed =>
        origin && (origin === allowed || origin.startsWith(allowed))
    );

    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin || '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    };
}

// Main handler
exports.handler = async (event, context) => {
    // Set timeout warning
    context.callbackWaitsForEmptyEventLoop = false;

    const startTime = Date.now();
    const requestId = context.requestId || crypto.randomBytes(16).toString('hex');

    try {
        // Parse request
        const origin = event.headers?.origin || event.headers?.Origin;
        const headers = getCorsHeaders(origin);
        const path = event.rawPath || event.path || '/';
        const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
        const sourceIp = event.requestContext?.http?.sourceIp ||
                        event.requestContext?.identity?.sourceIp ||
                        'unknown';

        // Log request
        console.log(JSON.stringify({
            requestId,
            method,
            path,
            sourceIp,
            timestamp: new Date().toISOString()
        }));

        // Handle CORS preflight
        if (method === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: ''
            };
        }

        // Rate limiting
        if (!checkRateLimit(sourceIp)) {
            return {
                statusCode: 429,
                headers,
                body: JSON.stringify({
                    error: 'Too many requests. Please try again later.'
                })
            };
        }

        // Parse body
        let body = {};
        if (event.body) {
            // Check request size
            if (event.body.length > CONFIG.MAX_REQUEST_SIZE) {
                return {
                    statusCode: 413,
                    headers,
                    body: JSON.stringify({
                        error: 'Request body too large'
                    })
                };
            }

            try {
                body = JSON.parse(event.body);
            } catch (e) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Invalid JSON in request body'
                    })
                };
            }
        }

        // Route handling
        const response = await handleRoute(path, method, body, headers);

        // Log response time
        const duration = Date.now() - startTime;
        console.log(JSON.stringify({
            requestId,
            statusCode: response.statusCode,
            duration,
            timestamp: new Date().toISOString()
        }));

        return response;

    } catch (error) {
        console.error(JSON.stringify({
            requestId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        }));

        return {
            statusCode: 500,
            headers: getCorsHeaders(),
            body: JSON.stringify({
                error: 'Internal server error',
                requestId
            })
        };
    }
};

// Route handler
async function handleRoute(path, method, body, headers) {
    // Health check
    if (path === '/' || path === '/health') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: 'healthy',
                message: 'Bvester Backend API - Production',
                timestamp: new Date().toISOString(),
                version: '3.0.0',
                uptime: process.uptime()
            })
        };
    }

    // Signup endpoint
    if (path === '/api/auth/signup' && method === 'POST') {
        // Validate input
        const validation = validateInput(body, ['email', 'password', 'name', 'userType']);
        if (!validation.valid) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: validation.error })
            };
        }

        const { email, password, name, userType } = body;

        // Validate email format
        if (!validateEmail(email)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid email format' })
            };
        }

        // Validate password strength
        if (password.length < 6) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Password must be at least 6 characters' })
            };
        }

        // Validate user type
        if (!['investor', 'sme'].includes(userType)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid user type' })
            };
        }

        // Check if user exists
        const normalizedEmail = email.toLowerCase().trim();
        if (users.has(normalizedEmail)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'An account with this email already exists' })
            };
        }

        // Create user
        const user = {
            email: normalizedEmail,
            password: hashPassword(password),
            name: name.trim(),
            userType,
            createdAt: new Date().toISOString(),
            isEmailVerified: false,
            profileComplete: 0,
            lastLogin: null
        };

        users.set(normalizedEmail, user);

        // Generate token
        const token = createToken({
            email: user.email,
            userType: user.userType,
            name: user.name
        });

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({
                message: 'Account created successfully',
                token,
                user: {
                    email: user.email,
                    name: user.name,
                    userType: user.userType
                }
            })
        };
    }

    // Login endpoint
    if (path === '/api/auth/login' && method === 'POST') {
        // Validate input
        const validation = validateInput(body, ['email', 'password']);
        if (!validation.valid) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: validation.error })
            };
        }

        const { email, password } = body;

        // Validate email format
        if (!validateEmail(email)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid email format' })
            };
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = users.get(normalizedEmail);

        if (!user || user.password !== hashPassword(password)) {
            // Add delay to prevent timing attacks
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid email or password' })
            };
        }

        // Update last login
        user.lastLogin = new Date().toISOString();

        const token = createToken({
            email: user.email,
            userType: user.userType,
            name: user.name
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Login successful',
                token,
                user: {
                    email: user.email,
                    name: user.name,
                    userType: user.userType,
                    isEmailVerified: user.isEmailVerified || false
                }
            })
        };
    }

    // Verify token endpoint
    if (path === '/api/auth/verify' && method === 'GET') {
        const authHeader = event.headers?.authorization || event.headers?.Authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'No token provided' })
            };
        }

        const token = authHeader.substring(7);
        const payload = verifyToken(token);

        if (!payload) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid or expired token' })
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                valid: true,
                user: payload
            })
        };
    }

    // 404 for unknown routes
    return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
            error: 'Route not found',
            path,
            method
        })
    };
}