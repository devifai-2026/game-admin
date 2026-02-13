import React, { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { 
  FaImage,  
  FaFilm,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
  FaHome,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaPrayingHands
} from 'react-icons/fa'
import { MdSpaceDashboard } from 'react-icons/md'
import authAPI from '../apis/auth.api'

const Sidebar = ({ isCollapsed = false, onToggle, onLogout }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const location = useLocation()
  const navigate = useNavigate() // Add useNavigate

  const navItems = [
    { 
      path: '/dashboard/splash', 
      label: 'Splash Screen', 
      icon: <FaImage className="text-lg" />,
      shortLabel: 'Splash'
    },
    { 
      path: '/dashboard/gods', 
      label: 'Gods', 
      icon: <MdSpaceDashboard className="text-lg" />,
      shortLabel: 'Gods'
    },
    { 
      path: '/dashboard/god-idol', 
      label: 'God Idol', 
      icon: <FaPrayingHands className="text-lg" />,
      shortLabel: 'Idol'
    },
    { 
      path: '/dashboard/animations', 
      label: 'Animations', 
      icon: <FaFilm className="text-lg" />,
      shortLabel: 'Animate'
    },
    { 
      path: '/dashboard/users', 
      label: 'User Management', 
      icon: <FaUsers className="text-lg" />,
      shortLabel: 'Users'
    },
  ]

// handleLogout function in Sidebar with this:

const handleLogout = async () => {
  setIsLoggingOut(true)
  
  try {
    // Call API logout
    await authAPI.logoutAdmin()
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Always call onLogout callback - this handles everything
    // (clears storage, updates App state, navigates)
    if (onLogout && typeof onLogout === 'function') {
      onLogout()
    }
    setIsLoggingOut(false)
  }
}

  // Handle sidebar toggle
  const handleToggle = () => {
    if (onToggle) {
      onToggle()
    }
  }

  // Handle mobile menu toggle
  const handleMobileToggle = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false)
  }, [location])

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !isCollapsed) {
        if (onToggle) onToggle()
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [isCollapsed, onToggle])

  const SidebarContent = ({ mobile = false }) => (
    <>
      {/* Sidebar Header with Toggle */}
      <div className={`flex items-center ${isCollapsed && !mobile ? 'justify-center' : 'justify-between'} p-4 border-b`}>
        {!isCollapsed || mobile ? (
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                 style={{ backgroundColor: '#cc494c' }}>
              <FaHome className="text-white text-sm" />
            </div>
            <h2 className="text-lg font-bold" style={{ color: '#cc494c' }}>
              Dashboard
            </h2>
          </div>
        ) : null}
        
        {!mobile && (
          <button
            onClick={handleToggle}
            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            style={{ color: '#fea947' }}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            disabled={isLoggingOut}
          >
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        )}
        
        {mobile && (
          <button
            onClick={handleMobileToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: '#fea947' }}
            aria-label="Close menu"
            disabled={isLoggingOut}
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="p-2 flex-1">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed && !mobile ? 'justify-center px-2' : 'px-3'} py-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'text-white font-semibold' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? '#cc494c' : 'transparent',
                })}
                title={isCollapsed && !mobile ? item.label : ''}
              >
                <span style={{ color: ({ isActive }) => isActive ? 'white' : '#cc494c' }}>
                  {item.icon}
                </span>
                {(!isCollapsed || mobile) && (
                  <span className="ml-3 flex-1 text-sm">{item.label}</span>
                )}
                {({ isActive }) => isActive && (!isCollapsed || mobile) && (
                  <div className="w-2 h-2 rounded-full bg-white ml-auto"></div>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* Logout Button at the Bottom - EXACT SAME STYLING AS HEADER */}
      <div className="p-4 border-t bg-white">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg font-semibold text-sm transition duration-300 hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed group"
          style={{ 
            backgroundColor: '#cc494c',
            color: 'white'
          }}
          title="Logout"
        >
          {isLoggingOut ? (
            <>
              <span>Logging out...</span>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </>
          ) : (
            <>
              <span>Logout</span>
              <FaSignOutAlt className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Toggle Button (only visible on mobile) */}
      <button
        onClick={handleMobileToggle}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-white shadow-lg"
        style={{ color: '#cc494c' }}
        aria-label="Open menu"
        disabled={isLoggingOut}
      >
        <FaBars />
      </button>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:block h-screen bg-white shadow-lg fixed left-0 top-0 pt-20 z-30 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="h-full flex flex-col">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-40 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64 pt-20`}>
        <div className="h-full flex flex-col">
          <SidebarContent mobile={true} />
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={() => !isLoggingOut && handleMobileToggle()}
        ></div>
      )}
    </>
  )
}

export default Sidebar