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
    cuisineTypes: [],
    deliveryCharge: '10'
  })
  const [subscriptions, setSubscriptions] = useState([])
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [feedbacks, setFeedbacks] = useState([])
  const [feedbacksLoading, setFeedbacksLoading] = useState(false)
  const [subscriptionPlans, setSubscriptionPlans] = useState({
    breakfast: { enabled: false, price: 0 },
    lunch: { enabled: false, price: 0 },
    dinner: { enabled: false, price: 0 },
    breakfast_lunch: { enabled: false, price: 0 },
    lunch_dinner: { enabled: false, price: 0 },
    all_meals: { enabled: false, price: 0 },
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

  useEffect(() => {
    fetchCanteens()
    fetchHostels()
  }, [])

  useEffect(() => {
    if (selectedCanteen) {
      fetchMenuItems()
      fetchSubscriptions()
      // Load subscription plans from canteen
      if (selectedCanteen.subscriptionPlans) {
        setSubscriptionPlans(selectedCanteen.subscriptionPlans)
      }
    }
  }, [selectedCanteen])

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders()
    } else if (activeTab === 'feedback') {
      fetchFeedbacks()
    }
  }, [activeTab])

  const fetchHostels = async () => {
    try {
      const response = await canteenAPI.getAvailableHostels()
      setHostels(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching hostels:', error)
      setHostels([])
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

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true)
      const response = await canteenAPI.getProviderOrders()
      console.log('📦 Provider orders fetched:', response.data?.data)
      // Filter out cancelled orders
      const filteredOrders = (response.data?.data || []).filter(order => order.orderStatus !== 'cancelled')
      setOrders(filteredOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  const fetchFeedbacks = async () => {
    try {
      setFeedbacksLoading(true)
      // Fetch feedbacks from backend
      const response = await canteenAPI.getProviderFeedbacks()
      setFeedbacks(response.data?.data || [])
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
      setFeedbacks([])
    } finally {
      setFeedbacksLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setOrdersLoading(true)
      await canteenAPI.updateOrderStatus(orderId, { status: newStatus })
      // Refresh orders
      await fetchOrders()
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3'
      successDiv.innerHTML = `✓ Order ${newStatus}!`
      document.body.appendChild(successDiv)
      setTimeout(() => successDiv.remove(), 3000)
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update order status')
    } finally {
      setOrdersLoading(false)
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
      alert(error.response?.data?.message || 'Failed to update subscription plans')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMenuItem = async (e) => {
    e.preventDefault()
    if (!selectedCanteen) {
      alert('Please select a canteen first')
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
      alert(error.response?.data?.message || 'Failed to add menu item')
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
      alert(error.response?.data?.message || 'Failed to update menu item')
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
      alert(error.response?.data?.message || 'Failed to delete menu item')
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
      alert(error.response?.data?.message || 'Failed to delete canteen')
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
      cuisineTypes: [],
      deliveryCharge: '10'
    })
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
      alert('Please select a hostel')
      return
    }
    try {
      setLoading(true)
      
      await canteenAPI.createCanteen({
        name: canteenFormData.name,
        description: canteenFormData.description,
        hostel: canteenFormData.hostel,
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
      alert(error.response?.data?.message || 'Failed to create canteen')
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
        } bg-primary text-white transition-all duration-300 overflow-hidden fixed md:relative z-40 h-full`}
      >
        <div className="p-6">
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

        <div className="absolute bottom-6 left-6 right-6">
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
                  <h3 className="text-4xl font-bold text-primary">24</h3>
                  <p className="text-green-600 text-sm mt-2">↑ 12% from yesterday</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-text-muted text-sm font-semibold">Active Tenants</p>
                    <span className="text-3xl">👥</span>
                  </div>
                  <h3 className="text-4xl font-bold text-purple-600">158</h3>
                  <p className="text-green-600 text-sm mt-2">↑ 8 new this week</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-yellow-500 hover:shadow-xl transition">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-text-muted text-sm font-semibold">Rating</p>
                    <span className="text-3xl">⭐</span>
                  </div>
                  <h3 className="text-4xl font-bold text-yellow-600">4.7/5</h3>
                  <p className="text-text-muted text-sm mt-2">Based on 89 reviews</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500 hover:shadow-xl transition">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-text-muted text-sm font-semibold">Pending</p>
                    <span className="text-3xl">🚚</span>
                  </div>
                  <h3 className="text-4xl font-bold text-orange-600">6</h3>
                  <p className="text-orange-600 text-sm mt-2">Deliveries in progress</p>
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
                    <div className="flex items-start gap-3 pb-3 border-b">
                      <span className="text-2xl">✅</span>
                      <div>
                        <p className="font-semibold text-sm text-text-dark">Order #1234 completed</p>
                        <p className="text-xs text-text-muted">5 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 pb-3 border-b">
                      <span className="text-2xl">🆕</span>
                      <div>
                        <p className="font-semibold text-sm text-text-dark">New order received</p>
                        <p className="text-xs text-text-muted">12 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 pb-3 border-b">
                      <span className="text-2xl">⭐</span>
                      <div>
                        <p className="font-semibold text-sm text-text-dark">New 5-star review</p>
                        <p className="text-xs text-text-muted">1 hour ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🍕</span>
                      <div>
                        <p className="font-semibold text-sm text-text-dark">Menu item updated</p>
                        <p className="text-xs text-text-muted">2 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-text-dark">Orders Management</h3>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-text-muted">Loading orders...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <p>No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(orderStatusFilter === 'all' 
                    ? orders 
                    : orders.filter(o => o.orderStatus === orderStatusFilter)
                  ).map(order => (
                    <div
                      key={order._id}
                      className={`border-2 rounded-lg p-4 ${
                        order.orderStatus === 'pending' ? 'border-yellow-300 bg-yellow-50' :
                        order.orderStatus === 'confirmed' ? 'border-blue-300 bg-blue-50' :
                        order.orderStatus === 'preparing' ? 'border-orange-300 bg-orange-50' :
                        order.orderStatus === 'ready' ? 'border-green-300 bg-green-50' :
                        order.orderStatus === 'delivered' ? 'border-green-500 bg-green-100' :
                        'border-red-300 bg-red-50'
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-text-muted font-semibold">Order #</p>
                          <p className="font-bold text-text-dark">{order.orderNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-muted font-semibold">Status</p>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            order.orderStatus === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                            order.orderStatus === 'confirmed' ? 'bg-blue-200 text-blue-800' :
                            order.orderStatus === 'preparing' ? 'bg-orange-200 text-orange-800' :
                            order.orderStatus === 'ready' ? 'bg-green-200 text-green-800' :
                            order.orderStatus === 'delivered' ? 'bg-green-300 text-green-800' :
                            'bg-red-200 text-red-800'
                          }`}>
                            {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 pb-3 border-b">
                        <div>
                          <p className="text-sm text-text-muted font-semibold">👤 Tenant Name</p>
                          <p className="font-semibold text-text-dark">{order.tenant?.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-muted font-semibold">📞 Phone</p>
                          <p className="font-semibold text-text-dark">{order.tenant?.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-muted font-semibold">📧 Email</p>
                          <p className="font-semibold text-text-dark">{order.tenant?.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-muted font-semibold">🏠 Hostel</p>
                          <p className="font-semibold text-text-dark">{order.tenant?.hostel?.name || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 pb-3 border-b">
                        <div>
                          <p className="text-sm text-text-muted font-semibold">🚪 Room Number</p>
                          <p className="font-semibold text-text-dark">{order.tenant?.room?.roomNumber || order.deliveryAddress?.roomNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-muted font-semibold">📍 Floor</p>
                          <p className="font-semibold text-text-dark">{order.tenant?.room?.floor || order.deliveryAddress?.floor || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm text-text-muted font-semibold">📝 Delivery Notes</p>
                          <p className="font-semibold text-text-dark">{order.deliveryAddress?.notes || 'No special notes'}</p>
                        </div>
                      </div>

                      <div className="mb-3 pb-3 border-b">
                        <p className="text-sm text-text-muted font-semibold mb-2">🍕 Items</p>
                        <div className="space-y-1">
                          {order.items?.map((item, idx) => (
                            <p key={idx} className="text-text-dark">
                              {item.quantity}x {item.name} - ₹{(item.price * item.quantity).toFixed(2)}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-text-muted font-semibold">💰 Total</p>
                          <p className="font-bold text-lg text-primary">₹{order.totalAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-text-muted font-semibold">💳 Payment</p>
                          <p className="font-semibold text-text-dark">{order.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}</p>
                        </div>
                      </div>

                      {order.specialInstructions && (
                        <div className="mb-3 pb-3 border-b bg-white p-2 rounded">
                          <p className="text-sm text-text-muted font-semibold">📌 Special Instructions</p>
                          <p className="text-text-dark">{order.specialInstructions}</p>
                        </div>
                      )}

                      {order.orderStatus === 'pending' && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')}
                            disabled={ordersLoading}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold transition"
                          >
                            ✓ Accept Order
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')}
                            disabled={ordersLoading}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold transition"
                          >
                            ✗ Reject Order
                          </button>
                        </div>
                      )}

                      {order.orderStatus === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order._id, 'preparing')}
                          disabled={ordersLoading}
                          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold transition"
                        >
                          Start Preparing
                        </button>
                      )}

                      {order.orderStatus === 'preparing' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order._id, 'ready')}
                          disabled={ordersLoading}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold transition"
                        >
                          Mark as Ready
                        </button>
                      )}

                      {order.orderStatus === 'ready' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order._id, 'delivered')}
                          disabled={ordersLoading}
                          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold transition"
                        >
                          Mark as Delivered
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="card">
              <h3 className="text-2xl font-bold mb-4 text-text-dark">Tenant Preferences</h3>
              <p className="text-text-muted">Coming soon...</p>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="card">
              <h3 className="text-2xl font-bold mb-4 text-text-dark">Delivery Coordination</h3>
              <p className="text-text-muted">Coming soon...</p>
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
                            { key: 'breakfast', label: 'Breakfast Only', icon: '🌅' },
                            { key: 'lunch', label: 'Lunch Only', icon: '🍱' },
                            { key: 'dinner', label: 'Dinner Only', icon: '🌙' },
                            { key: 'breakfast_lunch', label: 'Breakfast + Lunch', icon: '☀️' },
                            { key: 'lunch_dinner', label: 'Lunch + Dinner', icon: '🌆' },
                            { key: 'all_meals', label: 'All Meals', icon: '🍽️' },
                          ].map(plan => (
                            <div key={plan.key} className="border-2 border-gray-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">{plan.icon}</span>
                                <h4 className="font-bold text-text-dark">{plan.label}</h4>
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
                                  <div>
                                    <label className="block text-sm font-semibold text-text-dark mb-1">
                                      Monthly Price (₹)
                                    </label>
                                    <input
                                      type="number"
                                      value={subscriptionPlans[plan.key]?.price || 0}
                                      onChange={(e) => setSubscriptionPlans({
                                        ...subscriptionPlans,
                                        [plan.key]: { ...subscriptionPlans[plan.key], price: Number(e.target.value) }
                                      })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                                      min="0"
                                      placeholder="e.g., 2000"
                                    />
                                  </div>
                                )}
                              </div>
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
            <div className="card">
              <h3 className="text-2xl font-bold mb-6 text-text-dark">⭐ Customer Feedback & Ratings</h3>
              
              {feedbacksLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-text-muted">Loading feedbacks...</span>
                </div>
              ) : feedbacks && feedbacks.length > 0 ? (
                <div className="space-y-4">
                  {feedbacks.map(feedback => (
                    <div key={feedback._id} className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-text-dark">Order #{feedback.orderDetails?.orderNumber}</p>
                          <p className="text-sm text-text-muted">By: {feedback.tenantName || 'Anonymous'}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-1 justify-end mb-1">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}>
                                ⭐
                              </span>
                            ))}
                          </div>
                          <p className="text-sm font-semibold text-yellow-600">{feedback.rating}/5</p>
                        </div>
                      </div>
                      
                      <div className="mb-3 pb-3 border-b">
                        <p className="text-sm text-text-muted">
                          <span className="font-semibold">Amount:</span> ₹{feedback.orderDetails?.totalAmount}
                        </p>
                      </div>

                      {feedback.comment && (
                        <div className="bg-white p-3 rounded mb-2">
                          <p className="text-text-dark">{feedback.comment}</p>
                        </div>
                      )}
                      
                      <p className="text-xs text-text-muted">
                        {new Date(feedback.createdAt).toLocaleDateString()} at {new Date(feedback.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-text-muted mb-2 text-lg">No feedback received yet</p>
                  <p className="text-sm text-text-muted">Feedbacks from customers will appear here once they rate their orders</p>
                </div>
              )}
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
                <label className="block text-sm font-semibold text-text-dark mb-2">Select Hostel *</label>
                <select
                  value={canteenFormData.hostel}
                  onChange={(e) => setCanteenFormData({...canteenFormData, hostel: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">-- Select a hostel --</option>
                  {hostels.map(hostel => (
                    <option key={hostel._id} value={hostel._id}>
                      {hostel.name} - {hostel.address?.city || ''}
                    </option>
                  ))}
                </select>
                {hostels.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    No hostels available. You need to create a hostel first or contact an owner to link your canteen.
                  </p>
                )}
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
    </div>
  )
}
