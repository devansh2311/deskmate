import { useState, useEffect } from 'react'
import { FaSearch, FaFilter, FaCalendarAlt, FaClock, FaUser, FaBuilding, FaPhone, FaEnvelope, FaProjectDiagram, FaVideo, FaInfoCircle } from 'react-icons/fa'
import { toast } from 'react-toastify'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { meetingRoomApi } from '../utils/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'

// Set the default time zone to IST
const IST_TIMEZONE_OFFSET = 330; // IST is UTC+5:30 (330 minutes)

// Helper function to get today's date in IST
const getTodayInIST = () => {
  const date = new Date();
  const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return new Date(utcDate.getTime() + IST_TIMEZONE_OFFSET * 60000);
};

// Helper function to get current time in IST (HH:MM format)
const getCurrentTimeInIST = () => {
  const now = getTodayInIST();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Format time for display
const formatTime = (time) => {
  if (!time) return 'N/A';
  try {
    // Handle cases where time might not be a string
    if (typeof time !== 'string') {
      return String(time);
    }
    
    // Parse the time string (expected format: HH:MM)
    const [hours, minutes] = time.split(':').map(Number);
    
    // Check if parsing was successful
    if (isNaN(hours) || isNaN(minutes)) {
      return time; // Return original if parsing failed
    }
    
    // Format to 12-hour with AM/PM
    const period = hours >= 12 ? 'P.M.' : 'A.M.';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } catch (err) {
    console.error('Error formatting time:', err);
    return time; // Return original on error
  }
};

const MeetingRoomPage = () => {
  // State for meeting rooms and filters
  const [meetingRooms, setMeetingRooms] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState(getTodayInIST())
  const [selectedStartTime, setSelectedStartTime] = useState(getCurrentTimeInIST())
  const [selectedEndTime, setSelectedEndTime] = useState(() => {
    // Default end time is 1 hour after start time
    const [hours, minutes] = getCurrentTimeInIST().split(':').map(Number);
    const endHours = (hours + 1) % 24;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  })
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
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [roomBookings, setRoomBookings] = useState({})

  // Fetch meeting rooms on component mount or when date/time changes
  useEffect(() => {
    fetchMeetingRooms()
  }, [selectedDate, selectedStartTime, selectedEndTime])

  // Fetch bookings whenever meeting rooms change
  useEffect(() => {
    if (meetingRooms.length > 0) {
      console.log('Meeting rooms loaded, fetching bookings...');
      // We no longer need to call fetchRoomBookings here as it's handled by checkRoomsAvailabilityForDate
      // fetchRoomBookings();
    }
  }, [meetingRooms]);

  // Add a refresh function to manually fetch data
  const refreshData = () => {
    fetchMeetingRooms()
    toast.info('Refreshing booking data...')
  }

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
      
      // After loading rooms, check their availability for the selected date
      if (response.data.length > 0) {
        checkRoomsAvailabilityForDate(response.data);
      }
    } catch (err) {
      setError('Failed to fetch meeting rooms. Please try again later.')
      setLoading(false)
      console.error('Error fetching meeting rooms:', err)
    }
  }

  // Check availability of rooms for the selected date and time range
  const checkRoomsAvailabilityForDate = async (rooms) => {
    try {
      const formattedDate = formatDateToISO(selectedDate);
      
      // Use the API endpoint to check availability for the time range
      const availabilityPromises = rooms.map(room => 
        meetingRoomApi.checkAvailability(
          room.id, 
          formattedDate, 
          selectedStartTime, 
          selectedEndTime
        ).then(response => ({
          roomId: room.id,
          available: response.data
        }))
      );
      
      const availabilityResults = await Promise.all(availabilityPromises);
      
      // Create a map of room IDs to their availability
      const availabilityMap = {};
      availabilityResults.forEach(result => {
        availabilityMap[result.roomId] = result.available;
      });
      
      // Get all bookings for the selected date
      const bookingsResponse = await meetingRoomApi.getBookings({ date: formattedDate });
      const dateBookings = bookingsResponse.data || [];
      
      // Create a map of room IDs to their bookings
      const bookingsMap = {};
      dateBookings.forEach(booking => {
        if (!bookingsMap[booking.meetingRoom.id]) {
          bookingsMap[booking.meetingRoom.id] = [];
        }
        bookingsMap[booking.meetingRoom.id].push(booking);
      });
      
      // Update room statuses based on the availability check
      const updatedRooms = rooms.map(room => {
        // If the room is available for the selected time range, mark it as VACANT
        const isAvailable = availabilityMap[room.id];
        return {
          ...room,
          status: isAvailable ? 'VACANT' : 'BOOKED'
        };
      });
      
      console.log('Updated room statuses for date:', formattedDate, 
                  'and time range:', selectedStartTime, '-', selectedEndTime, 
                  updatedRooms.map(r => `${r.roomName}: ${r.status}`));
      
      setMeetingRooms(updatedRooms);
      setFilteredRooms(updatedRooms);
      setRoomBookings(bookingsMap);
      
      // Also fetch all bookings for each room to show in tooltips
      fetchRoomBookings();
      
    } catch (err) {
      console.error('Error checking room availability for date and time range:', err);
      // If there's an error, fall back to showing all rooms as available
      const updatedRooms = rooms.map(room => ({
        ...room,
        status: 'VACANT'
      }));
      setMeetingRooms(updatedRooms);
      setFilteredRooms(updatedRooms);
      setRoomBookings({});
      
      // Show a toast message about the error
      toast.error('Failed to load room availability. Showing all rooms as available.');
    }
  };

  // Helper function to check if a time is within a range
  const isTimeInRange = (timeToCheck, startTime, endTime) => {
    // Convert all times to minutes for easier comparison
    const timeToCheckMinutes = convertTimeToMinutes(timeToCheck);
    const startTimeMinutes = convertTimeToMinutes(startTime);
    const endTimeMinutes = convertTimeToMinutes(endTime);
    
    // Check if the time is within the range (inclusive of start time, exclusive of end time)
    return timeToCheckMinutes >= startTimeMinutes && timeToCheckMinutes < endTimeMinutes;
  };
  
  // Helper function to convert HH:MM time to minutes
  const convertTimeToMinutes = (time) => {
    if (!time) return 0;
    
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60) + minutes;
  };

  const fetchRoomBookings = async () => {
    try {
      if (!meetingRooms || meetingRooms.length === 0) {
        console.log('No rooms available to fetch bookings for');
        return;
      }
      
      console.log(`Fetching bookings for ${meetingRooms.length} rooms`);
      
      // We need to fetch bookings for each room individually
      const bookingsMap = {};
      
      // Create a promise for each room's bookings
      const bookingPromises = meetingRooms.map(room => 
        meetingRoomApi.getBookings({ roomId: room.id })
          .then(response => {
            console.log(`Bookings for room ${room.id}:`, response.data);
            if (response.data && response.data.length > 0) {
              // Store all bookings for tooltip display
              bookingsMap[room.id] = response.data;
            }
          })
          .catch(err => {
            console.error(`Error fetching bookings for room ${room.id}:`, err);
          })
      );
      
      // Wait for all promises to resolve
      await Promise.all(bookingPromises);
      
      console.log('All room bookings:', bookingsMap);
      setRoomBookings(bookingsMap);
    } catch (err) {
      console.error('Error in fetchRoomBookings:', err);
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
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleBookingClick = (room) => {
    // Set the booking date to the currently selected date in the filter
    // and set the booking times to the selected time range
    const updatedBookingData = {
      ...bookingData,
      bookingDate: selectedDate,
      startTime: selectedStartTime,
      endTime: selectedEndTime
    };
    
    setBookingData(updatedBookingData);
    setSelectedRoom(room);
    setShowBookingForm(true);
  }

  const closeBookingForm = () => {
    setShowBookingForm(false)
    setSelectedRoom(null)
    setBookingData({
      bookerName: '',
      designation: '',
      contact: '',
      email: '',
      bookingDate: new Date(),
      startTime: '09:00',
      endTime: '10:00'
    })
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
    const formattedDate = formatDateToISO(bookingData.bookingDate);
    
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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return date; // Return original if invalid date
      const month = dateObj.toLocaleString('default', { month: 'long' });
      const day = dateObj.getDate();
      const year = dateObj.getFullYear();
      return `${month} ${day}, ${year}`;
    } catch (err) {
      console.error('Error formatting date:', err);
      return date; // Return original on error
    }
  };
  
  const formatDateToISO = (date) => {
    // Create a copy of the date to avoid modifying the original
    const dateCopy = new Date(date);
    return dateCopy.toISOString().split('T')[0];
  };

  const handleDateFilterChange = (date) => {
    // Ensure the date is treated as IST
    setSelectedDate(date);
    
    // Show loading state while fetching new data
    setLoading(true);
    toast.info(`Loading room availability for ${date.toLocaleDateString()}`);
  };
  
  const handleStartTimeChange = (time) => {
    setSelectedStartTime(time);
    
    // If end time is before or equal to start time, set end time to 1 hour after start time
    const [hours, minutes] = time.split(':').map(Number);
    const startTimeMinutes = (hours * 60) + minutes;
    const endTimeMinutes = convertTimeToMinutes(selectedEndTime);
    
    if (endTimeMinutes <= startTimeMinutes) {
      const newEndHours = (hours + 1) % 24;
      const newEndTime = `${newEndHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      setSelectedEndTime(newEndTime);
    }
    
    // Show loading state while fetching new data
    setLoading(true);
    toast.info(`Loading room availability for ${formatTime(time)} - ${formatTime(selectedEndTime)}`);
  };
  
  const handleEndTimeChange = (time) => {
    // If end time is before or equal to start time, don't update
    const [startHours, startMinutes] = selectedStartTime.split(':').map(Number);
    const [endHours, endMinutes] = time.split(':').map(Number);
    
    const startTimeMinutes = (startHours * 60) + startMinutes;
    const endTimeMinutes = (endHours * 60) + endMinutes;
    
    if (endTimeMinutes <= startTimeMinutes) {
      toast.warning('End time must be after start time');
      return;
    }
    
    setSelectedEndTime(time);
    setLoading(true);
    toast.info(`Loading room availability for ${formatTime(selectedStartTime)} - ${formatTime(time)}`);
  };

  // Generate time options in 30-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        const time = `${formattedHour}:${formattedMinute}`;
        options.push(time);
      }
    }
    return options;
  };

  // Time options for dropdown
  const TIME_OPTIONS = generateTimeOptions();

  // Add debug info to help diagnose the issue
  useEffect(() => {
    if (meetingRooms.length > 0) {
      console.log('Current room statuses:', meetingRooms.map(r => `${r.roomName} (${r.id}): ${r.status}`));
    }
  }, [meetingRooms]);

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <div className="text-center text-red-500 mt-8">{error}</div>
  }

  return (
    <div className="pt-16 animate-fadeIn">
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-8 rounded-lg mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Meeting Room Booking</h1>
        <p className="text-lg opacity-90">Book a meeting room for your team discussions and presentations</p>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <div className="flex items-center mb-4">
          <FaFilter className="text-primary mr-2" />
          <h3 className="font-medium">Filter by Availability</h3>
          <div className="ml-auto flex items-center">
            <span className="text-sm text-gray-600 mr-2">Showing availability for:</span>
            <span className="font-semibold">{selectedDate.toLocaleDateString()} from {formatTime(selectedStartTime)} to {formatTime(selectedEndTime)}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex space-x-2">
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
              Available
            </button>
            <button
              className={`btn ${activeFilter === 'BOOKED' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => handleFilterChange('BOOKED')}
            >
              Booked
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search rooms..."
              className="form-input pl-10 w-full"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <div className="flex items-center">
            <FaCalendarAlt className="text-primary mr-2" />
            <DatePicker
              selected={selectedDate}
              onChange={handleDateFilterChange}
              className="form-input"
              dateFormat="yyyy-MM-dd"
              minDate={getTodayInIST()}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              placeholderText="Select date"
            />
          </div>
          
          <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-md">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Start Time</label>
              <select
                value={selectedStartTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="form-select rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={`start-${time}`} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="text-gray-400 mx-2">to</div>
            
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">End Time</label>
              <select
                value={selectedEndTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="form-select rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={`end-${time}`} value={time}>
                    {formatTime(time)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <button 
            onClick={refreshData}
            className="btn btn-primary flex items-center ml-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004 12H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
      
      {/* Legend */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <h3 className="font-medium mb-2">Room Status</h3>
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
        <div>
          <h2 className="text-2xl font-bold mb-6">Available Meeting Rooms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map(room => (
              <div 
                key={room.id} 
                className={`bg-white rounded-lg shadow-md p-6 border-l-4 group relative
                  ${room.status === 'VACANT' ? 'border-green-500' : 'border-red-500'}`}
              >
                <h3 className="text-xl font-bold mb-2 flex justify-between items-center">
                  {room.roomName}
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    room.status === 'VACANT' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {room.status === 'VACANT' ? 'Available' : 'Booked'}
                  </span>
                </h3>
                
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
                
                {/* Tooltip for booked rooms */}
                {room.status === 'BOOKED' && (
                  <div className="hidden group-hover:block absolute top-20 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg w-56 z-10">
                    <div className="font-bold mb-1 flex items-center">
                      <FaInfoCircle className="mr-1" /> Booking Information
                    </div>
                    <div className="text-xs">
                      {roomBookings[room.id] && roomBookings[room.id].length > 0 ? (
                        roomBookings[room.id].map((booking, index) => (
                          <div key={index} className={index > 0 ? "mt-2 pt-2 border-t border-gray-600" : ""}>
                            <p><span className="font-semibold">Date:</span> {formatDate(booking.bookingDate)}</p>
                            <p><span className="font-semibold">Time:</span> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                            {formatDateToISO(selectedDate) === booking.bookingDate && (
                              <p className="text-yellow-300 font-semibold mt-1">Booked for selected date</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p>No booking details available</p>
                      )}
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-800"></div>
                  </div>
                )}
                
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
        </div>
      )}
      
      {/* Booking Form Modal */}
      {showBookingForm && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn overflow-auto">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md my-8" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pt-2">
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
                  <select
                    value={bookingData.startTime}
                    onChange={(e) => handleTimeChange('startTime', e.target.value)}
                    className="form-select rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={`start-${time}`} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <FaClock className="text-primary" /> End Time
                  </label>
                  <select
                    value={bookingData.endTime}
                    onChange={(e) => handleTimeChange('endTime', e.target.value)}
                    className="form-select rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
                  >
                    {TIME_OPTIONS.map((time) => (
                      <option key={`end-${time}`} value={time}>
                        {formatTime(time)}
                      </option>
                    ))}
                  </select>
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
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
