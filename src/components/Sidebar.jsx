import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  FaImage,  
  FaFilm,
  FaUsers,
  FaChevronLeft,
  FaChevronRight,
  FaHome,
  FaBars,
  FaTimes,
  FaSignOutAlt
} from 'react-icons/fa'
import { MdSpaceDashboard } from 'react-icons/md'

const Sidebar = ({ isCollapsed = false, onToggle }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()

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
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="p-2">
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
      >
        <FaBars />
      </button>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:block h-screen bg-white shadow-lg fixed left-0 top-0 pt-20 z-30 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-40 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64 pt-20`}>
        <SidebarContent mobile={true} />
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={handleMobileToggle}
        ></div>
      )}
    </>
  )
}

export default Sidebar