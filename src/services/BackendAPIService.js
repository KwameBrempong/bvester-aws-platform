/**
 * 🚀 BVESTER BACKEND API SERVICE
 * Comprehensive service for communicating with the Bvester backend
 */

import { API_ENDPOINTS, getAuthHeaders, buildURL, HTTP_STATUS } from '../config/api';

class BackendAPIService {
  constructor() {
    this.baseURL = API_ENDPOINTS.BASE_URL;
    this.authToken = null;
  }

  // Set authentication token
  setAuthToken(token) {
    this.authToken = token;
  }

  // Clear authentication token
  clearAuthToken() {
    this.authToken = null;
  }

  // Generic request method
  async makeRequest(endpoint, options = {}) {
    const url = buildURL(endpoint);
    const headers = this.authToken 
      ? getAuthHeaders(this.authToken)
      : { 'Content-Type': 'application/json' };

    const config = {
      method: 'GET',
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        return { 
          success: false, 
          error: data.error || 'Request failed',
          status: response.status 
        };
      }
    } catch (error) {
      console.error('API Request Error:', error);
      return { 
        success: false, 
        error: error.message || 'Network error',
        networkError: true 
      };
    }
  }

  // ============================================================================
  // HEALTH & INFO
  // ============================================================================
  async getHealth() {
    return this.makeRequest(API_ENDPOINTS.HEALTH);
  }

  async getInfo() {
    return this.makeRequest(API_ENDPOINTS.INFO);
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  async register(userData) {
    return this.makeRequest(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    const result = await this.makeRequest(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Auto-set token on successful login
    if (result.success && result.data.token) {
      this.setAuthToken(result.data.token);
    }

    return result;
  }

  async logout() {
    const result = await this.makeRequest(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
    });
    
    // Clear token on logout
    this.clearAuthToken();
    return result;
  }

  async getAuthStatus() {
    return this.makeRequest(API_ENDPOINTS.AUTH.STATUS);
  }

  // ============================================================================
  // BUSINESS MANAGEMENT
  // ============================================================================
  async getBusinesses(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `${API_ENDPOINTS.BUSINESSES.LIST}?${queryParams}` : API_ENDPOINTS.BUSINESSES.LIST;
    return this.makeRequest(endpoint);
  }

  async getBusiness(businessId) {
    return this.makeRequest(API_ENDPOINTS.BUSINESSES.GET_BY_ID(businessId));
  }

  async createBusiness(businessData) {
    return this.makeRequest(API_ENDPOINTS.BUSINESSES.CREATE, {
      method: 'POST',
      body: JSON.stringify(businessData),
    });
  }

  async updateBusiness(businessId, updates) {
    return this.makeRequest(API_ENDPOINTS.BUSINESSES.UPDATE(businessId), {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async searchBusinesses(searchQuery) {
    return this.makeRequest(API_ENDPOINTS.BUSINESSES.SEARCH, {
      method: 'POST',
      body: JSON.stringify({ query: searchQuery }),
    });
  }

  // ============================================================================
  // INVESTMENT MANAGEMENT
  // ============================================================================
  async getInvestments() {
    return this.makeRequest(API_ENDPOINTS.INVESTMENTS.LIST);
  }

  async createInvestment(investmentData) {
    return this.makeRequest(API_ENDPOINTS.INVESTMENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(investmentData),
    });
  }

  async getInvestmentPortfolio() {
    return this.makeRequest(API_ENDPOINTS.INVESTMENTS.PORTFOLIO);
  }

  async getInvestmentHistory() {
    return this.makeRequest(API_ENDPOINTS.INVESTMENTS.HISTORY);
  }

  // ============================================================================
  // INVESTOR FEATURES
  // ============================================================================
  async getInvestorDashboard() {
    return this.makeRequest(API_ENDPOINTS.INVESTORS.DASHBOARD);
  }

  async getInvestorRecommendations(userId) {
    return this.makeRequest(API_ENDPOINTS.MATCHING.RECOMMENDATIONS(userId));
  }

  async getInvestorPortfolio() {
    return this.makeRequest(API_ENDPOINTS.INVESTORS.PORTFOLIO);
  }

  // ============================================================================
  // PAYMENT PROCESSING
  // ============================================================================
  async getSupportedPaymentMethods() {
    return this.makeRequest(API_ENDPOINTS.PAYMENTS.METHODS);
  }

  async processPayment(paymentData) {
    return this.makeRequest(API_ENDPOINTS.PAYMENTS.PROCESS, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getPaymentHistory() {
    return this.makeRequest(API_ENDPOINTS.PAYMENTS.HISTORY);
  }

  // ============================================================================
  // AI MATCHMAKING
  // ============================================================================
  async getBusinessRecommendations(userId) {
    return this.makeRequest(API_ENDPOINTS.MATCHING.RECOMMENDATIONS(userId));
  }

  async getInvestorMatches(businessId) {
    return this.makeRequest(API_ENDPOINTS.MATCHING.INVESTORS(businessId));
  }

  async submitMatchingFeedback(feedbackData) {
    return this.makeRequest(API_ENDPOINTS.MATCHING.FEEDBACK, {
      method: 'POST',
      body: JSON.stringify(feedbackData),
    });
  }

  // ============================================================================
  // ESG SCORING
  // ============================================================================
  async getESGScore(businessId) {
    return this.makeRequest(API_ENDPOINTS.ESG.SCORES(businessId));
  }

  async calculateESGScore(businessId, assessmentData) {
    return this.makeRequest(API_ENDPOINTS.ESG.CALCULATE(businessId), {
      method: 'POST',
      body: JSON.stringify(assessmentData),
    });
  }

  async getESGLeaderboard() {
    return this.makeRequest(API_ENDPOINTS.ESG.LEADERBOARD);
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================
  async getDashboardAnalytics() {
    return this.makeRequest(API_ENDPOINTS.ANALYTICS.DASHBOARD);
  }

  async getBusinessAnalytics(businessId) {
    return this.makeRequest(API_ENDPOINTS.ANALYTICS.BUSINESS(businessId));
  }

  async getPlatformAnalytics() {
    return this.makeRequest(API_ENDPOINTS.ANALYTICS.PLATFORM);
  }

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================
  async getNotifications() {
    return this.makeRequest(API_ENDPOINTS.NOTIFICATIONS.LIST);
  }

  async sendNotification(notificationData) {
    return this.makeRequest(API_ENDPOINTS.NOTIFICATIONS.SEND, {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

  async markNotificationRead(notificationId) {
    return this.makeRequest(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId), {
      method: 'PUT',
    });
  }

  // ============================================================================
  // ADMIN FEATURES
  // ============================================================================
  async getAdminStats() {
    return this.makeRequest(API_ENDPOINTS.ADMIN.STATS);
  }

  async getAdminDashboard() {
    return this.makeRequest(API_ENDPOINTS.ADMIN.DASHBOARD);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  // Test backend connectivity
  async testConnection() {
    console.log('🔍 Testing backend connection...');
    
    const health = await this.getHealth();
    if (health.success) {
      console.log('✅ Backend health check passed:', health.data);
      
      const info = await this.getInfo();
      if (info.success) {
        console.log('✅ Backend info retrieved:', info.data);
        return { 
          connected: true, 
          health: health.data, 
          info: info.data 
        };
      }
    }
    
    console.log('❌ Backend connection failed');
    return { 
      connected: false, 
      error: health.error || 'Connection failed' 
    };
  }

  // Get backend status
  async getBackendStatus() {
    const health = await this.getHealth();
    return {
      online: health.success,
      status: health.success ? health.data.status : 'offline',
      timestamp: new Date().toISOString(),
    };
  }

  // Demo data methods for testing
  async loginDemo() {
    return this.login({
      email: 'demo@bvester.com',
      password: 'demo123'
    });
  }

  async registerDemo() {
    return this.register({
      email: 'demo@bvester.com',
      password: 'demo123',
      userType: 'investor',
      firstName: 'Demo',
      lastName: 'User'
    });
  }
}

// Create singleton instance
const backendAPI = new BackendAPIService();

// Export both the class and the instance
export default backendAPI;
export { BackendAPIService };