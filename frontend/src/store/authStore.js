import { create } from 'zustand'
import { authAPI } from '../services/api'

// Safely read and parse values from localStorage
function getStoredUser() {
  const raw = localStorage.getItem('user')
  if (!raw || raw === 'undefined' || raw === 'null') return null
  try {
    return JSON.parse(raw)
  } catch {
    // If something invalid was stored earlier, clean it up
    localStorage.removeItem('user')
    return null
  }
}

function getStoredToken() {
  const raw = localStorage.getItem('token')
  if (!raw || raw === 'undefined' || raw === 'null') return null
  return raw
}

function normalizeUserRole(role) {
  if (!role) return undefined
  switch (role) {
    case 'master_admin':
      return 'admin'
    case 'canteen_provider':
      return 'provider'
    default:
      return role
  }
}

function mapBackendUserToFrontend(user) {
  if (!user) return null
  const userRole = normalizeUserRole(user.userRole || user.role)
  return { ...user, userRole }
}

export const useAuthStore = create((set) => ({
  user: mapBackendUserToFrontend(getStoredUser()),
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
  loading: false,
  error: null,

  setUser: (user) => {
    const mapped = mapBackendUserToFrontend(user)
    set({ user: mapped })
    if (user) {
      localStorage.setItem('user', JSON.stringify(mapped))
    } else {
      localStorage.removeItem('user')
    }
  },

  setToken: (token) => {
    set({ token, isAuthenticated: !!token })
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  },

  login: async (credentials) => {
    set({ loading: true, error: null })
    try {
      const response = await authAPI.login(credentials)
      const { token, user, role } = response.data.data
      const mappedUser = mapBackendUserToFrontend(user || { role })
      set({ token, user: mappedUser, isAuthenticated: true, loading: false })
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(mappedUser))
      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed'
      set({ error: errorMsg, loading: false })
      throw error
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null })
    try {
      const response = await authAPI.register(userData)
      // Do not auto-authenticate on register; move to OTP step in UI
      set({ loading: false })
      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed'
      set({ error: errorMsg, loading: false })
      throw error
    }
  },

  verifyOTP: async (otpData) => {
    console.log('[AUTH STORE] Starting OTP verification with:', otpData)
    set({ loading: true, error: null })
    try {
      console.log('[AUTH STORE] Making API call to verify OTP')
      const response = await authAPI.verifyOTP(otpData)
      console.log('[AUTH STORE] API response:', response.data)
      const { token, user } = response.data.data
      console.log('[AUTH STORE] Extracted token and user:', { token, user })
      const mappedUser = mapBackendUserToFrontend(user)
      set({ token, user: mappedUser, isAuthenticated: true, loading: false })
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(mappedUser))
      return response.data
    } catch (error) {
      console.error('[AUTH STORE] OTP verification error:', error)
      const errorMsg = error.response?.data?.message || 'OTP verification failed'
      set({ error: errorMsg, loading: false })
      throw error
    }
  },

  resendOTP: async (otpData) => {
    set({ loading: true, error: null })
    try {
      const response = await authAPI.resendOTP(otpData)
      set({ loading: false })
      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to resend OTP'
      set({ error: errorMsg, loading: false })
      throw error
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false })
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  clearError: () => set({ error: null }),
}))
