// apis/auth.api.js - COMPLETE FIXED VERSION
import axiosInstance from '../utils/axiosInstance';

const authAPI = {
  // Login admin
  loginAdmin: async (email, password) => {
    try {
      console.log('Logging in with:', { email, password: '***' });
      
      // response is already the data from axiosInstance interceptor
      const response = await axiosInstance.post('/admin/login', {
        email,
        password
      });
      
      console.log('API Response:', response);
      
      // response is already the data, not response.data
      if (response) {
        // Check if response has a nested data property or is the data itself
        const responseData = response.data || response;
        const responseMessage = response.message || 'Login successful';
        
        return {
          success: true,
          data: responseData,
          message: responseMessage
        };
      } else {
        return {
          success: false,
          message: 'Invalid response from server',
          error: response
        };
      }
      
    } catch (error) {
      console.error('Login API error details:', error);
      
      // Extract error message from error object
      const errorMessage = error.message || 
                          error.data?.message ||
                          'Login failed. Please check your credentials.';
      
      return {
        success: false,
        message: errorMessage,
        error: error
      };
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await axiosInstance.post('/admin/forgot-password', { email });
      
      return {
        success: true,
        data: response.data || response,
        message: response.message || 'Password reset instructions sent'
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      
      return {
        success: false,
        message: error.message || error.data?.message || 'Failed to send reset instructions',
        error: error
      };
    }
  },

  // Verify OTP
  verifyOtp: async (email, otp) => {
    try {
      const response = await axiosInstance.post('/admin/verify-otp', {
        email,
        otp
      });
      
      return {
        success: true,
        data: response.data || response,
        message: response.message || 'OTP verified successfully'
      };
    } catch (error) {
      console.error('Verify OTP error:', error);
      
      return {
        success: false,
        message: error.message || error.data?.message || 'Invalid OTP',
        error: error
      };
    }
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    try {
      const response = await axiosInstance.post('/admin/reset-password', {
        token,
        newPassword
      });
      
      return {
        success: true,
        data: response.data || response,
        message: response.message || 'Password reset successful'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      
      return {
        success: false,
        message: error.message || error.data?.message || 'Failed to reset password',
        error: error
      };
    }
  },

  // Get admin profile
  getAdminProfile: async () => {
    try {
      const response = await axiosInstance.get('/admin/profile');
      
      return {
        success: true,
        data: response.data || response,
        message: response.message || 'Profile fetched successfully'
      };
    } catch (error) {
      console.error('Get profile error:', error);
      
      return {
        success: false,
        message: error.message || error.data?.message || 'Failed to fetch profile',
        error: error
      };
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await axiosInstance.put('/admin/change-password', {
        currentPassword,
        newPassword
      });
      
      return {
        success: true,
        data: response.data || response,
        message: response.message || 'Password changed successfully'
      };
    } catch (error) {
      console.error('Change password error:', error);
      
      return {
        success: false,
        message: error.message || error.data?.message || 'Failed to change password',
        error: error
      };
    }
  },

  // Logout admin
  logoutAdmin: async () => {
    try {
      const response = await axiosInstance.post('/admin/logout');
      
      return {
        success: true,
        data: response.data || response,
        message: response.message || 'Logged out successfully'
      };
    } catch (error) {
      console.error('Logout error:', error);
      
      return {
        success: false,
        message: error.message || error.data?.message || 'Logout failed',
        error: error
      };
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    return !!(token && user);
  },

  // Get current user
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  // Get auth token
  getAuthToken: () => {
    return localStorage.getItem('token');
  },

  // Clear auth data
  clearAuthData: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberedEmail');
  },

  // Set auth token
  setAuthToken: (token) => {
    localStorage.setItem('token', token);
  },

  // Set user data
  setUserData: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  // Test authentication
  testAuth: async () => {
    try {
      const response = await axiosInstance.get('/admin/test-auth');
      return {
        success: true,
        data: response.data || response,
        message: response.message || 'Auth test successful'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || error.data?.message || 'Auth test failed',
        error: error
      };
    }
  }
};

export default authAPI;