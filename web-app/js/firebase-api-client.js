// Firebase Functions API Client for Bvester Platform
// Production-ready API client optimized for Firebase Functions

class FirebaseAPIClient {
    constructor() {
        this.baseURL = 'https://us-central1-bizinvest-hub-prod.cloudfunctions.net/api';
        this.fallbackURL = 'https://bvester-platform-9ro801e68-kwame-brempongs-projects.vercel.app/api';
        this.currentURL = this.baseURL;
        this.authToken = null;
        this.retryAttempts = 3;
        this.timeout = 10000; // 10 seconds
        
        this.init();
    }

    init() {
        // Initialize authentication token from localStorage
        this.authToken = localStorage.getItem('authToken');
        
        // Setup token refresh if available
        if (window.firebase && window.firebase.auth) {
            window.firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    this.authToken = await user.getIdToken();
                    localStorage.setItem('authToken', this.authToken);
                } else {
                    this.authToken = null;
                    localStorage.removeItem('authToken');
                }
            });
        }

        console.log('Firebase API Client initialized');
    }

    /**
     * Make authenticated API request with fallback
     */
    async request(endpoint, options = {}) {
        const url = `${this.currentURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        if (this.authToken) {
            config.headers['Authorization'] = `Bearer ${this.authToken}`;
        }

        // Add timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        config.signal = controller.signal;

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            if (!response.ok) {
                // If Firebase Functions are down, try Vercel fallback
                if (response.status >= 500 && this.currentURL === this.baseURL) {
                    console.warn('Firebase Functions unavailable, falling back to Vercel');
                    this.currentURL = this.fallbackURL;
                    return this.request(endpoint, options);
                }
                
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Switch back to Firebase Functions on success
            if (this.currentURL === this.fallbackURL) {
                this.currentURL = this.baseURL;
                console.log('Switched back to Firebase Functions');
            }

            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }

            // Try fallback if primary fails
            if (this.currentURL === this.baseURL && this.retryAttempts > 0) {
                console.warn('Primary API failed, trying fallback:', error.message);
                this.currentURL = this.fallbackURL;
                this.retryAttempts--;
                return this.request(endpoint, options);
            }

            throw error;
        }
    }

    /**
     * Authentication endpoints
     */
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(idToken, deviceInfo = {}) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ idToken, deviceInfo })
        });
    }

    async logout(deviceToken = null, revokeAllSessions = false) {
        return this.request('/auth/logout', {
            method: 'POST',
            body: JSON.stringify({ deviceToken, revokeAllSessions })
        });
    }

    async getAuthStatus() {
        return this.request('/auth/status', {
            method: 'GET'
        });
    }

    async verifyEmail(oobCode) {
        return this.request('/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ oobCode })
        });
    }

    async forgotPassword(email) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    /**
     * Investment endpoints
     */
    async getInvestmentOpportunities(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = `/investments/opportunities${queryParams ? `?${queryParams}` : ''}`;
        return this.request(endpoint, { method: 'GET' });
    }

    async createInvestment(investmentData) {
        return this.request('/investments/create', {
            method: 'POST',
            body: JSON.stringify(investmentData)
        });
    }

    async getMyInvestments(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = `/investments/my-investments${queryParams ? `?${queryParams}` : ''}`;
        return this.request(endpoint, { method: 'GET' });
    }

    async getInvestmentDetails(investmentId) {
        return this.request(`/investments/${investmentId}`, {
            method: 'GET'
        });
    }

    async getPortfolioSummary() {
        return this.request('/investments/portfolio/summary', {
            method: 'GET'
        });
    }

    /**
     * Payment endpoints
     */
    async createStripePaymentIntent(paymentData) {
        return this.request('/payments/stripe/create-intent', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    async verifyStripePayment(paymentIntentId) {
        return this.request('/payments/stripe/verify', {
            method: 'POST',
            body: JSON.stringify({ paymentIntentId })
        });
    }

    async initializeFlutterwavePayment(paymentData) {
        return this.request('/payments/flutterwave/initialize', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    async verifyFlutterwavePayment(transactionId, txRef) {
        return this.request('/payments/flutterwave/verify', {
            method: 'POST',
            body: JSON.stringify({ transactionId, txRef })
        });
    }

    async getPaymentHistory(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = `/payments/history${queryParams ? `?${queryParams}` : ''}`;
        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * KYC endpoints
     */
    async getKYCStatus() {
        return this.request('/kyc/status', {
            method: 'GET'
        });
    }

    async submitKYC(kycData) {
        return this.request('/kyc/submit', {
            method: 'POST',
            body: JSON.stringify(kycData)
        });
    }

    async uploadKYCDocument(documentData) {
        return this.request('/kyc/upload-document', {
            method: 'POST',
            body: JSON.stringify(documentData)
        });
    }

    async getKYCSubmission(submissionId) {
        return this.request(`/kyc/submission/${submissionId}`, {
            method: 'GET'
        });
    }

    async resubmitKYC() {
        return this.request('/kyc/resubmit', {
            method: 'POST'
        });
    }

    /**
     * Utility methods
     */
    async healthCheck() {
        try {
            const response = await this.request('/health', { method: 'GET' });
            return { 
                status: 'healthy', 
                service: response.service,
                timestamp: response.timestamp 
            };
        } catch (error) {
            return { 
                status: 'unhealthy', 
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async refreshAuthToken() {
        if (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) {
            try {
                this.authToken = await window.firebase.auth().currentUser.getIdToken(true);
                localStorage.setItem('authToken', this.authToken);
                return this.authToken;
            } catch (error) {
                console.error('Token refresh failed:', error);
                this.authToken = null;
                localStorage.removeItem('authToken');
                throw error;
            }
        }
        throw new Error('No authenticated user found');
    }

    /**
     * Error handling and retry logic
     */
    isRetryableError(error) {
        return error.message.includes('timeout') || 
               error.message.includes('network') ||
               error.message.includes('500') ||
               error.message.includes('502') ||
               error.message.includes('503') ||
               error.message.includes('504');
    }

    async retryRequest(requestFn, maxRetries = 3) {
        let lastError;
        
        for (let i = 0; i <= maxRetries; i++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;
                
                if (i === maxRetries || !this.isRetryableError(error)) {
                    break;
                }
                
                // Exponential backoff
                const delay = Math.min(1000 * Math.pow(2, i), 10000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError;
    }

    /**
     * Real-time connection status
     */
    async checkConnectionStatus() {
        try {
            const start = Date.now();
            await this.healthCheck();
            const latency = Date.now() - start;
            
            return {
                connected: true,
                latency: latency,
                endpoint: this.currentURL,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                endpoint: this.currentURL,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Initialize global API client
window.firebaseAPI = new FirebaseAPIClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseAPIClient;
}

console.log('Firebase API Client loaded - Ready for Firebase Functions with Vercel fallback');