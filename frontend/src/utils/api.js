import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    if (response) {
      // Handle specific error status codes
      switch (response.status) {
        case 401:
          toast.error('Session expired. Please login again.');
          // Could redirect to login page here
          break;
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(response.data?.message || 'Something went wrong.');
      }
    } else {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// Meeting Room API calls
export const meetingRoomApi = {
  getAll: () => api.get('/meeting-rooms'),
  getByStatus: (status) => api.get(`/meeting-rooms?status=${status}`),
  getById: (id) => api.get(`/meeting-rooms/${id}`),
  search: (name) => api.get(`/meeting-rooms/search?name=${name}`),
  create: (data) => api.post('/meeting-rooms', data),
  update: (id, data) => api.put(`/meeting-rooms/${id}`, data),
  delete: (id) => api.delete(`/meeting-rooms/${id}`),
  checkAvailability: (roomId, date, startTime, endTime) => 
    api.get(`/meeting-rooms/available?roomId=${roomId}&date=${date}&startTime=${startTime}&endTime=${endTime}`),
  book: (bookingData) => api.post('/meeting-rooms/bookings', bookingData),
  getBookings: (params) => api.get('/meeting-rooms/bookings', { params }),
  cancelBooking: (id) => api.delete(`/meeting-rooms/bookings/${id}`),
};

// Desk API calls
export const deskApi = {
  getAll: () => api.get('/desks'),
  getByStatus: (status) => api.get(`/desks?status=${status}`),
  getByDepartment: (department) => api.get(`/desks?department=${department}`),
  getById: (id) => api.get(`/desks/${id}`),
  getByNumber: (deskNumber) => api.get(`/desks/number/${deskNumber}`),
  create: (data) => api.post('/desks', data),
  update: (id, data) => api.put(`/desks/${id}`, data),
  delete: (id) => api.delete(`/desks/${id}`),
  checkAvailability: (deskId, date) => 
    api.get(`/desks/available?deskId=${deskId}&date=${date}`),
  book: (bookingData) => api.post('/desks/bookings', bookingData),
  getBookings: (params) => api.get('/desks/bookings', { params }),
  cancelBooking: (id) => api.delete(`/desks/bookings/${id}`),
};

export default api;
