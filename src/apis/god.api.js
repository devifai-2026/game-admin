// apis/god.api.js
import axiosInstance from '../utils/axiosInstance';

const godAPI = {
  // Create new god
  createGod: async (godData) => {
    try {
      console.log('Creating god:', godData);
      const response = await axiosInstance.post('/gods', godData);
      return {
        success: true,
        data: response.data,
        message: response.message || 'God created successfully'
      };
    } catch (error) {
      console.error('Create god error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create god',
        error: error.data
      };
    }
  },

  // Get all gods
  getAllGods: async (page = 1, limit = 10, search = '') => {
    try {
      console.log('Fetching gods...', { page, limit, search });
      const response = await axiosInstance.get('/gods', {
        params: { page, limit, search }
      });
      return {
        success: true,
        data: response.data,
        message: response.message || 'Gods fetched successfully'
      };
    } catch (error) {
      console.error('Get all gods error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch gods',
        error: error.data
      };
    }
  },

  // Get god by ID
  getGodById: async (id) => {
    try {
      const response = await axiosInstance.get(`/gods/${id}`);
      return {
        success: true,
        data: response.data,
        message: response.message || 'God fetched successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch god',
        error: error.data
      };
    }
  },

  // Update god
  updateGod: async (id, updateData) => {
    try {
      console.log('Updating god:', id, updateData);
      const response = await axiosInstance.put(`/gods/${id}`, updateData);
      return {
        success: true,
        data: response.data,
        message: response.message || 'God updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update god',
        error: error.data
      };
    }
  },

  // Delete god
  deleteGod: async (id) => {
    try {
      console.log('Deleting god:', id);
      const response = await axiosInstance.delete(`/gods/${id}`);
      return {
        success: true,
        data: response.data,
        message: response.message || 'God deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete god',
        error: error.data
      };
    }
  },

  // Search gods
  searchGods: async (query) => {
    try {
      const response = await axiosInstance.get('/gods/search', {
        params: { query }
      });
      return {
        success: true,
        data: response.data,
        message: response.message || 'Search results fetched'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to search gods',
        error: error.data
      };
    }
  },

  // Upload God Idol Zip
  uploadGodIdolZip: async (godId, title, zipFile, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('godId', godId);
      if (title) formData.append('title', title); 
      formData.append('zip', zipFile);

      console.log('Uploading God Idol Zip:', { godId, title, fileName: zipFile.name });

      const response = await axiosInstance.uploadFile('/god-idol/upload-zip', formData, onProgress, {
        timeout: 600000 // 10 minutes timeout
      });
      
      return {
        success: true,
        data: response,
        message: 'God Idol Zip uploaded successfully'
      };
    } catch (error) {
      console.error('Upload God Idol Zip error:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload God Idol Zip',
        error: error.data
      };
    }
  },

  // Upload image to Cloudinary
  uploadToCloudinary: async (file) => {
    const CLOUDINARY_CLOUD_NAME = 'dlbpeypom'; // Same as splash
    const CLOUDINARY_UPLOAD_PRESET = 'gods_images_preset'; // Create this in Cloudinary

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'gods_images');
    formData.append('timestamp', Math.round(Date.now() / 1000));

    try {
      console.log('Uploading god image to Cloudinary...', {
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
  }
};

export default godAPI;