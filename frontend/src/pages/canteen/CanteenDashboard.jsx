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
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [feedbacks, setFeedbacks] = useState([])
  const [feedbacksLoading, setFeedbacksLoading] = useState(false)
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

  useEffect(() => {
    fetchCanteens()
    fetchHostels()
  }, [])

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
      // Mock feedbacks for now - implement API later
      const mockFeedbacks = [
        {
          _id: '1',
          tenant: { name: 'Raj Kumar', phone: '9876543210' },
          rating: 5,
          comment: 'Excellent food quality! The biryani is amazing.',
          category: 'food_quality',
          createdAt: new Date().toISOString(),
          response: null
        },
        {
          _id: '2',
          tenant: { name: 'Priya Singh', phone: '9876543211' },
          rating: 4,
          comment: 'Good service but delivery was a bit late.',
          category: 'delivery',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          response: null
        },
        {
          _id: '3',
          tenant: { name: 'Amit Sharma', phone: '9876543212' },
          rating: 3,
          comment: 'Menu variety could be improved.',
          category: 'menu',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          response: 'Thank you for your feedback. We are working on adding more items!'
        }
      ]
      setFeedbacks(mockFeedbacks)
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
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
      alert('Please select a primary hostel')
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
              <div className="card">
                <h3 className="text-2xl font-bold mb-6 text-text-dark">🚚 Delivery Coordination</h3>
                
                {!selectedCanteen ? (
                  <div className="text-center py-12">
                    <p className="text-text-muted text-lg">Please select a canteen to view delivery coordination</p>
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
                                          📍 {data.hostel.hostelAddress}
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
                                      <p className="text-xs text-text-muted">{sub.deliveryLocation.hostelAddress}</p>
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
                                    <div className="font-bold text-text-dark">{feedback.tenant.name}</div>
                                    <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <span key={i} className={i < feedback.rating ? 'text-yellow-500' : 'text-gray-300'}>
                                          ⭐
                                        </span>
                                      ))}
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      feedback.category === 'food_quality' ? 'bg-purple-100 text-purple-700' :
                                      feedback.category === 'delivery' ? 'bg-blue-100 text-blue-700' :
                                      'bg-orange-100 text-orange-700'
                                    }`}>
                                      {feedback.category.replace('_', ' ')}
                                    </span>
                                  </div>
                                  <div className="text-sm text-text-muted">
                                    📞 {feedback.tenant.phone} • {new Date(feedback.createdAt).toLocaleDateString()}
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
                        alert('Settings saved successfully!')
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
    </div>
  )
}
