// Mock Authentication Service
// This is used for development and testing without a backend

import mockData from '../mockdata.json';

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Storage keys - MUST match what AuthContext.jsx uses
const AUTH_KEY = 'user';
const TOKEN_KEY = 'token';

export const mockAuthService = {
  // Login
  async login(email, password) {
    await delay(500);

    // Find user in mock data
    const user = mockData.users?.find(u => u.email === email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // For mock, accept any password
    // In real app, password would be checked against password_hash
    
    // Generate mock token
    const token = `mock_token_${Date.now()}`;
    
    // Clear any old/conflicting localStorage keys
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    
    // Store auth data with correct keys
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);

    return {
      success: true,
      user,
      token,
    };
  },

  // Register
  async register(userData) {
    await delay(500);

    // Check if email already exists
    const existingUser = mockData.users?.find(u => u.email === userData.email);
    
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Create new user
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

    // In a real app, this would be saved to database
    // For mock, we just return success
    
    const token = `mock_token_${Date.now()}`;
    
    // Clear any old/conflicting localStorage keys
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    
    localStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    localStorage.setItem(TOKEN_KEY, token);

    return {
      success: true,
      user: newUser,
      token,
    };
  },

  // Logout
  async logout() {
    await delay(200);
    // Remove current keys
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(TOKEN_KEY);
    // Also remove any old keys for cleanup
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('rememberMe');
    return { success: true };
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

  // Verify email
  async verifyEmail(code) {
    await delay(500);
    return { success: true };
  },

  // Request password reset
  async requestPasswordReset(email) {
    await delay(500);
    return { success: true };
  },

  // Reset password
  async resetPassword(token, newPassword) {
    await delay(500);
    return { success: true };
  },

  // Update profile
  async updateProfile(userId, updates) {
    await delay(500);
    
    const user = this.getCurrentUser();
    if (user && user.id === userId) {
      const updatedUser = { ...user, ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    }
    
    throw new Error('User not found');
  },
};
