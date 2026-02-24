// apis/splash.api.js
import axiosInstance from '../utils/axiosInstance';

const splashAPI = {
  // Create new splash screen with video upload
  createSplash: async (formData) => {
    try {
      console.log('Uploading splash video to backend...');
      // Use the uploadFile helper for multipart/form-data
      const response = await axiosInstance.uploadFile('/splash', formData);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Splash created successfully'
      };
    } catch (error) {
      console.error('Create splash error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create splash screen',
        error: error.data
      };
    }
  },

  // Get all splash screens
  getAllSplash: async () => {
    try {
      console.log('Fetching all splash screens...');
      const response = await axiosInstance.get('/splash');
      return {
        success: true,
        data: response.data,
        message: response.message || 'Splash screens fetched successfully'
      };
    } catch (error) {
      console.error('Get all splash error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch splash screens',
        error: error.data
      };
    }
  },

  // Get active splash screens for public
  getActiveSplash: async () => {
    try {
      const response = await axiosInstance.get('/splash/active');
      return {
        success: true,
        data: response.data,
        message: response.message || 'Active splash screens fetched'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch active splash screens',
        error: error.data
      };
    }
  },

  // Update splash screen
  updateSplash: async (id, updateData) => {
    try {
      console.log('Updating splash:', id);
      
      let response;
      if (updateData instanceof FormData) {
        // If it's FormData (has video), use put with multipart headers
        response = await axiosInstance.put(`/splash/${id}`, updateData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        // Otherwise use normal put
        response = await axiosInstance.put(`/splash/${id}`, updateData);
      }

      return {
        success: true,
        data: response.data,
        message: response.message || 'Splash updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update splash screen',
        error: error.data
      };
    }
  },

  // Delete splash screen
  deleteSplash: async (id) => {
    try {
      console.log('Deleting splash:', id);
      const response = await axiosInstance.delete(`/splash/${id}`);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Splash deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete splash screen',
        error: error.data
      };
    }
  },

  // Toggle splash screen status
  toggleSplashStatus: async (id) => {
    try {
      const response = await axiosInstance.patch(`/splash/${id}/toggle`);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Status toggled successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to toggle status',
        error: error.data
      };
    }
  }
};

export default splashAPI;
