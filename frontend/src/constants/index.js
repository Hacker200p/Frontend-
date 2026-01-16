/**
 * Application Constants
 * Central location for all app-wide constants
 */

// User Roles
export const ROLES = {
  ADMIN: 'admin',
  OWNER: 'owner',
  TENANT: 'tenant',
  CANTEEN: 'canteen',
};

// Application Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  
  // Admin Routes
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    HOSTELS: '/admin/hostels',
    REPORTS: '/admin/reports',
  },
  
  // Owner Routes
  OWNER: {
    DASHBOARD: '/owner/dashboard',
    HOSTELS: '/owner/hostels',
    ROOMS: '/owner/rooms',
    BOOKINGS: '/owner/bookings',
    CONTRACTS: '/owner/contracts',
    PANORAMA: '/owner/panorama',
  },
  
  // Tenant Routes
  TENANT: {
    DASHBOARD: '/tenant/dashboard',
    SEARCH: '/tenant/search',
    BOOKINGS: '/tenant/bookings',
    PROFILE: '/tenant/profile',
    CANTEEN: '/tenant/canteen',
    SOS: '/tenant/sos',
  },
  
  // Canteen Routes
  CANTEEN: {
    DASHBOARD: '/canteen/dashboard',
    MENU: '/canteen/menu',
    ORDERS: '/canteen/orders',
    SUBSCRIPTIONS: '/canteen/subscriptions',
  },
};

// API Endpoints (relative to base URL)
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    VERIFY_OTP: '/api/auth/verify-otp',
    RESEND_OTP: '/api/auth/resend-otp',
    LOGOUT: '/api/auth/logout',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  
  // Admin
  ADMIN: {
    USERS: '/api/admin/users',
    HOSTELS: '/api/admin/hostels',
    STATS: '/api/admin/stats',
    DELETE_USER: (id) => `/api/admin/user/${id}`,
  },
  
  // Owner
  OWNER: {
    HOSTELS: '/api/owner/hostels',
    CREATE_HOSTEL: '/api/owner/hostel',
    UPDATE_HOSTEL: (id) => `/api/owner/hostel/${id}`,
    ROOMS: '/api/owner/rooms',
    BOOKINGS: '/api/owner/bookings',
  },
  
  // Tenant
  TENANT: {
    SEARCH: '/api/tenant/search',
    HOSTEL_DETAILS: (id) => `/api/tenant/hostel/${id}`,
    CREATE_BOOKING: '/api/tenant/booking',
    MY_BOOKINGS: '/api/tenant/my-bookings',
  },
  
  // Canteen
  CANTEEN: {
    MENU: '/api/canteen/menu',
    CREATE_ORDER: '/api/canteen/order',
    ORDERS: '/api/canteen/orders',
    SUBSCRIPTIONS: '/api/canteen/subscriptions',
  },
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

// Room Types
export const ROOM_TYPES = {
  SINGLE: 'single',
  DOUBLE: 'double',
  TRIPLE: 'triple',
  DORMITORY: 'dormitory',
};

// Hostel Amenities
export const AMENITIES = [
  'WiFi',
  'AC',
  'Hot Water',
  'Laundry',
  'Parking',
  'Security',
  'Mess',
  'Gym',
  'Study Room',
  'Recreation Room',
  'CCTV',
  'Power Backup',
];

// Meal Types for Canteen
export const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACKS: 'snacks',
};

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

// SOS Emergency Types
export const SOS_TYPES = {
  MEDICAL: 'medical',
  FIRE: 'fire',
  SECURITY: 'security',
  OTHER: 'other',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// File Upload Limits
export const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  MAX_FILES: 10,
};

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  PHONE_LENGTH: 10,
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 10,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// Toast/Notification Types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  API: 'YYYY-MM-DD',
  DATETIME: 'DD/MM/YYYY HH:mm',
};

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 28.6139, lng: 77.2090 }, // Delhi
  DEFAULT_ZOOM: 12,
  SEARCH_RADIUS: 5, // km
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Logged in successfully!',
  REGISTER: 'Registration successful! Please verify your OTP.',
  LOGOUT: 'Logged out successfully!',
  UPDATE: 'Updated successfully!',
  DELETE: 'Deleted successfully!',
  CREATE: 'Created successfully!',
};

// Theme Options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

// Gender Options
export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
};

// Hostel Categories
export const HOSTEL_CATEGORIES = {
  BOYS: 'boys',
  GIRLS: 'girls',
  CO_ED: 'co-ed',
};

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

// Days of Week
export const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// Months
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Contract Duration (in months)
export const CONTRACT_DURATIONS = [1, 3, 6, 11, 12];

// Expense Categories
export const EXPENSE_CATEGORIES = [
  'Electricity',
  'Water',
  'Maintenance',
  'Repairs',
  'Cleaning',
  'Security',
  'Other',
];

export default {
  ROLES,
  ROUTES,
  API_ENDPOINTS,
  PAYMENT_STATUS,
  BOOKING_STATUS,
  ROOM_TYPES,
  AMENITIES,
  MEAL_TYPES,
  ORDER_STATUS,
  SOS_TYPES,
  PAGINATION,
  FILE_LIMITS,
  VALIDATION,
  STORAGE_KEYS,
  TOAST_TYPES,
  DATE_FORMATS,
  MAP_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  THEMES,
  GENDER,
  HOSTEL_CATEGORIES,
  SUBSCRIPTION_PLANS,
  DAYS,
  MONTHS,
  CONTRACT_DURATIONS,
  EXPENSE_CATEGORIES,
};
