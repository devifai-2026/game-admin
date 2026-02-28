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
        <div className="p-8 space-y-8 bg-gray-50/30 min-h-screen">
            {/* Messages */}
            {(error || success) && (
                <div className="fixed top-24 right-8 z-[200] flex flex-col gap-3">
                    {error && <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right-4"><FaExclamationTriangle /> {error}</div>}
                    {success && <div className="bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right-4"><FaCheck /> {success}</div>}
                </div>
            )}

            {/* Header */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">Gods Management</h1>
                    <p className="text-gray-500 font-medium">Configure divine avatars and their sacred interactions.</p>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                         <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                         <input 
                            type="text" 
                            placeholder="Search Deities..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl border-none outline-none font-bold text-sm focus:bg-white transition-all ring-2 ring-transparent focus:ring-blue-100"
                         />
                    </div>
                    <button 
                        onClick={openAddModal}
                        className="px-8 py-4 bg-gray-900 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-3"
                    >
                        <FaPlus /> Add New God
                    </button>
                </div>
            </div>

            {/* List View */}
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest pl-10 underline decoration-blue-500/30">Icon</th>
                            <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Divine Name</th>
                            <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Manifested At</th>
                            <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</th>
                            <th className="p-6 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right pr-10">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredGods.map(god => (
                            <tr key={god._id} className="group hover:bg-gray-50/50 transition-all">
                                <td className="p-6 pl-10">
                                    <div className="w-16 h-16 rounded-3xl overflow-hidden bg-gray-100 border-2 border-white shadow-md group-hover:scale-110 transition-transform">
                                        <img src={god.image} alt="" className="w-full h-full object-cover" />
                                    </div>
                                </td>
                                <td className="p-6">
                                    <p className="font-black text-gray-900 italic text-lg">{god.name}</p>
                                    <p className="text-xs text-gray-400 font-medium truncate max-w-[200px]">{god.description || 'No sacred description provided.'}</p>
                                </td>
                                <td className="p-6 text-sm font-bold text-gray-400 italic">
                                    {new Date(god.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-block ${god.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {god.isActive ? 'Published' : 'Unpublished'}
                                    </span>
                                </td>
                                <td className="p-6 text-right pr-10 relative">
                                    <button 
                                        onClick={() => setActiveActionMenu(activeActionMenu === god._id ? null : god._id)}
                                        className="p-4 hover:bg-white hover:shadow-lg rounded-2xl transition-all"
                                    >
                                        <FaEllipsisV className="text-gray-400" />
                                    </button>
                                    
                                    {activeActionMenu === god._id && (
                                        <div className="absolute right-10 top-[70%] bg-white rounded-3xl shadow-2xl border border-gray-100 py-3 w-48 z-10 animate-in zoom-in-95">
                                            <button onClick={() => openEditModal(god)} className="w-full px-6 py-3 text-left flex items-center gap-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
                                                <FaEdit className="text-blue-500" /> Edit Specs
                                            </button>
                                            <button onClick={() => handleToggleStatus(god._id, god.isActive)} className="w-full px-6 py-3 text-left flex items-center gap-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
                                                <div className={`w-10 h-5 rounded-full relative transition-all ${god.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-all ${god.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </div>
                                                Publish
                                            </button>
                                            <div className="my-2 border-t border-gray-50" />
                                            <button onClick={() => handleDeleteGod(god._id)} className="w-full px-6 py-3 text-left flex items-center gap-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-all">
                                                <FaTrash /> Delete
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredGods.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <FaSearch size={40} className="text-gray-200" />
                        <p className="text-gray-400 font-bold italic">No divine avatars found matching your query.</p>
                    </div>
                )}

                {/* Pagination UI */}
                {pagination.pages > 1 && (
                    <div className="p-8 border-t border-gray-50 flex justify-between items-center bg-gray-50/10">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            Showing <span className="text-gray-900">{gods.length}</span> of <span className="text-gray-900">{pagination.total}</span> Divine Avatars
                        </p>
                        <div className="flex gap-3">
                            <button 
                                disabled={pagination.page === 1 || loading}
                                onClick={() => fetchInitialData(pagination.page - 1)}
                                className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:shadow-lg transition-all disabled:opacity-30 disabled:hover:shadow-none"
                            >
                                <FaArrowLeft size={14} />
                            </button>
                            
                            {[...Array(pagination.pages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => fetchInitialData(i + 1)}
                                    className={`w-12 h-12 rounded-2xl font-black text-sm transition-all ${
                                        pagination.page === i + 1 
                                        ? 'bg-gray-900 text-white shadow-xl scale-110' 
                                        : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-900 hover:text-gray-900'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button 
                                disabled={pagination.page === pagination.pages || loading}
                                onClick={() => fetchInitialData(pagination.page + 1)}
                                className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:shadow-lg transition-all disabled:opacity-30 disabled:hover:shadow-none"
                            >
                                <FaArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Creation/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[201] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[60px] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-500">
                        <div className="sticky top-0 bg-white/80 backdrop-blur-xl px-12 py-8 border-b border-gray-50 flex justify-between items-center z-10">
                            <h2 className="text-3xl font-black text-gray-900 italic uppercase tracking-tight">{editingGodId ? 'Edit Configuration' : 'Manifest New Avatar'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-5 hover:bg-gray-100 rounded-3xl transition-all"><FaTimes/></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-12 space-y-16">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                                {/* Details & Icon */}
                                <div className="space-y-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] ml-1">Avatar Identity *</label>
                                        <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-6 rounded-[32px] bg-gray-50/50 border-none outline-none font-black italic text-xl focus:bg-white ring-2 ring-transparent focus:ring-blue-100 transition-all" placeholder="Enter Name..."/>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] ml-1">Spiritual Essence</label>
                                        <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-6 rounded-[32px] bg-gray-50/50 border-none outline-none font-bold min-h-[160px] focus:bg-white ring-2 ring-transparent focus:ring-blue-100 transition-all" placeholder="Describe the divinity..."/>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] ml-1">Avatar Icon *</label>
                                        <div className="relative group aspect-square rounded-[64px] border-4 border-dashed border-gray-100 hover:border-blue-100 bg-gray-50/50 flex items-center justify-center overflow-hidden transition-all">
                                            {form.image ? (
                                                <>
                                                    <img src={form.image.preview} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                        <label className="bg-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl cursor-pointer hover:scale-105 transition-all">Update Symbol</label>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-4 text-gray-300">
                                                    <FaImage size={48} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Select Iconic Symbol</span>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileSelect(e, 'icon')} />
                                        </div>
                                    </div>
                                </div>

                                {/* Videos */}
                                <div className="space-y-12">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 text-orange-500">
                                            <FaVideo /> <h3 className="text-xl font-black italic uppercase">Idle Presence *</h3>
                                        </div>
                                        <div className="aspect-video rounded-[40px] bg-black overflow-hidden relative group border-4 border-white shadow-2xl">
                                            {form.idleVideo ? (
                                                <>
                                                    <video src={form.idleVideo.preview} autoPlay loop muted className="w-full h-full object-cover opacity-80" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all">
                                                        <button type="button" onClick={() => setViewVideo(form.idleVideo.preview)} className="p-5 bg-white/20 backdrop-blur-xl rounded-full text-white hover:bg-white/40"><FaPlay/></button>
                                                        <label className="bg-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:scale-105">Replace</label>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-gray-50/50 gap-4">
                                                    <FaFilm size={40} className="text-gray-200" />
                                                    <label className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-xl">Choose Idle Video</label>
                                                </div>
                                            )}
                                            <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileSelect(e, 'idle')} />
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="flex justify-between items-center text-purple-600">
                                            <div className="flex items-center gap-3"><FaMagic /> <h3 className="text-xl font-black italic uppercase">Interactions (Up to 6)</h3></div>
                                            <span className="text-[10px] font-black bg-purple-50 px-4 py-1.5 rounded-full">{form.animations.length} / 6 Loaded</span>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {form.animations.map((anim, i) => {
                                                const cat = categories.find(c => c._id === anim.categoryId);
                                                return (
                                                    <div key={i} className="flex items-center gap-5 bg-gray-50/50 p-6 rounded-[32px] group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-purple-100">
                                                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm overflow-hidden">
                                                            {cat?.icon ? <img src={cat.icon} className="w-full h-full object-cover" alt={cat?.name} /> : <FaVideo className="text-gray-300 text-xl" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-black text-gray-900 italic">{cat?.name || 'Unknown Type'}</p>
                                                            <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">Asset Ready</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button type="button" onClick={() => setViewVideo(anim.preview)} className="p-4 bg-white text-blue-500 rounded-2xl hover:bg-blue-50 transition-all shadow-sm"><FaEye/></button>
                                                            <button type="button" onClick={() => setForm(prev => ({ ...prev, animations: prev.animations.filter((_, idx) => idx !== i) }))} className="p-4 bg-white text-red-500 rounded-2xl hover:bg-red-50 transition-all shadow-sm"><FaTrash/></button>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {form.animations.length < 6 && (
                                                <div className="relative group">
                                                    <select 
                                                        className="w-full p-6 appearance-none bg-gray-50 border-2 border-dashed border-gray-100 rounded-[32px] font-black text-[10px] uppercase tracking-widest text-gray-400 outline-none cursor-pointer group-hover:bg-white group-hover:border-purple-200 transition-all"
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
                                                        <option value="">+ Register Spiritual Interaction</option>
                                                        {categories.map(c => (
                                                            <option key={c._id} value={c._id} disabled={form.animations.some(a => a.categoryId === c._id)}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                    <FaChevronRight className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-hover:text-purple-500 transition-all" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-5 pt-10 sticky bottom-0 bg-white/20 backdrop-blur-md py-6 rounded-b-[40px]">
                                <button 
                                    type="submit" 
                                    disabled={actionLoading}
                                    className="flex-1 py-7 bg-gray-900 text-white rounded-[40px] font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-2xl shadow-blue-100 disabled:opacity-50"
                                >
                                    {actionLoading ? <FaSpinner className="animate-spin text-lg mx-auto" /> : 'Confirm Sacred Records'}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="px-14 py-7 bg-gray-100 text-gray-400 rounded-[40px] font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
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