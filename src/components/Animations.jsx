import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaSpinner, FaThLarge, FaUpload, FaImage } from 'react-icons/fa';
import animationCategoryAPI from '../apis/animationCategory.api';
import godAPI from '../apis/god.api';

const AnimationManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [form, setForm] = useState({ name: '', icon: '', isActive: true });
    const [iconPreview, setIconPreview] = useState(null);
    const [iconFile, setIconFile] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        const res = await animationCategoryAPI.getAllCategories();
        if (res.success) setCategories(res.data?.categories || res.data || []);
        setLoading(false);
    };

    const handleOpenModal = (cat = null) => {
        if (cat) {
            setEditingCategory(cat._id);
            setForm({ name: cat.name, icon: cat.icon, isActive: cat.isActive });
            setIconPreview(cat.icon);
        } else {
            setEditingCategory(null);
            setForm({ name: '', icon: '', isActive: true });
            setIconPreview(null);
        }
        setIconFile(null);
        setError('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);

        let finalIcon = form.icon;
        
        // If there's a new icon file, upload to Cloudinary first
        if (iconFile) {
            const uploadRes = await godAPI.uploadToCloudinary(iconFile);
            if (uploadRes.success) {
                finalIcon = uploadRes.data.url;
            } else {
                setError("Failed to upload icon: " + uploadRes.message);
                setActionLoading(false);
                return;
            }
        }

        if (!finalIcon) {
            setError("Please select an icon image");
            setActionLoading(false);
            return;
        }

        const dataToSave = { ...form, icon: finalIcon };
        const res = editingCategory 
            ? await animationCategoryAPI.updateCategory(editingCategory, dataToSave)
            : await animationCategoryAPI.createCategory(dataToSave);
        
        if (res.success) {
            fetchCategories();
            setIsModalOpen(false);
            setSuccess(editingCategory ? 'Category updated!' : 'Category created successfully!');
            setTimeout(() => setSuccess(''), 4000);
        } else {
            setError(res.message || 'Failed to save. Try a different name.');
        }
        setActionLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this category?")) return;
        const res = await animationCategoryAPI.deleteCategory(id);
        if (res.success) fetchCategories();
    };

    if (loading) return <div className="p-10 text-center"><FaSpinner className="animate-spin text-3xl mx-auto" /></div>;

    return (
        <div className="p-8 space-y-8 bg-gray-50/30 min-h-screen">

            {/* Toast Notifications */}
            {(error || success) && (
                <div className="fixed top-6 right-8 z-[200] flex flex-col gap-3 max-w-sm w-full">
                    {error && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl shadow-2xl flex items-center justify-between text-red-700 animate-in slide-in-from-right">
                            <div className="flex items-center gap-3">
                                <FaTimes className="text-xl flex-shrink-0" />
                                <p className="text-sm font-semibold">{error}</p>
                            </div>
                            <button onClick={() => setError('')} className="ml-4 flex-shrink-0"><FaTimes size={12}/></button>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-2xl shadow-2xl flex items-center justify-between text-green-700 animate-in slide-in-from-right">
                            <p className="text-sm font-semibold">✓ {success}</p>
                            <button onClick={() => setSuccess('')} className="ml-4"><FaTimes size={12}/></button>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight italic">Animation Workshop</h1>
                    <p className="text-gray-500 font-medium">Manage animation names, icons, and active status.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="px-8 py-4 bg-gray-900 text-white rounded-3xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-xl"
                >
                    <FaPlus /> Define New Type
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categories.map(cat => (
                    <div key={cat._id} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cat.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {cat.isActive ? 'Active' : 'Inactive'}
                        </div>
                        
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-inner mb-6 bg-gray-50 overflow-hidden">
                            {cat.icon ? <img src={cat.icon} alt={cat.name} className="w-full h-full object-cover" /> : <FaImage className="text-gray-300" />}
                        </div>
                        
                        <h3 className="text-sm text-wrap font-black text-gray-900 mb-2 truncate">{cat.name}</h3>
                        
                        <div className="flex gap-2 mt-6">
                            <button onClick={() => handleOpenModal(cat)} className="p-3 bg-gray-50 text-blue-600 rounded-2xl hover:bg-blue-50 transition-all"><FaEdit /></button>
                            <button onClick={() => handleDelete(cat._id)} className="p-3 bg-gray-50 text-red-600 rounded-2xl hover:bg-red-50 transition-all"><FaTrash /></button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg p-10 relative">
                        <h2 className="text-3xl font-black text-gray-900 mb-8 italic">{editingCategory ? 'Edit Type' : 'Add New Type'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] ml-1">Type Name</label>
                                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-none outline-none font-bold mt-1" placeholder="e.g. Pouring Water"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] ml-1">Icon (Image)</label>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                                            {iconPreview ? <img src={iconPreview} className="w-full h-full object-cover" /> : <FaUpload className="text-gray-300" />}
                                        </div>
                                        <label className="flex-1">
                                            <div className="px-4 py-3 bg-gray-100 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 cursor-pointer text-center transition-all">
                                                {iconFile ? iconFile.name : 'Select Image'}
                                            </div>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*" 
                                                onChange={e => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setIconFile(file);
                                                        setIconPreview(URL.createObjectURL(file));
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] ml-1">Status</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setForm({...form, isActive: !form.isActive})}
                                        className={`mt-1 h-[56px] rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${form.isActive ? 'bg-green-50 text-green-600 border-2 border-green-200' : 'bg-red-50 text-red-600 border-2 border-red-200'}`}
                                    >
                                        {form.isActive ? '● Active' : '○ Inactive'}
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button type="submit" disabled={actionLoading} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl">
                                    {actionLoading ? <FaSpinner className="animate-spin mx-auto" /> : 'Save Configuration'}
                                </button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnimationManagement;