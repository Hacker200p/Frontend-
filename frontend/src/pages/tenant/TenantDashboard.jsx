import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LogOut, Menu, X } from 'lucide-react'
import { tenantAPI } from '../../services/api'

export default function TenantDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [userInHostel, setUserInHostel] = useState(false)
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedHostelId, setSelectedHostelId] = useState(null)
  const [selectedHostel, setSelectedHostel] = useState(null)
  const [hasActiveBooking, setHasActiveBooking] = useState(false)
  const [availableRooms, setAvailableRooms] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  
  // Room filters
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' })
  const [roomTypeFilter, setRoomTypeFilter] = useState('all')
  const [amenityFilter, setAmenityFilter] = useState([])
  const [floorFilter, setFloorFilter] = useState('all')
  
  // Booking state
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    additionalInfo: ''
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingMessage, setBookingMessage] = useState('')
  const [myBooking, setMyBooking] = useState(null)

  useEffect(() => {
    // Check if user has any active contracts/bookings
    const checkUserBookingStatus = async () => {
      try {
        setLoading(true)
        console.log('Checking user booking status...')
        
        // Check if user has contracts
        const contractsResponse = await tenantAPI.getMyContracts()
        const contracts = contractsResponse.data?.data || []
        console.log('User contracts:', contracts)
        
        // If user has active contracts, they're in a hostel
        const hasActive = contracts.some(contract => 
          contract.status === 'active' || contract.status === 'pending_signatures' || contract.status === 'draft'
        )
        
        // Get the most recent active booking
        const activeContract = contracts.find(contract => 
          contract.status === 'active' || contract.status === 'pending_signatures' || contract.status === 'draft'
        )
        
        setMyBooking(activeContract || null)
        setHasActiveBooking(hasActive)
        setUserInHostel(hasActive || user?.currentHostel ? true : false)
        
        // If no active booking, fetch available hostels
        if (!hasActive) {
          console.log('No active booking found. Fetching available hostels...')
          // Pass showAll=true to get all hostels, not just verified ones
          const hostelsResponse = await tenantAPI.searchHostels({ page: 1, limit: 100, showAll: true })
          console.log('Available hostels:', hostelsResponse.data?.data?.length || 0)
          setHostels(hostelsResponse.data?.data || [])
        }
      } catch (error) {
        console.error('Error checking booking status:', error)
        // If API fails, show hostels by default
        try {
          const hostelsResponse = await tenantAPI.searchHostels({ page: 1, limit: 100, showAll: true })
          setHostels(hostelsResponse.data?.data || [])
        } catch (err) {
          console.error('Error fetching hostels:', err)
          setHostels([])
        }
      } finally {
        setLoading(false)
      }
    }

    checkUserBookingStatus()
  }, [])

  const fetchHostelRooms = async (hostelId) => {
    try {
      setLoadingRooms(true)
      const response = await tenantAPI.getHostelDetails(hostelId)
      console.log('Hostel details response:', response)
      const rooms = response.data?.data?.rooms || []
      setAvailableRooms(rooms)
      setSelectedHostel(response.data?.data?.hostel || null)
    } catch (error) {
      console.error('Error fetching hostel rooms:', error)
      setAvailableRooms([])
    } finally {
      setLoadingRooms(false)
    }
  }

  // Filter rooms based on criteria
  const getFilteredRooms = () => {
    let filtered = [...availableRooms]

    // Price filter
    if (priceFilter.min) {
      filtered = filtered.filter(room => room.rent >= parseInt(priceFilter.min))
    }
    if (priceFilter.max) {
      filtered = filtered.filter(room => room.rent <= parseInt(priceFilter.max))
    }

    // Room type filter
    if (roomTypeFilter !== 'all') {
      filtered = filtered.filter(room => room.roomType === roomTypeFilter)
    }

    // Floor filter
    if (floorFilter !== 'all') {
      filtered = filtered.filter(room => room.floor === parseInt(floorFilter))
    }

    // Amenity filter
    if (amenityFilter.length > 0) {
      filtered = filtered.filter(room => 
        amenityFilter.every(amenity => room.amenities?.includes(amenity))
      )
    }

    return filtered
  }

  const handleBookRoom = async (e) => {
    e.preventDefault()
    
    if (!bookingData.startDate) {
      setBookingMessage('Please select a start date')
      return
    }

    try {
      setBookingLoading(true)
      setBookingMessage('Creating payment order...')

      // Step 1: Create Razorpay order
      const orderResponse = await tenantAPI.createBookingOrder({
        roomId: selectedRoom._id,
        hostelId: selectedHostelId
      })

      console.log('Order response:', orderResponse)
      console.log('Order data:', orderResponse.data)

      const { order, razorpayKeyId, testMode } = orderResponse.data

      // Check if it's test mode (Razorpay not configured)
      if (testMode) {
        setBookingMessage('⚠️ Test Mode: Proceeding without payment gateway...')
        
        // In test mode, directly book the room without payment
        setTimeout(async () => {
          try {
            const bookingResponse = await tenantAPI.bookRoom({
              roomId: selectedRoom._id,
              hostelId: selectedHostelId,
              startDate: bookingData.startDate,
              endDate: bookingData.endDate || undefined,
              additionalInfo: bookingData.additionalInfo ? { notes: bookingData.additionalInfo } : undefined,
              paymentDetails: {
                razorpay_order_id: order.id,
                razorpay_payment_id: `test_payment_${Date.now()}`,
                razorpay_signature: 'test_signature'
              }
            })

            console.log('Booking response:', bookingResponse)
            
            setBookingMessage('✓ Room booked successfully (Test Mode - No payment required)')
            
            // Refresh hostel rooms to update availability
            await fetchHostelRooms(selectedHostelId)
            
            // Close modal after 2.5 seconds
            setTimeout(() => {
              setShowBookingModal(false)
              setSelectedRoom(null)
              setBookingData({ startDate: '', endDate: '', additionalInfo: '' })
              setBookingMessage('')
              setBookingLoading(false)
            }, 2500)
          } catch (error) {
            console.error('Booking error:', error)
            setBookingMessage(error.response?.data?.message || 'Booking failed. Please try again.')
            setBookingLoading(false)
          }
        }, 1000)
        return
      }

      // Step 2: Open Razorpay payment gateway (production mode)
      const options = {
        key: razorpayKeyId,
        amount: order.amount * 100,
        currency: order.currency,
        name: 'SafeStay Hub',
        description: `Booking for Room ${order.roomNumber}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            setBookingMessage('Verifying payment...')
            
            // Step 3: Verify payment and create booking
            const bookingResponse = await tenantAPI.bookRoom({
              roomId: selectedRoom._id,
              hostelId: selectedHostelId,
              startDate: bookingData.startDate,
              endDate: bookingData.endDate || undefined,
              additionalInfo: bookingData.additionalInfo ? { notes: bookingData.additionalInfo } : undefined,
              paymentDetails: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }
            })

            console.log('Booking response:', bookingResponse)
            
            setBookingMessage('✓ Payment successful! Room booked successfully.')
            
            // Refresh hostel rooms to update availability
            await fetchHostelRooms(selectedHostelId)
            
            // Close modal after 2.5 seconds
            setTimeout(() => {
              setShowBookingModal(false)
              setSelectedRoom(null)
              setBookingData({ startDate: '', endDate: '', additionalInfo: '' })
              setBookingMessage('')
              setBookingLoading(false)
            }, 2500)
          } catch (error) {
            console.error('Booking confirmation error:', error)
            setBookingMessage(error.response?.data?.message || 'Payment successful but booking failed. Please contact support.')
            setBookingLoading(false)
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            setBookingMessage('Payment cancelled')
            setBookingLoading(false)
          }
        }
      }

      // Check if Razorpay SDK is loaded
      if (!window.Razorpay) {
        console.error('Razorpay SDK not loaded')
        setBookingMessage('Payment gateway not loaded. Please refresh the page and try again.')
        setBookingLoading(false)
        return
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Payment order error:', error)
      console.error('Error details:', error.response || error)
      setBookingMessage(error.response?.data?.message || error.message || 'Failed to initiate payment. Please try again.')
      setBookingLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'hostel', label: 'My Hostel', icon: '🏢' },
    { id: 'canteen', label: 'Canteen & Food', icon: '🍽️' },
    { id: 'contracts', label: 'My Contracts', icon: '📄' },
    { id: 'expenses', label: 'My Expenses', icon: '💰' },
    { id: 'feedback', label: 'Feedback', icon: '⭐' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-primary text-white transition-all duration-300 overflow-hidden fixed md:relative z-40 h-full flex flex-col`}
      >
        <div className="p-6 flex-1 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-8">SafeStay Hub</h1>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id ? 'bg-white text-primary font-semibold' : 'hover:bg-blue-600'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t border-blue-400">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden text-primary"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h2 className="text-2xl font-bold text-text-dark">
            {menuItems.find((item) => item.id === activeTab)?.label}
          </h2>
          <div className="text-text-muted">Welcome, {user?.name}</div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <>
              {!userInHostel ? (
                <div className="space-y-6">
                  {/* Welcome Message */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-primary rounded-xl p-8 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-5xl">🏠</span>
                      <div>
                        <h2 className="text-3xl font-bold text-primary mb-1">Welcome to SafeStay Hub! 🎉</h2>
                        <p className="text-primary text-sm font-semibold">New Tenant • First Time Login</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-l-4 border-primary">
                      <p className="text-text-dark text-lg mb-2 font-semibold">
                        🔍 You haven't booked a room yet
                      </p>
                      <p className="text-text-muted mb-3">
                        Browse our verified hostels below and find the perfect accommodation for your needs. Each hostel offers quality rooms, amenities, and services.
                      </p>
                      <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-500 text-xl">✓</span>
                          <span className="text-text-muted">Verified Properties</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-500 text-xl">✓</span>
                          <span className="text-text-muted">Instant Booking</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-500 text-xl">✓</span>
                          <span className="text-text-muted">24/7 Support</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hostel Selection */}
                  <div className="card">
                    <h3 className="text-2xl font-bold mb-6 text-text-dark">Choose Your Hostel</h3>
                    
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                          <p className="text-text-muted">Loading available hostels...</p>
                        </div>
                      </div>
                    ) : hostels.length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hostels.map((hostel) => (
                          <div
                            key={hostel._id}
                            className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-primary hover:shadow-xl transition-all"
                          >
                            {/* Hostel Image */}
                            <div className="relative h-48 bg-gray-200 overflow-hidden">
                              {hostel.photos && hostel.photos.length > 0 ? (
                                <img
                                  src={hostel.photos[0].url}
                                  alt={hostel.name}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                                  <span className="text-4xl">🏢</span>
                                </div>
                              )}
                              {/* Verification Badge */}
                              {hostel.verificationStatus === 'verified' && (
                                <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                  ✓ Verified
                                </div>
                              )}
                            </div>

                            {/* Hostel Details */}
                            <div className="p-5">
                              <h4 className="text-lg font-bold text-text-dark mb-1">{hostel.name}</h4>
                              <p className="text-text-muted text-sm mb-4 flex items-center gap-1">
                                📍 {hostel.address?.city}, {hostel.address?.state}
                              </p>

                              {/* Key Details Grid */}
                              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-text-muted text-sm">Type:</span>
                                  <span className="font-semibold text-text-dark">
                                    {hostel.hostelType === 'co-ed' ? '👥 Co-ed' : hostel.hostelType === 'boys' ? '👨 Boys Only' : '👩 Girls Only'}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-text-muted text-sm">Rent Range:</span>
                                  <span className="font-semibold text-accent">₹{hostel.priceRange?.min} - ₹{hostel.priceRange?.max}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-text-muted text-sm">Available Rooms:</span>
                                  <span className="font-semibold text-primary">{hostel.availableRooms || 0}/{hostel.totalRooms || 0}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-text-muted text-sm">Rating:</span>
                                  <span className="font-semibold text-yellow-500">
                                    ⭐ {hostel.rating ? hostel.rating.toFixed(1) : 'N/A'} ({hostel.reviewCount || 0} reviews)
                                  </span>
                                </div>
                              </div>

                              {/* Amenities Preview */}
                              {hostel.amenities && hostel.amenities.length > 0 && (
                                <div className="mb-4">
                                  <p className="text-xs font-semibold text-text-muted mb-2 uppercase">Amenities</p>
                                  <div className="flex flex-wrap gap-2">
                                    {hostel.amenities.slice(0, 3).map((amenity, idx) => (
                                      <span key={idx} className="bg-blue-50 text-primary text-xs px-2 py-1 rounded-full font-medium">
                                        {amenity}
                                      </span>
                                    ))}
                                    {hostel.amenities.length > 3 && (
                                      <span className="bg-gray-100 text-text-muted text-xs px-2 py-1 rounded-full font-medium">
                                        +{hostel.amenities.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Canteen Badge */}
                              {hostel.hasCanteen && (
                                <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
                                  <p className="text-xs font-semibold text-orange-600">🍽️ Has Canteen</p>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    setSelectedHostelId(hostel._id)
                                    await fetchHostelRooms(hostel._id)
                                    setActiveTab('hostel')
                                  }}
                                  className="flex-1 bg-white border-2 border-primary text-primary py-2 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-1"
                                >
                                  👁️ View
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    alert(`Booking functionality for ${hostel.name} will be implemented soon!\n\nPlease contact the hostel owner or visit the hostel details page to book a room.`)
                                  }}
                                  className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-1"
                                >
                                  📝 Book
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-text-muted text-lg">No hostels available at the moment.</p>
                        <p className="text-text-muted mt-2">Please check back later or contact support.</p>
                      </div>
                    )}
                  </div>

                  {/* Quick Info */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="card">
                      <h4 className="text-lg font-bold text-text-dark mb-3">Why Choose SafeStay Hub?</h4>
                      <ul className="space-y-2 text-text-muted text-sm">
                        <li className="flex items-center gap-2">
                          <span className="text-primary">✓</span> Verified Hostels & Properties
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-primary">✓</span> Easy Room Booking
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-primary">✓</span> Integrated Canteen Services
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-primary">✓</span> Digital Contracts & Agreements
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-primary">✓</span> 24/7 Customer Support
                        </li>
                      </ul>
                    </div>

                    <div className="card">
                      <h4 className="text-lg font-bold text-text-dark mb-3">Need Help?</h4>
                      <p className="text-text-muted text-sm mb-4">
                        Our team is here to help you find the perfect hostel that fits your needs and budget.
                      </p>
                      <button className="btn-secondary w-full">Contact Support</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* My Hostel Section */}
                  {myBooking && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl p-8 shadow-lg">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <span className="text-5xl">🏠</span>
                          <div>
                            <h2 className="text-3xl font-bold text-green-700 mb-1">My Hostel</h2>
                            <p className="text-green-600 text-sm font-semibold">
                              Status: {myBooking.status === 'active' ? '✓ Active' : myBooking.status === 'pending_signatures' ? '⏳ Pending' : '📝 Draft'}
                            </p>
                          </div>
                        </div>
                        {myBooking.status === 'active' && (
                          <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                            ✓ Booked
                          </div>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Hostel Details */}
                        <div className="bg-white rounded-lg p-6 shadow-md">
                          <h3 className="text-xl font-bold text-text-dark mb-4 border-b pb-2">🏢 Hostel Details</h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-text-muted text-sm">Hostel Name</p>
                              <p className="font-bold text-lg text-primary">{myBooking.hostel?.name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-text-muted text-sm">Location</p>
                              <p className="font-semibold text-text-dark">
                                📍 {myBooking.hostel?.address?.street}, {myBooking.hostel?.address?.city}, {myBooking.hostel?.address?.state} - {myBooking.hostel?.address?.pincode}
                              </p>
                            </div>
                            <div>
                              <p className="text-text-muted text-sm">Owner Contact</p>
                              <p className="font-semibold text-text-dark">
                                👤 {myBooking.owner?.name || 'N/A'}
                              </p>
                              <p className="font-semibold text-accent">
                                📞 {myBooking.owner?.phone || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Room Details */}
                        <div className="bg-white rounded-lg p-6 shadow-md">
                          <h3 className="text-xl font-bold text-text-dark mb-4 border-b pb-2">🛏️ Room Details</h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-text-muted text-sm">Room Number</p>
                              <p className="font-bold text-2xl text-primary">{myBooking.room?.roomNumber || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-text-muted text-sm">Floor</p>
                              <p className="font-semibold text-text-dark">{myBooking.room?.floor ? `${myBooking.room.floor}${myBooking.room.floor === 1 ? 'st' : myBooking.room.floor === 2 ? 'nd' : myBooking.room.floor === 3 ? 'rd' : 'th'} Floor` : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-text-muted text-sm">Rent</p>
                              <p className="font-bold text-2xl text-accent">₹{myBooking.rent || 'N/A'}/month</p>
                            </div>
                            <div>
                              <p className="text-text-muted text-sm">Security Deposit</p>
                              <p className="font-semibold text-text-dark">₹{myBooking.securityDeposit || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contract Dates */}
                      <div className="mt-6 bg-white rounded-lg p-4 shadow-md">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-text-muted text-sm mb-1">Contract Start</p>
                            <p className="font-semibold text-text-dark">
                              📅 {myBooking.startDate ? new Date(myBooking.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-text-muted text-sm mb-1">Contract End</p>
                            <p className="font-semibold text-text-dark">
                              📅 {myBooking.endDate ? new Date(myBooking.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Ongoing'}
                            </p>
                          </div>
                          <div>
                            <p className="text-text-muted text-sm mb-1">Duration</p>
                            <p className="font-semibold text-primary">
                              {myBooking.startDate && myBooking.endDate 
                                ? `${Math.ceil((new Date(myBooking.endDate) - new Date(myBooking.startDate)) / (1000 * 60 * 60 * 24 * 30))} months`
                                : 'Ongoing'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="mt-6 flex gap-3">
                        <button 
                          onClick={() => setActiveTab('contracts')}
                          className="btn-primary flex-1"
                        >
                          📄 View Contract
                        </button>
                        <button 
                          onClick={() => {
                            if (myBooking.hostel?._id) {
                              setSelectedHostelId(myBooking.hostel._id)
                              fetchHostelRooms(myBooking.hostel._id)
                              setActiveTab('hostel')
                            }
                          }}
                          className="btn-secondary flex-1"
                        >
                          🏢 View Hostel Details
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="stats-card">
                      <p className="text-text-muted text-sm mb-2">Current Hostel</p>
                      <h3 className="text-2xl font-bold text-primary mb-2">{myBooking?.hostel?.name || 'N/A'}</h3>
                      <p className="text-text-muted">Rent: ₹{myBooking?.rent || 'N/A'}/month</p>
                    </div>

                    <div className="stats-card">
                      <p className="text-text-muted text-sm mb-2">Room Number</p>
                      <h3 className="text-2xl font-bold text-accent">{myBooking?.room?.roomNumber || 'N/A'}</h3>
                      <p className="text-text-muted">Floor: {myBooking?.room?.floor || 'N/A'}</p>
                    </div>

                    <div className="stats-card">
                      <p className="text-text-muted text-sm mb-2">Contract Status</p>
                      <h3 className="text-2xl font-bold text-success">
                        {myBooking?.status === 'active' ? '✓ Active' : myBooking?.status === 'pending_signatures' ? 'Pending' : 'Draft'}
                      </h3>
                      <p className="text-text-muted">Since {myBooking?.startDate ? new Date(myBooking.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="card">
                      <h3 className="text-xl font-bold mb-4 text-text-dark">Quick Actions</h3>
                      <div className="space-y-3">
                        <button className="btn-primary w-full text-left py-3">Order Food</button>
                        <button className="btn-secondary w-full text-left py-3">View Contracts</button>
                        <button className="btn-secondary w-full text-left py-3">Submit Feedback</button>
                      </div>
                    </div>

                    <div className="card">
                      <h3 className="text-xl font-bold mb-4 text-text-dark">Recent Notifications</h3>
                      <div className="space-y-3 text-sm">
                        <p className="border-l-4 border-primary pl-3">✓ Payment received for this month</p>
                        <p className="border-l-4 border-accent pl-3">📦 Food order delivered</p>
                        <p className="border-l-4 border-success pl-3">⭐ Your feedback was helpful</p>
                      </div>
                    </div>
                  </div>

                  <button className="sos-button text-lg font-bold">🚨 SOS - EMERGENCY BUTTON</button>
                </div>
              )}
            </>
          )}

          {activeTab === 'hostel' && (
            <div className="space-y-6">
              {selectedHostel ? (
                <>
                  {/* Hostel Header */}
                  <div className="card">
                    <div className="relative">
                      {selectedHostel.verificationStatus === 'verified' && (
                        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 z-10">
                          ✓ Verified
                        </div>
                      )}
                      <div className="md:flex gap-6">
                        <div className="w-full md:w-1/3 h-56 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                          {selectedHostel.photos && selectedHostel.photos.length > 0 ? (
                            <img src={selectedHostel.photos[0].url} alt={selectedHostel.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-6xl">🏢</div>
                          )}
                        </div>

                        <div className="flex-1 p-4">
                          <h2 className="text-2xl font-bold text-text-dark">{selectedHostel.name}</h2>
                          <p className="text-text-muted mt-1">📍 {selectedHostel.address?.street}, {selectedHostel.address?.city}, {selectedHostel.address?.state} - {selectedHostel.address?.pincode}</p>

                          <div className="grid md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <p className="text-text-muted text-sm">Type</p>
                              <p className="font-semibold">{selectedHostel.hostelType === 'co-ed' ? '👥 Co-ed' : selectedHostel.hostelType === 'boys' ? '👨 Boys Only' : '👩 Girls Only'}</p>
                            </div>

                            <div>
                              <p className="text-text-muted text-sm">Rent Range</p>
                              <p className="font-semibold text-accent">₹{selectedHostel.priceRange?.min} - ₹{selectedHostel.priceRange?.max}</p>
                            </div>

                            <div>
                              <p className="text-text-muted text-sm">Available Rooms</p>
                              <p className="font-semibold text-primary">{availableRooms.filter(r => r.isAvailable).length}/{availableRooms.length}</p>
                            </div>

                            <div>
                              <p className="text-text-muted text-sm">Rating</p>
                              <p className="font-semibold text-yellow-500">⭐ {selectedHostel.rating ? selectedHostel.rating.toFixed(1) : 'N/A'} ({selectedHostel.reviewCount || 0} reviews)</p>
                            </div>
                          </div>

                          {selectedHostel.amenities && selectedHostel.amenities.length > 0 && (
                            <div className="mt-4">
                              <p className="text-xs font-semibold text-text-muted mb-2 uppercase">Hostel Amenities</p>
                              <div className="flex flex-wrap gap-2">
                                {selectedHostel.amenities.map((a, i) => (
                                  <span key={i} className="bg-blue-50 text-primary text-xs px-2 py-1 rounded-full font-medium">{a}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Room Filters */}
                  <div className="card">
                    <h3 className="text-xl font-bold text-text-dark mb-4">🔍 Filter Rooms</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Price Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Min"
                            value={priceFilter.min}
                            onChange={(e) => setPriceFilter({ ...priceFilter, min: e.target.value })}
                            className="input flex-1 text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Max"
                            value={priceFilter.max}
                            onChange={(e) => setPriceFilter({ ...priceFilter, max: e.target.value })}
                            className="input flex-1 text-sm"
                          />
                        </div>
                      </div>

                      {/* Room Type Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
                        <select
                          value={roomTypeFilter}
                          onChange={(e) => setRoomTypeFilter(e.target.value)}
                          className="input w-full text-sm"
                        >
                          <option value="all">All Types</option>
                          <option value="single">Single</option>
                          <option value="double">Double</option>
                          <option value="triple">Triple</option>
                          <option value="quad">Quad</option>
                        </select>
                      </div>

                      {/* Floor Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Floor</label>
                        <select
                          value={floorFilter}
                          onChange={(e) => setFloorFilter(e.target.value)}
                          className="input w-full text-sm"
                        >
                          <option value="all">All Floors</option>
                          {[...new Set(availableRooms.map(r => r.floor))].sort((a, b) => a - b).map(floor => (
                            <option key={floor} value={floor}>Floor {floor}</option>
                          ))}
                        </select>
                      </div>

                      {/* Clear Filters */}
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            setPriceFilter({ min: '', max: '' })
                            setRoomTypeFilter('all')
                            setFloorFilter('all')
                            setAmenityFilter([])
                          }}
                          className="btn-secondary w-full text-sm"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>

                    {/* Common Amenities Filter */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Must Have Amenities</label>
                      <div className="flex flex-wrap gap-2">
                        {['WiFi', 'AC', 'Attached Bathroom', 'Balcony', 'Study Table', 'Cupboard'].map(amenity => (
                          <button
                            key={amenity}
                            onClick={() => {
                              if (amenityFilter.includes(amenity)) {
                                setAmenityFilter(amenityFilter.filter(a => a !== amenity))
                              } else {
                                setAmenityFilter([...amenityFilter, amenity])
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                              amenityFilter.includes(amenity)
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {amenity}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Available Rooms */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-text-dark">
                        Available Rooms ({getFilteredRooms().filter(r => r.isAvailable).length})
                      </h3>
                      <button
                        onClick={() => fetchHostelRooms(selectedHostelId)}
                        className="text-primary text-sm hover:underline"
                      >
                        🔄 Refresh
                      </button>
                    </div>

                    {loadingRooms ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                          <p className="text-text-muted">Loading rooms...</p>
                        </div>
                      </div>
                    ) : getFilteredRooms().length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getFilteredRooms().map((room) => (
                          <div
                            key={room._id}
                            className={`border-2 rounded-lg overflow-hidden transition-all ${
                              room.isAvailable
                                ? 'border-gray-200 hover:border-primary hover:shadow-lg'
                                : 'border-gray-100 opacity-60'
                            }`}
                          >
                            {/* Room Image */}
                            <div className="relative h-40 bg-gray-100">
                              {room.photos && room.photos.length > 0 ? (
                                <img
                                  src={room.photos[0].url || room.photos[0]}
                                  alt={`Room ${room.roomNumber}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <span className="text-5xl">🛏️</span>
                                </div>
                              )}
                              
                              {/* Availability Badge */}
                              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                                room.isAvailable ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                              }`}>
                                {room.isAvailable ? '✓ Available' : '✗ Occupied'}
                              </div>
                            </div>

                            {/* Room Details */}
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-bold text-text-dark">Room {room.roomNumber}</h4>
                                  <p className="text-xs text-text-muted">Floor {room.floor}</p>
                                </div>
                                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold uppercase">
                                  {room.roomType}
                                </span>
                              </div>

                              <div className="space-y-2 text-sm mb-3">
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Capacity:</span>
                                  <span className="font-semibold">{room.capacity} persons</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Rent:</span>
                                  <span className="font-bold text-green-600">₹{room.rent}/month</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Deposit:</span>
                                  <span className="font-semibold">₹{room.securityDeposit}</span>
                                </div>
                              </div>

                              {/* Amenities */}
                              {room.amenities && room.amenities.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs font-semibold text-text-muted mb-1">Amenities:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {room.amenities.slice(0, 3).map((amenity, idx) => (
                                      <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                                        {amenity}
                                      </span>
                                    ))}
                                    {room.amenities.length > 3 && (
                                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                                        +{room.amenities.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Book Button */}
                              {room.isAvailable && (
                                <button
                                  onClick={() => {
                                    setSelectedRoom(room)
                                    setShowBookingModal(true)
                                  }}
                                  className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
                                >
                                  📝 Book This Room
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-3">🔍</div>
                        <p className="text-text-muted text-lg">No rooms match your filters</p>
                        <button
                          onClick={() => {
                            setPriceFilter({ min: '', max: '' })
                            setRoomTypeFilter('all')
                            setFloorFilter('all')
                            setAmenityFilter([])
                          }}
                          className="btn-secondary mt-4"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : selectedHostelId ? (
                <div className="card">
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                      <p className="text-text-muted">Loading hostel details...</p>
                    </div>
                  </div>
                </div>
              ) : myBooking ? (
                <div className="space-y-6">
                  {/* Hostel Name Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-primary rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-4">
                      <span className="text-5xl">🏢</span>
                      <div>
                        <h2 className="text-3xl font-bold text-primary">{myBooking.hostel?.name || 'N/A'}</h2>
                        <p className="text-text-muted">📍 {myBooking.hostel?.address?.city}, {myBooking.hostel?.address?.state}</p>
                      </div>
                    </div>
                  </div>

                  {/* My Room Card */}
                  <div className="card">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-text-dark flex items-center gap-2">
                        🛏️ My Room
                      </h3>
                      {myBooking.status === 'active' && (
                        <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                          ✓ Active
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="bg-blue-50 rounded-lg p-6 text-center">
                        <p className="text-text-muted text-sm mb-2">Room Number</p>
                        <p className="text-4xl font-bold text-primary">{myBooking.room?.roomNumber || 'N/A'}</p>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-6 text-center">
                        <p className="text-text-muted text-sm mb-2">Floor</p>
                        <p className="text-4xl font-bold text-purple-600">
                          {myBooking.room?.floor || 'N/A'}
                          <span className="text-lg">
                            {myBooking.room?.floor === 1 ? 'st' : myBooking.room?.floor === 2 ? 'nd' : myBooking.room?.floor === 3 ? 'rd' : 'th'}
                          </span>
                        </p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-6 text-center">
                        <p className="text-text-muted text-sm mb-2">Room Type</p>
                        <p className="text-2xl font-bold text-green-600 capitalize">
                          {myBooking.room?.roomType || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-text-muted text-sm">Occupancy</p>
                          <p className="text-xl font-bold text-text-dark">
                            {myBooking.room?.currentOccupancy || 0} / {myBooking.room?.capacity || 0} persons
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-text-muted text-sm">Monthly Rent</p>
                          <p className="text-3xl font-bold text-accent">₹{myBooking.rent || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Roommates Section */}
                  <div className="card">
                    <h3 className="text-2xl font-bold text-text-dark mb-6 flex items-center gap-2">
                      👥 My Roommates
                      <span className="text-sm font-normal text-text-muted">
                        ({myBooking.room?.tenants?.length || 0} total)
                      </span>
                    </h3>

                    {myBooking.room?.tenants && myBooking.room.tenants.length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myBooking.room.tenants.map((roommate, idx) => (
                          <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border-2 border-blue-200 hover:border-primary transition">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl">
                                {roommate.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-lg text-text-dark">{roommate.name || 'Unknown'}</p>
                                <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
                                  📧 {roommate.email || 'N/A'}
                                </p>
                                {roommate.phone && (
                                  <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
                                    📞 {roommate.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <p className="text-5xl mb-3">👤</p>
                        <p className="text-text-muted">You are the only occupant in this room</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏢</div>
                  <h3 className="text-2xl font-bold text-text-dark mb-2">No Hostel Booked</h3>
                  <p className="text-text-muted mb-6">You haven't booked a room yet. Go to Dashboard to browse available hostels.</p>
                  <button 
                    onClick={() => setActiveTab('overview')}
                    className="btn-primary"
                  >
                    🔍 Browse Hostels
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'canteen' && (
            <div className="card">
              <h3 className="text-2xl font-bold mb-4 text-text-dark">Canteen & Food</h3>
              <p className="text-text-muted">Coming soon...</p>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="card">
              <h3 className="text-2xl font-bold mb-4 text-text-dark">My Contracts</h3>
              <p className="text-text-muted">Coming soon...</p>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="card">
              <h3 className="text-2xl font-bold mb-4 text-text-dark">My Expenses</h3>
              <p className="text-text-muted">Coming soon...</p>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="card">
              <h3 className="text-2xl font-bold mb-4 text-text-dark">Feedback & Suggestions</h3>
              <p className="text-text-muted">Coming soon...</p>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="card">
              <h3 className="text-2xl font-bold mb-4 text-text-dark">Payments</h3>
              <p className="text-text-muted">Coming soon...</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="card">
              <h3 className="text-2xl font-bold mb-4 text-text-dark">Settings</h3>
              <p className="text-text-muted">Coming soon...</p>
            </div>
          )}
        </div>
      </main>

      {/* Booking Modal */}
      {showBookingModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-2xl font-bold text-gray-800">Book Room {selectedRoom.roomNumber}</h3>
              <button
                onClick={() => {
                  setShowBookingModal(false)
                  setSelectedRoom(null)
                  setBookingData({ startDate: '', endDate: '', additionalInfo: '' })
                  setBookingMessage('')
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Success/Error Message */}
              {bookingMessage && (
                <div className={`mb-4 p-4 rounded-lg border-l-4 ${
                  bookingMessage.includes('✓')
                    ? 'bg-green-50 border-green-500 text-green-800'
                    : 'bg-red-50 border-red-500 text-red-800'
                }`}>
                  <p className="font-semibold">{bookingMessage}</p>
                </div>
              )}

              {/* Room Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-bold text-lg mb-3 text-gray-800">Room Details</h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Room Number:</span>
                    <span className="font-semibold">{selectedRoom.roomNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Floor:</span>
                    <span className="font-semibold">{selectedRoom.floor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-semibold uppercase">{selectedRoom.roomType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-semibold">{selectedRoom.capacity} persons</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Rent:</span>
                    <span className="font-bold text-green-600">₹{selectedRoom.rent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security Deposit:</span>
                    <span className="font-bold">₹{selectedRoom.securityDeposit}</span>
                  </div>
                </div>

                {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Amenities:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoom.amenities.map((amenity, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Booking Form */}
              <form onSubmit={handleBookRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingData.startDate}
                    onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                    className="input w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">When would you like to move in?</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                    value={bookingData.endDate}
                    onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                    className="input w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for 11-month default lease</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Information (Optional)
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Any special requests or information for the owner..."
                    value={bookingData.additionalInfo}
                    onChange={(e) => setBookingData({ ...bookingData, additionalInfo: e.target.value })}
                    className="input w-full"
                  />
                </div>

                {/* Total Cost Summary */}
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                  <h5 className="font-bold text-gray-800 mb-2">Initial Payment Required</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>First Month Rent:</span>
                      <span className="font-semibold">₹{selectedRoom.rent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Security Deposit:</span>
                      <span className="font-semibold">₹{selectedRoom.securityDeposit}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t-2 border-blue-300">
                      <span className="font-bold text-lg">Total:</span>
                      <span className="font-bold text-lg text-blue-600">
                        ₹{selectedRoom.rent + selectedRoom.securityDeposit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingModal(false)
                      setSelectedRoom(null)
                      setBookingData({ startDate: '', endDate: '', additionalInfo: '' })
                      setBookingMessage('')
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                    disabled={bookingLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        📝 Confirm Booking
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-3">
                  By booking, you agree to the terms and conditions. The owner will review your request and contact you.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
