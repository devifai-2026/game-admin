import React, { useState, useEffect, useRef } from 'react'
import { FaUpload, FaTrash, FaSave, FaEye, FaTimes, FaImage, FaEdit, FaCheck, FaTimesCircle, FaCamera } from 'react-icons/fa'

// SVG Data URIs for God Placeholders/Icons
const ganeshaIcon = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23FF9933'/><text x='50' y='55' font-size='40' text-anchor='middle' fill='white'>🐘</text></svg>"
const shivaIcon = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%233366FF'/><text x='50' y='55' font-size='40' text-anchor='middle' fill='white'>🔱</text></svg>"
const krishnaIcon = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%2300CCFF'/><text x='50' y='55' font-size='40' text-anchor='middle' fill='white'>🪈</text></svg>"
const lakshmiIcon = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23FF3399'/><text x='50' y='55' font-size='40' text-anchor='middle' fill='white'>🪷</text></svg>"

const categories = [
  { id: 1, name: 'Lord Ganesha', image: ganeshaIcon, color: '#FF9933' },
  { id: 2, name: 'Lord Shiva', image: shivaIcon, color: '#3366FF' },
  { id: 3, name: 'Lord Krishna', image: krishnaIcon, color: '#00CCFF' },
  { id: 4, name: 'Goddess Lakshmi', image: lakshmiIcon, color: '#FF3399' }
]

const GodIdol = () => {
  const [selectedCategory, setSelectedCategory] = useState(null)
  
  // Initialize with empty arrays for all categories
  const initialCategoryImages = {
    1: [],
    2: [],
    3: [],
    4: []
  }
  
  const [categoryImages, setCategoryImages] = useState(initialCategoryImages)
  const [savedCategoryImages, setSavedCategoryImages] = useState(initialCategoryImages)
  const [viewImage, setViewImage] = useState(null)
  const [editingImage, setEditingImage] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', category: '' })
  const [newImageFile, setNewImageFile] = useState(null)
  const editFileInputRef = useRef(null)

  // Load saved images from localStorage on component mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('godIdolImages') || '{}')
    
    // Ensure all categories have arrays, even if not in localStorage
    const initializedSaved = { ...initialCategoryImages, ...saved }
    
    // Filter out any categories that aren't in our defined categories
    const validCategories = categories.map(c => c.id)
    const filteredSaved = Object.keys(initializedSaved).reduce((acc, key) => {
      const categoryId = parseInt(key)
      if (validCategories.includes(categoryId)) {
        acc[categoryId] = initializedSaved[categoryId] || []
      }
      return acc
    }, {})
    
    setSavedCategoryImages(filteredSaved)
  }, [])

  const handleImageUpload = (e, categoryId) => {
    const files = Array.from(e.target.files)
    
    const newImages = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      preview: URL.createObjectURL(file),
      name: file.name.replace(/\.[^/.]+$/, ""),
      size: file.size,
      type: file.type || 'image/jpeg',
      uploadedAt: new Date().toISOString(),
      categoryId: categoryId
    }))

    setCategoryImages(prev => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] || []), ...newImages]
    }))
  }

  const removeImage = (categoryId, imageId) => {
    const imageToRemove = categoryImages[categoryId]?.find(img => img.id === imageId)
    if (imageToRemove?.preview) {
      URL.revokeObjectURL(imageToRemove.preview)
    }
    
    setCategoryImages(prev => ({
      ...prev,
      [categoryId]: (prev[categoryId] || []).filter(img => img.id !== imageId)
    }))
  }

  const removeSavedImage = (categoryId, imageId) => {
    const imageToRemove = savedCategoryImages[categoryId]?.find(img => img.id === imageId)
    
    const updated = {
      ...savedCategoryImages,
      [categoryId]: (savedCategoryImages[categoryId] || []).filter(img => img.id !== imageId)
    }
    setSavedCategoryImages(updated)
    localStorage.setItem('godIdolImages', JSON.stringify(updated))
  }

  // Edit saved image
  const startEditSavedImage = (image, categoryId) => {
    setEditingImage({ ...image, categoryId })
    setEditForm({ 
      name: image.name,
      category: categoryId.toString()
    })
    setNewImageFile(null) // Reset new image file
  }

  // Handle edit file change
  const handleEditFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const newImage = {
        file: file,
        preview: URL.createObjectURL(file),
        name: file.name.replace(/\.[^/.]+$/, ""),
        size: file.size,
        type: file.type || 'image/jpeg'
      }
      setNewImageFile(newImage)
      
      // Update form name to match new file name if not manually changed
      if (editForm.name === editingImage?.name) {
        setEditForm(prev => ({ ...prev, name: newImage.name }))
      }
    }
  }

  const handleEditSavedImage = async () => {
    if (!editingImage) return

    const oldCategoryId = editingImage.categoryId
    const newCategoryId = parseInt(editForm.category)
    let updatedImageData

    // If new image file is selected, convert it to data URL
    if (newImageFile && newImageFile.file) {
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(newImageFile.file)
      })

      updatedImageData = {
        id: editingImage.id,
        name: editForm.name,
        size: newImageFile.size,
        type: newImageFile.type,
        data: dataUrl, // Save as data URL
        uploadedAt: new Date().toISOString(),
        categoryId: newCategoryId
      }

      // Clean up the old preview URL if it exists
      if (editingImage.preview && editingImage.preview.startsWith('blob:')) {
        URL.revokeObjectURL(editingImage.preview)
      }
    } else {
      // Keep the existing image data
      updatedImageData = {
        ...editingImage,
        name: editForm.name,
        categoryId: newCategoryId,
        uploadedAt: new Date().toISOString()
        // Keep the existing data property
      }
    }

    // Remove image from old category
    const updatedOldCategory = {
      ...savedCategoryImages,
      [oldCategoryId]: (savedCategoryImages[oldCategoryId] || []).filter(img => img.id !== editingImage.id)
    }

    // Add to new category
    const updatedNewCategory = {
      ...updatedOldCategory,
      [newCategoryId]: [
        ...(updatedOldCategory[newCategoryId] || []),
        updatedImageData
      ]
    }

    setSavedCategoryImages(updatedNewCategory)
    localStorage.setItem('godIdolImages', JSON.stringify(updatedNewCategory))

    // Clean up new image preview URL
    if (newImageFile?.preview) {
      URL.revokeObjectURL(newImageFile.preview)
    }

    setEditingImage(null)
    setEditForm({ name: '', category: '' })
    setNewImageFile(null)
  }

  const cancelEdit = () => {
    if (newImageFile?.preview) {
      URL.revokeObjectURL(newImageFile.preview)
    }
    setEditingImage(null)
    setEditForm({ name: '', category: '' })
    setNewImageFile(null)
  }

  const saveCategoryImages = (categoryId) => {
    const imagesToSave = categoryImages[categoryId] || []
    
    if (imagesToSave.length === 0) {
      alert(`No images to save for ${categories.find(c => c.id === categoryId)?.name}!`)
      return
    }

    const savePromises = imagesToSave.map(img => {
      return new Promise((resolve) => {
        if (img.file) {
          const reader = new FileReader()
          reader.onloadend = () => {
            resolve({
              id: img.id,
              name: img.name,
              size: img.size,
              type: img.type,
              uploadedAt: img.uploadedAt,
              data: reader.result, // Save as data URL
              categoryId: categoryId
            })
          }
          reader.readAsDataURL(img.file)
        } else {
          resolve(img)
        }
      })
    })

    Promise.all(savePromises).then((processedImages) => {
      const existingImages = savedCategoryImages[categoryId] || []
      const allImages = [...existingImages, ...processedImages]
      
      const updated = {
        ...savedCategoryImages,
        [categoryId]: allImages
      }
      
      setSavedCategoryImages(updated)
      localStorage.setItem('godIdolImages', JSON.stringify(updated))
      
      // Clear unsaved images for this category and clean up URLs
      imagesToSave.forEach(img => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview)
        }
      })
      
      setCategoryImages(prev => ({
        ...prev,
        [categoryId]: []
      }))
      
      alert(`${processedImages.length} images saved successfully for ${categories.find(c => c.id === categoryId)?.name}!`)
    })
  }

  const clearCategoryImages = (categoryId) => {
    const categoryName = categories.find(c => c.id === categoryId)?.name
    const imagesCount = categoryImages[categoryId]?.length || 0
    
    if (imagesCount === 0) {
      alert(`No unsaved images to clear for ${categoryName}!`)
      return
    }
    
    if (window.confirm(`Clear all ${imagesCount} unsaved images for ${categoryName}?`)) {
      // Clean up URLs
      categoryImages[categoryId].forEach(img => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview)
        }
      })
      
      setCategoryImages(prev => ({
        ...prev,
        [categoryId]: []
      }))
    }
  }

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

  const ImageCard = ({ image, categoryId, isSaved = false, onView, onDelete, onEdit }) => (
    <div className="relative border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white group">
      <div className="relative">
        <img
          src={image.data || image.preview} // Look for data first, then preview
          alt={image.name}
          className="w-full h-40 object-cover cursor-pointer"
          onClick={() => onView(image)}
          onError={(e) => {
            // If image fails to load, show placeholder
            e.target.onerror = null
            e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" font-family="Arial" font-size="10" fill="%239ca3af" text-anchor="middle" dy=".3em">Image</text></svg>'
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
        
        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onView(image)}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            title="View"
          >
            <FaEye size={12} />
          </button>
          {isSaved && (
            <button
              onClick={() => onEdit(image, categoryId)}
              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
              title="Edit"
            >
              <FaEdit size={12} />
            </button>
          )}
          <button
            onClick={() => onDelete(categoryId, image.id)}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="Delete"
          >
            <FaTrash size={12} />
          </button>
        </div>
      </div>
      
      <div className="p-3">
        <p className="font-medium text-xs truncate" title={image.name}>
          {image.name}
        </p>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">
            {formatFileSize(image.size)}
          </span>
          <span className="text-xs text-gray-500">
            {formatDate(image.uploadedAt)}
          </span>
        </div>
        {image.categoryId && (
          <div className="mt-1">
            <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
              {categories.find(c => c.id === image.categoryId)?.name || 'Unknown'}
            </span>
          </div>
        )}
      </div>
    </div>
  )

  const getCategoryStats = (categoryId) => {
    return {
      unsaved: (categoryImages[categoryId] || []).length,
      saved: (savedCategoryImages[categoryId] || []).length
    }
  }

  const triggerEditFileInput = () => {
    editFileInputRef.current?.click()
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
      {/* Image Viewer Modal */}
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
                <h3 className="text-lg font-semibold truncate">{viewImage.name}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm">
                  <span>{formatFileSize(viewImage.size)}</span>
                  <span>•</span>
                  <span>{formatDate(viewImage.uploadedAt)}</span>
                  {viewImage.categoryId && (
                    <>
                      <span>•</span>
                      <span>{categories.find(c => c.id === viewImage.categoryId)?.name}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-center items-center bg-gray-900 min-h-[60vh]">
                <img
                  src={viewImage.data || viewImage.preview}
                  alt={viewImage.name}
                  className="max-w-full max-h-[70vh] object-contain"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231f2937"/><text x="200" y="150" font-family="Arial" font-size="20" fill="%236b7280" text-anchor="middle" dy=".3em">Image not available</text></svg>'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Image Modal */}
      {editingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Edit Image</h3>
              <button
                onClick={cancelEdit}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="mb-6">
              {/* Image Preview with Change Button */}
              <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden border group">
                <img
                  src={newImageFile?.preview || editingImage.data || editingImage.preview}
                  alt={editForm.name || editingImage.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f3f4f6"/><text x="200" y="150" font-family="Arial" font-size="16" fill="%239ca3af" text-anchor="middle" dy=".3em">Image preview</text></svg>'
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300"></div>
                <button
                  onClick={triggerEditFileInput}
                  className="absolute bottom-3 right-3 flex items-center gap-2 px-4 py-2 bg-white bg-opacity-90 text-gray-800 rounded-lg hover:bg-white hover:bg-opacity-100 transition-all"
                >
                  <FaCamera className="w-4 h-4" />
                  Change Image
                </button>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditFileChange}
                  className="hidden"
                />
                
                {/* File Info */}
                <div className="absolute top-3 left-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {formatFileSize(newImageFile?.size || editingImage.size)}
                </div>
              </div>
              
              {/* Edit Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter image name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* File Info Display */}
                {newImageFile && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-blue-800">New Image:</span>
                      <span className="text-blue-600">{newImageFile.name}</span>
                    </div>
                    <div className="mt-1 text-xs text-blue-600">
                      Size: {formatFileSize(newImageFile.size)} • Type: {newImageFile.type}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleEditSavedImage}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
              >
                <FaCheck />
                Save Changes
              </button>
              <button
                onClick={cancelEdit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
              >
                <FaTimesCircle />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6" style={{ color: '#cc494c' }}>
        God Idol Management
      </h2>
      
      {/* Category Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#fea947' }}>
          Select God
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => {
            const stats = getCategoryStats(category.id)
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
                <div className="mb-2 w-16 h-16 rounded-full overflow-hidden border">
                   <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                </div>
                <span className="font-semibold text-center text-sm">{category.name}</span>
                
                {/* Stats */}
                <div className="flex gap-2 mt-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                    {stats.saved} saved
                  </span>
                  {stats.unsaved > 0 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                      {stats.unsaved} new
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Category Content */}
      {selectedCategory && (
        <div className="border-t pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2" 
                  style={{ color: categories.find(c => c.id === selectedCategory)?.color }}>
                 <div className="w-8 h-8 rounded-full overflow-hidden border">
                    <img src={categories.find(c => c.id === selectedCategory)?.image} alt="" className="w-full h-full object-cover" />
                 </div>
                <span>{categories.find(c => c.id === selectedCategory)?.name}</span>
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Upload and manage images for {categories.find(c => c.id === selectedCategory)?.name}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: '#fea947' }}>
                  {(categoryImages[selectedCategory] || []).length}
                </div>
                <div className="text-xs text-gray-600">Unsaved</div>
              </div>
              
              <label className="cursor-pointer">
                <div className="flex items-center px-4 py-2 rounded-lg text-white font-semibold transition duration-300 hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: categories.find(c => c.id === selectedCategory)?.color }}>
                  <FaUpload className="mr-2" />
                  Upload Images
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, selectedCategory)}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Uploaded Images Section */}
          <div className="mb-8 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-700">Uploaded Images</h4>
              <div className="flex items-center gap-2">
                {((categoryImages[selectedCategory] || []).length) > 0 && (
                  <>
                    <button
                      onClick={() => clearCategoryImages(selectedCategory)}
                      className="px-3 py-1.5 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition duration-300 text-sm"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={() => saveCategoryImages(selectedCategory)}
                      className="flex items-center px-4 py-1.5 text-white rounded-lg font-semibold transition duration-300 hover:opacity-90 text-sm"
                      style={{ backgroundColor: '#cc494c' }}
                    >
                      <FaSave className="mr-2" />
                      Save All ({(categoryImages[selectedCategory] || []).length})
                    </button>
                  </>
                )}
              </div>
            </div>

            {(categoryImages[selectedCategory] || []).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(categoryImages[selectedCategory] || []).map((image) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    categoryId={selectedCategory}
                    onView={setViewImage}
                    onDelete={removeImage}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <FaImage className="text-4xl text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No images uploaded yet</p>
                <p className="text-sm text-gray-400 mt-1">Click "Upload Images" to add god images</p>
              </div>
            )}
          </div>

          {/* Saved Images Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-700">Saved Images</h4>
              {((savedCategoryImages[selectedCategory] || []).length) > 0 && (
                <span className="text-sm text-gray-600">
                  {(savedCategoryImages[selectedCategory] || []).length} images
                </span>
              )}
            </div>

            {(savedCategoryImages[selectedCategory] || []).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(savedCategoryImages[selectedCategory] || []).map((image) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    categoryId={selectedCategory}
                    isSaved={true}
                    onView={setViewImage}
                    onDelete={removeSavedImage}
                    onEdit={startEditSavedImage}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No saved images for this god</p>
                <p className="text-sm text-gray-400 mt-1">Upload and save images to see them here</p>
              </div>
            )}
          </div>

          {/* Category Stats */}
          <div className="mt-6 p-4 rounded-lg" 
               style={{ 
                 backgroundColor: `${categories.find(c => c.id === selectedCategory)?.color}10`,
                 borderLeft: `4px solid ${categories.find(c => c.id === selectedCategory)?.color}`
               }}>
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-semibold text-sm">God Statistics</h5>
                <div className="flex gap-6 mt-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#cc494c' }}>
                      {(categoryImages[selectedCategory] || []).length}
                    </div>
                    <div className="text-xs text-gray-600">Unsaved Images</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#fea947' }}>
                      {(savedCategoryImages[selectedCategory] || []).length}
                    </div>
                    <div className="text-xs text-gray-600">Saved Images</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#4CAF50' }}>
                      {(categoryImages[selectedCategory] || []).length + (savedCategoryImages[selectedCategory] || []).length}
                    </div>
                    <div className="text-xs text-gray-600">Total Images</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GodIdol
