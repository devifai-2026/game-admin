import React, { useState, useEffect, useRef } from 'react';
import { 
  FaLock, 
  FaEnvelope, 
  FaEye, 
  FaEyeSlash, 
  FaExclamationCircle,
  FaArrowRight,
  FaSpinner
} from 'react-icons/fa';
import { RiShieldKeyholeLine } from 'react-icons/ri';
import authAPI from '../apis/auth.api';

const Login = ({ onLogin, onNavigateToForgotPassword }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const formRef = useRef(null);

  // Check for saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setCredentials(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const result = await authAPI.loginAdmin(credentials.email, credentials.password);
      
      console.log('Login result:', result); // Add this for debugging
      
      if (result.success) {
        const { data } = result;
        
        console.log('Login data:', data); // Add this for debugging
        
        // Store auth data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          _id: data._id || data.id,
          name: data.name || data.username || 'Admin',
          email: data.email,
          lastLogin: data.lastLogin || new Date().toISOString(),
          role: data.role || 'admin'
        }));
        
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', credentials.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        // Call parent login handler
        onLogin(data.token, {
          _id: data._id || data.id,
          name: data.name || data.username || 'Admin',
          email: data.email,
          lastLogin: data.lastLogin || new Date().toISOString(),
          role: data.role || 'admin'
        });
      } else {
        setError(result.message || 'Login failed');
        triggerErrorAnimation();
      }
    } catch (err) {
      console.error('Login error:', err); // Add this for debugging
      setError(err.message || 'An error occurred during login');
      triggerErrorAnimation();
    } finally {
      setLoading(false);
    }
  };

  const triggerErrorAnimation = () => {
    if (formRef.current) {
      formRef.current.classList.add('animate-shake');
      setTimeout(() => {
        formRef.current?.classList.remove('animate-shake');
      }, 500);
    }
  };

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleDemoLogin = () => {
    setCredentials({
      email: 'bikrambiswas912@gmail.com',
      password: 'Ved@1234'
    });
    // Focus on password field
    const passwordInput = document.querySelector('input[type="password"]');
    if (passwordInput) passwordInput.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-orange-50 to-red-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-pink-200 to-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-orange-200 to-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-red-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md" ref={formRef}>
        {/* Wrap everything in a form element */}
        <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 transform transition-all duration-300 hover:shadow-3xl">
          {/* Logo/Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 bg-gradient-to-br from-red-500 to-orange-500 shadow-lg transform transition-transform hover:scale-105">
              <RiShieldKeyholeLine className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent mb-2">
              Admin Portal
            </h1>
            <p className="text-gray-600 mt-2">Sign in to access your dashboard</p>
          </div>

          <div className="space-y-6">
            {/* Email Input */}
            <div className="space-y-3">
              <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700">
                <FaEnvelope className="w-4 h-4 mr-2 text-red-500" />
                Email Address
              </label>
              <div className="relative group">
                <input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  onKeyPress={handleKeyPress}
                  className={`w-full px-5 py-3.5 pl-12 bg-gray-50/70 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                    focusedField === 'email' 
                      ? 'border-red-500 ring-4 ring-red-500/10' 
                      : 'border-gray-200'
                  } group-hover:border-red-300`}
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
                <FaEnvelope className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                  focusedField === 'email' ? 'text-red-500' : 'text-gray-400'
                }`} />
                {credentials.email && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-3">
              <label htmlFor="password" className="flex items-center text-sm font-medium text-gray-700">
                <FaLock className="w-4 h-4 mr-2 text-red-500" />
                Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  onKeyPress={handleKeyPress}
                  className={`w-full px-5 py-3.5 pl-12 pr-12 bg-gray-50/70 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                    focusedField === 'password' 
                      ? 'border-red-500 ring-4 ring-red-500/10' 
                      : 'border-gray-200'
                  } group-hover:border-red-300`}
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <FaLock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                  focusedField === 'password' ? 'text-red-500' : 'text-gray-400'
                }`} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-300"
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEye className="w-5 h-5" /> : <FaEyeSlash className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-end">
             
              
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                <span>Forgot password?</span>
                <FaArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-fadeIn">
                <FaExclamationCircle className="w-5 h-5 text-red-500 flex-shrink-0 animate-pulse" />
                <span className="text-sm text-red-600 flex-1">{error}</span>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-600 transition-colors"
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            )}

            {/* Submit Button - Change to type="submit" */}
            <button
              type="submit"
              disabled={loading || !credentials.email || !credentials.password}
              className="w-full py-4 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 hover:from-red-700 hover:via-orange-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center">
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin w-5 h-5 mr-3" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <FaArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
            </button>

            {/* Demo Credentials */}
            <div className="mt-8 p-5 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">Access Credentials</p>
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-2 text-center">
                <div className="py-1.5 px-3 bg-white rounded-lg border border-gray-50 transition-all hover:border-red-100 hover:shadow-sm group">
                  <p className="text-xs text-gray-500 mb-0.5">Email</p>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-red-600 transition-colors">bikrambiswas912@gmail.com</p>
                </div>
                <div className="py-1.5 px-3 bg-white rounded-lg border border-gray-50 transition-all hover:border-red-100 hover:shadow-sm group">
                  <p className="text-xs text-gray-500 mb-0.5">Password</p>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-red-600 transition-colors">Ved@1234</p>
                </div>
              </div>
            </div>
            </div>
        </form>
      </div>

      {/* Add Tailwind CSS animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default Login;