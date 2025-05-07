import { Link, NavLink } from 'react-router-dom'
import { FaChair, FaDoorOpen, FaBars, FaTimes } from 'react-icons/fa'
import { useState } from 'react'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav className="bg-primary text-white shadow-md">
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
                isActive ? "font-bold border-b-2 border-white pb-1" : "hover:text-gray-200"
              }
              end
            >
              Home
            </NavLink>
            <NavLink 
              to="/meeting-rooms" 
              className={({ isActive }) => 
                isActive ? "font-bold border-b-2 border-white pb-1" : "hover:text-gray-200"
              }
            >
              Meeting Rooms
            </NavLink>
            <NavLink 
              to="/desks" 
              className={({ isActive }) => 
                isActive ? "font-bold border-b-2 border-white pb-1" : "hover:text-gray-200"
              }
            >
              Desk Booking
            </NavLink>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu}
              className="text-white focus:outline-none"
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary-dark">
            <div className="flex flex-col space-y-4">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  isActive ? "font-bold" : "hover:text-gray-200"
                }
                onClick={toggleMenu}
                end
              >
                Home
              </NavLink>
              <NavLink 
                to="/meeting-rooms" 
                className={({ isActive }) => 
                  isActive ? "font-bold" : "hover:text-gray-200"
                }
                onClick={toggleMenu}
              >
                Meeting Rooms
              </NavLink>
              <NavLink 
                to="/desks" 
                className={({ isActive }) => 
                  isActive ? "font-bold" : "hover:text-gray-200"
                }
                onClick={toggleMenu}
              >
                Desk Booking
              </NavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
