import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LogOut, Menu, X } from 'lucide-react'
import { tenantAPI, canteenAPI } from '../../services/api'
import { handleExpensePayment } from '../../utils/razorpayHandler'

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

  // Canteen subscription state
  const [canteens, setCanteens] = useState([])
  const [mySubscriptions, setMySubscriptions] = useState([])
  const [selectedCanteen, setSelectedCanteen] = useState(null)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [subscriptionData, setSubscriptionData] = useState({
    plan: 'breakfast',
    duration: 1
  })
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  // Contracts state
  const [contracts, setContracts] = useState([])
  const [contractsLoading, setContractsLoading] = useState(false)
  const [selectedContractForDetails, setSelectedContractForDetails] = useState(null)
  const [contractToTerminate, setContractToTerminate] = useState(null)
  const [terminationSuccess, setTerminationSuccess] = useState(false)
  const [terminationError, setTerminationError] = useState(null)

  // Expenses state
  const [expenses, setExpenses] = useState([])
  const [expensesLoading, setExpensesLoading] = useState(false)
  const [selectedExpensesForPayment, setSelectedExpensesForPayment] = useState([])
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Menu & Orders state
  const [canteenMenuItems, setCanteenMenuItems] = useState({}) // keyed by canteenId
  const [menuLoadingCanteenId, setMenuLoadingCanteenId] = useState(null)
  const [myOrders, setMyOrders] = useState([])
  const [myOrdersLoading, setMyOrdersLoading] = useState(false)
  const [showCustomOrderModal, setShowCustomOrderModal] = useState(false)
  const [selectedCanteenForOrder, setSelectedCanteenForOrder] = useState(null)
  const [customOrderItems, setCustomOrderItems] = useState([])
  const [orderFormData, setOrderFormData] = useState({
    specialInstructions: '',
    deliveryAddress: {
      roomNumber: '',
      floor: '',
      notes: ''
    }
  })
  const [orderSubmitLoading, setOrderSubmitLoading] = useState(false)
  const [orderMessage, setOrderMessage] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [foodTypeFilter, setFoodTypeFilter] = useState('all')

  // Feedback & Rating state
  const [feedbacks, setFeedbacks] = useState([])
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [selectedOrderForFeedback, setSelectedOrderForFeedback] = useState(null)
  const [feedbackFormData, setFeedbackFormData] = useState({
    rating: 5,
    comment: ''
  })
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  useEffect(() => {
    // Check if user has any active contracts/bookings
    const checkUserBookingStatus = async () => {
      try {
        console.log('Checking user booking status...')
        
        // Fetch contracts, hostels, and expenses in parallel
        const [contractsResponse, hostelsResponse, expensesResponse] = await Promise.all([
          tenantAPI.getMyContracts(),
          tenantAPI.searchHostels({ page: 1, limit: 100, showAll: true }),
          tenantAPI.getExpenses().catch(err => {
            console.warn('Could not fetch expenses:', err)
            return { data: { data: [] } }
          })
        ])
        
        const contracts = Array.isArray(contractsResponse.data?.data) ? contractsResponse.data.data : []
        console.log('User contracts:', contracts, 'Is array:', Array.isArray(contracts))
        
        const hostelsData = hostelsResponse.data?.data || []
        console.log('Available hostels:', hostelsData.length)
        
        // Load expenses from database
        const expensesData = Array.isArray(expensesResponse.data?.data) ? expensesResponse.data.data : []
        console.log('Loaded expenses from database:', expensesData.length)
        
        // Transform expenses to use _id as id for consistency
        const transformedExpenses = expensesData.map(exp => ({
          ...exp,
          id: exp._id // Use MongoDB _id as id
        }))
        
        // Store all data
        setContracts(contracts)
        setExpenses(transformedExpenses)
        
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
    
    // Set up auto-refresh every 30 seconds to check for contract updates
    const refreshInterval = setInterval(() => {
      checkUserBookingStatus()
    }, 30000) // 30 seconds
    
    return () => clearInterval(refreshInterval)
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

  const fetchCanteens = async () => {
    try {
      const response = await tenantAPI.searchHostels({ page: 1, limit: 100, showAll: true })
      const hostelsData = response.data?.data || []
      console.log('📍 All hostels fetched:', hostelsData)
      console.log('📍 Hostels with canteen property:', hostelsData.map(h => ({ name: h.name, hasCanteen: !!h.canteen, canteenData: h.canteen })))
      // Filter hostels that have canteens
      const canteenHostels = hostelsData.filter(h => h.canteen)
      console.log('📍 Filtered canteen hostels:', canteenHostels)
      setCanteens(canteenHostels)
    } catch (error) {
      console.error('Error fetching canteens:', error)
      setCanteens([])
    }
  }

  const fetchMySubscriptions = async () => {
    try {
      const response = await canteenAPI.getMySubscriptions()
      setMySubscriptions(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      setMySubscriptions([])
    }
  }

  const handleSubscribeToCanteen = async (e) => {
    e.preventDefault()
    if (!selectedCanteen) {
      alert('Please select a canteen')
      return
    }

    try {
      setSubscriptionLoading(true)
      
      // Create subscription order
      const response = await canteenAPI.createSubscriptionOrder({
        canteenId: selectedCanteen.canteen._id,
        plan: subscriptionData.plan,
        duration: parseInt(subscriptionData.duration)
      })

      console.log('Subscription created:', response.data)

      // In a real app, you would proceed to payment here
      // For now, we'll show success and refresh
      alert('✓ Subscription created! Please complete payment to activate.')
      
      // Refresh subscriptions and close modal
      await fetchMySubscriptions()
      setShowSubscriptionModal(false)
      setSubscriptionData({ plan: 'breakfast', duration: 1 })
      setSelectedCanteen(null)

      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50'
      successDiv.innerHTML = '✓ Subscription created successfully!'
      document.body.appendChild(successDiv)
      setTimeout(() => successDiv.remove(), 3000)
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create subscription')
    } finally {
      setSubscriptionLoading(false)
    }
  }

  // Fetch menu items for a specific canteen
  const fetchCanteenMenu = async (canteenId) => {
    try {
      setMenuLoadingCanteenId(canteenId)
      const response = await canteenAPI.getCanteenMenu(canteenId)
      const menuItems = response.data?.data || []
      setCanteenMenuItems(prev => ({
        ...prev,
        [canteenId]: menuItems
      }))
    } catch (error) {
      console.error('Error fetching menu:', error)
      setCanteenMenuItems(prev => ({
        ...prev,
        [canteenId]: []
      }))
    } finally {
      setMenuLoadingCanteenId(null)
    }
  }

  // Fetch user's orders
  const fetchMyOrders = async () => {
    try {
      setMyOrdersLoading(true)
      const response = await canteenAPI.getOrders()
      // Filter out cancelled orders
      const filteredOrders = (response.data?.data || []).filter(order => order.orderStatus !== 'cancelled')
      setMyOrders(filteredOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setMyOrders([])
    } finally {
      setMyOrdersLoading(false)
    }
  }

  const fetchFeedbacks = async () => {
    try {
      // Fetch feedbacks from backend (if feedback API exists)
      // For now, we'll create feedback when submitted
      console.log('Feedbacks already loaded')
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
    }
  }

  const handleSubmitFeedback = async (e) => {
    e.preventDefault()
    if (!selectedOrderForFeedback) return

    try {
      setFeedbackLoading(true)
      // Create feedback object
      const feedbackData = {
        order: selectedOrderForFeedback._id,
        canteen: selectedOrderForFeedback.canteen._id,
        rating: feedbackFormData.rating,
        comment: feedbackFormData.comment,
      }

      // Submit feedback to backend
      const response = await canteenAPI.submitOrderFeedback(feedbackData)
      
      // Add to local state
      const newFeedback = {
        _id: response.data.data._id,
        ...feedbackData,
        tenantName: user.name,
        orderDetails: {
          orderNumber: selectedOrderForFeedback.orderNumber,
          canteenName: selectedOrderForFeedback.canteen.name,
          totalAmount: selectedOrderForFeedback.totalAmount
        },
        createdAt: new Date().toISOString()
      }
      setFeedbacks([...feedbacks, newFeedback])

      // Show success message
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3'
      successDiv.innerHTML = '✓ Thank you for your feedback!'
      document.body.appendChild(successDiv)
      setTimeout(() => successDiv.remove(), 3000)

      // Reset form and close modal
      setFeedbackFormData({ rating: 5, comment: '' })
      setSelectedOrderForFeedback(null)
      setShowFeedbackModal(false)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      
      // Show better error notification
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit feedback'
      const errorDiv = document.createElement('div')
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3'
      errorDiv.innerHTML = `✕ ${errorMessage}`
      document.body.appendChild(errorDiv)
      setTimeout(() => errorDiv.remove(), 4000)
    } finally {
      setFeedbackLoading(false)
    }
  }

  // Add item to custom order
  const addItemToOrder = (menuItem) => {
    const existingItem = customOrderItems.find(item => item.menuItem._id === menuItem._id)
    
    if (existingItem) {
      // Increase quantity
      setCustomOrderItems(customOrderItems.map(item =>
        item.menuItem._id === menuItem._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      // Add new item
      setCustomOrderItems([...customOrderItems, {
        menuItem,
        quantity: 1
      }])
    }
  }

  // Remove item from custom order
  const removeItemFromOrder = (menuItemId) => {
    setCustomOrderItems(customOrderItems.filter(item => item.menuItem._id !== menuItemId))
  }

  // Update quantity
  const updateItemQuantity = (menuItemId, quantity) => {
    if (quantity <= 0) {
      removeItemFromOrder(menuItemId)
    } else {
      setCustomOrderItems(customOrderItems.map(item =>
        item.menuItem._id === menuItemId
          ? { ...item, quantity }
          : item
      ))
    }
  }

  // Submit custom order
  const handlePlaceCustomOrder = async (e) => {
    e.preventDefault()

    if (!selectedCanteenForOrder) {
      setOrderMessage('Canteen not selected')
      return
    }

    if (customOrderItems.length === 0) {
      setOrderMessage('Please add items to your order')
      return
    }

    if (!orderFormData.deliveryAddress.roomNumber) {
      setOrderMessage('Please provide your room number')
      return
    }

    try {
      setOrderSubmitLoading(true)
      setOrderMessage('Creating order...')

      const orderData = {
        canteen: selectedCanteenForOrder.canteen._id,
        items: customOrderItems.map(item => ({
          menuItem: item.menuItem._id,
          quantity: item.quantity
        })),
        deliveryAddress: orderFormData.deliveryAddress,
        specialInstructions: orderFormData.specialInstructions,
        paymentMethod: 'online'
      }

      const response = await canteenAPI.createOrder(orderData)
      
      if (response.data?.razorpayOrderId) {
        // Proceed to payment
        const result = await new Promise((resolve, reject) => {
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            order_id: response.data.razorpayOrderId,
            amount: response.data.totalAmount * 100,
            currency: 'INR',
            name: 'SafeStay - Food Order',
            description: `Order from ${selectedCanteenForOrder.canteen.name}`,
            handler: async (paymentResponse) => {
              try {
                const verifyResponse = await canteenAPI.verifyPayment({
                  razorpayOrderId: response.data.razorpayOrderId,
                  razorpayPaymentId: paymentResponse.razorpay_payment_id,
                  razorpaySignature: paymentResponse.razorpay_signature,
                  orderId: response.data._id
                })

                if (verifyResponse.data?.success) {
                  setOrderMessage('✓ Order placed successfully!')
                  setTimeout(() => {
                    setShowCustomOrderModal(false)
                    setCustomOrderItems([])
                    setOrderFormData({ specialInstructions: '', deliveryAddress: { roomNumber: '', floor: '', notes: '' } })
                    fetchMyOrders()
                    setOrderMessage('')
                  }, 1500)
                  resolve()
                } else {
                  reject(new Error('Payment verification failed'))
                }
              } catch (error) {
                reject(error)
              }
            },
            prefill: {
              email: user?.email || '',
              contact: user?.phone || ''
            },
            theme: { color: '#2563eb' }
          }

          const paymentObject = new window.Razorpay(options)
          paymentObject.open()
          paymentObject.on('payment.failed', (response) => {
            reject(new Error('Payment failed'))
          })
        })
      } else {
        setOrderMessage('✓ Order created! Waiting for payment confirmation.')
        fetchMyOrders()
      }
    } catch (error) {
      console.error('Error placing order:', error)
      setOrderMessage(error.response?.data?.message || error.message || 'Failed to place order')
    } finally {
      setOrderSubmitLoading(false)
    }
  }

  // Initialize delivery address from tenant's current room
  const initializeDeliveryAddress = async () => {
    try {
      if (user?.currentRoom && user?.currentHostel) {
        // Try to fetch room details to get floor and room number
        console.log('Fetching room details for hostel:', user.currentHostel)
        const response = await tenantAPI.getHostelDetails(user.currentHostel)
        const rooms = response.data?.data?.rooms || []
        const currentRoom = rooms.find(r => r._id === user.currentRoom)
        
        if (currentRoom) {
          console.log('Room found:', currentRoom)
          setOrderFormData({
            specialInstructions: '',
            deliveryAddress: {
              roomNumber: currentRoom.roomNumber?.toString() || '',
              floor: currentRoom.floor?.toString() || '',
              notes: ''
            }
          })
          console.log('Delivery address initialized with:', {
            roomNumber: currentRoom.roomNumber,
            floor: currentRoom.floor
          })
          return true
        }
      }
      
      // If no room found, initialize empty
      console.log('No room found, initializing empty form')
      setOrderFormData({
        specialInstructions: '',
        deliveryAddress: {
          roomNumber: '',
          floor: '',
          notes: ''
        }
      })
      return false
    } catch (error) {
      console.error('Error fetching room details:', error)
      setOrderFormData({
        specialInstructions: '',
        deliveryAddress: {
          roomNumber: '',
          floor: '',
          notes: ''
        }
      })
      return false
    }
  }

  // Fetch canteens on mount
  useEffect(() => {
    fetchCanteens()
    fetchMySubscriptions()
    fetchMyOrders()
  }, [])

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
            <div className="space-y-6">
              {/* My Active Booking Section */}
              {userInHostel && myBooking ? (
                <>
                  {/* Pending Approval Banner */}
                    {(myBooking.status === 'pending_signatures' || myBooking.status === 'draft') && (
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
                </>
              ) : selectedHostel ? (
                <>
                  {/* Hostel Details View when user selects a hostel from browse list */}
                  <div className="text-center py-12">
                    <p className="text-text-muted">Hostel details selected</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Browse All Hostels - shown when user has no active booking */}
                  <div className="card">
                    <h3 className="text-2xl font-bold mb-6 text-text-dark">🏢 Available Hostels</h3>
                    
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
                </>
              )}
            </div>
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

                  {/* Browse Other Hostels Section */}
                  <div className="card">
                    <h3 className="text-2xl font-bold mb-6 text-text-dark">🏢 Browse Other Hostels</h3>
                    
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                          <p className="text-text-muted">Loading available hostels...</p>
                        </div>
                      </div>
                    ) : !hostels || hostels.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-text-muted text-lg">No other hostels available at the moment.</p>
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
              {/* Subscribe Button */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-text-dark">🍽️ Canteen Subscriptions</h3>
                  <button
                    onClick={() => setShowSubscriptionModal(true)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition"
                  >
                    + Subscribe to Meal Plan
                  </button>
                </div>

                {/* My Subscriptions */}
                <div>
                  <h4 className="font-bold text-lg mb-4 text-text-dark">My Active Subscriptions</h4>
                  {mySubscriptions && mySubscriptions.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {mySubscriptions.map(sub => (
                        <div key={sub._id} className="border border-gray-200 rounded-lg p-4 hover:border-primary transition">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h5 className="font-bold text-text-dark">{sub.canteen?.name}</h5>
                              <p className="text-sm text-text-muted">{sub.canteen?.hostel?.name}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              sub.status === 'active' ? 'bg-green-100 text-green-700' :
                              sub.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                              sub.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {sub.status}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm mb-3">
                            <div className="flex justify-between">
                              <span className="text-text-muted">Plan:</span>
                              <span className="font-semibold capitalize">{sub.plan.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-muted">Price:</span>
                              <span className="font-bold text-primary">₹{sub.price}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-muted">Duration:</span>
                              <span className="font-semibold">
                                {new Date(sub.startDate).toLocaleDateString()} to {new Date(sub.endDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-muted">Payment:</span>
                              <span className={`font-semibold ${
                                sub.paymentStatus === 'paid' ? 'text-green-600' :
                                sub.paymentStatus === 'pending' ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {sub.paymentStatus}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-text-muted">
                      <p className="mb-3">No active subscriptions yet</p>
                      <button
                        onClick={() => setShowSubscriptionModal(true)}
                        className="btn-primary text-sm"
                      >
                        Subscribe to a Meal Plan
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Available Canteens */}
              <div className="card">
                <h4 className="font-bold text-lg mb-4 text-text-dark">Available Canteens</h4>
                {canteens && canteens.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {canteens.map(hostel => (
                      <div key={hostel._id} className="border border-gray-200 rounded-lg p-4 hover:border-primary transition">
                        <h5 className="font-bold text-text-dark mb-2">{hostel.canteen?.name}</h5>
                        <p className="text-sm text-text-muted mb-3">{hostel.name}</p>
                        <button
                          onClick={() => {
                            setSelectedCanteen(hostel)
                            setShowSubscriptionModal(true)
                          }}
                          className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm mb-2"
                        >
                          View Plans
                        </button>
                        <button
                          onClick={async () => {
                            setSelectedCanteenForOrder(hostel)
                            fetchCanteenMenu(hostel.canteen._id)
                            setCategoryFilter('all')
                            setFoodTypeFilter('all')
                            await initializeDeliveryAddress()
                            // Small delay to ensure state is rendered
                            await new Promise(resolve => setTimeout(resolve, 100))
                            setShowCustomOrderModal(true)
                          }}
                          className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition text-sm"
                        >
                          📋 Place Custom Order
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-muted">
                    <p>No canteens available at your hostels</p>
                  </div>
                )}
              </div>

              {/* My Orders History */}
              <div className="card">
                <h4 className="font-bold text-lg mb-4 text-text-dark">📦 My Food Orders</h4>
                {myOrdersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                      <p className="text-text-muted text-sm">Loading orders...</p>
                    </div>
                  </div>
                ) : myOrders && myOrders.length > 0 ? (
                  <div className="space-y-3">
                    {myOrders.map(order => (
                      <div key={order._id} className={`border-2 rounded-lg p-4 ${
                        order.orderStatus === 'delivered' ? 'border-green-200 bg-green-50' :
                        order.orderStatus === 'cancelled' ? 'border-red-200 bg-red-50' :
                        order.orderStatus === 'ready' ? 'border-blue-200 bg-blue-50' :
                        'border-orange-200 bg-orange-50'
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-text-dark">Order #{order.orderNumber}</p>
                            <p className="text-sm text-text-muted">{order.canteen?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">₹{order.totalAmount}</p>
                            <span className={`text-xs font-semibold px-2 py-1 rounded inline-block ${
                              order.orderStatus === 'delivered' ? 'bg-green-200 text-green-800' :
                              order.orderStatus === 'cancelled' ? 'bg-red-200 text-red-800' :
                              order.orderStatus === 'ready' ? 'bg-blue-200 text-blue-800' :
                              'bg-orange-200 text-orange-800'
                            }`}>
                              {order.orderStatus}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-text-muted">
                          <p>Items: {order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}</p>
                          <p className="mt-1">Delivery to: Room {order.deliveryAddress?.roomNumber}, Floor {order.deliveryAddress?.floor}</p>
                        </div>
                        {order.orderStatus === 'delivered' && (
                          <button
                            onClick={() => {
                              setSelectedOrderForFeedback(order)
                              setShowFeedbackModal(true)
                            }}
                            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition text-sm"
                          >
                            ⭐ Rate & Feedback
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-text-muted py-6">No orders yet. Place your first order!</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-2xl font-bold mb-6 text-text-dark">📄 My Contracts</h3>

                {contractsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                      <p className="text-text-muted">Loading contracts...</p>
                    </div>
                  </div>
                ) : !Array.isArray(contracts) || contracts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-bold text-text-dark mb-2">No Contracts Yet</h3>
                    <p className="text-text-muted">You haven't signed any room rental contracts yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract, idx) => {
                      if (!contract || !contract._id) return null
                      return (
                        <div key={contract._id || idx} className={`border-2 rounded-lg p-6 ${
                          contract.status === 'active' ? 'border-green-300 bg-green-50' :
                          contract.status === 'pending_signatures' ? 'border-yellow-300 bg-yellow-50' :
                          contract.status === 'draft' ? 'border-blue-300 bg-blue-50' :
                          'border-gray-300 bg-gray-50'
                        }`}>
                          {/* Contract Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-xl font-bold text-text-dark">{contract.hostel?.name || 'N/A'}</h4>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  contract.status === 'active' ? 'bg-green-200 text-green-800' :
                                  contract.status === 'pending_signatures' ? 'bg-yellow-200 text-yellow-800' :
                                  contract.status === 'draft' ? 'bg-blue-200 text-blue-800' :
                                  'bg-gray-200 text-gray-800'
                                }`}>
                                  {contract.status === 'active' ? '✓ Active' :
                                   contract.status === 'pending_signatures' ? '⏳ Pending Approval' :
                                   contract.status === 'draft' ? '📝 Draft' :
                                   contract.status}
                                </span>
                              </div>
                              <p className="text-text-muted text-sm">📍 {contract.hostel?.address?.city || 'N/A'}, {contract.hostel?.address?.state || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-text-muted mb-1">Contract ID</p>
                              <p className="font-mono text-xs text-text-dark">{contract._id?.slice(-8) || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Contract Details Grid */}
                          <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-white rounded p-3">
                              <p className="text-xs font-semibold text-text-muted uppercase mb-1">Room</p>
                              <p className="text-lg font-bold text-primary">{contract.room?.roomNumber || 'N/A'}</p>
                              <p className="text-xs text-text-muted capitalize">{contract.room?.roomType || 'N/A'} • Floor {contract.room?.floor || 'N/A'}</p>
                            </div>

                            <div className="bg-white rounded p-3">
                              <p className="text-xs font-semibold text-text-muted uppercase mb-1">Monthly Rent</p>
                              <p className="text-lg font-bold text-accent">₹{contract.rent || 'N/A'}</p>
                              <p className="text-xs text-text-muted">Deposit: ₹{contract.securityDeposit || 'N/A'}</p>
                            </div>

                            <div className="bg-white rounded p-3">
                              <p className="text-xs font-semibold text-text-muted uppercase mb-1">Owner</p>
                              <p className="text-sm font-semibold text-text-dark">{contract.owner?.name || 'N/A'}</p>
                              <p className="text-xs text-text-muted">📞 {contract.owner?.phone || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Contract Dates */}
                          <div className="grid md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-300">
                            <div>
                              <p className="text-xs font-semibold text-text-muted uppercase mb-1">Start Date</p>
                              <p className="font-semibold text-text-dark">
                                {contract.startDate ? new Date(contract.startDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                }) : 'N/A'}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-text-muted uppercase mb-1">End Date</p>
                              <p className="font-semibold text-text-dark">
                                {contract.endDate ? new Date(contract.endDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                }) : 'Ongoing'}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-text-muted uppercase mb-1">Duration</p>
                              <p className="font-semibold text-primary">
                                {contract.startDate && contract.endDate
                                  ? `${Math.ceil((new Date(contract.endDate) - new Date(contract.startDate)) / (1000 * 60 * 60 * 24 * 30))} months`
                                  : 'Ongoing'}
                              </p>
                            </div>
                          </div>

                          {/* Contract Terms */}
                          {contract.terms && typeof contract.terms === 'string' && (
                            <div className="bg-white rounded p-3 mb-4">
                              <p className="text-xs font-semibold text-text-muted uppercase mb-2">Terms & Conditions</p>
                              <p className="text-sm text-text-dark">{contract.terms}</p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => setSelectedContractForDetails(contract)}
                              className="flex-1 bg-white border-2 border-primary text-primary py-2 rounded-lg font-semibold hover:bg-blue-50 transition"
                            >
                              📋 View Details
                            </button>
                            {contract.status === 'pending_signatures' && (
                              <button
                                onClick={() => alert('E-signature functionality coming soon!')}
                                className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                              >
                                ✍️ Sign Contract
                              </button>
                            )}
                            {contract.status === 'active' && (
                              <button
                                onClick={() => setContractToTerminate(contract)}
                                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition"
                              >
                                ⚠️ Terminate
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Contracts Summary */}
              {Array.isArray(contracts) && contracts.length > 0 && (
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="stats-card">
                    <p className="text-text-muted text-sm mb-2">Total Contracts</p>
                    <h3 className="text-3xl font-bold text-primary">{contracts.length}</h3>
                  </div>
                  <div className="stats-card">
                    <p className="text-text-muted text-sm mb-2">Active</p>
                    <h3 className="text-3xl font-bold text-green-600">{contracts.filter(c => c.status === 'active').length}</h3>
                  </div>
                  <div className="stats-card">
                    <p className="text-text-muted text-sm mb-2">Pending</p>
                    <h3 className="text-3xl font-bold text-yellow-600">{contracts.filter(c => c.status === 'pending_signatures' || c.status === 'draft').length}</h3>
                  </div>
                  <div className="stats-card">
                    <p className="text-text-muted text-sm mb-2">Terminated</p>
                    <h3 className="text-3xl font-bold text-red-600">{contracts.filter(c => c.status === 'terminated').length}</h3>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-6">
              {/* Expense Summary Cards */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="stats-card">
                  <p className="text-text-muted text-sm mb-2">Total Due</p>
                  <h3 className="text-3xl font-bold text-red-600">₹{expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0)}</h3>
                </div>
                <div className="stats-card">
                  <p className="text-text-muted text-sm mb-2">Paid</p>
                  <h3 className="text-3xl font-bold text-green-600">₹{expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0)}</h3>
                </div>
                <div className="stats-card">
                  <p className="text-text-muted text-sm mb-2">Pending</p>
                  <h3 className="text-3xl font-bold text-orange-600">{expenses.filter(e => e.status === 'pending').length}</h3>
                </div>
                <div className="stats-card">
                  <p className="text-text-muted text-sm mb-2">Selected for Payment</p>
                  <h3 className="text-3xl font-bold text-primary">{selectedExpensesForPayment.length}</h3>
                </div>
              </div>

              {/* Expenses by Category */}
              <div className="space-y-6">
                {/* Hostel Expenses */}
                <div className="card">
                  <h3 className="text-xl font-bold mb-4 text-text-dark flex items-center gap-2">
                    🏢 Hostel Expenses
                  </h3>
                  {expenses.filter(e => e.type === 'hostel').length === 0 ? (
                    <p className="text-text-muted">No hostel expenses</p>
                  ) : (
                    <div className="space-y-3">
                      {expenses.filter(e => e.type === 'hostel').map(expense => (
                        <div key={expense.id} className={`border-2 rounded-lg p-4 flex items-center justify-between ${
                          expense.status === 'paid' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center gap-4 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedExpensesForPayment.includes(expense.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedExpensesForPayment([...selectedExpensesForPayment, expense.id])
                                } else {
                                  setSelectedExpensesForPayment(selectedExpensesForPayment.filter(id => id !== expense.id))
                                }
                              }}
                              disabled={expense.status === 'paid'}
                              className="w-5 h-5 accent-primary cursor-pointer"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-text-dark">{expense.name}</p>
                              <p className="text-sm text-text-muted">{expense.description}</p>
                              <p className="text-xs text-text-muted mt-1">Due: {new Date(expense.dueDate).toLocaleDateString('en-IN')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">₹{expense.amount}</p>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              expense.status === 'paid' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                            }`}>
                              {expense.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Canteen Expenses */}
                <div className="card">
                  <h3 className="text-xl font-bold mb-4 text-text-dark flex items-center gap-2">
                    🍽️ Canteen Expenses
                  </h3>
                  {expenses.filter(e => e.type === 'canteen').length === 0 ? (
                    <p className="text-text-muted">No canteen expenses</p>
                  ) : (
                    <div className="space-y-3">
                      {expenses.filter(e => e.type === 'canteen').map(expense => (
                        <div key={expense.id} className={`border-2 rounded-lg p-4 flex items-center justify-between ${
                          expense.status === 'paid' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                        }`}>
                          <div className="flex items-center gap-4 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedExpensesForPayment.includes(expense.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedExpensesForPayment([...selectedExpensesForPayment, expense.id])
                                } else {
                                  setSelectedExpensesForPayment(selectedExpensesForPayment.filter(id => id !== expense.id))
                                }
                              }}
                              disabled={expense.status === 'paid'}
                              className="w-5 h-5 accent-primary cursor-pointer"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-text-dark">{expense.name}</p>
                              <p className="text-sm text-text-muted">{expense.description}</p>
                              <p className="text-xs text-text-muted mt-1">Due: {new Date(expense.dueDate).toLocaleDateString('en-IN')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">₹{expense.amount}</p>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              expense.status === 'paid' ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'
                            }`}>
                              {expense.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Other Expenses */}
                <div className="card">
                  <h3 className="text-xl font-bold mb-4 text-text-dark flex items-center gap-2">
                    💰 Other Expenses
                  </h3>
                  {expenses.filter(e => e.type === 'other').length === 0 ? (
                    <p className="text-text-muted">No other expenses</p>
                  ) : (
                    <div className="space-y-3">
                      {expenses.filter(e => e.type === 'other').map(expense => (
                        <div key={expense.id} className={`border-2 rounded-lg p-4 flex items-center justify-between ${
                          expense.status === 'paid' ? 'bg-green-50 border-green-200' : 'bg-purple-50 border-purple-200'
                        }`}>
                          <div className="flex items-center gap-4 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedExpensesForPayment.includes(expense.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedExpensesForPayment([...selectedExpensesForPayment, expense.id])
                                } else {
                                  setSelectedExpensesForPayment(selectedExpensesForPayment.filter(id => id !== expense.id))
                                }
                              }}
                              disabled={expense.status === 'paid'}
                              className="w-5 h-5 accent-primary cursor-pointer"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-text-dark">{expense.name}</p>
                              <p className="text-sm text-text-muted">{expense.description}</p>
                              <p className="text-xs text-text-muted mt-1">Due: {new Date(expense.dueDate).toLocaleDateString('en-IN')}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">₹{expense.amount}</p>
                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                              expense.status === 'paid' ? 'bg-green-200 text-green-800' : 'bg-purple-200 text-purple-800'
                            }`}>
                              {expense.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Section */}
              {selectedExpensesForPayment.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary shadow-lg">
                  <div className="max-w-7xl mx-auto p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-muted">Selected for payment</p>
                      <p className="text-2xl font-bold text-primary">
                        ₹{expenses.filter(e => selectedExpensesForPayment.includes(e.id)).reduce((sum, e) => sum + e.amount, 0)}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedExpensesForPayment([])}
                        className="px-6 py-3 bg-gray-200 text-text-dark rounded-lg font-semibold hover:bg-gray-300 transition"
                      >
                        Clear Selection
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            setPaymentLoading(true)
                            
                            // Calculate total amount for selected expenses
                            const totalAmount = expenses
                              .filter(e => selectedExpensesForPayment.includes(e.id))
                              .reduce((sum, e) => sum + e.amount, 0)

                            console.log('Creating expense payment order for amount:', totalAmount)
                            console.log('Selected expenses:', selectedExpensesForPayment)

                            // Create order on backend
                            console.log('Calling API: /tenant/create-expense-order')
                            const orderResponse = await tenantAPI.createExpenseOrder({
                              expenseIds: selectedExpensesForPayment,
                              amount: totalAmount
                            }).catch(err => {
                              console.error('API error details:', err)
                              throw new Error(`API Error: ${err.response?.status || 'Network'} - ${err.response?.data?.message || err.message}`)
                            })

                            console.log('Order created:', orderResponse.data)

                            if (!orderResponse.data.success) {
                              throw new Error(orderResponse.data.message || 'Failed to create order')
                            }

                            // Initialize Razorpay payment
                            console.log('Opening Razorpay checkout...')
                            const paymentResponse = await handleExpensePayment(
                              orderResponse.data,
                              tenantAPI
                            )

                            console.log('Payment response:', paymentResponse)

                            // Verify payment on backend
                            console.log('Verifying payment on backend...')
                            const verifyResponse = await tenantAPI.verifyExpensePayment({
                              razorpay_order_id: paymentResponse.razorpay_order_id,
                              razorpay_payment_id: paymentResponse.razorpay_payment_id,
                              razorpay_signature: paymentResponse.razorpay_signature,
                              expenseIds: selectedExpensesForPayment
                            }).catch(err => {
                              console.error('Verify API error:', err)
                              throw new Error(`Verify Error: ${err.response?.status || 'Network'} - ${err.response?.data?.message || err.message}`)
                            })

                            console.log('Payment verified:', verifyResponse.data)

                            if (verifyResponse.data.success) {
                              // Update expenses to paid status
                              setExpenses(expenses.map(e => 
                                selectedExpensesForPayment.includes(e.id) 
                                  ? { ...e, status: 'paid' }
                                  : e
                              ))
                              setSelectedExpensesForPayment([])
                              setPaymentSuccess(true)
                              setTimeout(() => setPaymentSuccess(false), 3000)
                            }
                          } catch (error) {
                            console.error('❌ Payment error:', error)
                            console.error('Error stack:', error.stack)
                            
                            let errorMsg = 'Payment failed'
                            if (error.response?.status === 401) {
                              errorMsg = 'Unauthorized: Please login again'
                            } else if (error.response?.status === 400) {
                              errorMsg = 'Bad request: ' + (error.response?.data?.message || error.message)
                            } else if (error.response?.status === 500) {
                              errorMsg = 'Server error: ' + (error.response?.data?.message || error.message)
                            } else if (error.message === 'Network Error') {
                              errorMsg = 'Network Error: Cannot reach server at http://localhost:5000. Is backend running?'
                            } else {
                              errorMsg = error.message || 'Please try again'
                            }
                            
                            alert('❌ ' + errorMsg)
                          } finally {
                            setPaymentLoading(false)
                          }
                        }}
                        disabled={paymentLoading}
                        className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50"
                      >
                        {paymentLoading ? '💳 Processing...' : '💳 Pay Now'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {paymentSuccess && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg animate-pulse">
                  ✅ Payment successful! Expenses marked as paid.
                </div>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="card">
              <h3 className="text-2xl font-bold mb-6 text-text-dark">📝 Feedback & Ratings</h3>
              {feedbacks && feedbacks.length > 0 ? (
                <div className="space-y-4">
                  {feedbacks.map(feedback => (
                    <div key={feedback._id} className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-text-dark">{feedback.orderDetails?.canteenName}</p>
                          <p className="text-sm text-text-muted">Order #{feedback.orderDetails?.orderNumber}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-1 justify-end mb-1">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}>
                                ⭐
                              </span>
                            ))}
                          </div>
                          <p className="text-sm font-semibold text-blue-600">{feedback.rating}/5</p>
                        </div>
                      </div>
                      {feedback.comment && (
                        <p className="text-text-dark mb-2">{feedback.comment}</p>
                      )}
                      <p className="text-xs text-text-muted">
                        {new Date(feedback.createdAt).toLocaleDateString()} at {new Date(feedback.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-text-muted mb-2">No feedback submitted yet</p>
                  <p className="text-sm text-text-muted">Rate and review your delivered orders to help us improve!</p>
                </div>
              )}
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

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-2xl font-bold text-gray-800">🍽️ Subscribe to Meal Plan</h3>
              <button
                onClick={() => {
                  setShowSubscriptionModal(false)
                  setSelectedCanteen(null)
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {canteens && canteens.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-text-muted text-lg">No canteens available</p>
                </div>
              ) : (
                <form onSubmit={handleSubscribeToCanteen} className="space-y-6">
                  {/* Select Canteen */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Canteen <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedCanteen?._id || ''}
                      onChange={(e) => {
                        const hostel = canteens.find(h => h._id === e.target.value)
                        setSelectedCanteen(hostel)
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    >
                      <option value="">Choose a canteen...</option>
                      {canteens.map(hostel => (
                        <option key={hostel._id} value={hostel._id}>
                          {hostel.canteen?.name} - {hostel.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Available Plans */}
                  {selectedCanteen && selectedCanteen.canteen?.subscriptionPlans && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Choose Plan <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(selectedCanteen.canteen.subscriptionPlans).map(([key, plan]) => (
                          plan.enabled && (
                            <div
                              key={key}
                              onClick={() => setSubscriptionData({ ...subscriptionData, plan: key })}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                                subscriptionData.plan === key
                                  ? 'border-primary bg-blue-50'
                                  : 'border-gray-200 hover:border-primary'
                              }`}
                            >
                              <h4 className="font-bold text-text-dark capitalize mb-1">
                                {key.replace(/_/g, ' ')}
                              </h4>
                              <p className="text-sm text-primary font-bold">₹{plan.price}/month</p>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Duration (Months) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={subscriptionData.duration}
                      onChange={(e) => setSubscriptionData({ ...subscriptionData, duration: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    >
                      <option value="1">1 Month</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                    </select>
                  </div>

                  {/* Price Summary */}
                  {selectedCanteen && selectedCanteen.canteen?.subscriptionPlans && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Monthly Price:</span>
                        <span className="font-bold text-primary">
                          ₹{selectedCanteen.canteen.subscriptionPlans[subscriptionData.plan]?.price || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-700">Duration:</span>
                        <span className="font-bold">{subscriptionData.duration} month(s)</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                        <span className="text-2xl font-bold text-primary">
                          ₹{(selectedCanteen.canteen.subscriptionPlans[subscriptionData.plan]?.price || 0) * subscriptionData.duration}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSubscriptionModal(false)
                        setSelectedCanteen(null)
                      }}
                      className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                      disabled={subscriptionLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      disabled={subscriptionLoading || !selectedCanteen}
                    >
                      {subscriptionLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          💳 Subscribe Now
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contract Details Modal */}
      {selectedContractForDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary to-blue-700 text-white p-6 flex items-center justify-between rounded-t-lg z-10">
              <div>
                <h2 className="text-2xl font-bold">{selectedContractForDetails.hostel?.name}</h2>
                <p className="text-blue-100 text-sm mt-1">Contract Details</p>
              </div>
              <button
                onClick={() => setSelectedContractForDetails(null)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  selectedContractForDetails.status === 'active' ? 'bg-green-200 text-green-800' :
                  selectedContractForDetails.status === 'pending_signatures' ? 'bg-yellow-200 text-yellow-800' :
                  selectedContractForDetails.status === 'draft' ? 'bg-blue-200 text-blue-800' :
                  'bg-gray-200 text-gray-800'
                }`}>
                  {selectedContractForDetails.status === 'active' ? '✓ Active' :
                   selectedContractForDetails.status === 'pending_signatures' ? '⏳ Pending Approval' :
                   selectedContractForDetails.status === 'draft' ? '📝 Draft' :
                   selectedContractForDetails.status}
                </span>
                <p className="text-text-muted text-sm">Contract ID: <span className="font-mono">{selectedContractForDetails._id?.slice(-12)}</span></p>
              </div>

              {/* Room Information */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-bold text-text-dark mb-4">🛏️ Room Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-text-muted uppercase mb-2">Room Number</p>
                    <p className="text-2xl font-bold text-primary">{selectedContractForDetails.room?.roomNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-text-muted uppercase mb-2">Room Type</p>
                    <p className="text-lg font-semibold text-text-dark capitalize">{selectedContractForDetails.room?.roomType || 'N/A'}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-text-muted uppercase mb-2">Floor</p>
                    <p className="text-lg font-semibold text-text-dark">{selectedContractForDetails.room?.floor || 'N/A'}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-text-muted uppercase mb-2">Capacity</p>
                    <p className="text-lg font-semibold text-text-dark">{selectedContractForDetails.room?.capacity || 'N/A'} beds</p>
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-bold text-text-dark mb-4">💰 Financial Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-text-muted uppercase mb-2">Monthly Rent</p>
                    <p className="text-2xl font-bold text-green-600">₹{selectedContractForDetails.rent || 'N/A'}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-text-muted uppercase mb-2">Security Deposit</p>
                    <p className="text-2xl font-bold text-orange-600">₹{selectedContractForDetails.securityDeposit || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Contract Duration */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-bold text-text-dark mb-4">📅 Contract Duration</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-text-muted uppercase mb-2">Start Date</p>
                    <p className="text-lg font-semibold text-text-dark">
                      {selectedContractForDetails.startDate ? new Date(selectedContractForDetails.startDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-text-muted uppercase mb-2">End Date</p>
                    <p className="text-lg font-semibold text-text-dark">
                      {selectedContractForDetails.endDate ? new Date(selectedContractForDetails.endDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : 'Ongoing'}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-xs font-semibold text-text-muted uppercase mb-2">Duration</p>
                    <p className="text-lg font-semibold text-text-dark">
                      {selectedContractForDetails.startDate && selectedContractForDetails.endDate
                        ? `${Math.ceil((new Date(selectedContractForDetails.endDate) - new Date(selectedContractForDetails.startDate)) / (1000 * 60 * 60 * 24 * 30))} months`
                        : 'Ongoing'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-bold text-text-dark mb-4">👤 Owner Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase mb-1">Name</p>
                    <p className="text-lg font-semibold text-text-dark">{selectedContractForDetails.owner?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase mb-1">Phone</p>
                    <p className="text-lg font-semibold text-text-dark">📞 {selectedContractForDetails.owner?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase mb-1">Email</p>
                    <p className="text-lg font-semibold text-text-dark">✉️ {selectedContractForDetails.owner?.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedContractForDetails(null)}
                  className="flex-1 bg-gray-200 text-text-dark py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Close
                </button>
                {selectedContractForDetails.status === 'active' && (
                  <button
                    onClick={() => {
                      setContractToTerminate(selectedContractForDetails)
                      setSelectedContractForDetails(null)
                    }}
                    className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition"
                  >
                    ⚠️ Terminate Contract
                  </button>
                )}
              </div>
            </div>
            </div>

            {/* Modal Footer - Sticky */}
            <div className="sticky bottom-0 flex gap-3 p-6 border-t bg-white rounded-b-lg">
              <button
                onClick={() => setSelectedContractForDetails(null)}
                className="flex-1 bg-gray-200 text-text-dark py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Close
              </button>
              {selectedContractForDetails.status === 'active' && (
                <button
                  onClick={() => {
                    setContractToTerminate(selectedContractForDetails)
                    setSelectedContractForDetails(null)
                  }}
                  className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition"
                >
                  ⚠️ Terminate Contract
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Terminate Contract Confirmation Modal */}
      {contractToTerminate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full my-auto shadow-2xl">
            {/* Modal Header - Gradient */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Terminate Contract</h2>
                  <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
              <div className="p-6 space-y-5">
                {/* Contract Summary Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">📋 Contract Summary</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-muted font-medium">Hostel:</span>
                      <span className="font-bold text-text-dark">{contractToTerminate.hostel?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-muted font-medium">Room:</span>
                      <span className="font-bold text-text-dark">{contractToTerminate.room?.roomNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-text-muted font-medium">Monthly Rent:</span>
                      <span className="font-bold text-green-600">₹{contractToTerminate.rent}</span>
                    </div>
                  </div>
                </div>

                {/* Important Checklist */}
                <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4">
                  <p className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                    <span>⚡</span> Important Reminders
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-amber-800">
                      <span className="text-amber-600 mt-0.5">✓</span>
                      <span>Contact the owner <strong>before</strong> submitting termination</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-amber-800">
                      <span className="text-amber-600 mt-0.5">✓</span>
                      <span>Ensure <strong>all dues are settled</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-amber-800">
                      <span className="text-amber-600 mt-0.5">✓</span>
                      <span>Plan your <strong>room vacate date</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-amber-800">
                      <span className="text-amber-600 mt-0.5">✓</span>
                      <span>Owner will be notified <strong>automatically</strong></span>
                    </li>
                  </ul>
                </div>

                {/* Owner Contact Card */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-5">
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-3">📞 Quick Contact</p>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-text-muted font-semibold mb-1">Owner Name</p>
                      <p className="font-bold text-text-dark text-lg">{contractToTerminate.owner?.name || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => window.location.href = `tel:${contractToTerminate.owner?.phone}`}
                        className="bg-white border-2 border-purple-300 text-purple-700 py-2 rounded-lg text-sm font-semibold hover:bg-purple-50 transition flex items-center justify-center gap-2"
                      >
                        📱 Call
                      </button>
                      <button
                        onClick={() => window.location.href = `mailto:${contractToTerminate.owner?.email}`}
                        className="bg-white border-2 border-purple-300 text-purple-700 py-2 rounded-lg text-sm font-semibold hover:bg-purple-50 transition flex items-center justify-center gap-2"
                      >
                        ✉️ Email
                      </button>
                    </div>
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <label className="flex items-start gap-3 bg-gray-50 border-2 border-gray-200 rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-red-600 mt-1 cursor-pointer"
                    id="confirmTerminate"
                  />
                  <span className="text-sm font-semibold text-text-dark leading-relaxed">
                    I understand that terminating this contract will notify the owner and this action cannot be reversed. I have settled all dues.
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Footer - Sticky */}
            <div className="sticky bottom-0 flex gap-3 p-6 border-t bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-xl">
              <button
                onClick={() => setContractToTerminate(null)}
                className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-400 transition transform hover:scale-105"
              >
                ← Cancel
              </button>
              <button
                onClick={() => {
                  const confirmed = document.getElementById('confirmTerminate')?.checked
                  if (confirmed) {
                    setTerminationSuccess(true)
                    setContractToTerminate(null)
                  } else {
                    setTerminationError('Please confirm that you understand the termination process.')
                    setTimeout(() => setTerminationError(null), 3000)
                  }
                }}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg font-bold hover:shadow-lg transition transform hover:scale-105"
              >
                🗑️ Terminate Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Termination Success Modal */}
      {terminationSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl animate-in">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-8 text-center rounded-t-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold">Termination Submitted</h2>
              <p className="text-green-100 text-sm mt-2">Request successfully processed</p>
            </div>

            {/* Success Body */}
            <div className="p-8 space-y-6">
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                <p className="text-sm text-green-800 font-semibold mb-2">✓ What happens next:</p>
                <ul className="space-y-2 text-sm text-green-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">→</span>
                    <span>The hostel owner will be notified automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">→</span>
                    <span>Owner may contact you to confirm details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">→</span>
                    <span>Ensure you vacate by the agreed date</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">→</span>
                    <span>Your contract status will update to "Terminated"</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">📋 Important</p>
                <p className="text-sm text-blue-700">
                  Keep your communication records with the owner. If there are any disputes regarding security deposit or dues, these records will be important.
                </p>
              </div>

              <button
                onClick={() => setTerminationSuccess(false)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition transform hover:scale-105"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Termination Error Modal */}
      {terminationError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl animate-in">
            {/* Error Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 text-center rounded-t-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
                <span className="text-4xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold">Confirmation Required</h2>
            </div>

            {/* Error Body */}
            <div className="p-8 text-center">
              <p className="text-text-dark font-semibold mb-6">{terminationError}</p>
              <button
                onClick={() => setTerminationError(null)}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-bold hover:shadow-lg transition"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Order Modal */}
      {showCustomOrderModal && selectedCanteenForOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-2xl font-bold">📋 Place Custom Food Order</h3>
              <button
                onClick={() => {
                  setShowCustomOrderModal(false)
                  setCustomOrderItems([])
                  setOrderFormData({ specialInstructions: '', deliveryAddress: { roomNumber: '', floor: '', notes: '' } })
                  setOrderMessage('')
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Menu Items Column */}
                <div className="md:col-span-2 space-y-4">
                  <h4 className="font-bold text-lg text-text-dark">🍕 {selectedCanteenForOrder.canteen?.name} Menu</h4>

                  {/* Filters */}
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snacks">Snacks</option>
                      <option value="beverages">Beverages</option>
                    </select>
                    <select
                      value={foodTypeFilter}
                      onChange={(e) => setFoodTypeFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Types</option>
                      <option value="veg">Veg</option>
                      <option value="non-veg">Non-Veg</option>
                      <option value="vegan">Vegan</option>
                    </select>
                  </div>

                  {/* Menu Items List */}
                  <div className="border rounded-lg p-4 max-h-[500px] overflow-y-auto space-y-3 bg-gray-50">
                    {menuLoadingCanteenId === selectedCanteenForOrder.canteen._id ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
                          <p className="text-text-muted text-sm">Loading menu...</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {canteenMenuItems[selectedCanteenForOrder.canteen._id]?.filter(item => {
                          const matchCategory = categoryFilter === 'all' || item.category === categoryFilter
                          const matchType = foodTypeFilter === 'all' || item.foodType === foodTypeFilter
                          return matchCategory && matchType && item.isAvailable
                        }).length === 0 ? (
                          <p className="text-center text-text-muted py-8">No items available with selected filters</p>
                        ) : (
                          canteenMenuItems[selectedCanteenForOrder.canteen._id]?.filter(item => {
                            const matchCategory = categoryFilter === 'all' || item.category === categoryFilter
                            const matchType = foodTypeFilter === 'all' || item.foodType === foodTypeFilter
                            return matchCategory && matchType && item.isAvailable
                          }).map(item => (
                            <div key={item._id} className="bg-white border border-gray-200 rounded-lg p-3 flex items-start justify-between hover:border-green-500 transition">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-semibold text-text-dark">{item.name}</h5>
                                  {item.foodType === 'non-veg' && <span className="text-red-600 font-bold text-xs">🔴</span>}
                                  {item.foodType === 'veg' && <span className="text-green-600 font-bold text-xs">🟢</span>}
                                  {item.foodType === 'vegan' && <span className="text-orange-600 font-bold text-xs">🟡</span>}
                                </div>
                                <p className="text-sm text-text-muted">{item.description}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-sm font-bold text-primary">₹{item.price}</span>
                                  <span className="text-xs text-text-muted">⏱️ {item.preparationTime}min</span>
                                </div>
                              </div>
                              <button
                                onClick={() => addItemToOrder(item)}
                                className="bg-green-600 text-white px-3 py-1 rounded-lg font-semibold hover:bg-green-700 transition text-sm whitespace-nowrap ml-2"
                              >
                                + Add
                              </button>
                            </div>
                          ))
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Order Summary Column */}
                <div className="md:col-span-1 space-y-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-4 sticky top-20">
                    <h4 className="font-bold text-lg text-green-900 mb-4">🛒 Your Order</h4>
                    
                    {customOrderItems.length === 0 ? (
                      <p className="text-center text-text-muted text-sm py-4">Add items to get started</p>
                    ) : (
                      <>
                        <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
                          {customOrderItems.map(orderItem => (
                            <div key={orderItem.menuItem._id} className="bg-white rounded-lg p-2 text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold">{orderItem.menuItem.name}</span>
                                <span className="text-green-600 font-bold">₹{orderItem.menuItem.price * orderItem.quantity}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateItemQuantity(orderItem.menuItem._id, orderItem.quantity - 1)}
                                  className="bg-red-100 text-red-600 w-6 h-6 rounded flex items-center justify-center hover:bg-red-200"
                                >
                                  −
                                </button>
                                <span className="w-8 text-center font-semibold">{orderItem.quantity}</span>
                                <button
                                  onClick={() => updateItemQuantity(orderItem.menuItem._id, orderItem.quantity + 1)}
                                  className="bg-green-100 text-green-600 w-6 h-6 rounded flex items-center justify-center hover:bg-green-200"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => removeItemFromOrder(orderItem.menuItem._id)}
                                  className="ml-auto text-red-600 hover:text-red-800 font-bold text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Price Summary */}
                        <div className="bg-white rounded-lg p-3 space-y-2 border-t-2">
                          <div className="flex justify-between text-sm">
                            <span>Subtotal:</span>
                            <span className="font-semibold">₹{customOrderItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Delivery:</span>
                            <span className="font-semibold">₹{selectedCanteenForOrder.canteen?.deliveryCharge || 0}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold border-t pt-2 text-green-700">
                            <span>Total:</span>
                            <span>₹{customOrderItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0) + (selectedCanteenForOrder.canteen?.deliveryCharge || 0)}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery & Payment Form */}
              {customOrderItems.length > 0 && (
                <form onSubmit={handlePlaceCustomOrder} className="mt-6 space-y-4 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start gap-2 bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4">
                    <span className="text-blue-600 font-bold text-lg">ℹ️</span>
                    <p className="text-sm text-blue-700">
                      Your room number and floor are pre-filled from your profile. You can edit them if needed.
                    </p>
                  </div>
                  
                  <h4 className="font-bold text-lg text-text-dark">📦 Delivery & Instructions</h4>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Room Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={orderFormData.deliveryAddress.roomNumber || ''}
                        onChange={(e) => setOrderFormData({
                          ...orderFormData,
                          deliveryAddress: { ...orderFormData.deliveryAddress, roomNumber: e.target.value }
                        })}
                        placeholder="e.g., 301"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Floor</label>
                      <input
                        type="text"
                        value={orderFormData.deliveryAddress.floor || ''}
                        onChange={(e) => setOrderFormData({
                          ...orderFormData,
                          deliveryAddress: { ...orderFormData.deliveryAddress, floor: e.target.value }
                        })}
                        placeholder="e.g., 3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Address Notes</label>
                      <input
                        type="text"
                        value={orderFormData.deliveryAddress.notes || ''}
                        onChange={(e) => setOrderFormData({
                          ...orderFormData,
                          deliveryAddress: { ...orderFormData.deliveryAddress, notes: e.target.value }
                        })}
                        placeholder="e.g., Near window"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Special Instructions</label>
                    <textarea
                      value={orderFormData.specialInstructions || ''}
                      onChange={(e) => setOrderFormData({
                        ...orderFormData,
                        specialInstructions: e.target.value
                      })}
                      placeholder="e.g., No onions, less spicy, extra sauce..."
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  {orderMessage && (
                    <div className={`p-3 rounded-lg text-sm font-semibold ${
                      orderMessage.includes('✓') || orderMessage.includes('successfully')
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {orderMessage}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomOrderModal(false)
                        setCustomOrderItems([])
                        setOrderFormData({ specialInstructions: '', deliveryAddress: { roomNumber: '', floor: '', notes: '' } })
                        setOrderMessage('')
                      }}
                      className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={orderSubmitLoading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {orderSubmitLoading ? '⏳ Processing...' : '✓ Place Order & Pay'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedOrderForFeedback && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">⭐ Rate Your Order</h3>
              <button
                onClick={() => {
                  setShowFeedbackModal(false)
                  setSelectedOrderForFeedback(null)
                  setFeedbackFormData({ rating: 5, comment: '' })
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitFeedback} className="p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-text-muted mb-1">Order Details</p>
                <p className="font-bold text-text-dark">{selectedOrderForFeedback.canteen?.name}</p>
                <p className="text-sm text-text-muted">Order #{selectedOrderForFeedback.orderNumber}</p>
                <p className="text-sm text-text-muted">Items: {selectedOrderForFeedback.items.map(i => `${i.name} x${i.quantity}`).join(', ')}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-dark mb-3">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackFormData({ ...feedbackFormData, rating: star })}
                      className={`text-3xl transition transform hover:scale-110 ${
                        star <= feedbackFormData.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
                <p className="text-sm text-text-muted mt-2">{feedbackFormData.rating} out of 5 stars</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">Your Feedback (Optional)</label>
                <textarea
                  value={feedbackFormData.comment}
                  onChange={(e) => setFeedbackFormData({ ...feedbackFormData, comment: e.target.value })}
                  placeholder="Tell us what you think about the order, food quality, delivery, etc..."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowFeedbackModal(false)
                    setSelectedOrderForFeedback(null)
                    setFeedbackFormData({ rating: 5, comment: '' })
                  }}
                  className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={feedbackLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {feedbackLoading ? '⏳ Submitting...' : '✓ Submit Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

