import React, { useState, useRef } from 'react';
import { 
  FaLock, 
  FaEnvelope, 
  FaArrowRight,
  FaExclamationCircle,
  FaCheckCircle,
  FaArrowLeft,
  FaEyeSlash,
  FaEye
} from 'react-icons/fa';
import authAPI from '../apis/auth.api'; // Import the auth API

const ForgotPassword = ({ onNavigateToLogin }) => {
  const [step, setStep] = useState('email'); // email, otp, reset-password, success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [timer, setTimer] = useState(0);
  const [resetToken, setResetToken] = useState('');
  const formRef = useRef(null);

  // Handle email submission
  const handleEmailSubmit = async () => {
    setError('');
    setSuccessMessage('');
    
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      const result = await authAPI.forgotPassword(email);
      
      if (result.success) {
        setSuccessMessage('Verification code sent to your email');
        setTimer(60); // Start 60-second timer for resend
        setStep('otp');
      } else {
        setError(result.message || 'Failed to send verification code');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    
    // Auto focus next input
    if (value && index < 5) {
      document.querySelector(`input[data-otp-index="${index + 1}"]`)?.focus();
    }
    
    setError('');
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.querySelector(`input[data-otp-index="${index - 1}"]`)?.focus();
    }
  };

  // Verify OTP
  const handleOtpSubmit = async () => {
    const enteredOtp = otp.join('');
    
    if (enteredOtp.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    
    try {
      const result = await authAPI.verifyOtp(email, enteredOtp);
      
      if (result.success) {
        setResetToken(result.data.resetToken || result.data.token);
        setError('');
        setSuccessMessage('OTP verified successfully');
        setStep('reset-password');
      } else {
        setError(result.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    setError('');
    setSuccessMessage('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      const result = await authAPI.resetPassword(resetToken, newPassword);
      
      if (result.success) {
        setSuccessMessage('Password reset successful!');
        setStep('success');
      } else {
        setError(result.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    
    try {
      const result = await authAPI.forgotPassword(email);
      
      if (result.success) {
        setOtp(['', '', '', '', '', '']);
        setTimer(60);
        setSuccessMessage('New verification code sent!');
      } else {
        setError(result.message || 'Failed to resend code');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown
  React.useEffect(() => {
    if (timer > 0) {
      const interval = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(interval);
    }
  }, [timer]);

  // Reset and go back to login
  const handleBackToLogin = () => {
    setStep('email');
    setEmail('');
    setOtp(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
    setResetToken('');
    setTimer(0);
    onNavigateToLogin();
  };

  const handleKeyPress = (e, callback) => {
    if (e.key === 'Enter' && !loading) {
      callback();
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

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 transform transition-all duration-300 hover:shadow-3xl">
          {/* Header */}
          <div className="text-center mb-8 relative">
            <button
              onClick={() => onNavigateToLogin()}
              className="absolute left-0 top-0 inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              disabled={loading}
            >
              <FaArrowLeft className="w-4 h-4" />
            </button>
            
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 bg-gradient-to-br from-red-500 to-orange-500 shadow-lg transform transition-transform hover:scale-105">
              <FaLock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent mb-2">
              Reset Password
            </h1>
            <p className="text-gray-600 text-sm">Secure your account in a few steps</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
              <FaCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-green-600">{successMessage}</span>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 'email' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FaEnvelope className="w-4 h-4 mr-2 text-red-500" />
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    onKeyPress={(e) => handleKeyPress(e, handleEmailSubmit)}
                    className={`w-full px-5 py-3.5 pl-12 bg-gray-50/70 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                      focusedField === 'email' 
                        ? 'border-red-500 ring-4 ring-red-500/10' 
                        : 'border-gray-200'
                    } group-hover:border-red-300`}
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                  <FaEnvelope className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                    focusedField === 'email' ? 'text-red-500' : 'text-gray-400'
                  }`} />
                </div>
                <p className="text-xs text-gray-500 mt-2">We'll send a verification code to this email</p>
              </div>

              {error && (
                <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <FaExclamationCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              <button
                onClick={handleEmailSubmit}
                disabled={loading || !email}
                className="w-full py-4 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 hover:from-red-700 hover:via-orange-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Sending Code...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <FaArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
              </button>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <p className="text-xs text-gray-500">Enter the 6-digit code sent to {email}</p>
                
                <div className="flex gap-2 justify-center mt-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      data-otp-index={index}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-4 focus:ring-red-500/10 focus:outline-none transition-all"
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <FaExclamationCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              <button
                onClick={handleOtpSubmit}
                disabled={loading || otp.join('').length !== 6}
                className="w-full py-4 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 hover:from-red-700 hover:via-orange-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Code
                      <FaArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {timer > 0 ? (
                    <>Resend code in <span className="font-semibold text-red-600">{timer}s</span></>
                  ) : (
                    <>
                      Didn't receive the code?{' '}
                      <button
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="text-red-600 hover:text-red-700 font-semibold transition-colors"
                      >
                        Resend
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Reset Password */}
          {step === 'reset-password' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FaLock className="w-4 h-4 mr-2 text-red-500" />
                  New Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError('');
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-5 py-3.5 pl-12 pr-12 bg-gray-50/70 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                      focusedField === 'password' 
                        ? 'border-red-500 ring-4 ring-red-500/10' 
                        : 'border-gray-200'
                    } group-hover:border-red-300`}
                    placeholder="Enter new password"
                    required
                    disabled={loading}
                  />
                  <FaLock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                    focusedField === 'password' ? 'text-red-500' : 'text-gray-400'
                  }`} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-300"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="w-5 h-5" />
                    ) : (
                      <FaEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FaLock className="w-4 h-4 mr-2 text-red-500" />
                  Confirm Password
                </label>
                <div className="relative group">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                    onKeyPress={(e) => handleKeyPress(e, handlePasswordReset)}
                    className={`w-full px-5 py-3.5 pl-12 pr-12 bg-gray-50/70 border-2 rounded-xl focus:outline-none transition-all duration-300 ${
                      focusedField === 'confirm' 
                        ? 'border-red-500 ring-4 ring-red-500/10' 
                        : 'border-gray-200'
                    } group-hover:border-red-300`}
                    placeholder="Confirm password"
                    required
                    disabled={loading}
                  />
                  <FaLock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                    focusedField === 'confirm' ? 'text-red-500' : 'text-gray-400'
                  }`} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-300"
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="w-5 h-5" />
                    ) : (
                      <FaEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <FaExclamationCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              <button
                onClick={handlePasswordReset}
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full py-4 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 hover:from-red-700 hover:via-orange-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      Resetting...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <FaArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mx-auto">
                <FaCheckCircle className="w-10 h-10 text-green-500 animate-pulse" />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Reset Successful</h2>
                <p className="text-gray-600 text-sm">Your password has been changed successfully. You can now login with your new password.</p>
              </div>

              <button
                onClick={handleBackToLogin}
                className="w-full py-4 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 hover:from-red-700 hover:via-orange-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Back to Login
                  <FaArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
              </button>
            </div>
          )}
        </div>
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
      `}</style>
    </div>
  );
};

export default ForgotPassword;