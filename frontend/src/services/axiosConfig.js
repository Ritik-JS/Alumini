/**
 * Axios Configuration with Global Interceptors
 * 
 * This file configures axios with automatic authentication header injection
 * and centralized error handling for all API requests.
 */
import axios from 'axios';

// Get backend URL from environment
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Add authentication token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 API Request: ${config.method.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    // Handle request error
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle common response scenarios
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method.toUpperCase()} ${response.config.url}`, response.status);
    }
    
    return response;
  },
  (error) => {
    // Handle response errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle 401 Unauthorized - Token expired or invalid
      if (status === 401) {
        console.warn('🔒 Unauthorized: Token expired or invalid');
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // Handle 403 Forbidden
      if (status === 403) {
        console.warn('🚫 Forbidden: Access denied');
      }
      
      // Handle 404 Not Found
      if (status === 404) {
        console.warn('🔍 Not Found:', error.config.url);
      }
      
      // Handle 500 Server Error
      if (status >= 500) {
        console.error('🔥 Server Error:', status);
      }
      
      // Log error details in development
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ API Error: ${error.config.method.toUpperCase()} ${error.config.url}`, {
          status,
          data,
          message: data?.detail || data?.message || 'Unknown error',
        });
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('📡 Network Error: No response from server');
    } else {
      // Something else happened
      console.error('⚠️ Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Export configured axios instance
export default axiosInstance;

// Export backend URL for direct use if needed
export { BACKEND_URL };
