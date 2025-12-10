import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await authService.login(email, password);
      
      // Check for successful login (backend returns access_token on success)
      if (response.access_token && response.user) {
        setUser(response.user);
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        return { success: true, user: response.user };
      }
      
      // Handle error response
      return { success: false, message: response.error || response.message || 'Login failed. Please try again.' };
    } catch (error) {
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      
      if (response.success) {
        return { success: true, message: 'Registration successful! Please check your email for verification.' };
      }
      
      return { success: false, message: response.error || response.message || 'Registration failed. Please try again.' };
    } catch (error) {
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
  };

  const forgotPassword = async (email) => {
    try {
      const response = await authService.forgotPassword(email);
      return response;
    } catch (error) {
      return { success: false, message: 'Failed to send reset email.' };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await authService.resetPassword(token, newPassword);
      return response;
    } catch (error) {
      return { success: false, message: 'Failed to reset password.' };
    }
  };

  const googleSignIn = async () => {
    try {
      const response = await authService.googleSignIn();
      
      // Check for successful login (backend returns access_token on success)
      if (response.access_token && response.user) {
        setUser(response.user);
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        return { success: true, user: response.user };
      }
      
      // Handle error response
      return { success: false, message: response.error || response.message || 'Google sign-in failed.' };
    } catch (error) {
      return { success: false, message: 'Google sign-in failed.' };
    }
  };
  
  const verifyEmail = async (email, otpCode) => {
    try {
      const response = await authService.verifyEmail(email, otpCode);
      return response;
    } catch (error) {
      return { success: false, message: 'Email verification failed.' };
    }
  };

  const resendVerification = async (email) => {
    try {
      const response = await authService.resendVerification(email);
      return response;
    } catch (error) {
      return { success: false, message: 'Failed to resend verification code.' };
    }
  };


  const value = {
    user,
    loading,
    isAuthenticated: !!user, // Boolean check if user exists
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    googleSignIn,
    verifyEmail,
    resendVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
