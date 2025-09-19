/**
 * Bvester API Client
 * Centralized API communication for authentication and app features
 */

class BvesterAPI {
    constructor() {
        // Use updated API Gateway endpoint
        this.baseURL = 'https://y06kgtou3i.execute-api.eu-west-2.amazonaws.com/prod';
        this.token = localStorage.getItem('bvester_token');
        this.currentUser = this.loadUserFromStorage();
    }

    /**
     * Get headers for API requests
     */
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Make API request with error handling
     */
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(options.includeAuth !== false),
                ...options.headers
            }
        };

        try {
            console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);

            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ API Response:', data);
            return data;

        } catch (error) {
            console.error('❌ API Error:', error);

            // Handle specific error types
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your connection and try again.');
            }

            if (error.message.includes('401')) {
                this.handleUnauthorized();
                throw new Error('Session expired. Please log in again.');
            }

            throw error;
        }
    }

    /**
     * Handle unauthorized responses
     */
    handleUnauthorized() {
        this.clearAuthData();
        if (window.location.pathname !== '/login.html') {
            window.location.href = 'login.html';
        }
    }

    /**
     * User Registration
     */
    async register(userData) {
        try {
            const response = await this.makeRequest('/auth/register', {
                method: 'POST',
                includeAuth: false,
                body: JSON.stringify({
                    email: userData.email,
                    password: userData.password,
                    userType: userData.userType,
                    profile: {
                        name: userData.name,
                        userType: userData.userType
                    }
                })
            });

            if (response.success) {
                // Store authentication data
                this.setAuthData(response.token, response.user);
                return response;
            } else {
                throw new Error(response.error || 'Registration failed');
            }

        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    /**
     * User Login
     */
    async login(email, password) {
        try {
            const response = await this.makeRequest('/auth/login', {
                method: 'POST',
                includeAuth: false,
                body: JSON.stringify({
                    email,
                    password
                })
            });

            if (response.success) {
                // Store authentication data
                this.setAuthData(response.token, response.user);
                return response;
            } else {
                throw new Error(response.error || 'Login failed');
            }

        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Demo Login (for testing without backend)
     */
    loginDemo(email, password) {
        const demoAccounts = {
            'sme@demo.com': {
                password: 'Demo123!',
                userType: 'sme',
                name: 'John SME Owner',
                id: 'demo_sme_001'
            },
            'investor@demo.com': {
                password: 'Demo123!',
                userType: 'investor',
                name: 'Jane Investor',
                id: 'demo_investor_001'
            }
        };

        // Load all created demo accounts from localStorage
        try {
            // Check for single new account (legacy support)
            const newAccount = localStorage.getItem('newDemoAccount');
            if (newAccount) {
                const account = JSON.parse(newAccount);
                demoAccounts[account.email] = {
                    password: account.password,
                    userType: account.userType,
                    name: account.name,
                    id: 'demo_' + Date.now()
                };
            }

            // Check for multiple demo accounts
            const allDemoAccounts = localStorage.getItem('allDemoAccounts');
            if (allDemoAccounts) {
                const accounts = JSON.parse(allDemoAccounts);
                Object.keys(accounts).forEach(accountEmail => {
                    const acc = accounts[accountEmail];
                    demoAccounts[accountEmail] = {
                        password: acc.password,
                        userType: acc.userType,
                        name: acc.name,
                        id: 'demo_' + accountEmail.replace(/[^a-zA-Z0-9]/g, '_')
                    };
                });
            }
        } catch (error) {
            console.warn('Error loading demo accounts in loginDemo:', error);
        }

        const account = demoAccounts[email];
        if (account && account.password === password) {
            const user = {
                id: account.id || 'demo_' + Date.now(),
                email: email,
                name: account.name,
                userType: account.userType,
                isDemo: true
            };

            // Store demo authentication data
            this.setAuthData('demo_token_' + Date.now(), user);
            return {
                success: true,
                user: user,
                token: this.token
            };
        } else {
            console.log('Available demo accounts:', Object.keys(demoAccounts));
            throw new Error('Invalid demo credentials for: ' + email);
        }
    }

    /**
     * User Logout
     */
    async logout() {
        try {
            // Call logout endpoint if we have a real token
            if (this.token && !this.token.startsWith('demo_token_')) {
                await this.makeRequest('/auth/logout', {
                    method: 'POST'
                });
            }
        } catch (error) {
            console.warn('Logout API call failed:', error);
        } finally {
            // Always clear local data
            this.clearAuthData();
        }
    }

    /**
     * Set authentication data
     */
    setAuthData(token, user) {
        this.token = token;
        this.currentUser = user;

        localStorage.setItem('bvester_token', token);
        localStorage.setItem('bvester_user', JSON.stringify(user));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userType', user.userType);
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userEmail', user.email);
    }

    /**
     * Clear authentication data
     */
    clearAuthData() {
        this.token = null;
        this.currentUser = null;

        localStorage.removeItem('bvester_token');
        localStorage.removeItem('bvester_user');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userType');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
    }

    /**
     * Load user from localStorage
     */
    loadUserFromStorage() {
        try {
            const userStr = localStorage.getItem('bvester_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.warn('Failed to load user from storage:', error);
            return null;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!(this.token && this.currentUser);
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get user type
     */
    getUserType() {
        return this.currentUser?.userType || null;
    }

    /**
     * Validate email format
     */
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     */
    static validatePassword(password) {
        const errors = [];

        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }

        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Create global instance
window.bvesterAPI = new BvesterAPI();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BvesterAPI;
}