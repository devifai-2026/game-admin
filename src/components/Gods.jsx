import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaSpinner, 
  FaExclamationTriangle, FaCheck, FaFilm, FaVideo, 
  FaPlay, FaEye, FaChevronRight, FaImage, FaEllipsisV,
  FaArrowLeft, FaArrowRight, FaSearch, FaMagic
} from 'react-icons/fa';
import godAPI from '../apis/god.api';
import godIdolAPI from '../apis/godIdol.api';
import animationAPI from '../apis/animation.api';
import animationCategoryAPI from '../apis/animationCategory.api';

const GodsManagement = () => {
    const [gods, setGods] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // UI states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGodId, setEditingGodId] = useState(null);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [viewVideo, setViewVideo] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
    
    // Form state
    const [form, setForm] = useState({
        name: '',
        description: '',
        image: null,      // { file, preview, url }
        idleVideo: null,  // { file, preview, url }
        animations: []    // Array of { categoryId, file, preview, url, _id }
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => {
                setError('');
                setSuccess('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const fetchInitialData = async (page = 1) => {
        setLoading(true);
        try {
            const [godRes, catRes] = await Promise.all([
                godAPI.getAllGods(page, 10, searchTerm),
                animationCategoryAPI.getAllCategories()
            ]);
            
            if (godRes.success) {
                setGods(godRes.data.gods || []);
                if (godRes.data.pagination) {
                    setPagination(godRes.data.pagination);
                }
            }
            if (catRes.success) setCategories(catRes.data?.categories || catRes.data || []);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchInitialData(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleToggleStatus = async (id, currentStatus) => {
        setActionLoading(true);
        try {
            const result = await godAPI.updateGod(id, { isActive: !currentStatus });
            if (result.success) {
                setGods(prev => prev.map(g => g._id === id ? { ...g, isActive: !currentStatus } : g));
                setSuccess(`Deity ${!currentStatus ? 'published' : 'unpublished'} successfully`);
            }
        } catch (err) {
            setError('Status toggle failed');
        } finally {
            setActionLoading(false);
            setActiveActionMenu(null);
        }
    };

    const handleDeleteGod = async (id) => {
        if (!window.confirm('Delete this Deity? All associated records will be lost.')) return;
        setActionLoading(true);
        try {
            const result = await godAPI.deleteGod(id);
            if (result.success) {
                setGods(prev => prev.filter(g => g._id !== id));
                setSuccess('Deity removed successfully');
            }
        } catch (err) {
            setError('Deletion failed');
        } finally {
            setActionLoading(false);
            setActiveActionMenu(null);
        }
    };

    const openAddModal = () => {
        setEditingGodId(null);
        setForm({
            name: '',
            description: '',
            image: null,
            idleVideo: null,
            animations: []
        });
        setIsModalOpen(true);
    };

    const openEditModal = async (god) => {
        setEditingGodId(god._id);
        setActionLoading(true);
        setActiveActionMenu(null);
        
        try {
            const idolRes = await godIdolAPI.getGodIdolByGodId(god._id);
            let idleVideo = null;
            let animations = [];
            
            if (idolRes.success && idolRes.data) {
                const idol = idolRes.data;
                idleVideo = { 
                    url: idol.video?.url, 
                    preview: idol.video?.signedUrl || idol.video?.url,
                    _id: idol._id 
                };
                
                const animRes = await animationAPI.getAnimationsByGodIdol(idol._id);
                if (animRes.success) {
                    animations = animRes.data.map(a => ({
                        categoryId: a.category,
                        url: a.video?.url,
                        preview: a.video?.signedUrl || a.video?.url,
                        _id: a._id
                    }));
                }
            }

            setForm({
                name: god.name,
                description: god.description || '',
                image: { url: god.image, preview: god.image },
                idleVideo,
                animations
            });
            setIsModalOpen(true);
        } catch (err) {
            setError('Failed to load details');
        } finally {
            setActionLoading(false);
        }
    };

    const handleFileSelect = (e, target, categoryId = null) => {
        const file = e.target.files[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        
        if (target === 'icon') {
            setForm(prev => ({ ...prev, image: { file, preview } }));
        } else if (target === 'idle') {
            setForm(prev => ({ ...prev, idleVideo: { file, preview } }));
        } else if (target === 'extra') {
            const idx = form.animations.findIndex(a => a.categoryId === categoryId);
            if (idx > -1) {
                const newAnims = [...form.animations];
                newAnims[idx] = { ...newAnims[idx], file, preview };
                setForm(prev => ({ ...prev, animations: newAnims }));
            } else {
                setForm(prev => ({ 
                    ...prev, 
                    animations: [...prev.animations, { categoryId, file, preview }] 
                }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.image || !form.idleVideo) {
            setError('Name, Icon, and Idle Video are strictly mandatory');
            return;
        }

        setActionLoading(true);
        setError('');
        
        try {
            let godId = editingGodId;
            let imageUrl = form.image.url;
            
            if (form.image.file) {
                const uploadRes = await godAPI.uploadToCloudinary(form.image.file);
                if (uploadRes.success) imageUrl = uploadRes.data.url;
                else throw new Error('Icon upload failed');
            }

            const godData = { name: form.name, description: form.description, image: imageUrl };
            if (editingGodId) {
                await godAPI.updateGod(editingGodId, godData);
            } else {
                const res = await godAPI.createGod(godData);
                if (res.success) godId = res.data._id;
                else throw new Error(res.message);
            }

            let godIdolId;
            const idolFoundRes = await godIdolAPI.getGodIdolByGodId(godId);
            const idolFormData = new FormData();
            idolFormData.append('godId', godId);
            if (form.idleVideo.file) idolFormData.append('video', form.idleVideo.file);

            if (idolFoundRes.success && idolFoundRes.data) {
                if (form.idleVideo.file) {
                    const res = await godIdolAPI.updateGodIdol(idolFoundRes.data._id, idolFormData);
                    godIdolId = res.data._id;
                } else {
                    godIdolId = idolFoundRes.data._id;
                }
            } else {
                const res = await godIdolAPI.createGodIdol(idolFormData);
                godIdolId = res.data._id;
            }

            for (const anim of form.animations) {
                if (anim.file) {
                    const animFormData = new FormData();
                    animFormData.append('godIdol', godIdolId);
                    animFormData.append('category', anim.categoryId);
                    animFormData.append('video', anim.file);
                    animFormData.append('title', categories.find(c => c._id === anim.categoryId)?.name || 'Animation');

                    if (anim._id) await animationAPI.updateAnimation(anim._id, animFormData);
                    else await animationAPI.createAnimation(animFormData);
                }
            }

            setSuccess('Divine records updated successfully');
            setIsModalOpen(false);
            fetchInitialData(pagination.page);
        } catch (err) {
            setError(err.message || 'Workflow failed');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredGods = gods.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading && gods.length === 0) {
        return <div className="p-20 text-center"><FaSpinner className="animate-spin text-4xl text-gray-900 mx-auto" /></div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 bg-gray-50/30">
            {/* Messages */}
            {(error || success) && (
                <div className="fixed top-20 right-4 sm:right-8 z-[200] flex flex-col gap-3 max-w-xs sm:max-w-sm w-full">
                    {error && <div className="bg-red-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm"><FaExclamationTriangle className="flex-shrink-0" /> <span className="line-clamp-2">{error}</span></div>}
                    {success && <div className="bg-green-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-sm"><FaCheck className="flex-shrink-0" /> <span className="line-clamp-2">{success}</span></div>}
                </div>
            )}

            {/* Header */}
            <div className="bg-white p-4 sm:p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: '#cc494c' }}>Gods Management</h1>
                    <p className="text-gray-500 text-xs mt-0.5 font-semibold">Configure divine avatars and their sacred interactions.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-56">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
                        <input
                            type="text"
                            placeholder="Search Deities..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-2.5 bg-gray-50 rounded-xl border-none outline-none font-semibold text-sm focus:bg-white transition-all ring-2 ring-transparent focus:ring-red-100"
                        />
                    </div>
                    <button
                        onClick={openAddModal}
                        className="px-4 py-2.5 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:opacity-90 transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
                        style={{ backgroundColor: '#cc494c' }}
                    >
                        <FaPlus size={10} /> Add God
                    </button>
                </div>
            </div>

            {/* List View */}
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                        <thead>
                            <tr style={{ backgroundColor: '#fff5f5' }}>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest pl-5" style={{ color: '#cc494c' }}>Icon</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest" style={{ color: '#cc494c' }}>Name</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest hidden md:table-cell" style={{ color: '#cc494c' }}>Created</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest" style={{ color: '#cc494c' }}>Status</th>
                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-right pr-5" style={{ color: '#cc494c' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredGods.map(god => (
                                <tr key={god._id} className="group hover:bg-gray-50/50 transition-all">
                                    <td className="px-4 py-2.5 pl-5">
                                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 border border-white shadow-sm group-hover:scale-105 transition-transform">
                                            <img src={god.image} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <p className="font-semibold text-gray-700 text-sm">{god.name}</p>
                                        <p className="text-[10px] text-gray-400 font-medium truncate max-w-[140px]">{god.description || 'No description.'}</p>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-gray-500 hidden md:table-cell">
                                        {new Date(god.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleStatus(god._id, god.isActive)}
                                            className={`relative w-10 h-5 rounded-full transition-all duration-300 focus:outline-none ${
                                                god.isActive ? 'bg-green-500' : 'bg-gray-300'
                                            }`}
                                            title={god.isActive ? 'Published — click to unpublish' : 'Draft — click to publish'}
                                        >
                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                                                god.isActive ? 'left-5' : 'left-0.5'
                                            }`} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-2.5 text-right pr-5">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                onClick={() => openEditModal(god)}
                                                className="p-2 bg-gray-50 rounded-lg hover:bg-red-50 transition-all"
                                                style={{ color: '#cc494c' }}
                                                title="Edit"
                                            >
                                                <FaEdit size={11} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteGod(god._id)}
                                                className="p-2 bg-gray-50 text-red-500 rounded-lg hover:bg-red-50 transition-all"
                                                title="Delete"
                                            >
                                                <FaTrash size={11} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredGods.length === 0 && (
                    <div className="p-12 sm:p-20 text-center flex flex-col items-center gap-4">
                        <FaSearch size={40} className="text-gray-200" />
                        <p className="text-gray-400 font-semibold">No gods found matching your search.</p>
                    </div>
                )}

                {/* Pagination UI */}
                {pagination.pages > 1 && (
                    <div className="p-4 sm:p-8 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/10">
                        <p className="text-[10px] font-semibold uppercase text-gray-500 tracking-widest order-2 sm:order-1">
                            Showing <span className="text-gray-700 font-bold">{gods.length}</span> of <span className="text-gray-700 font-bold">{pagination.total}</span> Gods
                        </p>
                        <div className="flex gap-2 sm:gap-3 order-1 sm:order-2 flex-wrap justify-center">
                            <button 
                                disabled={pagination.page === 1 || loading}
                                onClick={() => fetchInitialData(pagination.page - 1)}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:shadow-lg transition-all disabled:opacity-30"
                            >
                                <FaArrowLeft size={12} />
                            </button>
                            
                            {[...Array(pagination.pages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => fetchInitialData(i + 1)}
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl font-black text-sm transition-all ${
                                        pagination.page === i + 1
                                        ? 'text-white shadow-xl scale-110'
                                        : 'bg-white text-gray-400 border border-gray-100 hover:border-red-200 hover:text-gray-900'
                                    }`}
                                    style={pagination.page === i + 1 ? { backgroundColor: '#cc494c' } : {}}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button 
                                disabled={pagination.page === pagination.pages || loading}
                                onClick={() => fetchInitialData(pagination.page + 1)}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:shadow-lg transition-all disabled:opacity-30"
                            >
                                <FaArrowRight size={12} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Creation/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto relative">
                        <div className="sticky top-0 bg-white/90 backdrop-blur-xl px-5 sm:px-8 py-4 border-b border-gray-50 flex justify-between items-center z-10">
                            <h2 className="text-lg sm:text-xl font-black tracking-tight" style={{ color: '#cc494c' }}>{editingGodId ? 'Edit God' : 'Add New God'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400"><FaTimes size={14}/></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Details & Icon */}
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: '#cc494c' }}>Name *</label>
                                        <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3.5 rounded-2xl bg-gray-50 border-none outline-none font-semibold text-gray-700 text-sm focus:bg-white ring-2 ring-transparent focus:ring-red-100 transition-all" placeholder="Enter Name..."/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: '#cc494c' }}>Description</label>
                                        <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-3.5 rounded-2xl bg-gray-50 border-none outline-none font-medium text-gray-700 text-sm min-h-[100px] focus:bg-white ring-2 ring-transparent focus:ring-red-100 transition-all" placeholder="Describe this god..."/>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: '#cc494c' }}>God Icon *</label>
                                        <div className="relative group w-32 h-32 rounded-3xl border-2 border-dashed border-gray-100 hover:border-red-100 bg-gray-50 flex items-center justify-center overflow-hidden transition-all">
                                            {form.image ? (
                                                <>
                                                    <img src={form.image.preview} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                        <label className="bg-white px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg cursor-pointer">Update</label>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-gray-300">
                                                    <FaImage size={28} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Select Icon</span>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileSelect(e, 'icon')} />
                                        </div>
                                    </div>
                                </div>

                                {/* Videos */}
                                <div className="space-y-5">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2" style={{ color: '#cc494c' }}>
                                            <FaVideo size={12}/> <h3 className="text-sm font-black uppercase">Idle Video *</h3>
                                        </div>
                                        <div className="aspect-video rounded-2xl bg-black overflow-hidden relative group border-2 border-white shadow-lg">
                                            {form.idleVideo ? (
                                                <>
                                                    <video src={form.idleVideo.preview} autoPlay loop muted className="w-full h-full object-cover opacity-80" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-all">
                                                        <button type="button" onClick={() => setViewVideo(form.idleVideo.preview)} className="p-3 bg-white/20 backdrop-blur-xl rounded-full text-white hover:bg-white/40"><FaPlay size={12}/></button>
                                                        <label className="bg-white px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer">Replace</label>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-gray-50 gap-3">
                                                    <FaFilm size={28} className="text-gray-200" />
                                                    <label className="px-5 py-2 text-white rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer shadow-md hover:opacity-90" style={{ backgroundColor: '#cc494c' }}>Choose Idle Video</label>
                                                </div>
                                            )}
                                            <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileSelect(e, 'idle')} />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center" style={{ color: '#cc494c' }}>
                                            <div className="flex items-center gap-2"><FaMagic size={12}/> <h3 className="text-sm font-black uppercase">Interactions (Up to 6)</h3></div>
                                            <span className="text-[9px] font-black px-3 py-1 rounded-full" style={{ backgroundColor: '#fff5f5', color: '#cc494c' }}>{form.animations.length} / 6</span>
                                        </div>

                                        <div className="space-y-2">
                                            {form.animations.map((anim, i) => {
                                                const cat = categories.find(c => c._id === anim.categoryId);
                                                return (
                                                    <div key={i} className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-purple-100">
                                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0">
                                                            {cat?.icon ? <img src={cat.icon} className="w-full h-full object-cover" alt={cat?.name} /> : <FaVideo className="text-gray-300 text-sm" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-gray-700 text-sm truncate">{cat?.name || 'Unknown Type'}</p>
                                                            <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">Ready</p>
                                                        </div>
                                                        <div className="flex gap-1.5">
                                                            <button type="button" onClick={() => setViewVideo(anim.preview)} className="p-2 bg-white rounded-xl hover:bg-red-50 transition-all shadow-sm" style={{ color: '#cc494c' }}><FaEye size={11}/></button>
                                                            <button type="button" onClick={() => setForm(prev => ({ ...prev, animations: prev.animations.filter((_, idx) => idx !== i) }))} className="p-2 bg-white text-red-500 rounded-xl hover:bg-red-50 transition-all shadow-sm"><FaTrash size={11}/></button>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {form.animations.length < 6 && (
                                                <div className="relative group">
                                                    <select
                                                        className="w-full p-3.5 appearance-none bg-gray-50 border-2 border-dashed border-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 outline-none cursor-pointer group-hover:bg-white group-hover:border-red-100 transition-all"
                                                        value=""
                                                        onChange={(e) => {
                                                            const catId = e.target.value;
                                                            if (!catId) return;
                                                            const input = document.createElement('input');
                                                            input.type = 'file';
                                                            input.accept = 'video/*';
                                                            input.onchange = (ev) => handleFileSelect(ev, 'extra', catId);
                                                            input.click();
                                                        }}
                                                    >
                                                        <option value="">+ Add Interaction</option>
                                                        {categories.map(c => (
                                                            <option key={c._id} value={c._id} disabled={form.animations.some(a => a.categoryId === c._id)}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                    <FaChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-hover:text-red-400 transition-all" size={10}/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-8 py-3 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                                    style={{ backgroundColor: '#cc494c' }}
                                >
                                    {actionLoading ? <FaSpinner className="animate-spin text-base mx-auto" /> : 'Save'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-8 py-3 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all"
                                >
                                    Discard
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Video Preview */}
            {viewVideo && (
                <div className="fixed inset-0 bg-black/95 z-[300] flex items-center justify-center p-8 overflow-hidden animate-in fade-in duration-300" onClick={() => setViewVideo(null)}>
                    <div className="relative w-full max-w-7xl aspect-video rounded-[60px] overflow-hidden shadow-2xl bg-black" onClick={e => e.stopPropagation()}>
                        <video src={viewVideo} controls autoPlay className="w-full h-full object-contain" />
                        <button onClick={() => setViewVideo(null)} className="absolute top-10 right-10 p-5 bg-white/10 backdrop-blur-2xl text-white rounded-full hover:bg-white/20 transition-all"><FaTimes/></button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GodsManagement;