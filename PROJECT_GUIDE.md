# SafeStay Hub - Complete Project Guide

## πŸ"‹ Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Features](#features)
- [High Availability](#high-availability)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🌟 Overview

SafeStay Hub is a comprehensive hostel management system built with:
- **Backend:** Node.js (v22.18.0), Express, MongoDB, Socket.IO
- **Frontend:** React 18, Vite, Tailwind CSS
- **Module System:** ES6 (import/export)
- **Features:** Authentication, Payments, Real-time updates, Maps, 360Β° views

### Key Features
- πŸ" User authentication with OTP verification
- 🏨 Hostel management (CRUD operations)
- πŸ'° Payment integration (Razorpay)
- πŸ" Google Maps integration
- πŸ"· 360Β° panorama viewer
- 🍽️ Canteen management
- πŸ"Š Admin dashboard
- πŸ'¬ Real-time chat (Socket.IO)
- πŸ›'οΈ Crash prevention & load balancing

## πŸš€ Quick Start

### Prerequisites
- Node.js v18.0.0+ (Backend: v22.18.0)
- MongoDB 4.4+
- npm or yarn
- Git

### Clone Repository
```bash
git clone <repository-url>
cd SafeStay-Hub
```

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

Backend runs on `http://localhost:5000`

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL
npm run dev
```

Frontend runs on `http://localhost:3000`

## πŸ—‚οΈ Project Structure

```
SafeStay-Hub/
β"œβ"€β"€ backend/                    # Node.js backend
β"‚   β"œβ"€β"€ config/                # Configuration files
β"‚   β"‚   β"œβ"€β"€ db.js             # MongoDB connection
β"‚   β"‚   β"œβ"€β"€ cloudinary.js     # Image hosting
β"‚   β"‚   └── razorpay.js       # Payment gateway
β"‚   β"œβ"€β"€ controllers/          # Business logic
β"‚   β"‚   β"œβ"€β"€ authController.js
β"‚   β"‚   β"œβ"€β"€ adminController.js
β"‚   β"‚   β"œβ"€β"€ ownerController.js
β"‚   β"‚   β"œβ"€β"€ tenantController.js
β"‚   β"‚   β"œβ"€β"€ canteenController.js
β"‚   β"‚   └── contractController.js
β"‚   β"œβ"€β"€ middleware/           # Express middleware
β"‚   β"‚   β"œβ"€β"€ authMiddleware.js      # JWT auth
β"‚   β"‚   β"œβ"€β"€ roleMiddleware.js      # RBAC
β"‚   β"‚   β"œβ"€β"€ errorMiddleware.js     # Error handling
β"‚   β"‚   β"œβ"€β"€ cacheMiddleware.js     # HTTP caching
β"‚   β"‚   └── requestQueue.js        # Load balancing
β"‚   β"œβ"€β"€ models/               # Mongoose models
β"‚   β"‚   β"œβ"€β"€ User.js
β"‚   β"‚   β"œβ"€β"€ Hostel.js
β"‚   β"‚   β"œβ"€β"€ Room.js
β"‚   β"‚   β"œβ"€β"€ Contract.js
β"‚   β"‚   └── ...
β"‚   β"œβ"€β"€ routes/               # API routes
β"‚   β"œβ"€β"€ utils/                # Utilities
β"‚   β"‚   β"œβ"€β"€ logger.js             # Logging
β"‚   β"‚   β"œβ"€β"€ responseHelper.js     # API responses
β"‚   β"‚   β"œβ"€β"€ healthMonitor.js      # Health monitoring
β"‚   β"‚   └── gracefulShutdown.js    # Clean shutdown
β"‚   β"œβ"€β"€ scripts/              # Utility scripts
β"‚   β"œβ"€β"€ docs/                 # Backend docs
β"‚   β"œβ"€β"€ server.js             # Entry point
β"‚   └── package.json
β"œβ"€β"€ frontend/                   # React frontend
β"‚   β"œβ"€β"€ public/               # Static assets
β"‚   β"œβ"€β"€ src/
β"‚   β"‚   β"œβ"€β"€ assets/           # Images, styles
β"‚   β"‚   β"œβ"€β"€ components/       # React components
β"‚   β"‚   β"‚   β"œβ"€β"€ common/       # Reusable components
β"‚   β"‚   β"‚   β"œβ"€β"€ panorama/     # 360Β° viewer
β"‚   β"‚   β"‚   └── map/         # Map components
β"‚   β"‚   β"œβ"€β"€ constants/        # Constants
β"‚   β"‚   β"œβ"€β"€ context/          # React Context
β"‚   β"‚   β"œβ"€β"€ hooks/            # Custom hooks
β"‚   β"‚   β"œβ"€β"€ pages/            # Page components
β"‚   β"‚   β"œβ"€β"€ services/         # API services
β"‚   β"‚   β"‚   β"œβ"€β"€ apiManager.js     # Request manager
β"‚   β"‚   β"‚   └── offlineManager.js # Offline support
β"‚   β"‚   β"œβ"€β"€ utils/            # Utilities
β"‚   β"‚   β"œβ"€β"€ App.jsx           # Root component
β"‚   β"‚   └── main.jsx         # Entry point
β"‚   β"œβ"€β"€ index.html
β"‚   β"œβ"€β"€ vite.config.js
β"‚   └── package.json
└── docs/                      # Project documentation
    β"œβ"€β"€ setup/                # Setup guides
    β"œβ"€β"€ guides/               # User guides
    β"œβ"€β"€ testing/              # Testing guides
    β"œβ"€β"€ features/             # Feature docs
    └── fixes/                # Bug fixes
```

## πŸ"§ Backend Setup

### 1. Environment Variables

Create `backend/.env`:

```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/safestay

# JWT
JWT_SECRET=your_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_here_minimum_32_characters
JWT_REFRESH_EXPIRE=30d

# Cloudinary (Image Hosting)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay (Payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Twilio (OTP)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

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

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Start MongoDB
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongodb
```

### 4. Start Server
```bash
npm start
```

### 5. Verify Backend
```bash
# Health check
curl http://localhost:5000/api/health

# Or PowerShell
Invoke-RestMethod http://localhost:5000/api/health
```

## πŸ'» Frontend Setup

### 1. Environment Variables

Create `frontend/.env`:

```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Razorpay
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id

# Performance
VITE_REQUEST_TIMEOUT=30000
VITE_MAX_RETRIES=3
VITE_RETRY_DELAY=1000

# Circuit Breaker
VITE_FAILURE_THRESHOLD=5
VITE_RESET_TIMEOUT=30000
```

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm run preview
```

## ✨ Features

### Authentication System
- **OTP-based registration** via Twilio
- **JWT authentication** with access & refresh tokens
- **Role-based access control** (Admin, Owner, Tenant, Canteen)
- **Password reset** via email

### Hostel Management
- **CRUD operations** for hostels and rooms
- **Image upload** via Cloudinary
- **360Β° panorama viewer** for virtual tours
- **Google Maps integration** for location
- **Amenities management**
- **Availability tracking**

### Booking System
- **Room booking** with date selection
- **Contract management**
- **Payment integration** with Razorpay
- **Booking history**
- **Status tracking**

### Canteen System
- **Menu management**
- **Order placement** and tracking
- **Subscription plans**
- **Payment integration**

### Admin Dashboard
- **User management**
- **Hostel oversight**
- **System reports**
- **Analytics**

### Real-time Features
- **Socket.IO** for live updates
- **Chat system**
- **Notifications**
- **Status updates**

## πŸ›'οΈ High Availability

### Backend Protection

#### 1. Health Monitor
**File:** `backend/utils/healthMonitor.js`

- Monitors CPU & memory every 10 seconds
- Auto garbage collection at 85% memory
- Graceful shutdown at 98% memory

**Endpoints:**
```bash
GET /api/health      # Health status
GET /api/metrics     # Detailed metrics
```

#### 2. Request Queue Manager
**File:** `backend/middleware/requestQueue.js`

- Max 100 concurrent requests
- Queue up to 1000 requests
- Returns 503 when overloaded
- Prevents server crash

#### 3. Graceful Shutdown
**File:** `backend/utils/gracefulShutdown.js`

- Handles SIGTERM/SIGINT signals
- 30-second cleanup timeout
- Closes database connections
- Prevents data loss

### Frontend Protection

#### 1. API Manager
**File:** `frontend/src/services/apiManager.js`

- Automatic retry with exponential backoff
- Circuit breaker pattern
- Request priority system
- Token refresh handling

**Usage:**
```javascript
import api from '@/services/apiManager';

// Automatic retry
const response = await api.get('/hostels');

// High priority request
import { makeRequest } from '@/services/apiManager';
const response = await makeRequest({
  method: 'POST',
  url: '/api/payments',
  data: paymentData
}, { priority: 'high', maxRetries: 5 });
```

#### 2. Offline Manager
**File:** `frontend/src/services/offlineManager.js`

- Detects online/offline status
- Queues requests when offline
- Auto-processes queue when back online

**Usage:**
```javascript
import { useOfflineStatus } from '@/services/offlineManager';

function MyComponent() {
  const isOnline = useOfflineStatus();
  return <div>{isOnline ? 'Online' : 'Offline'}</div>;
}
```

### Performance Optimizations

1. **Lazy Loading:** All routes lazy-loaded
2. **Code Splitting:** Separate chunks for each route
3. **HTTP Caching:** Static, semi-static, dynamic strategies
4. **Database Indexing:** Optimized queries
5. **Image Optimization:** Cloudinary transformations
6. **Error Boundary:** Catches React errors

## πŸ"š API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register with OTP
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "password123",
  "role": "tenant"
}

Response: {
  "success": true,
  "message": "OTP sent to phone",
  "userId": "user_id"
}
```

#### Verify OTP
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "userId": "user_id",
  "otp": "123456"
}

Response: {
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: {
  "success": true,
  "data": {
    "user": {...},
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Hostel Endpoints (Owner)

#### Create Hostel
```http
POST /owner/hostels
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Cozy Hostel",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "coordinates": [-73.935242, 40.730610]
  },
  "amenities": ["wifi", "parking", "laundry"],
  "images": ["url1", "url2"]
}
```

#### Get Owner's Hostels
```http
GET /owner/hostels
Authorization: Bearer {token}
```

### Tenant Endpoints

#### Search Hostels
```http
GET /tenant/search?city=New York&minPrice=1000&maxPrice=5000
Authorization: Bearer {token}
```

#### Create Booking
```http
POST /tenant/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "hostel": "hostel_id",
  "room": "room_id",
  "startDate": "2026-02-01",
  "endDate": "2026-08-01"
}
```

### Admin Endpoints

#### List Users
```http
GET /admin/users?page=1&limit=20
Authorization: Bearer {token}
```

#### System Reports
```http
GET /admin/reports
Authorization: Bearer {token}
```

## πŸ§ͺ Testing

### Backend Testing

#### Health Check
```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

#### Load Test
```powershell
cd backend\scripts
.\test-load-balancing.ps1
```

#### API Testing
```bash
# Test all endpoints
node scripts/test-api.js

# Test OTP registration
node scripts/test-otp-register.js

# Test payments
node scripts/test-payment.js
```

### Frontend Testing

#### Development
```bash
npm run dev
```

#### Build & Preview
```bash
npm run build
npm run preview
```

#### Manual Testing
1. Open `http://localhost:3000`
2. Register a new user
3. Verify OTP
4. Login
5. Test features

## πŸš€ Deployment

### Backend Deployment

#### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name safestay-api
pm2 save
pm2 startup
```

#### Using Docker
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

```bash
docker build -t safestay-backend .
docker run -p 5000:5000 --env-file .env safestay-backend
```

### Frontend Deployment

#### Build
```bash
npm run build
```

#### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Environment Variables (Production)

Set these in your hosting platform:

**Backend:**
- All .env variables
- Set `NODE_ENV=production`
- Use production database URL
- Use production API keys

**Frontend:**
- `VITE_API_URL=https://api.yourdomain.com`
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_RAZORPAY_KEY_ID`

## 🚨 Troubleshooting

### Backend Issues

#### Server Won't Start
```bash
# Check MongoDB
mongod --version

# Check port
netstat -ano | findstr :5000

# Check logs
cat backend/logs/app.log
```

#### Getting 503 Errors
```powershell
# Check queue size
(Invoke-RestMethod http://localhost:5000/api/metrics).requests

# Increase limits in .env
MAX_CONCURRENT_REQUESTS=200
```

#### Memory Issues
- Health monitor triggers GC automatically
- Server shuts down gracefully at 98% memory
- PM2 auto-restarts

### Frontend Issues

#### Build Fails
```bash
rm -rf node_modules dist
npm install
npm run build
```

#### API Requests Failing
```javascript
// Check circuit breaker
import { apiManager } from '@/services/apiManager';
console.log(apiManager.getStats());
```

#### Images Not Loading
- Verify Cloudinary config
- Check CORS settings
- Verify image URLs

## πŸ"Š Monitoring

### Real-time Monitoring

#### Backend Health
```powershell
while ($true) { 
  clear
  Invoke-RestMethod http://localhost:5000/api/health | ConvertTo-Json -Depth 5
  Start-Sleep 2
}
```

#### Request Stats
```powershell
(Invoke-RestMethod http://localhost:5000/api/metrics).requests
```

### Expected Metrics

**Healthy State:**
- Memory: < 85%
- CPU: < 90%
- Active requests: < 100
- Queued requests: 0
- Rejected requests: 0

**Warning State:**
- Memory: 85-98%
- Active requests: 80-100
- Queued requests: 1-100

**Critical State:**
- Memory: > 98% (triggers shutdown)
- Queued requests: > 1000 (returns 503)

## πŸ"– Additional Resources

### Documentation
- Backend Guide: `backend/BACKEND_GUIDE.md`
- Frontend Guide: `frontend/FRONTEND_GUIDE.md`
- Load Balancing: `docs/LOAD_BALANCING_GUIDE.md`
- API Testing: `backend/docs/API_TESTING_GUIDE.md`

### Scripts
- Load test: `backend/scripts/test-load-balancing.ps1`
- API test: `backend/scripts/test-api.js`
- User management: `backend/scripts/list-users.js`

## βœ… Summary

**Tech Stack:**
- βœ… Node.js (ES6 modules) + Express
- βœ… MongoDB + Mongoose
- βœ… React 18 + Vite
- βœ… Tailwind CSS
- βœ… Socket.IO
- βœ… JWT Authentication
- βœ… Razorpay Payments
- βœ… Twilio OTP
- βœ… Cloudinary Images
- βœ… Google Maps

**Features:**
- βœ… Complete authentication system
- βœ… Hostel management
- βœ… Booking system
- βœ… Payment integration
- βœ… Canteen management
- βœ… Admin dashboard
- βœ… Real-time updates
- βœ… 360Β° panorama viewer
- βœ… Map integration

**High Availability:**
- βœ… Health monitoring
- βœ… Request queue management
- βœ… Graceful shutdown
- βœ… Circuit breaker
- βœ… Automatic retry
- βœ… Offline support
- βœ… Crash prevention

Your application is **production-ready** and **crash-proof**! πŸŽ‰

## πŸ"ž Support

For issues or questions:
1. Check troubleshooting section
2. Review documentation
3. Check backend/frontend logs
4. Verify environment variables
5. Test health endpoints

---

**Last Updated:** January 2026
**Version:** 2.0.0
**Status:** Production Ready
