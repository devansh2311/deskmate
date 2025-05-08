import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Navbar from './components/layout/Navbar'
import LoadingSpinner from './components/ui/LoadingSpinner'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'))
const MeetingRoomPage = lazy(() => import('./pages/MeetingRoomPage'))
const DeskBookingPage = lazy(() => import('./pages/DeskBookingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/meeting-rooms" element={
              <ProtectedRoute>
                <MeetingRoomPage />
              </ProtectedRoute>
            } />
            <Route path="/desks" element={
              <ProtectedRoute>
                <DeskBookingPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold mb-2">Desk Mate</h3>
              <p className="text-gray-300">Your complete office booking solution</p>
            </div>
            <div className="flex space-x-6">
              <div>
                <h4 className="font-semibold mb-2">Quick Links</h4>
                <ul className="space-y-1">
                  <li><a href="/" className="text-gray-300 hover:text-white">Home</a></li>
                  <li><a href="/meeting-rooms" className="text-gray-300 hover:text-white">Meeting Rooms</a></li>
                  <li><a href="/desks" className="text-gray-300 hover:text-white">Desk Booking</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Contact</h4>
                <ul className="space-y-1">
                  <li className="text-gray-300">support@deskmate.com</li>
                  <li className="text-gray-300">+1 (555) 123-4567</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 pt-6 text-center">
            <p>&copy; {new Date().getFullYear()} Desk Mate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
