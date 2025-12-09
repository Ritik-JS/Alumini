import axios from 'axios';

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
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  },

  register: async (userData) => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/register`, userData);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  },

  forgotPassword: async (email) => {
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
  },

  resetPassword: async (token, newPassword) => {
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
  },

  googleSignIn: async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/google-signin`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Google sign-in failed',
      };
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
      return {
        success: false,
        message: error.response?.data?.detail || error.response?.data?.message || 'Password change failed',
      };
    }
  },
};
