# Load Balancing & Crash Prevention Guide

## πŸš€ Overview

This guide covers the complete high-availability and crash prevention system implemented in SafeStay Hub.

## πŸ›'οΈ Backend Protection

### 1. Health Monitoring (`backend/utils/healthMonitor.js`)

**Features:**
- Real-time CPU and memory monitoring
- Automatic garbage collection when memory is high
- Graceful shutdown on critical resource exhaustion
- Health metrics endpoint

**Thresholds:**
```javascript
Memory: 85% warning, 98% critical (triggers shutdown)
CPU: 90% warning
Check Interval: 10 seconds
```

**Usage:**
```javascript
import { healthMonitor } from './utils/healthMonitor.js';

// Start monitoring
healthMonitor.start();

// Get current status
const status = healthMonitor.getStatus();
// Returns: { status: 'healthy', memory: 65.2, cpu: 45.3 }
```

**Health Endpoint:**
```bash
GET /api/health
Response: {
  status: "healthy",
  uptime: 3600,
  memory: 65.2,
  cpu: 45.3,
  requestQueue: {
    active: 12,
    queued: 3,
    rejected: 0
  }
}
```

### 2. Request Queue (`backend/middleware/requestQueue.js`)

**Features:**
- Limits concurrent requests to prevent overload
- Queues excess requests (FIFO)
- Returns 503 when overloaded
- Request timeout handling

**Configuration:**
```javascript
maxConcurrent: 100      // Max simultaneous requests
maxQueueSize: 1000      // Max queued requests
requestTimeout: 30000   // 30 second timeout
```

**Behavior:**
- Concurrent requests ≀ 100: Process immediately
- Concurrent > 100 && Queue < 1000: Queue the request
- Queue β‰₯ 1000: Return 503 Service Unavailable

**Stats Endpoint:**
```bash
GET /api/metrics
Response: {
  requests: {
    active: 45,
    queued: 120,
    rejected: 15,
    total: 15234
  }
}
```

### 3. Graceful Shutdown (`backend/utils/gracefulShutdown.js`)

**Features:**
- Clean shutdown on SIGTERM/SIGINT
- Prevents data loss
- Closes connections gracefully
- Custom cleanup hooks

**Signals Handled:**
- `SIGTERM` - Kubernetes/Docker shutdown
- `SIGINT` - Ctrl+C
- `uncaughtException` - Unhandled errors

**Shutdown Process:**
1. Stop accepting new connections
2. Wait for existing requests (max 30s)
3. Close database connections
4. Exit process

**Usage:**
```javascript
gracefulShutdown.init({
  cleanup: async () => {
    await mongoose.connection.close();
    await redis.quit();
  }
});
```

## 🎯 Frontend Protection

### 1. API Request Manager (`frontend/src/services/apiManager.js`)

**Features:**
- Automatic retry with exponential backoff
- Circuit breaker pattern
- Request queuing and priority
- Token refresh handling

**Circuit Breaker:**
```
States: CLOSED β†' OPEN β†' HALF_OPEN β†' CLOSED

CLOSED: Normal operation
OPEN: Too many failures (5+), reject requests for 30s
HALF_OPEN: Test if service recovered
```

**Usage:**
```javascript
import api from '@/services/apiManager';

// Automatic retry on failure
const response = await api.get('/hostels');

// With custom options
import { makeRequest } from '@/services/apiManager';

const response = await makeRequest({
  method: 'POST',
  url: '/api/bookings',
  data: bookingData
}, {
  retry: true,
  maxRetries: 5,
  timeout: 60000,
  priority: 'high'
});
```

**Request Priority:**
- `high`: Critical operations (payments, bookings)
- `normal`: Regular API calls

### 2. Offline Manager (`frontend/src/services/offlineManager.js`)

**Features:**
- Detects online/offline status
- Queues requests when offline
- Auto-processes queue when back online
- Connection health checks

**Usage:**
```javascript
import { offlineManager, useOfflineStatus } from '@/services/offlineManager';

// In components
const isOnline = useOfflineStatus();

// Queue request when offline
if (!offlineManager.isOnline) {
  offlineManager.queueRequest({
    execute: () => api.post('/feedback', data)
  });
}
```

## πŸ"Š Monitoring

### Health Check Endpoints

**1. Basic Health:**
```bash
curl http://localhost:5000/api/health
```

**2. Detailed Metrics:**
```bash
curl http://localhost:5000/api/metrics
```

**3. Request Queue Stats:**
```javascript
// In backend code
const stats = requestQueue.getStats();
```

**4. Frontend Stats:**
```javascript
import { apiManager } from '@/services/apiManager';

const stats = apiManager.getStats();
console.log('Active requests:', stats.active);
console.log('Circuit state:', stats.circuitState);
```

## πŸ§ͺ Load Testing

### Using Artillery

**Install:**
```bash
npm install -g artillery
```

**Basic Load Test:**
```bash
artillery quick --count 100 --num 10 http://localhost:5000/api/health
```

**Sustained Load:**
```yaml
# load-test.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Sustained load
    - duration: 60
      arrivalRate: 100
      name: Stress test

scenarios:
  - name: Search hostels
    flow:
      - get:
          url: "/api/tenant/search"
```

**Run:**
```bash
artillery run load-test.yml
```

### Using Apache Bench

```bash
# 1000 requests, 100 concurrent
ab -n 1000 -c 100 http://localhost:5000/api/health

# With authentication
ab -n 1000 -c 100 -H "Authorization: Bearer TOKEN" http://localhost:5000/api/tenant/hostels
```

### Expected Behavior

**Normal Load (< 100 concurrent):**
- All requests processed immediately
- Response time: 50-200ms
- No queued requests

**High Load (100-200 concurrent):**
- Requests start queuing
- Response time: 200-500ms
- Queue stats show queued requests

**Overload (> 1000 queued):**
- Returns 503 Service Unavailable
- Protects server from crash
- Rejected request count increases

## 🚨 Failure Scenarios

### 1. Memory Exhaustion

**What happens:**
1. Health monitor detects memory > 85%
2. Triggers garbage collection
3. If memory > 98%, initiates graceful shutdown
4. Server closes cleanly without crashes

**How to test:**
```javascript
// Create memory leak
const leak = [];
setInterval(() => {
  leak.push(new Array(1000000));
}, 100);
```

### 2. Traffic Spike

**What happens:**
1. Request queue fills up (active: 100, queued: 1000)
2. Additional requests get 503 response
3. Frontend circuit breaker opens
4. Frontend queues non-critical requests
5. When load decreases, queue processes

**How to test:**
```bash
# Send 5000 concurrent requests
artillery quick --count 5000 --num 200 http://localhost:5000/api/tenant/search
```

### 3. Database Connection Loss

**What happens:**
1. Mongoose connection lost
2. Requests fail with 500 error
3. Frontend circuit breaker opens after 5 failures
4. Frontend shows offline message
5. Auto-reconnects when DB comes back

**How to test:**
```bash
# Stop MongoDB
sudo systemctl stop mongodb

# Make requests - should get circuit breaker errors

# Restart MongoDB
sudo systemctl start mongodb

# Circuit breaker auto-recovers after 30s
```

### 4. Network Issues

**What happens:**
1. Frontend detects offline status
2. Queues non-critical requests
3. Shows offline indicator
4. When back online, processes queue
5. Critical requests still attempted with retry

## πŸ"§ Configuration

### Backend Settings

**Environment Variables:**
```env
# Health Monitor
HEALTH_CHECK_INTERVAL=10000        # 10 seconds
MEMORY_THRESHOLD=85                # 85%
CRITICAL_MEMORY_THRESHOLD=98       # 98%
CPU_THRESHOLD=90                   # 90%

# Request Queue
MAX_CONCURRENT_REQUESTS=100
MAX_QUEUE_SIZE=1000
REQUEST_TIMEOUT=30000              # 30 seconds

# Graceful Shutdown
SHUTDOWN_TIMEOUT=30000             # 30 seconds
```

**In server.js:**
```javascript
const healthMonitor = new HealthMonitor({
  memoryThreshold: process.env.MEMORY_THRESHOLD || 85,
  criticalMemoryThreshold: process.env.CRITICAL_MEMORY_THRESHOLD || 98,
  cpuThreshold: process.env.CPU_THRESHOLD || 90,
  checkInterval: process.env.HEALTH_CHECK_INTERVAL || 10000,
});
```

### Frontend Settings

**Environment Variables:**
```env
# API Manager
VITE_API_URL=http://localhost:5000
VITE_REQUEST_TIMEOUT=30000
VITE_MAX_RETRIES=3
VITE_RETRY_DELAY=1000

# Circuit Breaker
VITE_FAILURE_THRESHOLD=5
VITE_RESET_TIMEOUT=30000
```

## πŸ"ˆ Best Practices

### 1. Monitoring

- Check `/api/health` endpoint regularly
- Set up alerts for high memory/CPU
- Monitor queue size
- Track rejected requests

### 2. Scaling

**Horizontal Scaling:**
```bash
# Run multiple instances behind nginx
pm2 start server.js -i 4

# Or use Docker
docker-compose up --scale backend=4
```

**Nginx Load Balancer:**
```nginx
upstream backend {
  least_conn;  # Use least connections algorithm
  server localhost:5000;
  server localhost:5001;
  server localhost:5002;
  server localhost:5003;
}

server {
  location /api {
    proxy_pass http://backend;
  }
}
```

### 3. Database Optimization

```javascript
// Use indexes
Hostel.createIndexes();

// Use lean queries
const hostels = await Hostel.find().lean();

// Paginate results
const { docs, page, totalPages } = await Hostel.paginate(
  query,
  { page: 1, limit: 20 }
);
```

### 4. Frontend Optimization

```javascript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Use debouncing for search
const debouncedSearch = useDebounce(searchTerm, 500);

// Cancel pending requests
const cancelToken = axios.CancelToken.source();
api.get('/search', { cancelToken: cancelToken.token });
```

## πŸ†˜ Troubleshooting

### Server keeps crashing

**Check:**
1. Memory leaks - Use `node --inspect` and Chrome DevTools
2. Unhandled promise rejections - Check logs
3. Database connection leaks - Monitor active connections

**Solution:**
```javascript
// Enable graceful shutdown
gracefulShutdown.init({ cleanup: cleanupFunction });

// Monitor memory
healthMonitor.start();

// Add request queue
app.use(requestQueue.middleware());
```

### 503 errors on frontend

**Cause:** Server overloaded

**Solution:**
1. Check queue size: `curl http://localhost:5000/api/metrics`
2. Scale horizontally (add more instances)
3. Optimize slow queries
4. Increase `MAX_CONCURRENT_REQUESTS` if server can handle it

### Circuit breaker always OPEN

**Cause:** Too many failures

**Solution:**
1. Check backend health
2. Verify network connectivity
3. Check for API errors in backend logs
4. Increase `VITE_FAILURE_THRESHOLD` if needed

## πŸ" Summary

**Backend Protection:**
βœ… Health monitoring with auto-recovery
βœ… Request queue prevents overload
βœ… Graceful shutdown prevents data loss
βœ… Metrics and monitoring endpoints

**Frontend Protection:**
βœ… Automatic retry with backoff
βœ… Circuit breaker pattern
βœ… Offline support with queue
βœ… Request priority system

**Result:**
Your application can now handle high load, recover from failures, and won't crash even in worst-case scenarios. The system automatically adapts to changing conditions and provides visibility through monitoring endpoints.
