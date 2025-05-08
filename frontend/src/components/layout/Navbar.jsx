import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FaChair, FaDoorOpen, FaBars, FaTimes, FaUser, FaSignOutAlt } from 'react-icons/fa'
import { useState, useEffect } from 'react'
import AuthService from '../../services/AuthService'
import { toast } from 'react-toastify'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  
  const navigate = useNavigate()

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])
  
  // Check authentication status on component mount and when localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      const user = AuthService.getCurrentUser()
      setCurrentUser(user)
    }
    
    // Initial check
    checkAuth()
    
    // Listen for storage events (logout from another tab)
    window.addEventListener('storage', checkAuth)
    
    // Listen for custom auth-change events (login/logout in same tab)
    window.addEventListener('auth-change', checkAuth)
    
    return () => {
      window.removeEventListener('storage', checkAuth)
      window.removeEventListener('auth-change', checkAuth)
    }
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }
  
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen)
  }
  
  const handleLogout = () => {
    AuthService.logout()
    setCurrentUser(null)
    setDropdownOpen(false)
    toast.success('Logged out successfully')
    navigate('/')
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-primary shadow-lg' : 'bg-primary bg-opacity-95'
    } text-white`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
            <FaChair className="text-2xl" />
            <span>Desk Mate</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                isActive 
                  ? "font-bold border-b-2 border-white pb-1 transition-all duration-200" 
                  : "hover:text-gray-200 transition-all duration-200 hover:border-b-2 hover:border-white/50 pb-1"
              }
              end
            >
              Home
            </NavLink>
            <NavLink 
              to="/meeting-rooms" 
              className={({ isActive }) => 
                isActive 
                  ? "font-bold border-b-2 border-white pb-1 transition-all duration-200" 
                  : "hover:text-gray-200 transition-all duration-200 hover:border-b-2 hover:border-white/50 pb-1"
              }
            >
              Meeting Rooms
            </NavLink>
            <NavLink 
              to="/desks" 
              className={({ isActive }) => 
                isActive 
                  ? "font-bold border-b-2 border-white pb-1 transition-all duration-200" 
                  : "hover:text-gray-200 transition-all duration-200 hover:border-b-2 hover:border-white/50 pb-1"
              }
            >
              Desk Booking
            </NavLink>
            
            {currentUser ? (
              <div className="relative">
                <button 
                  onClick={toggleDropdown}
                  className="flex items-center space-x-1 hover:text-gray-200 transition-all duration-200"
                >
                  <FaUser className="mr-1" />
                  <span>{currentUser.username}</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                      <div className="font-medium">{currentUser.name}</div>
                      <div className="text-xs text-gray-500">{currentUser.email}</div>
                      <div className="text-xs text-gray-500">{currentUser.department}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FaSignOutAlt className="mr-2" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink 
                to="/login" 
                className={({ isActive }) => 
                  isActive 
                    ? "font-bold border-b-2 border-white pb-1 transition-all duration-200" 
                    : "hover:text-gray-200 transition-all duration-200 hover:border-b-2 hover:border-white/50 pb-1"
                }
              >
                Login
              </NavLink>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-white focus:outline-none" onClick={toggleMenu}>
            {isMenuOpen ? <FaTimes className="text-2xl" /> : <FaBars className="text-2xl" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 animate-fadeIn">
            <div className="flex flex-col space-y-4">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  isActive 
                    ? "font-bold border-l-4 border-white pl-2 transition-all duration-200" 
                    : "hover:text-gray-200 transition-all duration-200 hover:border-l-4 hover:border-white/50 pl-2"
                }
                onClick={toggleMenu}
                end
              >
                Home
              </NavLink>
              <NavLink 
                to="/meeting-rooms" 
                className={({ isActive }) => 
                  isActive 
                    ? "font-bold border-l-4 border-white pl-2 transition-all duration-200" 
                    : "hover:text-gray-200 transition-all duration-200 hover:border-l-4 hover:border-white/50 pl-2"
                }
                onClick={toggleMenu}
              >
                Meeting Rooms
              </NavLink>
              <NavLink 
                to="/desks" 
                className={({ isActive }) => 
                  isActive 
                    ? "font-bold border-l-4 border-white pl-2 transition-all duration-200" 
                    : "hover:text-gray-200 transition-all duration-200 hover:border-l-4 hover:border-white/50 pl-2"
                }
                onClick={toggleMenu}
              >
                Desk Booking
              </NavLink>
              
              {currentUser ? (
                <div className="border-t border-white/20 pt-2 mt-2">
                  <div className="pl-2 mb-2">
                    <div className="font-medium">{currentUser.name}</div>
                    <div className="text-sm text-gray-200">{currentUser.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      toggleMenu();
                    }}
                    className="flex items-center hover:text-gray-200 transition-all duration-200 pl-2"
                  >
                    <FaSignOutAlt className="mr-2" /> Sign out
                  </button>
                </div>
              ) : (
                <NavLink 
                  to="/login" 
                  className={({ isActive }) => 
                    isActive 
                      ? "font-bold border-l-4 border-white pl-2 transition-all duration-200" 
                      : "hover:text-gray-200 transition-all duration-200 hover:border-l-4 hover:border-white/50 pl-2"
                  }
                  onClick={toggleMenu}
                >
                  Login
                </NavLink>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
