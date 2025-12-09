import axios from 'axios';
import { handleApiError } from './apiErrorHandler';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Real Authentication API Service
export const apiAuth = {
  login: async (email, password) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      // Use standardized error handler - returns { success: false, error: "message", data: null }
      return handleApiError(error);
    }
  },

  register: async (userData) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/register`, userData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/forgot-password`, {
        email,
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/reset-password`, {
        token,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  googleSignIn: async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/google-signin`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/change-password`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return {
        success: true,
        message: response.data?.message || 'Password changed successfully',
      };
    } catch (error) {
      return handleApiError(error);
    }
  },
};
