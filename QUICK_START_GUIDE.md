# 🚀 Quick Start Guide - Complete Setup

Follow these steps to run both frontend and backend together.

## Prerequisites

- Node.js (v14 or higher) installed
- MongoDB installed and running (or connection string ready)
- npm or yarn installed

## Step-by-Step Instructions

### Step 1: Backend Setup (Terminal 1)

1. **Open Terminal 1** and navigate to backend directory:
```bash
cd backend
```

2. **Install dependencies** (if not already installed):
```bash
npm install
```

3. **Create `.env` file** in the backend directory:
```bash
# Create the file
touch .env    # On Mac/Linux
# Or just create .env file manually in VS Code
```

4. **Add minimum required configuration** to `.env`:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/safestay
JWT_SECRET=my_secret_key_change_this_in_production_12345678901
FRONTEND_URL=http://localhost:3000
```

> **Note**: If using MongoDB Atlas, use your connection string instead of `mongodb://localhost:27017/safestay`

5. **Start the backend server**:
```bash
npm start
```

You should see:
```
MongoDB Connected
Twilio credentials not configured - SMS disabled
Cloudinary credentials not configured - file uploads disabled
Razorpay credentials not configured - payments disabled
Server running in development mode on port 5000
```

✅ **Backend is now running on http://localhost:5000**

---

### Step 2: Frontend Setup (Terminal 2)

1. **Open a NEW Terminal 2** and navigate to frontend directory:
```bash
cd frontend
```

2. **Install dependencies** (if not already installed):
```bash
npm install
```

3. **Create `.env` file** in the frontend directory:
```bash
# Create the file
touch .env    # On Mac/Linux
# Or just create .env file manually in VS Code
```

4. **Add configuration** to `.env`:
```env
REACT_APP_API_URL=http://localhost:5000
```

5. **Start the frontend development server**:
```bash
npm start
```

The browser should automatically open to http://localhost:3000

✅ **Frontend is now running on http://localhost:3000**

---

## Step 3: Verify Everything is Connected

### Check Backend Health
Open browser or use curl:
```
http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "SafeStay Hub API is running"
}
```

### Check Frontend
- Frontend should be running at http://localhost:3000
- You should see the login/register page
- No connection errors in browser console

---

## Step 4: Test the Application

1. **Register a Test Account**:
   - Click "Register" on the frontend
   - Fill in the form:
     - Name: Test User
     - Email: test@example.com
     - Phone: 9876543210
     - Password: password123
     - Role: Tenant (or any role you want)
   - Click "Register"

2. **You should be automatically logged in** and redirected to your dashboard

3. **Try different roles** by registering multiple accounts:
   - tenant@test.com (Tenant role)
   - owner@test.com (Owner role)
   - provider@test.com (Canteen Provider role)

---

## Troubleshooting

### Backend won't start?

**Problem**: MongoDB connection error
```
Solution: Make sure MongoDB is running
- Mac: mongod
- Windows: Start MongoDB service
- Or use MongoDB Atlas connection string
```

**Problem**: Port 5000 already in use
```
Solution: Change PORT in .env file to another port (e.g., 5001)
```

### Frontend won't start?

**Problem**: Cannot find module errors
```
Solution: Run 'npm install' in the frontend directory
```

**Problem**: Connection refused to backend
```
Solution: 
1. Check backend is running in Terminal 1
2. Check .env has REACT_APP_API_URL=http://localhost:5000
3. Make sure backend is on correct port
```

### Registration/Login not working?

**Problem**: API errors in browser console
```
Solution: 
1. Check backend is running
2. Open browser DevTools (F12) → Network tab
3. Check if requests are going to correct URL
4. Verify CORS is enabled in backend (it should be)
```

---

## Common Directory Structure

Your project should look like this:
```
hackathon/
├── backend/
│   ├── .env              ← Create this with config above
│   ├── server.js
│   ├── package.json
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   └── ...
├── frontend/
│   ├── .env              ← Create this with config above
│   ├── src/
│   ├── package.json
│   └── ...
└── README files
```

---

## Running Both Services

### Option 1: Two Separate Terminals (Recommended)

**Terminal 1 (Backend)**:
```bash
cd backend
npm start
# Keep this running!
```

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm start
# Keep this running too!
```

### Option 2: Use Multiple Terminal Tabs in VS Code
- Open integrated terminal
- Click the split terminal icon (or Ctrl+Shift+`)
- Split into two terminals
- Run backend in one, frontend in other

---

## Quick Commands Summary

```bash
# Backend
cd backend
npm install          # First time only
npm start            # Start backend

# Frontend
cd frontend
npm install          # First time only
npm start            # Start frontend
```

---

## Default URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Backend Health**: http://localhost:5000/api/health

---

## Next Steps After Setup

1. ✅ Both servers running
2. ✅ Frontend connected to backend
3. ✅ Create test accounts
4. ✅ Explore different roles and features
5. ✅ Test all functionality

**Happy coding! 🎉**

For more details, see:
- `FRONTEND_INTEGRATION_GUIDE.md` - Detailed integration info
- `PROJECT_SUMMARY.md` - Complete feature list
- `backend/ENV_SETUP.md` - Environment configuration

