/**
 * Bvester AWS API Client
 * Production-ready API client for AWS backend
 */

class BvesterAWSAPI {
    constructor() {
        // AWS Backend URLs
        this.productionURL = 'http://bvester-backend-env.eba-ivjm3qsc.eu-west-2.elasticbeanstalk.com';
        this.localURL = 'http://localhost:8080';
        
        // Auto-detect environment
        this.apiURL = window.location.hostname === 'localhost' ? this.localURL : this.productionURL;
        
        // User session
        this.token = localStorage.getItem('bvester_token');
        this.currentUser = JSON.parse(localStorage.getItem('bvester_user') || 'null');
        
        // Request configuration
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (this.token) {
            this.defaultHeaders['Authorization'] = `Bearer ${this.token}`;
        }
    }

    // =====================
    // HELPER METHODS
    // =====================
    
    async request(endpoint, options = {}) {
        const url = `${this.apiURL}${endpoint}`;
        
        const config = {
            ...options,
            headers: {
                ...this.defaultHeaders,
                ...(options.headers || {})
            }
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }
    
    setAuthToken(token, user) {
        this.token = token;
        this.currentUser = user;
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
        
        localStorage.setItem('bvester_token', token);
        localStorage.setItem('bvester_user', JSON.stringify(user));
    }
    
    clearAuth() {
        this.token = null;
        this.currentUser = null;
        delete this.defaultHeaders['Authorization'];
        
        localStorage.removeItem('bvester_token');
        localStorage.removeItem('bvester_user');
    }
    
    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }

    // =====================
    // AUTHENTICATION APIs
    // =====================
    
    async register(userData) {
        const response = await this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (response.success && response.token) {
            this.setAuthToken(response.token, response.user);
        }
        
        return response;
    }
    
    async login(email, password) {
        const response = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response.success && response.token) {
            this.setAuthToken(response.token, response.user);
        }
        
        return response;
    }
    
    async logout() {
        this.clearAuth();
        window.location.href = '/';
    }
    
    // =====================
    // USER PROFILE APIs
    // =====================
    
    async getProfile() {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        return await this.request('/api/users/profile');
    }
    
    async updateProfile(updates) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        return await this.request('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }
    
    // =====================
    // BUSINESS MANAGEMENT APIs
    // =====================
    
    async createBusiness(businessData) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        return await this.request('/api/businesses', {
            method: 'POST',
            body: JSON.stringify(businessData)
        });
    }
    
    async getMyBusinesses() {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        return await this.request('/api/businesses/my-businesses');
    }
    
    async getAllBusinesses(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/api/businesses?${params}`);
    }
    
    async getBusinessById(businessId) {
        return await this.request(`/api/businesses/${businessId}`);
    }
    
    async updateBusiness(businessId, updates) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        return await this.request(`/api/businesses/${businessId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }
    
    // =====================
    // INVESTMENT APIs
    // =====================
    
    async createInvestmentOpportunity(investmentData) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        return await this.request('/api/investments', {
            method: 'POST',
            body: JSON.stringify(investmentData)
        });
    }
    
    async getInvestmentOpportunities(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`/api/investments?${params}`);
    }
    
    async investInBusiness(investmentId, amount, paymentMethod) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        return await this.request(`/api/investments/${investmentId}/invest`, {
            method: 'POST',
            body: JSON.stringify({ amount, paymentMethod })
        });
    }
    
    // =====================
    // ANALYTICS APIs
    // =====================
    
    async calculateReadinessScore(businessData) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        return await this.request('/api/analytics/readiness-score', {
            method: 'POST',
            body: JSON.stringify(businessData)
        });
    }
    
    async getPlatformStats() {
        return await this.request('/api/analytics/stats');
    }
    
    // =====================
    // PORTFOLIO MANAGEMENT APIs
    // =====================
    
    async getPortfolio() {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        return await this.request('/api/investments/portfolio');
    }
    
    async getDashboardAnalytics() {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        return await this.request('/api/analytics/dashboard');
    }
    
    // =====================
    // FILE UPLOAD APIs
    // =====================
    
    async getUploadURL(fileName, fileType) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }
        
        return await this.request('/api/upload/presigned-url', {
            method: 'POST',
            body: JSON.stringify({ fileName, fileType })
        });
    }
    
    async uploadFile(file) {
        // Get presigned URL
        const { uploadUrl, key } = await this.getUploadURL(file.name, file.type);
        
        // Upload directly to S3
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
        
        if (!uploadResponse.ok) {
            throw new Error('File upload failed');
        }
        
        return { key, url: uploadUrl.split('?')[0] };
    }
}

// Initialize global API instance
window.bvesterAPI = new BvesterAWSAPI();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BvesterAWSAPI;
}