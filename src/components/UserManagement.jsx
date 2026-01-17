import React, { useState, useEffect } from 'react'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10) // Show 10 users per page

  // Mock data with 10 users
  useEffect(() => {
    const mockUsers = [
      { id: 1, name: 'John Doe', email: 'john@example.com', joinDate: '2024-01-15' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', joinDate: '2024-01-10' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', joinDate: '2024-01-05' },
      { id: 4, name: 'Alice Brown', email: 'alice@example.com', joinDate: '2024-01-01' },
      { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', joinDate: '2023-12-28' },
      { id: 6, name: 'David Lee', email: 'david@example.com', joinDate: '2023-12-25' },
      { id: 7, name: 'Emma Davis', email: 'emma@example.com', joinDate: '2023-12-20' },
      { id: 8, name: 'Frank Miller', email: 'frank@example.com', joinDate: '2023-12-15' },
      { id: 9, name: 'Grace Taylor', email: 'grace@example.com', joinDate: '2023-12-10' },
      { id: 10, name: 'Henry Clark', email: 'henry@example.com', joinDate: '2023-12-05' },
      { id: 11, name: 'Ivy Martinez', email: 'ivy@example.com', joinDate: '2023-11-30' },
      { id: 12, name: 'Jack Anderson', email: 'jack@example.com', joinDate: '2023-11-25' },
      { id: 13, name: 'Kathy White', email: 'kathy@example.com', joinDate: '2023-11-20' },
      { id: 14, name: 'Leo Harris', email: 'leo@example.com', joinDate: '2023-11-15' },
      { id: 15, name: 'Mona Lewis', email: 'mona@example.com', joinDate: '2023-11-10' },
    ]
    setUsers(mockUsers)
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6" style={{ color: '#cc494c' }}>
        User Management
      </h2>
      
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
          style={{ borderColor: '#e7ada1' }}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ backgroundColor: '#fef2f2' }}>
              <th className="py-3 px-4 text-left">ID</th>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Join Date</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{user.id}</td>
                <td className="py-3 px-4 font-semibold">{user.name}</td>
                <td className="py-3 px-4">{user.email}</td>
                <td className="py-3 px-4">{user.joinDate}</td>
              </tr>
            ))}
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
                className={`px-3 py-1 rounded-md ${
                  currentPage === number
                    ? 'bg-red-100 text-red-600 font-semibold'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
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