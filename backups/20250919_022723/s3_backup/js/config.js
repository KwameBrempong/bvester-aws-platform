// Bvester Frontend Configuration
const config = {
  // API Configuration
  API_BASE_URL: 'http://bvester-backend-env.eba-ivjm3qsc.eu-west-2.elasticbeanstalk.com', // Your live backend URL
  
  // AWS Configuration
  AWS_REGION: 'eu-west-2',
  S3_BUCKET: 'bvester-files-production',
  
  // Application Settings
  APP_NAME: 'Bvester',
  APP_VERSION: '2.0.0',
  ENVIRONMENT: 'production',
  
  // Feature Flags
  ENABLE_FILE_UPLOAD: true,
  ENABLE_INVESTMENTS: true,
  ENABLE_TRANSACTIONS: true,
  
  // Endpoints
  ENDPOINTS: {
    // Auth
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    
    // Users
    GET_USER: '/api/users',
    UPDATE_USER: '/api/users',
    
    // Businesses
    GET_BUSINESSES: '/api/businesses',
    CREATE_BUSINESS: '/api/businesses',
    GET_BUSINESS: '/api/businesses',
    
    // Investments
    GET_INVESTMENTS: '/api/investments',
    CREATE_INVESTMENT: '/api/investments',
    GET_USER_INVESTMENTS: '/api/investments/user',
    
    // Transactions
    GET_TRANSACTIONS: '/api/transactions',
    CREATE_TRANSACTION: '/api/transactions'
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}