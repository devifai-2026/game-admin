import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is logged in from localStorage
    const token = localStorage.getItem('authToken')
    if (token) {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = (token, user) => {
    localStorage.setItem('authToken', token)
    localStorage.setItem('user', JSON.stringify(user))
    setIsAuthenticated(true)
    navigate('/dashboard')
  }

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    navigate('/login')
  }

  const handleNavigateToForgotPassword = () => {
    navigate('/forgot-password')
  }

  const handleNavigateToLogin = () => {
    navigate('/login')
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? 
          <Navigate to="/dashboard" replace /> : 
          <Login 
            onLogin={handleLogin}
            onNavigateToForgotPassword={handleNavigateToForgotPassword}
          />
        } 
      />
      <Route 
        path="/forgot-password" 
        element={
          isAuthenticated ? 
          <Navigate to="/dashboard" replace /> : 
          <ForgotPassword 
            onNavigateToLogin={handleNavigateToLogin}
          />
        } 
      />
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute>
            <Dashboard onLogout={handleLogout} />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  )
}

export default App