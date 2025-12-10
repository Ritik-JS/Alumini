import axios from './axiosConfig';
import { handleApiError } from './apiErrorHandler';

// Real Authentication API Service
export const apiAuth = {
  login: async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
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
      const response = await axios.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await axios.post('/api/auth/forgot-password', {
        email,
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await axios.post('/api/auth/reset-password', {
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
      const response = await axios.post('/api/auth/google-signin');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await axios.post(
        '/api/auth/change-password',
        {
          current_password: currentPassword,
          new_password: newPassword,
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

  verifyEmail: async (email, otpCode) => {
    try {
      const response = await axios.post('/api/auth/verify-email', {
        email,
        otp_code: otpCode,
      });
      return {
        success: true,
        message: response.data?.message || 'Email verified successfully',
        data: response.data,
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  resendVerification: async (email) => {
    try {
      const response = await axios.post('/api/auth/resend-verification', {
        email,
      });
      return {
        success: true,
        message: response.data?.message || 'Verification code resent',
        data: response.data,
      };
    } catch (error) {
      return handleApiError(error);
    }
  },
};
