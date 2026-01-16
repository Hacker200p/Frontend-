# SafeStay Hub - Backend Guide

## πŸš€ Quick Start

### Prerequisites
- Node.js v22.18.0 or higher
- MongoDB 4.4+
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Environment Setup

Create `.env` file:

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/safestay

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRE=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Twilio (OTP)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Load Balancing
MAX_CONCURRENT_REQUESTS=100
MAX_QUEUE_SIZE=1000
REQUEST_TIMEOUT=30000
MEMORY_THRESHOLD=85
CRITICAL_MEMORY_THRESHOLD=98
CPU_THRESHOLD=90
```

### Start Server

```bash
npm start
```

Server runs on `http://localhost:5000`

## πŸ—‚οΈ Project Structure

```
backend/
β"œβ"€β"€ config/           # Configuration files
β"‚   β"œβ"€β"€ db.js         # MongoDB connection
β"‚   β"œβ"€β"€ cloudinary.js # Cloudinary config
β"‚   └── razorpay.js   # Payment gateway config
β"œβ"€β"€ controllers/     # Route controllers
β"‚   β"œβ"€β"€ authController.js
β"‚   β"œβ"€β"€ adminController.js
β"‚   β"œβ"€β"€ ownerController.js
β"‚   β"œβ"€β"€ tenantController.js
β"‚   β"œβ"€β"€ canteenController.js
β"‚   └── contractController.js
β"œβ"€β"€ middleware/      # Express middleware
β"‚   β"œβ"€β"€ authMiddleware.js      # JWT authentication
β"‚   β"œβ"€β"€ roleMiddleware.js      # Role-based access
β"‚   β"œβ"€β"€ errorMiddleware.js     # Error handling
β"‚   β"œβ"€β"€ uploadMiddleware.js    # File uploads
β"‚   β"œβ"€β"€ cacheMiddleware.js     # HTTP caching
β"‚   └── requestQueue.js        # Request queue manager
β"œβ"€β"€ models/          # Mongoose models
β"‚   β"œβ"€β"€ User.js
β"‚   β"œβ"€β"€ Hostel.js
β"‚   β"œβ"€β"€ Room.js
β"‚   β"œβ"€β"€ Contract.js
β"‚   β"œβ"€β"€ Canteen.js
β"‚   β"œβ"€β"€ Order.js
β"‚   └── ...
β"œβ"€β"€ routes/          # API routes
β"‚   β"œβ"€β"€ authRoutes.js
β"‚   β"œβ"€β"€ adminRoutes.js
β"‚   β"œβ"€β"€ ownerRoutes.js
β"‚   β"œβ"€β"€ tenantRoutes.js
β"‚   β"œβ"€β"€ canteenRoutes.js
β"‚   └── contractRoutes.js
β"œβ"€β"€ utils/           # Utility functions
β"‚   β"œβ"€β"€ logger.js             # Logging utility
β"‚   β"œβ"€β"€ responseHelper.js     # API response formatter
β"‚   β"œβ"€β"€ asyncHandler.js       # Async error wrapper
β"‚   β"œβ"€β"€ dbOptimization.js     # Database optimization
β"‚   β"œβ"€β"€ healthMonitor.js      # Health monitoring
β"‚   └── gracefulShutdown.js    # Graceful shutdown
β"œβ"€β"€ scripts/         # Utility scripts
β"‚   β"œβ"€β"€ test-load-balancing.ps1
β"‚   └── test-load-balancing.sh
β"œβ"€β"€ docs/            # Documentation
└── server.js        # Entry point
```

## πŸ"' Authentication & Authorization

### JWT Authentication
- Access tokens (7 days expiry)
- Refresh tokens (30 days expiry)
- Automatic token refresh on 401

### Roles
- `admin` - Full system access
- `owner` - Hostel management
- `tenant` - Booking and services
- `canteen` - Food service management

### Protected Routes
```javascript
import { protect, restrictTo } from './middleware/authMiddleware.js';

// Require authentication
router.get('/profile', protect, getProfile);

// Require specific role
router.post('/hostels', protect, restrictTo('owner'), createHostel);

// Multiple roles allowed
router.get('/reports', protect, restrictTo('admin', 'owner'), getReports);
```

## πŸ"Š Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  phone: String (unique),
  password: String (hashed),
  role: ['admin', 'owner', 'tenant', 'canteen'],
  profilePicture: String,
  isVerified: Boolean,
  otp: String,
  otpExpiry: Date
}
```

### Hostel Model
```javascript
{
  name: String,
  owner: ObjectId (ref: User),
  address: {
    street, city, state, postalCode, country,
    coordinates: [longitude, latitude]
  },
  amenities: [String],
  images: [String],
  rooms: [ObjectId] (ref: Room),
  rating: Number,
  totalReviews: Number
}
```

### Contract Model
```javascript
{
  tenant: ObjectId (ref: User),
  hostel: ObjectId (ref: Hostel),
  room: ObjectId (ref: Room),
  startDate: Date,
  endDate: Date,
  rent: Number,
  securityDeposit: Number,
  status: ['pending', 'active', 'completed', 'cancelled'],
  paymentStatus: ['pending', 'paid', 'overdue']
}
```

## 🌐 API Routes

### Authentication (`/api/auth`)
- `POST /register` - Register user with OTP
- `POST /verify-otp` - Verify OTP code
- `POST /login` - Login user
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout user
- `POST /forgot-password` - Send reset email
- `POST /reset-password` - Reset password

### Admin (`/api/admin`)
- `GET /users` - List all users
- `GET /users/:id` - Get user details
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /hostels` - List all hostels
- `GET /reports` - System reports
- `GET /deletion-requests` - Pending deletion requests

### Owner (`/api/owner`)
- `POST /hostels` - Create hostel
- `GET /hostels` - Get owner's hostels
- `GET /hostels/:id` - Get hostel details
- `PUT /hostels/:id` - Update hostel
- `DELETE /hostels/:id` - Delete hostel
- `POST /rooms` - Add room
- `GET /contracts` - View contracts
- `GET /expenses` - Expense management
- `POST /expenses` - Add expense

### Tenant (`/api/tenant`)
- `GET /search` - Search hostels
- `GET /hostels/:id` - View hostel details
- `POST /bookings` - Create booking
- `GET /bookings` - My bookings
- `GET /contracts` - My contracts
- `POST /feedback` - Submit feedback
- `GET /canteen/menu` - View menu
- `POST /canteen/orders` - Place order

### Canteen (`/api/canteen`)
- `GET /menu` - Get menu items
- `POST /menu` - Add menu item
- `PUT /menu/:id` - Update menu item
- `DELETE /menu/:id` - Delete menu item
- `GET /orders` - View orders
- `PUT /orders/:id` - Update order status
- `GET /subscriptions` - View subscriptions

## πŸ›'οΈ High Availability & Crash Prevention

### Health Monitor
**File:** `utils/healthMonitor.js`

Monitors system resources and prevents crashes:
- CPU and memory tracking every 10 seconds
- Automatic garbage collection at 85% memory
- Graceful shutdown at 98% memory

**Endpoints:**
- `GET /api/health` - Health status
- `GET /api/metrics` - Detailed metrics

**Usage:**
```javascript
import HealthMonitor from './utils/healthMonitor.js';

const healthMonitor = new HealthMonitor({
  maxMemoryPercent: 85,
  maxCpuPercent: 90,
  checkInterval: 10000
});

healthMonitor.start();
const status = healthMonitor.getStatus();
```

### Request Queue Manager
**File:** `middleware/requestQueue.js`

Prevents overload by managing concurrent requests:
- Max 100 concurrent requests
- Queue up to 1000 requests
- Returns 503 when overloaded
- 30-second request timeout

**Configuration:**
```javascript
const requestQueue = new RequestQueueManager({
  maxConcurrent: 100,
  maxQueueSize: 1000,
  requestTimeout: 30000
});

app.use(requestQueue.middleware());
```

### Graceful Shutdown
**File:** `utils/gracefulShutdown.js`

Ensures clean shutdown without data loss:
- Handles SIGTERM, SIGINT signals
- 30-second cleanup timeout
- Closes database connections
- Prevents new connections during shutdown

**Usage:**
```javascript
const gracefulShutdown = new GracefulShutdown(server, {
  timeout: 30000,
  onShutdown: async () => {
    await mongoose.connection.close();
    healthMonitor.stop();
  }
});

gracefulShutdown.init();
```

## πŸ"§ Utility Functions

### Logger (`utils/logger.js`)
Colored console logging:
```javascript
import { logger } from './utils/logger.js';

logger.info('Server started');
logger.success('Database connected');
logger.error('Connection failed');
logger.warn('High memory usage');
```

### Response Helper (`utils/responseHelper.js`)
Standardized API responses:
```javascript
import { success, error } from './utils/responseHelper.js';

// Success response
return success(res, data, 'Operation successful', 200);

// Error response
return error(res, 'Not found', 404);
```

### Async Handler (`utils/asyncHandler.js`)
Wraps async routes to catch errors:
```javascript
import asyncHandler from './utils/asyncHandler.js';

export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find();
  return success(res, users);
});
```

### DB Optimization (`utils/dbOptimization.js`)
Database performance tools:
```javascript
import { createIndexes, optimizeQuery } from './utils/dbOptimization.js';

// Create indexes for all models
await createIndexes();

// Optimize query
const users = await optimizeQuery(User.find({ role: 'tenant' }));
```

## πŸ"ˆ HTTP Caching

**File:** `middleware/cacheMiddleware.js`

Cache strategies:
```javascript
import { cache } from './middleware/cacheMiddleware.js';

// Static assets (1 year)
app.use('/uploads', cache.static(), express.static('uploads'));

// Semi-static data (5 minutes)
router.get('/hostels', cache.semiStatic(), getHostels);

// Dynamic data (30 seconds)
router.get('/search', cache.dynamic(), searchHostels);

// No cache
router.get('/profile', cache.noCache(), getProfile);
```

## πŸ§ͺ Testing

### Health Check
```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

### Load Testing
```powershell
cd scripts
.\test-load-balancing.ps1
```

### Manual Load Test
```powershell
# 50 concurrent requests
1..50 | ForEach-Object -Parallel {
    Invoke-WebRequest "http://localhost:5000/api/health" -UseBasicParsing
} -ThrottleLimit 50
```

### API Testing Scripts
```bash
# Test API endpoints
node scripts/test-api.js

# Test OTP registration
node scripts/test-otp-register.js

# Test payments
node scripts/test-payment.js

# Test search
node scripts/test-search.js
```

## πŸ"Š Monitoring

### Real-time Health Monitoring
```powershell
while ($true) { 
  clear
  Invoke-RestMethod http://localhost:5000/api/health | ConvertTo-Json -Depth 5
  Start-Sleep 2
}
```

### Queue Statistics
```powershell
(Invoke-RestMethod http://localhost:5000/api/metrics).requests
```

### Expected Response
```json
{
  "status": "healthy",
  "uptime": 3600,
  "memory": 65.2,
  "cpu": 45.3,
  "requestQueue": {
    "active": 12,
    "queued": 3,
    "rejected": 0
  }
}
```

## πŸš€ Deployment

### Production Environment
```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name safestay-api

# Or using Docker
docker build -t safestay-backend .
docker run -p 5000:5000 --env-file .env safestay-backend
```

### Scaling
```bash
# Multiple instances with PM2
pm2 start server.js -i 4

# Docker Compose
docker-compose up --scale backend=4
```

## 🚨 Troubleshooting

### Server Won't Start
- Check MongoDB is running
- Verify .env configuration
- Check port 5000 is available

### Getting 503 Errors
- Server is overloaded
- Check queue size: `(Invoke-RestMethod http://localhost:5000/api/metrics).requests`
- Scale horizontally or increase MAX_CONCURRENT_REQUESTS

### Memory Issues
- Health monitor will trigger GC automatically
- If memory > 98%, server shuts down gracefully
- PM2/Docker will auto-restart

### Database Connection Failed
- Verify MongoDB is running: `mongod --version`
- Check MONGODB_URI in .env
- Ensure database exists

## πŸ"š Additional Resources

- API Testing Guide: `docs/API_TESTING_GUIDE.md`
- Payment Flow: `docs/PAYMENT_FLOW_GUIDE.md`
- Environment Setup: `docs/ENV_SETUP.md`
- Testing Quickstart: `docs/TESTING_QUICKSTART.md`

## πŸ" ES6 Features

This backend uses modern ES6 modules:
- `import/export` instead of `require/module.exports`
- `type: "module"` in package.json
- All files use `.js` extension with ES6 syntax

## βœ… Summary

**What's Included:**
- βœ… Complete REST API with authentication
- βœ… Role-based access control
- βœ… MongoDB integration with optimization
- βœ… File upload (Cloudinary)
- βœ… Payment integration (Razorpay)
- βœ… OTP authentication (Twilio)
- βœ… Email notifications
- βœ… Real-time Socket.IO
- βœ… HTTP caching
- βœ… Health monitoring
- βœ… Request queue management
- βœ… Graceful shutdown
- βœ… Crash prevention
- βœ… Load balancing ready

Your backend is production-ready and crash-proof! πŸŽ‰
