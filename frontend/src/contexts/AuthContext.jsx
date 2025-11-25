import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockAuthService as mockAuth } from '@/services/mockAuth';

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
      const response = await mockAuth.login(email, password);
      
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        return { success: true, user: response.user };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await mockAuth.register(userData);
      
      if (response.success) {
        return { success: true, message: 'Registration successful! Please check your email for verification.' };
      }
      
      return { success: false, message: response.message };
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
      const response = await mockAuth.forgotPassword(email);
      return response;
    } catch (error) {
      return { success: false, message: 'Failed to send reset email.' };
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await mockAuth.resetPassword(token, newPassword);
      return response;
    } catch (error) {
      return { success: false, message: 'Failed to reset password.' };
    }
  };

  const googleSignIn = async () => {
    try {
      const response = await mockAuth.googleSignIn();
      
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        return { success: true, user: response.user };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: 'Google sign-in failed.' };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    googleSignIn,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
