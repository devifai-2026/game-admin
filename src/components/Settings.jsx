import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaClock, FaLock, FaSave, FaEye, FaEyeSlash } from 'react-icons/fa';
import authAPI from '../apis/auth.api';

const Settings = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getAdminProfile();
      if (response.success) {
        setProfile(response.data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load profile' });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'An error occurred while loading profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await authAPI.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (response.success) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'An error occurred while changing password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#cc494c' }}></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-black mb-6 border-b pb-4 tracking-tight" style={{ color: '#cc494c' }}>Account Settings</h2>

      {message.text && (
        <div className={`p-4 mb-6 rounded-lg ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div>
          <h3 className="text-base font-black mb-4 flex items-center uppercase tracking-wide" style={{ color: '#cc494c' }}>
            <FaUser className="mr-2" /> Profile Information
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-100 space-y-4">
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4" style={{ backgroundColor: '#cc494c', color: 'white' }}>
                 {profile?.name ? profile.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide font-medium">Name</label>
                <div className="text-gray-900 font-medium">{profile?.name || 'Admin User'}</div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="mr-4 mt-1 text-gray-400">
                <FaEnvelope />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide font-medium">Email Address</label>
                <div className="text-gray-900">{profile?.email}</div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="mr-4 mt-1 text-gray-400">
                <FaClock />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide font-medium">Last Login</label>
                <div className="text-gray-900">{formatDate(profile?.lastLogin)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div>
          <h3 className="text-base font-black mb-4 flex items-center uppercase tracking-wide" style={{ color: '#cc494c' }}>
            <FaLock className="mr-2" /> Change Password
          </h3>
          
          <form onSubmit={handlePasswordChange} className="bg-gray-50 rounded-lg p-6 border border-gray-100 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showPassword.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all pr-10"
                  style={{ '--tw-ring-color': '#cc494c', borderColor: '#e5e7eb' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all pr-10"
                  style={{ '--tw-ring-color': '#cc494c', borderColor: '#e5e7eb' }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all pr-10"
                  style={{ '--tw-ring-color': '#cc494c', borderColor: '#e5e7eb' }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'}`}
              style={{ backgroundColor: '#cc494c', '--tw-ring-color': '#cc494c' }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" /> Change Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
