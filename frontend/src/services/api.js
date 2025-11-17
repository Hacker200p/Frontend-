import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

console.log('🌐 API_BASE_URL:', API_BASE_URL)

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

console.log('✓ Axios baseURL:', `${API_BASE_URL}/api`)

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    console.log('📡 Request to:', config.url, 'Token exists:', !!token)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle responses
api.interceptors.response.use(
  (response) => {
    console.log('✓ Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    })
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
}

// Hostel API calls
export const hostelAPI = {
  search: (params) => api.get('/hostels/search', { params }),
  getById: (id) => api.get(`/hostels/${id}`),
  create: (data) => api.post('/owner/hostels', data),
  update: (id, data) => api.put(`/owner/hostels/${id}`, data),
  getMyHostels: () => api.get('/owner/hostels'),
}

// Canteen API calls
export const canteenAPI = {
  getMenus: () => api.get('/canteen/menus'),
  createOrder: (data) => api.post('/canteen/orders', data),
  getOrders: () => api.get('/canteen/my-orders'),
  verifyPayment: (data) => api.post('/canteen/orders/verify-payment', data),
  getMyCanteens: () => api.get('/canteen/my-canteens'),
  getAvailableHostels: () => api.get('/canteen/available-hostels'),
  createCanteen: (data) => api.post('/canteen', data),
  deleteCanteen: (canteenId) => api.delete(`/canteen/${canteenId}`),
  getCanteenMenu: (canteenId) => api.get(`/canteen/${canteenId}/menu`),
  addMenuItem: (canteenId, data) => api.post(`/canteen/${canteenId}/menu`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
  }),
  updateMenuItem: (itemId, data) => api.put(`/canteen/menu/${itemId}`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
  }),
  deleteMenuItem: (itemId) => api.delete(`/canteen/menu/${itemId}`),
  // Provider order management
  getProviderOrders: (params) => api.get('/canteen/provider/orders', { params }),
  updateOrderStatus: (orderId, data) => api.put(`/canteen/provider/orders/${orderId}/status`, data),
  // Feedback APIs
  submitOrderFeedback: (data) => api.post('/canteen/feedback', data),
  getProviderFeedbacks: () => api.get('/canteen/provider/feedbacks'),
  getCanteenFeedbacks: (canteenId) => api.get(`/canteen/feedbacks/${canteenId}`),
  // Subscription APIs
  updateSubscriptionPlans: (canteenId, data) => api.put(`/canteen/${canteenId}/subscription-plans`, data),
  getCanteenSubscriptions: (canteenId) => api.get(`/canteen/${canteenId}/subscriptions`),
  createSubscriptionOrder: (data) => api.post('/canteen/subscriptions/create-order', data),
  verifySubscriptionPayment: (data) => api.post('/canteen/subscriptions/verify-payment', data),
  getMySubscriptions: () => api.get('/canteen/subscriptions/my-subscriptions'),
  cancelSubscription: (subscriptionId) => api.put(`/canteen/subscriptions/${subscriptionId}/cancel`),
}

// Contract API calls
export const contractAPI = {
  getContracts: () => api.get('/contracts'),
  getById: (id) => api.get(`/contracts/${id}`),
}

// Expense API calls
export const expenseAPI = {
  getExpenses: () => api.get('/expenses'),
  create: (data) => api.post('/expenses', data),
}

// Tenant API calls
export const tenantAPI = {
  searchHostels: (params) => api.get('/tenant/hostels/search', { params }),
  getHostelDetails: (id) => api.get(`/tenant/hostels/${id}`),
  getExpenses: () => api.get('/tenant/expenses'),
  addExpense: (data) => api.post('/tenant/expenses', data),
  submitFeedback: (data) => api.post('/tenant/feedback', data),
  getContracts: () => api.get('/tenant/contracts'),
  getMyContracts: () => api.get('/tenant/contracts'),
  createBookingOrder: (data) => api.post('/tenant/create-booking-order', data),
  bookRoom: (data) => api.post('/tenant/book-room', data),
  createExpenseOrder: (data) => api.post('/tenant/create-expense-order', data),
  verifyExpensePayment: (data) => api.post('/tenant/verify-expense-payment', data),
}

// Owner API calls
export const ownerAPI = {
  getMyHostels: () => api.get('/owner/hostels'),
  createHostel: (data) => api.post('/owner/hostels', data),
  updateHostel: (id, data) => api.put(`/owner/hostels/${id}`, data),
  deleteHostel: (id) => api.delete(`/owner/hostels/${id}`),
  uploadHostelMedia: (hostelId, files) => {
    const form = new FormData()
    for (const f of files) form.append('files', f)
    return api.post(`/owner/hostels/${hostelId}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  uploadRoomMedia: (roomId, files, mediaType = 'photos') => {
    const form = new FormData()
    if (mediaType === 'photos') {
      for (const f of files) form.append('photos', f)
    } else if (mediaType === 'video') {
      form.append('video', files[0])
    } else if (mediaType === 'view360') {
      form.append('view360', files[0])
    }
    return api.post(`/owner/rooms/${roomId}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  createRoom: (hostelId, data) => api.post(`/owner/hostels/${hostelId}/rooms`, data),
  getHostelRooms: (hostelId) => api.get(`/owner/hostels/${hostelId}/rooms`),
  updateRoom: (roomId, data) => api.put(`/owner/rooms/${roomId}`, data),
  deleteRoom: (roomId) => api.delete(`/owner/rooms/${roomId}`),
  deleteMedia: (hostelId, publicId) => api.delete(`/owner/hostels/${hostelId}/media`, { params: { publicId } }),
  // Tenant management
  getMyTenants: () => api.get('/owner/tenants'),
  getHostelTenants: (hostelId) => api.get(`/owner/hostels/${hostelId}/tenants`),
  approveTenantContract: (contractId) => api.post(`/owner/tenants/${contractId}/approve`),
  terminateTenantContract: (contractId) => api.post(`/owner/tenants/${contractId}/terminate`),
}

export default api
