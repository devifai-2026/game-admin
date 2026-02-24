import React, { useState, useEffect, useRef } from 'react'
import { 
  FaUpload, FaTrash, FaSave, FaEye, FaTimes, FaFilm, FaEdit, FaCheck, 
  FaTimesCircle, FaSpinner, FaPlay, FaMagic, FaChevronRight, FaFileArchive 
} from 'react-icons/fa'
import godIdolAPI from '../apis/godIdol.api'
import animationAPI from '../apis/animation.api'

const ANIMATION_CATEGORIES = [
  { id: 'pouring_water_milk', name: 'Pouring Water/Milk', icon: '💧', color: '#4A90E2' },
  { id: 'flower_showers', name: 'Flower Showers', icon: '🌸', color: '#E91E63' },
  { id: 'lighting_lamp', name: 'Lighting Lamp', icon: '🪔', color: '#FF9800' },
  { id: 'offerings_fruits_sweets', name: 'Offerings Fruits/Sweets', icon: '🍎', color: '#4CAF50' }
]

const getAnimationSource = (anim, editFilePreview) => {
  if (editFilePreview) return editFilePreview;
  if (!anim?.video) return '';
  return anim.video.signedUrl || anim.video.url;
}

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 bytes'
  if (bytes < 1024) return bytes + ' bytes'
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  else return (bytes / 1048576).toFixed(1) + ' MB'
}

const Animations = () => {
  const [idols, setIdols] = useState([])
  const [animations, setAnimations] = useState([])
  const [selectedIdolId, setSelectedIdolId] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  
  const [newVideo, setNewVideo] = useState(null)
  const [viewVideo, setViewVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // ZIP Upload State
  const [isZipMode, setIsZipMode] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [zipFile, setZipFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploadingZip, setIsUploadingZip] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const zipFileInputRef = useRef(null)

  // Edit states
  const [editingAnim, setEditingAnim] = useState(null)
  const [editFile, setEditFile] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Timer effect for ZIP upload
  useEffect(() => {
    let interval;
    if (isUploadingZip) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isUploadingZip]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchInitialData = async () => {
    setLoading(true)
    setError('')
    try {
      const idolsResult = await godIdolAPI.getAllGodIdols()
      const animsResult = await animationAPI.getAllAnimations()

      if (idolsResult.success) {
        setIdols(idolsResult.data || [])
      }
      if (animsResult.success) {
        setAnimations(animsResult.data || [])
      }
    } catch (err) {
      setError('Failed to fetch data from server')
    } finally {
      setLoading(false)
    }
  }

  const handleVideoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      setError('Please select a video file')
      return
    }

    setNewVideo({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    })
  }

  const handleZipFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetZip(file);
  };

  const validateAndSetZip = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('Only .zip files are allowed');
      return;
    }
    setZipFile(file);
  };

  const removeSelectedVideo = () => {
    if (newVideo?.preview) URL.revokeObjectURL(newVideo.preview)
    setNewVideo(null)
  }

  const saveAnimation = async () => {
    if (!selectedIdolId || !selectedCategory || !newVideo) return

    setActionLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('godIdol', selectedIdolId)
      formData.append('category', selectedCategory)
      formData.append('title', `${selectedCategory.replace(/_/g, ' ')} Animation`)
      formData.append('isActive', 'true')
      formData.append('video', newVideo.file)

      const result = await animationAPI.createAnimation(formData)
      if (result.success) {
        setSuccess('Animation saved successfully!')
        removeSelectedVideo()
        fetchInitialData()
      } else {
        setError(result.message || 'Failed to save animation')
      }
    } catch (err) {
      setError('An error occurred during upload')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUploadZip = async () => {
    if (!selectedCategory || !zipFile) return;
    if (!uploadTitle.trim()) {
        setError('Please enter a title');
        return;
    }

    setIsUploadingZip(true);
    setUploadProgress(0);
    setElapsedTime(0);

    try {
        const response = await animationAPI.uploadAnimationZip(
            selectedCategory,
            uploadTitle,
            zipFile,
            (progress) => setUploadProgress(progress)
        );

        if (response.success) {
            setSuccess(`Animation Zip uploaded successfully in ${formatTime(elapsedTime)}!`);
            setZipFile(null);
            setUploadTitle('');
            setUploadProgress(0);
            setIsZipMode(false);
            fetchInitialData();
        } else {
            setError(response.message || 'Upload failed');
        }
    } catch (error) {
        setError('An error occurred during upload');
        console.error(error);
    } finally {
        setIsUploadingZip(false);
    }
  };

  const deleteAnimation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this animation?')) return

    setActionLoading(true)
    try {
      const result = await animationAPI.deleteAnimation(id)
      if (result.success) {
        setSuccess('Animation deleted successfully')
        fetchInitialData()
      }
    } catch (err) {
      setError('Deletion failed')
    } finally {
      setActionLoading(false)
    }
  }

  const toggleStatus = async (id) => {
    try {
      const result = await animationAPI.toggleAnimationStatus(id)
      if (result.success) {
        setAnimations(prev => prev.map(a => 
          a._id === id ? { ...a, isActive: !a.isActive } : a
        ))
        setSuccess(`Animation ${result.data.isActive ? 'activated' : 'deactivated'}`)
      }
    } catch (err) {
      setError('Status toggle failed')
    }
  }

  const startEdit = (anim) => {
    setEditingAnim(anim)
    setEditTitle(anim.title)
    setEditFile(null)
  }

  const handleUpdateAnimation = async () => {
    setActionLoading(true)
    try {
      const formData = new FormData()
      if (editFile) formData.append('video', editFile.file)
      formData.append('title', editTitle)
      
      const result = await animationAPI.updateAnimation(editingAnim._id, formData)
      if (result.success) {
        setSuccess('Animation updated')
        setAnimations(prev => prev.map(a => 
          a._id === editingAnim._id ? result.data : a
        ))
        setEditingAnim(null)
        setTimeout(() => {
          fetchInitialData()
        }, 500)
      }
    } catch (err) {
      setError('Update failed')
    } finally {
      setActionLoading(false)
    }
  }

  const selectedIdol = idols.find(i => i._id === selectedIdolId)
  const currentAnimations = animations.filter(a => a.godIdol?._id === selectedIdolId || a.godIdol === selectedIdolId)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
        <p className="text-gray-500 font-medium">Loading Animation Workshop...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Toast Messages */}
      {(error || success) && (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3">
          {error && <div className="bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce"><FaTimesCircle /> {error}</div>}
          {success && <div className="bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom"><FaCheck /> {success}</div>}
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <FaMagic className="text-blue-500" /> Animation Workshop
          </h2>
          <p className="text-gray-500 font-medium mt-2">Create and manage magical interaction videos for each deity.</p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-widest">{idols.length} Active Idols</div>
           <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-xs font-bold uppercase tracking-widest">{animations.length} Animations</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar: Deity Selector */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-2">Select Deity</h3>
          <div className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100 space-y-2">
            {idols.map(idol => (
              <button
                key={idol._id}
                onClick={() => { setSelectedIdolId(idol._id); setSelectedCategory(null); setIsZipMode(false); }}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${selectedIdolId === idol._id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/20 bg-gray-100 flex-shrink-0">
                  <img src={idol.godId?.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="text-left overflow-hidden">
                  <p className="font-bold text-sm truncate">{idol.godId?.name}</p>
                  <p className={`text-[10px] font-bold uppercase opacity-60 ${selectedIdolId === idol._id ? 'text-white' : 'text-blue-500'}`}>
                    {animations.filter(a => a.godIdol?._id === idol._id || a.godIdol === idol._id).length} Effects
                  </p>
                </div>
                <FaChevronRight className={`ml-auto text-xs ${selectedIdolId === idol._id ? 'opacity-100' : 'opacity-20'}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Main Area */}
        <div className="lg:col-span-3 space-y-8">
          {!selectedIdolId ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 p-10">
               <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-3xl mb-6">🕉️</div>
               <h3 className="text-xl font-bold text-gray-800">Choose a Deity to Start</h3>
               <p className="text-gray-500 max-w-xs mt-2">Animations are linked to God Idols. Select a deity from the sidebar to manage their magical effects.</p>
            </div>
          ) : (
            <>
              {/* Category Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {ANIMATION_CATEGORIES.map(cat => {
                  const exists = currentAnimations.find(a => a.category === cat.id)
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id); setIsZipMode(false); }}
                      className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center text-center group ${selectedCategory === cat.id ? 'border-orange-400 bg-orange-50 shadow-md scale-[1.02]' : 'bg-white border-transparent shadow-sm hover:border-gray-200'}`}
                    >
                      <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">{cat.icon}</span>
                      <span className="text-[11px] font-black uppercase tracking-wider text-gray-800 mb-1">{cat.name}</span>
                      {exists ? (
                         <span className="text-[9px] px-2 py-0.5 bg-green-500 text-white rounded-full font-bold">Configured</span>
                      ) : (
                         <span className="text-[9px] px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full font-bold">Missing</span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Management Area */}
              {selectedCategory && (
                <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 animate-in fade-in slide-in-from-top-4">
                   {(() => {
                      const anim = currentAnimations.find(a => a.category === selectedCategory)
                      const categoryInfo = ANIMATION_CATEGORIES.find(c => c.id === selectedCategory)
                      
                      if (anim) {
                        return (
                          <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                               <div>
                                  <h4 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                     <span className="p-3 bg-gray-50 rounded-2xl">{categoryInfo.icon}</span>  
                                     {categoryInfo.name}
                                  </h4>
                                  <p className="text-gray-500 text-sm mt-1">This animation is currently live for {selectedIdol.godId?.name}.</p>
                               </div>
                               <div className="flex gap-2">
                                  <button onClick={() => toggleStatus(anim._id)} className={`px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm ${anim.isActive ? 'bg-green-500 text-white translate-y-[-2px]' : 'bg-gray-100 text-gray-400'}`}>
                                     {anim.isActive ? 'Active Mode' : 'Inactive'}
                                  </button>
                                  <button onClick={() => deleteAnimation(anim._id)} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"><FaTrash /></button>
                               </div>
                            </div>

                            <div className="aspect-video relative rounded-3xl overflow-hidden bg-black group">
                               <video key={getAnimationSource(anim)} src={getAnimationSource(anim)} playsInline className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer" onClick={() => setViewVideo(anim.video)}>
                                  <FaPlay className="text-white text-5xl pointer-events-none" />
                                </div>
                            </div>
                            
                            <div className="flex justify-center">
                               <button onClick={() => startEdit(anim)} className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-xl">
                                  <FaEdit /> Refresh Media Assets
                                </button>
                            </div>
                          </div>
                        )
                      } else {
                        return (
                          <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-3xl mb-6">{categoryInfo.icon}</div>
                            <h4 className="text-2xl font-black text-gray-900">Upload {categoryInfo.name}</h4>
                            <p className="text-gray-500 max-w-sm mt-2 mb-8 font-medium">Add a high-quality video effect or a ZIP collection for this category.</p>
                            
                            <div className="flex gap-4 mb-8">
                              <button 
                                onClick={() => setIsZipMode(false)} 
                                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${!isZipMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                              >
                                Single Video
                              </button>
                              <button 
                                onClick={() => setIsZipMode(true)} 
                                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${isZipMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                              >
                                Batch ZIP
                              </button>
                            </div>

                            {isZipMode ? (
                              <div className="w-full max-w-md space-y-4 text-left">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Upload Title</label>
                                    <input 
                                        type="text"
                                        value={uploadTitle}
                                        onChange={(e) => setUploadTitle(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 outline-none ring-2 ring-transparent focus:ring-blue-100 transition-all"
                                        placeholder="E.g. Festival Special Collection"
                                    />
                                </div>

                                <div 
                                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                                        zipFile ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                                    }`}
                                    onClick={() => !isUploadingZip && zipFileInputRef.current?.click()}
                                >
                                    <input type="file" ref={zipFileInputRef} accept=".zip" className="hidden" onChange={handleZipFileChange} />
                                    {zipFile ? (
                                        <div className="flex flex-col items-center">
                                            <FaFileArchive className="text-4xl text-green-600 mb-2" />
                                            <p className="font-bold text-green-800">{zipFile.name}</p>
                                            <p className="text-xs text-green-600">{formatFileSize(zipFile.size)}</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <FaUpload className="text-3xl text-gray-300 mb-2" />
                                            <p className="font-bold text-gray-500">Select ZIP Collection</p>
                                        </div>
                                    )}
                                </div>

                                {isUploadingZip && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase text-blue-500">
                                            <span>Uploading... {uploadProgress}%</span>
                                            <span>Elapsed: {formatTime(elapsedTime)}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleUploadZip}
                                    disabled={!zipFile || !uploadTitle || isUploadingZip}
                                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
                                >
                                    {isUploadingZip ? <FaSpinner className="animate-spin" /> : <><FaSave /> Upload ZIP Collection</>}
                                </button>
                              </div>
                            ) : (
                              newVideo ? (
                                <div className="w-full max-w-md space-y-4">
                                   <div className="aspect-video relative rounded-2xl overflow-hidden bg-black">
                                      <video src={newVideo.preview} playsInline className="w-full h-full object-cover" />
                                      <button onClick={removeSelectedVideo} className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full"><FaTimes /></button>
                                   </div>
                                   <button
                                     onClick={saveAnimation}
                                     disabled={actionLoading}
                                     className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-100 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
                                   >
                                     {actionLoading ? <FaSpinner className="animate-spin" /> : <><FaSave /> Initialize Animation</>}
                                   </button>
                                </div>
                              ) : (
                                <label className="cursor-pointer group">
                                   <div className="px-10 py-5 bg-white border-2 border-dashed border-gray-300 rounded-3xl group-hover:border-blue-500 group-hover:bg-blue-50/50 transition-all">
                                      <FaUpload className="text-3xl text-gray-300 mx-auto mb-3 group-hover:text-blue-500" />
                                      <p className="font-bold text-gray-500 group-hover:text-blue-600 tracking-tight">Browse Video Files</p>
                                   </div>
                                   <input type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
                                </label>
                              )
                            )}
                          </div>
                        )
                      }
                   })()}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Video Preview Modal */}
      {viewVideo && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 lg:p-10" onClick={() => setViewVideo(null)}>
           <div className="relative w-full max-w-5xl bg-black rounded-3xl overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
              <video key={getAnimationSource(animations.find(a => a.video?.key === viewVideo.key))} src={getAnimationSource(animations.find(a => a.video?.key === viewVideo.key))} controls autoPlay playsInline className="w-full h-full" />
              <button onClick={() => setViewVideo(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full">
                 <FaTimes />
              </button>
           </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingAnim && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl p-10 space-y-8 animate-in zoom-in-95">
              <div className="flex justify-between items-center">
                 <h3 className="text-3xl font-black text-gray-900 italic">Edit Magic Effect</h3>
                 <button onClick={() => setEditingAnim(null)} className="text-gray-300 hover:text-gray-900 transition-colors"><FaTimes size={24}/></button>
              </div>

              <div className="space-y-2">
                 <p className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Animation Focus</p>
                 <select 
                    value={editTitle} 
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 outline-none ring-2 ring-transparent focus:ring-blue-100 transition-all"
                 >
                    <option value={editingAnim.title}>{editingAnim.title}</option>
                    <option value="Enhanced Quality Interaction">Enhanced Quality Interaction</option>
                    <option value="Special Festival Edition">Special Festival Edition</option>
                 </select>
              </div>

              <div className="space-y-4">
                 <p className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em]">Media Asset</p>
                  <div className="aspect-video rounded-3xl bg-black overflow-hidden relative group">
                     <video key={getAnimationSource(editingAnim, editFile?.preview)} src={getAnimationSource(editingAnim, editFile?.preview)} playsInline className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                       <label className="cursor-pointer bg-white text-gray-900 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                          Replace Media
                          <input type="file" accept="video/*" onChange={e => {
                             const file = e.target.files[0];
                             if (file) setEditFile({ file, preview: URL.createObjectURL(file) });
                          }} className="hidden" />
                       </label>
                    </div>
                 </div>
              </div>

              <div className="flex gap-4">
                 <button
                   onClick={handleUpdateAnimation}
                   disabled={actionLoading}
                   className="flex-1 py-5 bg-gray-900 text-white rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-2xl shadow-blue-100 disabled:opacity-50"
                 >
                   {actionLoading ? <FaSpinner className="animate-spin mx-auto" /> : 'Confirm Changes'}
                 </button>
                 <button
                   onClick={() => setEditingAnim(null)}
                   className="px-8 py-5 bg-gray-100 text-gray-400 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
                 >
                   Discard
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}

export default Animations