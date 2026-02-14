import React, { useState, useEffect, useRef } from 'react'
import { FaUpload, FaFileArchive, FaSpinner } from 'react-icons/fa'
import animationAPI from '../apis/animation.api';

const categories = [
  { id: 1, name: 'Pouring Water/Milk', value: 'pouring_water_milk', icon: '💧', color: '#4A90E2' },
  { id: 2, name: 'Flower Showers', value: 'flower_showers', icon: '🌸', color: '#E91E63' },
  { id: 3, name: 'Lighting Lamp', value: 'lighting_lamp', icon: '🪔', color: '#FF9800' },
  { id: 4, name: 'Offerings Fruits/Sweets', value: 'offerings_fruits_sweets', icon: '🍎', color: '#4CAF50' }
]

const Animations = () => {
  const [selectedCategory, setSelectedCategory] = useState(null)
  
  // Upload State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const zipFileInputRef = useRef(null)

  // Timer effect
  useEffect(() => {
    let interval;
    if (isUploading) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isUploading]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleZipFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetZip(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUploading) return;
    const file = e.dataTransfer.files[0];
    validateAndSetZip(file);
  };

  const validateAndSetZip = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert('Only .zip files are allowed');
      return;
    }
    setUploadFile(file);
  };

  const handleUploadZip = async () => {
    if (!selectedCategory || !uploadFile) return;
    if (!uploadTitle.trim()) {
        alert('Please enter a title');
        return;
    }

    const categoryValue = categories.find(c => c.id === selectedCategory)?.value;
    if (!categoryValue) {
        alert('Invalid category selected');
        return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setElapsedTime(0);

    try {
        const response = await animationAPI.uploadAnimationZip(
            categoryValue,
            uploadTitle,
            uploadFile,
            (progress) => setUploadProgress(progress)
        );

        if (response.success) {
            alert(`Animation Zip uploaded successfully in ${formatTime(elapsedTime)}!`);
            setUploadFile(null);
            setUploadTitle('');
            setUploadProgress(0);
        } else {
            alert(response.message || 'Upload failed');
        }
    } catch (error) {
        alert('An error occurred during upload');
        console.error(error);
    } finally {
        setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 bytes'
    if (bytes < 1024) return bytes + ' bytes'
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    else return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const selectedCategoryObj = categories.find(c => c.id === selectedCategory);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
      <h2 className="text-2xl font-bold mb-6" style={{ color: '#cc494c' }}>
        Animations Management
      </h2>
      
      {/* Category Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#fea947' }}>
          Select Category
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => {
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden group ${
                  selectedCategory === category.id 
                    ? 'scale-[1.02] shadow-lg' 
                    : 'hover:scale-[1.01] hover:shadow-md'
                }`}
                style={{
                  borderColor: selectedCategory === category.id ? category.color : '#e5e7eb',
                  backgroundColor: selectedCategory === category.id ? `${category.color}10` : 'white'
                }}
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <span className="font-semibold text-center text-sm">{category.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Category Content */}
      {selectedCategoryObj && (
        <div className="border-t pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2" 
                  style={{ color: selectedCategoryObj.color }}>
                <span>{selectedCategoryObj.icon}</span>
                <span>{selectedCategoryObj.name}</span>
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Upload Animation Zip for {selectedCategoryObj.name}
              </p>
            </div>
          </div>

          {/* Zip Upload Section */}
          <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <h4 className="font-semibold text-gray-700 mb-4">Upload Animation Zip</h4>
            
            <div className="space-y-4 max-w-xl mx-auto">
                {/* Title Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title <span className="text-red-500">*</span>
                    </label>
                    <input 
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Enter title for this animation"
                        disabled={isUploading}
                    />
                </div>

                {/* Drag & Drop Zone */}
                <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                        uploadFile ? 'border-green-500 bg-green-50' : 'border-gray-400 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => !isUploading && zipFileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        ref={zipFileInputRef}
                        accept=".zip"
                        className="hidden" 
                        onChange={handleZipFileChange}
                        disabled={isUploading}
                    />

                    {uploadFile ? (
                        <div className="flex flex-col items-center">
                            <FaFileArchive className="text-4xl text-green-600 mb-2" />
                            <p className="font-medium text-green-800">{uploadFile.name}</p>
                            <p className="text-sm text-green-600">{formatFileSize(uploadFile.size)}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <FaUpload className="text-3xl text-gray-400 mb-2" />
                            <p className="font-medium text-gray-700">Drag & Drop Zip File</p>
                            <p className="text-sm text-gray-500">or click to browse</p>
                        </div>
                    )}
                </div>

                {/* Progress Bar with Timer */}
                {(isUploading || uploadProgress > 0) && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>Uploading... {uploadProgress}%</span>
                            <span>Time: {formatTime(elapsedTime)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Upload Button */}
                <button
                    onClick={handleUploadZip}
                    disabled={!uploadFile || !uploadTitle || isUploading}
                    className={`w-full py-3 rounded-lg font-semibold text-white shadow transition-all ${
                        !uploadFile || !uploadTitle || isUploading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                    }`}
                >
                    {isUploading ? (
                        <span className="flex items-center justify-center gap-2">
                            <FaSpinner className="animate-spin" /> Uploading...
                        </span>
                    ) : 'Upload Zip'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Animations