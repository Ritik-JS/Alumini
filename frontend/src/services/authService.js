import axios from 'axios';
import mockData from '../mockdata.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

// Storage keys for mock
const AUTH_KEY = 'auth_user';
const TOKEN_KEY = 'auth_token';

// Mock helper: Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Unified Authentication Service
export const authService = {
  // Login
  async login(email, password) {
    if (USE_MOCK_DATA) {
      // Mock implementation
      await delay(500);
      const user = mockData.users?.find(u => u.email === email);
      
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const token = `mock_token_${Date.now()}`;
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_KEY, token);

      return {
        success: true,
        user,
        token,
      };
    } else {
      // API implementation
      try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
          email,
          password,
        });
        return response.data;
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Login failed',
        };
      }
    }
  },

  // Register
  async register(userData) {
    if (USE_MOCK_DATA) {
      // Mock implementation
      await delay(500);
      const existingUser = mockData.users?.find(u => u.email === userData.email);
      
      if (existingUser) {
        throw new Error('Email already registered');
      }

      const newUser = {
        id: `user-${Date.now()}`,
        email: userData.email,
        password_hash: 'hashed_password',
        role: userData.role || 'student',
        is_verified: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const token = `mock_token_${Date.now()}`;
      localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
      localStorage.setItem(TOKEN_KEY, token);

      return {
        success: true,
        user: newUser,
        token,
      };
    } else {
      // API implementation
      try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/register`, userData);
        return response.data;
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Registration failed',
        };
      }
    }
  },

  // Logout
  async logout() {
    if (USE_MOCK_DATA) {
      await delay(200);
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return { success: true };
    } else {
      // API implementation (if needed)
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(TOKEN_KEY);
      return { success: true };
    }
  },

  // Get current user
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(AUTH_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Get token
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Forgot Password
  async forgotPassword(email) {
    if (USE_MOCK_DATA) {
      await delay(500);
      return { success: true };
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/forgot-password`, {
          email,
        });
        return response.data;
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Request failed',
        };
      }
    }
  },

  // Reset Password
  async resetPassword(token, newPassword) {
    if (USE_MOCK_DATA) {
      await delay(500);
      return { success: true };
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/reset-password`, {
          token,
          newPassword,
        });
        return response.data;
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Password reset failed',
        };
      }
    }
  },

  // Verify Email
  async verifyEmail(code) {
    if (USE_MOCK_DATA) {
      await delay(500);
      return { success: true };
    } else {
      // API implementation if available
      return { success: true };
    }
  },

  // Google Sign In
  async googleSignIn() {
    if (USE_MOCK_DATA) {
      await delay(500);
      return { success: false, message: 'Mock does not support Google Sign-in' };
    } else {
      try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/google-signin`);
        return response.data;
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Google sign-in failed',
        };
      }
    }
  },

  // Update profile
  async updateProfile(userId, updates) {
    if (USE_MOCK_DATA) {
      await delay(500);
      const user = this.getCurrentUser();
      if (user && user.id === userId) {
        const updatedUser = { ...user, ...updates, updated_at: new Date().toISOString() };
        localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      }
      throw new Error('User not found');
    } else {
      // API implementation if available
      return { success: true };
    }
  },
};

export default authService;
