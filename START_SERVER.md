# 🚀 Quick Start Guide

## Running the Complete Application

### Option 1: Quick Start (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm start
```

### Option 2: Using Scripts (Coming Soon)

```bash
# Install all dependencies
npm run install:all

# Start backend
npm run start:backend

# Start frontend
npm run start:frontend

# Start both
npm run start:all
```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Environment Setup

### Backend `.env` file:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/safestay
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000
```

## Testing Accounts

Register new accounts or use these test credentials:

| Role | Email | Password |
|------|-------|----------|
| Tenant | tenant@test.com | password123 |
| Owner | owner@test.com | password123 |
| Provider | provider@test.com | password123 |
| Admin | admin@test.com | password123 |

## Features by Role

### Tenant
- Search hostels
- Track expenses
- View contracts
- Order food

### Owner
- Create hostels
- Manage rooms
- Upload photos

### Canteen Provider
- Manage menu
- Process orders

### Admin
- Manage users
- Verify hostels
- View statistics

Enjoy! 🎉

