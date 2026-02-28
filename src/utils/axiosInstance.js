// utils/axiosInstance.js
import axios from 'axios';

// Create base instance with default config
const axiosInstance = axios.create({
  baseURL: 'https://devifai.website/api/v1', // DEV: local backend | PROD: https://devifai.website/api/v1
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add loading state if needed
    if (typeof window !== 'undefined') {
      // You can dispatch a loading event or update a global state here
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Handle successful responses
    return response.data;
  },
  (error) => {
    // Handle errors
    const { response } = error;
    
    if (!response) {
      // Network error
      console.error('Network Error:', error.message);
      if (typeof window !== 'undefined') {
        // Show network error toast/notification
      }
      return Promise.reject(new Error('Network error. Please check your internet connection.'));
    }
    
    // Handle specific HTTP status codes
    switch (response.status) {
      case 400:
        console.error('Bad Request:', response.data?.message);
        break;
      case 401:
        console.error('Unauthorized');
        // Clear auth and redirect
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        break;
      case 403:
        console.error('Forbidden');
        break;
      case 404:
        console.error('Not Found:', response.config.url);
        break;
      case 409:
        console.error('Conflict:', response.data?.message);
        break;
      case 422:
        console.error('Validation Error:', response.data?.errors);
        break;
      case 500:
        console.error('Server Error');
        break;
      default:
        console.error('Error', response.status, response.data?.message);
    }
    
    // Return the error response for further handling
    return Promise.reject({
      status: response.status,
      message: response.data?.message || 'An error occurred',
      data: response.data,
    });
  }
);

// Helper function for file uploads (with progress tracking)
// Helper function for file uploads (with progress tracking)
axiosInstance.uploadFile = async (url, formData, onUploadProgress, config = {}) => {
  return axiosInstance.post(url, formData, {
    ...config, // Spread custom config (like timeout) here
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(config.headers || {}), // Merge custom headers if any
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onUploadProgress(percentCompleted);
      }
    },
  });
};

export default axiosInstance;