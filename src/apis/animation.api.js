import axiosInstance from '../utils/axiosInstance';

const animationAPI = {
  // Upload Animation Zip
  uploadAnimationZip: async (category, title, zipFile, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('category', category);
      if (title) formData.append('title', title);
      formData.append('zip', zipFile);

      console.log('Uploading Animation Zip:', { category, title, fileName: zipFile.name });

      const response = await axiosInstance.uploadFile('/animations/upload-zip', formData, onProgress, {
        timeout: 600000 // 10 minutes timeout
      });
      
      return {
        success: true,
        data: response,
        message: 'Animation Zip uploaded successfully'
      };
    } catch (error) {
      console.error('Upload Animation Zip error:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload Animation Zip',
        error: error.data
      };
    }
  },

  // Create new animation video
  createAnimation: async (formData) => {
    try {
      console.log('Uploading animation video to backend...');
      const response = await axiosInstance.uploadFile('/animations', formData);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Animation created successfully'
      };
    } catch (error) {
      console.error('Create animation error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create animation',
        error: error.data
      };
    }
  },

  // Get all animations
  getAllAnimations: async () => {
    try {
      console.log('Fetching all animations...');
      const response = await axiosInstance.get('/animations');
      return {
        success: true,
        data: response.data,
        message: response.message || 'Animations fetched successfully'
      };
    } catch (error) {
      console.error('Get all animations error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch animations',
        error: error.data
      };
    }
  },

  // Get animations for a specific God Idol
  getAnimationsByGodIdol: async (godIdolId) => {
    try {
      const response = await axiosInstance.get(`/animations/godIdol/${godIdolId}`);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Animations fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch animations',
        error: error.data
      };
    }
  },

  // Update animation
  updateAnimation: async (id, updateData) => {
    try {
      console.log('Updating animation:', id);
      
      let response;
      if (updateData instanceof FormData) {
        response = await axiosInstance.put(`/animations/${id}`, updateData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await axiosInstance.put(`/animations/${id}`, updateData);
      }

      return {
        success: true,
        data: response.data,
        message: response.message || 'Animation updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update animation',
        error: error.data
      };
    }
  },

  // Delete animation
  deleteAnimation: async (id) => {
    try {
      console.log('Deleting animation:', id);
      const response = await axiosInstance.delete(`/animations/${id}`);
      return {
        success: true,
        data: response.data,
        message: response.message || 'Animation deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete animation',
        error: error.data
      };
    }
  },

  // Toggle animation status
  toggleAnimationStatus: async (id) => {
    try {
      const response = await axiosInstance.patch(`/animations/${id}/toggle`);
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

export default animationAPI;
