// apis/godIdol.api.js
import axiosInstance from '../utils/axiosInstance';

const godIdolAPI = {
  // Create new god idol video upload
  createGodIdol: async (formData) => {
    try {
      console.log('Uploading god idol video to backend...');
      const response = await axiosInstance.uploadFile('/god-idol', formData);
      return {
        success: true,
        data: response.data,
        message: response.message || 'God idol created successfully'
      };
    } catch (error) {
      console.error('Create god idol error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create god idol',
        error: error.data
      };
    }
  },

  // Get all god idols
  getAllGodIdols: async () => {
    try {
      console.log('Fetching all god idols...');
      const response = await axiosInstance.get('/god-idol');
      return {
        success: true,
        data: response.data,
        message: response.message || 'God idols fetched successfully'
      };
    } catch (error) {
      console.error('Get all god idols error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch god idols',
        error: error.data
      };
    }
  },

  // Get god idol by god ID (useful to check if one exists)
  getGodIdolByGodId: async (godId) => {
    try {
      const response = await axiosInstance.get(`/god-idol/god/${godId}`);
      return {
        success: true,
        data: response.data,
        message: response.message || 'God idol fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch god idol',
        error: error.data
      };
    }
  },

  // Update god idol
  updateGodIdol: async (id, updateData) => {
    try {
      console.log('Updating god idol:', id);
      
      let response;
      if (updateData instanceof FormData) {
        response = await axiosInstance.put(`/god-idol/${id}`, updateData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await axiosInstance.put(`/god-idol/${id}`, updateData);
      }

      return {
        success: true,
        data: response.data,
        message: response.message || 'God idol updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update god idol',
        error: error.data
      };
    }
  },

  // Delete god idol
  deleteGodIdol: async (id) => {
    try {
      console.log('Deleting god idol:', id);
      const response = await axiosInstance.delete(`/god-idol/${id}`);
      return {
        success: true,
        data: response.data,
        message: response.message || 'God idol deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete god idol',
        error: error.data
      };
    }
  },

  // Toggle god idol status
  toggleGodIdolStatus: async (id) => {
    try {
      const response = await axiosInstance.patch(`/god-idol/${id}/toggle`);
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

export default godIdolAPI;
