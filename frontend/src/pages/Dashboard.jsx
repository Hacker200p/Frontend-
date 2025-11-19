import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import HostelMapExplorer from '../components/HostelMapExplorer'
import { tenantAPI } from '../services/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getDashboardLink = () => {
    if (!user) return '/'
    switch (user.userRole) {
      case 'tenant':
        return '/tenant'
      case 'owner':
        return '/owner'
      case 'provider':
        return '/canteen'
      case 'admin':
        return '/admin'
      default:
        return '/'
    }
  }

  // Fetch hostels if user is tenant
  useEffect(() => {
    const fetchHostels = async () => {
      if (user?.userRole === 'tenant') {
        try {
          const response = await tenantAPI.searchHostels({ showAll: true, limit: 100 })
          console.log('Fetched hostels:', response.data?.data?.length)
          setHostels(response.data?.data || [])
        } catch (error) {
          console.error('Error fetching hostels:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }
    fetchHostels()
  }, [user])

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-primary text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">SafeStay Hub</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.name || 'User'}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {user?.userRole === 'tenant' ? (
          <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
            {/* Map Section */}
            <div className="h-[calc(100vh-140px)] rounded-xl overflow-hidden shadow-2xl border-2 border-gray-200">
              <HostelMapExplorer 
                hostels={hostels}
                onHostelSelect={(hostel) => {
                  navigate('/tenant', { state: { selectedHostelId: hostel._id } })
                }}
              />
            </div>

            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-primary rounded-xl p-6 shadow-lg flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">🏠</span>
                <div>
                  <h2 className="text-2xl font-bold text-primary mb-1">Welcome to SafeStay Hub! 🎉</h2>
                  <p className="text-primary text-xs font-semibold">Tenant Portal</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border-l-4 border-primary mb-4">
                <p className="text-text-dark text-base mb-2 font-semibold">
                  🔍 Find Your Perfect Hostel
                </p>
                <p className="text-text-muted text-sm mb-3">
                  Explore verified hostels on the map. Click on markers to view details and book your room instantly.
                </p>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-text-muted">Verified Properties</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-text-muted">Real-time Availability</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-text-muted">24/7 Support</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/tenant')}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
              >
                Go to tenant Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="card">
            <h2 className="text-3xl font-bold mb-4 text-text-dark">Welcome to SafeStay Hub</h2>
            <p className="text-text-muted mb-6">
              You are logged in as <span className="font-semibold">{user?.userRole}</span>
            </p>

            <button
              onClick={() => navigate(getDashboardLink())}
              className="btn-primary"
            >
              Go to {user?.userRole} Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
