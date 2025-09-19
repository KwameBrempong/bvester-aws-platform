// Bvester Configuration Management
// This file handles environment-specific configurations

(function(global) {
    'use strict';

    // Environment detection
    function detectEnvironment() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;

        // Production environment
        if (hostname === 'bvester.com' || hostname === 'www.bvester.com') {
            return 'production';
        }

        // Staging environment
        if (hostname.includes('staging') || hostname.includes('s3-website')) {
            return 'staging';
        }

        // Local development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'development';
        }

        // Default to staging for unknown environments
        return 'staging';
    }

    // Configuration for different environments
    const configurations = {
        development: {
            API_BASE: 'https://y06kgtou3i.execute-api.eu-west-2.amazonaws.com/dev',
            ENVIRONMENT: 'development',
            DEBUG: true,
            HTTPS_REQUIRED: false,
            SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
            CSRF_ENABLED: false // Disabled for local development
        },
        staging: {
            API_BASE: 'https://y06kgtou3i.execute-api.eu-west-2.amazonaws.com/staging',
            ENVIRONMENT: 'staging',
            DEBUG: true,
            HTTPS_REQUIRED: false, // S3 website doesn't support HTTPS
            SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
            CSRF_ENABLED: true
        },
        production: {
            API_BASE: 'https://y06kgtou3i.execute-api.eu-west-2.amazonaws.com/prod',
            ENVIRONMENT: 'production',
            DEBUG: false,
            HTTPS_REQUIRED: true,
            SESSION_TIMEOUT: 15 * 60 * 1000, // 15 minutes for production
            CSRF_ENABLED: true
        }
    };

    // Get current environment configuration
    const currentEnv = detectEnvironment();
    const config = configurations[currentEnv];

    // Add security validations
    config.validateSecureContext = function() {
        if (config.HTTPS_REQUIRED && window.location.protocol !== 'https:') {
            console.warn('SECURITY WARNING: HTTPS required in production environment');
            // Redirect to HTTPS in production
            if (config.ENVIRONMENT === 'production') {
                window.location.href = 'https://' + window.location.host + window.location.pathname;
                return false;
            }
        }
        return true;
    };

    // Enhanced API call wrapper with security
    config.secureApiCall = function(endpoint, options = {}) {
        // Validate secure context
        if (!config.validateSecureContext()) {
            return Promise.reject(new Error('Insecure context'));
        }

        // Default secure options
        const secureOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                ...options.headers
            },
            credentials: 'same-origin', // Include cookies
            ...options
        };

        // Add CSRF token if enabled and available
        if (config.CSRF_ENABLED) {
            const csrfToken = getCsrfToken();
            if (csrfToken) {
                secureOptions.headers['X-CSRF-Token'] = csrfToken;
            }
        }

        // Make the API call
        return fetch(config.API_BASE + endpoint, secureOptions)
            .then(response => {
                // Check for security-related status codes
                if (response.status === 401) {
                    // Unauthorized - clear session and redirect to login
                    clearSession();
                    window.location.href = '/login-final.html';
                    throw new Error('Authentication required');
                }

                if (response.status === 403) {
                    throw new Error('Access forbidden');
                }

                if (response.status === 429) {
                    throw new Error('Too many requests - please try again later');
                }

                return response;
            });
    };

    // Secure Session Management
    function generateCsrfToken() {
        // Generate a random CSRF token
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function getCsrfToken() {
        // Try to get CSRF token from meta tag first
        const metaToken = document.querySelector('meta[name="csrf-token"]');
        if (metaToken && metaToken.getAttribute('content')) {
            return metaToken.getAttribute('content');
        }

        // Generate new token if none exists
        let token = sessionStorage.getItem('csrf-token');
        if (!token) {
            token = generateCsrfToken();
            sessionStorage.setItem('csrf-token', token);

            // Update meta tag
            const metaElement = document.querySelector('meta[name="csrf-token"]');
            if (metaElement) {
                metaElement.setAttribute('content', token);
            }
        }

        return token;
    }

    function initializeCsrfProtection() {
        if (config.CSRF_ENABLED) {
            // Generate and set CSRF token
            const token = getCsrfToken();
            config.log('CSRF protection initialized', 'info');
        }
    }

    function clearSession() {
        // Clear all session data
        sessionStorage.clear();

        // Clear legacy localStorage items
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('bvesterToken');
        localStorage.removeItem('bvesterUser');

        // Clear any authentication cookies
        document.cookie.split(";").forEach(function(c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
    }

    // Secure token storage using sessionStorage (more secure than localStorage)
    function setSecureToken(token, userData = {}) {
        const expirationTime = Date.now() + config.SESSION_TIMEOUT;
        const sessionData = {
            token: token,
            userData: userData,
            expiresAt: expirationTime,
            createdAt: Date.now()
        };

        // Store in sessionStorage (cleared when browser/tab closes)
        sessionStorage.setItem('bvesterSecureSession', JSON.stringify(sessionData));

        // Set session timeout
        setTimeout(() => {
            if (getSecureToken()) {
                clearSession();
                config.log('Session expired - user logged out', 'info');
                // Redirect to login if not already there
                if (window.location.pathname !== '/login-final.html') {
                    window.location.href = '/login-final.html?expired=true';
                }
            }
        }, config.SESSION_TIMEOUT);

        config.log('Secure session established', 'info');
    }

    function getSecureToken() {
        try {
            const sessionData = sessionStorage.getItem('bvesterSecureSession');
            if (!sessionData) return null;

            const parsed = JSON.parse(sessionData);

            // Check if session has expired
            if (Date.now() > parsed.expiresAt) {
                clearSession();
                return null;
            }

            return parsed;
        } catch (error) {
            config.log('Error retrieving secure token: ' + error.message, 'error');
            clearSession();
            return null;
        }
    }

    function isUserAuthenticated() {
        const session = getSecureToken();
        return session && session.token;
    }

    // Security utilities
    config.security = {
        clearSession: clearSession,
        getCsrfToken: getCsrfToken,
        generateCsrfToken: generateCsrfToken,
        initializeCsrfProtection: initializeCsrfProtection,
        setSecureToken: setSecureToken,
        getSecureToken: getSecureToken,
        isUserAuthenticated: isUserAuthenticated,

        // Input sanitization
        sanitizeInput: function(input) {
            if (typeof input !== 'string') return input;
            return input
                .replace(/[<>\"']/g, function(match) {
                    const map = {
                        '<': '&lt;',
                        '>': '&gt;',
                        '"': '&quot;',
                        "'": '&#x27;'
                    };
                    return map[match];
                });
        },

        // Validate email format
        validateEmail: function(email) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email);
        },

        // Validate password strength
        validatePassword: function(password) {
            return {
                isValid: password.length >= 8 &&
                        /[A-Z]/.test(password) &&
                        /[a-z]/.test(password) &&
                        /[0-9]/.test(password),
                length: password.length >= 8,
                hasUpper: /[A-Z]/.test(password),
                hasLower: /[a-z]/.test(password),
                hasNumber: /[0-9]/.test(password)
            };
        }
    };

    // Logging utility
    config.log = function(message, level = 'info') {
        if (config.DEBUG || level === 'error') {
            console[level](`[Bvester ${config.ENVIRONMENT.toUpperCase()}] ${message}`);
        }
    };

    // Export configuration to global scope
    global.BvesterConfig = config;

    // Initialize security features
    document.addEventListener('DOMContentLoaded', function() {
        config.security.initializeCsrfProtection();
    });

    // Log current environment
    config.log(`Initialized in ${config.ENVIRONMENT} environment`);

})(window);