import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

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

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
  getOrders: () => api.get('/canteen/orders'),
  verifyPayment: (data) => api.post('/canteen/orders/verify-payment', data),
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
}

export default api
