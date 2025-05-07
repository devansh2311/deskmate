import { useState, useEffect } from 'react'
import { FaCalendarAlt, FaUser, FaBuilding, FaPhone, FaEnvelope, FaFilter } from 'react-icons/fa'
import { toast } from 'react-toastify'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { deskApi } from '../utils/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const DeskBookingPage = () => {
  // State for desks and filters
  const [desks, setDesks] = useState([])
  const [filteredDesks, setFilteredDesks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDepartment, setSelectedDepartment] = useState('ALL')
  const [departments, setDepartments] = useState([])
  
  // State for desk selection and booking
  const [selectedDesk, setSelectedDesk] = useState(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingData, setBookingData] = useState({
    bookerName: '',
    designation: '',
    department: '',
    contact: '',
    email: '',
    bookingDate: new Date(),
    isForFriend: false,
    friendName: '',
    friendEmail: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch desks on component mount
  useEffect(() => {
    fetchDesks()
  }, [])

  // Filter desks when department changes
  useEffect(() => {
    filterDesksByDepartment()
  }, [selectedDepartment, desks])

  const fetchDesks = async () => {
    setLoading(true)
    try {
      const response = await deskApi.getAll()
      setDesks(response.data)
      setFilteredDesks(response.data)
      
      // Extract unique departments
      const uniqueDepartments = [...new Set(response.data.map(desk => desk.department))]
      setDepartments(uniqueDepartments)
      
      setLoading(false)
    } catch (err) {
      setError('Failed to fetch desks. Please try again later.')
      setLoading(false)
      console.error('Error fetching desks:', err)
    }
  }

  const filterDesksByDepartment = () => {
    if (selectedDepartment === 'ALL') {
      setFilteredDesks(desks)
    } else {
      const filtered = desks.filter(desk => desk.department === selectedDepartment)
      setFilteredDesks(filtered)
    }
  }

  const handleDepartmentChange = (department) => {
    setSelectedDepartment(department)
  }

  const handleDeskClick = (desk) => {
    if (desk.status === 'VACANT') {
      setSelectedDesk(desk)
      setShowBookingForm(true)
    } else {
      toast.info(`Desk ${desk.deskNumber} is already booked for today.`)
    }
  }

  const handleBookingInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setBookingData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleDateChange = (date) => {
    setBookingData(prev => ({
      ...prev,
      bookingDate: date
    }))
    
    // Check if desk is available on selected date
    checkDeskAvailability(selectedDesk.id, date)
  }

  const checkDeskAvailability = async (deskId, date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0]
      const response = await deskApi.checkAvailability(deskId, formattedDate)
      
      if (!response.data) {
        toast.warning('This desk is already booked for the selected date. Please choose another date or desk.')
      }
    } catch (err) {
      console.error('Error checking desk availability:', err)
    }
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (!bookingData.bookerName || !bookingData.designation || 
        !bookingData.department || !bookingData.contact || !bookingData.email || 
        !bookingData.bookingDate) {
      toast.error('Please fill in all required fields')
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(bookingData.email)) {
      toast.error('Please enter a valid email address')
      return
    }
    
    // Validate contact number
    const phoneRegex = /^\d{10}$/
    if (!phoneRegex.test(bookingData.contact.replace(/[^0-9]/g, ''))) {
      toast.error('Please enter a valid 10-digit contact number')
      return
    }
    
    // Validate friend email if booking for friend
    if (bookingData.isForFriend) {
      if (!bookingData.friendName || !bookingData.friendEmail) {
        toast.error('Please provide friend\'s name and email')
        return
      }
      
      if (!emailRegex.test(bookingData.friendEmail)) {
        toast.error('Please enter a valid email address for your friend')
        return
      }
    }
    
    // Format date for API
    const formattedDate = bookingData.bookingDate.toISOString().split('T')[0]
    
    setSubmitting(true)
    
    try {
      // Check if desk is available for the selected date
      const availabilityResponse = await deskApi.checkAvailability(
        selectedDesk.id,
        formattedDate
      )
      
      if (!availabilityResponse.data) {
        toast.error('This desk is no longer available for the selected date. Please choose another date or desk.')
        setSubmitting(false)
        return
      }
      
      // Book the desk
      await deskApi.book({
        desk: {
          id: selectedDesk.id
        },
        bookerName: bookingData.bookerName,
        designation: bookingData.designation,
        department: bookingData.department,
        contact: bookingData.contact,
        email: bookingData.email,
        bookingDate: formattedDate,
        isForFriend: bookingData.isForFriend,
        friendName: bookingData.isForFriend ? bookingData.friendName : null,
        friendEmail: bookingData.isForFriend ? bookingData.friendEmail : null
      })
      
      toast.success('Desk booked successfully! A confirmation email has been sent to your email address.')
      setShowBookingForm(false)
      fetchDesks() // Refresh the desk list
      
      // Reset booking form
      setBookingData({
        bookerName: '',
        designation: '',
        department: '',
        contact: '',
        email: '',
        bookingDate: new Date(),
        isForFriend: false,
        friendName: '',
        friendEmail: ''
      })
    } catch (err) {
      toast.error(err.response?.data || 'Failed to book desk')
      console.error('Error booking desk:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const closeBookingForm = () => {
    setShowBookingForm(false)
  }

  // Generate desk grid based on filtered desks
  const renderDeskGrid = () => {
    // Group desks by floor
    const desksByFloor = filteredDesks.reduce((acc, desk) => {
      if (!acc[desk.floor]) {
        acc[desk.floor] = []
      }
      acc[desk.floor].push(desk)
      return acc
    }, {})
    
    return Object.entries(desksByFloor).map(([floor, desksOnFloor]) => (
      <div key={floor} className="mb-12">
        <h3 className="text-xl font-semibold mb-4">Floor {floor}</h3>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {desksOnFloor.map(desk => (
              <div 
                key={desk.id}
                onClick={() => handleDeskClick(desk)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-lg border-2 ${
                  desk.status === 'VACANT' 
                    ? 'border-green-500 bg-green-50 hover:bg-green-100 cursor-pointer' 
                    : 'border-red-500 bg-red-50 cursor-not-allowed'
                } transition-colors duration-200`}
              >
                <div className="text-center">
                  <div className="font-bold">{desk.deskNumber}</div>
                  <div className="text-xs text-gray-600">{desk.department}</div>
                  <div className={`w-3 h-3 rounded-full mx-auto mt-1 ${
                    desk.status === 'VACANT' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ))
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="text-center py-12 animate-fadeIn">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <p className="text-red-500 text-xl mb-4">{error}</p>
          <button 
            onClick={fetchDesks} 
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-16 animate-fadeIn">
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-8 rounded-lg mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Desk Booking</h1>
        <p className="text-lg opacity-90">Book a desk for your workday</p>
      </div>
      
      {/* Department Filter */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <div className="flex items-center mb-2">
          <FaFilter className="text-primary mr-2" />
          <h3 className="font-medium">Filter by Department</h3>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            className={`btn ${selectedDepartment === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleDepartmentChange('ALL')}
          >
            All Departments
          </button>
          {departments.map(department => (
            <button
              key={department}
              className={`btn ${selectedDepartment === department ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleDepartmentChange(department)}
            >
              {department}
            </button>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <h3 className="font-medium mb-2">Desk Status</h3>
        <div className="flex space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
            <span>Booked</span>
          </div>
        </div>
      </div>
      
      {/* Desk Grid */}
      {filteredDesks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="max-w-md mx-auto">
            <FaFilter className="text-4xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">No desks found matching your criteria.</p>
            <button 
              onClick={() => setSelectedDepartment('ALL')} 
              className="btn btn-outline"
            >
              Show All Desks
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-6">Office Layout</h2>
          {renderDeskGrid()}
        </div>
      )}
      
      {/* Booking Form Modal */}
      {showBookingForm && selectedDesk && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Book Desk {selectedDesk.deskNumber}</h2>
              <p className="text-gray-600 mb-6">Department: {selectedDesk.department} | Floor: {selectedDesk.floor}</p>
              <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <p className="font-medium">
                  You are booking desk <span className="text-primary">{selectedDesk.deskNumber}</span>
                </p>
                <p className="text-gray-600">
                  Department: {selectedDesk.department} • Floor: {selectedDesk.floor}
                </p>
              </div>
              <form onSubmit={handleBookingSubmit}>
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <FaCalendarAlt className="text-primary" /> Date
                  </label>
                  <DatePicker
                    selected={bookingData.bookingDate}
                    onChange={handleDateChange}
                    className="form-input"
                    dateFormat="yyyy-MM-dd"
                    minDate={new Date()}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <FaUser className="text-primary" /> Your Name
                  </label>
                  <input
                    type="text"
                    name="bookerName"
                    value={bookingData.bookerName}
                    onChange={handleBookingInputChange}
                    className="form-input"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <FaBuilding className="text-primary" /> Designation
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={bookingData.designation}
                    onChange={handleBookingInputChange}
                    className="form-input"
                    placeholder="Enter your designation"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <FaBuilding className="text-primary" /> Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={bookingData.department}
                    onChange={handleBookingInputChange}
                    className="form-input"
                    placeholder="Enter your department"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <FaPhone className="text-primary" /> Contact
                  </label>
                  <input
                    type="text"
                    name="contact"
                    value={bookingData.contact}
                    onChange={handleBookingInputChange}
                    className="form-input"
                    placeholder="Enter your contact number"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <FaEnvelope className="text-primary" /> Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={bookingData.email}
                    onChange={handleBookingInputChange}
                    className="form-input"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isForFriend"
                      checked={bookingData.isForFriend}
                      onChange={handleBookingInputChange}
                      className="form-checkbox text-primary"
                    />
                    <span>Book for a friend/colleague</span>
                  </label>
                </div>
                
                {bookingData.isForFriend && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4 animate-fadeIn">
                    <div className="form-group">
                      <label className="form-label flex items-center gap-2">
                        <FaUser className="text-primary" /> Friend's Name
                      </label>
                      <input
                        type="text"
                        name="friendName"
                        value={bookingData.friendName}
                        onChange={handleBookingInputChange}
                        className="form-input"
                        placeholder="Enter friend's name"
                        required={bookingData.isForFriend}
                      />
                    </div>
                    
                    <div className="form-group mb-0">
                      <label className="form-label flex items-center gap-2">
                        <FaEnvelope className="text-primary" /> Friend's Email
                      </label>
                      <input
                        type="email"
                        name="friendEmail"
                        value={bookingData.friendEmail}
                        onChange={handleBookingInputChange}
                        className="form-input"
                        placeholder="Enter friend's email"
                        required={bookingData.isForFriend}
                      />
                    </div>
                  </div>
                )}
                
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={closeBookingForm}
                    className="btn btn-outline"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : 'Book Desk'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeskBookingPage
