import React from 'react'
import { FaBars, FaSignOutAlt } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'

const Header = ({ onLogout, onSidebarToggle }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const navigate = useNavigate()

  const handleLogout = () => {
    // Call the parent logout function if provided
    if (onLogout && typeof onLogout === 'function') {
      onLogout()
    } else {
      // Fallback logout function
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      navigate('/login')
    }
  }

  return (
    <header className="bg-white shadow-sm px-4 md:px-6 py-4 flex justify-between items-center fixed top-0 left-0 right-0 z-40">
      <div className="flex items-center">
        <button
          onClick={onSidebarToggle}
          className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: '#cc494c' }}
          aria-label="Toggle sidebar"
        >
          <FaBars className="text-lg" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#cc494c' }}>
            Admin Dashboard
          </h1>
          <p className="text-gray-600 text-xs md:text-sm">Welcome back, {user.username || 'Admin'}!</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="hidden md:flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
               style={{ backgroundColor: '#fea947' }}>
            {user.username ? user.username.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{user.username || 'Admin User'}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold text-sm md:text-base transition duration-300 hover:opacity-90 group"
          style={{ 
            backgroundColor: '#cc494c',
            color: 'white'
          }}
          title="Logout"
        >
          <span>Logout</span>
          <FaSignOutAlt className="hidden md:inline group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </header>
  )
}

export default Header