import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import SplashScreen from '../components/SplashScreen'
import Gods from '../components/Gods'
import Animations from '../components/Animations'
import UserManagement from '../components/UserManagement'

const Dashboard = ({ onLogout }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // This function will be passed to Sidebar
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Pass toggle function to Header and current state to Sidebar */}
      <Header onLogout={onLogout} onSidebarToggle={toggleSidebar} />
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      
      <main className={`pt-20 transition-all duration-300 p-6 ${
        isSidebarCollapsed ? 'md:ml-20 ml-0' : 'md:ml-64 ml-0'
      }`}>
        <Routes>
          <Route path="splash" element={<SplashScreen />} />
          <Route path="gods" element={<Gods />} />
          <Route path="animations" element={<Animations />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="/" element={<Navigate to="/dashboard/splash" />} />
        </Routes>
      </main>
    </div>
  )
}

export default Dashboard