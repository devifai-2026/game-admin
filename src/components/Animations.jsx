import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaSpinner, FaUpload, FaImage } from 'react-icons/fa';
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
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (error || success) {
            const timer = setTimeout(() => { setError(''); setSuccess(''); }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, success]);

    const fetchCategories = async () => {
        setLoading(true);
        const res = await animationCategoryAPI.getAllCategories();
        if (res.success) setCategories(res.data?.categories || res.data || []);
        setLoading(false);
    };

    const filteredCategories = categories.filter(cat =>
        cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        } else {
            setError(res.message || 'Failed to save. Try a different name.');
        }
        setActionLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this animation category?")) return;
        setActionLoading(true);
        const res = await animationCategoryAPI.deleteCategory(id);
        if (res.success) {
            fetchCategories();
            setSuccess('Category deleted successfully!');
        } else {
            setError(res.message || 'Failed to delete category.');
        }
        setActionLoading(false);
    };

    const handleToggleStatus = async (id) => {
        const res = await animationCategoryAPI.toggleCategory(id);
        if (res.success) {
            fetchCategories();
        } else {
            setError(res.message || 'Failed to toggle status.');
        }
    };

    if (loading) return (
        <div className="p-10 text-center flex flex-col items-center gap-4">
            <FaSpinner className="animate-spin text-3xl" style={{ color: '#cc494c' }} />
            <p className="text-gray-500 font-medium text-sm">Loading animation types...</p>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-gray-50/30 min-h-screen">

            {/* Toast Notifications */}
            {(error || success) && (
                <div className="fixed top-20 right-4 sm:right-8 z-[200] flex flex-col gap-3 max-w-xs sm:max-w-sm w-full">
                    {error && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl shadow-2xl flex items-center justify-between text-red-700">
                            <div className="flex items-center gap-3">
                                <FaTimes className="text-xl flex-shrink-0" />
                                <p className="text-sm font-semibold">{error}</p>
                            </div>
                            <button onClick={() => setError('')} className="ml-3 flex-shrink-0"><FaTimes size={12} /></button>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-2xl shadow-2xl flex items-center justify-between text-green-700">
                            <p className="text-sm font-semibold">✓ {success}</p>
                            <button onClick={() => setSuccess('')} className="ml-3"><FaTimes size={12} /></button>
                        </div>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="bg-white p-5 sm:p-8 rounded-[32px] sm:rounded-[40px] shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight" style={{ color: '#cc494c' }}>Animation Workshop</h1>
                    <p className="text-gray-500 font-semibold text-sm mt-1">Manage animation names, icons, and active status.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-52">
                        <FaImage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-2.5 bg-gray-50 rounded-xl border-none outline-none font-semibold text-sm focus:bg-white transition-all ring-2 ring-transparent focus:ring-red-100"
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2.5 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md text-xs"
                        style={{ backgroundColor: '#cc494c' }}
                    >
                        <FaPlus size={10} /> Add Category
                    </button>
                </div>
            </div>

            {/* Table View */}
            <div className="bg-white rounded-[32px] sm:rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[480px]">
                            <thead>
                                <tr style={{ backgroundColor: '#fff5f5' }}>
                                    <th className="px-5 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: '#cc494c' }}>Icon</th>
                                    <th className="px-5 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase tracking-widest" style={{ color: '#cc494c' }}>Name</th>
                                    <th className="px-5 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase tracking-widest hidden sm:table-cell" style={{ color: '#cc494c' }}>Status</th>
                                    <th className="px-5 sm:px-8 py-4 sm:py-5 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: '#cc494c' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-16 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <FaImage size={40} className="text-gray-200" />
                                                <p className="text-gray-400 font-semibold">
                                                    {searchTerm ? `No categories match "${searchTerm}"` : 'No animation types defined yet.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredCategories.map(cat => (
                                    <tr key={cat._id} className="group hover:bg-gray-50/50 transition-all">
                                        <td className="px-5 sm:px-8 py-4 sm:py-5">
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 border-2 border-white shadow-md group-hover:scale-110 transition-transform flex-shrink-0">
                                                {cat.icon
                                                    ? <img src={cat.icon} alt={cat.name} className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center"><FaImage className="text-gray-300" /></div>
                                                }
                                            </div>
                                        </td>
                                        <td className="px-5 sm:px-8 py-4 sm:py-5">
                                            <p className="font-semibold text-gray-700 text-sm sm:text-base">{cat.name}</p>
                                            {/* Show status inline on mobile */}
                                            <span className={`sm:hidden inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${cat.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {cat.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-5 sm:px-8 py-4 sm:py-5 hidden sm:table-cell">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(cat._id)}
                                                className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${
                                                    cat.isActive ? 'bg-green-500' : 'bg-gray-300'
                                                }`}
                                                title={cat.isActive ? 'Click to deactivate' : 'Click to activate'}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${
                                                    cat.isActive ? 'left-7' : 'left-1'
                                                }`} />
                                            </button>
                                        </td>
                                        <td className="px-5 sm:px-8 py-4 sm:py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleOpenModal(cat)} className="p-2.5 sm:p-3 bg-gray-50 rounded-xl sm:rounded-2xl hover:bg-red-50 transition-all" style={{ color: '#cc494c' }}>
                                                    <FaEdit size={12} />
                                                </button>
                                                <button onClick={() => handleDelete(cat._id)} disabled={actionLoading} className="p-2.5 sm:p-3 bg-gray-50 text-red-600 rounded-xl sm:rounded-2xl hover:bg-red-50 transition-all disabled:opacity-40">
                                                    {actionLoading ? <FaSpinner size={12} className="animate-spin" /> : <FaTrash size={12} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {categories.length > 0 && (
                        <div className="px-5 sm:px-8 py-4 border-t border-gray-50 bg-gray-50/30">
                            <p className="text-[10px] font-semibold uppercase text-gray-500 tracking-widest">
                                Total <span className="text-gray-700 font-bold">{categories.length}</span> animation types
                            </p>
                        </div>
                    )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl w-full sm:max-w-lg p-6 sm:p-10 relative max-h-[95vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6 sm:mb-8">
                            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 italic">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400"><FaTimes /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: '#cc494c' }}>Category Name</label>
                                <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-4 rounded-2xl bg-gray-50 border-none outline-none font-bold mt-1 text-sm" placeholder="e.g. Pouring Water" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: '#cc494c' }}>Icon (Image)</label>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                                            {iconPreview ? <img src={iconPreview} className="w-full h-full object-cover" /> : <FaUpload className="text-gray-300 text-sm" />}
                                        </div>
                                        <label className="flex-1">
                                            <div className="px-3 py-2.5 bg-gray-100 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 cursor-pointer text-center transition-all">
                                                {iconFile ? iconFile.name.slice(0, 12) + '...' : 'Select'}
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={e => {
                                                const file = e.target.files[0];
                                                if (file) { setIconFile(file); setIconPreview(URL.createObjectURL(file)); }
                                            }} />
                                        </label>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] ml-1" style={{ color: '#cc494c' }}>Status</label>
                                    <div className="mt-3 flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                            className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none shadow-inner ${
                                                form.isActive ? 'bg-green-500' : 'bg-gray-300'
                                            }`}
                                        >
                                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                                                form.isActive ? 'left-8' : 'left-1'
                                            }`} />
                                        </button>
                                        <span className={`text-sm font-semibold ${
                                            form.isActive ? 'text-green-600' : 'text-gray-400'
                                        }`}>{form.isActive ? 'Active' : 'Inactive'}</span>
                                    </div>
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
                            <div className="flex gap-2 pt-3">
                                <button type="submit" disabled={actionLoading} className="px-5 py-2 text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:opacity-90 transition-all shadow-sm" style={{ backgroundColor: '#cc494c' }}>
                                    {actionLoading ? <FaSpinner className="animate-spin mx-auto" /> : 'Save'}
                                </button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 bg-gray-100 text-gray-500 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnimationManagement;