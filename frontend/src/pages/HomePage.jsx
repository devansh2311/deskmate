import { Link } from 'react-router-dom'
import { FaChair, FaDoorOpen, FaArrowRight } from 'react-icons/fa'

const HomePage = () => {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg mb-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Welcome to Desk Mate</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8">
            Your complete solution for booking meeting rooms and desks in your office space
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link to="/meeting-rooms" className="btn bg-white text-primary hover:bg-gray-100 flex items-center justify-center gap-2">
              <FaDoorOpen /> Book a Meeting Room <FaArrowRight className="ml-1" />
            </Link>
            <Link to="/desks" className="btn bg-secondary hover:bg-secondary-dark flex items-center justify-center gap-2">
              <FaChair /> Book a Desk <FaArrowRight className="ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full mb-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Desk Mate?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center hover:shadow-lg transition-shadow">
              <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaDoorOpen className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Meeting Room Booking</h3>
              <p className="text-gray-600">
                Easily book meeting rooms with a simple interface. Filter by availability, search by name, and get email confirmations.
              </p>
            </div>
            
            <div className="card text-center hover:shadow-lg transition-shadow">
              <div className="bg-secondary text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FaChair className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Desk Booking</h3>
              <p className="text-gray-600">
                View the office layout, find available desks, and book your preferred spot. Filter by department to sit near your team.
              </p>
            </div>
            
            <div className="card text-center hover:shadow-lg transition-shadow">
              <div className="bg-accent text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Email Notifications</h3>
              <p className="text-gray-600">
                Receive booking confirmations via email. Book desks for friends and they'll get notified too.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-gray-100 py-12 rounded-lg">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl max-w-2xl mx-auto mb-8">
            Book your meeting room or desk now and make your office experience more efficient.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link to="/meeting-rooms" className="btn btn-primary">
              Book a Meeting Room
            </Link>
            <Link to="/desks" className="btn btn-secondary">
              Book a Desk
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
