import axios from 'axios';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors and response parsing
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Log detailed error for debugging
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    
    return Promise.reject(error);
  }
);

// Initialize Socket.IO connection
export const socket = io(API_URL);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Tenant API
export const tenantAPI = {
  searchHostels: (params) => api.get('/tenant/hostels/search', { params }),
  getHostelDetails: (id) => api.get(`/tenant/hostels/${id}`),
  getMyExpenses: () => api.get('/tenant/expenses'),
  addExpense: (data) => api.post('/tenant/expenses', data),
  submitFeedback: (data) => api.post('/tenant/feedback', data),
  getMyContracts: () => api.get('/tenant/contracts'),
};

// Owner API
export const ownerAPI = {
  createHostel: (data) => api.post('/owner/hostels', data),
  getMyHostels: () => api.get('/owner/hostels'),
  updateHostel: (id, data) => api.put(`/owner/hostels/${id}`, data),
  uploadHostelMedia: (id, formData) => api.post(`/owner/hostels/${id}/upload`, formData),
  createRoom: (hostelId, data) => api.post(`/owner/hostels/${hostelId}/rooms`, data),
  getHostelRooms: (hostelId) => api.get(`/owner/hostels/${hostelId}/rooms`),
  updateRoom: (id, data) => api.put(`/owner/rooms/${id}`, data),
};

// Canteen API
export const canteenAPI = {
  createCanteen: (data) => api.post('/canteen', data),
  getMyCanteens: () => api.get('/canteen/my-canteens'),
  getCanteenMenu: (canteenId) => api.get(`/canteen/${canteenId}/menu`),
  addMenuItem: (canteenId, data) => api.post(`/canteen/${canteenId}/menu`, data),
  updateMenuItem: (itemId, data) => api.put(`/canteen/menu/${itemId}`, data),
  createOrder: (data) => api.post('/canteen/orders', data),
  verifyPayment: (data) => api.post('/canteen/orders/verify-payment', data),
  getMyOrders: () => api.get('/canteen/my-orders'),
  getProviderOrders: () => api.get('/canteen/orders'),
  updateOrderStatus: (orderId, status) => api.put(`/canteen/orders/${orderId}/status`, { status }),
};

// Admin API
export const adminAPI = {
  getAllUsers: () => api.get('/admin/users'),
  getDashboardStats: () => api.get('/admin/stats'),
  getAllHostels: () => api.get('/admin/hostels'),
  verifyHostel: (id, data) => api.put(`/admin/hostels/${id}/verify`, data),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
};

// Contract API
export const contractAPI = {
  createContract: (data) => api.post('/contract', data),
  signContract: (id, data) => api.post(`/contract/${id}/sign`, data),
  getContracts: () => api.get('/contract'),
  getContractDetails: (id) => api.get(`/contract/${id}`),
};

export default api;

