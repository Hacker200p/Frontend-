import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LogOut, Menu, X } from 'lucide-react'
import api, { tenantAPI, canteenAPI, contractAPI, authAPI } from '../../services/api'
import PanoramaViewer from '../../components/PanoramaViewer'

const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const normalizeObjectId = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && typeof value.toString === 'function') {
    return value.toString()
  }
  return String(value)
}

const findHostelFeedback = (feedbacks, hostelId) => {
  const normalizedHostelId = normalizeObjectId(hostelId)
  if (!normalizedHostelId) return null
  return feedbacks.find((feedback) => {
    const targetId = feedback?.target?._id || feedback?.targetId
    return normalizeObjectId(targetId) === normalizedHostelId
  }) || null
}

const normalizeWeeklyMenu = (menu = {}) =>
  WEEK_DAYS.reduce((acc, day) => {
    acc[day] = menu?.[day] || ''
    return acc
  }, {})

const createPlanWithMenu = (plan = {}) => ({
  enabled: Boolean(plan?.enabled),
  pure_veg: Number(plan?.pure_veg) || 0,
  veg: Number(plan?.veg) || 0,
  non_veg_mix: Number(plan?.non_veg_mix) || 0,
  weeklyMenu: normalizeWeeklyMenu(plan?.weeklyMenu || {})
})

const createSimplePlan = (plan = {}) => ({
  enabled: Boolean(plan?.enabled),
  pure_veg: Number(plan?.pure_veg) || 0,
  veg: Number(plan?.veg) || 0,
  non_veg_mix: Number(plan?.non_veg_mix) || 0
})

const normalizeSubscriptionPlans = (plans = {}) => {
  const normalized = {
    breakfast: createPlanWithMenu(plans?.breakfast),
    lunch: createPlanWithMenu(plans?.lunch),
    dinner: createPlanWithMenu(plans?.dinner),
    breakfast_lunch: createSimplePlan(plans?.breakfast_lunch),
    lunch_dinner: createSimplePlan(plans?.lunch_dinner),
    all_meals: createSimplePlan(plans?.all_meals)
  }

  return normalized
}

const enrichCanteenWithPlans = (canteen) => {
  if (!canteen) return null
  return {
    ...canteen,
    subscriptionPlans: normalizeSubscriptionPlans(canteen.subscriptionPlans || {})
  }
}

const DEFAULT_FETCH_COOLDOWN = 30000
const LONG_FETCH_COOLDOWN = 60000
export default function TenantDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  
  console.log('TenantDashboard mounted - location.state:', location.state)
  
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [userInHostel, setUserInHostel] = useState(false)
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedHostelId, setSelectedHostelId] = useState(location.state?.selectedHostelId || null)
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
  
  // Canteen state
  const [availableCanteens, setAvailableCanteens] = useState([])
  const [selectedCanteen, setSelectedCanteen] = useState(null)
  const [canteenMenu, setCanteenMenu] = useState([])
  const [mySubscriptions, setMySubscriptions] = useState([])
  const [menuCategory, setMenuCategory] = useState('all')
  const [canteensLoading, setCanteensLoading] = useState(false)
  const [canteenError, setCanteenError] = useState(null)
  
  // Subscription purchase state
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [selectedFoodType, setSelectedFoodType] = useState('pure_veg')
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [expandedSubscriptionPlan, setExpandedSubscriptionPlan] = useState(null)
  
  // Contracts state
  const [myContracts, setMyContracts] = useState([])
  const [contractsLoading, setContractsLoading] = useState(false)
  const [selectedContract, setSelectedContract] = useState(null)
  const [showContractModal, setShowContractModal] = useState(false)
  const [signingContract, setSigningContract] = useState(false)

  // Expenses state
  const [myExpenses, setMyExpenses] = useState([])
  const [expensesLoading, setExpensesLoading] = useState(false)
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [expenseForm, setExpenseForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    rent: 0,
    electricity: 0,
    water: 0,
    food: 0,
    maintenance: 0,
    other: [],
    notes: ''
  })

  // Settings state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    displayName: user?.displayName || user?.name || '',
    bio: user?.bio || '',
    hobbies: Array.isArray(user?.hobbies) ? user.hobbies : [],
    foodPreferences: Array.isArray(user?.foodPreferences) ? user.foodPreferences : []
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(user?.profilePicture || null)
  const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false)
  const [newHobby, setNewHobby] = useState('')
  const [newFoodPref, setNewFoodPref] = useState('')
  
  // SOS Emergency state
  const [showSOSModal, setShowSOSModal] = useState(false)
  const [sosType, setSOSType] = useState('medical') // medical, fire, security, other
  const [sosDescription, setSOSDescription] = useState('')
  const [sosLocation, setSOSLocation] = useState('')
  const [sendingSOS, setSendingSOS] = useState(false)
  const [sosHistory, setSOSHistory] = useState([])
  const [loadingSOSHistory, setLoadingSOSHistory] = useState(false)
  
  // Phone OTP verification state
  const [phoneChangeOTP, setPhoneChangeOTP] = useState('')
  const [showPhoneOTPModal, setShowPhoneOTPModal] = useState(false)
  const [phoneOTPSent, setPhoneOTPSent] = useState(false)
  const [sendingPhoneOTP, setSendingPhoneOTP] = useState(false)
  const [verifyingPhoneOTP, setVerifyingPhoneOTP] = useState(false)
  const [newPhoneNumber, setNewPhoneNumber] = useState('')
  
  // Deletion request state
  const [showDeletionModal, setShowDeletionModal] = useState(false)
  const [deletionReason, setDeletionReason] = useState('')
  const [deletionRequest, setDeletionRequest] = useState(null)
  const [sendingDeletionRequest, setSendingDeletionRequest] = useState(false)

  // Custom Order state
  const [cart, setCart] = useState([]) // { menuItem: item, quantity: number }
  const [showCartModal, setShowCartModal] = useState(false)
  const [orderLoading, setOrderLoading] = useState(false)
  const [myOrders, setMyOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [showOrdersModal, setShowOrdersModal] = useState(false)
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState(false)

  // Feedback state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [selectedOrderForFeedback, setSelectedOrderForFeedback] = useState(null)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  // Hostel rating state
  const [showHostelRatingModal, setShowHostelRatingModal] = useState(false)
  const [hostelRating, setHostelRating] = useState(0)
  const [hostelReview, setHostelReview] = useState('')
  const [hostelRatingLoading, setHostelRatingLoading] = useState(false)
  const [myHostelFeedbacks, setMyHostelFeedbacks] = useState([])
  const [hostelFeedbacksLoading, setHostelFeedbacksLoading] = useState(false)
  const [feedbackUpdateTrigger, setFeedbackUpdateTrigger] = useState(0)

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const fetchTimestampsRef = useRef({})
  const canRunFetch = (key, cooldown = DEFAULT_FETCH_COOLDOWN, force = false) => {
    if (force) {
      fetchTimestampsRef.current[key] = Date.now()
      return true
    }
    const now = Date.now()
    const lastTimestamp = fetchTimestampsRef.current[key] || 0
    if (now - lastTimestamp < cooldown) {
      return false
    }
    fetchTimestampsRef.current[key] = now
    return true
  }

  // Video modal state
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [currentVideoUrl, setCurrentVideoUrl] = useState('')

  // Panorama modal state
  const [showPanoramaPreview, setShowPanoramaPreview] = useState(false)
  const [panoramaPreview, setPanoramaPreview] = useState(null)

  // Fetch feedbacks when feedback tab is opened
  useEffect(() => {
    if (activeTab === 'feedback') {
      fetchHostelFeedbacks()
    }
  }, [activeTab])

  useEffect(() => {
    // Check if user has any active contracts/bookings
    const checkUserBookingStatus = async () => {
      try {
        console.log('Checking user booking status...')
        
        // Fetch both contracts and hostels in parallel
        const [contractsResponse, hostelsResponse] = await Promise.all([
          tenantAPI.getMyContracts(),
          tenantAPI.searchHostels({ page: 1, limit: 100, showAll: true })
        ])
        
        const contracts = contractsResponse.data?.data || []
        console.log('User contracts:', contracts)
        
        const hostelsData = hostelsResponse.data?.data || []
        console.log('Available hostels:', hostelsData.length)
        
        // Store contracts in state
        setMyContracts(contracts)
        
        // If user has active contracts, they're in a hostel
        const hasActive = contracts.some(contract => 
          contract.status === 'active' || contract.status === 'pending_signatures' || contract.status === 'draft'
        )
        
        // Get the most recent active booking
        const activeContract = contracts.find(contract => 
          contract.status === 'active' || contract.status === 'pending_signatures' || contract.status === 'draft'
        )
        
        // Update all states together to prevent intermediate renders
        setMyBooking(activeContract || null)
        setHasActiveBooking(hasActive)
        setUserInHostel(hasActive || user?.currentHostel ? true : false)
        setHostels(hostelsData)
        
        // Also load feedbacks if user has contracts
        if (contracts.length > 0) {
          fetchHostelFeedbacks()
        }
        
      } catch (error) {
        console.error('Error checking booking status:', error)
        // If API fails, still try to fetch hostels
        try {
          const hostelsResponse = await tenantAPI.searchHostels({ page: 1, limit: 100, showAll: true })
          setHostels(hostelsResponse.data?.data || [])
        } catch (err) {
          console.error('Error fetching hostels:', err)
          setHostels([])
        }
        // Reset booking states on error
        setMyContracts([])
        setMyBooking(null)
        setHasActiveBooking(false)
        setUserInHostel(false)
      }
    }

    const loadData = async () => {
      setLoading(true)
      await checkUserBookingStatus()
      setLoading(false)
    }
    
    loadData()
    
    // Set up auto-refresh every 60 seconds to check for contract updates
    const refreshInterval = setInterval(() => {
      checkUserBookingStatus()
    }, 60000)
    
    return () => clearInterval(refreshInterval)
  }, [])

  // Handle redirect from landing page
  useEffect(() => {
    console.log('Checking for redirect - location.state:', location.state)
    console.log('Hostels loaded:', hostels.length)
    
    if (location.state?.selectedHostelId) {
      const hostelId = location.state.selectedHostelId
      console.log('Redirecting to hostel from landing page:', hostelId)
      
      if (hostels.length > 0) {
        // Find and select the hostel
        const hostel = hostels.find(h => h._id === hostelId)
        if (hostel) {
          console.log('Found hostel:', hostel.name)
          setSelectedHostelId(hostelId)
          setSelectedHostel(hostel)
          setActiveTab('overview')
          
          // Fetch rooms for this hostel
          fetchHostelRooms(hostelId)
          
          // Clear the navigation state
          window.history.replaceState({}, document.title)
        } else {
          console.log('Hostel not found in list, available hostels:', hostels.map(h => h._id))
        }
      } else {
        console.log('Waiting for hostels to load...')
      }
    } else {
      console.log('No redirect hostel ID in location state')
    }
  }, [location.state, hostels])

  // Update profile form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        displayName: user.displayName || '',
        bio: user.bio || '',
        hobbies: Array.isArray(user.hobbies) ? user.hobbies : [],
        foodPreferences: Array.isArray(user.foodPreferences) ? user.foodPreferences : []
      })
      // Set profile picture preview if exists
      if (user.profileImage) {
        setProfilePicturePreview(user.profileImage)
      }
      fetchDeletionRequestStatus()
    }
  }, [user])

  // Load data when switching tabs
  useEffect(() => {
    if (activeTab === 'canteen') {
      fetchAvailableCanteens()
      fetchMySubscriptions()
      fetchMyOrders()
      
      // Auto-refresh orders every 60 seconds when on canteen tab
      const interval = setInterval(() => {
        fetchMyOrders()
      }, 60000)
      
      return () => clearInterval(interval)
    } else if (activeTab === 'contracts') {
      fetchMyContracts()
    } else if (activeTab === 'expenses') {
      fetchMyExpenses()
    } else if (activeTab === 'feedback') {
      fetchHostelFeedbacks()
      fetchMyOrders()
    }
  }, [activeTab])

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

    // Validate minimum 1 month duration if end date is provided
    if (bookingData.endDate) {
      const start = new Date(bookingData.startDate)
      const end = new Date(bookingData.endDate)
      const diffTime = Math.abs(end - start)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 30) {
        setBookingMessage('❌ Minimum booking duration is 1 month (30 days)')
        return
      }
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

      // Check if Razorpay SDK is loaded, if not load it dynamically
      if (!window.Razorpay) {
        console.log('Razorpay SDK not found, loading dynamically...')
        setBookingMessage('Loading payment gateway...')
        
        // Load Razorpay SDK dynamically
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        script.onload = () => {
          console.log('Razorpay SDK loaded successfully')
          setBookingMessage('Opening payment gateway...')
          const razorpay = new window.Razorpay(options)
          razorpay.open()
        }
        script.onerror = () => {
          console.error('Failed to load Razorpay SDK')
          setBookingMessage('Failed to load payment gateway. Please check your internet connection and try again.')
          setBookingLoading(false)
        }
        document.head.appendChild(script)
      } else {
        const razorpay = new window.Razorpay(options)
        razorpay.open()
      }
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

  // Utility function to format address from various formats
  const formatAddress = (addressData) => {
    if (!addressData) return ''
    
    let address = addressData
    
    // Handle stringified object format like "{ street: 'unit 5', ... }"
    if (typeof address === 'string' && address.includes('street:')) {
      const streetMatch = address.match(/street:\s*'([^']*)'/)
      const cityMatch = address.match(/city:\s*'([^']*)'/)
      const stateMatch = address.match(/state:\s*'([^']*)'/)
      const pincodeMatch = address.match(/pincode:\s*'([^']*)'/)
      
      const street = streetMatch ? streetMatch[1] : ''
      const city = cityMatch ? cityMatch[1] : ''
      const state = stateMatch ? stateMatch[1] : ''
      const pincode = pincodeMatch ? pincodeMatch[1] : ''
      
      return `${street}, ${city}, ${state} - ${pincode}`
        .replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').replace(/\s*-\s*$/, '').trim()
    }
    
    // Handle actual object format
    if (typeof address === 'object' && address !== null) {
      return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`
        .replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').replace(/\s*-\s*$/, '').trim()
    }
    
    // Already a proper string
    return address
  }

  const fetchAvailableCanteens = async ({ force = false } = {}) => {
    if (!canRunFetch('availableCanteens', LONG_FETCH_COOLDOWN, force)) {
      return
    }
    setCanteensLoading(true)
    setCanteenError(null)
    try {
      console.log('Fetching available canteens...')
      const response = await canteenAPI.getAvailableCanteens()
      console.log('Canteens response:', response.data)
      const canteenData = response.data?.data || []
      const normalizedCanteens = canteenData.map(enrichCanteenWithPlans)
      setAvailableCanteens(normalizedCanteens)

      if (selectedCanteen) {
        const updatedSelection = normalizedCanteens.find(
          (canteen) => normalizeObjectId(canteen?._id) === normalizeObjectId(selectedCanteen?._id)
        )
        if (updatedSelection) {
          setSelectedCanteen(updatedSelection)
        }
      }
      
      if (!canteenData.length) {
        const msg = response.data?.message || 'No canteens found. Make sure you have an active room booking.'
        setCanteenError(msg)
      }
    } catch (error) {
      console.error('Error fetching canteens:', error)
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load canteens'
      setCanteenError(errorMsg)
    } finally {
      setCanteensLoading(false)
    }
  }

  const fetchCanteenMenu = async (canteenId) => {
    try {
      const response = await canteenAPI.getCanteenMenu(canteenId)
      setCanteenMenu(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching menu:', error)
    }
  }

  const fetchMySubscriptions = async ({ force = false } = {}) => {
    if (!canRunFetch('mySubscriptions', LONG_FETCH_COOLDOWN, force)) {
      return
    }
    try {
      const response = await canteenAPI.getMySubscriptions()
      setMySubscriptions(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    }
  }

  const fetchMyContracts = async ({ force = false } = {}) => {
    if (!canRunFetch('myContracts', LONG_FETCH_COOLDOWN, force)) {
      return
    }
    setContractsLoading(true)
    try {
      const response = await tenantAPI.getMyContracts()
      const contracts = response.data?.data || []
      console.log('Fetched contracts:', contracts)
      setMyContracts(Array.isArray(contracts) ? contracts : [])
    } catch (error) {
      console.error('Error fetching contracts:', error)
      setMyContracts([])
      alert('Failed to load contracts: ' + (error.response?.data?.message || error.message))
    } finally {
      setContractsLoading(false)
    }
  }

  const handleViewContract = (contract) => {
    setSelectedContract(contract)
    setShowContractModal(true)
  }

  const handleSignContract = async (contractId) => {
    if (!window.confirm('Are you sure you want to sign this contract? This action cannot be undone.')) {
      return
    }

    setSigningContract(true)
    try {
      const response = await contractAPI.signContract(contractId)
      alert('Contract signed successfully!')
      fetchMyContracts()
      setShowContractModal(false)
    } catch (error) {
      console.error('Error signing contract:', error)
      alert(error.response?.data?.message || 'Failed to sign contract')
    } finally {
      setSigningContract(false)
    }
  }

  const handleContactOwner = (contract) => {
    const message = `Hi, I'm ${user?.name}, tenant of Room ${contract.room?.roomNumber} in ${contract.hostel?.name}. I would like to discuss about the contract.`
    const phoneNumber = contract.owner?.phone?.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const fetchMyExpenses = async (year = selectedYear, month = null) => {
    setExpensesLoading(true)
    try {
      let url = `/tenant/expenses?year=${year}`
      if (month) url += `&month=${month}`
      
      const response = await tenantAPI.getExpenses()
      setMyExpenses(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
      setMyExpenses([])
    } finally {
      setExpensesLoading(false)
    }
  }

  const handleAddExpense = () => {
    setEditingExpense(null)
    setExpenseForm({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      rent: 0,
      electricity: 0,
      water: 0,
      food: 0,
      maintenance: 0,
      other: [],
      notes: ''
    })
    setShowAddExpenseModal(true)
  }

  const handleEditExpense = (expense) => {
    setEditingExpense(expense)
    setExpenseForm({
      month: expense.month,
      year: expense.year,
      rent: expense.rent || 0,
      electricity: expense.electricity || 0,
      water: expense.water || 0,
      food: expense.food || 0,
      maintenance: expense.maintenance || 0,
      other: expense.other || [],
      notes: expense.notes || ''
    })
    setShowAddExpenseModal(true)
  }

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return
    }

    try {
      await tenantAPI.deleteExpense(expenseId)
      alert('Expense deleted successfully!')
      fetchMyExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert(error.response?.data?.message || 'Failed to delete expense')
    }
  }

  const handleExpenseFormChange = (field, value) => {
    setExpenseForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddOtherExpense = () => {
    setExpenseForm(prev => ({
      ...prev,
      other: [...prev.other, { description: '', amount: 0 }]
    }))
  }

  const handleRemoveOtherExpense = (index) => {
    setExpenseForm(prev => ({
      ...prev,
      other: prev.other.filter((_, i) => i !== index)
    }))
  }

  const handleOtherExpenseChange = (index, field, value) => {
    setExpenseForm(prev => ({
      ...prev,
      other: prev.other.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const handleSubmitExpense = async () => {
    try {
      console.log('Submitting expense:', expenseForm)
      const response = await tenantAPI.addExpense(expenseForm)
      console.log('Expense saved:', response)
      alert('Expense saved successfully!')
      setShowAddExpenseModal(false)
      fetchMyExpenses()
    } catch (error) {
      console.error('Error saving expense:', error)
      console.error('Error response:', error.response)
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save expense'
      alert('Failed to save expense: ' + errorMsg)
    }
  }

  const handleProfileFormChange = (field, value) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePasswordFormChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUpdateProfile = async () => {
    // Check if phone number has changed
    if (profileForm.phone !== user?.phone) {
      // Validate phone number
      if (!/^[0-9]{10}$/.test(profileForm.phone)) {
        showToast('Phone number must be 10 digits', 'error')
        return
      }
      // Show OTP modal for phone verification
      setNewPhoneNumber(profileForm.phone)
      setShowPhoneOTPModal(true)
      return
    }
    
    setSavingProfile(true)
    try {
      let uploadedImageUrl = null;

      // Upload profile picture first if a new file was selected
      if (profilePicture && profilePicture instanceof File) {
        try {
          showToast('Uploading profile photo...', 'info')
          const photoResponse = await authAPI.uploadProfilePhoto(profilePicture)
          if (photoResponse.data?.data?.profileImage) {
            uploadedImageUrl = photoResponse.data.data.profileImage
            setProfilePicturePreview(uploadedImageUrl) // Update preview with uploaded URL
            showToast('Profile photo uploaded successfully!', 'success')
          }
        } catch (photoError) {
          console.error('Error uploading profile photo:', photoError)
          showToast(photoError.response?.data?.message || 'Failed to upload profile photo', 'error')
          // Continue with profile update even if photo upload fails
        }
      }

      // Update profile data
      const updateData = {
        email: profileForm.email,
        displayName: profileForm.displayName,
        bio: profileForm.bio,
        hobbies: profileForm.hobbies,
        foodPreferences: profileForm.foodPreferences
      }

      const response = await authAPI.updateProfile(updateData)
      showToast('Profile updated successfully!', 'success')
      
      // Update local user data
      if (response.data?.data) {
        // Merge the uploaded image URL if available
        const updatedUser = {
          ...response.data.data,
          profileImage: uploadedImageUrl || response.data.data.profileImage
        }
        useAuthStore.getState().setUser(updatedUser)
        setProfilePicture(null) // Clear the file object after successful upload
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      showToast(error.response?.data?.message || 'Failed to update profile', 'error')
    } finally {
      setSavingProfile(false)
    }
  }
  
  const handleSendPhoneOTP = async () => {
    setSendingPhoneOTP(true)
    try {
      await api.post('/auth/send-phone-change-otp', { newPhone: newPhoneNumber })
      setPhoneOTPSent(true)
      alert('OTP sent to your new phone number!')
    } catch (error) {
      console.error('Error sending OTP:', error)
      alert(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setSendingPhoneOTP(false)
    }
  }
  
  const handleVerifyPhoneOTP = async () => {
    if (!phoneChangeOTP || phoneChangeOTP.length !== 6) {
      showToast('Please enter a valid 6-digit OTP', 'error')
      return
    }
    
    setVerifyingPhoneOTP(true)
    try {
      const response = await api.post('/auth/verify-phone-change-otp', {
        newPhone: newPhoneNumber,
        otp: phoneChangeOTP
      })
      alert('Phone number updated successfully!')
      // Update local user data
      if (response.data?.data) {
        useAuthStore.getState().setUser(response.data.data)
        setProfileForm(prev => ({ ...prev, phone: response.data.data.phone }))
      }
      // Close modal and reset state
      setShowPhoneOTPModal(false)
      setPhoneChangeOTP('')
      setPhoneOTPSent(false)
      setNewPhoneNumber('')
    } catch (error) {
      console.error('Error verifying OTP:', error)
      alert(error.response?.data?.message || 'Failed to verify OTP')
    } finally {
      setVerifyingPhoneOTP(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New password and confirm password do not match!', 'error')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      showToast('Password must be at least 6 characters long!', 'error')
      return
    }

    setChangingPassword(true)
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      })
      showToast('Password changed successfully!', 'success')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error changing password:', error)
      showToast(error.response?.data?.message || 'Failed to change password', 'error')
    } finally {
      setChangingPassword(false)
    }
  }
  
  const fetchDeletionRequestStatus = async () => {
    try {
      const response = await tenantAPI.getDeletionRequest()
      if (response.data?.data) {
        setDeletionRequest(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching deletion request:', error)
    }
  }
  
  const handleRequestDeletion = async () => {
    if (!deletionReason || deletionReason.trim().length === 0) {
      showToast('Please provide a reason for account deletion', 'error')
      return
    }
    
    setSendingDeletionRequest(true)
    try {
      const response = await tenantAPI.requestDeletion({ reason: deletionReason })
      showToast('Deletion request sent to hostel owner. You will be notified once it is reviewed.', 'success')
      setDeletionRequest(response.data?.data)
      setShowDeletionModal(false)
      setDeletionReason('')
    } catch (error) {
      console.error('Error requesting deletion:', error)
      showToast(error.response?.data?.message || 'Failed to send deletion request', 'error')
    } finally {
      setSendingDeletionRequest(false)
    }
  }
  
  // SOS Emergency Functions
  const fetchSOSHistory = async () => {
    try {
      setLoadingSOSHistory(true)
      const response = await tenantAPI.getSOSHistory()
      if (response.data?.data) {
        setSOSHistory(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching SOS history:', error)
    } finally {
      setLoadingSOSHistory(false)
    }
  }

  const handleSendSOS = async () => {
    if (!sosDescription.trim()) {
      showToast('Please provide emergency details', 'error')
      return
    }

    try {
      setSendingSOS(true)
      await tenantAPI.sendSOS({
        type: sosType,
        description: sosDescription,
        location: sosLocation || 'Current hostel location'
      })
      showToast('SOS Alert sent successfully! Help is on the way.', 'success')
      setShowSOSModal(false)
      setSOSDescription('')
      setSOSLocation('')
      setSOSType('medical')
      await fetchSOSHistory()
    } catch (error) {
      console.error('Error sending SOS:', error)
      showToast(error.response?.data?.message || 'Failed to send SOS alert', 'error')
    } finally {
      setSendingSOS(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'sos') {
      fetchSOSHistory()
    }
  }, [activeTab])
  
  const handleCancelDeletionRequest = async () => {
    if (!confirm('Are you sure you want to cancel your deletion request?')) return
    
    try {
      await tenantAPI.cancelDeletionRequest(deletionRequest._id)
      alert('Deletion request cancelled')
      setDeletionRequest(null)
    } catch (error) {
      console.error('Error cancelling deletion request:', error)
      alert(error.response?.data?.message || 'Failed to cancel deletion request')
    }
  }

  const handleSubscribeClick = (planKey, plan) => {
    setSelectedPlan({ key: planKey, data: plan })
    setShowSubscriptionModal(true)
  }

  const handleSubscriptionPurchase = async () => {
    if (!selectedCanteen || !selectedPlan || !selectedFoodType) {
      alert('Please select all options')
      return
    }

    const plan = selectedPlan.data
    const price = plan[selectedFoodType]

    if (!price || price <= 0) {
      alert('This food type is not available for this plan')
      return
    }

    try {
      setSubscriptionLoading(true)

      // Create subscription order
      const orderResponse = await canteenAPI.createSubscriptionOrder({
        canteen: selectedCanteen._id,
        mealPlan: selectedPlan.key,
        foodType: selectedFoodType,
        amount: price,
      })

      const { razorpayOrderId, subscriptionOrderId } = orderResponse.data?.data

      if (!razorpayOrderId || !subscriptionOrderId) {
        throw new Error('Failed to create order - missing order IDs')
      }

      // Fetch Razorpay key from backend
      const configResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/payment-config`)
      const configData = await configResponse.json()
      const razorpayKeyId = configData.data?.razorpayKeyId

      if (!razorpayKeyId) {
        throw new Error('Payment configuration not available')
      }
      
      // Check if Razorpay is available
      if (!window.Razorpay) {
        // Load Razorpay script dynamically
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = resolve
          script.onerror = reject
          document.body.appendChild(script)
        })
      }

      if (!window.Razorpay) {
        throw new Error('Failed to load Razorpay. Please check your internet connection.')
      }

      // Initialize Razorpay payment
      const options = {
        key: razorpayKeyId,
        amount: price * 100, // Amount in paise
        currency: 'INR',
        name: 'SafeStay',
        description: `${selectedPlan.key.replace('_', ' ')} - ${selectedFoodType.replace('_', ' ')} (${selectedCanteen.name})`,
        order_id: razorpayOrderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#2563eb',
        },
        handler: async (response) => {
          try {
            console.log('Payment successful:', response)
            
            // Verify payment with backend
            const verifyResponse = await canteenAPI.verifySubscriptionPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              subscriptionOrderId: subscriptionOrderId,
            })

            if (verifyResponse.data?.success) {
              setSubscriptionLoading(false)
              showToast('Subscription activated successfully! You will receive meals starting tomorrow.', 'success')
              setShowSubscriptionModal(false)
              setSelectedPlan(null)
              setSelectedFoodType('pure_veg')
              await fetchMySubscriptions({ force: true })
            } else {
              throw new Error(verifyResponse.data?.message || 'Payment verification failed')
            }
          } catch (error) {
            console.error('Payment verification error:', error)
            setSubscriptionLoading(false)
            const errorMsg = error.response?.data?.message || error.message || 'Unknown error'
            showToast('Payment verification failed: ' + errorMsg + '. Please contact support if the issue persists.', 'error')
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed')
            setSubscriptionLoading(false)
          }
        },
        onerror: (error) => {
          console.error('Razorpay error:', error)
          setSubscriptionLoading(false)
          showToast('Payment failed: ' + (error.description || 'Unknown error occurred'), 'error')
        }
      }

      try {
        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', (response) => {
          console.error('Payment failed:', response)
          setSubscriptionLoading(false)
          showToast('Payment failed: ' + response.error.description, 'error')
        })
        rzp.open()
      } catch (error) {
        console.error('Error opening Razorpay:', error)
        setSubscriptionLoading(false)
        showToast('Error opening payment gateway: ' + error.message, 'error')
      }
    } catch (error) {
      console.error('Error in subscription purchase:', error)
      setSubscriptionLoading(false)
      showToast('Failed to process subscription: ' + (error.response?.data?.message || error.message), 'error')
    }
  }

  // Cart Functions
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.menuItem._id === item._id)
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.menuItem._id === item._id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ))
    } else {
      setCart([...cart, { menuItem: item, quantity: 1 }])
    }
  }

  const removeFromCart = (itemId) => {
    setCart(cart.filter(cartItem => cartItem.menuItem._id !== itemId))
  }

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
    } else {
      setCart(cart.map(cartItem => 
        cartItem.menuItem._id === itemId 
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      ))
    }
  }

  const calculateCartTotal = () => {
    const itemsTotal = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0)
    const deliveryCharge = selectedCanteen?.deliveryCharge || 0
    return { itemsTotal, deliveryCharge, total: itemsTotal + deliveryCharge }
  }

  const fetchMyOrders = async ({ force = false } = {}) => {
    if (!canRunFetch('myOrders', DEFAULT_FETCH_COOLDOWN, force)) {
      return
    }
    setOrdersLoading(true)
    try {
      const response = await canteenAPI.getMyOrders()
      setMyOrders(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  const placeOrder = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty')
      return
    }

    if (!selectedCanteen) {
      alert('Please select a canteen first')
      return
    }

    try {
      setOrderLoading(true)

      // Prepare order items
      const items = cart.map(item => ({
        menuItem: item.menuItem._id,
        quantity: item.quantity
      }))

      // Create order
      const orderResponse = await canteenAPI.createOrder({
        canteen: selectedCanteen._id,
        items,
        specialInstructions: ''
      })

      const { razorpayOrderId, razorpayKeyId, amount, data: order } = orderResponse.data

      if (!razorpayOrderId || !razorpayKeyId) {
        throw new Error('Failed to create order - missing payment details')
      }

      // Initialize Razorpay
      const options = {
        key: razorpayKeyId,
        amount: amount * 100,
        currency: 'INR',
        name: selectedCanteen.name,
        description: 'Food Order',
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            // Verify payment
            const verifyResponse = await canteenAPI.verifyOrderPayment({
              orderId: order._id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })

            if (verifyResponse.data?.success) {
              setOrderLoading(false)
              showToast('Order placed successfully! Your food will be delivered soon.', 'success')
              setCart([])
              setShowCartModal(false)
              await fetchMyOrders({ force: true })
            } else {
              throw new Error(verifyResponse.data?.message || 'Payment verification failed')
            }
          } catch (error) {
            console.error('Payment verification error:', error)
            setOrderLoading(false)
            showToast('Payment verification failed: ' + (error.response?.data?.message || error.message), 'error')
          }
        },
        modal: {
          ondismiss: () => {
            setOrderLoading(false)
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone
        },
        theme: {
          color: '#10b981'
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        console.error('Payment failed:', response)
        setOrderLoading(false)
        showToast('Payment failed: ' + response.error.description, 'error')
      })
      rzp.open()
    } catch (error) {
      console.error('Error placing order:', error)
      setOrderLoading(false)
      showToast('Failed to place order: ' + (error.response?.data?.message || error.message), 'error')
    }
  }

  const openFeedbackModal = (order) => {
    setSelectedOrderForFeedback(order)
    setFeedbackRating(0)
    setFeedbackComment('')
    setShowFeedbackModal(true)
  }

  const submitOrderFeedback = async () => {
    if (feedbackRating === 0) {
      alert('Please provide a rating')
      return
    }

    if (!feedbackComment.trim()) {
      alert('Please provide a comment')
      return
    }

    try {
      setFeedbackLoading(true)
      await tenantAPI.submitOrderFeedback(selectedOrderForFeedback._id, {
        rating: feedbackRating,
        comment: feedbackComment.trim()
      })

      alert('✓ Feedback submitted successfully!')
      setShowFeedbackModal(false)
      setSelectedOrderForFeedback(null)
      setFeedbackRating(0)
      setFeedbackComment('')
      
      // Refresh orders to update feedback status
      await fetchMyOrders({ force: true })
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Failed to submit feedback: ' + (error.response?.data?.message || error.message))
    } finally {
      setFeedbackLoading(false)
    }
  }

  // Fetch hostel feedbacks
  const fetchHostelFeedbacks = async ({ force = false } = {}) => {
    if (!canRunFetch('hostelFeedbacks', LONG_FETCH_COOLDOWN, force)) {
      return myHostelFeedbacks
    }
    setHostelFeedbacksLoading(true)
    try {
      const response = await tenantAPI.getMyFeedbacks()
      console.log('Fetched feedbacks response:', response.data)
      const feedbacks = response.data?.data || []
      console.log('Setting feedbacks:', feedbacks)
      setMyHostelFeedbacks(feedbacks)
      console.log('Feedbacks state updated')
      return feedbacks
    } catch (error) {
      console.error('Error fetching hostel feedbacks:', error)
      return []
    } finally {
      setHostelFeedbacksLoading(false)
    }
  }

  // Submit hostel rating
  const submitHostelRating = async () => {
    if (hostelRating === 0) {
      showToast('Please provide a rating', 'error')
      return
    }

    if (!hostelReview.trim()) {
      showToast('Please write a review', 'error')
      return
    }

    // Find active contract to get hostel ID
    const activeContract = myContracts.find(c => c.status === 'active')
    if (!activeContract || !activeContract.hostel) {
      showToast('You need to have an active contract to rate a hostel', 'error')
      return
    }

    try {
      setHostelRatingLoading(true)
      
      // Check if updating existing rating
      const existingRating = findHostelFeedback(myHostelFeedbacks, activeContract.hostel?._id)
      console.log('📝 Submitting feedback...')
      console.log('Existing rating:', existingRating)
      console.log('New rating:', hostelRating)
      console.log('New review:', hostelReview)
      
      const response = await tenantAPI.submitFeedback({
        targetType: 'hostel',
        targetId: activeContract.hostel._id,
        rating: hostelRating,
        comment: hostelReview.trim()
      })
      
      console.log('✅ Submit feedback response:', response.data)

      // Clear the fetch cooldown to allow immediate refresh
      fetchTimestampsRef.current['hostelFeedbacks'] = 0
      
      // Wait for backend to process
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Refresh feedbacks multiple times to ensure update
      console.log('🔄 Fetching updated feedbacks (attempt 1)...')
      let updatedFeedbacks = await fetchHostelFeedbacks({ force: true })
      
      // If feedback not found, try again
      if (!findHostelFeedback(updatedFeedbacks, activeContract.hostel._id)) {
        console.log('⏳ Feedback not found, retrying...')
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log('🔄 Fetching updated feedbacks (attempt 2)...')
        updatedFeedbacks = await fetchHostelFeedbacks({ force: true })
      }
      
      console.log('📋 Updated feedbacks received:', updatedFeedbacks)
      
      // Update state directly to force immediate re-render
      const newFeedback = findHostelFeedback(updatedFeedbacks, activeContract.hostel._id)
      if (newFeedback) {
        console.log('✨ Found updated feedback:', newFeedback)
        // Force state update
        setMyHostelFeedbacks([...updatedFeedbacks])
      }
      
      // Force re-render with timestamp
      setFeedbackUpdateTrigger(Date.now())
      
      // Show success message
      showToast(existingRating ? '✓ Rating updated successfully!' : '✓ Hostel rating submitted successfully!', 'success')
      
      // Close modal after a brief moment
      setTimeout(() => {
        setShowHostelRatingModal(false)
        setHostelRating(0)
        setHostelReview('')
      }, 500)
      
    } catch (error) {
      console.error('❌ Error submitting hostel rating:', error)
      console.error('Error details:', error.response?.data)
      showToast('Failed to submit rating: ' + (error.response?.data?.message || error.message), 'error')
    } finally {
      setHostelRatingLoading(false)
    }
  }

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'hostel', label: 'My Hostel', icon: '🏢' },
    { id: 'canteen', label: 'Canteen & Food', icon: '🍽️' },
    { id: 'contracts', label: 'My Contracts', icon: '📄' },
    { id: 'expenses', label: 'My Expenses', icon: '💰' },
    { id: 'feedback', label: 'Feedback', icon: '⭐' },
    { id: 'sos', label: 'SOS Emergency', icon: '🆘' },
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
          <div className="flex items-center gap-4">
            <div className="text-text-muted hidden md:block">Welcome, {profileForm.displayName || user?.name}</div>
            <button
              onClick={() => setActiveTab('settings')}
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg hover:shadow-lg hover:scale-110 transition-all duration-300 cursor-pointer overflow-hidden border-2 border-white shadow-md"
              title="Go to Profile"
            >
              {profilePicturePreview ? (
                <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
              )}
            </button>
          </div>
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
                    ) : !hostels || hostels.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-text-muted text-lg">No hostels available at the moment.</p>
                        <p className="text-text-muted mt-2">Please check back later or contact support.</p>
                      </div>
                    ) : (
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
                  {/* Pending Approval Banner */}
                  {myBooking && (myBooking.status === 'pending_signatures' || myBooking.status === 'draft') && (
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 shadow-lg">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">⏳</span>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-yellow-800 mb-1">Booking Pending Approval</h3>
                          <p className="text-yellow-700 text-sm">Your booking request is waiting for the hostel owner's approval. You will be notified once approved.</p>
                        </div>
                        <button
                          onClick={() => window.location.reload()}
                          className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition"
                        >
                          🔄 Refresh Status
                        </button>
                      </div>
                    </div>
                  )}

                  {/* My Hostel Section */}
                  {myBooking && (
                    <div className={`rounded-xl p-8 shadow-lg border-2 ${
                      myBooking.status === 'active' 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-500' 
                        : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300'
                    }`}>
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <span className="text-5xl">🏠</span>
                          <div>
                            <h2 className={`text-3xl font-bold mb-1 ${
                              myBooking.status === 'active' ? 'text-green-700' : 'text-gray-700'
                            }`}>My Hostel</h2>
                            <p className={`text-sm font-semibold ${
                              myBooking.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                            }`}>
                              Status: {myBooking.status === 'active' ? '✓ Active' : myBooking.status === 'pending_signatures' ? '⏳ Pending Approval' : '📝 Draft'}
                            </p>
                          </div>
                        </div>
                        {myBooking.status === 'active' ? (
                          <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                            ✓ Booked
                          </div>
                        ) : (
                          <div className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                            ⏳ Pending
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
                      <p className="text-text-muted">Rent: ₹{myBooking?.monthlyRent || 'N/A'}/month</p>
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

                  {/* Profile Information Card */}
                  {(user?.foodPreferences?.length > 0 || user?.hobbies?.length > 0 || user?.bio) && (
                    <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                      <h3 className="text-xl font-bold mb-4 text-text-dark flex items-center gap-2">
                        <span>👤</span>
                        <span>Your Profile</span>
                      </h3>
                      
                      {user?.bio && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-1">About Me</p>
                          <p className="text-gray-600 text-sm italic">"{user.bio}"</p>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-4">
                        {user?.foodPreferences?.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                              <span>🍽️</span>
                              <span>Food Preferences</span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {user.foodPreferences.map((pref, idx) => (
                                <span key={idx} className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                  {pref}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {user?.hobbies?.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                              <span>🎯</span>
                              <span>Hobbies & Interests</span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {user.hobbies.map((hobby, idx) => (
                                <span key={idx} className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                  {hobby}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-purple-200">
                        <button
                          onClick={() => setActiveTab('settings')}
                          className="text-sm text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
                        >
                          <span>✏️</span>
                          <span>Edit Profile</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="card">
                      <h3 className="text-xl font-bold mb-4 text-text-dark">Quick Actions</h3>
                      <div className="space-y-3">
                        <button 
                          onClick={() => setActiveTab('canteen')}
                          className="btn-primary w-full text-left py-3"
                        >
                          Order Food
                        </button>
                        <button 
                          onClick={() => setActiveTab('contracts')}
                          className="btn-secondary w-full text-left py-3"
                        >
                          View Contracts
                        </button>
                        <button 
                          onClick={() => setActiveTab('feedback')}
                          className="btn-secondary w-full text-left py-3"
                        >
                          Submit Feedback
                        </button>
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
              {myBooking ? (
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
                          <p className="text-3xl font-bold text-accent">₹{myBooking.monthlyRent || 'N/A'}</p>
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
              ) : selectedHostel ? (
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
                                <>
                                  <img
                                    src={room.photos[0].url || room.photos[0]}
                                    alt={`Room ${room.roomNumber}`}
                                    className="w-full h-full object-cover"
                                  />
                                  {/* Media Indicators */}
                                  <div className="absolute bottom-2 left-2 flex gap-2">
                                    {room.photos.length > 0 && (
                                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                                        📷 {room.photos.length}
                                      </span>
                                    )}
                                    {room.videoUrl && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setCurrentVideoUrl(room.videoUrl)
                                          setShowVideoModal(true)
                                        }}
                                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition cursor-pointer"
                                      >
                                        🎥 Video
                                      </button>
                                    )}
                                    {(room.panorama?.url || room.view360Url) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setPanoramaPreview({
                                            file: null,
                                            url: room.panorama?.url || room.view360Url
                                          })
                                          setShowPanoramaPreview(true)
                                        }}
                                        className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-2 py-1 rounded transition cursor-pointer"
                                      >
                                        🎯 360° View
                                      </button>
                                    )}
                                  </div>
                                </>
                              ) : room.videoUrl ? (
                                <div 
                                  className="relative w-full h-full cursor-pointer group"
                                  onClick={() => {
                                    setCurrentVideoUrl(room.videoUrl)
                                    setShowVideoModal(true)
                                  }}
                                >
                                  <video 
                                    src={room.videoUrl} 
                                    className="w-full h-full object-cover"
                                    muted
                                  />
                                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition flex items-center justify-center">
                                    <div className="bg-white rounded-full p-3 group-hover:scale-110 transition">
                                      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="absolute bottom-2 left-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setCurrentVideoUrl(room.videoUrl)
                                        setShowVideoModal(true)
                                      }}
                                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition cursor-pointer"
                                    >
                                      🎥 Video
                                    </button>
                                  </div>
                                </div>
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

                              {/* 360° View Button */}
                              {(room.panorama?.url || room.view360Url) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPanoramaPreview({
                                      file: null,
                                      url: room.panorama?.url || room.view360Url
                                    })
                                    setShowPanoramaPreview(true)
                                  }}
                                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white py-2 rounded-lg font-semibold transition text-sm flex items-center justify-center gap-2 mb-2"
                                >
                                  <span>🎯</span>
                                  <span>View 360° Tour</span>
                                </button>
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
            <div className="space-y-6">
              {/* Cart and Orders Header */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowOrdersModal(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition flex items-center gap-2"
                >
                  <span className="text-lg">📋</span>
                  Current Orders
                </button>
                <button
                  onClick={() => setShowOrderHistoryModal(true)}
                  className="bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-600 transition flex items-center gap-2"
                >
                  <span className="text-lg">📚</span>
                  Order History
                </button>
                <button
                  onClick={() => setShowCartModal(true)}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition flex items-center gap-2 relative"
                >
                  <span className="text-lg">🛒</span>
                  Cart
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>

              {/* Booking Status Info */}
              {myBooking && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏠</span>
                    <div className="flex-1">
                      <div className="font-bold text-text-dark">Your Current Hostel: {myBooking.hostel?.name || 'Loading...'}</div>
                      <div className="text-sm text-text-muted">
                        Room {myBooking.room?.roomNumber} • Status: 
                        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                          myBooking.status === 'active' ? 'bg-green-100 text-green-700' :
                          myBooking.status === 'pending_signatures' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {myBooking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* My Active Subscriptions */}
              {mySubscriptions.length > 0 && (
                <div className="card">
                  <h3 className="text-2xl font-bold mb-6 text-text-dark">🍱 My Active Subscriptions</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {mySubscriptions.filter(s => s.status === 'active').map(sub => (
                      <div key={sub._id} className="border-2 border-primary rounded-xl p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-lg text-text-dark">{sub.canteen?.name}</h4>
                            <p className="text-sm text-text-muted">{sub.canteen?.hostel?.name}</p>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                            {sub.status}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-text-muted">Plan:</span>
                            <span className="font-semibold text-primary capitalize">{sub.plan.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-text-muted">Food Type:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              sub.foodType === 'pure_veg' ? 'bg-green-100 text-green-700' :
                              sub.foodType === 'veg' ? 'bg-lime-100 text-lime-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {sub.foodType === 'pure_veg' ? '🟢 Pure Veg' :
                               sub.foodType === 'veg' ? '🥗 Veg' : '🍗 Non-Veg'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-text-muted">Valid Until:</span>
                            <span className="font-semibold text-text-dark">
                              {new Date(sub.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-text-muted">Monthly Fee:</span>
                            <span className="font-bold text-primary text-lg">₹{sub.price}</span>
                          </div>
                        </div>
                        {sub.spiceLevel && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs text-text-muted">Preferences:</div>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                                {sub.spiceLevel === 'mild' ? '😊 Mild' :
                                 sub.spiceLevel === 'medium' ? '🌶️ Medium' :
                                 sub.spiceLevel === 'hot' ? '🌶️🌶️ Hot' : '🌶️🌶️🌶️ Extra Hot'}
                              </span>
                              {sub.cuisinePreferences?.slice(0, 2).map((cuisine, idx) => (
                                <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                  {cuisine}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      fetchAvailableCanteens({ force: true })
                      fetchMySubscriptions({ force: true })
                    }}
                    className="mt-4 btn-secondary"
                  >
                    Refresh Subscriptions
                  </button>
                </div>
              )}

              {/* Browse Canteens */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-text-dark">🍽️ Available Canteens</h3>
                  <button
                    onClick={() => fetchAvailableCanteens({ force: true })}
                    className="btn-secondary"
                  >
                    🔄 Refresh
                  </button>
                </div>

                {canteensLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-muted">Loading canteens...</p>
                  </div>
                ) : canteenError ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🍽️</div>
                    <p className="text-red-600 text-lg mb-2">{canteenError}</p>
                    <p className="text-text-muted text-sm mb-4">
                      {!hasActiveBooking && 'Please book a room first to see available canteens.'}
                    </p>
                    <button onClick={() => fetchAvailableCanteens({ force: true })} className="btn-primary">
                      🔄 Retry
                    </button>
                  </div>
                ) : availableCanteens.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🍽️</div>
                    <p className="text-text-muted text-lg mb-4">No canteens available in your hostel yet</p>
                    {!hasActiveBooking && (
                      <p className="text-yellow-600 text-sm mb-4">⚠️ You need an active room booking to view canteens</p>
                    )}
                    <button onClick={() => fetchAvailableCanteens({ force: true })} className="btn-primary" disabled={canteensLoading}>
                      {canteensLoading ? 'Loading...' : 'Load Canteens'}
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableCanteens.map(canteen => (
                      <div key={canteen._id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-primary transition cursor-pointer"
                        onClick={() => {
                          const normalizedSelection = enrichCanteenWithPlans(canteen)
                          setSelectedCanteen(normalizedSelection)
                          fetchCanteenMenu(canteen._id)
                        }}>
                        <h4 className="font-bold text-lg text-text-dark mb-2">{canteen.name}</h4>
                        <p className="text-sm text-text-muted mb-3">{canteen.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {canteen.cuisineTypes?.slice(0, 3).map((cuisine, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                              {cuisine}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-muted">Delivery: ₹{canteen.deliveryCharge || 0}</span>
                          <span className="text-primary font-semibold">View Menu →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Canteen Menu */}
              {selectedCanteen && (
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-text-dark">{selectedCanteen.name} - Menu</h3>
                      <p className="text-sm text-text-muted">{selectedCanteen.hostel?.name}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCanteen(null)}
                      className="text-text-muted hover:text-text-dark"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Subscription Plans - Show First */}
                  {(() => {
                    console.log('🔍 Selected Canteen:', selectedCanteen)
                    console.log('📋 Subscription Plans:', selectedCanteen?.subscriptionPlans)
                    
                    if (!selectedCanteen?.subscriptionPlans) {
                      return (
                        <div className="mb-8 pb-8 border-b-2 border-gray-200">
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-300">
                            <div className="flex items-center gap-3">
                              <span className="text-4xl">ℹ️</span>
                              <div>
                                <h4 className="text-xl font-bold text-yellow-800">No Subscription Plans Available</h4>
                                <p className="text-sm text-yellow-700">This canteen hasn't set up monthly meal subscriptions yet. You can still order individual items from the menu below.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    
                    const enabledPlans = Object.entries(selectedCanteen.subscriptionPlans).filter(
                      ([, plan]) => plan && plan.enabled
                    )
                    
                    console.log('✅ Enabled Plans:', enabledPlans)
                    
                    if (enabledPlans.length === 0) {
                      return (
                        <div className="mb-8 pb-8 border-b-2 border-gray-200">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-300">
                            <div className="flex items-center gap-3">
                              <span className="text-4xl">🍱</span>
                              <div>
                                <h4 className="text-xl font-bold text-blue-800">Subscription Plans Coming Soon</h4>
                                <p className="text-sm text-blue-700">Monthly meal subscriptions are being configured for this canteen. Browse the menu below for one-time orders.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div className="mb-8 pb-8 border-b-2 border-gray-200">
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-4 border-2 border-green-300">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-4xl">🍱</span>
                            <div>
                              <h4 className="text-2xl font-bold text-green-800">Monthly Subscription Plans</h4>
                              <p className="text-sm text-green-700">Subscribe to get meals delivered daily to your room</p>
                            </div>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {enabledPlans.map(([key, plan]) => {
                            const hasWeeklyMenu = plan.weeklyMenu && Object.values(plan.weeklyMenu).some(menu => menu && menu.trim())
                            const isExpanded = expandedSubscriptionPlan === key
                            const planMealTypes = ['breakfast', 'lunch', 'dinner']
                            const hasMealType = planMealTypes.some(type => key.includes(type) && key.split('_').length === 1)
                            
                            return (
                              <div
                                key={key}
                                className="border-2 border-green-300 rounded-xl p-5 bg-gradient-to-br from-white to-green-50 hover:shadow-xl transition-all"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-bold text-xl text-green-800 capitalize">
                                    {key.replace(/_/g, ' ')}
                                  </h5>
                                  <span className="text-3xl">
                                    {key.includes('breakfast') ? '🍳' : key.includes('lunch') ? '🍛' : key.includes('dinner') ? '🍽️' : '🍱'}
                                  </span>
                                </div>
                                <div className="space-y-2 mb-4">
                                  {plan.pure_veg > 0 && (
                                    <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-green-200">
                                      <span className="text-sm font-semibold flex items-center gap-2">
                                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                        Pure Veg
                                      </span>
                                      <span className="font-bold text-lg text-green-700">₹{plan.pure_veg}/mo</span>
                                    </div>
                                  )}
                                  {plan.veg > 0 && (
                                    <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-lime-200">
                                      <span className="text-sm font-semibold flex items-center gap-2">
                                        <span className="w-3 h-3 bg-lime-500 rounded-full"></span>
                                        Veg
                                      </span>
                                      <span className="font-bold text-lg text-lime-700">₹{plan.veg}/mo</span>
                                    </div>
                                  )}
                                  {plan.non_veg_mix > 0 && (
                                    <div className="flex justify-between items-center bg-white rounded-lg p-2 border border-orange-200">
                                      <span className="text-sm font-semibold flex items-center gap-2">
                                        <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                                        Non-Veg Mix
                                      </span>
                                      <span className="font-bold text-lg text-orange-700">₹{plan.non_veg_mix}/mo</span>
                                    </div>
                                  )}
                                </div>

                                {/* View Menu Button - Only for single meal plans with weekly menu */}
                                {hasWeeklyMenu && hasMealType && (
                                  <button
                                    onClick={() => setExpandedSubscriptionPlan(isExpanded ? null : key)}
                                    className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition shadow-md mb-2 flex items-center justify-center gap-2"
                                  >
                                    <span>📋 {isExpanded ? 'Hide' : 'View'} Weekly Menu</span>
                                    <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
                                  </button>
                                )}

                                {/* Subscribe Button */}
                                <button
                                  onClick={() => handleSubscribeClick(key, plan)}
                                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-md hover:shadow-lg"
                                  disabled={!plan.enabled}
                                >
                                  📅 Subscribe Now
                                </button>

                                {/* Weekly Menu Expansion */}
                                {isExpanded && hasWeeklyMenu && hasMealType && (
                                  <div className="mt-4 pt-4 border-t-2 border-green-300 bg-gradient-to-br from-blue-50 to-green-50 p-4 rounded-lg animate-slideDown">
                                    <div className="flex items-center gap-2 mb-4">
                                      <span className="text-2xl">📅</span>
                                      <h6 className="font-bold text-lg text-blue-800">Weekly Menu</h6>
                                    </div>
                                    <div className="space-y-2">
                                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, idx) => {
                                        const dayMenu = plan.weeklyMenu[day]
                                        if (!dayMenu || !dayMenu.trim()) return null
                                        return (
                                          <div key={day} className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm">
                                            <div className="flex items-start gap-2">
                                              <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                                {idx + 1}
                                              </span>
                                              <div className="flex-1">
                                                <p className="font-bold text-sm text-blue-900 capitalize mb-1">{day}</p>
                                                <p className="text-sm text-gray-700 leading-relaxed">{dayMenu}</p>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Category Filter */}
                  <div className="flex gap-2 mb-6 flex-wrap">
                    {['all', 'breakfast', 'lunch', 'dinner', 'snacks', 'beverages'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setMenuCategory(cat)}
                        className={`px-4 py-2 rounded-lg font-semibold capitalize transition ${
                          menuCategory === cat
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-text-dark hover:bg-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Menu Items Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {canteenMenu
                      .filter(item => menuCategory === 'all' || item.category === menuCategory)
                      .filter(item => item.isAvailable)
                      .map(item => (
                        <div key={item._id} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
                          {item.image?.url ? (
                            <img src={item.image.url} alt={item.name} className="w-full h-40 object-cover" />
                          ) : (
                            <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-6xl">
                              🍽️
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-bold text-text-dark">{item.name}</h4>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                item.foodType === 'veg' ? 'bg-green-100 text-green-700' :
                                item.foodType === 'non-veg' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {item.foodType}
                              </span>
                            </div>
                            <p className="text-sm text-text-muted mb-3">{item.description}</p>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-2xl font-bold text-primary">₹{item.price}</span>
                              <span className="text-xs text-text-muted">⏱️ {item.preparationTime || 20} min</span>
                            </div>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 transition"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Quick Actions Below Menu */}
                  {canteenMenu.filter(item => menuCategory === 'all' || item.category === menuCategory).length > 0 && (
                    <div className="flex justify-center gap-4 mt-8">
                      <button
                        onClick={() => setShowCartModal(true)}
                        className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition shadow-lg hover:shadow-xl flex items-center gap-3 relative"
                      >
                        <span className="text-2xl">🛒</span>
                        <span>View Cart</span>
                        {cart.length > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm rounded-full w-7 h-7 flex items-center justify-center font-bold">
                            {cart.reduce((sum, item) => sum + item.quantity, 0)}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          fetchMyOrders({ force: true })
                          setShowOrdersModal(true)
                        }}
                        className="bg-blue-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition shadow-lg hover:shadow-xl flex items-center gap-3"
                      >
                        <span className="text-2xl">📋</span>
                        <span>My Orders</span>
                      </button>
                    </div>
                  )}

                  {canteenMenu.filter(item => menuCategory === 'all' || item.category === menuCategory).length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-text-muted">No items available in this category</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-text-dark">📄 My Rental Contracts</h3>
                  <button
                    onClick={() => fetchMyContracts({ force: true })}
                    className="btn-secondary"
                    disabled={contractsLoading}
                  >
                    {contractsLoading ? 'Loading...' : '🔄 Refresh'}
                  </button>
                </div>

                {contractsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-text-muted mt-4">Loading contracts...</p>
                  </div>
                ) : myContracts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-text-muted text-lg mb-4">No contracts found</p>
                    <button onClick={() => fetchMyContracts({ force: true })} className="btn-primary">
                      Load My Contracts
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Statistics */}
                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                        <div className="text-green-600 text-2xl mb-2">✅</div>
                        <div className="text-2xl font-bold text-green-700">
                          {myContracts.filter(c => c && c.status === 'active').length}
                        </div>
                        <div className="text-xs text-green-600 font-medium">Active</div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border-2 border-yellow-200">
                        <div className="text-yellow-600 text-2xl mb-2">⏳</div>
                        <div className="text-2xl font-bold text-yellow-700">
                          {myContracts.filter(c => c && c.status === 'pending_signatures').length}
                        </div>
                        <div className="text-xs text-yellow-600 font-medium">Pending</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
                        <div className="text-blue-600 text-2xl mb-2">📝</div>
                        <div className="text-2xl font-bold text-blue-700">
                          {myContracts.filter(c => c && c.status === 'draft').length}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">Draft</div>
                      </div>
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-200">
                        <div className="text-gray-600 text-2xl mb-2">🏁</div>
                        <div className="text-2xl font-bold text-gray-700">
                          {myContracts.filter(c => c && (c.status === 'completed' || c.status === 'terminated')).length}
                        </div>
                        <div className="text-xs text-gray-600 font-medium">Ended</div>
                      </div>
                    </div>

                    {/* Contracts List */}
                    {myContracts.filter(c => c && c._id).map(contract => (
                      <div key={contract._id} className={`border-2 rounded-xl overflow-hidden ${
                        contract.status === 'active' ? 'border-green-300 bg-green-50' :
                        contract.status === 'pending_signatures' ? 'border-yellow-300 bg-yellow-50' :
                        contract.status === 'draft' ? 'border-blue-300 bg-blue-50' :
                        'border-gray-300 bg-gray-50'
                      }`}>
                        {/* Contract Header */}
                        <div className={`p-4 ${
                          contract.status === 'active' ? 'bg-green-100' :
                          contract.status === 'pending_signatures' ? 'bg-yellow-100' :
                          contract.status === 'draft' ? 'bg-blue-100' :
                          'bg-gray-100'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-xl text-text-dark mb-1">
                                {contract.hostel?.name || 'Hostel Name'}
                              </h4>
                              <p className="text-sm text-text-muted">
                                📍 {typeof contract.hostel?.address === 'object' 
                                  ? `${contract.hostel?.address?.street || ''}, ${contract.hostel?.address?.city || ''}, ${contract.hostel?.address?.state || ''}`.replace(/, ,/g, ',').trim()
                                  : contract.hostel?.address || 'Address not available'}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              contract.status === 'active' ? 'bg-green-200 text-green-800' :
                              contract.status === 'pending_signatures' ? 'bg-yellow-200 text-yellow-800' :
                              contract.status === 'draft' ? 'bg-blue-200 text-blue-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                              {contract.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Contract Details */}
                        <div className="p-4 bg-white">
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Room Details */}
                            <div>
                              <h5 className="font-semibold text-text-dark mb-3 flex items-center gap-2">
                                <span className="text-xl">🚪</span> Room Details
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Room Number:</span>
                                  <span className="font-semibold text-text-dark">{contract.room?.roomNumber || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Floor:</span>
                                  <span className="font-semibold text-text-dark">{contract.room?.floor || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Type:</span>
                                  <span className="font-semibold text-text-dark capitalize">{contract.room?.roomType || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Capacity:</span>
                                  <span className="font-semibold text-text-dark">{contract.room?.capacity || 'N/A'} persons</span>
                                </div>
                              </div>
                            </div>

                            {/* Contract Duration */}
                            <div>
                              <h5 className="font-semibold text-text-dark mb-3 flex items-center gap-2">
                                <span className="text-xl">📅</span> Duration
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Start Date:</span>
                                  <span className="font-semibold text-text-dark">
                                    {new Date(contract.startDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-muted">End Date:</span>
                                  <span className="font-semibold text-text-dark">
                                    {new Date(contract.endDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Duration:</span>
                                  <span className="font-semibold text-primary">
                                    {Math.ceil((new Date(contract.endDate) - new Date(contract.startDate)) / (1000 * 60 * 60 * 24))} days
                                  </span>
                                </div>
                                {contract.status === 'active' && (
                                  <div className="flex justify-between">
                                    <span className="text-text-muted">Days Remaining:</span>
                                    <span className="font-semibold text-green-700">
                                      {Math.max(0, Math.ceil((new Date(contract.endDate) - new Date()) / (1000 * 60 * 60 * 24)))} days
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Financial Details */}
                            <div>
                              <h5 className="font-semibold text-text-dark mb-3 flex items-center gap-2">
                                <span className="text-xl">💰</span> Financial
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Monthly Rent:</span>
                                  <span className="font-bold text-primary text-lg">₹{contract.monthlyRent || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Security Deposit:</span>
                                  <span className="font-semibold text-text-dark">₹{contract.securityDeposit || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Payment Status:</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    contract.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                    contract.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {contract.paymentStatus || 'pending'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Owner Details */}
                            <div>
                              <h5 className="font-semibold text-text-dark mb-3 flex items-center gap-2">
                                <span className="text-xl">👤</span> Owner
                              </h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Name:</span>
                                  <span className="font-semibold text-text-dark">{contract.owner?.name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Phone:</span>
                                  <span className="font-semibold text-text-dark">{contract.owner?.phone || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-text-muted">Email:</span>
                                  <span className="font-semibold text-text-dark text-xs">{contract.owner?.email || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Terms and Conditions */}
                          {contract.terms && contract.terms.length > 0 && (
                            <div className="mt-6 pt-6 border-t">
                              <h5 className="font-semibold text-text-dark mb-3">📋 Terms & Conditions</h5>
                              <ul className="space-y-1 text-sm text-text-muted">
                                {contract.terms.map((term, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{typeof term === 'string' ? term : (term.description || term.clause || '')}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="mt-6 pt-6 border-t flex flex-wrap gap-3">
                            <button 
                              onClick={() => handleViewContract(contract)}
                              className="btn-primary flex-1 min-w-[200px]"
                            >
                              📄 View Full Contract
                            </button>
                            <button 
                              onClick={() => handleContactOwner(contract)}
                              className="btn-secondary flex-1 min-w-[200px]"
                            >
                              📞 Contact Owner
                            </button>
                            {contract.status === 'pending_signatures' && !contract.tenantSignature?.signed && (
                              <button 
                                onClick={() => handleSignContract(contract._id)}
                                disabled={signingContract}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold flex-1 min-w-[200px] disabled:opacity-50"
                              >
                                {signingContract ? '✍️ Signing...' : '✍️ Sign Contract'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-6">
              {/* Payment History Section */}
              <div className="card">
                <h3 className="text-2xl font-bold text-text-dark mb-6">💳 Payment History</h3>
                
                {/* Total Payments Summary */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
                    <div className="text-purple-600 text-2xl mb-2">🏠</div>
                    <div className="text-2xl font-bold text-purple-700">
                      ₹{(myContracts
                        .filter(c => c.status === 'active' && c.monthlyRent)
                        .reduce((sum, c) => {
                          const months = Math.ceil((new Date(c.endDate) - new Date(c.startDate)) / (1000 * 60 * 60 * 24 * 30))
                          return sum + (c.monthlyRent * Math.max(1, months))
                        }, 0) || 0
                      ).toLocaleString()}
                    </div>
                    <div className="text-xs text-purple-600 font-medium">Rent Payments</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200">
                    <div className="text-orange-600 text-2xl mb-2">🍽️</div>
                    <div className="text-2xl font-bold text-orange-700">
                      ₹{(myOrders
                        .filter(o => o.orderStatus === 'delivered' || o.orderStatus === 'paid')
                        .reduce((sum, o) => sum + (o.totalAmount || 0), 0) || 0
                      ).toLocaleString()}
                    </div>
                    <div className="text-xs text-orange-600 font-medium">Canteen Orders</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                    <div className="text-green-600 text-2xl mb-2">🍱</div>
                    <div className="text-2xl font-bold text-green-700">
                      ₹{(mySubscriptions
                        .filter(s => s.status === 'active' || s.status === 'expired')
                        .reduce((sum, s) => {
                          const months = Math.ceil((new Date(s.endDate) - new Date(s.startDate)) / (1000 * 60 * 60 * 24 * 30))
                          return sum + (s.price * Math.max(1, months))
                        }, 0) || 0
                      ).toLocaleString()}
                    </div>
                    <div className="text-xs text-green-600 font-medium">Subscriptions</div>
                  </div>
                </div>

                {/* Detailed Payment Records */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-text-dark">Recent Transactions</h4>
                  
                  {/* Rent Payments */}
                  {myContracts.filter(c => c.status === 'active' && c.monthlyRent).length > 0 && (
                    <div className="border-2 border-purple-200 rounded-xl overflow-hidden">
                      <div className="bg-purple-50 px-4 py-3 border-b border-purple-200">
                        <h5 className="font-bold text-purple-900 flex items-center gap-2">
                          <span>🏠</span> Rent Payments
                        </h5>
                      </div>
                      <div className="divide-y">
                        {myContracts
                          .filter(c => c.status === 'active' && c.monthlyRent)
                          .map(contract => (
                            <div key={contract._id} className="p-4 hover:bg-gray-50 transition">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-text-dark">{contract.hostel?.name}</p>
                                  <p className="text-sm text-text-muted">
                                    Room {contract.room?.roomNumber} • {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-green-600 font-medium mt-1">✓ Active Contract</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-purple-700 text-lg">₹{contract.monthlyRent}/month</p>
                                  <p className="text-xs text-text-muted">+ ₹{contract.securityDeposit} deposit</p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Canteen Orders */}
                  {myOrders.filter(o => o.orderStatus === 'delivered' || o.orderStatus === 'paid').length > 0 && (
                    <div className="border-2 border-orange-200 rounded-xl overflow-hidden">
                      <div className="bg-orange-50 px-4 py-3 border-b border-orange-200">
                        <h5 className="font-bold text-orange-900 flex items-center gap-2">
                          <span>🍽️</span> Canteen Orders ({myOrders.filter(o => o.orderStatus === 'delivered' || o.orderStatus === 'paid').length})
                        </h5>
                      </div>
                      <div className="max-h-96 overflow-y-auto divide-y">
                        {myOrders
                          .filter(o => o.orderStatus === 'delivered' || o.orderStatus === 'paid')
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                          .map(order => (
                            <div key={order._id} className="p-4 hover:bg-gray-50 transition">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-text-dark">Order #{order.orderNumber}</p>
                                  <p className="text-sm text-text-muted">{order.canteen?.name}</p>
                                  <p className="text-xs text-text-muted mt-1">
                                    {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                                      day: 'numeric', 
                                      month: 'short', 
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {order.items?.slice(0, 2).map(item => item.name).join(', ')}
                                    {order.items?.length > 2 && ` +${order.items.length - 2} more`}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-orange-700 text-lg">₹{order.totalAmount}</p>
                                  <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                    {order.orderStatus === 'delivered' ? '✓ Delivered' : '✓ Paid'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Subscriptions */}
                  {mySubscriptions.filter(s => s.status === 'active' || s.status === 'expired').length > 0 && (
                    <div className="border-2 border-green-200 rounded-xl overflow-hidden">
                      <div className="bg-green-50 px-4 py-3 border-b border-green-200">
                        <h5 className="font-bold text-green-900 flex items-center gap-2">
                          <span>🍱</span> Meal Subscriptions
                        </h5>
                      </div>
                      <div className="divide-y">
                        {mySubscriptions
                          .filter(s => s.status === 'active' || s.status === 'expired')
                          .map(sub => (
                            <div key={sub._id} className="p-4 hover:bg-gray-50 transition">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-text-dark">{sub.canteen?.name}</p>
                                  <p className="text-sm text-text-muted capitalize">{sub.plan.replace('_', ' ')} Plan • {sub.foodType.replace('_', ' ')}</p>
                                  <p className="text-xs text-text-muted mt-1">
                                    {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-green-700 text-lg">₹{sub.price}/month</p>
                                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                    sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {sub.status === 'active' ? '✓ Active' : '○ Expired'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* No payments message */}
                  {myContracts.filter(c => c.status === 'active').length === 0 && 
                   myOrders.filter(o => o.orderStatus === 'delivered' || o.orderStatus === 'paid').length === 0 &&
                   mySubscriptions.filter(s => s.status === 'active' || s.status === 'expired').length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">💳</div>
                      <p className="text-text-muted text-lg">No payment history available</p>
                      <p className="text-sm text-gray-500 mt-2">Your transactions will appear here once you make bookings or orders</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6">
              {/* Rate Current Hostel Section */}
              <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-text-dark">🏠 Your Hostel Ratings</h3>
                    <p className="text-sm text-gray-600 mt-1">Share and update your hostel experience</p>
                  </div>
                  {myContracts.find(c => c.status === 'active') && (
                    <button
                      onClick={() => {
                        // Pre-fill form if there's an existing rating for current hostel
                        const activeContract = myContracts.find(c => c.status === 'active')
                        const existingRating = findHostelFeedback(myHostelFeedbacks, activeContract?.hostel?._id)
                        if (existingRating) {
                          setHostelRating(existingRating.rating)
                          setHostelReview(existingRating.comment)
                        } else {
                          setHostelRating(0)
                          setHostelReview('')
                        }
                        setShowHostelRatingModal(true)
                      }}
                      className="btn-primary"
                    >
                      {findHostelFeedback(myHostelFeedbacks, myContracts.find(c => c.status === 'active')?.hostel?._id) 
                        ? '✏️ Update Rating' 
                        : '⭐ Rate Hostel'}
                    </button>
                  )}
                </div>

                {!myContracts.find(c => c.status === 'active') && (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-3">🏠</div>
                    <p className="text-gray-600">You need an active contract to rate a hostel</p>
                  </div>
                )}

                {myContracts.find(c => c.status === 'active') && (
                  <div>
                    <div className="bg-white rounded-lg p-4 border border-blue-200 mb-4">
                      <h4 className="font-bold text-lg mb-2">
                        {myContracts.find(c => c.status === 'active').hostel?.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        📍 {myContracts.find(c => c.status === 'active').hostel?.address?.city}, 
                        {myContracts.find(c => c.status === 'active').hostel?.address?.state}
                      </p>
                    </div>

                    {/* Show existing rating for current hostel */}
                    {(() => {
                      const activeContract = myContracts.find(c => c.status === 'active')
                      const hostelId = activeContract?.hostel?._id
                      const existingRating = findHostelFeedback(myHostelFeedbacks, hostelId)
                      
                      console.log('🔍 Rendering feedback section...')
                      console.log('Active Contract Hostel ID:', normalizeObjectId(hostelId))
                      console.log('My Hostel Feedbacks:', myHostelFeedbacks)
                      console.log('Found Existing Rating:', existingRating)
                      console.log('Feedback Update Trigger:', feedbackUpdateTrigger)
                      
                      if (existingRating) {
                        return (
                          <div key={`feedback-${existingRating._id}-${feedbackUpdateTrigger}-${existingRating.updatedAt || existingRating.createdAt}`} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-5 border-2 border-yellow-200">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">⭐</span>
                                <div>
                                  <h5 className="font-bold text-lg text-yellow-900">Your Current Rating</h5>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <span key={i} className={i < existingRating.rating ? 'text-yellow-500 text-xl' : 'text-gray-300 text-xl'}>
                                          ★
                                        </span>
                                      ))}
                                    </div>
                                    <span className="text-yellow-900 font-bold">({existingRating.rating}/5)</span>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setHostelRating(existingRating.rating)
                                  setHostelReview(existingRating.comment)
                                  setShowHostelRatingModal(true)
                                }}
                                className="text-sm px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
                              >
                                ✏️ Edit
                              </button>
                            </div>
                            <div className="bg-white rounded-lg p-4 mt-3 border-l-4 border-blue-500">
                              <p className="text-xs text-gray-500 font-semibold mb-2">YOUR REVIEW:</p>
                              <p className="text-sm text-gray-700 leading-relaxed">"{existingRating.comment}"</p>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <p className="text-xs text-gray-600">
                                📅 {existingRating.updatedAt && existingRating.updatedAt !== existingRating.createdAt ? (
                                  <span className="text-blue-600 font-semibold">
                                    Last updated on {new Date(existingRating.updatedAt).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                ) : (
                                  <span>
                                    Submitted on {new Date(existingRating.createdAt).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        )
                      } else {
                        return (
                          <div className="bg-white rounded-lg p-6 border-2 border-dashed border-gray-300 text-center">
                            <div className="text-5xl mb-3">⭐</div>
                            <p className="text-gray-600 mb-2">You haven't rated this hostel yet</p>
                            <p className="text-sm text-gray-500">Share your experience to help other tenants</p>
                          </div>
                        )
                      }
                    })()}
                  </div>
                )}
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-text-dark">⭐ My Feedbacks</h3>
                    <p className="text-sm text-gray-600 mt-1">View all your order ratings and reviews</p>
                  </div>
                  <button
                    onClick={() => fetchMyOrders({ force: true })}
                    className="btn-secondary text-sm"
                  >
                    🔄 Refresh
                  </button>
                </div>

                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-muted">Loading feedbacks...</p>
                  </div>
                ) : myOrders.filter(o => o.orderStatus === 'delivered' && o.feedback).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⭐</div>
                    <p className="text-text-muted text-lg">No feedbacks yet</p>
                    <p className="text-sm text-gray-500 mt-2">Your order ratings will appear here after you submit feedback</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myOrders
                      .filter(o => o.orderStatus === 'delivered' && o.feedback)
                      .sort((a, b) => new Date(b.feedback.createdAt) - new Date(a.feedback.createdAt))
                      .map(order => (
                        <div key={order._id} className="border-2 rounded-xl p-5 hover:shadow-lg transition bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-lg text-text-dark">Order #{order.orderNumber}</h4>
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                  Delivered
                                </span>
                              </div>
                              <div className="text-sm text-text-muted space-y-1">
                                <p><span className="font-semibold">🍽️ Canteen:</span> {order.canteen?.name}</p>
                                <p><span className="font-semibold">📅 Ordered:</span> {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</p>
                                <p><span className="font-semibold">✓ Delivered:</span> {new Date(order.deliveredAt).toLocaleDateString('en-IN', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric'
                                })}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">₹{order.totalAmount}</p>
                            </div>
                          </div>

                          {/* Order Items Summary */}
                          <div className="bg-white rounded-lg p-3 mb-4 border border-yellow-200">
                            <p className="text-xs font-semibold text-text-dark mb-2">Items Ordered:</p>
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-text-dark">{item.name} x{item.quantity}</span>
                                  <span className="font-semibold">₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Your Feedback */}
                          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-4 border-2 border-yellow-300">
                            <div className="flex items-start gap-3">
                              <div className="text-3xl">⭐</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-bold text-yellow-900 text-lg">Your Rating</span>
                                  <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <span key={i} className={i < order.feedback.rating ? 'text-yellow-500 text-xl' : 'text-gray-300 text-xl'}>
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                  <span className="ml-2 text-yellow-900 font-bold">
                                    ({order.feedback.rating}/5)
                                  </span>
                                </div>
                                <p className="text-sm text-yellow-900 italic leading-relaxed">"{order.feedback.comment}"</p>
                                <p className="text-xs text-yellow-700 mt-3 font-semibold">
                                  📅 Submitted on {new Date(order.feedback.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Provider's Rating of You */}
                          {order.tenantRating && order.tenantRating.rating && (
                            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-4 border-2 border-blue-300 mt-3">
                              <div className="flex items-start gap-3">
                                <div className="text-3xl">👨‍🍳</div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-blue-900 text-lg">Provider's Rating for You</span>
                                    <div className="flex gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <span key={i} className={i < order.tenantRating.rating ? 'text-blue-500 text-xl' : 'text-gray-300 text-xl'}>
                                          ★
                                        </span>
                                      ))}
                                    </div>
                                    <span className="ml-2 text-blue-900 font-bold">
                                      ({order.tenantRating.rating}/5)
                                    </span>
                                  </div>
                                  {order.tenantRating.comment && (
                                    <p className="text-sm text-blue-900 italic leading-relaxed">"{order.tenantRating.comment}"</p>
                                  )}
                                  <p className="text-xs text-blue-700 mt-3 font-semibold">
                                    📅 Rated on {new Date(order.tenantRating.ratedAt).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Feedback Stats */}
              {myOrders.filter(o => o.orderStatus === 'delivered' && o.feedback).length > 0 && (
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-text-muted text-sm font-semibold">Total Feedbacks</p>
                      <span className="text-3xl">⭐</span>
                    </div>
                    <h3 className="text-4xl font-bold text-yellow-600">
                      {myOrders.filter(o => o.orderStatus === 'delivered' && o.feedback).length}
                    </h3>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-text-muted text-sm font-semibold">Average Rating</p>
                      <span className="text-3xl">📊</span>
                    </div>
                    <h3 className="text-4xl font-bold text-green-600">
                      {(myOrders
                        .filter(o => o.orderStatus === 'delivered' && o.feedback)
                        .reduce((sum, o) => sum + o.feedback.rating, 0) / 
                        myOrders.filter(o => o.orderStatus === 'delivered' && o.feedback).length
                      ).toFixed(1)}/5
                    </h3>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-text-muted text-sm font-semibold">Provider Ratings</p>
                      <span className="text-3xl">👨‍🍳</span>
                    </div>
                    <h3 className="text-4xl font-bold text-blue-600">
                      {myOrders.filter(o => o.orderStatus === 'delivered' && o.tenantRating?.rating).length}
                    </h3>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sos' && (
            <div className="space-y-6">
              {/* SOS Emergency Alert */}
              <div className="card bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-5xl">🆘</div>
                  <div>
                    <h3 className="text-3xl font-bold text-red-700">Emergency SOS</h3>
                    <p className="text-gray-600 mt-1">Send urgent alerts to hostel management</p>
                  </div>
                </div>

                {/* Quick SOS Button */}
                <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border-2 border-red-400">
                  <button
                    onClick={() => setShowSOSModal(true)}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white text-xl font-bold py-6 px-8 rounded-xl hover:from-red-700 hover:to-red-800 transform hover:scale-[1.02] transition-all duration-200 shadow-xl flex items-center justify-center gap-3"
                  >
                    <span className="text-3xl">🚨</span>
                    <span>SEND EMERGENCY ALERT</span>
                    <span className="text-3xl">🚨</span>
                  </button>
                  <p className="text-center text-gray-600 mt-4 text-sm">
                    Click here if you need immediate assistance for medical, fire, security, or other emergencies
                  </p>
                </div>

                {/* Emergency Types Info */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                    <div className="text-3xl mb-2">🏥</div>
                    <h4 className="font-bold text-blue-700 mb-1">Medical</h4>
                    <p className="text-xs text-gray-600">Health emergencies, injuries, illness</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-2 border-orange-200">
                    <div className="text-3xl mb-2">🔥</div>
                    <h4 className="font-bold text-orange-700 mb-1">Fire</h4>
                    <p className="text-xs text-gray-600">Fire hazards, smoke, burning smell</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                    <div className="text-3xl mb-2">🔒</div>
                    <h4 className="font-bold text-purple-700 mb-1">Security</h4>
                    <p className="text-xs text-gray-600">Safety threats, suspicious activity</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <div className="text-3xl mb-2">⚠️</div>
                    <h4 className="font-bold text-gray-700 mb-1">Other</h4>
                    <p className="text-xs text-gray-600">Infrastructure, plumbing, electrical</p>
                  </div>
                </div>

                {/* SOS History */}
                <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                  <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                    📋 <span>Emergency Alert History</span>
                  </h4>
                  
                  {loadingSOSHistory ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
                      <p className="text-gray-600 mt-4">Loading history...</p>
                    </div>
                  ) : sosHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">✅</div>
                      <p className="text-gray-600">No emergency alerts sent yet</p>
                      <p className="text-sm text-gray-500 mt-2">Hope you never need to use this!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sosHistory.map((sos, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-red-500">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">
                                {sos.type === 'medical' ? '🏥' : 
                                 sos.type === 'fire' ? '🔥' : 
                                 sos.type === 'security' ? '🔒' : '⚠️'}
                              </span>
                              <span className="font-bold text-gray-800 capitalize">{sos.type} Emergency</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              sos.status === 'resolved' ? 'bg-green-100 text-green-700' :
                              sos.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {sos.status === 'resolved' ? '✓ Resolved' :
                               sos.status === 'in-progress' ? '⏳ In Progress' :
                               '🚨 Active'}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{sos.description}</p>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">📍 {sos.location}</span>
                            <span className="text-gray-500">
                              {new Date(sos.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {sos.response && (
                            <div className="mt-3 pt-3 border-t border-gray-300">
                              <p className="text-sm text-gray-600">
                                <span className="font-semibold">Response:</span> {sos.response}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Profile Settings */}
              <div className="card">
                <h3 className="text-2xl font-bold mb-6 text-text-dark flex items-center gap-2">
                  👤 Profile Settings
                </h3>
                
                <div className="space-y-6">
                  {/* Profile Picture Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                    <label className="block text-sm font-bold text-gray-800 mb-4">Profile Picture</label>
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                          {profilePicturePreview ? (
                            <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                              {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          id="profile-picture-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0]
                            if (file) {
                              setProfilePicture(file)
                              const reader = new FileReader()
                              reader.onloadend = () => setProfilePicturePreview(reader.result)
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-3">Upload a profile picture to personalize your account</p>
                        <div className="flex gap-3">
                          <label
                            htmlFor="profile-picture-upload"
                            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition cursor-pointer"
                          >
                            📷 Choose Photo
                          </label>
                          {profilePicturePreview && (
                            <button
                              onClick={() => {
                                setProfilePicture(null)
                                setProfilePicturePreview(null)
                              }}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        readOnly
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 cursor-not-allowed"
                        placeholder="Enter your full name"
                      />
                      <p className="text-xs text-gray-500 mt-1">Legal name cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
                      <input
                        type="text"
                        value={profileForm.displayName}
                        onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                        placeholder="How others see your name"
                      />
                      <p className="text-xs text-gray-500 mt-1">This is how you'll appear to others</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                        placeholder="Enter your phone number"
                        maxLength="10"
                      />
                    </div>
                  </div>

                  {/* Bio Section */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bio / About Me</label>
                    <textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                      placeholder="Tell others about yourself..."
                      rows="4"
                      maxLength="500"
                    />
                    <p className="text-xs text-gray-500 mt-1">{(profileForm.bio || '').length}/500 characters</p>
                  </div>

                  {/* Food Preferences */}
                  <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                    <label className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      🍽️ Food Preferences
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Array.isArray(profileForm.foodPreferences) && profileForm.foodPreferences.map((pref, idx) => (
                        <span key={idx} className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                          {pref}
                          <button
                            onClick={() => setProfileForm({
                              ...profileForm,
                              foodPreferences: profileForm.foodPreferences.filter((_, i) => i !== idx)
                            })}
                            className="hover:bg-green-600 rounded-full px-1"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value && !profileForm.foodPreferences.includes(e.target.value)) {
                            setProfileForm({
                              ...profileForm,
                              foodPreferences: [...profileForm.foodPreferences, e.target.value]
                            })
                          }
                        }}
                        className="flex-1 px-4 py-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none bg-white"
                      >
                        <option value="">Select a food preference...</option>
                        <option value="Vegetarian">🥗 Vegetarian</option>
                        <option value="Non-Vegetarian">🍖 Non-Vegetarian</option>
                        <option value="Vegan">🌱 Vegan</option>
                        <option value="Jain">🙏 Jain</option>
                        <option value="Eggetarian">🥚 Eggetarian</option>
                        <option value="Halal">☪️ Halal</option>
                        <option value="Kosher">✡️ Kosher</option>
                        <option value="Gluten-Free">🌾 Gluten-Free</option>
                        <option value="Dairy-Free">🥛 Dairy-Free</option>
                        <option value="No Restrictions">✅ No Restrictions</option>
                      </select>
                      <button
                        onClick={() => {
                          if (newFoodPref.trim() && !profileForm.foodPreferences.includes(newFoodPref.trim())) {
                            setProfileForm({
                              ...profileForm,
                              foodPreferences: [...profileForm.foodPreferences, newFoodPref.trim()]
                            })
                            setNewFoodPref('')
                          }
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition whitespace-nowrap"
                      >
                        + Custom
                      </button>
                    </div>
                    {newFoodPref && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={newFoodPref}
                          onChange={(e) => setNewFoodPref(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newFoodPref.trim()) {
                              setProfileForm({
                                ...profileForm,
                                foodPreferences: [...profileForm.foodPreferences, newFoodPref.trim()]
                              })
                              setNewFoodPref('')
                            }
                          }}
                          className="w-full px-4 py-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
                          placeholder="Enter custom food preference..."
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  {/* Hobbies Section */}
                  <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                    <label className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      🎯 Hobbies & Interests
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Array.isArray(profileForm.hobbies) && profileForm.hobbies.map((hobby, idx) => (
                        <span key={idx} className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                          {hobby}
                          <button
                            onClick={() => setProfileForm({
                              ...profileForm,
                              hobbies: profileForm.hobbies.filter((_, i) => i !== idx)
                            })}
                            className="hover:bg-purple-600 rounded-full px-1"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value && !profileForm.hobbies.includes(e.target.value)) {
                            setProfileForm({
                              ...profileForm,
                              hobbies: [...profileForm.hobbies, e.target.value]
                            })
                          }
                        }}
                        className="flex-1 px-4 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none bg-white"
                      >
                        <option value="">Select a hobby or interest...</option>
                        <option value="Reading">📚 Reading</option>
                        <option value="Writing">✍️ Writing</option>
                        <option value="Gaming">🎮 Gaming</option>
                        <option value="Sports">⚽ Sports</option>
                        <option value="Music">🎵 Music</option>
                        <option value="Dancing">💃 Dancing</option>
                        <option value="Painting">🎨 Painting</option>
                        <option value="Photography">📷 Photography</option>
                        <option value="Cooking">👨‍🍳 Cooking</option>
                        <option value="Traveling">✈️ Traveling</option>
                        <option value="Fitness">💪 Fitness</option>
                        <option value="Yoga">🧘 Yoga</option>
                        <option value="Meditation">🧘‍♀️ Meditation</option>
                        <option value="Movies">🎬 Movies</option>
                        <option value="TV Shows">📺 TV Shows</option>
                        <option value="Anime">🎌 Anime</option>
                        <option value="Technology">💻 Technology</option>
                        <option value="Coding">👨‍💻 Coding</option>
                        <option value="Gardening">🌱 Gardening</option>
                        <option value="Cycling">🚴 Cycling</option>
                        <option value="Swimming">🏊 Swimming</option>
                        <option value="Chess">♟️ Chess</option>
                        <option value="Board Games">🎲 Board Games</option>
                        <option value="Volunteering">🤝 Volunteering</option>
                        <option value="Fashion">👗 Fashion</option>
                      </select>
                      <button
                        onClick={() => {
                          if (newHobby.trim() && !profileForm.hobbies.includes(newHobby.trim())) {
                            setProfileForm({
                              ...profileForm,
                              hobbies: [...profileForm.hobbies, newHobby.trim()]
                            })
                            setNewHobby('')
                          }
                        }}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition whitespace-nowrap"
                      >
                        + Custom
                      </button>
                    </div>
                    {newHobby && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={newHobby}
                          onChange={(e) => setNewHobby(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newHobby.trim()) {
                              setProfileForm({
                                ...profileForm,
                                hobbies: [...profileForm.hobbies, newHobby.trim()]
                              })
                              setNewHobby('')
                            }
                          }}
                          className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none"
                          placeholder="Enter custom hobby or interest..."
                          autoFocus
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-2xl">💾</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 text-lg">Ready to Update Your Profile?</h4>
                        <p className="text-sm text-gray-600">Save all your changes to update your profile information</p>
                      </div>
                    </div>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={savingProfile}
                      className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 ${
                        savingProfile 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl hover:scale-105'
                      } text-white flex items-center justify-center gap-3`}
                    >
                      {savingProfile ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                          <span>Saving Profile...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl">✓</span>
                          <span>Save All Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Settings */}
              <div className="card">
                <h3 className="text-2xl font-bold mb-6 text-text-dark flex items-center gap-2">
                  🔒 Change Password
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => handlePasswordFormChange('currentPassword', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => handlePasswordFormChange('newPassword', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => handlePasswordFormChange('confirmPassword', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                      placeholder="Confirm new password"
                    />
                  </div>

                  {passwordForm.newPassword && passwordForm.confirmPassword && 
                   passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <p className="text-red-600 text-sm">Passwords do not match!</p>
                  )}

                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                    className="btn-primary disabled:opacity-50"
                  >
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>

              {/* Account Information */}
              <div className="card">
                <h3 className="text-2xl font-bold mb-6 text-text-dark flex items-center gap-2">
                  ℹ️ Account Information
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Account Type</p>
                      <p className="font-semibold text-gray-800">Tenant</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Member Since</p>
                      <p className="font-semibold text-gray-800">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Account Status</p>
                      <p className="font-semibold text-green-600">Active</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="card">
                <h3 className="text-2xl font-bold mb-6 text-text-dark flex items-center gap-2">
                  ⚙️ Preferences
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive updates about bookings and orders</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">SMS Notifications</p>
                      <p className="text-sm text-gray-600">Get SMS alerts for important updates</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">Order Updates</p>
                      <p className="text-sm text-gray-600">Track your food order status</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="card border-2 border-red-200 bg-red-50">
                <h3 className="text-2xl font-bold mb-6 text-red-800 flex items-center gap-2">
                  ⚠️ Danger Zone
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-lg border border-red-200">
                    <p className="font-semibold text-gray-800 mb-2">Delete Account</p>
                    <p className="text-sm text-gray-600 mb-4">
                      Request account deletion. Your hostel owner must approve this request.
                    </p>
                    
                    {deletionRequest ? (
                      <div className="space-y-3">
                        {deletionRequest.status === 'pending' && (
                          <>
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm font-semibold text-yellow-800">⏳ Deletion Request Pending</p>
                              <p className="text-xs text-yellow-700 mt-1">
                                Requested on: {new Date(deletionRequest.requestedAt).toLocaleDateString('en-IN')}
                              </p>
                              <p className="text-xs text-yellow-700 mt-1">
                                Reason: {deletionRequest.reason}
                              </p>
                            </div>
                            <button
                              onClick={handleCancelDeletionRequest}
                              className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                            >
                              Cancel Request
                            </button>
                          </>
                        )}
                        
                        {deletionRequest.status === 'rejected' && (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-semibold text-red-800 mb-2">❌ Request Rejected</p>
                            <p className="text-xs text-red-700 mb-1">
                              Your account deletion request was rejected by the hostel owner.
                            </p>
                            {deletionRequest.ownerResponse?.message && (
                              <>
                                <p className="text-xs text-red-700 font-semibold mt-2">Owner's Response:</p>
                                <p className="text-xs text-red-700 bg-white p-2 rounded mt-1">
                                  {deletionRequest.ownerResponse.message}
                                </p>
                              </>
                            )}
                            <button
                              onClick={() => {
                                setDeletionRequest(null)
                                fetchDeletionRequestStatus()
                              }}
                              className="mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition text-sm"
                            >
                              Submit New Request
                            </button>
                          </div>
                        )}

                        {deletionRequest.status === 'approved' && (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm font-semibold text-green-800 mb-2">✓ Request Approved</p>
                            <p className="text-xs text-green-700">
                              Your account deletion request has been approved. Your account will be deactivated shortly.
                            </p>
                            {deletionRequest.ownerResponse?.message && (
                              <>
                                <p className="text-xs text-green-700 font-semibold mt-2">Owner's Message:</p>
                                <p className="text-xs text-green-700 bg-white p-2 rounded mt-1">
                                  {deletionRequest.ownerResponse.message}
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeletionModal(true)}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                      >
                        Request Account Deletion
                      </button>
                    )}
                  </div>
                </div>
              </div>
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

                {/* View 360 Button */}
                {(selectedRoom.panorama?.url || selectedRoom.view360Url) && (
                  <div className="mt-4 pt-3 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setPanoramaPreview({
                          file: null,
                          url: selectedRoom.panorama?.url || selectedRoom.view360Url
                        })
                        setShowPanoramaPreview(true)
                      }}
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 shadow-md"
                    >
                      <span className="text-xl">🎯</span>
                      <span>View 360° Room Tour</span>
                    </button>
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
                    min={bookingData.startDate ? new Date(new Date(bookingData.startDate).setMonth(new Date(bookingData.startDate).getMonth() + 1)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    value={bookingData.endDate}
                    onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                    className="input w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for 11-month default lease. Minimum 1 month required.</p>
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

      {/* Subscription Modal */}
      {showSubscriptionModal && selectedPlan && selectedCanteen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl transform transition-all">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-3xl font-bold text-text-dark">
                  🍱 Subscribe Now
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Get fresh meals delivered to your room
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSubscriptionModal(false)
                  setSelectedPlan(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition text-2xl font-light"
              >
                ✕
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Side - Canteen & Plan Info */}
              <div>
                {/* Canteen Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 mb-6 border border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                      🍽️
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-text-dark">{selectedCanteen.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{selectedCanteen.description?.substring(0, 50)}...</p>
                      <div className="flex gap-2 mt-3">
                        {selectedCanteen.cuisineTypes?.slice(0, 2).map(cuisine => (
                          <span key={cuisine} className="text-xs bg-white px-2 py-1 rounded-full text-gray-700">
                            {cuisine}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan Card */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                      📅
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Selected Plan</p>
                      <p className="font-bold text-lg text-text-dark capitalize">
                        {selectedPlan.key.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  {selectedPlan.data.weeklyMenu && Object.values(selectedPlan.data.weeklyMenu).filter(Boolean).length > 0 && (
                    <p className="text-xs text-green-700 bg-white rounded-lg px-3 py-2 inline-block">
                      ✓ Weekly menu available
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side - Food Type Selection */}
              <div>
                <label className="block text-sm font-bold text-text-dark mb-4">
                  Choose Your Food Type 🥘
                </label>
                <div className="space-y-3">
                  {selectedPlan.data.pure_veg > 0 && (
                    <label className="flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all"
                      style={{
                        borderColor: selectedFoodType === 'pure_veg' ? '#2563eb' : '#e5e7eb',
                        backgroundColor: selectedFoodType === 'pure_veg' ? '#eff6ff' : 'white'
                      }}
                    >
                      <div className="flex-shrink-0">
                        <input
                          type="radio"
                          name="foodType"
                          value="pure_veg"
                          checked={selectedFoodType === 'pure_veg'}
                          onChange={(e) => setSelectedFoodType(e.target.value)}
                          className="w-5 h-5 text-primary"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🟢</span>
                          <span className="font-bold text-gray-900">Pure Vegetarian</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">100% vegan & vegetarian meals</p>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        ₹{selectedPlan.data.pure_veg}
                      </span>
                    </label>
                  )}
                  {selectedPlan.data.veg > 0 && (
                    <label className="flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all"
                      style={{
                        borderColor: selectedFoodType === 'veg' ? '#2563eb' : '#e5e7eb',
                        backgroundColor: selectedFoodType === 'veg' ? '#eff6ff' : 'white'
                      }}
                    >
                      <div className="flex-shrink-0">
                        <input
                          type="radio"
                          name="foodType"
                          value="veg"
                          checked={selectedFoodType === 'veg'}
                          onChange={(e) => setSelectedFoodType(e.target.value)}
                          className="w-5 h-5 text-primary"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🥗</span>
                          <span className="font-bold text-gray-900">Vegetarian</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Vegetables with dairy products</p>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        ₹{selectedPlan.data.veg}
                      </span>
                    </label>
                  )}
                  {selectedPlan.data.non_veg_mix > 0 && (
                    <label className="flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all"
                      style={{
                        borderColor: selectedFoodType === 'non_veg_mix' ? '#2563eb' : '#e5e7eb',
                        backgroundColor: selectedFoodType === 'non_veg_mix' ? '#eff6ff' : 'white'
                      }}
                    >
                      <div className="flex-shrink-0">
                        <input
                          type="radio"
                          name="foodType"
                          value="non_veg_mix"
                          checked={selectedFoodType === 'non_veg_mix'}
                          onChange={(e) => setSelectedFoodType(e.target.value)}
                          className="w-5 h-5 text-primary"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🍗</span>
                          <span className="font-bold text-gray-900">Non-Veg Mix</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Mix of vegetables & non-veg items</p>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        ₹{selectedPlan.data.non_veg_mix}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="grid grid-cols-3 gap-4 text-center mb-4 pb-4 border-b border-blue-200">
                <div>
                  <p className="text-xs text-gray-600 font-medium">CANTEEN</p>
                  <p className="font-bold text-gray-900 truncate">{selectedCanteen.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">PLAN</p>
                  <p className="font-bold text-gray-900 capitalize">
                    {selectedPlan.key.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">DURATION</p>
                  <p className="font-bold text-gray-900">1 Month</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 font-medium">MONTHLY AMOUNT</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    ₹{selectedPlan.data[selectedFoodType]}/month
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">Auto-renews every month</p>
                  <p className="text-sm text-green-600 font-bold mt-1">✓ Flexible cancellation</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowSubscriptionModal(false)
                  setSelectedPlan(null)
                }}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 font-bold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition"
                disabled={subscriptionLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubscriptionPurchase}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold hover:shadow-lg transition disabled:opacity-50"
                disabled={subscriptionLoading}
              >
                {subscriptionLoading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⟳</span>
                    Processing...
                  </>
                ) : (
                  <>
                    💳 Pay ₹{selectedPlan.data[selectedFoodType]}
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              🔒 Secure payment via Razorpay | You can cancel anytime
            </p>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowCartModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-3xl font-bold text-text-dark">🛒 Your Cart</h3>
                <p className="text-sm text-gray-600 mt-1">{cart.length} items</p>
              </div>
              <button
                onClick={() => setShowCartModal(false)}
                className="text-gray-400 hover:text-gray-600 transition text-2xl"
              >
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <p className="text-text-muted text-lg">Your cart is empty</p>
                <p className="text-sm text-gray-500 mt-2">Add items from the menu to place an order</p>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {cart.map(item => (
                    <div key={item.menuItem._id} className="flex items-center gap-4 p-4 border rounded-lg">
                      {item.menuItem.image?.url ? (
                        <img src={item.menuItem.image.url} alt={item.menuItem.name} className="w-20 h-20 object-cover rounded-lg" />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center text-3xl">
                          🍽️
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-text-dark">{item.menuItem.name}</h4>
                        <p className="text-sm text-text-muted">{item.menuItem.category}</p>
                        <p className="text-lg font-bold text-primary mt-1">₹{item.menuItem.price}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.menuItem._id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold"
                        >
                          −
                        </button>
                        <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menuItem._id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-primary text-white hover:bg-primary/90 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.menuItem._id)}
                        className="text-red-500 hover:text-red-700 text-xl"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                {/* Price Summary */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-text-dark">
                    <span>Items Total</span>
                    <span className="font-semibold">₹{calculateCartTotal().itemsTotal}</span>
                  </div>
                  <div className="flex justify-between text-text-dark">
                    <span>Delivery Charge</span>
                    <span className="font-semibold">₹{calculateCartTotal().deliveryCharge}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-primary border-t pt-2">
                    <span>Total</span>
                    <span>₹{calculateCartTotal().total}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCartModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 font-bold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={placeOrder}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold hover:shadow-lg transition disabled:opacity-50"
                    disabled={orderLoading}
                  >
                    {orderLoading ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⟳</span>
                        Processing...
                      </>
                    ) : (
                      <>
                        💳 Place Order - ₹{calculateCartTotal().total}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Current Orders Modal */}
      {showOrdersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowOrdersModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-3xl font-bold text-text-dark">📋 Current Orders</h3>
                <p className="text-sm text-gray-600 mt-1">Track your active food orders</p>
              </div>
              <button
                onClick={() => {
                  setShowOrdersModal(false)
                  fetchMyOrders({ force: true })
                }}
                className="text-gray-400 hover:text-gray-600 transition text-2xl"
              >
                ✕
              </button>
            </div>

            {ordersLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-text-muted">Loading orders...</p>
              </div>
            ) : myOrders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.orderStatus)).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-text-muted text-lg">No active orders</p>
                <p className="text-sm text-gray-500 mt-2">All your current orders are delivered or cancelled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.orderStatus)).map(order => (
                  <div key={order._id} className="border rounded-xl p-4 hover:shadow-lg transition">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-text-dark">Order #{order.orderNumber}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                            order.orderStatus === 'ready' ? 'bg-blue-100 text-blue-700' :
                            order.orderStatus === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </div>
                        <p className="text-sm text-text-muted mt-1">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">₹{order.totalAmount}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                          order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-xs font-semibold text-text-dark mb-2">Items:</p>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-text-dark">{item.name} x{item.quantity}</span>
                            <span className="font-semibold">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Estimated Delivery Time */}
                    {order.estimatedDeliveryTime && order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                      <div className="bg-green-50 border-l-4 border-green-500 rounded p-3 mb-3">
                        <p className="text-xs font-semibold text-green-900 mb-1">⏰ Estimated Delivery Time</p>
                        <p className="text-sm text-green-800 font-bold">
                          {new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          {Math.max(0, Math.round((new Date(order.estimatedDeliveryTime) - new Date()) / 60000))} minutes remaining
                        </p>
                      </div>
                    )}

                    {/* Order Status Progress */}
                    {order.orderStatus !== 'cancelled' && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-semibold text-blue-900 mb-2">📦 Order Progress</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className={`flex flex-col items-center ${['pending', 'confirmed', 'preparing', 'ready', 'delivered'].includes(order.orderStatus) ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${['pending', 'confirmed', 'preparing', 'ready', 'delivered'].includes(order.orderStatus) ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                              ✓
                            </div>
                            <span className="font-medium">Confirmed</span>
                          </div>
                          <div className={`flex-1 h-1 mx-1 ${['preparing', 'ready', 'delivered'].includes(order.orderStatus) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className={`flex flex-col items-center ${['preparing', 'ready', 'delivered'].includes(order.orderStatus) ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${['preparing', 'ready', 'delivered'].includes(order.orderStatus) ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                              👨‍🍳
                            </div>
                            <span className="font-medium">Preparing</span>
                          </div>
                          <div className={`flex-1 h-1 mx-1 ${['ready', 'delivered'].includes(order.orderStatus) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className={`flex flex-col items-center ${['ready', 'delivered'].includes(order.orderStatus) ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${['ready', 'delivered'].includes(order.orderStatus) ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                              ✓
                            </div>
                            <span className="font-medium">Ready</span>
                          </div>
                          <div className={`flex-1 h-1 mx-1 ${order.orderStatus === 'delivered' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className={`flex flex-col items-center ${order.orderStatus === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${order.orderStatus === 'delivered' ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                              🚚
                            </div>
                            <span className="font-medium">Delivered</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delivery Address */}
                    {order.deliveryAddress && (
                      <div className="text-sm text-text-muted">
                        <span className="font-semibold">📍 Delivery to:</span> Room {order.deliveryAddress.roomNumber}, 
                        Floor {order.deliveryAddress.floor}, {order.deliveryAddress.hostelName}
                      </div>
                    )}

                    {order.specialInstructions && (
                      <div className="text-sm text-text-muted mt-2">
                        <span className="font-semibold">📝 Instructions:</span> {order.specialInstructions}
                      </div>
                    )}

                    {order.orderStatus === 'delivered' && order.deliveredAt && (
                      <div className="text-sm text-green-600 font-semibold mt-2">
                        ✓ Delivered on {new Date(order.deliveredAt).toLocaleString('en-IN')}
                      </div>
                    )}

                    {/* Feedback Button for Delivered Orders */}
                    {order.orderStatus === 'delivered' && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                        {order.feedback ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                            <span className="text-sm text-yellow-800">⭐ Feedback submitted</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => openFeedbackModal(order)}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 px-4 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                          >
                            ⭐ Rate Your Order
                          </button>
                        )}
                        
                        {/* Provider's Rating */}
                        {order.tenantRating && order.tenantRating.rating && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                            <div className="flex items-center justify-center gap-2 text-sm">
                              <span className="text-blue-800">👨‍🍳 Provider rated you:</span>
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={i < order.tenantRating.rating ? 'text-blue-400' : 'text-gray-300'}>
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedOrderForFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">⭐ Rate Your Order</h2>
                  <p className="text-sm text-white/90 mt-1">Order #{selectedOrderForFeedback.orderNumber}</p>
                </div>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-text-dark mb-2">Order from {selectedOrderForFeedback.canteen?.name}</p>
                <div className="space-y-1">
                  {selectedOrderForFeedback.items.map((item, idx) => (
                    <div key={idx} className="text-xs text-text-muted flex justify-between">
                      <span>{item.name} x{item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="text-sm font-bold text-text-dark mt-2 pt-2 border-t border-gray-200">
                  Total: ₹{selectedOrderForFeedback.totalAmount}
                </div>
              </div>

              {/* Rating Stars */}
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-3">
                  How would you rate your order? <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      className={`text-5xl transition-all transform hover:scale-110 ${
                        feedbackRating >= star 
                          ? 'text-yellow-500' 
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {feedbackRating > 0 && (
                  <p className="text-center text-sm text-text-muted mt-2">
                    {feedbackRating === 1 && '😞 Poor'}
                    {feedbackRating === 2 && '😐 Fair'}
                    {feedbackRating === 3 && '🙂 Good'}
                    {feedbackRating === 4 && '😊 Very Good'}
                    {feedbackRating === 5 && '🤩 Excellent'}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">
                  Share your experience <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Tell us about the food quality, delivery speed, packaging, etc..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                  rows="5"
                />
                <p className="text-xs text-text-muted mt-1">
                  {feedbackComment.length}/500 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-text-dark rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  disabled={feedbackLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={submitOrderFeedback}
                  disabled={feedbackLoading || feedbackRating === 0 || !feedbackComment.trim()}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {feedbackLoading ? 'Submitting...' : '✓ Submit Feedback'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hostel Rating Modal */}
      {showHostelRatingModal && myContracts.find(c => c.status === 'active') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">
                    {(() => {
                      const activeContract = myContracts.find(c => c.status === 'active')
                      const existingRating = findHostelFeedback(myHostelFeedbacks, activeContract?.hostel?._id)
                      return existingRating ? '✏️ Update Your Rating' : '🏠 Rate Your Hostel'
                    })()}
                  </h2>
                  <p className="text-sm text-white/90 mt-1">
                    {myContracts.find(c => c.status === 'active').hostel?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowHostelRatingModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Hostel Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-text-dark mb-2">
                  {myContracts.find(c => c.status === 'active').hostel?.name}
                </p>
                <p className="text-xs text-text-muted">
                  📍 {myContracts.find(c => c.status === 'active').hostel?.address?.street}, 
                  {myContracts.find(c => c.status === 'active').hostel?.address?.city}, 
                  {myContracts.find(c => c.status === 'active').hostel?.address?.state}
                </p>
              </div>

              {/* Rating Stars */}
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-3">
                  How would you rate this hostel? <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setHostelRating(star)}
                      className={`text-5xl transition-all transform hover:scale-110 ${
                        hostelRating >= star 
                          ? 'text-yellow-500' 
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                {hostelRating > 0 && (
                  <p className="text-center text-sm text-text-muted mt-2">
                    {hostelRating === 1 && '😞 Poor'}
                    {hostelRating === 2 && '😐 Fair'}
                    {hostelRating === 3 && '🙂 Good'}
                    {hostelRating === 4 && '😊 Very Good'}
                    {hostelRating === 5 && '🤩 Excellent'}
                  </p>
                )}
              </div>

              {/* Review */}
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">
                  Write your review <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={hostelReview}
                  onChange={(e) => setHostelReview(e.target.value)}
                  placeholder="Tell us about the facilities, cleanliness, staff, security, location, etc..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="5"
                />
                <p className="text-xs text-text-muted mt-1">
                  {hostelReview.length}/500 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHostelRatingModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-text-dark rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  disabled={hostelRatingLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={submitHostelRating}
                  disabled={hostelRatingLoading || hostelRating === 0 || !hostelReview.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hostelRatingLoading ? (
                    findHostelFeedback(myHostelFeedbacks, myContracts.find(c => c.status === 'active')?.hostel?._id)
                      ? 'Updating...'
                      : 'Submitting...'
                  ) : (
                    findHostelFeedback(myHostelFeedbacks, myContracts.find(c => c.status === 'active')?.hostel?._id)
                      ? '✓ Update Rating'
                      : '✓ Submit Rating'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order History Modal */}
      {showOrderHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowOrderHistoryModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-3xl font-bold text-text-dark">📚 Order History</h3>
                <p className="text-sm text-gray-600 mt-1">Your past orders with feedbacks</p>
              </div>
              <button
                onClick={() => setShowOrderHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 transition text-2xl"
              >
                ✕
              </button>
            </div>

            {ordersLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-text-muted">Loading order history...</p>
              </div>
            ) : myOrders.filter(o => ['delivered', 'cancelled'].includes(o.orderStatus)).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-text-muted text-lg">No order history</p>
                <p className="text-sm text-gray-500 mt-2">Your completed or cancelled orders will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.filter(o => ['delivered', 'cancelled'].includes(o.orderStatus)).map(order => (
                  <div key={order._id} className="border rounded-xl p-4 hover:shadow-lg transition bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-text-dark">Order #{order.orderNumber}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.orderStatus}
                          </span>
                        </div>
                        <p className="text-sm text-text-muted mt-1">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">₹{order.totalAmount}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                          order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                      <p className="text-xs font-semibold text-text-dark mb-2">Items:</p>
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-text-dark">{item.name} x{item.quantity}</span>
                            <span className="font-semibold">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address */}
                    {order.deliveryAddress && (
                      <div className="text-sm text-text-muted mb-3">
                        <span className="font-semibold">📍 Delivered to:</span> Room {order.deliveryAddress.roomNumber}, 
                        Floor {order.deliveryAddress.floor}, {order.deliveryAddress.hostelName}
                      </div>
                    )}

                    {order.orderStatus === 'delivered' && order.deliveredAt && (
                      <div className="text-sm text-green-600 font-semibold mb-3">
                        ✓ Delivered on {new Date(order.deliveredAt).toLocaleString('en-IN')}
                      </div>
                    )}

                    {/* Feedback Section */}
                    {order.orderStatus === 'delivered' && (
                      <div className="border-t border-gray-200 pt-3 mt-3 space-y-3">
                        {/* Your Feedback (Tenant's rating of order) */}
                        {order.feedback ? (
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-3">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">⭐</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-yellow-900">Your Rating</span>
                                  <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <span key={i} className={i < order.feedback.rating ? 'text-yellow-400 text-lg' : 'text-gray-300 text-lg'}>
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-sm text-yellow-900">{order.feedback.comment}</p>
                                <p className="text-xs text-yellow-700 mt-2">
                                  Rated on {new Date(order.feedback.createdAt).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openFeedbackModal(order)}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 px-4 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                          >
                            ⭐ Rate This Order
                          </button>
                        )}

                        {/* Provider's Rating of Tenant */}
                        {order.tenantRating && order.tenantRating.rating && (
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-3">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">👨‍🍳</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-blue-900">Provider's Rating for You</span>
                                  <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <span key={i} className={i < order.tenantRating.rating ? 'text-blue-400 text-lg' : 'text-gray-300 text-lg'}>
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                {order.tenantRating.comment && (
                                  <p className="text-sm text-blue-900">{order.tenantRating.comment}</p>
                                )}
                                <p className="text-xs text-blue-700 mt-2">
                                  Rated on {new Date(order.tenantRating.ratedAt).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {order.orderStatus === 'cancelled' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700 font-semibold">❌ This order was cancelled</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                🎥 Room Video
              </h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 bg-black">
              <video
                src={currentVideoUrl}
                controls
                autoPlay
                className="w-full max-h-[70vh] rounded-lg"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}

      {/* Contract Details Modal */}
      {showContractModal && selectedContract && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowContractModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2 mb-2">
                    📄 Contract Details
                  </h3>
                  <p className="text-sm opacity-90">Contract #{selectedContract.contractNumber}</p>
                </div>
                <button
                  onClick={() => setShowContractModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div className={`rounded-lg p-4 ${
                selectedContract.status === 'active' ? 'bg-green-100 border-2 border-green-300' :
                selectedContract.status === 'pending_signatures' ? 'bg-yellow-100 border-2 border-yellow-300' :
                selectedContract.status === 'draft' ? 'bg-blue-100 border-2 border-blue-300' :
                'bg-gray-100 border-2 border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-lg">Contract Status</h4>
                    <p className={`text-sm font-semibold ${
                      selectedContract.status === 'active' ? 'text-green-700' :
                      selectedContract.status === 'pending_signatures' ? 'text-yellow-700' :
                      'text-gray-700'
                    }`}>
                      {selectedContract.status === 'active' && '✅ Active'}
                      {selectedContract.status === 'pending_signatures' && '⏳ Pending Signatures'}
                      {selectedContract.status === 'draft' && '📝 Draft'}
                      {selectedContract.status === 'terminated' && '❌ Terminated'}
                      {selectedContract.status === 'expired' && '⏰ Expired'}
                    </p>
                  </div>
                  {selectedContract.status === 'pending_signatures' && (
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">Signatures</p>
                      <div className="flex gap-2 text-sm">
                        <span className={selectedContract.tenantSignature?.signed ? 'text-green-600' : 'text-gray-400'}>
                          {selectedContract.tenantSignature?.signed ? '✓' : '○'} Tenant
                        </span>
                        <span className={selectedContract.ownerSignature?.signed ? 'text-green-600' : 'text-gray-400'}>
                          {selectedContract.ownerSignature?.signed ? '✓' : '○'} Owner
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Property Details */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200">
                <h4 className="font-bold text-xl mb-4 flex items-center gap-2">
                  🏢 Property Information
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Hostel Name</p>
                    <p className="font-semibold text-lg">{selectedContract.hostel?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-semibold">
                      {typeof selectedContract.hostel?.address === 'object' 
                        ? `${selectedContract.hostel?.address?.street || ''}, ${selectedContract.hostel?.address?.city || ''}, ${selectedContract.hostel?.address?.state || ''} ${selectedContract.hostel?.address?.pincode || ''}`.replace(/, ,/g, ',').trim()
                        : selectedContract.hostel?.address || 'Address not available'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Room Number</p>
                    <p className="font-semibold text-lg">{selectedContract.room?.roomNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Floor</p>
                    <p className="font-semibold">{selectedContract.room?.floor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Room Type</p>
                    <p className="font-semibold capitalize">{selectedContract.room?.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Capacity</p>
                    <p className="font-semibold">{selectedContract.room?.capacity} persons</p>
                  </div>
                </div>
              </div>

              {/* Contract Duration */}
              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6 border-2 border-green-200">
                <h4 className="font-bold text-xl mb-4 flex items-center gap-2">
                  📅 Contract Duration
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-bold text-lg">{new Date(selectedContract.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-bold text-lg">{new Date(selectedContract.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Duration</p>
                    <p className="font-bold text-lg text-primary">
                      {Math.ceil((new Date(selectedContract.endDate) - new Date(selectedContract.startDate)) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                  {selectedContract.status === 'active' && (
                    <div className="md:col-span-3 bg-white rounded-lg p-3 border border-green-300">
                      <p className="text-sm text-gray-600">Days Remaining</p>
                      <p className="font-bold text-2xl text-green-600">
                        {Math.max(0, Math.ceil((new Date(selectedContract.endDate) - new Date()) / (1000 * 60 * 60 * 24)))} days
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Details */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 border-2 border-yellow-200">
                <h4 className="font-bold text-xl mb-4 flex items-center gap-2">
                  💰 Financial Details
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-yellow-300">
                    <p className="text-sm text-gray-600 mb-1">Monthly Rent</p>
                    <p className="font-bold text-3xl text-primary">₹{selectedContract.monthlyRent?.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-yellow-300">
                    <p className="text-sm text-gray-600 mb-1">Security Deposit</p>
                    <p className="font-bold text-3xl text-orange-600">₹{selectedContract.securityDeposit?.toLocaleString()}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                      selectedContract.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                      selectedContract.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {selectedContract.paymentStatus?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Owner Details */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
                <h4 className="font-bold text-xl mb-4 flex items-center gap-2">
                  👤 Owner Information
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-lg">{selectedContract.owner?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-lg">{selectedContract.owner?.phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{selectedContract.owner?.email}</p>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              {selectedContract.terms && selectedContract.terms.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                  <h4 className="font-bold text-xl mb-4 flex items-center gap-2">
                    📋 Terms & Conditions
                  </h4>
                  <ul className="space-y-3">
                    {selectedContract.terms.map((term, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-primary font-bold text-lg">{idx + 1}.</span>
                        <div className="flex-1">
                          {term.clause && (
                            <p className="font-semibold text-gray-800">{term.clause}</p>
                          )}
                          <p className="text-gray-700 text-sm">{term.description || term}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Penalties */}
              {selectedContract.penalties && selectedContract.penalties.length > 0 && (
                <div className="bg-red-50 rounded-lg p-6 border-2 border-red-200">
                  <h4 className="font-bold text-xl mb-4 flex items-center gap-2 text-red-800">
                    ⚠️ Penalties
                  </h4>
                  <div className="space-y-3">
                    {selectedContract.penalties.map((penalty, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 border border-red-300">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-800">{penalty.penaltyType}</p>
                            <p className="text-sm text-gray-600 mt-1">{penalty.description}</p>
                          </div>
                          <p className="font-bold text-red-600 text-lg">₹{penalty.amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signature Status */}
              <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                <h4 className="font-bold text-xl mb-4 flex items-center gap-2">
                  ✍️ Signatures
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border-2 ${selectedContract.tenantSignature?.signed ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
                    <p className="font-semibold mb-2">Tenant Signature</p>
                    {selectedContract.tenantSignature?.signed ? (
                      <>
                        <p className="text-green-600 font-bold mb-1">✓ Signed</p>
                        <p className="text-xs text-gray-600">
                          {new Date(selectedContract.tenantSignature.signedAt).toLocaleString('en-IN')}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500">○ Pending</p>
                    )}
                  </div>
                  <div className={`p-4 rounded-lg border-2 ${selectedContract.ownerSignature?.signed ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
                    <p className="font-semibold mb-2">Owner Signature</p>
                    {selectedContract.ownerSignature?.signed ? (
                      <>
                        <p className="text-green-600 font-bold mb-1">✓ Signed</p>
                        <p className="text-xs text-gray-600">
                          {new Date(selectedContract.ownerSignature.signedAt).toLocaleString('en-IN')}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-500">○ Pending</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t-2">
                {selectedContract.status === 'pending_signatures' && !selectedContract.tenantSignature?.signed && (
                  <button 
                    onClick={() => handleSignContract(selectedContract._id)}
                    disabled={signingContract}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-bold flex-1 disabled:opacity-50 text-lg"
                  >
                    {signingContract ? '✍️ Signing...' : '✍️ Sign Contract Now'}
                  </button>
                )}
                <button 
                  onClick={() => handleContactOwner(selectedContract)}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-bold flex-1 text-lg"
                >
                  📞 Contact Owner
                </button>
                {selectedContract.contractDocument?.url && (
                  <button 
                    onClick={() => window.open(selectedContract.contractDocument.url, '_blank')}
                    className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-bold flex-1 text-lg"
                  >
                    📥 Download Document
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Expense Modal */}
      {showAddExpenseModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddExpenseModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6 sticky top-0 z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2 mb-2">
                    💰 {editingExpense ? 'Edit' : 'Add'} Monthly Expense
                  </h3>
                  <p className="text-sm opacity-90">{editingExpense ? 'Update your expense details' : 'Track your expenses for better budgeting'}</p>
                </div>
                <button
                  onClick={() => setShowAddExpenseModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Month and Year Selection */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
                  <select
                    value={expenseForm.month}
                    onChange={(e) => handleExpenseFormChange('month', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <option key={m} value={m}>
                        {new Date(2024, m-1).toLocaleDateString('en-US', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                  <select
                    value={expenseForm.year}
                    onChange={(e) => handleExpenseFormChange('year', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  >
                    {[2025, 2024, 2023].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Main Expenses */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🏠 Rent</label>
                  <input
                    type="number"
                    value={expenseForm.rent}
                    onChange={(e) => handleExpenseFormChange('rent', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">⚡ Electricity</label>
                  <input
                    type="number"
                    value={expenseForm.electricity}
                    onChange={(e) => handleExpenseFormChange('electricity', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">💧 Water</label>
                  <input
                    type="number"
                    value={expenseForm.water}
                    onChange={(e) => handleExpenseFormChange('water', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🍽️ Food</label>
                  <input
                    type="number"
                    value={expenseForm.food}
                    onChange={(e) => handleExpenseFormChange('food', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🔧 Maintenance</label>
                  <input
                    type="number"
                    value={expenseForm.maintenance}
                    onChange={(e) => handleExpenseFormChange('maintenance', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Other Expenses */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">📝 Other Expenses</label>
                  <button
                    onClick={handleAddOtherExpense}
                    className="text-primary hover:text-blue-700 text-sm font-semibold"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {expenseForm.other.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleOtherExpenseChange(index, 'description', e.target.value)}
                        className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                        placeholder="Description"
                      />
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleOtherExpenseChange(index, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-32 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                        placeholder="Amount"
                      />
                      <button
                        onClick={() => handleRemoveOtherExpense(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📝 Notes (Optional)</label>
                <textarea
                  value={expenseForm.notes}
                  onChange={(e) => handleExpenseFormChange('notes', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
                  rows="3"
                  placeholder="Add any additional notes..."
                />
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-300">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">Total Expense:</span>
                  <span className="text-3xl font-bold text-primary">
                    ₹{(
                      expenseForm.rent + 
                      expenseForm.electricity + 
                      expenseForm.water + 
                      expenseForm.food + 
                      expenseForm.maintenance + 
                      expenseForm.other.reduce((sum, item) => sum + item.amount, 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowAddExpenseModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitExpense}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-semibold"
                >
                  {editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone OTP Verification Modal */}
      {showPhoneOTPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text-dark">📱 Verify Phone Number</h3>
              <button
                onClick={() => {
                  setShowPhoneOTPModal(false)
                  setPhoneChangeOTP('')
                  setPhoneOTPSent(false)
                  setNewPhoneNumber('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>New Phone Number:</strong> {newPhoneNumber}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  An OTP will be sent to this number for verification
                </p>
              </div>

              {!phoneOTPSent ? (
                <button
                  onClick={handleSendPhoneOTP}
                  disabled={sendingPhoneOTP}
                  className="w-full px-6 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-semibold disabled:opacity-50"
                >
                  {sendingPhoneOTP ? 'Sending OTP...' : 'Send OTP'}
                </button>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Enter 6-digit OTP
                    </label>
                    <input
                      type="text"
                      value={phoneChangeOTP}
                      onChange={(e) => setPhoneChangeOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-center text-2xl tracking-widest"
                      placeholder="000000"
                      maxLength="6"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSendPhoneOTP}
                      disabled={sendingPhoneOTP}
                      className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold disabled:opacity-50"
                    >
                      {sendingPhoneOTP ? 'Resending...' : 'Resend OTP'}
                    </button>
                    <button
                      onClick={handleVerifyPhoneOTP}
                      disabled={verifyingPhoneOTP || phoneChangeOTP.length !== 6}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-semibold disabled:opacity-50"
                    >
                      {verifyingPhoneOTP ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deletion Request Modal */}
      {showDeletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-800">⚠️ Request Account Deletion</h3>
              <button
                onClick={() => {
                  setShowDeletionModal(false)
                  setDeletionReason('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Important:</strong> This action requires approval from your hostel owner. Your account will only be deleted after the owner reviews and approves your request.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Deletion <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none resize-none"
                  placeholder="Please explain why you want to delete your account..."
                  rows="4"
                  maxLength="500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {deletionReason.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeletionModal(false)
                    setDeletionReason('')
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestDeletion}
                  disabled={sendingDeletionRequest || !deletionReason.trim()}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50"
                >
                  {sendingDeletionRequest ? 'Sending Request...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 360° Panorama Viewer Modal */}
      {showPanoramaPreview && panoramaPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h3 className="text-2xl font-semibold text-gray-800">🎯 360° Room Tour</h3>
                <p className="text-sm text-gray-600 mt-1">Interactive panoramic view</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPanoramaPreview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Viewer Container */}
            <div className="flex-1 p-6 bg-gray-900">
              <PanoramaViewer 
                panoramaUrl={panoramaPreview.url}
                width="100%"
                height="600px"
                autoRotate={true}
                showControls={true}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t bg-gray-50">
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Controls:</p>
                <p>🖊️ Drag to look around • 🔍 Scroll to zoom • 🔁 Auto-rotate enabled</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SOS Emergency Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 border-4 border-red-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-5xl">🆘</span>
                <h3 className="text-3xl font-bold text-red-700">Emergency SOS Alert</h3>
              </div>
              <button
                onClick={() => {
                  setShowSOSModal(false)
                  setSosDescription('')
                  setSosLocation('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Emergency Type Selection */}
              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">Emergency Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSOSType('medical')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      sosType === 'medical'
                        ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300'
                        : 'bg-white border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <div className="text-3xl mb-2">🏥</div>
                    <div className="font-bold text-blue-700">Medical</div>
                  </button>
                  <button
                    onClick={() => setSOSType('fire')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      sosType === 'fire'
                        ? 'bg-orange-100 border-orange-500 ring-2 ring-orange-300'
                        : 'bg-white border-gray-300 hover:border-orange-400'
                    }`}
                  >
                    <div className="text-3xl mb-2">🔥</div>
                    <div className="font-bold text-orange-700">Fire</div>
                  </button>
                  <button
                    onClick={() => setSOSType('security')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      sosType === 'security'
                        ? 'bg-purple-100 border-purple-500 ring-2 ring-purple-300'
                        : 'bg-white border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    <div className="text-3xl mb-2">🔒</div>
                    <div className="font-bold text-purple-700">Security</div>
                  </button>
                  <button
                    onClick={() => setSOSType('other')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      sosType === 'other'
                        ? 'bg-gray-100 border-gray-500 ring-2 ring-gray-300'
                        : 'bg-white border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-3xl mb-2">⚠️</div>
                    <div className="font-bold text-gray-700">Other</div>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">Emergency Details *</label>
                <textarea
                  value={sosDescription}
                  onChange={(e) => setSOSDescription(e.target.value)}
                  placeholder="Describe the emergency situation in detail..."
                  className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none resize-none"
                  rows="4"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">Specific Location (Optional)</label>
                <input
                  type="text"
                  value={sosLocation}
                  onChange={(e) => setSOSLocation(e.target.value)}
                  placeholder="e.g., Room 203, Ground Floor Corridor, etc."
                  className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowSOSModal(false)
                    setSOSDescription('')
                    setSOSLocation('')
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 font-bold py-4 px-6 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendSOS}
                  disabled={sendingSOS || !sosDescription.trim()}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 px-6 rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] shadow-xl flex items-center justify-center gap-2"
                >
                  {sendingSOS ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Sending Alert...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">🚨</span>
                      <span>SEND EMERGENCY ALERT</span>
                    </>
                  )}
                </button>
              </div>

              {/* Important Notice */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <p className="text-sm text-yellow-800 flex items-start gap-2">
                  <span className="text-xl">⚠️</span>
                  <span>
                    <strong>Important:</strong> This will immediately alert hostel management. 
                    Please only use this for genuine emergencies.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-[9999] animate-slide-in">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border-2 ${
            toast.type === 'success' 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-300 text-white' 
              : toast.type === 'error'
              ? 'bg-gradient-to-r from-red-500 to-rose-500 border-red-300 text-white'
              : 'bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-300 text-white'
          }`}>
            <div className="text-2xl">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </div>
            <div className="font-semibold">{toast.message}</div>
            <button
              onClick={() => setToast({ show: false, message: '', type: 'success' })}
              className="ml-2 text-white/80 hover:text-white transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

