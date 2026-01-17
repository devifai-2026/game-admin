import React, { useState, useRef } from 'react';
import { FaUpload, FaTrash, FaSave, FaTimes, FaImage, FaEdit, FaCheck } from 'react-icons/fa';

const Gods = () => {
  const [images, setImages] = useState([
    {
      id: 1,
      name: 'Lord Ganesha',
      preview: 'https://images.unsplash.com/photo-1624996752380-8ec242e0f85d?w=400&h=300&fit=crop',
      size: '2.4 MB',
      uploaded: 'Jan 15, 2024'
    }
  ]);
  
  const [newImages, setNewImages] = useState([]);
  const [editingImage, setEditingImage] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [imageName, setImageName] = useState('');
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Handle new file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    
    const uploadedFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      preview: URL.createObjectURL(file),
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      uploaded: new Date().toLocaleDateString(),
      file: file
    }));
    
    setNewImages(prev => [...prev, ...uploadedFiles]);
  };

  // Start editing an image
  const startEdit = (image) => {
    setEditingImage(image.id);
    setImageName(image.name);
    setNewImageFile(null);
  };

  // Handle edit file change
  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile({
        file: file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  // Save edited image
  const saveEdit = () => {
    setImages(prev => prev.map(img => {
      if (img.id === editingImage) {
        return {
          ...img,
          name: imageName,
          preview: newImageFile ? newImageFile.preview : img.preview,
          size: newImageFile ? (newImageFile.file.size / (1024 * 1024)).toFixed(1) + ' MB' : img.size,
          uploaded: new Date().toLocaleDateString()
        };
      }
      return img;
    }));
    
    // Clean up old preview URL if new image was uploaded
    if (newImageFile) {
      const oldImage = images.find(img => img.id === editingImage);
      if (oldImage?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(oldImage.preview);
      }
    }
    
    setEditingImage(null);
    setImageName('');
    setNewImageFile(null);
  };

  // Cancel edit
  const cancelEdit = () => {
    if (newImageFile?.preview) {
      URL.revokeObjectURL(newImageFile.preview);
    }
    setEditingImage(null);
    setImageName('');
    setNewImageFile(null);
  };

  // Save single new image
  const saveImage = (image) => {
    setImages(prev => [...prev, {
      id: Date.now(),
      name: image.name,
      preview: image.preview,
      size: image.size,
      uploaded: new Date().toLocaleDateString()
    }]);
    
    setNewImages(prev => prev.filter(img => img.id !== image.id));
  };

  // Save all new images
  const saveAllImages = () => {
    const savedImages = newImages.map(img => ({
      id: Date.now() + Math.random(),
      name: img.name,
      preview: img.preview,
      size: img.size,
      uploaded: new Date().toLocaleDateString()
    }));
    
    setImages(prev => [...prev, ...savedImages]);
    setNewImages([]);
  };

  // Delete image
  const deleteImage = (id, isNew = false) => {
    if (isNew) {
      const imageToDelete = newImages.find(img => img.id === id);
      if (imageToDelete?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(imageToDelete.preview);
      }
      setNewImages(prev => prev.filter(img => img.id !== id));
    } else {
      const imageToDelete = images.find(img => img.id === id);
      if (imageToDelete?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(imageToDelete.preview);
      }
      setImages(prev => prev.filter(img => img.id !== id));
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Gods Images Management</h1>
        <p className="text-gray-600">Upload, edit and manage images</p>
      </div>

      {/* Upload Section */}
      <div className="mb-10">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Upload New Images</h2>
            {newImages.length > 0 && (
              <button
                onClick={saveAllImages}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FaSave className="w-4 h-4" />
                Save All ({newImages.length})
              </button>
            )}
          </div>

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
                  Click to upload images
                </h3>
                <p className="text-gray-500 mb-4">
                  Drag & drop or click to select files
                </p>
                <button className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  Browse Files
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
                    {/* Image */}
                    <div className="relative h-40">
                      <img
                        src={image.preview}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Action Buttons */}
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <button
                          onClick={() => deleteImage(image.id, true)}
                          className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
                          title="Remove"
                        >
                          <FaTimes className="w-4 h-4 text-red-500" />
                        </button>
                        <button
                          onClick={() => saveImage(image)}
                          className="px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 flex items-center gap-1"
                          title="Save Image"
                        >
                          <FaSave className="w-3 h-3" />
                          Save
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saved Images Section */}
<div className="bg-white rounded-xl shadow-md p-6">
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-xl font-semibold text-gray-800">
      Saved Images ({images.length})
    </h2>
    {images.length > 0 && (
      <button
        onClick={() => {
          if (window.confirm('Delete all images?')) {
            images.forEach(img => {
              if (img.preview?.startsWith('blob:')) {
                URL.revokeObjectURL(img.preview);
              }
            });
            setImages([]);
          }
        }}
        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
      >
        <FaTrash className="w-4 h-4" />
        Clear All
      </button>
    )}
  </div>

  {images.length === 0 ? (
    <div className="text-center py-12">
      <FaImage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">No saved images yet</p>
    </div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((image) => (
        <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden">
          
          {/* Editing Mode */}
          {editingImage === image.id ? (
            <>
              {/* Image Preview in Edit Mode */}
              <div className="relative h-64">
                <img
                  src={newImageFile?.preview || image.preview}
                  alt={imageName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => editFileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                  >
                    Change Image
                  </button>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Edit Form */}
              <div className="p-5">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Name
                  </label>
                  <input
                    type="text"
                    value={imageName}
                    onChange={(e) => setImageName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                    placeholder="Enter image name"
                  />
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={saveEdit}
                    className=" flex items-center justify-center gap-2 px-2 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-base text-nowrap"
                  >
                    <FaCheck className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-2 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-base"
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
                  src={image.preview}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => startEdit(image)}
                    className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all"
                    title="Edit"
                  >
                    <FaEdit className="w-5 h-5 text-blue-500" />
                  </button>
                  <button
                    onClick={() => deleteImage(image.id, false)}
                    className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-all"
                    title="Delete"
                  >
                    <FaTrash className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              </div>
              
              {/* Info */}
              <div className="p-5">
                <h4 className="font-semibold text-gray-800 text-lg mb-2">{image.name}</h4>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {image.size}
                  </p>
                  <p className="text-sm text-gray-500">
                    {image.uploaded}
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