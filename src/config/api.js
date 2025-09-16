/**
 * 🚀 BVESTER API CONFIGURATION
 * Central configuration for backend API endpoints
 */

// API Base URLs for different environments
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5001',
    timeout: 10000,
  },
  production: {
    baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://us-central1-bizinvest-hub-prod.cloudfunctions.net/api',
    timeout: 15000,
  },
  staging: {
    baseURL: process.env.EXPO_PUBLIC_STAGING_API_URL || 'https://us-central1-bizinvest-hub-prod.cloudfunctions.net/api',
    timeout: 12000,
  }
};

// Get current environment
const getCurrentEnvironment = () => {
  if (__DEV__) return 'development';
  if (process.env.EXPO_PUBLIC_ENVIRONMENT === 'staging') return 'staging';
  return 'production';
};

// Current API configuration
const currentConfig = API_CONFIG[getCurrentEnvironment()];

// API Endpoints
export const API_ENDPOINTS = {
  // Base URL
  BASE_URL: currentConfig.baseURL,
  
  // Health & Info
  HEALTH: '/health',
  INFO: '/api/info',
  
  // Authentication
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESET_PASSWORD: '/api/auth/reset-password',
    CHANGE_PASSWORD: '/api/auth/change-password',
    STATUS: '/api/auth/status',
  },
  
  // User Management
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    DELETE_ACCOUNT: '/api/users/delete',
    PREFERENCES: '/api/users/preferences',
    ACTIVITY: '/api/users/activity',
  },
  
  // Business Management
  BUSINESSES: {
    LIST: '/api/businesses',
    CREATE: '/api/businesses',
    GET_BY_ID: (id) => `/api/businesses/${id}`,
    UPDATE: (id) => `/api/businesses/${id}`,
    DELETE: (id) => `/api/businesses/${id}`,
    SEARCH: '/api/businesses/search',
    FEATURED: '/api/businesses/featured',
    BY_CATEGORY: (category) => `/api/businesses/category/${category}`,
    ANALYTICS: (id) => `/api/businesses/${id}/analytics`,
    DOCUMENTS: (id) => `/api/businesses/${id}/documents`,
  ),
  
  // Investment Management
  INVESTMENTS: {
    LIST: '/api/investments',
    CREATE: '/api/investments',
    GET_BY_ID: (id) => `/api/investments/${id}`,
    UPDATE: (id) => `/api/investments/${id}`,
    CANCEL: (id) => `/api/investments/${id}/cancel`,
    PORTFOLIO: '/api/investments/portfolio',
    HISTORY: '/api/investments/history',
    ANALYTICS: '/api/investments/analytics',
  },
  
  // Investor Features
  INVESTORS: {
    DASHBOARD: '/api/investors/dashboard',
    RECOMMENDATIONS: '/api/investors/recommendations',
    WATCHLIST: '/api/investors/watchlist',
    PORTFOLIO: '/api/investors/portfolio',
    TRANSACTIONS: '/api/investors/transactions',
    PREFERENCES: '/api/investors/preferences',
  },
  
  // Payment Processing
  PAYMENTS: {
    METHODS: '/api/payments/methods/supported',
    PROCESS: '/api/payments/process',
    HISTORY: '/api/payments/history',
    REFUND: (id) => `/api/payments/${id}/refund`,
    STRIPE_SETUP: '/api/payments/stripe/setup-intent',
    FLUTTERWAVE_SETUP: '/api/payments/flutterwave/setup',
    WEBHOOKS: {
      STRIPE: '/api/webhooks/stripe',
      FLUTTERWAVE: '/api/webhooks/flutterwave',
    },
  },
  
  // AI & Matching
  MATCHING: {
    RECOMMENDATIONS: (userId) => `/api/matching/recommendations/${userId}`,
    INVESTORS: (businessId) => `/api/matching/investors/${businessId}`,
    COMPATIBILITY: '/api/matching/compatibility',
    FEEDBACK: '/api/matching/feedback',
  },
  
  // ESG Scoring
  ESG: {
    SCORES: (businessId) => `/api/esg/scores/${businessId}`,
    CALCULATE: (businessId) => `/api/esg/calculate/${businessId}`,
    LEADERBOARD: '/api/esg/leaderboard',
    TEMPLATES: '/api/esg/assessment-templates',
    SUBMIT_ASSESSMENT: '/api/esg/submit-assessment',
  },
  
  // Analytics & Reporting
  ANALYTICS: {
    DASHBOARD: '/api/analytics/dashboard',
    BUSINESS: (id) => `/api/analytics/business/${id}`,
    INVESTOR: (id) => `/api/analytics/investor/${id}`,
    PLATFORM: '/api/analytics/platform',
    REPORTS: '/api/analytics/reports',
    EXPORT: '/api/analytics/export',
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    SEND: '/api/notifications/send',
    MARK_READ: (id) => `/api/notifications/${id}/read`,
    PREFERENCES: '/api/notifications/preferences',
    UNSUBSCRIBE: '/api/notifications/unsubscribe',
  },
  
  // Document Management
  DOCUMENTS: {
    UPLOAD: '/api/documents/upload',
    LIST: '/api/documents',
    GET: (id) => `/api/documents/${id}`,
    DELETE: (id) => `/api/documents/${id}`,
    VERIFY: (id) => `/api/documents/${id}/verify`,
    TEMPLATES: '/api/documents/templates',
  },
  
  // Admin Panel
  ADMIN: {
    DASHBOARD: '/api/admin/dashboard',
    USERS: '/api/admin/users',
    BUSINESSES: '/api/admin/businesses',
    INVESTMENTS: '/api/admin/investments',
    ANALYTICS: '/api/admin/analytics',
    SYSTEM: '/api/admin/system',
    ANNOUNCEMENTS: '/api/admin/announcements',
    STATS: '/api/admin/stats',
  },
  
  // VR Tours
  VR: {
    TOURS: '/api/vr/tours',
    CREATE_TOUR: '/api/vr/create',
    SCHEDULE: '/api/vr/schedule',
    JOIN: (id) => `/api/vr/join/${id}`,
  },
  
  // Messaging
  MESSAGING: {
    CONVERSATIONS: '/api/messaging/conversations',
    MESSAGES: (conversationId) => `/api/messaging/conversations/${conversationId}/messages`,
    SEND_MESSAGE: '/api/messaging/send',
    MARK_READ: (messageId) => `/api/messaging/messages/${messageId}/read`,
  },
};

// Default headers for API requests
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Request timeout configuration
export const REQUEST_CONFIG = {
  timeout: currentConfig.timeout,
  headers: DEFAULT_HEADERS,
};

// Helper function to build full URL
export const buildURL = (endpoint) => {
  return `${API_ENDPOINTS.BASE_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (token) => ({
  ...DEFAULT_HEADERS,
  'Authorization': `Bearer ${token}`,
});

// API Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Environment info
export const API_INFO = {
  environment: getCurrentEnvironment(),
  baseURL: currentConfig.baseURL,
  timeout: currentConfig.timeout,
  version: '1.0.0',
};

console.log(`🚀 Bvester API configured for ${API_INFO.environment}:`, API_INFO.baseURL);

export default {
  API_ENDPOINTS,
  DEFAULT_HEADERS,
  REQUEST_CONFIG,
  buildURL,
  getAuthHeaders,
  HTTP_STATUS,
  API_INFO,
};