import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const navigate = useNavigate()
  const { login, error, loading, clearError, user: storeUser } = useAuthStore()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    clearError()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(formData)
      // Get the updated user from store after login completes
      const userData = useAuthStore.getState().user
      
      console.log('User data from store:', userData)
      console.log('User role:', userData?.userRole)
      
      // Check if there's a hostel redirect from landing page
      const redirectHostelId = sessionStorage.getItem('redirectHostelId')
      console.log('Redirect hostel ID from session:', redirectHostelId)
      
      // Redirect based on user role
      if (userData?.userRole === 'tenant') {
        if (redirectHostelId) {
          console.log('Redirecting to tenant dashboard with hostel ID:', redirectHostelId)
          // Clear the stored hostel ID and navigate to tenant dashboard with state
          sessionStorage.removeItem('redirectHostelId')
          navigate('/tenant', { state: { selectedHostelId: redirectHostelId }, replace: true })
        } else {
          console.log('Navigating to /dashboard')
          navigate('/dashboard') // Tenants see the map page
        }
      } else if (userData?.userRole === 'owner') {
        console.log('Navigating to /owner')
        sessionStorage.removeItem('redirectHostelId') // Clear if exists
        navigate('/owner')
      } else if (userData?.userRole === 'provider') {
        console.log('Navigating to /canteen')
        sessionStorage.removeItem('redirectHostelId') // Clear if exists
        navigate('/canteen')
      } else if (userData?.userRole === 'admin') {
        console.log('Navigating to /admin')
        sessionStorage.removeItem('redirectHostelId') // Clear if exists
        navigate('/admin')
      } else {
        console.log('Default navigation to /dashboard, userData:', userData)
        sessionStorage.removeItem('redirectHostelId') // Clear if exists
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="card w-96">
        <h1 className="text-3xl font-bold text-center mb-6 text-primary">SafeStay Hub</h1>
        <h2 className="text-2xl font-bold text-center mb-6 text-text-dark">Login</h2>

        {error && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger text-danger rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="input w-full"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
