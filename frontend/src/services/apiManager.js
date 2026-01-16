// API Request Manager with retry, timeout, and circuit breaker
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class APIRequestManager {
  constructor() {
    this.pendingRequests = new Map();
    this.requestQueue = [];
    this.maxConcurrent = 6; // Browser limit
    this.activeRequests = 0;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.requestTimeout = 30000;
    
    // Circuit breaker state
    this.circuitState = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.failureThreshold = 5;
    this.resetTimeout = 30000;
    this.lastFailureTime = null;
  }

  async request(config, options = {}) {
    const {
      retry = true,
      maxRetries = this.retryAttempts,
      timeout = this.requestTimeout,
      priority = 'normal',
      cancelToken,
    } = options;

    // Check circuit breaker
    if (this.circuitState === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.circuitState = 'HALF_OPEN';
        this.failureCount = 0;
      } else {
        return Promise.reject(new Error('Circuit breaker is OPEN - service unavailable'));
      }
    }

    // Create request config
    const requestConfig = {
      ...config,
      timeout,
      cancelToken,
      baseURL: API_BASE_URL,
    };

    // Execute request with retry logic
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Wait for slot if too many concurrent requests
        await this.waitForSlot(priority);
        
        this.activeRequests++;
        const response = await axios(requestConfig);
        
        // Success - reset circuit breaker
        if (this.circuitState === 'HALF_OPEN') {
          this.circuitState = 'CLOSED';
          this.failureCount = 0;
        }
        
        this.activeRequests--;
        this.processQueue();
        
        return response;
      } catch (error) {
        this.activeRequests--;
        this.processQueue();
        
        lastError = error;

        // Don't retry on client errors (4xx) or if cancelled
        if (
          error.response?.status >= 400 && error.response?.status < 500 ||
          axios.isCancel(error) ||
          !retry ||
          attempt === maxRetries
        ) {
          this.handleFailure(error);
          throw error;
        }

        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    this.handleFailure(lastError);
    throw lastError;
  }

  handleFailure(error) {
    this.failureCount++;
    
    if (this.failureCount >= this.failureThreshold) {
      this.circuitState = 'OPEN';
      this.lastFailureTime = Date.now();
      console.error('🔴 Circuit breaker OPEN - too many failures');
    }
  }

  waitForSlot(priority) {
    return new Promise((resolve) => {
      if (this.activeRequests < this.maxConcurrent) {
        resolve();
      } else {
        // Add to queue
        const item = { resolve, priority, timestamp: Date.now() };
        
        if (priority === 'high') {
          this.requestQueue.unshift(item);
        } else {
          this.requestQueue.push(item);
        }
      }
    });
  }

  processQueue() {
    if (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const item = this.requestQueue.shift();
      item.resolve();
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  cancelPendingRequests(key) {
    if (this.pendingRequests.has(key)) {
      const controller = this.pendingRequests.get(key);
      controller.abort();
      this.pendingRequests.delete(key);
    }
  }

  getStats() {
    return {
      active: this.activeRequests,
      queued: this.requestQueue.length,
      circuitState: this.circuitState,
      failures: this.failureCount,
    };
  }
}

// Create singleton instance
const apiManager = new APIRequestManager();

// Enhanced axios instance with automatic retry
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle server overload
    if (error.response?.status === 503) {
      const retryAfter = error.response.headers['retry-after'] || 30;
      console.warn(`Server overloaded. Retry after ${retryAfter}s`);
    }

    return Promise.reject(error);
  }
);

// Helper function to make requests with automatic retry
export const makeRequest = (config, options) => {
  return apiManager.request(config, options);
};

// Export API manager for stats
export { apiManager };

export default api;
