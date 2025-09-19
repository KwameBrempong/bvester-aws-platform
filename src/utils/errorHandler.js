// Production-ready error handling utility for BizInvest Hub

export const handleFirebaseError = (error) => {
  console.error('Firebase Error:', error);
  
  // Map Firebase error codes to user-friendly messages
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    
    // Firestore errors
    case 'permission-denied':
      return 'You do not have permission to perform this action.';
    case 'unavailable':
      return 'Service is temporarily unavailable. Please try again.';
    case 'deadline-exceeded':
      return 'Request timed out. Please check your connection and try again.';
    case 'resource-exhausted':
      return 'Service quota exceeded. Please try again later.';
    case 'unauthenticated':
      return 'Please log in to continue.';
    case 'cancelled':
      return 'Operation was cancelled.';
    case 'data-loss':
      return 'Data error occurred. Please contact support.';
    case 'unknown':
      return 'An unknown error occurred. Please try again.';
    case 'invalid-argument':
      return 'Invalid data provided. Please check your input.';
    case 'not-found':
      return 'The requested data was not found.';
    case 'already-exists':
      return 'This record already exists.';
    case 'failed-precondition':
      return 'Operation failed due to current system state.';
    case 'aborted':
      return 'Operation was aborted due to a conflict.';
    case 'out-of-range':
      return 'Value is out of valid range.';
    case 'unimplemented':
      return 'This feature is not yet available.';
    case 'internal':
      return 'Internal server error. Please try again later.';
    
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

export const handleNetworkError = (error) => {
  console.error('Network Error:', error);
  
  if (!navigator.onLine) {
    return 'You appear to be offline. Please check your internet connection.';
  }
  
  if (error.message?.includes('timeout')) {
    return 'Request timed out. Please check your connection and try again.';
  }
  
  return 'Network error occurred. Please try again.';
};

export const handleValidationError = (field, value, rules = {}) => {
  const { required, minLength, maxLength, pattern, min, max } = rules;
  
  if (required && (!value || value.toString().trim() === '')) {
    return `${field} is required.`;
  }
  
  if (minLength && value && value.toString().length < minLength) {
    return `${field} must be at least ${minLength} characters.`;
  }
  
  if (maxLength && value && value.toString().length > maxLength) {
    return `${field} must be no more than ${maxLength} characters.`;
  }
  
  if (pattern && value && !pattern.test(value.toString())) {
    return `Please enter a valid ${field.toLowerCase()}.`;
  }
  
  if (min !== undefined && value !== undefined && Number(value) < min) {
    return `${field} must be at least ${min}.`;
  }
  
  if (max !== undefined && value !== undefined && Number(value) > max) {
    return `${field} must be no more than ${max}.`;
  }
  
  return null;
};

export const handleBusinessLogicError = (error, context = '') => {
  console.error(`Business Logic Error (${context}):`, error);
  
  // Handle specific business logic errors
  if (error.message?.includes('readiness score')) {
    return 'Business readiness score is too low for this action. Please improve your financial metrics first.';
  }
  
  if (error.message?.includes('insufficient funds')) {
    return 'Insufficient funds for this transaction.';
  }
  
  if (error.message?.includes('invalid amount')) {
    return 'Please enter a valid amount.';
  }
  
  if (error.message?.includes('duplicate')) {
    return 'This record already exists.';
  }
  
  return 'Unable to complete this action. Please try again.';
};

export const logErrorForAnalytics = (error, context, userId = null) => {
  // In production, this would send to analytics service
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      code: error.code,
      stack: error.stack
    },
    context,
    userId,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // For now, just console log in development
  if (__DEV__) {
    console.log('Error Analytics:', errorLog);
  }
  
  // TODO: In production, send to analytics service like:
  // analytics.track('error_occurred', errorLog);
};

// Helper for consistent error handling in async functions
export const withErrorHandling = async (asyncFunction, context = '', fallbackValue = null) => {
  try {
    return await asyncFunction();
  } catch (error) {
    const userMessage = handleFirebaseError(error);
    logErrorForAnalytics(error, context);
    
    // Re-throw with user-friendly message
    const enhancedError = new Error(userMessage);
    enhancedError.originalError = error;
    enhancedError.context = context;
    throw enhancedError;
  }
};

// Validation rules for common fields
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    required: true,
    minLength: 6
  },
  businessName: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  amount: {
    required: true,
    min: 0
  },
  investmentAmount: {
    required: true,
    min: 1000,
    max: 10000000
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 1000
  }
};

export default {
  handleFirebaseError,
  handleNetworkError,
  handleValidationError,
  handleBusinessLogicError,
  logErrorForAnalytics,
  withErrorHandling,
  validationRules
};