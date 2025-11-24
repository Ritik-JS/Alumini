import mockData from '@/mockdata.json';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate mock JWT token
const generateToken = (userId) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ userId, exp: Date.now() + 24 * 60 * 60 * 1000 }));
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
};

export const mockAuth = {
  login: async (email, password) => {
    await delay(800);
    
    // Find user in mock data
    const user = mockData.users.find(u => u.email === email);
    
    if (!user) {
      return { success: false, message: 'Invalid email or password' };
    }
    
    // In mock mode, accept any password for existing users
    const token = generateToken(user.id);
    
    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
      },
    };
  },

  register: async (userData) => {
    await delay(1000);
    
    // Check if email already exists
    const existingUser = mockData.users.find(u => u.email === userData.email);
    
    if (existingUser) {
      return { success: false, message: 'Email already registered' };
    }
    
    // In mock mode, always succeed
    return {
      success: true,
      message: 'Registration successful! Please check your email for verification.',
    };
  },

  forgotPassword: async (email) => {
    await delay(800);
    
    // Check if user exists
    const user = mockData.users.find(u => u.email === email);
    
    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return {
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
      };
    }
    
    return {
      success: true,
      message: 'Password reset link has been sent to your email.',
    };
  },

  resetPassword: async (token, newPassword) => {
    await delay(800);
    
    // In mock mode, always succeed
    return {
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    };
  },

  googleSignIn: async () => {
    await delay(1000);
    
    // Simulate Google Sign-in with first user
    const user = mockData.users[0];
    const token = generateToken(user.id);
    
    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified,
      },
    };
  },
};
