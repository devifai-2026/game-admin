import React, { useState, useRef, useEffect } from 'react';
import { FaUpload, FaTrash, FaSave, FaTimes, FaImage, FaEdit, FaCheck, FaSpinner, FaExclamationTriangle, FaCheckCircle, FaEye } from 'react-icons/fa';
import godAPI from '../apis/god.api';

const Gods = () => {
  const [gods, setGods] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [editingGod, setEditingGod] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [viewImage, setViewImage] = useState(null); // New state for viewing image
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Load gods on mount
  useEffect(() => {
    fetchGods();
  }, []);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Fetch all gods
  const fetchGods = async () => {
    setLoading(true);
    setError('');
    
    const result = await godAPI.getAllGods(1, 50); // Get first 50 gods
    
    if (result.success) {
      // Transform API data to match your UI format
      const transformedGods = result.data.gods?.map(god => ({
        id: god._id,
        name: god.name,
        preview: god.image,
        size: '2.4 MB', // Default size
        uploaded: new Date(god.createdAt).toLocaleDateString(),
        description: god.description || '',
        isActive: god.isActive,
        _id: god._id
      })) || [];
      
      setGods(transformedGods);
    } else {
      setError(result.message || 'Failed to load gods');
    }
    
    setLoading(false);
  };

  // Handle new file upload to Cloudinary
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    // Process each file
    for (const file of files) {
      // Validate file
      if (!file.type.startsWith('image/')) {
        setError('Please select only image files (JPG, PNG, GIF, WebP)');
        continue;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError(`File ${file.name} is too large (max 10MB)`);
        continue;
      }

      // Create local preview immediately
      const newImage = {
        id: Date.now() + Math.random(),
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        preview: URL.createObjectURL(file),
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        uploaded: new Date().toLocaleDateString(),
        file: file,
        uploading: true
      };
      
      setNewImages(prev => [...prev, newImage]);
      
      // Upload to Cloudinary
      await uploadToCloudinary(newImage);
    }
  };

  // Upload single image to Cloudinary
  const uploadToCloudinary = async (image) => {
    setUploading(true);
    setError('');
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Upload to Cloudinary
      const uploadResult = await godAPI.uploadToCloudinary(image.file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.message);
      }
      
      // Update the image with Cloudinary URL
      setNewImages(prev => prev.map(img => 
        img.id === image.id 
          ? { 
              ...img, 
              preview: uploadResult.data.url, 
              uploading: false,
              cloudinaryUrl: uploadResult.data.url
            }
          : img
      ));
      
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
      
    } catch (err) {
      clearInterval(progressInterval);
      setError(err.message || 'Failed to upload image to Cloudinary');
      // Remove the failed upload from images
      setNewImages(prev => prev.filter(img => img.id !== image.id));
    } finally {
      setUploading(false);
    }
  };

  // Start editing a god
  const startEdit = (god) => {
    setEditingGod(god.id);
    setFormData({
      name: god.name,
      description: god.description || ''
    });
    setNewImageFile(null);
  };

  // Handle edit file change
  const handleEditFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }
    
    setNewImageFile({
      file: file,
      preview: URL.createObjectURL(file)
    });
  };

  // Save edited god
  const saveEdit = async () => {
    if (!formData.name.trim()) {
      setError('God name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const updateData = {
        name: formData.name,
        description: formData.description
      };

      // If new image is selected, upload it first
      if (newImageFile) {
        const uploadResult = await godAPI.uploadToCloudinary(newImageFile.file);
        
        if (!uploadResult.success) {
          throw new Error('Failed to upload new image');
        }
        
        updateData.image = uploadResult.data.url;
      }

      const result = await godAPI.updateGod(editingGod, updateData);
      
      if (result.success) {
        // Update local state
        setGods(prev => prev.map(god => {
          if (god.id === editingGod) {
            return {
              ...god,
              name: result.data.name,
              preview: newImageFile ? result.data.image : god.preview,
              description: result.data.description || '',
              uploaded: new Date().toLocaleDateString()
            };
          }
          return god;
        }));
        
        // Clean up old preview URL if new image was uploaded
        if (newImageFile?.preview) {
          URL.revokeObjectURL(newImageFile.preview);
        }
        
        setEditingGod(null);
        setFormData({ name: '', description: '' });
        setNewImageFile(null);
        setSuccess('God updated successfully!');
        
        // Refresh from server
        fetchGods();
      } else {
        setError(result.message || 'Failed to update god');
      }
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    if (newImageFile?.preview) {
      URL.revokeObjectURL(newImageFile.preview);
    }
    setEditingGod(null);
    setFormData({ name: '', description: '' });
    setNewImageFile(null);
  };

  // Save single new god
  const saveGod = async (image) => {
    if (!image.cloudinaryUrl) {
      setError('Image must be uploaded to Cloudinary first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const godData = {
        name: image.name,
        image: image.cloudinaryUrl,
        description: ''
      };

      const result = await godAPI.createGod(godData);
      
      if (result.success) {
        // Add to gods list
        const newGod = {
          id: result.data._id,
          name: result.data.name,
          preview: result.data.image,
          size: image.size,
          uploaded: new Date(result.data.createdAt).toLocaleDateString(),
          description: result.data.description || '',
          isActive: result.data.isActive,
          _id: result.data._id
        };
        
        setGods(prev => [...prev, newGod]);
        setNewImages(prev => prev.filter(img => img.id !== image.id));
        setSuccess('God saved successfully!');
        
        // Refresh from server
        fetchGods();
      } else {
        setError(result.message || 'Failed to save god');
      }
    } catch (err) {
      setError(err.message || 'Failed to save god');
    } finally {
      setLoading(false);
    }
  };

  // Save all new gods
  const saveAllGods = async () => {
    if (newImages.length === 0) {
      setError('No new gods to save');
      return;
    }

    // Check if all images have been uploaded to Cloudinary
    const imagesWithoutCloudinary = newImages.filter(img => !img.cloudinaryUrl && !img.uploading);
    if (imagesWithoutCloudinary.length > 0) {
      setError('Some images are not uploaded to Cloudinary yet. Please wait...');
      return;
    }

    // Check if any images are still uploading
    const stillUploading = newImages.some(img => img.uploading);
    if (stillUploading) {
      setError('Some images are still uploading. Please wait...');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const savePromises = newImages.map(async (image) => {
        const godData = {
          name: image.name,
          image: image.cloudinaryUrl,
          description: ''
        };

        const result = await godAPI.createGod(godData);
        
        if (!result.success) {
          throw new Error(`Failed to save ${image.name}: ${result.message}`);
        }
        
        return {
          id: result.data._id,
          name: result.data.name,
          preview: result.data.image,
          size: image.size,
          uploaded: new Date(result.data.createdAt).toLocaleDateString(),
          description: result.data.description || '',
          isActive: result.data.isActive,
          _id: result.data._id
        };
      });

      const savedGods = await Promise.all(savePromises);
      
      // Add all saved gods to the list
      setGods(prev => [...prev, ...savedGods]);
      setNewImages([]);
      setSuccess(`${savedGods.length} gods saved successfully!`);
      
      // Refresh from server
      fetchGods();
    } catch (err) {
      setError(err.message || 'Failed to save gods');
    } finally {
      setLoading(false);
    }
  };

  // Delete god
  const deleteGod = async (id, isNew = false) => {
    if (isNew) {
      const imageToDelete = newImages.find(img => img.id === id);
      if (imageToDelete?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(imageToDelete.preview);
      }
      setNewImages(prev => prev.filter(img => img.id !== id));
    } else {
      if (!window.confirm('Are you sure you want to delete this god?')) {
        return;
      }

      const godToDelete = gods.find(god => god.id === id);
      if (!godToDelete) return;

      setLoading(true);
      setError('');

      try {
        const result = await godAPI.deleteGod(godToDelete._id);
        
        if (result.success) {
          // Clean up preview URL
          if (godToDelete?.preview?.startsWith('blob:')) {
            URL.revokeObjectURL(godToDelete.preview);
          }
          
          setGods(prev => prev.filter(god => god.id !== id));
          setSuccess('God deleted successfully!');
          
          // Refresh from server
          fetchGods();
        } else {
          setError(result.message || 'Failed to delete god');
        }
      } catch (err) {
        setError('Failed to delete god');
      } finally {
        setLoading(false);
      }
    }
  };

  // Clear all gods
  const clearAllGods = async () => {
    if (gods.length === 0) {
      setError('No gods to clear');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete all ${gods.length} gods? This cannot be undone!`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Delete all gods from database
      const deletePromises = gods.map(god => godAPI.deleteGod(god._id));
      await Promise.all(deletePromises);
      
      // Clean up preview URLs
      gods.forEach(god => {
        if (god?.preview?.startsWith('blob:')) {
          URL.revokeObjectURL(god.preview);
        }
      });
      
      setGods([]);
      setSuccess('All gods deleted successfully!');
    } catch (err) {
      setError('Failed to delete all gods');
    } finally {
      setLoading(false);
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Gods Images Management</h1>
        <p className="text-gray-600">Upload, edit and manage gods images</p>
      </div>

      {/* Image View Modal - Exactly like SplashScreen */}
      {viewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-5xl w-full">
            <button
              onClick={() => setViewImage(null)}
              className="absolute top-4 right-4 p-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full z-10 transition-all"
            >
              <FaTimes size={24} />
            </button>
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="p-4 bg-gray-800 text-white">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold truncate">{viewImage.name || 'God Image'}</h3>
                  {viewImage.data && viewImage.data.includes('cloudinary') && (
                    <span className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs">
                      Cloudinary
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm">
                  <span>{viewImage.size}</span>
                  <span>•</span>
                  <span>{formatDate(viewImage.uploaded)}</span>
                </div>
              </div>
              <div className="flex justify-center items-center bg-gray-900 min-h-[60vh]">
                <img
                  src={viewImage.preview || viewImage.data || ''}
                  alt={viewImage.name || 'God Image'}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-700">Error!</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center">
          <FaCheckCircle className="text-green-500 mr-3 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-700">Success!</p>
            <p className="text-green-600 text-sm">{success}</p>
          </div>
          <button
            onClick={() => setSuccess('')}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Upload Section */}
      <div className="mb-10">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Upload New God Images</h2>
            {newImages.length > 0 && (
              <button
                onClick={saveAllGods}
                disabled={loading || newImages.some(img => img.uploading)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin w-4 h-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4" />
                    Save All ({newImages.length})
                  </>
                )}
              </button>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && uploadProgress > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Uploading to Cloudinary... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Upload Box */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            onClick={triggerFileInput}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <FaUpload className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Click to upload god images
                </h3>
                <p className="text-gray-500 mb-4">
                  Drag & drop or click to select files
                </p>
                <button 
                  className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Browse Files'}
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </div>

          {/* New Uploads Preview */}
          {newImages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                New Uploads ({newImages.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {newImages.map((image) => (
                  <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Image with Eye Button */}
                    <div className="relative h-40">
                      <img
                        src={image.preview}
                        alt={image.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setViewImage(image)}
                      />
                      
                      {/* Uploading Overlay */}
                      {image.uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <FaSpinner className="animate-spin text-white text-xl" />
                        </div>
                      )}
                      
                      {/* Action Buttons - Same pattern as SplashScreen */}
                      <div className="absolute top-2 right-2 flex gap-1">
                        <button
                          onClick={() => setViewImage(image)}
                          className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
                          title="View Image"
                        >
                          <FaEye size={12} />
                        </button>
                        <button
                          onClick={() => deleteGod(image.id, true)}
                          className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
                          title="Remove"
                          disabled={image.uploading}
                        >
                          <FaTimes size={12} className="text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <p className="font-medium text-gray-800 truncate text-sm">
                        {image.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {image.size} • {image.uploaded}
                      </p>
                      {image.uploading && (
                        <p className="text-xs text-blue-500 mt-1 flex items-center">
                          <FaSpinner className="animate-spin mr-1" size={10} />
                          Uploading...
                        </p>
                      )}
                      {image.cloudinaryUrl && !image.uploading && (
                        <p className="text-xs text-green-500 mt-1">
                          ✓ Ready to save
                        </p>
                      )}
                      
                      {/* Save Button */}
                      <button
                        onClick={() => saveGod(image)}
                        disabled={image.uploading || !image.cloudinaryUrl}
                        className="mt-3 w-full py-1 text-sm border border-green-500 text-green-500 rounded hover:bg-green-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Save God"
                      >
                        <FaSave className="mr-2" size={12} />
                        {image.uploading ? 'Uploading...' : 'Save God'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saved Gods Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Saved Gods ({gods.length})
          </h2>
          {gods.length > 0 && (
            <button
              onClick={clearAllGods}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
            >
              {loading ? (
                <FaSpinner className="animate-spin w-4 h-4" />
              ) : (
                <FaTrash className="w-4 h-4" />
              )}
              Clear All
            </button>
          )}
        </div>

        {loading && gods.length === 0 ? (
          <div className="text-center py-12">
            <FaSpinner className="animate-spin w-8 h-8 text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500">Loading gods...</p>
          </div>
        ) : gods.length === 0 ? (
          <div className="text-center py-12">
            <FaImage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No saved gods yet</p>
            <p className="text-gray-400 text-sm mt-2">Upload and save god images to see them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gods.map((god) => (
              <div key={god.id} className="border border-gray-200 rounded-lg overflow-hidden">
                
                {/* Editing Mode */}
                {editingGod === god.id ? (
                  <>
                    {/* Image Preview in Edit Mode */}
                    <div className="relative h-64">
                      <img
                        src={newImageFile?.preview || god.preview}
                        alt={formData.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setViewImage({
                          name: formData.name,
                          preview: newImageFile?.preview || god.preview,
                          size: '2.4 MB',
                          uploaded: new Date().toISOString(),
                          data: newImageFile?.preview || god.preview
                        })}
                      />
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button
                          onClick={() => setViewImage({
                            name: formData.name,
                            preview: newImageFile?.preview || god.preview,
                            size: '2.4 MB',
                            uploaded: new Date().toISOString(),
                            data: newImageFile?.preview || god.preview
                          })}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all"
                          title="View Image"
                        >
                          <FaEye className="w-5 h-5 text-blue-500" />
                        </button>
                        <button
                          onClick={() => editFileInputRef.current?.click()}
                          className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                          disabled={loading}
                        >
                          Change Image
                        </button>
                        <input
                          ref={editFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleEditFileChange}
                          className="hidden"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Edit Form */}
                    <div className="p-5">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          God Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                          placeholder="Enter god name"
                          disabled={loading}
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description (Optional)
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                          placeholder="Enter description"
                          rows="2"
                          disabled={loading}
                        />
                      </div>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={saveEdit}
                          disabled={loading || !formData.name.trim()}
                          className="flex items-center justify-center gap-2 px-2 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-base text-nowrap disabled:opacity-50"
                        >
                          {loading ? (
                            <FaSpinner className="animate-spin w-4 h-4" />
                          ) : (
                            <FaCheck className="w-4 h-4" />
                          )}
                          Save Changes
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={loading}
                          className="px-2 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-base disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* View Mode */}
                    <div className="relative h-64">
                      <img
                        src={god.preview}
                        alt={god.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setViewImage({
                          name: god.name,
                          preview: god.preview,
                          size: god.size,
                          uploaded: god.uploaded,
                          data: god.preview,
                          description: god.description
                        })}
                      />
                      <div className="absolute top-3 right-3 flex gap-2">
                        {/* Eye Button for Viewing - Same as SplashScreen */}
                        <button
                          onClick={() => setViewImage({
                            name: god.name,
                            preview: god.preview,
                            size: god.size,
                            uploaded: god.uploaded,
                            data: god.preview,
                            description: god.description
                          })}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all"
                          title="View Image"
                        >
                          <FaEye className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => startEdit(god)}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all"
                          title="Edit"
                        >
                          <FaEdit className="w-4 h-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => deleteGod(god.id, false)}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all"
                          title="Delete"
                        >
                          <FaTrash className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="p-5">
                      <h4 className="font-semibold text-gray-800 text-lg mb-2">{god.name}</h4>
                      {god.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {god.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          {god.size}
                        </p>
                        <p className="text-sm text-gray-500">
                          {god.uploaded}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gods;