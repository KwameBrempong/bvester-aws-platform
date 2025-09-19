<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple file-based storage (use database in production)
$usersFile = 'users.json';

// Load existing users
$users = [];
if (file_exists($usersFile)) {
    $users = json_decode(file_get_contents($usersFile), true) ?: [];
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);
$path = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Simple JWT implementation
function createToken($payload) {
    $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['exp'] = time() + (24 * 60 * 60); // 24 hours
    $body = base64_encode(json_encode($payload));
    $signature = base64_encode(hash_hmac('sha256', "$header.$body", 'bvester-secret-2024', true));
    return "$header.$body.$signature";
}

// Hash password
function hashPassword($password) {
    return hash('sha256', $password . 'bvester-salt');
}

// Health check
if ($path === '/health' || $path === '/auth.php/health') {
    echo json_encode([
        'status' => 'healthy',
        'message' => 'Bvester Backend API - PHP',
        'timestamp' => date('c')
    ]);
    exit();
}

// Signup
if (strpos($path, '/signup') !== false && $method === 'POST') {
    $email = strtolower(trim($input['email'] ?? ''));
    $password = $input['password'] ?? '';
    $name = trim($input['name'] ?? '');
    $userType = $input['userType'] ?? '';

    // Validation
    if (!$email || !$password || !$name || !$userType) {
        http_response_code(400);
        echo json_encode(['error' => 'All fields are required']);
        exit();
    }

    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters']);
        exit();
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        exit();
    }

    // Check if user exists
    if (isset($users[$email])) {
        http_response_code(400);
        echo json_encode(['error' => 'An account with this email already exists']);
        exit();
    }

    // Create user
    $users[$email] = [
        'email' => $email,
        'password' => hashPassword($password),
        'name' => $name,
        'userType' => $userType,
        'createdAt' => date('c')
    ];

    // Save users
    file_put_contents($usersFile, json_encode($users));

    // Generate token
    $token = createToken([
        'email' => $email,
        'name' => $name,
        'userType' => $userType
    ]);

    http_response_code(201);
    echo json_encode([
        'message' => 'Account created successfully',
        'token' => $token,
        'user' => [
            'email' => $email,
            'name' => $name,
            'userType' => $userType
        ]
    ]);
    exit();
}

// Login
if (strpos($path, '/login') !== false && $method === 'POST') {
    $email = strtolower(trim($input['email'] ?? ''));
    $password = $input['password'] ?? '';

    if (!$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Email and password are required']);
        exit();
    }

    if (!isset($users[$email]) || $users[$email]['password'] !== hashPassword($password)) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid email or password']);
        exit();
    }

    $user = $users[$email];
    $token = createToken([
        'email' => $email,
        'name' => $user['name'],
        'userType' => $user['userType']
    ]);

    echo json_encode([
        'message' => 'Login successful',
        'token' => $token,
        'user' => [
            'email' => $email,
            'name' => $user['name'],
            'userType' => $user['userType']
        ]
    ]);
    exit();
}

// 404
http_response_code(404);
echo json_encode(['error' => 'Route not found']);
?>