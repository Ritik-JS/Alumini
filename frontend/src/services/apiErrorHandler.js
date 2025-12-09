/**
 * Standardized API Error Handler
 * 
 * Provides consistent error formatting across all API services
 * Ensures no fallback to mock data and user-friendly error messages
 */

/**
 * Get user-friendly error message based on HTTP status code and error details
 * @param {Error} error - Axios error object
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
  // Check if this is a network error (backend down)
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'Request timeout. Please check your connection and try again.';
    }
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      return 'Unable to connect to server. Please try again later.';
    }
    return 'Unable to connect to server. Please check your internet connection.';
  }

  // Extract error message from response
  const status = error.response.status;
  const responseData = error.response.data;
  
  // Try to get error message from various response formats
  const backendMessage = 
    responseData?.error || 
    responseData?.message || 
    responseData?.detail ||
    responseData?.msg;

  // Return backend message if available, otherwise use status-based message
  if (backendMessage && typeof backendMessage === 'string') {
    return backendMessage;
  }

  // Status-based error messages
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Please login to continue.';
    case 403:
      return "You don't have permission for this action.";
    case 404:
      return 'Resource not found.';
    case 409:
      return 'This resource already exists or conflicts with existing data.';
    case 422:
      return 'Invalid data format. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
      return 'Server is temporarily unavailable. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    case 504:
      return 'Server timeout. Please try again later.';
    default:
      return `Server error (${status}). Please try again later.`;
  }
};

/**
 * Handle API errors with consistent format
 * @param {Error} error - Axios error object
 * @param {*} defaultData - Default data to return (optional)
 * @returns {Object} Standardized error response { success: false, error: string, data: defaultData }
 */
export const handleApiError = (error, defaultData = null) => {
  const errorMessage = getErrorMessage(error);
  
  // Log error for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
  }

  return {
    success: false,
    error: errorMessage,
    data: defaultData,
  };
};

/**
 * Handle API success response with consistent format
 * @param {Object} response - Axios response object
 * @returns {Object} Response data or standardized format
 */
export const handleApiSuccess = (response) => {
  // If response already has success field, return as is
  if (response.data && typeof response.data.success !== 'undefined') {
    return response.data;
  }

  // Otherwise wrap in standard format
  return {
    success: true,
    data: response.data,
  };
};

/**
 * Axios interceptor for consistent error handling
 * Can be used to automatically attach to axios instances
 */
export const errorInterceptor = (error) => {
  // Never fallback to mock data - always return error
  return Promise.reject(error);
};
