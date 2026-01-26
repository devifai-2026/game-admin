// apis/splash.api.js
import axiosInstance from '../utils/axiosInstance';

// Add your Cloudinary credentials here
const CLOUDINARY_CLOUD_NAME = 'dlbpeypom'; // Your cloud name from the URL
const CLOUDINARY_UPLOAD_PRESET = 'splash_screens_preset'; // You need to create this preset first!

const splashAPI = {
  // Upload image directly to Cloudinary (frontend upload)
  uploadToCloudinary: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'splash_screens');
    formData.append('timestamp', Math.round(Date.now() / 1000));

    try {
      console.log('Uploading to Cloudinary...', {
        cloudName: CLOUDINARY_CLOUD_NAME,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        fileName: file.name,
        fileSize: file.size
      });

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      
      console.log('Cloudinary response:', data);
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      return {
        success: true,
        data: {
          url: data.secure_url,
          public_id: data.public_id,
          format: data.format,
          bytes: data.bytes,
          width: data.width,
          height: data.height,
        },
        message: 'Image uploaded successfully'
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload image to Cloudinary'
      };
    }
  },

  // Create new splash screen
  createSplash: async (splashData) => {
    try {
      console.log('Creating splash screen:', splashData);
      const response = await axiosInstance.post('/splash', splashData);
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
      console.log('Updating splash:', id, updateData);
      const response = await axiosInstance.put(`/splash/${id}`, updateData);
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

  // Update multiple splash screen orders
  updateSplashOrder: async (updates) => {
    try {
      const response = await axiosInstance.patch('/splash/order/update', { updates });
      return {
        success: true,
        data: response.data,
        message: response.message || 'Order updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update order',
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
  },

  // Test function to verify Cloudinary connection
  testCloudinaryConnection: async () => {
    try {
      console.log('Testing Cloudinary connection...');
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/ping`
      );
      
      if (response.ok) {
        return {
          success: true,
          message: 'Cloudinary connection successful'
        };
      } else {
        return {
          success: false,
          message: 'Cloudinary connection failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Cloudinary test error: ${error.message}`
      };
    }
  }
};

export default splashAPI;