import { Link } from 'react-router-dom'
import { FaHome, FaExclamationTriangle } from 'react-icons/fa'

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <FaExclamationTriangle className="text-6xl text-accent mb-6" />
      <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
      <p className="text-xl text-gray-600 mb-8 text-center">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary flex items-center gap-2">
        <FaHome /> Return to Home
      </Link>
    </div>
  )
}

export default NotFoundPage
