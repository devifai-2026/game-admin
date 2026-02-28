import axiosInstance from '../utils/axiosInstance';

const animationCategoryAPI = {
  getAllCategories: async () => {
    try {
      const response = await axiosInstance.get('/animation-categories');
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to fetch categories'
      };
    }
  },

  createCategory: async (data) => {
    try {
      const response = await axiosInstance.post('/animation-categories', data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to create category'
      };
    }
  },

  updateCategory: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/animation-categories/${id}`, data);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to update category'
      };
    }
  },

  deleteCategory: async (id) => {
    try {
      const response = await axiosInstance.delete(`/animation-categories/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to delete category'
      };
    }
  }
};

export default animationCategoryAPI;
