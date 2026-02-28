import React, { useState, useEffect } from 'react'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10) // Show 10 users per page

  useEffect(() => {
    // Fetched users will go here
    setUsers([])
  }, [])

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate pagination
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Go to previous page
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Go to next page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPageButtons = 5
    
    if (totalPages <= maxPageButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      let startPage = Math.max(1, currentPage - 2)
      let endPage = Math.min(totalPages, currentPage + 2)
      
      if (currentPage <= 3) {
        endPage = maxPageButtons
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - maxPageButtons + 1
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }
    }
    
    return pageNumbers
  }

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
      <h2 className="text-2xl sm:text-3xl font-black mb-6 tracking-tight" style={{ color: '#cc494c' }}>
        User Management
      </h2>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all font-medium text-sm"
          style={{ borderColor: '#e7ada1', focusBorderColor: '#cc494c' }}
          onFocus={e => e.target.style.borderColor = '#cc494c'}
          onBlur={e => e.target.style.borderColor = '#e7ada1'}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ backgroundColor: '#fff5f5' }}>
              <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: '#cc494c' }}>ID</th>
              <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: '#cc494c' }}>Name</th>
              <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: '#cc494c' }}>Email</th>
              <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: '#cc494c' }}>Join Date</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length > 0 ? (
              currentUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{user.id}</td>
                  <td className="py-3 px-4 font-semibold">{user.name}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.joinDate}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-10 text-center text-gray-500 font-medium">
                  no user available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {filteredUsers.length > usersPerPage && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-4 sm:mb-0 text-gray-600">
            Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Previous button */}
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Previous
            </button>
            
            {/* Page number buttons */}
            {getPageNumbers().map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
              className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${
                currentPage === number
                  ? 'text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
              style={currentPage === number ? { backgroundColor: '#cc494c' } : {}}
              >
                {number}
              </button>
            ))}
            
            {/* Ellipsis for many pages */}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="px-2 text-gray-500">...</span>
            )}
            
            {/* Show last page if needed */}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <button
                onClick={() => paginate(totalPages)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === totalPages
                    ? 'bg-red-100 text-red-600 font-semibold'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {totalPages}
              </button>
            )}
            
            {/* Next button */}
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {filteredUsers.length <= usersPerPage && (
        <div className="mt-6 text-center text-gray-600">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      )}
    </div>
  )
}

export default UserManagement