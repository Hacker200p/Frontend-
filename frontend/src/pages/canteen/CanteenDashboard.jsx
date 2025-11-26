import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LogOut, Menu, X } from 'lucide-react'
import { canteenAPI } from '../../services/api'

export default function CanteenDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [canteens, setCanteens] = useState([])
  const [selectedCanteen, setSelectedCanteen] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCanteenModal, setShowCanteenModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'breakfast',
    foodType: 'veg',
    price: '',
    preparationTime: '20',
    isAvailable: true
  })
  const [canteenFormData, setCanteenFormData] = useState({
    name: '',
    description: '',
    hostel: '',
    servingHostels: [],
    address: '',
    cuisineTypes: [],
    deliveryCharge: '10'
  })
  const [selectedCity, setSelectedCity] = useState('')
  const [hostelsByCity, setHostelsByCity] = useState({})
  const [subscriptions, setSubscriptions] = useState([])
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [subscriptionPlans, setSubscriptionPlans] = useState({
    breakfast: { 
      enabled: false, 
      pure_veg: 0, 
      veg: 0, 
      non_veg_mix: 0,
      weeklyMenu: {
        monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
      }
    },
    lunch: { 
      enabled: false, 
      pure_veg: 0, 
      veg: 0, 
      non_veg_mix: 0,
      weeklyMenu: {
        monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
      }
    },
    dinner: { 
      enabled: false, 
      pure_veg: 0, 
      veg: 0, 
      non_veg_mix: 0,
      weeklyMenu: {
        monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: ''
      }
    },
    breakfast_lunch: { enabled: false, pure_veg: 0, veg: 0, non_veg_mix: 0 },
    lunch_dinner: { enabled: false, pure_veg: 0, veg: 0, non_veg_mix: 0 },
    all_meals: { enabled: false, pure_veg: 0, veg: 0, non_veg_mix: 0 },
  })
  const [expandedPlan, setExpandedPlan] = useState(null)
  const [weeklyMenu, setWeeklyMenu] = useState({
    monday: { breakfast: '', lunch: '', dinner: '' },
    tuesday: { breakfast: '', lunch: '', dinner: '' },
    wednesday: { breakfast: '', lunch: '', dinner: '' },
    thursday: { breakfast: '', lunch: '', dinner: '' },
    friday: { breakfast: '', lunch: '', dinner: '' },
    saturday: { breakfast: '', lunch: '', dinner: '' },
    sunday: { breakfast: '', lunch: '', dinner: '' },
  })
  
  const availableCuisines = [
    'North Indian',
    'South Indian',
    'Chinese',
    'Continental',
    'Italian',
    'Mexican',
    'Thai',
    'Fast Food',
    'Beverages',
    'Snacks',
    'Desserts'
  ]
  const [hostels, setHostels] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [feedbackFilter, setFeedbackFilter] = useState('all')
  const [showFeedbackResponse, setShowFeedbackResponse] = useState(null)
  const [feedbackResponse, setFeedbackResponse] = useState('')
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orderFilter, setOrderFilter] = useState('all') // all, pending, confirmed, preparing, ready, delivered
  const [showDeliveryTimeModal, setShowDeliveryTimeModal] = useState(false)
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState(null)
  const [estimatedDeliveryMinutes, setEstimatedDeliveryMinutes] = useState(30)
  const [showTenantRatingModal, setShowTenantRatingModal] = useState(false)
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null)
  const [tenantRating, setTenantRating] = useState(0)
  const [tenantRatingComment, setTenantRatingComment] = useState('')
  const [tenantRatingLoading, setTenantRatingLoading] = useState(false)
  const [canteenSettings, setCanteenSettings] = useState({
    isOpen: true,
    operatingHours: {
      breakfast: { start: '07:00', end: '10:00', enabled: true },
      lunch: { start: '12:00', end: '15:00', enabled: true },
      dinner: { start: '19:00', end: '22:00', enabled: true }
    },
    deliveryRadius: 5,
    minOrderAmount: 50,
    preparationTime: 30,
    contactPhone: '',
    contactEmail: ''
  })

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  useEffect(() => {
    fetchCanteens()
    fetchHostels()
  }, [])

  useEffect(() => {
    if (activeTab === 'orders' || activeTab === 'delivery' || activeTab === 'overview') {
      fetchOrders()
      
      // Auto-refresh orders every 30 seconds for orders and delivery tabs
      if (activeTab === 'orders' || activeTab === 'delivery') {
        const interval = setInterval(() => {
          fetchOrders()
        }, 30000)
        
        return () => clearInterval(interval)
      }
    }
  }, [activeTab])

  useEffect(() => {
    if (selectedCanteen) {
      fetchMenuItems()
      fetchSubscriptions()
      fetchFeedbacks()
      // Load subscription plans from canteen
      if (selectedCanteen.subscriptionPlans) {
        const plans = { ...selectedCanteen.subscriptionPlans }
        // Ensure weeklyMenu exists for each plan
        Object.keys(plans).forEach(key => {
          if (!plans[key].weeklyMenu) {
            plans[key].weeklyMenu = {
              monday: '',
              tuesday: '',
              wednesday: '',
              thursday: '',
              friday: '',
              saturday: '',
              sunday: '',
            }
          }
        })
        setSubscriptionPlans(plans)
      }
    }
  }, [selectedCanteen])

  const fetchHostels = async () => {
    try {
      const response = await canteenAPI.getAvailableHostels()
      setHostels(response.data?.data || [])
      setHostelsByCity(response.data?.byCity || {})
    } catch (error) {
      console.error('Error fetching hostels:', error)
      if (error.response?.status === 403) {
        console.error('Authorization error - User role may not be canteen_provider')
        console.error('Error message:', error.response?.data?.message)
      }
      setHostels([])
      setHostelsByCity({})
    }
  }

  const fetchCanteens = async () => {
    try {
      const response = await canteenAPI.getMyCanteens()
      const canteensData = response.data?.data || []
      setCanteens(canteensData)
      if (canteensData.length > 0) {
        setSelectedCanteen(canteensData[0])
      }
    } catch (error) {
      console.error('Error fetching canteens:', error)
    }
  }

  const fetchMenuItems = async () => {
    if (!selectedCanteen) return
    try {
      setLoading(true)
      const response = await canteenAPI.getCanteenMenu(selectedCanteen._id)
      setMenuItems(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching menu items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptions = async () => {
    if (!selectedCanteen) return
    try {
      const response = await canteenAPI.getCanteenSubscriptions(selectedCanteen._id)
      setSubscriptions(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    }
  }

  const fetchFeedbacks = async () => {
    if (!selectedCanteen) return
    try {
      const response = await canteenAPI.getCanteenFeedbacks(selectedCanteen._id)
      setFeedbacks(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
      setFeedbacks([])
    }
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

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true)
      const response = await canteenAPI.getOrders()
      setOrders(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus, deliveryMinutes = null) => {
    try {
      await canteenAPI.updateOrderStatus(orderId, newStatus, deliveryMinutes)
      // Refresh orders
      await fetchOrders()
      const statusMessages = {
        confirmed: 'Order confirmed!',
        preparing: 'Preparing order...',
        ready: 'Order is ready for delivery!',
        delivered: 'Order delivered successfully!',
        cancelled: 'Order cancelled'
      }
      showToast(statusMessages[newStatus] || `Order status updated to: ${newStatus}`, 'success')
    } catch (error) {
      console.error('Error updating order status:', error)
      showToast('Failed to update order status: ' + (error.response?.data?.message || error.message), 'error')
    }
  }

  const handleConfirmWithDeliveryTime = (order) => {
    setSelectedOrderForDelivery(order)
    setShowDeliveryTimeModal(true)
  }

  const confirmOrderWithTime = async () => {
    if (!selectedOrderForDelivery) return
    await handleUpdateOrderStatus(selectedOrderForDelivery._id, 'confirmed', estimatedDeliveryMinutes)
    setShowDeliveryTimeModal(false)
    setSelectedOrderForDelivery(null)
    setEstimatedDeliveryMinutes(30)
  }

  const submitTenantRating = async () => {
    if (!selectedOrderForRating || tenantRating === 0) {
      showToast('Please select a rating', 'error')
      return
    }

    try {
      setTenantRatingLoading(true)
      await canteenAPI.rateTenant(selectedOrderForRating._id, {
        rating: tenantRating,
        comment: tenantRatingComment.trim()
      })
      
      showToast('Tenant rated successfully!', 'success')
      setShowTenantRatingModal(false)
      setSelectedOrderForRating(null)
      setTenantRating(0)
      setTenantRatingComment('')
      await fetchOrders() // Refresh orders to show the rating
    } catch (error) {
      console.error('Error rating tenant:', error)
      showToast(error.response?.data?.message || 'Failed to rate tenant', 'error')
    } finally {
      setTenantRatingLoading(false)
    }
  }

  const handleUpdateSubscriptionPlans = async () => {
    if (!selectedCanteen) return
    try {
      setLoading(true)
      await canteenAPI.updateSubscriptionPlans(selectedCanteen._id, { subscriptionPlans })
      await fetchCanteens()
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3'
      successDiv.innerHTML = '✓ Subscription plans updated successfully!'
      document.body.appendChild(successDiv)
      setTimeout(() => successDiv.remove(), 3000)
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update subscription plans', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMenuItem = async (e) => {
    e.preventDefault()
    if (!selectedCanteen) {
      showToast('Please select a canteen first', 'error')
      return
    }
    try {
      setLoading(true)
      
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('foodType', formData.foodType)
      formDataToSend.append('price', Number(formData.price))
      formDataToSend.append('preparationTime', Number(formData.preparationTime))
      formDataToSend.append('isAvailable', formData.isAvailable)
      if (selectedImage) {
        formDataToSend.append('image', selectedImage)
      }
      
      await canteenAPI.addMenuItem(selectedCanteen._id, formDataToSend)
      setShowAddModal(false)
      resetForm()
      await fetchMenuItems()
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3'
      successDiv.innerHTML = '✓ Menu item added successfully!'
      document.body.appendChild(successDiv)
      setTimeout(() => successDiv.remove(), 3000)
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to add menu item', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMenuItem = async (e) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      setLoading(true)
      
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('foodType', formData.foodType)
      formDataToSend.append('price', Number(formData.price))
      formDataToSend.append('preparationTime', Number(formData.preparationTime))
      formDataToSend.append('isAvailable', formData.isAvailable)
      if (selectedImage) {
        formDataToSend.append('image', selectedImage)
      }
      
      await canteenAPI.updateMenuItem(editingItem._id, formDataToSend)
      setEditingItem(null)
      setShowAddModal(false)
      resetForm()
      await fetchMenuItems()
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3'
      successDiv.innerHTML = '✓ Menu item updated successfully!'
      document.body.appendChild(successDiv)
      setTimeout(() => successDiv.remove(), 3000)
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update menu item', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMenuItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return
    try {
      setLoading(true)
      await canteenAPI.deleteMenuItem(itemId)
      await fetchMenuItems()
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3'
      successDiv.innerHTML = '✓ Menu item deleted successfully!'
      document.body.appendChild(successDiv)
      setTimeout(() => successDiv.remove(), 3000)
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete menu item', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCanteen = async (canteenId) => {
    if (!confirm('⚠️ WARNING: This will permanently delete the canteen and ALL its menu items and orders. Are you sure?')) return
    try {
      setLoading(true)
      await canteenAPI.deleteCanteen(canteenId)
      
      // If deleted canteen was selected, clear selection
      if (selectedCanteen?._id === canteenId) {
        setSelectedCanteen(null)
        setMenuItems([])
      }
      
      await fetchCanteens()
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3'
      successDiv.innerHTML = '✓ Canteen deleted successfully!'
      document.body.appendChild(successDiv)
      setTimeout(() => successDiv.remove(), 3000)
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete canteen', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      foodType: item.foodType,
      price: item.price.toString(),
      preparationTime: item.preparationTime?.toString() || '20',
      isAvailable: item.isAvailable
    })
    setImagePreview(item.image?.url || null)
    setSelectedImage(null)
    setShowAddModal(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'breakfast',
      foodType: 'veg',
      price: '',
      preparationTime: '20',
      isAvailable: true
    })
    setSelectedImage(null)
    setImagePreview(null)
  }

  const resetCanteenForm = () => {
    setCanteenFormData({
      name: '',
      description: '',
      hostel: '',
      servingHostels: [],
      address: '',
      cuisineTypes: [],
      deliveryCharge: '10'
    })
    setSelectedCity('')
  }

  const toggleServingHostel = (hostelId) => {
    setCanteenFormData(prev => ({
      ...prev,
      servingHostels: prev.servingHostels.includes(hostelId)
        ? prev.servingHostels.filter(id => id !== hostelId)
        : [...prev.servingHostels, hostelId]
    }))
  }

  const toggleCuisine = (cuisine) => {
    setCanteenFormData(prev => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(cuisine)
        ? prev.cuisineTypes.filter(c => c !== cuisine)
        : [...prev.cuisineTypes, cuisine]
    }))
  }

  const handleCreateCanteen = async (e) => {
    e.preventDefault()
    if (!canteenFormData.hostel) {
      showToast('Please select a primary hostel', 'error')
      return
    }
    try {
      setLoading(true)
      
      await canteenAPI.createCanteen({
        name: canteenFormData.name,
        description: canteenFormData.description,
        hostel: canteenFormData.hostel,
        servingHostels: canteenFormData.servingHostels,
        address: canteenFormData.address,
        cuisineTypes: canteenFormData.cuisineTypes,
        deliveryCharge: Number(canteenFormData.deliveryCharge)
      })
      
      setShowCanteenModal(false)
      resetCanteenForm()
      await fetchCanteens()
      // Success feedback with better UI
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-slide-in'
      successDiv.innerHTML = '✓ Canteen created successfully!'
      document.body.appendChild(successDiv)
      setTimeout(() => successDiv.remove(), 3000)
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create canteen', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebarMenuItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'orders', label: 'Orders Management', icon: '📦' },
    { id: 'subscriptions', label: 'Subscriptions', icon: '📅' },
    { id: 'preferences', label: 'Tenant Preferences', icon: '📋' },
    { id: 'delivery', label: 'Delivery Coordination', icon: '🚚' },
    { id: 'menu', label: 'Menu Management', icon: '🍽️' },
    { id: 'feedback', label: 'Feedback', icon: '⭐' },
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
            {sidebarMenuItems.map((item) => (
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
            {sidebarMenuItems.find((item) => item.id === activeTab)?.label}
          </h2>
          <div className="text-text-muted">Welcome, {user?.name}</div>
        </div>

        {/* Content Area */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl p-8 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h2>
                    <p className="text-blue-100">Manage your canteen operations efficiently</p>
                  </div>
                  <div className="text-6xl">🍽️</div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-primary hover:shadow-xl transition">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-text-muted text-sm font-semibold">Orders Today</p>
                    <span className="text-3xl">📦</span>
                  </div>
                  <h3 className="text-4xl font-bold text-primary">
                    {orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString()).length}
                  </h3>
                  <p className="text-text-muted text-sm mt-2">
                    {orders.filter(o => o.orderStatus === 'pending' || o.orderStatus === 'confirmed').length} pending
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-text-muted text-sm font-semibold">Active Subscribers</p>
                    <span className="text-3xl">👥</span>
                  </div>
                  <h3 className="text-4xl font-bold text-purple-600">
                    {subscriptions.filter(s => s.status === 'active').length}
                  </h3>
                  <p className="text-text-muted text-sm mt-2">Total subscriptions</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500 hover:shadow-xl transition">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-text-muted text-sm font-semibold">Rating</p>
                    <span className="text-3xl">⭐</span>
                  </div>
                  <h3 className="text-4xl font-bold text-yellow-600">
                    {feedbacks.length > 0 ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1) : '0.0'}/5
                  </h3>
                  <p className="text-text-muted text-sm mt-2">Based on {feedbacks.length} reviews</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500 hover:shadow-xl transition">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-text-muted text-sm font-semibold">Active Orders</p>
                    <span className="text-3xl">🚚</span>
                  </div>
                  <h3 className="text-4xl font-bold text-orange-600">
                    {orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.orderStatus)).length}
                  </h3>
                  <p className="text-orange-600 text-sm mt-2">In progress</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-6 text-text-dark flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  Quick Actions
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    onClick={() => setActiveTab('orders')}
                  >
                    <span className="text-xl">📋</span>
                    View Orders
                  </button>
                  <button 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    onClick={() => setActiveTab('menu')}
                  >
                    <span className="text-xl">🍽️</span>
                    Update Menu
                  </button>
                  <button 
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    onClick={() => setShowCanteenModal(true)}
                  >
                    <span className="text-xl">➕</span>
                    New Canteen
                  </button>
                  <button 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">📢</span>
                    Notify
                  </button>
                </div>
              </div>

              {/* Canteen Overview */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-text-dark flex items-center gap-2">
                    <span className="text-2xl">🏪</span>
                    My Canteens
                  </h3>
                  {canteens.length > 0 ? (
                    <div className="space-y-3">
                      {canteens.map(canteen => (
                        <div key={canteen._id} className="border border-gray-200 rounded-lg p-4 hover:border-primary transition">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-text-dark">{canteen.name}</h4>
                              <p className="text-sm text-text-muted">{canteen.hostel?.name || 'No hostel'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                Active
                              </span>
                              <button
                                onClick={() => handleDeleteCanteen(canteen._id)}
                                className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                                title="Delete Canteen"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-text-muted">
                      <p className="mb-4">No canteens yet</p>
                      <button onClick={() => setShowCanteenModal(true)} className="btn-primary text-sm">
                        Create Your First Canteen
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-4 text-text-dark flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {(() => {
                      const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3)
                      const recentFeedbacks = [...feedbacks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 2)
                      
                      const activities = [
                        ...recentOrders.map(order => ({
                          type: 'order',
                          icon: order.orderStatus === 'delivered' ? '✅' : '🆕',
                          text: order.orderStatus === 'delivered' 
                            ? `Order #${order.orderNumber} delivered`
                            : `New order #${order.orderNumber} - ${order.orderStatus}`,
                          time: order.createdAt
                        })),
                        ...recentFeedbacks.map(feedback => ({
                          type: 'feedback',
                          icon: '⭐',
                          text: `New ${feedback.rating}-star review`,
                          time: feedback.createdAt
                        }))
                      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5)

                      if (activities.length === 0) {
                        return (
                          <div className="text-center py-8 text-text-muted">
                            <p>No recent activity</p>
                          </div>
                        )
                      }

                      return activities.map((activity, idx) => (
                        <div key={idx} className={`flex items-start gap-3 ${idx < activities.length - 1 ? 'pb-3 border-b' : ''}`}>
                          <span className="text-2xl">{activity.icon}</span>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-text-dark">{activity.text}</p>
                            <p className="text-xs text-text-muted">
                              {(() => {
                                const diff = Date.now() - new Date(activity.time).getTime()
                                const minutes = Math.floor(diff / 60000)
                                const hours = Math.floor(diff / 3600000)
                                const days = Math.floor(diff / 86400000)
                                
                                if (minutes < 1) return 'Just now'
                                if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
                                if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
                                return `${days} day${days > 1 ? 's' : ''} ago`
                              })()}
                            </p>
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Filter Buttons */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-text-dark">📋 Custom Orders</h3>
                  <button
                    onClick={fetchOrders}
                    className="btn-secondary text-sm"
                  >
                    🔄 Refresh
                  </button>
                </div>
                
                <div className="flex gap-2 flex-wrap mb-6">
                  {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setOrderFilter(filter)}
                      className={`px-4 py-2 rounded-lg font-semibold capitalize transition ${
                        orderFilter === filter
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-text-dark hover:bg-gray-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-muted">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-text-muted text-lg">No orders yet</p>
                    <p className="text-sm text-gray-500 mt-2">Orders from tenants will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders
                      .filter(order => orderFilter === 'all' || order.orderStatus === orderFilter)
                      .map(order => (
                        <div key={order._id} className="border-2 rounded-xl p-4 hover:shadow-lg transition">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-lg text-text-dark">Order #{order.orderNumber}</h4>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                                  order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  order.orderStatus === 'ready' ? 'bg-blue-100 text-blue-700' :
                                  order.orderStatus === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                                  order.orderStatus === 'confirmed' ? 'bg-purple-100 text-purple-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {order.orderStatus}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {order.paymentStatus}
                                </span>
                              </div>
                              <div className="text-sm text-text-muted space-y-1">
                                <p><span className="font-semibold">👤 Tenant:</span> {order.tenant?.name || 'N/A'} ({order.tenant?.phone})</p>
                                <p><span className="font-semibold">🏠 Delivery:</span> Room {order.deliveryAddress?.roomNumber}, Floor {order.deliveryAddress?.floor}, {order.deliveryAddress?.hostelName}</p>
                                <p><span className="font-semibold">🕐 Ordered:</span> {new Date(order.createdAt).toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">₹{order.totalAmount}</p>
                              <p className="text-xs text-text-muted mt-1">{order.paymentMethod}</p>
                            </div>
                          </div>

                          {/* Order Items */}
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="text-xs font-semibold text-text-dark mb-2">📦 Items:</p>
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-text-dark">{item.name} <span className="text-text-muted">x{item.quantity}</span></span>
                                  <span className="font-semibold">₹{item.price * item.quantity}</span>
                                </div>
                              ))}
                              {order.deliveryCharge > 0 && (
                                <div className="flex justify-between text-sm border-t pt-1">
                                  <span className="text-text-muted">Delivery Charge</span>
                                  <span className="font-semibold">₹{order.deliveryCharge}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {order.specialInstructions && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-3 mb-4">
                              <p className="text-xs font-semibold text-blue-900 mb-1">📝 Special Instructions:</p>
                              <p className="text-sm text-blue-800">{order.specialInstructions}</p>
                            </div>
                          )}

                          {/* Estimated Delivery Time Display */}
                          {order.estimatedDeliveryTime && order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                            <div className="bg-green-50 border-l-4 border-green-500 rounded p-3 mb-4">
                              <p className="text-xs font-semibold text-green-900 mb-1">⏰ Estimated Delivery:</p>
                              <p className="text-sm text-green-800 font-bold">
                                {new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-IN', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                                {' '}({Math.round((new Date(order.estimatedDeliveryTime) - new Date()) / 60000)} min remaining)
                              </p>
                            </div>
                          )}

                          {/* Status Update Actions */}
                          {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                            <div className="flex gap-2 flex-wrap">
                              {order.orderStatus === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleConfirmWithDeliveryTime(order)}
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition text-sm"
                                  >
                                    ✓ Confirm Order
                                  </button>
                                  <button
                                    onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition text-sm"
                                  >
                                    ✕ Cancel Order
                                  </button>
                                </>
                              )}
                              {order.orderStatus === 'confirmed' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order._id, 'preparing')}
                                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition text-sm"
                                >
                                  👨‍🍳 Start Preparing
                                </button>
                              )}
                              {order.orderStatus === 'preparing' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order._id, 'ready')}
                                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition text-sm"
                                >
                                  ✓ Mark as Ready
                                </button>
                              )}
                              {order.orderStatus === 'ready' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order._id, 'delivered')}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition text-sm"
                                >
                                  🚚 Mark as Delivered
                                </button>
                              )}
                            </div>
                          )}

                          {order.orderStatus === 'delivered' && order.deliveredAt && (
                            <div className="mt-3 space-y-2">
                              <div className="text-sm text-green-600 font-semibold">
                                ✓ Delivered on {new Date(order.deliveredAt).toLocaleString('en-IN')}
                              </div>
                              
                              {/* Tenant Rating Section */}
                              {order.tenantRating && order.tenantRating.rating ? (
                                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-3">
                                  <div className="flex items-start gap-3">
                                    <div className="text-2xl">⭐</div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-yellow-900">Tenant Rating</span>
                                        <div className="flex gap-1">
                                          {[...Array(5)].map((_, i) => (
                                            <span key={i} className={i < order.tenantRating.rating ? 'text-yellow-400 text-lg' : 'text-gray-300 text-lg'}>
                                              ★
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                      {order.tenantRating.comment && (
                                        <p className="text-sm text-yellow-900">{order.tenantRating.comment}</p>
                                      )}
                                      <p className="text-xs text-yellow-700 mt-1">
                                        Rated on {new Date(order.tenantRating.ratedAt).toLocaleDateString('en-IN')}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedOrderForRating(order)
                                    setShowTenantRatingModal(true)
                                    setTenantRating(0)
                                    setTenantRatingComment('')
                                  }}
                                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 px-4 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                                >
                                  ⭐ Rate Tenant
                                </button>
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

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {!selectedCanteen ? (
                <div className="card text-center py-12">
                  <p className="text-text-muted text-lg">Please select a canteen to view tenant preferences</p>
                </div>
              ) : (
                <>
                  <div className="card">
                    <h3 className="text-2xl font-bold mb-6 text-text-dark">📋 Tenant Food Preferences</h3>
                    
                    {subscriptions.filter(s => s.status === 'active').length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-text-muted text-lg">No active subscribers with preferences yet</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Quick Statistics */}
                        <div className="grid md:grid-cols-4 gap-4">
                          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
                            <div className="text-green-600 text-2xl mb-2">🟢</div>
                            <div className="text-2xl font-bold text-green-700">
                              {subscriptions.filter(s => s.status === 'active' && s.foodType === 'pure_veg').length}
                            </div>
                            <div className="text-xs text-green-600 font-medium">Pure Veg Subscribers</div>
                          </div>

                          <div className="bg-gradient-to-br from-lime-50 to-lime-100 rounded-xl p-4 border-2 border-lime-200">
                            <div className="text-lime-600 text-2xl mb-2">🥗</div>
                            <div className="text-2xl font-bold text-lime-700">
                              {subscriptions.filter(s => s.status === 'active' && s.foodType === 'veg').length}
                            </div>
                            <div className="text-xs text-lime-600 font-medium">Veg Subscribers</div>
                          </div>

                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200">
                            <div className="text-orange-600 text-2xl mb-2">🍗</div>
                            <div className="text-2xl font-bold text-orange-700">
                              {subscriptions.filter(s => s.status === 'active' && s.foodType === 'non_veg_mix').length}
                            </div>
                            <div className="text-xs text-orange-600 font-medium">Non-Veg Subscribers</div>
                          </div>

                          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-200">
                            <div className="text-red-600 text-2xl mb-2">🌶️</div>
                            <div className="text-2xl font-bold text-red-700">
                              {subscriptions.filter(s => s.status === 'active' && s.spiceLevel && s.spiceLevel !== 'mild').length}
                            </div>
                            <div className="text-xs text-red-600 font-medium">Prefer Spicy</div>
                          </div>
                        </div>

                        {/* Preferences Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Tenant</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Location</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Plan</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Food Type</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Cuisine Pref</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Spice Level</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Allergies</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Special Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {subscriptions.filter(s => s.status === 'active').map(sub => (
                                <tr key={sub._id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-text-dark">{sub.tenant?.name}</div>
                                    <div className="text-xs text-text-muted">📞 {sub.tenant?.phone}</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="text-sm">
                                      <div className="font-semibold text-text-dark">
                                        {sub.deliveryLocation?.hostelName || 'N/A'}
                                      </div>
                                      <div className="text-xs text-text-muted">
                                        Room {sub.deliveryLocation?.roomNumber}, Floor {sub.deliveryLocation?.floor}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold capitalize">
                                      {sub.plan.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      sub.foodType === 'pure_veg' ? 'bg-green-100 text-green-700' :
                                      sub.foodType === 'veg' ? 'bg-lime-100 text-lime-700' :
                                      'bg-orange-100 text-orange-700'
                                    }`}>
                                      {sub.foodType === 'pure_veg' ? '🟢 Pure Veg' :
                                       sub.foodType === 'veg' ? '🥗 Veg' :
                                       '🍗 Non-Veg'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {sub.cuisinePreferences && sub.cuisinePreferences.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {sub.cuisinePreferences.slice(0, 2).map((cuisine, idx) => (
                                          <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                            {cuisine}
                                          </span>
                                        ))}
                                        {sub.cuisinePreferences.length > 2 && (
                                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                            +{sub.cuisinePreferences.length - 2}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-text-muted text-sm">No preference</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                      sub.spiceLevel === 'mild' ? 'bg-green-100 text-green-700' :
                                      sub.spiceLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                      sub.spiceLevel === 'hot' ? 'bg-orange-100 text-orange-700' :
                                      sub.spiceLevel === 'extra_hot' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>
                                      {sub.spiceLevel ? (
                                        <>
                                          {sub.spiceLevel === 'mild' && '😊 Mild'}
                                          {sub.spiceLevel === 'medium' && '🌶️ Medium'}
                                          {sub.spiceLevel === 'hot' && '🌶️🌶️ Hot'}
                                          {sub.spiceLevel === 'extra_hot' && '🌶️🌶️🌶️ Extra Hot'}
                                        </>
                                      ) : 'Not set'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {sub.allergies && sub.allergies.length > 0 ? (
                                      <div className="text-xs">
                                        <div className="font-semibold text-red-600 flex items-center gap-1">
                                          ⚠️ Has Allergies
                                        </div>
                                        <div className="text-red-700 mt-1">
                                          {sub.allergies.join(', ')}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-text-muted text-sm">None</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {sub.specialInstructions ? (
                                      <div className="text-xs text-text-dark max-w-xs">
                                        {sub.specialInstructions.length > 50 
                                          ? sub.specialInstructions.substring(0, 50) + '...'
                                          : sub.specialInstructions}
                                      </div>
                                    ) : (
                                      <span className="text-text-muted text-sm">None</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Dish Preferences Summary */}
                        <div className="card bg-gradient-to-r from-purple-50 to-pink-50">
                          <h4 className="text-xl font-bold mb-4 text-text-dark">🍽️ Popular Dish Preferences</h4>
                          <div className="grid md:grid-cols-3 gap-4">
                            {['breakfast', 'lunch', 'dinner'].map(meal => {
                              const mealSubs = subscriptions.filter(s => 
                                s.status === 'active' && 
                                s.dishPreferences && 
                                s.dishPreferences[meal]
                              )
                              
                              if (mealSubs.length === 0) return null

                              return (
                                <div key={meal} className="bg-white rounded-lg p-4 border-2 border-purple-200">
                                  <h5 className="font-bold text-lg text-primary capitalize mb-3 flex items-center gap-2">
                                    {meal === 'breakfast' ? '🌅' : meal === 'lunch' ? '☀️' : '🌙'}
                                    {meal}
                                  </h5>
                                  <div className="space-y-2">
                                    {mealSubs.slice(0, 5).map(sub => (
                                      <div key={sub._id} className="text-sm">
                                        <div className="font-semibold text-text-dark">{sub.tenant?.name}</div>
                                        <div className="text-xs text-text-muted">
                                          Qty: {sub.dishPreferences[meal]?.quantity || 1} • 
                                          {sub.dishPreferences[meal]?.items?.join(', ') || 'Standard'}
                                        </div>
                                      </div>
                                    ))}
                                    {mealSubs.length > 5 && (
                                      <div className="text-xs text-text-muted">
                                        +{mealSubs.length - 5} more subscribers
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Allergy Warnings */}
                        {subscriptions.filter(s => s.status === 'active' && s.allergies && s.allergies.length > 0).length > 0 && (
                          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                            <div className="flex gap-3">
                              <span className="text-red-600 text-2xl">⚠️</span>
                              <div className="flex-1">
                                <div className="font-bold text-red-900 mb-2">Allergy Alert Summary</div>
                                <div className="space-y-1">
                                  {subscriptions
                                    .filter(s => s.status === 'active' && s.allergies && s.allergies.length > 0)
                                    .map(sub => (
                                      <div key={sub._id} className="text-sm text-red-800">
                                        <span className="font-semibold">{sub.tenant?.name}</span> 
                                        {' '}(Room {sub.deliveryLocation?.roomNumber}): 
                                        {' '}<span className="font-medium">{sub.allergies.join(', ')}</span>
                                      </div>
                                    ))}
                                </div>
                                <div className="mt-3 text-xs text-red-700">
                                  ⚠️ Please ensure these allergens are not present in the prepared meals for these tenants.
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Cuisine Preferences Analysis */}
                        <div className="card bg-gradient-to-r from-blue-50 to-cyan-50">
                          <h4 className="text-xl font-bold mb-4 text-text-dark">📊 Cuisine Preferences Analysis</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-semibold text-text-dark mb-2">Most Requested Cuisines</h5>
                              <div className="space-y-2">
                                {(() => {
                                  const cuisineCount = {}
                                  subscriptions
                                    .filter(s => s.status === 'active' && s.cuisinePreferences)
                                    .forEach(sub => {
                                      sub.cuisinePreferences.forEach(cuisine => {
                                        cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 1
                                      })
                                    })
                                  
                                  return Object.entries(cuisineCount)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 5)
                                    .map(([cuisine, count]) => (
                                      <div key={cuisine} className="flex items-center justify-between bg-white rounded px-3 py-2 border">
                                        <span className="text-sm font-semibold text-text-dark">{cuisine}</span>
                                        <span className="bg-primary text-white px-2 py-1 rounded-full text-xs font-bold">
                                          {count} {count === 1 ? 'subscriber' : 'subscribers'}
                                        </span>
                                      </div>
                                    ))
                                })()}
                              </div>
                            </div>

                            <div>
                              <h5 className="font-semibold text-text-dark mb-2">Spice Level Distribution</h5>
                              <div className="space-y-2">
                                {['mild', 'medium', 'hot', 'extra_hot'].map(level => {
                                  const count = subscriptions.filter(
                                    s => s.status === 'active' && s.spiceLevel === level
                                  ).length
                                  if (count === 0) return null
                                  
                                  return (
                                    <div key={level} className="flex items-center justify-between bg-white rounded px-3 py-2 border">
                                      <span className="text-sm font-semibold text-text-dark capitalize">
                                        {level === 'mild' && '😊 Mild'}
                                        {level === 'medium' && '🌶️ Medium'}
                                        {level === 'hot' && '🌶️🌶️ Hot'}
                                        {level === 'extra_hot' && '🌶️🌶️🌶️ Extra Hot'}
                                      </span>
                                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-bold">
                                        {count} {count === 1 ? 'person' : 'people'}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-6">
              {/* Active Orders for Delivery */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-text-dark">🚚 Delivery Coordination - Active Orders</h3>
                  <button
                    onClick={fetchOrders}
                    className="btn-secondary text-sm"
                  >
                    🔄 Refresh
                  </button>
                </div>
                
                {ordersLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-muted">Loading orders...</p>
                  </div>
                ) : (
                  (() => {
                    const activeOrders = orders.filter(o => 
                      ['confirmed', 'preparing', 'ready'].includes(o.orderStatus) && 
                      o.paymentStatus === 'paid'
                    )
                    
                    if (activeOrders.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <div className="text-6xl mb-4">🚚</div>
                          <p className="text-text-muted text-lg">No active orders for delivery</p>
                          <p className="text-sm text-gray-500 mt-2">Orders marked as ready will appear here</p>
                        </div>
                      )
                    }

                    // Group orders by hostel/location
                    const ordersByLocation = {}
                    activeOrders.forEach(order => {
                      const locationKey = order.deliveryAddress?.hostelName || 'Unknown Location'
                      const hostelAddress = formatAddress(order.deliveryAddress?.hostelAddress)
                      
                      if (!ordersByLocation[locationKey]) {
                        ordersByLocation[locationKey] = {
                          hostelName: locationKey,
                          hostelAddress: hostelAddress,
                          orders: []
                        }
                      }
                      ordersByLocation[locationKey].orders.push(order)
                    })

                    return (
                      <div className="space-y-6">
                        {/* Summary Stats */}
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-4">
                            <div className="text-yellow-700 text-sm font-semibold">Confirmed Orders</div>
                            <div className="text-3xl font-bold text-yellow-800">
                              {activeOrders.filter(o => o.orderStatus === 'confirmed').length}
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-4">
                            <div className="text-orange-700 text-sm font-semibold">Preparing</div>
                            <div className="text-3xl font-bold text-orange-800">
                              {activeOrders.filter(o => o.orderStatus === 'preparing').length}
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4">
                            <div className="text-blue-700 text-sm font-semibold">Ready for Delivery</div>
                            <div className="text-3xl font-bold text-blue-800">
                              {activeOrders.filter(o => o.orderStatus === 'ready').length}
                            </div>
                          </div>
                        </div>

                        {/* Orders by Location */}
                        {Object.values(ordersByLocation).map(location => (
                          <div key={location.hostelName} className="border-2 border-primary rounded-xl overflow-hidden">
                            {/* Location Header */}
                            <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="text-lg font-bold flex items-center gap-2">
                                    🏠 {location.hostelName}
                                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                                      {location.orders.length} {location.orders.length === 1 ? 'order' : 'orders'}
                                    </span>
                                  </h5>
                                  {location.hostelAddress && (
                                    <p className="text-sm text-white/90 mt-1">📍 {location.hostelAddress}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Orders Table */}
                            <div className="bg-white overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark">Order #</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark">Room</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark">Tenant</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark">Items</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark">Est. Delivery</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark">Amount</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {location.orders
                                    .sort((a, b) => {
                                      // Sort by status priority: ready > preparing > confirmed
                                      const statusOrder = { ready: 0, preparing: 1, confirmed: 2 }
                                      return statusOrder[a.orderStatus] - statusOrder[b.orderStatus]
                                    })
                                    .map(order => (
                                      <tr key={order._id} className={`hover:bg-blue-50 transition ${
                                        order.orderStatus === 'ready' ? 'bg-blue-50/50' : ''
                                      }`}>
                                        <td className="px-4 py-3">
                                          <div className="font-bold text-primary">
                                            {order.orderNumber}
                                          </div>
                                          <div className="text-xs text-text-muted">
                                            {new Date(order.createdAt).toLocaleTimeString('en-IN', { 
                                              hour: '2-digit', 
                                              minute: '2-digit' 
                                            })}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="font-bold text-text-dark">
                                            Room {order.deliveryAddress?.roomNumber}
                                          </div>
                                          <div className="text-xs text-text-muted">
                                            Floor {order.deliveryAddress?.floor}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="font-semibold text-text-dark">
                                            {order.tenant?.name}
                                          </div>
                                          <div className="text-xs text-text-muted">
                                            {order.tenant?.phone}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="text-sm text-text-dark">
                                            {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                                          </div>
                                          <div className="text-xs text-text-muted">
                                            {order.items.slice(0, 2).map(item => item.name).join(', ')}
                                            {order.items.length > 2 && '...'}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            order.orderStatus === 'ready' ? 'bg-blue-100 text-blue-700' :
                                            order.orderStatus === 'preparing' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-purple-100 text-purple-700'
                                          }`}>
                                            {order.orderStatus === 'ready' ? '✓ Ready' :
                                             order.orderStatus === 'preparing' ? '👨‍🍳 Preparing' :
                                             '✓ Confirmed'}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3">
                                          {order.estimatedDeliveryTime ? (
                                            <div>
                                              <div className="font-bold text-green-700">
                                                {new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-IN', { 
                                                  hour: '2-digit', 
                                                  minute: '2-digit' 
                                                })}
                                              </div>
                                              <div className="text-xs text-text-muted">
                                                {Math.max(0, Math.round((new Date(order.estimatedDeliveryTime) - new Date()) / 60000))} min
                                              </div>
                                            </div>
                                          ) : (
                                            <span className="text-xs text-gray-400">Not set</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="font-bold text-primary">
                                            ₹{order.totalAmount}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()
                )}
              </div>

              {/* Subscription Deliveries */}
              <div className="card">
                <h3 className="text-2xl font-bold mb-6 text-text-dark">📅 Subscription Meal Deliveries</h3>
                
                {!selectedCanteen ? (
                  <div className="text-center py-12">
                    <p className="text-text-muted text-lg">Please select a canteen to view subscription deliveries</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Active Subscriptions by Location */}
                    <div>
                      <h4 className="text-xl font-bold mb-4 text-text-dark flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                          {subscriptions.filter(s => s.status === 'active').length}
                        </span>
                        Active Meal Subscriptions by Location
                      </h4>
                      
                      {subscriptions.filter(s => s.status === 'active').length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                          <p className="text-text-muted">No active subscriptions for delivery</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Group subscriptions by hostel */}
                          {(() => {
                            const groupedByHostel = {}
                            subscriptions
                              .filter(s => s.status === 'active')
                              .forEach(sub => {
                                const hostelKey = sub.deliveryLocation?.hostelName || 'Unknown Location'
                                if (!groupedByHostel[hostelKey]) {
                                  groupedByHostel[hostelKey] = {
                                    hostel: sub.deliveryLocation,
                                    subscriptions: []
                                  }
                                }
                                groupedByHostel[hostelKey].subscriptions.push(sub)
                              })
                            
                            return Object.entries(groupedByHostel).map(([hostelName, data]) => (
                              <div key={hostelName} className="border-2 border-primary rounded-xl overflow-hidden">
                                {/* Hostel Header */}
                                <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h5 className="text-lg font-bold flex items-center gap-2">
                                        🏠 {hostelName}
                                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                                          {data.subscriptions.length} {data.subscriptions.length === 1 ? 'subscriber' : 'subscribers'}
                                        </span>
                                      </h5>
                                      {data.hostel && (
                                        <p className="text-sm text-white/90 mt-1">
                                          📍 {formatAddress(data.hostel.hostelAddress)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Subscriptions List */}
                                <div className="bg-white">
                                  <table className="w-full">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark">Room</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark">Tenant</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark">Meal Plan</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark">Food Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark">Valid Until</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-text-dark">Contact</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {data.subscriptions.map(sub => (
                                        <tr key={sub._id} className="hover:bg-blue-50 transition">
                                          <td className="px-4 py-3">
                                            <div className="font-bold text-primary">
                                              Room {sub.deliveryLocation?.roomNumber}
                                            </div>
                                            <div className="text-xs text-text-muted">
                                              Floor {sub.deliveryLocation?.floor}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="font-semibold text-text-dark">
                                              {sub.tenant?.name}
                                            </div>
                                          </td>
                                          <td className="px-4 py-3">
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold capitalize">
                                              {sub.plan.replace('_', ' ')}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                              sub.foodType === 'pure_veg' ? 'bg-green-100 text-green-700' :
                                              sub.foodType === 'veg' ? 'bg-lime-100 text-lime-700' :
                                              'bg-orange-100 text-orange-700'
                                            }`}>
                                              {sub.foodType === 'pure_veg' ? '🟢 Pure Veg' :
                                               sub.foodType === 'veg' ? '🥗 Veg' :
                                               '🍗 Non-Veg'}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="text-sm text-text-dark">
                                              {new Date(sub.endDate).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-text-muted">
                                              {Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24))} days left
                                            </div>
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="text-sm text-text-dark">
                                              {sub.tenant?.phone}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>

                                  {/* Meal Plan Summary for this hostel */}
                                  <div className="bg-gray-50 p-4 border-t">
                                    <div className="text-sm font-semibold text-text-dark mb-2">📋 Today's Delivery Summary for {hostelName}:</div>
                                    <div className="grid grid-cols-3 gap-4">
                                      {['breakfast', 'lunch', 'dinner'].map(meal => {
                                        const mealSubs = data.subscriptions.filter(s => 
                                          s.plan === meal || 
                                          (s.plan === 'breakfast_lunch' && (meal === 'breakfast' || meal === 'lunch')) ||
                                          (s.plan === 'lunch_dinner' && (meal === 'lunch' || meal === 'dinner')) ||
                                          s.plan === 'all_meals'
                                        )
                                        return (
                                          <div key={meal} className="bg-white rounded-lg p-3 border">
                                            <div className="text-xs font-semibold text-text-muted capitalize mb-1">{meal}</div>
                                            <div className="text-2xl font-bold text-primary">{mealSubs.length}</div>
                                            <div className="text-xs text-text-muted mt-1">
                                              {mealSubs.filter(s => s.foodType === 'pure_veg').length} Pure Veg •{' '}
                                              {mealSubs.filter(s => s.foodType === 'veg').length} Veg •{' '}
                                              {mealSubs.filter(s => s.foodType === 'non_veg_mix').length} Non-Veg
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Overall Statistics */}
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                        <div className="text-green-600 text-3xl mb-2">🏠</div>
                        <div className="text-2xl font-bold text-green-700">
                          {new Set(subscriptions.filter(s => s.status === 'active').map(s => s.deliveryLocation?.hostelName)).size}
                        </div>
                        <div className="text-sm text-green-600 font-medium">Delivery Locations</div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                        <div className="text-blue-600 text-3xl mb-2">👥</div>
                        <div className="text-2xl font-bold text-blue-700">
                          {subscriptions.filter(s => s.status === 'active').length}
                        </div>
                        <div className="text-sm text-blue-600 font-medium">Active Subscribers</div>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200">
                        <div className="text-orange-600 text-3xl mb-2">🍱</div>
                        <div className="text-2xl font-bold text-orange-700">
                          {subscriptions.filter(s => s.status === 'active').reduce((acc, s) => {
                            if (s.plan === 'all_meals') return acc + 3
                            if (s.plan === 'breakfast_lunch' || s.plan === 'lunch_dinner') return acc + 2
                            return acc + 1
                          }, 0)}
                        </div>
                        <div className="text-sm text-orange-600 font-medium">Daily Meals</div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
                        <div className="text-purple-600 text-3xl mb-2">💰</div>
                        <div className="text-2xl font-bold text-purple-700">
                          ₹{subscriptions.filter(s => s.status === 'active').reduce((acc, s) => acc + (s.price || 0), 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-purple-600 font-medium">Monthly Revenue</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="space-y-6">
              {/* Canteen Selection */}
              {canteens.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
                  <label className="flex items-center gap-2 text-sm font-bold text-text-dark mb-3">
                    <span className="text-xl">🏪</span>
                    Select Canteen
                  </label>
                  <select
                    value={selectedCanteen?._id || ''}
                    onChange={(e) => setSelectedCanteen(canteens.find(c => c._id === e.target.value))}
                    className="w-full md:w-1/2 px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold text-text-dark bg-white shadow-sm"
                  >
                    {canteens.map(canteen => (
                      <option key={canteen._id} value={canteen._id}>
                        {canteen.name} - {canteen.hostel?.name || 'No hostel'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {canteens.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-text-muted text-lg mb-4">You don't have any canteens yet.</p>
                  <button 
                    className="btn-primary"
                    onClick={() => setShowCanteenModal(true)}
                  >
                    + Create Canteen
                  </button>
                </div>
              ) : (
                <div className="card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-text-dark">Menu Items</h3>
                    <button
                      onClick={() => {
                        resetForm()
                        setEditingItem(null)
                        setShowAddModal(true)
                      }}
                      className="btn-primary"
                    >
                      + Add New Item
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="text-text-muted mt-4">Loading menu items...</p>
                    </div>
                  ) : menuItems.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-text-muted text-lg">No menu items yet. Add your first item!</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {menuItems.map((item) => (
                        <div key={item._id} className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-primary transition shadow-md">
                          <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200">
                            {item.image?.url ? (
                              <img 
                                src={item.image.url} 
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-6xl">🍽️</span>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-bold text-lg text-text-dark">{item.name}</h4>
                                <p className="text-sm text-text-muted">{item.description}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                item.foodType === 'veg' ? 'bg-green-100 text-green-700' : 
                                item.foodType === 'non-veg' ? 'bg-red-100 text-red-700' : 
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {item.foodType.toUpperCase()}
                              </span>
                            </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-text-muted">Category:</span>
                              <span className="font-semibold capitalize">{item.category}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-text-muted">Price:</span>
                              <span className="font-bold text-primary text-lg">₹{item.price}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-text-muted">Prep Time:</span>
                              <span className="font-semibold">{item.preparationTime} mins</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-text-muted">Status:</span>
                              <span className={`font-semibold ${item.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                {item.isAvailable ? '✓ Available' : '✗ Unavailable'}
                              </span>
                            </div>
                          </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(item)}
                                className="flex-1 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMenuItem(item._id)}
                                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              {canteens.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-text-muted text-lg mb-4">Create a canteen first to manage subscriptions.</p>
                </div>
              ) : (
                <>
                  {/* Subscription Plans Management */}
                  <div className="card">
                    <h3 className="text-2xl font-bold mb-6 text-text-dark">Monthly Subscription Plans</h3>
                    
                    {selectedCanteen && (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[
                            { key: 'breakfast', label: 'Breakfast Only', icon: '🌅', hasMenu: true },
                            { key: 'lunch', label: 'Lunch Only', icon: '🍱', hasMenu: true },
                            { key: 'dinner', label: 'Dinner Only', icon: '🌙', hasMenu: true },
                            { key: 'breakfast_lunch', label: 'Breakfast + Lunch', icon: '☀️', hasMenu: false },
                            { key: 'lunch_dinner', label: 'Lunch + Dinner', icon: '🌆', hasMenu: false },
                            { key: 'all_meals', label: 'All Meals', icon: '🍽️', hasMenu: false },
                          ].map(plan => (
                            <div key={plan.key} className="border-2 border-gray-200 rounded-lg p-4">
                              <div 
                                className="flex items-center justify-between mb-3 cursor-pointer"
                                onClick={() => plan.hasMenu && subscriptionPlans[plan.key]?.enabled && setExpandedPlan(expandedPlan === plan.key ? null : plan.key)}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{plan.icon}</span>
                                  <h4 className="font-bold text-text-dark">{plan.label}</h4>
                                </div>
                                {plan.hasMenu && subscriptionPlans[plan.key]?.enabled && (
                                  <button className="text-primary text-xl">
                                    {expandedPlan === plan.key ? '▼' : '▶'}
                                  </button>
                                )}
                              </div>
                              
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`${plan.key}-enabled`}
                                    checked={subscriptionPlans[plan.key]?.enabled || false}
                                    onChange={(e) => setSubscriptionPlans({
                                      ...subscriptionPlans,
                                      [plan.key]: { ...subscriptionPlans[plan.key], enabled: e.target.checked }
                                    })}
                                    className="w-4 h-4"
                                  />
                                  <label htmlFor={`${plan.key}-enabled`} className="text-sm font-semibold">
                                    Enable Plan
                                  </label>
                                </div>
                                
                                {subscriptionPlans[plan.key]?.enabled && (
                                  <div className="space-y-2">
                                    <div>
                                      <label className="block text-xs font-semibold text-text-dark mb-1">
                                        🟢 Pure Veg (₹/month)
                                      </label>
                                      <input
                                        type="number"
                                        value={subscriptionPlans[plan.key]?.pure_veg || 0}
                                        onChange={(e) => setSubscriptionPlans({
                                          ...subscriptionPlans,
                                          [plan.key]: { ...subscriptionPlans[plan.key], pure_veg: Number(e.target.value) }
                                        })}
                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                        min="0"
                                        placeholder="2000"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-text-dark mb-1">
                                        🥗 Veg (₹/month)
                                      </label>
                                      <input
                                        type="number"
                                        value={subscriptionPlans[plan.key]?.veg || 0}
                                        onChange={(e) => setSubscriptionPlans({
                                          ...subscriptionPlans,
                                          [plan.key]: { ...subscriptionPlans[plan.key], veg: Number(e.target.value) }
                                        })}
                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                        min="0"
                                        placeholder="2200"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-text-dark mb-1">
                                        🍗 Non-Veg Mix (₹/month)
                                      </label>
                                      <input
                                        type="number"
                                        value={subscriptionPlans[plan.key]?.non_veg_mix || 0}
                                        onChange={(e) => setSubscriptionPlans({
                                          ...subscriptionPlans,
                                          [plan.key]: { ...subscriptionPlans[plan.key], non_veg_mix: Number(e.target.value) }
                                        })}
                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                        min="0"
                                        placeholder="2500"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Weekly Menu Dropdown */}
                              {expandedPlan === plan.key && plan.hasMenu && subscriptionPlans[plan.key]?.enabled && (
                                <div className="mt-4 border-t-2 border-primary pt-4 bg-blue-50 p-4 rounded-lg">
                                  <div className="flex items-center gap-2 mb-4">
                                    <span className="text-xl">📅</span>
                                    <h5 className="font-bold text-base text-primary">Weekly Menu for {plan.label}</h5>
                                  </div>
                                  <div className="space-y-3">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
                                      <div key={day} className="bg-white p-3 rounded-lg border border-gray-200">
                                        <label className="flex items-center gap-2 text-xs font-bold text-text-dark mb-2">
                                          <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                            {index + 1}
                                          </span>
                                          {day}
                                        </label>
                                        <textarea
                                          value={subscriptionPlans[plan.key]?.weeklyMenu?.[day.toLowerCase()] || ''}
                                          onChange={(e) => setSubscriptionPlans({
                                            ...subscriptionPlans,
                                            [plan.key]: {
                                              ...subscriptionPlans[plan.key],
                                              weeklyMenu: {
                                                ...subscriptionPlans[plan.key]?.weeklyMenu,
                                                [day.toLowerCase()]: e.target.value
                                              }
                                            }
                                          })}
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary resize-none"
                                          rows="2"
                                          placeholder="e.g., Idli, Vada, Sambar, Chutney, Tea"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <p className="text-xs text-text-muted mt-3 italic">
                                    💡 Tip: List all dishes that will be served on each day
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <button
                          onClick={handleUpdateSubscriptionPlans}
                          disabled={loading}
                          className="btn-primary disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save Subscription Plans'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Active Subscriptions List */}
                  <div className="card">
                    <h3 className="text-2xl font-bold mb-6 text-text-dark">Active Subscriptions</h3>
                    
                    {subscriptions.length === 0 ? (
                      <p className="text-text-muted text-center py-8">No active subscriptions yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Tenant</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Plan</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Food Type</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Delivery Location</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Duration</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Price</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Status</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">Payment</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {subscriptions.map(sub => (
                              <tr key={sub._id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-semibold text-text-dark">{sub.tenant?.name}</p>
                                    <p className="text-sm text-text-muted">{sub.tenant?.phone}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold capitalize">
                                    {sub.plan.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    sub.foodType === 'pure_veg' ? 'bg-green-100 text-green-700' :
                                    sub.foodType === 'veg' ? 'bg-lime-100 text-lime-700' :
                                    'bg-orange-100 text-orange-700'
                                  }`}>
                                    {sub.foodType === 'pure_veg' ? '🟢 Pure Veg' :
                                     sub.foodType === 'veg' ? '🥗 Veg' :
                                     '🍗 Non-Veg Mix'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  {sub.deliveryLocation ? (
                                    <div>
                                      <p className="font-semibold text-text-dark">🏠 {sub.deliveryLocation.hostelName}</p>
                                      <p className="text-text-muted">Room {sub.deliveryLocation.roomNumber}, Floor {sub.deliveryLocation.floor}</p>
                                      <p className="text-xs text-text-muted">{formatAddress(sub.deliveryLocation.hostelAddress)}</p>
                                    </div>
                                  ) : (
                                    <span className="text-text-muted">Not set</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <div>
                                    <p className="text-text-dark">{new Date(sub.startDate).toLocaleDateString()}</p>
                                    <p className="text-text-muted">to {new Date(sub.endDate).toLocaleDateString()}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-bold text-primary">₹{sub.price}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    sub.status === 'active' ? 'bg-green-100 text-green-700' :
                                    sub.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                                    sub.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {sub.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                    sub.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                                    sub.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {sub.paymentStatus}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-6">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-text-dark">⭐ Customer Feedback</h3>
                  {selectedCanteen && (
                    <div className="text-sm text-text-muted">
                      {feedbacks.length} total reviews
                    </div>
                  )}
                </div>

                {!selectedCanteen ? (
                  <div className="text-center py-12">
                    <p className="text-text-muted text-lg">Please select a canteen to view feedback</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Overall Rating Summary */}
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border-2 border-yellow-200">
                        <div className="text-yellow-600 text-3xl mb-2">⭐</div>
                        <div className="text-3xl font-bold text-yellow-700">
                          {feedbacks.length > 0 ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1) : '0.0'}
                        </div>
                        <div className="text-sm text-yellow-600 font-medium">Average Rating</div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                        <div className="text-green-600 text-3xl mb-2">👍</div>
                        <div className="text-3xl font-bold text-green-700">
                          {feedbacks.filter(f => f.rating >= 4).length}
                        </div>
                        <div className="text-sm text-green-600 font-medium">Positive Reviews</div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                        <div className="text-blue-600 text-3xl mb-2">💬</div>
                        <div className="text-3xl font-bold text-blue-700">
                          {feedbacks.filter(f => !f.response).length}
                        </div>
                        <div className="text-sm text-blue-600 font-medium">Pending Responses</div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
                        <div className="text-purple-600 text-3xl mb-2">📊</div>
                        <div className="text-3xl font-bold text-purple-700">
                          {feedbacks.length}
                        </div>
                        <div className="text-sm text-purple-600 font-medium">Total Feedback</div>
                      </div>
                    </div>

                    {/* Filter Options */}
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setFeedbackFilter('all')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          feedbackFilter === 'all'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-text-dark hover:bg-gray-200'
                        }`}
                      >
                        All ({feedbacks.length})
                      </button>
                      <button
                        onClick={() => setFeedbackFilter('pending')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          feedbackFilter === 'pending'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-text-dark hover:bg-gray-200'
                        }`}
                      >
                        Pending Response ({feedbacks.filter(f => !f.response).length})
                      </button>
                      <button
                        onClick={() => setFeedbackFilter('5star')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          feedbackFilter === '5star'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-text-dark hover:bg-gray-200'
                        }`}
                      >
                        5 Stars ({feedbacks.filter(f => f.rating === 5).length})
                      </button>
                      <button
                        onClick={() => setFeedbackFilter('low')}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          feedbackFilter === 'low'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-text-dark hover:bg-gray-200'
                        }`}
                      >
                        Needs Attention ({feedbacks.filter(f => f.rating <= 3).length})
                      </button>
                    </div>

                    {/* Feedback List */}
                    <div className="space-y-4">
                      {feedbacks
                        .filter(f => {
                          if (feedbackFilter === 'all') return true
                          if (feedbackFilter === 'pending') return !f.response
                          if (feedbackFilter === '5star') return f.rating === 5
                          if (feedbackFilter === 'low') return f.rating <= 3
                          return true
                        })
                        .map(feedback => (
                          <div key={feedback._id} className={`border-2 rounded-xl overflow-hidden ${
                            feedback.rating <= 3 ? 'border-red-200 bg-red-50' :
                            feedback.rating === 4 ? 'border-blue-200 bg-blue-50' :
                            'border-green-200 bg-green-50'
                          }`}>
                            <div className="p-5">
                              {/* Feedback Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="font-bold text-text-dark">{feedback.user?.name || 'Anonymous'}</div>
                                    <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <span key={i} className={i < feedback.rating ? 'text-yellow-500' : 'text-gray-300'}>
                                          ⭐
                                        </span>
                                      ))}
                                    </div>
                                    {feedback.targetId?.orderNumber && (
                                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                        Order #{feedback.targetId.orderNumber}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-text-muted">
                                    📞 {feedback.user?.phone || 'N/A'} • {new Date(feedback.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>

                              {/* Feedback Comment */}
                              <div className="bg-white rounded-lg p-4 mb-3">
                                <p className="text-text-dark">{feedback.comment}</p>
                              </div>

                              {/* Response Section */}
                              {feedback.response ? (
                                <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-4">
                                  <div className="text-sm font-semibold text-blue-700 mb-1">Your Response:</div>
                                  <p className="text-blue-900">{feedback.response}</p>
                                </div>
                              ) : (
                                <div>
                                  {showFeedbackResponse === feedback._id ? (
                                    <div className="space-y-3">
                                      <textarea
                                        value={feedbackResponse}
                                        onChange={(e) => setFeedbackResponse(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-primary rounded-lg focus:ring-2 focus:ring-primary"
                                        rows="3"
                                        placeholder="Type your response to the customer..."
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => {
                                            // Update feedback with response
                                            const updatedFeedbacks = feedbacks.map(f => 
                                              f._id === feedback._id ? { ...f, response: feedbackResponse } : f
                                            )
                                            setFeedbacks(updatedFeedbacks)
                                            setShowFeedbackResponse(null)
                                            setFeedbackResponse('')
                                          }}
                                          className="btn-primary"
                                        >
                                          Send Response
                                        </button>
                                        <button
                                          onClick={() => {
                                            setShowFeedbackResponse(null)
                                            setFeedbackResponse('')
                                          }}
                                          className="btn-secondary"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setShowFeedbackResponse(feedback._id)}
                                      className="text-primary font-semibold hover:underline"
                                    >
                                      💬 Respond to this feedback
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>

                    {feedbacks.filter(f => {
                      if (feedbackFilter === 'all') return true
                      if (feedbackFilter === 'pending') return !f.response
                      if (feedbackFilter === '5star') return f.rating === 5
                      if (feedbackFilter === 'low') return f.rating <= 3
                      return true
                    }).length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-text-muted text-lg">No feedback found for this filter</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {!selectedCanteen ? (
                <div className="card text-center py-12">
                  <p className="text-text-muted text-lg">Please select a canteen to manage settings</p>
                </div>
              ) : (
                <>
                  {/* Canteen Profile */}
                  <div className="card">
                    <h3 className="text-2xl font-bold mb-6 text-text-dark">🏪 Canteen Profile</h3>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-text-dark mb-2">Canteen Name</label>
                          <input
                            type="text"
                            value={selectedCanteen.name}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-text-dark mb-2">Status</label>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setCanteenSettings({ ...canteenSettings, isOpen: !canteenSettings.isOpen })}
                              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                                canteenSettings.isOpen
                                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                                  : 'bg-red-100 text-red-700 border-2 border-red-300'
                              }`}
                            >
                              {canteenSettings.isOpen ? '✅ Open for Orders' : '🔒 Closed'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-text-dark mb-2">Description</label>
                        <textarea
                          value={selectedCanteen.description || ''}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                          rows="3"
                          readOnly
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-text-dark mb-2">Contact Phone</label>
                          <input
                            type="tel"
                            value={canteenSettings.contactPhone}
                            onChange={(e) => setCanteenSettings({ ...canteenSettings, contactPhone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            placeholder="9876543210"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-text-dark mb-2">Contact Email</label>
                          <input
                            type="email"
                            value={canteenSettings.contactEmail}
                            onChange={(e) => setCanteenSettings({ ...canteenSettings, contactEmail: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            placeholder="canteen@example.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operating Hours */}
                  <div className="card">
                    <h3 className="text-2xl font-bold mb-6 text-text-dark">⏰ Operating Hours</h3>
                    <div className="space-y-4">
                      {['breakfast', 'lunch', 'dinner'].map(meal => (
                        <div key={meal} className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">
                                {meal === 'breakfast' ? '🌅' : meal === 'lunch' ? '☀️' : '🌙'}
                              </span>
                              <h4 className="font-bold text-lg text-text-dark capitalize">{meal}</h4>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={canteenSettings.operatingHours[meal].enabled}
                                onChange={(e) => setCanteenSettings({
                                  ...canteenSettings,
                                  operatingHours: {
                                    ...canteenSettings.operatingHours,
                                    [meal]: { ...canteenSettings.operatingHours[meal], enabled: e.target.checked }
                                  }
                                })}
                                className="w-5 h-5 text-primary"
                              />
                              <span className="text-sm font-semibold text-text-dark">Enabled</span>
                            </label>
                          </div>
                          {canteenSettings.operatingHours[meal].enabled && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-text-dark mb-1">Start Time</label>
                                <input
                                  type="time"
                                  value={canteenSettings.operatingHours[meal].start}
                                  onChange={(e) => setCanteenSettings({
                                    ...canteenSettings,
                                    operatingHours: {
                                      ...canteenSettings.operatingHours,
                                      [meal]: { ...canteenSettings.operatingHours[meal], start: e.target.value }
                                    }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-text-dark mb-1">End Time</label>
                                <input
                                  type="time"
                                  value={canteenSettings.operatingHours[meal].end}
                                  onChange={(e) => setCanteenSettings({
                                    ...canteenSettings,
                                    operatingHours: {
                                      ...canteenSettings.operatingHours,
                                      [meal]: { ...canteenSettings.operatingHours[meal], end: e.target.value }
                                    }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Settings */}
                  <div className="card">
                    <h3 className="text-2xl font-bold mb-6 text-text-dark">📦 Order Settings</h3>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-text-dark mb-2">Delivery Radius (km)</label>
                          <input
                            type="number"
                            value={canteenSettings.deliveryRadius}
                            onChange={(e) => setCanteenSettings({ ...canteenSettings, deliveryRadius: Number(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            min="1"
                            max="20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-text-dark mb-2">Min Order Amount (₹)</label>
                          <input
                            type="number"
                            value={canteenSettings.minOrderAmount}
                            onChange={(e) => setCanteenSettings({ ...canteenSettings, minOrderAmount: Number(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-text-dark mb-2">Avg Preparation Time (min)</label>
                          <input
                            type="number"
                            value={canteenSettings.preparationTime}
                            onChange={(e) => setCanteenSettings({ ...canteenSettings, preparationTime: Number(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            min="5"
                            max="120"
                          />
                        </div>
                      </div>

                      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                        <div className="flex gap-3">
                          <span className="text-blue-600 text-xl">ℹ️</span>
                          <div>
                            <div className="font-semibold text-blue-900 mb-1">Order Settings Info</div>
                            <ul className="text-sm text-blue-800 space-y-1">
                              <li>• Delivery radius determines how far you can deliver from your canteen location</li>
                              <li>• Minimum order amount helps cover delivery costs</li>
                              <li>• Preparation time gives customers realistic delivery expectations</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cuisine Types */}
                  <div className="card">
                    <h3 className="text-2xl font-bold mb-6 text-text-dark">🍽️ Cuisine Types</h3>
                    <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedCanteen.cuisineTypes?.map((cuisine) => (
                          <div key={cuisine} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border">
                            <span className="text-green-600">✓</span>
                            <span className="text-sm font-semibold text-text-dark">{cuisine}</span>
                          </div>
                        ))}
                      </div>
                      {(!selectedCanteen.cuisineTypes || selectedCanteen.cuisineTypes.length === 0) && (
                        <p className="text-text-muted text-center py-4">No cuisine types selected</p>
                      )}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        showToast('Settings saved successfully!', 'success')
                        // Implement save API call here
                      }}
                      className="btn-primary px-8"
                    >
                      💾 Save Settings
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Menu Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-text-dark">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingItem(null)
                  resetForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={editingItem ? handleUpdateMenuItem : handleAddMenuItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">Item Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  required
                  placeholder="e.g., Biryani, Dosa, Tea"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  rows="3"
                  placeholder="Brief description of the item"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snacks">Snacks</option>
                    <option value="beverages">Beverages</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2">Food Type *</label>
                  <select
                    value={formData.foodType}
                    onChange={(e) => setFormData({...formData, foodType: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    required
                    min="0"
                    step="0.01"
                    placeholder="e.g., 150"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-dark mb-2">Preparation Time (mins)</label>
                  <input
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({...formData, preparationTime: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    min="1"
                    placeholder="e.g., 20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">Item Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
                {imagePreview && (
                  <div className="mt-3">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                  className="w-4 h-4"
                />
                <label htmlFor="isAvailable" className="text-sm font-semibold text-text-dark">
                  Available for ordering
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingItem(null)
                    resetForm()
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Canteen Modal */}
      {showCanteenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-text-dark">Create New Canteen</h3>
              <button
                onClick={() => {
                  setShowCanteenModal(false)
                  resetCanteenForm()
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateCanteen} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">Canteen Name *</label>
                <input
                  type="text"
                  value={canteenFormData.name}
                  onChange={(e) => setCanteenFormData({...canteenFormData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  required
                  placeholder="e.g., SafeStay Canteen, Tasty Bites"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">Description</label>
                <textarea
                  value={canteenFormData.description}
                  onChange={(e) => setCanteenFormData({...canteenFormData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  rows="3"
                  placeholder="Brief description of your canteen"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">Canteen Address</label>
                <input
                  type="text"
                  value={canteenFormData.address}
                  onChange={(e) => setCanteenFormData({...canteenFormData, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="Physical location of your canteen"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">Filter by City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- All Cities --</option>
                  {Object.keys(hostelsByCity).sort().map(city => (
                    <option key={city} value={city}>
                      {city} ({hostelsByCity[city].length} hostels)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">Primary Hostel *</label>
                <select
                  value={canteenFormData.hostel}
                  onChange={(e) => setCanteenFormData({...canteenFormData, hostel: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">-- Select primary hostel --</option>
                  {(selectedCity ? hostelsByCity[selectedCity] || [] : hostels).map(hostel => (
                    <option key={hostel._id} value={hostel._id}>
                      {hostel.name} - {hostel.city || hostel.address?.city || ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  The city of your primary hostel will be used for your canteen
                </p>
                {hostels.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    No hostels available. Contact a hostel owner to link your canteen.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">
                  Additional Hostels to Serve
                  {canteenFormData.servingHostels.length > 0 && (
                    <span className="ml-2 text-primary">({canteenFormData.servingHostels.length} selected)</span>
                  )}
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {(selectedCity ? hostelsByCity[selectedCity] || [] : hostels).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {selectedCity ? `No hostels available in ${selectedCity}` : 'No hostels available'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(selectedCity ? hostelsByCity[selectedCity] || [] : hostels).map(hostel => (
                        <label
                          key={hostel._id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                            canteenFormData.servingHostels.includes(hostel._id)
                              ? 'bg-blue-50 border-2 border-primary'
                              : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={canteenFormData.servingHostels.includes(hostel._id)}
                            onChange={() => toggleServingHostel(hostel._id)}
                            className="w-4 h-4 text-primary focus:ring-primary"
                            disabled={canteenFormData.hostel === hostel._id}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-text-dark">{hostel.name}</div>
                            <div className="text-sm text-gray-600">
                              {typeof hostel.address === 'object' 
                                ? `${hostel.address.city || ''}, ${hostel.address.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || hostel.city
                                : hostel.address || hostel.city || 'No address'}
                            </div>
                          </div>
                          {canteenFormData.hostel === hostel._id && (
                            <span className="text-xs bg-primary text-white px-2 py-1 rounded">Primary</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select additional hostels where you want to provide food delivery service
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">Cuisine Types</label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    {availableCuisines.map((cuisine) => (
                      <label
                        key={cuisine}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition"
                      >
                        <input
                          type="checkbox"
                          checked={canteenFormData.cuisineTypes.includes(cuisine)}
                          onChange={() => toggleCuisine(cuisine)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                        />
                        <span className="text-sm text-text-dark">{cuisine}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Selected: {canteenFormData.cuisineTypes.length > 0 ? canteenFormData.cuisineTypes.join(', ') : 'None'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">Delivery Charge (₹)</label>
                <input
                  type="number"
                  value={canteenFormData.deliveryCharge}
                  onChange={(e) => setCanteenFormData({...canteenFormData, deliveryCharge: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 10"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || hostels.length === 0}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Canteen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCanteenModal(false)
                    resetCanteenForm()
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tenant Rating Modal */}
      {showTenantRatingModal && selectedOrderForRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">⭐ Rate Tenant</h2>
                  <p className="text-sm text-white/90 mt-1">Order #{selectedOrderForRating.orderNumber}</p>
                </div>
                <button
                  onClick={() => setShowTenantRatingModal(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-text-dark mb-2">
                  Tenant: {selectedOrderForRating.tenant?.name} ({selectedOrderForRating.tenant?.phone})
                </p>
                <div className="space-y-1">
                  {selectedOrderForRating.items.map((item, idx) => (
                    <div key={idx} className="text-xs text-text-muted flex justify-between">
                      <span>{item.name} x{item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-text-muted mt-2 pt-2 border-t border-gray-200">
                  <span className="font-semibold">Delivered to:</span> Room {selectedOrderForRating.deliveryAddress?.roomNumber}, 
                  Floor {selectedOrderForRating.deliveryAddress?.floor}
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-sm font-bold text-text-dark mb-3">
                  How was your experience with this tenant?
                </label>
                <div className="flex justify-center gap-3 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setTenantRating(star)}
                      className="text-5xl transition-all hover:scale-110"
                    >
                      <span className={star <= tenantRating ? 'text-yellow-400' : 'text-gray-300'}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <div className="text-center text-sm text-gray-600">
                  {tenantRating === 0 && 'Tap to rate'}
                  {tenantRating === 1 && '😞 Poor'}
                  {tenantRating === 2 && '😐 Fair'}
                  {tenantRating === 3 && '🙂 Good'}
                  {tenantRating === 4 && '😊 Very Good'}
                  {tenantRating === 5 && '🤩 Excellent'}
                </div>
              </div>

              {/* Rating Guidelines */}
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-3">
                <p className="text-xs text-blue-900 font-semibold mb-2">Rating Guidelines:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Payment promptness</li>
                  <li>• Communication & responsiveness</li>
                  <li>• Following delivery instructions</li>
                  <li>• Overall ordering experience</li>
                </ul>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-bold text-text-dark mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  value={tenantRatingComment}
                  onChange={(e) => setTenantRatingComment(e.target.value.slice(0, 500))}
                  placeholder="Share your experience with this tenant..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
                  rows="4"
                  maxLength="500"
                />
                <p className="text-xs text-text-muted mt-1">
                  {tenantRatingComment.length}/500 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTenantRatingModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-text-dark rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  disabled={tenantRatingLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={submitTenantRating}
                  disabled={tenantRatingLoading || tenantRating === 0}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tenantRatingLoading ? 'Submitting...' : '✓ Submit Rating'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Time Modal */}
      {showDeliveryTimeModal && selectedOrderForDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowDeliveryTimeModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-text-dark">⏰ Set Delivery Time</h3>
                <p className="text-sm text-gray-600 mt-1">Order #{selectedOrderForDelivery.orderNumber}</p>
              </div>
              <button
                onClick={() => setShowDeliveryTimeModal(false)}
                className="text-gray-400 hover:text-gray-600 transition text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-dark mb-2">
                  Estimated Delivery Time (minutes)
                </label>
                <input
                  type="number"
                  value={estimatedDeliveryMinutes}
                  onChange={(e) => setEstimatedDeliveryMinutes(parseInt(e.target.value) || 30)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-lg font-bold text-center"
                  min="10"
                  max="120"
                  step="5"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Food will be delivered by: {new Date(Date.now() + estimatedDeliveryMinutes * 60000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[15, 20, 30, 45].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setEstimatedDeliveryMinutes(mins)}
                    className={`px-3 py-2 rounded-lg font-semibold text-sm transition ${
                      estimatedDeliveryMinutes === mins
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-text-dark hover:bg-gray-200'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-3">
                <p className="text-xs text-blue-900">
                  💡 <strong>Tip:</strong> Set realistic delivery times to ensure customer satisfaction. Consider preparation and delivery time.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeliveryTimeModal(false)}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 font-bold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmOrderWithTime}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold hover:shadow-lg transition"
              >
                ✓ Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] ${
            toast.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
            toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
            'bg-gradient-to-r from-blue-500 to-indigo-600'
          } text-white`}>
            <span className="text-2xl">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <p className="font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => setToast({ show: false, message: '', type: 'success' })}
              className="text-white/80 hover:text-white text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
