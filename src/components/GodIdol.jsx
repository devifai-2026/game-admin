import React, { useState, useEffect, useRef } from 'react'
import { FaUpload, FaTrash, FaSave, FaEye, FaTimes, FaImage, FaEdit, FaCheck, FaTimesCircle, FaCamera, FaFileArchive, FaSpinner } from 'react-icons/fa'
import godAPI from '../apis/god.api';

const GodIdol = () => {
  const [gods, setGods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGodId, setSelectedGodId] = useState(null)
  
  // Upload State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Legacy states for compatibility with existing UI components if needed
  const [viewImage, setViewImage] = useState(null)
  const [editingImage, setEditingImage] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', category: '' })
  const [newImageFile, setNewImageFile] = useState(null)
  const editFileInputRef = useRef(null)
  const zipFileInputRef = useRef(null)

  // Fetch gods on mount
  useEffect(() => {
    const fetchGods = async () => {
      try {
        setLoading(true);
        const result = await godAPI.getAllGods(1, 100); // Fetch more to cover all
        if (result.success) {
          // Map API data to expected format if needed, or just use as is
          setGods(result.data.gods || []);
        }
      } catch (error) {
        console.error('Error fetching gods:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGods();
  }, [])

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

  // Handle Zip File Selection
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
    if (!selectedGodId || !uploadFile) return;
    if (!uploadTitle.trim()) {
        alert('Please enter a title');
        return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setElapsedTime(0);

    try {
        const response = await godAPI.uploadGodIdolZip(
            selectedGodId,
            uploadTitle,
            uploadFile,
            (progress) => setUploadProgress(progress)
        );

        if (response.success) {
            alert(`God Idol Zip uploaded successfully in ${formatTime(elapsedTime)}!`);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return 'Invalid date'
    }
  }

  // Helper to get selected God object
  const selectedGod = gods.find(g => g._id === selectedGodId);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
      <h2 className="text-2xl font-bold mb-6" style={{ color: '#cc494c' }}>
        God Idol Management
      </h2>
      
      {/* God Selection (Dynamic) */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#fea947' }}>
          Select God
        </h3>
        {loading ? (
            <div className="flex justify-center p-8"><FaSpinner className="animate-spin text-2xl" /></div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {gods.map((god) => {
                const isSelected = selectedGodId === god._id;
                // Assign a color based on index or just default
                const color = '#FF9933'; 
                
                return (
                <button
                    key={god._id}
                    onClick={() => setSelectedGodId(god._id)}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden group ${
                    isSelected 
                        ? 'scale-[1.02] shadow-lg' 
                        : 'hover:scale-[1.01] hover:shadow-md'
                    }`}
                    style={{
                    borderColor: isSelected ? color : '#e5e7eb',
                    backgroundColor: isSelected ? `${color}10` : 'white'
                    }}
                >
                    <div className="mb-2 w-16 h-16 rounded-full overflow-hidden border">
                    {god.image ? (
                        <img src={god.image} alt={god.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">?</div>
                    )}
                    </div>
                    <span className="font-semibold text-center text-sm">{god.name}</span>
                </button>
                )
            })}
            </div>
        )}
      </div>

      {/* Selected God Content */}
      {selectedGod && (
        <div className="border-t pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2" 
                  style={{ color: '#FF9933' }}>
                 <div className="w-8 h-8 rounded-full overflow-hidden border">
                    <img src={selectedGod.image} alt="" className="w-full h-full object-cover" />
                 </div>
                <span>{selectedGod.name}</span>
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Upload Idol content for {selectedGod.name}
              </p>
            </div>
          </div>

          {/* Zip Upload Section (Replaces the Image Upload Grid) */}
          <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <h4 className="font-semibold text-gray-700 mb-4">Upload Idol Zip</h4>
            
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
                        placeholder="Enter title for this collection"
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

          {/* Note: I'm hiding or removing the previous "Uploaded Images" grid as it was for individual images */}
          {/* You can add a section here to fetch and list the uploaded zips/collections if needed */}
          
        </div>
      )}
    </div>
  )
}

export default GodIdol
