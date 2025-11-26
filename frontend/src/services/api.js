import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Flag to prevent infinite refresh loops
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  isRefreshing = false
  failedQueue = []
}

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle responses with token refresh logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')

      if (!refreshToken) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh-token`,
          { refreshToken }
        )

        const { token } = response.data.data
        localStorage.setItem('token', token)

        api.defaults.headers.common.Authorization = `Bearer ${token}`
        originalRequest.headers.Authorization = `Bearer ${token}`

        processQueue(null, token)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  login: async (data) => {
    const response = await api.post('/auth/login', data)
    // Save refresh token if provided
    if (response.data?.data?.refreshToken) {
      localStorage.setItem('refreshToken', response.data.data.refreshToken)
    }
    return response
  },
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  uploadProfilePhoto: (file) => {
    const formData = new FormData()
    formData.append('profilePhoto', file)
    return api.post('/auth/upload-profile-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
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
  getOrders: () => api.get('/canteen/orders'),
  verifyPayment: (data) => api.post('/canteen/orders/verify-payment', data),
  getMyCanteens: () => api.get('/canteen/my-canteens'),
  getAvailableCanteens: () => api.get('/canteen/available'), // For tenants
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
  // Subscription APIs
  updateSubscriptionPlans: (canteenId, data) => api.put(`/canteen/${canteenId}/subscription-plans`, data),
  getCanteenSubscriptions: (canteenId) => api.get(`/canteen/${canteenId}/subscriptions`),
  createSubscriptionOrder: (data) => api.post('/canteen/subscriptions/create-order', data),
  verifySubscriptionPayment: (data) => api.post('/canteen/subscriptions/verify-payment', data),
  getMySubscriptions: () => api.get('/canteen/subscriptions/my-subscriptions'),
  cancelSubscription: (subscriptionId) => api.put(`/canteen/subscriptions/${subscriptionId}/cancel`),
  // Custom order APIs
  getMyOrders: () => api.get('/canteen/my-orders'),
  verifyOrderPayment: (data) => api.post('/canteen/orders/verify-payment', data),
  updateOrderStatus: (orderId, status, estimatedDeliveryMinutes = null) => {
    const payload = { status }
    if (estimatedDeliveryMinutes) {
      payload.estimatedDeliveryMinutes = estimatedDeliveryMinutes
    }
    return api.put(`/canteen/orders/${orderId}/status`, payload)
  },
  getCanteenFeedbacks: (canteenId) => api.get(`/canteen/${canteenId}/feedbacks`),
  rateTenant: (orderId, data) => api.post(`/canteen/orders/${orderId}/rate-tenant`, data),
}

// Contract API calls
export const contractAPI = {
  getContracts: () => api.get('/contracts'),
  getById: (id) => api.get(`/contracts/${id}`),
  signContract: (id) => api.put(`/contracts/${id}/sign`),
  downloadContract: (id) => api.get(`/contracts/${id}/download`, { responseType: 'blob' }),
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
  getNearbyHostels: (lat, lng, radius = 5000) => api.get('/tenant/hostels/nearby', { params: { lat, lng, radius } }),
  getExpenses: () => api.get('/tenant/expenses'),
  addExpense: (data) => api.post('/tenant/expenses', data),
  deleteExpense: (id) => api.delete(`/tenant/expenses/${id}`),
  submitFeedback: (data) => api.post('/tenant/feedback', data),
  getMyFeedbacks: () => api.get('/tenant/feedbacks'),
  submitOrderFeedback: (orderId, data) => api.post(`/tenant/orders/${orderId}/feedback`, data),
  getContracts: () => api.get('/tenant/contracts'),
  getMyContracts: () => api.get('/tenant/contracts'),
  createBookingOrder: (data) => api.post('/tenant/create-booking-order', data),
  bookRoom: (data) => api.post('/tenant/book-room', data),
  requestDeletion: (data) => api.post('/tenant/deletion-request', data),
  getDeletionRequest: () => api.get('/tenant/deletion-request'),
  cancelDeletionRequest: (id) => api.delete(`/tenant/deletion-request/${id}`),
  sendSOS: (data) => api.post('/tenant/sos', data),
  getSOSHistory: () => api.get('/tenant/sos/history'),
}

// Owner API calls
export const ownerAPI = {
  getMyHostels: () => api.get('/owner/hostels'),
  createHostel: (data) => api.post('/owner/hostels', data),
  updateHostel: (id, data) => api.put(`/owner/hostels/${id}`, data),
  deleteHostel: (id) => api.delete(`/owner/hostels/${id}`),
  getHostelFeedbacks: () => api.get('/owner/feedbacks'),
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
    } else if (mediaType === 'panorama') {
      form.append('panorama', files[0])
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
  // Deletion requests
  getDeletionRequests: (status) => api.get('/owner/deletion-requests', { params: { status } }),
  approveDeletionRequest: (id, message) => api.put(`/owner/deletion-requests/${id}/approve`, { message }),
  rejectDeletionRequest: (id, message) => api.put(`/owner/deletion-requests/${id}/reject`, { message }),
}

export default api
