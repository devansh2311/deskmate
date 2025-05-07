import { useState, useEffect } from 'react'
import { FaSearch, FaFilter, FaCalendarAlt, FaClock, FaUser, FaBuilding, FaPhone, FaEnvelope, FaProjectDiagram, FaVideo } from 'react-icons/fa'
import { toast } from 'react-toastify'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import TimePicker from 'react-time-picker'
import 'react-time-picker/dist/TimePicker.css'
import { meetingRoomApi } from '../utils/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const MeetingRoomPage = () => {
  // State for meeting rooms and filters
  const [meetingRooms, setMeetingRooms] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  
  // State for booking form
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [bookingData, setBookingData] = useState({
    bookerName: '',
    designation: '',
    contact: '',
    email: '',
    bookingDate: new Date(),
    startTime: '09:00',
    endTime: '10:00'
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch meeting rooms on component mount
  useEffect(() => {
    fetchMeetingRooms()
  }, [])

  // Filter rooms when filter or search changes
  useEffect(() => {
    filterRooms()
  }, [activeFilter, searchQuery, meetingRooms])

  const fetchMeetingRooms = async () => {
    setLoading(true)
    try {
      let response;
      
      if (activeFilter === 'ALL') {
        response = await meetingRoomApi.getAll();
      } else {
        response = await meetingRoomApi.getByStatus(activeFilter);
      }
      
      setMeetingRooms(response.data)
      setFilteredRooms(response.data)
      setLoading(false)
    } catch (err) {
      setError('Failed to fetch meeting rooms. Please try again later.')
      setLoading(false)
      console.error('Error fetching meeting rooms:', err)
    }
  }

  const filterRooms = () => {
    let filtered = [...meetingRooms]
    
    // Apply status filter
    if (activeFilter !== 'ALL') {
      filtered = filtered.filter(room => 
        room.status === (activeFilter === 'VACANT' ? 'VACANT' : 'BOOKED')
      )
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(room => 
        room.roomName.toLowerCase().includes(query) || 
        room.roomNumber.toLowerCase().includes(query)
      )
    }
    
    setFilteredRooms(filtered)
  }

  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
    if (filter !== activeFilter) {
      // If changing from ALL to a specific status, or between statuses, fetch filtered data
      if (filter !== 'ALL') {
        fetchFilteredRooms(filter);
      } else {
        fetchMeetingRooms();
      }
    }
  }

  const fetchFilteredRooms = async (status) => {
    setLoading(true)
    try {
      const response = await meetingRoomApi.getByStatus(status);
      setMeetingRooms(response.data)
      setFilteredRooms(response.data)
      setLoading(false)
    } catch (err) {
      setError('Failed to fetch filtered meeting rooms.')
      setLoading(false)
      console.error('Error fetching filtered meeting rooms:', err)
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleBookingClick = (room) => {
    setSelectedRoom(room)
    setShowBookingForm(true)
  }

  const handleBookingInputChange = (e) => {
    const { name, value } = e.target
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDateChange = (date) => {
    setBookingData(prev => ({
      ...prev,
      bookingDate: date
    }))
  }

  const handleTimeChange = (type, value) => {
    setBookingData(prev => ({
      ...prev,
      [type]: value
    }))
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (!bookingData.bookerName || !bookingData.designation || 
        !bookingData.contact || !bookingData.email || 
        !bookingData.bookingDate || !bookingData.startTime || !bookingData.endTime) {
      toast.error('Please fill in all fields')
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Validate contact number
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(bookingData.contact.replace(/[^0-9]/g, ''))) {
      toast.error('Please enter a valid 10-digit contact number');
      return;
    }
    
    // Format date and time for API
    const formattedDate = bookingData.bookingDate.toISOString().split('T')[0]
    
    setSubmitting(true)
    
    try {
      // Check if room is available for the selected time
      const availabilityResponse = await meetingRoomApi.checkAvailability(
        selectedRoom.id,
        formattedDate,
        bookingData.startTime,
        bookingData.endTime
      );
      
      if (!availabilityResponse.data) {
        toast.error('This room is no longer available for the selected time. Please choose another time or room.');
        setSubmitting(false);
        return;
      }
      
      // Book the room
      await meetingRoomApi.book({
        meetingRoom: {
          id: selectedRoom.id
        },
        bookerName: bookingData.bookerName,
        designation: bookingData.designation,
        contact: bookingData.contact,
        email: bookingData.email,
        bookingDate: formattedDate,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime
      });
      
      toast.success('Meeting room booked successfully! A confirmation email has been sent to your email address.')
      setShowBookingForm(false)
      fetchMeetingRooms() // Refresh the room list
      
      // Reset booking form
      setBookingData({
        bookerName: '',
        designation: '',
        contact: '',
        email: '',
        bookingDate: new Date(),
        startTime: '09:00',
        endTime: '10:00'
      })
    } catch (err) {
      toast.error(err.response?.data || 'Failed to book meeting room')
      console.error('Error booking meeting room:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const closeBookingForm = () => {
    setShowBookingForm(false)
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
            onClick={fetchMeetingRooms} 
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
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Meeting Room Booking</h1>
        <p className="text-lg opacity-90">Book a meeting room for your team discussions and presentations</p>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4 bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-2">
          <button 
            className={`btn ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleFilterChange('ALL')}
          >
            All Rooms
          </button>
          <button 
            className={`btn ${activeFilter === 'VACANT' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleFilterChange('VACANT')}
          >
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Vacant
          </button>
          <button 
            className={`btn ${activeFilter === 'BOOKED' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleFilterChange('BOOKED')}
          >
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            Booked
          </button>
        </div>
        
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search rooms..."
            className="form-input pl-10"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>
      
      {/* Room List */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="max-w-md mx-auto">
            <FaFilter className="text-4xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">No meeting rooms found matching your criteria.</p>
            <button 
              onClick={() => {
                setActiveFilter('ALL');
                setSearchQuery('');
                fetchMeetingRooms();
              }} 
              className="btn btn-outline"
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map(room => (
            <div 
              key={room.id} 
              className="card relative overflow-hidden group"
            >
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium text-white ${
                room.status === 'VACANT' ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {room.status}
              </div>
              
              <h3 className="text-xl font-bold mb-2">{room.roomName}</h3>
              <p className="text-gray-600 mb-4">Room Number: {room.roomNumber}</p>
              
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-gray-500">Capacity: {room.capacity} people</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {room.hasProjector && (
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded flex items-center">
                      <FaProjectDiagram className="mr-1" /> Projector
                    </span>
                  )}
                  {room.hasVideoConference && (
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded flex items-center">
                      <FaVideo className="mr-1" /> Video Conference
                    </span>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => handleBookingClick(room)}
                className={`btn w-full ${
                  room.status === 'VACANT' 
                    ? 'btn-primary' 
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed hover:bg-gray-300'
                }`}
                disabled={room.status !== 'VACANT'}
              >
                {room.status === 'VACANT' ? 'Book Now' : 'Unavailable'}
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Booking Form Modal */}
      {showBookingForm && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-primary">Book Meeting Room</h2>
              <button 
                onClick={closeBookingForm}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <p className="font-medium">
                You are booking <span className="text-primary">{selectedRoom.roomName}</span>
              </p>
              <p className="text-gray-600">
                Room {selectedRoom.roomNumber} • Capacity: {selectedRoom.capacity} people
              </p>
            </div>
            
            <form onSubmit={handleBookingSubmit}>
              <div className="form-group">
                <label className="form-label flex items-center gap-2">
                  <FaUser className="text-primary" /> Name
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <FaClock className="text-primary" /> Start Time
                  </label>
                  <TimePicker
                    onChange={(value) => handleTimeChange('startTime', value)}
                    value={bookingData.startTime}
                    className="form-input"
                    disableClock
                    clearIcon={null}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <FaClock className="text-primary" /> End Time
                  </label>
                  <TimePicker
                    onChange={(value) => handleTimeChange('endTime', value)}
                    value={bookingData.endTime}
                    className="form-input"
                    disableClock
                    clearIcon={null}
                    required
                  />
                </div>
              </div>
              
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
                  ) : 'Book Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MeetingRoomPage
