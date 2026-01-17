import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    setIsAuthenticated(!!token)
  }, [])

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#cc494c' }}></div>
    </div>
  }

  return isAuthenticated ? children : <Navigate to="/login" />
}

export default ProtectedRoute