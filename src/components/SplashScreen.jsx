import React, { useState, useEffect } from 'react';
import { FaUpload, FaTrash, FaSave, FaTimes, FaEye, FaEdit, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaPlay } from 'react-icons/fa';
import splashAPI from '../apis/splash.api';

const SplashScreen = () => {
  const [videos, setVideos] = useState([]);
  const [savedVideos, setSavedVideos] = useState([]);
  const [viewVideo, setViewVideo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load splash screens from API on component mount
  useEffect(() => {
    fetchSplashScreens();
  }, []);

  // Fetch splash screens from API
  const fetchSplashScreens = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await splashAPI.getAllSplash();
      
      if (result.success) {
        // Transform API data to match frontend format
        const transformedVideos = result.data.map((splash) => ({
          id: splash._id,
          position: splash.order,
          name: splash.video.filename,
          size: splash.video.size,
          type: splash.video.mimeType || 'video/mp4',
          uploadedAt: splash.video.uploadedAt || splash.createdAt,
          updatedAt: splash.updatedAt,
          data: splash.video.signedUrl || splash.video.url,
          isActive: splash.isActive,
          serialNo: splash.serialNo,
          _id: splash._id,
          video: splash.video // Keep original video object for source utility
        }));
        
        setSavedVideos(transformedVideos);
      } else {
        setError(result.message || 'Failed to load splash screens');
      }
    } catch (err) {
      setError('An error occurred while fetching splash screens');
    } finally {
      setLoading(false);
    }
  };

  // Handle video selection
  const handleVideoUpload = async (e) => {
    const maxUploadable = 4 - videos.length;
    if (maxUploadable <= 0) {
      setError('Maximum 4 videos allowed in upload section!');
      return;
    }
    
    const files = Array.from(e.target.files).slice(0, maxUploadable);
    
    // Process each file
    for (const file of files) {
      // Validate file
      if (!file.type.startsWith('video/')) {
        setError('Please select only video files (MP4, WEBM, etc.)');
        continue;
      }
      
      if (file.size > 100 * 1024 * 1024) { // 100MB limit matching backend
        setError(`File ${file.name} is too large (max 100MB)`);
        continue;
      }

      // Create local preview
      const newVideo = {
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file), // This works for videos too!
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        position: videos.length + 1,
        uploading: false 
      };

      setVideos(prev => [...prev, newVideo].slice(0, 4));
    }
    // Reset file input
    e.target.value = '';
  };

  const handleEditVideo = async (videoId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Validate file
      if (!file.type.startsWith('video/')) {
        setError('Please select a video file');
        return;
      }
      
      if (file.size > 100 * 1024 * 1024) {
        setError('Video size must be less than 100MB');
        return;
      }
      
      const isSavedVideo = savedVideos.some(v => v.id === videoId);
      
      if (isSavedVideo) {
        const videoToUpdate = savedVideos.find(v => v.id === videoId);
        
        setUploading(true);
        setError('');
        
        try {
          const formData = new FormData();
          formData.append('video', file);
          
          const result = await splashAPI.updateSplash(videoToUpdate._id, formData);
          
          if (result.success) {
            setSuccess('Video updated successfully!');
            // Update the local state with the returned object (which has the new signedUrl)
            setSavedVideos(prev => prev.map(v => 
              v._id === videoToUpdate._id ? {
                ...result.data,
                id: result.data._id,
                preview: result.data.video?.signedUrl || result.data.video?.url,
                name: result.data.video?.filename,
                size: result.data.video?.size,
                uploadedAt: result.data.video?.uploadedAt,
                updatedAt: result.data.updatedAt,
                video: result.data.video
              } : v
            ));

            // Background sync for safety
            setTimeout(() => {
              fetchSplashScreens();
            }, 500);
          } else {
            setError(result.message || 'Failed to update video');
          }
        } catch (err) {
          setError('Failed to update video');
        } finally {
          setUploading(false);
        }
      } else {
        // Edit unsaved video
        const updatedVideos = videos.map(v => {
          if (v.id === videoId) {
            return {
              ...v,
              file: file,
              preview: URL.createObjectURL(file),
              name: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: new Date().toISOString()
            };
          }
          return v;
        });
        setVideos(updatedVideos);
      }
    };
    
    input.click();
  };

  const removeVideo = (id) => {
    setVideos(prev => {
      const filtered = prev.filter(v => v.id !== id);
      return filtered.map((v, index) => ({
        ...v,
        position: index + 1
      }));
    });
  };

  const saveAllVideos = async () => {
    if (videos.length === 0) {
      setError('No videos to save!');
      return;
    }

    const totalAfterSave = savedVideos.length + videos.length;
    if (totalAfterSave > 4) {
      setError(`Maximum 4 splash videos allowed. Please remove some existing ones first.`);
      return;
    }

    setUploading(true);
    setLoading(true);
    setError('');
    
    try {
      // Find the next available serial number
      // In a real app, backend handles this, but here we can try to be smart
      // Let's just sequentialize based on count
      let currentSerial = savedVideos.length > 0 ? Math.max(...savedVideos.map(v => v.serialNo)) + 1 : 1;

      for (const video of videos) {
        const formData = new FormData();
        formData.append('video', video.file);
        formData.append('serialNo', currentSerial++);
        formData.append('isActive', 'true');
        formData.append('order', video.position + savedVideos.length);

        const result = await splashAPI.createSplash(formData);
        
        if (!result.success) {
          throw new Error(result.message || `Failed to upload ${video.name}`);
        }
      }
      
      setSuccess('All videos uploaded and saved successfully!');
      setVideos([]);
      fetchSplashScreens();
    } catch (err) {
      setError(err.message || 'Failed to save videos. Please try again.');
    } finally {
      setUploading(false);
      setLoading(false);
    }
  };

  const removeSavedVideo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this splash video?')) {
      return;
    }

    try {
      const videoToDelete = savedVideos.find(v => v.id === id);
      if (!videoToDelete) return;

      const result = await splashAPI.deleteSplash(videoToDelete._id);
      
      if (result.success) {
        setSuccess('Video deleted successfully!');
        fetchSplashScreens();
      } else {
        setError(result.message || 'Failed to delete video');
      }
    } catch (err) {
      setError('Failed to delete video');
    }
  };

  const toggleStatus = async (id) => {
    try {
      const result = await splashAPI.toggleSplashStatus(id);
      if (result.success) {
        setSavedVideos(prev => prev.map(v => 
          v._id === id ? { ...v, isActive: !v.isActive } : v
        ));
        setSuccess(`Video ${result.data.isActive ? 'activated' : 'deactivated'} successfully`);
      } else {
        setError(result.message || 'Failed to toggle status');
      }
    } catch (err) {
      setError('Failed to toggle status');
    }
  };

  const clearAllUnsaved = () => {
    if (window.confirm('Clear all unsaved videos?')) {
      setVideos([]);
    }
  };

  const clearAllSaved = async () => {
    if (window.confirm('Delete all saved splash videos? This cannot be undone!')) {
      setLoading(true);
      try {
        for (const video of savedVideos) {
          await splashAPI.deleteSplash(video._id);
        }
        setSuccess('All splash screens deleted!');
        fetchSplashScreens();
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

  const getFileExtension = (filename) => {
    if (!filename) return 'MP4';
    return filename.split('.').pop().toUpperCase();
  };

  const getSplashSource = (video, isSaved) => {
    if (!isSaved) return video.preview;
    if (!video?.video) return video.data || '';
    
    return video.video.signedUrl || video.video.url || video.data;
  };

  const VideoCard = ({ video, isSaved = false, onView, onDelete, onEdit }) => {
    if (!video) return null;
    const videoSource = getSplashSource(video, isSaved);
    
    return (
      <div className="relative border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white group">
        <div className="relative aspect-video bg-black">
          <div className="absolute top-2 left-2 z-10">
            <div className="w-8 h-8 flex items-center justify-center rounded-full text-white font-bold shadow-lg"
                 style={{ backgroundColor: video.position === 1 ? '#cc494c' : 
                                     video.position === 2 ? '#fea947' : 
                                     video.position === 3 ? '#4CAF50' : 
                                     '#2196F3' }}>
              {video.position || '?'}
            </div>
          </div>
          
          <video
            key={videoSource}
            src={videoSource}
            className="w-full h-full object-cover cursor-pointer"
            muted
            playsInline
            preload="auto"
            onMouseEnter={e => e.target.play()}
            onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
            onClick={() => onView(video)}
          />
          
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 cursor-pointer pointer-events-none">
            <FaPlay className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>

          <div className={`absolute top-2 right-2 flex space-x-1 ${isSaved ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            <button
              onClick={() => onView(video)}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-md"
              title="View Video"
            >
              <FaEye size={14} />
            </button>
            <button
              onClick={() => onEdit(video.id)}
              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-md"
              title="Edit Video"
            >
              <FaEdit size={14} />
            </button>
            <button
              onClick={() => onDelete(video.id)}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
              title="Delete Video"
            >
              <FaTrash size={14} />
            </button>
          </div>
        </div>
        
        <div className="p-3">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" title={video.name || 'Untitled'}>
                {video.name || 'Untitled Video'}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {formatFileSize(video.size)}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {getFileExtension(video.name)}
                </span>
                {isSaved && (
                  <button 
                    onClick={() => toggleStatus(video._id)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${video.isActive ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                  >
                    {video.isActive ? 'Active' : 'Inactive'}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formatDate(video.uploadedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
      {/* Video Preview Modal */}
      {viewVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-5xl w-full">
            <button
              onClick={() => setViewVideo(null)}
              className="absolute -top-12 right-0 p-3 text-white hover:text-gray-300 transition-all"
            >
              <FaTimes size={32} />
            </button>
            <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
              <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full text-white font-bold text-sm"
                       style={{ backgroundColor: viewVideo.position === 1 ? '#cc494c' : 
                                           viewVideo.position === 2 ? '#fea947' : 
                                           viewVideo.position === 3 ? '#4CAF50' : 
                                           '#2196F3' }}>
                    {viewVideo.position || '?'}
                  </div>
                  <h3 className="text-lg font-semibold truncate">{viewVideo.name || 'Video'}</h3>
                </div>
                <div className="text-sm">
                  {formatFileSize(viewVideo.size)} • {formatDate(viewVideo.uploadedAt)}
                </div>
              </div>
              <div className="flex justify-center items-center bg-black aspect-video">
                <video
                  key={getSplashSource(viewVideo, !!viewVideo.id && savedVideos.some(v => v.id === viewVideo.id))}
                  src={getSplashSource(viewVideo, !!viewVideo.id && savedVideos.some(v => v.id === viewVideo.id))}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full max-h-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center animate-shake">
          <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
          <p className="text-red-600 text-sm flex-1">{error}</p>
          <button onClick={() => setError('')} className="ml-3 text-red-400 hover:text-red-600"><FaTimes /></button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center">
          <FaCheckCircle className="text-green-500 mr-3 flex-shrink-0" />
          <p className="text-green-600 text-sm flex-1">{success}</p>
          <button onClick={() => setSuccess('')} className="ml-3 text-green-400 hover:text-green-600"><FaTimes /></button>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ color: '#cc494c' }}>
            Splash Screen Videos
          </h2>
          <p className="text-gray-500 mt-1">Manage the intro videos for your mobile application.</p>
        </div>
        
        <div className="flex gap-3">
          {savedVideos.length > 0 && (
            <button
              onClick={clearAllSaved}
              disabled={loading}
              className="flex items-center px-4 py-2 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
            >
              <FaTrash className="mr-2" size={14} /> Clear All Saved
            </button>
          )}
        </div>
      </div>
      
      {/* Upload Section */}
      <div className="mb-10 group">
        <div className={`p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ${videos.length > 0 ? 'bg-white border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-200 hover:border-blue-300'}`}>
          <div className="flex flex-col items-center justify-center text-center">
            {videos.length === 0 ? (
              <>
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FaUpload className="text-3xl text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Choose Splash Videos</h3>
                <p className="text-gray-500 max-w-sm mb-6 mt-1">
                  Upload MP4 or WebM videos. Max 4 videos allowed, up to 100MB each.
                </p>
                
                <label className="relative overflow-hidden group/btn">
                  <div className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition-all duration-300 cursor-pointer">
                    <FaUpload className="mr-2" /> Select Videos
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    disabled={savedVideos.length >= 4 || uploading}
                  />
                </label>
              </>
            ) : (
              <div className="w-full">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-gray-800">Pending Uploads ({videos.length})</h3>
                    <p className="text-sm text-gray-500">Review and save these videos to the backend.</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={clearAllUnsaved} 
                      className="text-sm font-semibold text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Cancel All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {videos.map((video) => (
                    <VideoCard 
                      key={video.id} 
                      video={video} 
                      onView={setViewVideo}
                      onDelete={removeVideo}
                      onEdit={handleEditVideo}
                    />
                  ))}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center p-6 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 font-medium">
                    <FaExclamationTriangle size={18} />
                    <span>Total splash screens will be {savedVideos.length + videos.length}/4</span>
                  </div>
                  <button
                    onClick={saveAllVideos}
                    disabled={uploading || savedVideos.length + videos.length > 4}
                    className={`flex items-center px-10 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition-all duration-300 ${uploading ? 'opacity-70 cursor-wait' : ''}`}
                  >
                    {uploading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" /> Uploading Video...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" /> Save to Server
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-red-500 rounded-full"></div>
          <h3 className="text-xl font-bold text-gray-800">Live Splash Screens</h3>
          <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
            {savedVideos.length}/4
          </span>
        </div>

        {loading && savedVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
            <p className="text-gray-500 font-medium">Fetching saved videos...</p>
          </div>
        ) : savedVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {savedVideos.sort((a, b) => a.position - b.position).map((video) => (
              <VideoCard 
                key={video._id} 
                video={video} 
                isSaved={true}
                onView={setViewVideo}
                onDelete={removeSavedVideo}
                onEdit={handleEditVideo}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <FaPlay className="text-gray-300 ml-1" />
            </div>
            <p className="text-gray-500 font-medium text-lg">No splash videos active</p>
            <p className="text-gray-400 text-sm mt-1">Upload and save videos to see them here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;