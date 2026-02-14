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
  }
};

export default animationAPI;
