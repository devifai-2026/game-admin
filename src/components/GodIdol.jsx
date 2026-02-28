import React, { useState, useEffect, useRef } from 'react'
import { 
  FaUpload, FaTrash, FaSave, FaEye, FaTimes, FaFilm, FaEdit, FaCheck, 
  FaTimesCircle, FaCamera, FaSpinner, FaPlay 
} from 'react-icons/fa'
import godAPI from '../apis/god.api'
import godIdolAPI from '../apis/godIdol.api'
import animationCategoryAPI from '../apis/animationCategory.api'
import animationAPI from '../apis/animation.api'

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return 'Invalid date'
  }
}

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 bytes'
  if (bytes < 1024) return bytes + ' bytes'
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  else return (bytes / 1048576).toFixed(1) + ' MB'
}

const VideoCard = ({ idol, godId, isSaved = false, onView, onDelete, onEdit, newVideoPreview }) => {
  const videoSource = isSaved ? (idol.video?.signedUrl || idol.video?.url) : newVideoPreview
  const fileName = isSaved ? (idol.video?.filename || 'Untitled') : 'New Upload'
  const fileSize = isSaved ? (idol.video?.size || 0) : 0
  const date = isSaved ? idol.createdAt : new Date().toISOString()

  return (
    <div className="relative border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all bg-white group">
      <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
        <video
          key={videoSource}
          src={videoSource}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="auto"
          onMouseEnter={e => e.target.play()}
          onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 group-hover:bg-opacity-40 transition-all cursor-pointer" onClick={() => onView({ name: fileName, url: videoSource, size: fileSize, date: date })}>
           <FaPlay className="text-white text-3xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all pointer-events-none" />
        </div>

        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onView({ name: fileName, url: videoSource, size: fileSize, date: date })}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 shadow-md"
            title="View"
          >
            <FaEye size={12} />
          </button>
          {isSaved && (
            <>
              <button
                onClick={() => onEdit(idol)}
                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 shadow-md"
                title="Edit"
              >
                <FaEdit size={12} />
              </button>
              <button
                onClick={() => onDelete(idol._id)}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md"
                title="Delete"
              >
                <FaTrash size={12} />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="p-4">
        <p className="font-bold text-sm truncate text-gray-800" title={fileName}>
          {fileName}
        </p>
        <div className="flex justify-between items-center mt-3">
          <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded">
            {formatFileSize(fileSize)}
          </span>
          {isSaved && (
             <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${idol.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
               {idol.isActive ? 'Active' : 'Inactive'}
             </div>
          )}
        </div>
        <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
           Synced: {formatDate(date)}
        </p>
      </div>
    </div>
  )
}

const GodIdol = () => {
  const [gods, setGods] = useState([])
  const [idols, setIdols] = useState([])
  const [selectedGodForUpload, setSelectedGodForUpload] = useState(null)
  
  const [newVideos, setNewVideos] = useState({}) // { godId: videoObj }
  const [viewVideo, setViewVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')



  // Edit states
  const [editingIdol, setEditingIdol] = useState(null)
  const [editFile, setEditFile] = useState(null)
  const editFileInputRef = useRef(null)

  // Animation states
  const [animations, setAnimations] = useState([])
  const [isAnimationModalOpen, setIsAnimationModalOpen] = useState(false)
  const [selectedGodForAnim, setSelectedGodForAnim] = useState(null)
  const [animForm, setAnimForm] = useState({ categoryId: '', video: null })
  const [animCategories, setAnimCategories] = useState([])
  const [animLoading, setAnimLoading] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])





  const fetchInitialData = async () => {
    setLoading(true)
    setError('')
    try {
      const godsResult = await godAPI.getAllGods(1, 100)
      const idolsResult = await godIdolAPI.getAllGodIdols()
      const animCatsResult = await animationCategoryAPI.getAllCategories()
      const animsResult = await animationAPI.getAllAnimations()

      if (godsResult.success) {
        setGods(godsResult.data.gods || [])
      }
      if (idolsResult.success) {
        setIdols(idolsResult.data || [])
      }
      if (animCatsResult.success) {
        setAnimCategories(animCatsResult.data.categories || animCatsResult.data || [])
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

  const handleVideoSelect = (e, godId) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      setError('Please select a video file')
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('Video size must be less than 100MB')
      return
    }

    const videoObj = {
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }

    setNewVideos(prev => ({
      ...prev,
      [godId]: videoObj
    }))
  }



  const removeSelectedVideo = (godId) => {
    const video = newVideos[godId]
    if (video?.preview) {
      URL.revokeObjectURL(video.preview)
    }
    setNewVideos(prev => {
      const copy = { ...prev }
      delete copy[godId]
      return copy
    })
  }

  const saveGodIdol = async (godId) => {
    const video = newVideos[godId]
    if (!video) return

    setActionLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('godId', godId)
      formData.append('isActive', 'true')
      formData.append('video', video.file)

      const result = await godIdolAPI.createGodIdol(formData)
      if (result.success) {
        setSuccess('God idol video saved successfully!')
        removeSelectedVideo(godId)
        fetchInitialData() // Refresh
      } else {
        setError(result.message || 'Failed to save idol video')
      }
    } catch (err) {
      setError('An error occurred during upload')
    } finally {
      setActionLoading(false)
    }
  }



  const deleteIdol = async (id) => {
    if (!window.confirm('Are you sure you want to delete this idol video?')) return

    setActionLoading(true)
    try {
      const result = await godIdolAPI.deleteGodIdol(id)
      if (result.success) {
        setSuccess('Idol video deleted successfully')
        fetchInitialData()
      } else {
        setError(result.message || 'Failed to delete idol video')
      }
    } catch (err) {
      setError('Failed to delete idol video')
    } finally {
      setActionLoading(false)
    }
  }

  const toggleStatus = async (id) => {
    try {
      const result = await godIdolAPI.toggleGodIdolStatus(id)
      if (result.success) {
        setIdols(prev => prev.map(idol => 
          idol._id === id ? { ...idol, isActive: !idol.isActive } : idol
        ))
        setSuccess(`Idol ${result.data.isActive ? 'activated' : 'deactivated'} successfully`)
      }
    } catch (err) {
      setError('Failed to toggle status')
    }
  }

  const startEdit = (idol) => {
    setEditingIdol(idol)
    setEditFile(null)
  }

  const handleEditFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('Please select a video file')
        return
      }
      setEditFile({
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
        size: file.size
      })
    }
  }

  const handleUpdateIdol = async () => {
    if (!editingIdol) return

    setActionLoading(true)
    try {
      let result;
      if (editFile) {
        const formData = new FormData()
        formData.append('video', editFile.file)
        result = await godIdolAPI.updateGodIdol(editingIdol._id, formData)
      } else {
        result = { success: true }
      }

      if (result.success) {
        setSuccess('Idol updated successfully')
        setIdols(prev => prev.map(idol => 
          idol._id === editingIdol._id ? (result.data || idol) : idol
        ))
        setEditingIdol(null)
        setEditFile(null)
        setTimeout(() => {
          fetchInitialData()
        }, 500)
      } else {
        setError(result.message || 'Failed to update idol')
      }
    } catch (err) {
      setError('Update failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddAnimation = (god) => {
    setSelectedGodForAnim(god)
    setAnimForm({ categoryId: '', video: null })
    setIsAnimationModalOpen(true)
  }

  const handleAnimSubmit = async (e) => {
    e.preventDefault()
    if (!animForm.categoryId || !animForm.video) {
        setError("Please select both category and video")
        return
    }

    setAnimLoading(true)
    try {
      const formData = new FormData()
      // The backend animations.controller.js expects 'godIdol' (ObjectId) and 'category' (ObjectId or String)
      const associatedIdol = idols.find(i => i.godId?._id === selectedGodForAnim._id || i.godId === selectedGodForAnim._id)
      
      if (!associatedIdol) {
        setError("Please upload a God Idol video first before adding animations")
        setAnimLoading(false)
        return
      }

      formData.append('godIdol', associatedIdol._id)
      formData.append('category', animForm.categoryId)
      formData.append('video', animForm.video)
      formData.append('isActive', 'true')
      formData.append('title', animCategories.find(c => c._id === animForm.categoryId)?.name || 'Animation')

      const result = await animationAPI.createAnimation(formData)
      if (result.success) {
        setSuccess('Animation added successfully!')
        setIsAnimationModalOpen(false)
        setAnimForm({ categoryId: '', video: null })
        fetchInitialData() // Refresh animations
      } else {
        setError(result.message || 'Failed to add animation')
      }
    } catch (err) {
      setError('An error occurred while adding animation')
    } finally {
      setAnimLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl shadow-sm">
        <FaSpinner className="animate-spin text-4xl text-orange-500 mb-4" />
        <p className="text-gray-500 font-medium tracking-wide">Initializing God Idol System...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Messages */}
      {(error || success) && (
        <div className="fixed top-24 right-8 z-[60] flex flex-col gap-3 max-w-sm w-full">
           {error && (
             <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-xl flex items-center justify-between text-red-700 animate-in slide-in-from-right">
                <div className="flex items-center gap-3">
                   <FaTimesCircle className="text-xl" />
                   <p className="text-sm font-semibold">{error}</p>
                </div>
                <button onClick={() => setError('')}><FaTimes /></button>
             </div>
           )}
           {success && (
             <div className="bg-green-50 border border-green-200 p-4 rounded-xl shadow-xl flex items-center justify-between text-green-700 animate-in slide-in-from-right">
                <div className="flex items-center gap-3">
                   <FaCheck className="text-xl" />
                   <p className="text-sm font-semibold">{success}</p>
                </div>
                <button onClick={() => setSuccess('')}><FaTimes /></button>
             </div>
           )}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-3xl font-black tracking-tighter" style={{ color: '#cc494c' }}>
            God Idol Management
          </h2>
          <p className="text-gray-500 font-medium mt-1">Assign introductory spiritual videos to each god.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-bold">
            <FaFilm /> {idols.length} / {gods.length} Idols Assigned
        </div>
      </div>

      {/* God Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {gods.map((god) => {
          const associatedIdol = idols.find(i => i.godId?._id === god._id || i.godId === god._id)
          const hasSelectedVideo = !!newVideos[god._id]


          return (
            <div 
              key={god._id}
              className={`bg-white rounded-3xl overflow-hidden border-2 transition-all duration-300 ${associatedIdol ? 'border-gray-50' : 'border-orange-100 shadow-sm'}`}
            >
              {/* God Header */}
              <div className="p-6 pb-0 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-orange-100 bg-orange-50 flex-shrink-0">
                      <img src={god.image} alt={god.name} className="w-full h-full object-cover" />
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-gray-800 leading-none">{god.name}</h3>
                      <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">{god.category || 'Deity'}</span>
                   </div>
                </div>
                <button 
                  onClick={() => handleAddAnimation(god)}
                  className="p-3 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 transition-all shadow-lg flex items-center gap-1 text-[10px] font-black uppercase  text-nowrap"
                >
                  <FaFilm className="text-xs " /> Add Anim
                </button>
              </div>

                  <div className="p-6 pt-6">
                <div className="space-y-6">
                {associatedIdol ? (
                  <>
                    <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50">
                        <label className="text-[10px] font-black uppercase text-orange-600 tracking-widest mb-3 block">Primary Idol Video</label>
                        <VideoCard 
                            idol={associatedIdol} 
                            godId={god._id}
                            isSaved={true} 
                            onView={setViewVideo}
                            onDelete={deleteIdol}
                            onEdit={startEdit}
                        />
                    </div>

                    {/* Show Animations */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block px-1">Special Animations ({animations.filter(a => a.godIdol?._id === associatedIdol._id || a.godIdol === associatedIdol._id).length})</label>
                        <div className="grid grid-cols-2 gap-3">
                            {animations
                                .filter(a => a.godIdol?._id === associatedIdol._id || a.godIdol === associatedIdol._id)
                                .map(anim => (
                                    <div key={anim._id} className="relative group/anim">
                                        {/* Delete Button - always visible */}
                                        <button
                                            onClick={() => {
                                                if(window.confirm("Delete this animation?")) {
                                                    animationAPI.deleteAnimation(anim._id).then(res => {
                                                        if(res.success) fetchInitialData();
                                                    });
                                                }
                                            }}
                                            className="absolute top-1.5 right-1.5 z-10 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg transition-all hover:scale-110"
                                            title="Delete animation"
                                        >
                                            <FaTrash size={10}/>
                                        </button>

                                        {/* Video Thumbnail */}
                                        <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 cursor-pointer" onClick={() => setViewVideo({ url: anim.video.signedUrl || anim.video.url, name: anim.title || 'Animation' })}>
                                            <video src={anim.video.signedUrl || anim.video.url} className="w-full h-full object-cover" muted />
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/anim:opacity-100 transition-all rounded-xl">
                                                <FaPlay className="text-white text-xl" />
                                            </div>
                                        </div>

                                        {/* Category Label */}
                                        <div className="mt-1 flex items-center gap-1 px-1 overflow-hidden">
                                            {anim.category?.icon && <img src={anim.category.icon} className="w-3 h-3 rounded-full object-cover flex-shrink-0" />}
                                            <p className="text-[10px] font-bold text-gray-600 truncate">{anim.category?.name || 'Animation'}</p>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {hasSelectedVideo ? (
                      <div className="space-y-3">
                        <VideoCard 
                          godId={god._id}
                          isSaved={false} 
                          onView={setViewVideo}
                          newVideoPreview={newVideos[god._id]?.preview}
                        />
                        <div className="flex gap-2">
                           <button
                             onClick={() => saveGodIdol(god._id)}
                             disabled={actionLoading}
                             className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                           >
                             {actionLoading ? <FaSpinner className="animate-spin" /> : <><FaSave /> Save</>}
                           </button>
                           <button onClick={() => removeSelectedVideo(god._id)} className="p-3 bg-gray-100 text-gray-400 rounded-xl hover:bg-gray-200"><FaTimes /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-6 group/upload">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400 group-hover/upload:text-orange-500 group-hover/upload:scale-110 transition-all duration-300 mb-3">
                           <FaUpload />
                        </div>
                        <p className="text-sm font-bold text-gray-800">No Idol Assigned</p>
                        <label className="cursor-pointer mt-4">
                          <div className="px-5 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-800 hover:text-white transition-all shadow-sm">
                            Select Video
                          </div>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleVideoSelect(e, god._id)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {viewVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4" onClick={() => setViewVideo(null)}>
          <div className="relative max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                  <h3 className="text-sm font-bold">{viewVideo.name}</h3>
               </div>
               <button onClick={() => setViewVideo(null)} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><FaTimes /></button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              <video key={viewVideo.url} src={viewVideo.url} controls autoPlay playsInline className="w-full h-full" />
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
               <span className="text-xs font-bold text-gray-400">{formatFileSize(viewVideo.size)}</span>
            </div>
          </div>
        </div>
      )}

      {editingIdol && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black text-gray-800">Update Idol Video</h3>
               <button onClick={() => setEditingIdol(null)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>

            <div className="aspect-video rounded-2xl bg-black overflow-hidden relative group">
               {(() => {
                 const videoSource = editFile?.preview || editingIdol.video?.signedUrl || editingIdol.video?.url
                 return <video key={videoSource} src={videoSource} playsInline className="w-full h-full object-cover" />
               })()}
               <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <label className="cursor-pointer px-6 py-2 bg-white text-gray-900 rounded-full font-bold shadow-xl hover:scale-105 transition-all">
                    Change Media
                    <input type="file" accept="video/*" onChange={handleEditFileChange} className="hidden" />
                  </label>
               </div>
            </div>

            <div className="flex gap-4">
               <button
                 onClick={handleUpdateIdol}
                 disabled={actionLoading || !editFile}
                 className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {actionLoading ? <FaSpinner className="animate-spin" /> : <><FaCheck />Confirm Update</>}
               </button>
               <button
                 onClick={() => setEditingIdol(null)}
                 className="px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
               >
                 Cancel
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Animation Modal */}
      {isAnimationModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg p-10 relative">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-900 italic leading-none">Add Animation</h2>
                <p className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-widest">For {selectedGodForAnim?.name}</p>
              </div>
              <button 
                onClick={() => setIsAnimationModalOpen(false)}
                className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleAnimSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-orange-500 tracking-[0.2em] ml-1">Select Category</label>
                <select 
                  required
                  value={animForm.categoryId}
                  onChange={e => setAnimForm({...animForm, categoryId: e.target.value})}
                  className="w-full p-4 rounded-2xl bg-gray-50 border-none outline-none font-bold mt-1 appearance-none cursor-pointer"
                >
                  <option value="">Select Category...</option>
                  {animCategories.map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-orange-500 tracking-[0.2em] ml-1">Upload Animation Video</label>
                <div className={`mt-1 border-2 border-dashed rounded-2xl p-8 text-center transition-all ${animForm.video ? 'border-green-200 bg-green-50' : 'border-gray-100 hover:border-orange-200'}`}>
                  {animForm.video ? (
                    <div className="flex flex-col items-center gap-2">
                      <FaFilm className="text-3xl text-green-500" />
                      <p className="text-sm font-bold text-gray-700">{animForm.video.name}</p>
                      <button 
                        type="button" 
                        onClick={() => setAnimForm({...animForm, video: null})}
                        className="text-[10px] font-black uppercase text-red-500 mt-2 hover:underline"
                      >
                        Change Video
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-gray-400">
                        <FaUpload />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">Choose Video File</p>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase">MP4, MOV up to 100MB</p>
                      </div>
                      <input 
                        required
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={e => setAnimForm({...animForm, video: e.target.files[0]})}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="submit" 
                  disabled={animLoading}
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {animLoading ? <FaSpinner className="animate-spin" /> : <><FaCheck className="text-sm" /> Save Animation</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GodIdol
