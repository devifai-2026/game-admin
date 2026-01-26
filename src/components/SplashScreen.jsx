import React, { useState, useEffect } from 'react';
import { FaUpload, FaTrash, FaSave, FaTimes, FaEye, FaEdit, FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import splashAPI from '../apis/splash.api'; // Make sure this path is correct

const SplashScreen = () => {
  const [images, setImages] = useState([]);
  const [savedImages, setSavedImages] = useState([]);
  const [viewImage, setViewImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load splash screens from API on component mount
  useEffect(() => {
    fetchSplashScreens();
  }, []);

  // Test Cloudinary connection on mount
  useEffect(() => {
    const testConnection = async () => {
      const result = await splashAPI.testCloudinaryConnection();
      if (!result.success) {
        console.warn('Cloudinary connection test:', result.message);
      }
    };
    testConnection();
  }, []);

  // Fetch splash screens from API
  const fetchSplashScreens = async () => {
    setLoading(true);
    setError('');
    const result = await splashAPI.getAllSplash();
    
    if (result.success) {
      // Transform API data to match your existing format
      const transformedImages = result.data.map((splash, index) => ({
        id: splash._id,
        position: splash.order || index + 1,
        name: `Splash-${splash.serialNo}`,
        size: 1024 * 1024, // Default size - adjust as needed
        type: 'image/jpeg',
        uploadedAt: splash.createdAt,
        data: splash.image, // Cloudinary URL
        isActive: splash.isActive,
        serialNo: splash.serialNo,
        _id: splash._id
      }));
      
      setSavedImages(transformedImages);
      setSuccess('');
    } else {
      setError(result.message || 'Failed to load splash screens');
    }
    setLoading(false);
  };

  // Handle image upload to Cloudinary
  const handleImageUpload = async (e) => {
    const maxUploadable = 4 - images.length;
    if (maxUploadable <= 0) {
      setError('Maximum 4 images allowed in upload section!');
      return;
    }
    
    const files = Array.from(e.target.files).slice(0, maxUploadable);
    
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
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        type: file.type || 'image/jpeg',
        uploadedAt: new Date().toISOString(),
        position: images.length + 1,
        uploading: true // Mark as uploading
      };

      setImages(prev => [...prev, newImage].slice(0, 4));
      
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
      const uploadResult = await splashAPI.uploadToCloudinary(image.file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.message);
      }
      
      // Update the image with Cloudinary URL
      setImages(prev => prev.map(img => 
        img.id === image.id 
          ? { 
              ...img, 
              data: uploadResult.data.url, 
              uploading: false,
              name: `Splash-${Date.now()}` // Give it a proper name
            }
          : img
      ));
      
      setSuccess('Image uploaded to Cloudinary successfully!');
      
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
      
    } catch (err) {
      clearInterval(progressInterval);
      setError(err.message || 'Failed to upload image to Cloudinary');
      // Remove the failed upload from images
      setImages(prev => prev.filter(img => img.id !== image.id));
    } finally {
      setUploading(false);
    }
  };

  const handleEditImage = async (imageId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
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
      
      const isSavedImage = savedImages.some(img => img.id === imageId);
      
      if (isSavedImage) {
        // Edit saved image (upload to Cloudinary and update in database)
        const uploadResult = await splashAPI.uploadToCloudinary(file);
        
        if (uploadResult.success) {
          // Find the splash screen to update
          const splashToUpdate = savedImages.find(img => img.id === imageId);
          
          // Update in database
          const updateResult = await splashAPI.updateSplash(splashToUpdate._id, {
            image: uploadResult.data.url
          });
          
          if (updateResult.success) {
            // Update local state
            const updatedImages = savedImages.map(img => {
              if (img.id === imageId) {
                return {
                  ...img,
                  name: file.name,
                  size: file.size,
                  type: file.type,
                  uploadedAt: new Date().toISOString(),
                  data: uploadResult.data.url
                };
              }
              return img;
            });
            
            setSavedImages(updatedImages);
            setSuccess('Image updated successfully!');
            setTimeout(() => fetchSplashScreens(), 1000); // Refresh data
          } else {
            setError('Failed to update image in database');
          }
        } else {
          setError('Failed to upload image to Cloudinary');
        }
      } else {
        // Edit unsaved image
        const updatedImages = images.map(img => {
          if (img.id === imageId) {
            const newImage = {
              ...img,
              file: file,
              preview: URL.createObjectURL(file),
              name: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString(),
              data: null // Reset Cloudinary URL
            };
            
            // Upload the new file to Cloudinary
            uploadToCloudinary(newImage);
            
            return newImage;
          }
          return img;
        });
        
        setImages(updatedImages);
      }
    };
    
    input.click();
  };

  const removeImage = (id) => {
    const updatedImages = images.filter(img => img.id !== id);
    const renumberedImages = updatedImages.map((img, index) => ({
      ...img,
      position: index + 1
    }));
    setImages(renumberedImages);
  };

  const saveAllImages = async () => {
    if (images.length === 0) {
      setError('No images to save!');
      return;
    }

    // Check if saving would exceed total limit of 4
    const totalAfterSave = savedImages.length + images.length;
    if (totalAfterSave > 4) {
      const canSaveCount = 4 - savedImages.length;
      setError(`Cannot save all images! You can only save ${canSaveCount} more image(s). Please remove some saved images first.`);
      return;
    }

    // Check if all images have been uploaded to Cloudinary
    const imagesWithoutCloudinary = images.filter(img => !img.data && !img.uploading);
    if (imagesWithoutCloudinary.length > 0) {
      setError('Some images are not uploaded to Cloudinary yet. Please wait...');
      return;
    }

    // Check if any images are still uploading
    const stillUploading = images.some(img => img.uploading);
    if (stillUploading) {
      setError('Some images are still uploading. Please wait...');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Save each image to database
      const savePromises = images.map(async (img, index) => {
        const splashData = {
          image: img.data,
          serialNo: savedImages.length + index + 1,
          order: savedImages.length + index + 1,
          isActive: true
        };
        
        const result = await splashAPI.createSplash(splashData);
        
        if (!result.success) {
          throw new Error(`Failed to save image ${img.name}: ${result.message}`);
        }
        
        return {
          id: result.data._id,
          position: savedImages.length + index + 1,
          name: `Splash-${result.data.serialNo}`,
          size: img.size,
          type: img.type,
          uploadedAt: result.data.createdAt,
          data: result.data.image,
          isActive: result.data.isActive,
          serialNo: result.data.serialNo,
          _id: result.data._id
        };
      });

      const processedImages = await Promise.all(savePromises);
      
      // Combine with existing saved images
      const allImages = [...savedImages, ...processedImages]
        .slice(0, 4)
        .map((img, index) => ({
          ...img,
          position: index + 1
        }));
      
      setSavedImages(allImages);
      setImages([]);
      setSuccess(`${processedImages.length} images saved successfully!`);
      
      // Refresh from server to ensure consistency
      setTimeout(() => fetchSplashScreens(), 1000);
      
    } catch (err) {
      setError(err.message || 'Failed to save images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeSavedImage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this splash screen?')) {
      return;
    }

    try {
      // Find the image to delete
      const imageToDelete = savedImages.find(img => img.id === id);
      
      if (!imageToDelete) return;

      // Delete from database
      const result = await splashAPI.deleteSplash(imageToDelete._id);
      
      if (result.success) {
        // Update local state
        const updated = savedImages.filter(img => img.id !== id);
        const renumberedImages = updated.map((img, index) => ({
          ...img,
          position: index + 1
        }));
        setSavedImages(renumberedImages);
        setSuccess('Image deleted successfully!');
      } else {
        setError('Failed to delete image from database');
      }
    } catch (err) {
      setError('Failed to delete image');
    }
  };

  const clearAllUnsaved = () => {
    if (images.length === 0) {
      setError('No unsaved images to clear!');
      return;
    }
    
    if (window.confirm(`Are you sure you want to clear all ${images.length} unsaved images?`)) {
      setImages([]);
      setSuccess('All unsaved images cleared');
    }
  };

  const clearAllSaved = async () => {
    if (savedImages.length === 0) {
      setError('No saved images to clear!');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete all ${savedImages.length} saved images? This cannot be undone!`)) {
      setLoading(true);
      try {
        // Delete all from database
        const deletePromises = savedImages.map(img => 
          splashAPI.deleteSplash(img._id)
        );
        
        await Promise.all(deletePromises);
        
        // Clear local state
        setSavedImages([]);
        setSuccess('All splash screens deleted successfully!');
      } catch (err) {
        setError('Failed to delete all splash screens');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 bytes';
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getFileExtension = (type) => {
    if (!type) return 'IMG';
    const parts = type.split('/');
    return parts.length > 1 ? parts[1].toUpperCase() : 'IMG';
  };

  // Check if maximum limit is reached
  const isMaxLimitReached = savedImages.length >= 4;

  const ImageCard = ({ image, isSaved = false, onView, onDelete, onEdit }) => {
    if (!image) return null;
    
    return (
      <div className="relative border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white group">
        <div className="relative">
          <div className="absolute top-2 left-2 z-10">
            <div className="w-8 h-8 flex items-center justify-center rounded-full text-white font-bold shadow-lg"
                 style={{ backgroundColor: image.position === 1 ? '#cc494c' : 
                                     image.position === 2 ? '#fea947' : 
                                     image.position === 3 ? '#4CAF50' : 
                                     '#2196F3' }}>
              {image.position || '?'}
            </div>
          </div>
          
          <img
            src={image.preview || image.data || ''}
            alt={image.name || 'Image'}
            className="w-full h-48 object-cover cursor-pointer"
            onClick={() => onView(image)}
          />
          
          {image.uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <FaSpinner className="animate-spin text-white text-2xl" />
              <span className="ml-2 text-white text-sm">Uploading to Cloudinary...</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300"></div>
          
          <div className={`absolute top-2 right-2 flex space-x-1 ${isSaved ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            <button
              onClick={() => onView(image)}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              title="View Image"
            >
              <FaEye size={14} />
            </button>
            <button
              onClick={() => onEdit(image.id)}
              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
              title="Edit Image"
            >
              <FaEdit size={14} />
            </button>
            <button
              onClick={() => onDelete(image.id)}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Delete Image"
            >
              <FaTrash size={14} />
            </button>
          </div>
        </div>
        
        <div className="p-3">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" title={image.name || 'Untitled'}>
                {image.name || 'Untitled Image'}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {formatFileSize(image.size)}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {getFileExtension(image.type)}
                </span>
                {isSaved && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded">
                    Saved
                  </span>
                )}
                {image.uploading && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded flex items-center">
                    <FaSpinner className="animate-spin mr-1" size={10} />
                    Uploading
                  </span>
                )}
                {image.data && !isSaved && (
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded">
                    Cloudinary
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formatDate(image.uploadedAt)}
              </p>
            </div>
          </div>
          
          {!isSaved && !image.uploading && (
            <button
              onClick={() => onEdit(image.id)}
              className="mt-3 w-full py-1 text-sm border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition-colors flex items-center justify-center"
            >
              <FaEdit className="mr-2" size={12} />
              Replace Image
            </button>
          )}
        </div>
      </div>
    );
  };

  // Show loading while fetching data
  if (loading && savedImages.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-3xl text-blue-500 mr-3" />
        <span>Loading splash screens...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
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
                  <div className="w-6 h-6 flex items-center justify-center rounded-full text-white font-bold text-sm"
                       style={{ backgroundColor: viewImage.position === 1 ? '#cc494c' : 
                                           viewImage.position === 2 ? '#fea947' : 
                                           viewImage.position === 3 ? '#4CAF50' : 
                                           '#2196F3' }}>
                    {viewImage.position || '?'}
                  </div>
                  <h3 className="text-lg font-semibold truncate">{viewImage.name || 'Image'}</h3>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm">
                  <span>{formatFileSize(viewImage.size)}</span>
                  <span>•</span>
                  <span>{formatDate(viewImage.uploadedAt)}</span>
                  {viewImage.data && viewImage.data.includes('cloudinary') && (
                    <span className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs">
                      Cloudinary
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-center items-center bg-gray-900 min-h-[60vh]">
                <img
                  src={viewImage.preview || viewImage.data || ''}
                  alt={viewImage.name || 'Image'}
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

      <h2 className="text-2xl font-bold mb-6" style={{ color: '#cc494c' }}>
        Splash Screen Images
      </h2>
      
     
      {/* Maximum Limit Warning Banner */}
      {isMaxLimitReached && (
        <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center">
          <FaExclamationTriangle className="text-yellow-500 mr-3 flex-shrink-0" />
          <div>
            <p className="font-semibold text-yellow-700">Maximum Limit Reached!</p>
            <p className="text-yellow-600 text-sm">
              You have reached the maximum limit of 4 images. Remove some saved images to upload new ones.
            </p>
          </div>
        </div>
      )}
      
      {/* Upload Section */}
      <div className="mb-8 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:border-gray-400 transition-colors">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
               style={{ backgroundColor: '#fea947' }}>
            <FaUpload className="text-2xl text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Upload Images to Cloudinary</h3>
          <p className="text-gray-600 mb-4">
            Upload up to 4 images for splash screen. Images are stored on Cloudinary CDN.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <label className="cursor-pointer">
              <div className={`flex items-center px-6 py-3 rounded-lg text-white font-semibold transition duration-300 ${images.length >= 4 ? 'opacity-50 cursor-not-allowed' : isMaxLimitReached ? 'opacity-50 cursor-not-allowed' : uploading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'} shadow-md`}
                style={{ backgroundColor: '#fea947' }}>
                {uploading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload className="mr-2" />
                    {images.length >= 4 ? 'Upload Limit Reached' : 
                     isMaxLimitReached ? 'Maximum Saved Reached' : 
                     'Select Images'}
                  </>
                )}
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={images.length >= 4 || isMaxLimitReached || uploading}
              />
            </label>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#cc494c' }}>
                {images.length} <span className="text-gray-400">/</span> 4
              </div>
              <div className="text-sm text-gray-600">Uploaded Images</div>
            </div>
          </div>
          
          {/* Upload Progress */}
          {uploading && uploadProgress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Uploading to Cloudinary... {uploadProgress}%
              </p>
            </div>
          )}
          
          {/* Upload Limit Messages */}
          {images.length >= 4 ? (
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-center">
                <FaCheckCircle className="text-blue-500 mr-2" />
                <span className="text-blue-700 font-medium">Upload limit reached (4/4)</span>
              </div>
            </div>
          ) : isMaxLimitReached ? (
            <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-center justify-center">
                <FaExclamationTriangle className="text-yellow-500 mr-2" />
                <span className="text-yellow-700 font-medium">Cannot upload: 4 images already saved</span>
              </div>
            </div>
          ) : null}
          
          {images.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Image Positions:</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4].map((pos) => (
                  <div key={pos} className="flex flex-col items-center">
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-white text-xs font-bold ${pos <= images.length ? '' : 'opacity-30'}`}
                         style={{ backgroundColor: pos === 1 ? '#cc494c' : 
                                             pos === 2 ? '#fea947' : 
                                             pos === 3 ? '#4CAF50' : 
                                             '#2196F3' }}>
                      {pos}
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {pos <= images.length ? 'Filled' : 'Empty'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {images.length > 0 && (
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {images.sort((a, b) => (a.position || 0) - (b.position || 0)).map((image) => (
                <ImageCard 
                  key={image.id} 
                  image={image} 
                  onView={setViewImage}
                  onDelete={removeImage}
                  onEdit={handleEditImage}
                />
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6 pt-6 border-t">
              <button
                onClick={clearAllUnsaved}
                disabled={loading}
                className="flex items-center justify-center px-6 py-3 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition duration-300 font-semibold disabled:opacity-50"
              >
                <FaTrash className="mr-2" />
                Clear All ({images.length})
              </button>
              <button
                onClick={saveAllImages}
                disabled={isMaxLimitReached && savedImages.length >= 4 || loading || images.some(img => img.uploading)}
                className={`flex items-center justify-center px-6 py-3 text-white rounded-lg font-semibold transition duration-300 ${isMaxLimitReached || loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'} shadow-md`}
                style={{ backgroundColor: '#cc494c' }}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    {isMaxLimitReached ? 'Cannot Save (Max Reached)' : `Save All Images (${images.length})`}
                  </>
                )}
              </button>
            </div>
            
            {isMaxLimitReached && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-center">
                <p className="text-red-700">
                  <FaExclamationTriangle className="inline mr-2" />
                  Cannot save images: Maximum limit of 4 saved images reached. Remove saved images first.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Saved Images Section */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 p-4 rounded-lg"
             style={{ backgroundColor: '#f9f9f9' }}>
          <div className="flex items-center mb-4 sm:mb-0">
            <div className="w-3 h-8 rounded-sm mr-3" style={{ backgroundColor: '#cc494c' }}></div>
            <div>
              <h3 className="text-xl font-semibold">Saved Splash Screens</h3>
              <p className="text-sm text-gray-600">Maximum 4 images allowed</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${savedImages.length >= 4 ? 'text-red-500' : ''}`}>
                {savedImages.length} <span className="text-gray-400">/</span> 4
              </div>
              <div className="text-sm text-gray-600">Total Saved</div>
              {savedImages.length >= 4 && (
                <div className="text-xs text-red-500 font-medium mt-1">MAXIMUM REACHED</div>
              )}
            </div>
            
            {savedImages.length > 0 && (
              <button
                onClick={clearAllSaved}
                disabled={loading}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition duration-300 text-sm font-semibold disabled:opacity-50"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {savedImages.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {savedImages.sort((a, b) => (a.position || 0) - (b.position || 0)).map((image) => (
                <ImageCard 
                  key={image.id} 
                  image={image} 
                  isSaved={true}
                  onView={setViewImage}
                  onDelete={removeSavedImage}
                  onEdit={handleEditImage}
                />
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <p className="text-sm text-gray-600">Saved Image Positions:</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((pos) => {
                    const hasImage = savedImages.some(img => img.position === pos);
                    return (
                      <div key={pos} className="flex items-center gap-2">
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full text-white text-xs font-bold ${hasImage ? '' : 'opacity-30'}`}
                             style={{ backgroundColor: pos === 1 ? '#cc494c' : 
                                                 pos === 2 ? '#fea947' : 
                                                 pos === 3 ? '#4CAF50' : 
                                                 '#2196F3' }}>
                          {pos}
                        </div>
                        <span className="text-xs text-gray-500">
                          {hasImage ? '✓' : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {savedImages.length >= 4 && (
                <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 text-center">
                  <div className="flex items-center justify-center">
                    <FaCheckCircle className="text-green-500 mr-2" />
                    <span className="text-green-700 font-medium">All 4 positions are filled with saved images</span>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <FaUpload className="text-4xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No saved splash screens yet</p>
            <p className="text-gray-400 mt-2">Upload images to Cloudinary and save them to see here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;