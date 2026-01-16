# 🔧 Registration Failed - Troubleshooting Guide

## ❌ What's Happening
Registration is failing because the backend API is not responding correctly.

---

## ✅ Step 1: Verify Backend is Running

### Check if Backend Started Successfully
```bash
cd c:\Users\subha\Desktop\PROGRAMING\Clone\new-project\backend
npm start
```

**Expected Output:**
```
Server running on port 5000
MongoDB connected successfully
```

**If you see errors:**

### Error 1: MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Start MongoDB
```bash
# Windows
mongod

# Or if MongoDB is installed as service
net start MongoDB
```

### Error 2: Missing Environment Variables
```
Error: process.env.JWT_SECRET is undefined
```
**Solution:** Create `.env` file in backend folder with:
```
MONGODB_URI=mongodb://localhost:27017/safestay
JWT_SECRET=your_secret_key_here
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
PORT=5000
```

### Error 3: Port 5000 Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Kill the process using port 5000
```bash
# Find and kill process on port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

---

## ✅ Step 2: Verify API Connection

### Test Backend API Directly
Open in browser: `http://localhost:5000/api/auth/login`

**Expected:** Should show API response (error is OK, means API is running)

**If 404 or connection refused:**
- Backend is NOT running
- Go to Step 1 and start backend

---

## ✅ Step 3: Check Frontend Console

### Open Browser DevTools
1. Press `F12` in browser
2. Go to **Console** tab
3. Look for error messages

**Common Errors:**

### Error: "Cannot POST /api/auth/register"
```
POST http://localhost:5000/api/auth/register 404
```
**Solution:** Backend API routes not found
- Restart backend with `npm start`
- Ensure `backend/routes/authRoutes.js` exists

### Error: "Network Error"
```
Network Error: Could not connect to http://localhost:5000
```
**Solution:** Backend not running
- Start backend: `npm start` in backend folder
- Check port 5000 is accessible

### Error: CORS or Headers
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Backend CORS not configured
- Check `backend/server.js` has CORS enabled:
```javascript
const cors = require('cors');
app.use(cors());
```

---

## ✅ Step 4: Complete Startup Sequence

### Terminal 1 - MongoDB (if needed)
```bash
mongod
```
Wait for: `MongoDB waiting for connections on port 27017`

### Terminal 2 - Backend
```bash
cd c:\Users\subha\Desktop\PROGRAMING\Clone\new-project\backend
npm start
```
Wait for: `Server running on port 5000`

### Terminal 3 - Frontend
```bash
cd c:\Users\subha\Desktop\PROGRAMING\Clone\new-project\frontend
npm run dev
```
Wait for: `VITE ready in XXX ms`

---

## ✅ Step 5: Test Registration Again

1. Open `http://localhost:3000` in browser
2. Click **Register**
3. Fill form:
   - Name: Sohan
   - Email: sohan@gmail.com
   - Phone: +919792227293
   - Role: Hostel Owner
   - Password: testpass123
   - Confirm: testpass123
4. Click **Continue to OTP**

**Expected Flow:**
1. ✅ Form submitted
2. ✅ Backend sends OTP to phone
3. ✅ OTP visible in backend console (or SMS if Twilio configured)
4. ✅ User redirected to OTP entry step
5. ✅ Enter OTP and verify

---

## ✅ Checklist Before Registration

- [ ] Backend running on port 5000
- [ ] MongoDB running (if used)
- [ ] Frontend running on port 3000
- [ ] No errors in browser console (F12)
- [ ] No errors in backend terminal
- [ ] `.env` file exists in backend with all variables
- [ ] Can access `http://localhost:5000/api/auth/login` in browser

---

## 🔍 Debug Mode

### Check Backend Logs
In backend terminal, look for:
```
POST /api/auth/register - Request received
Generating OTP...
OTP: 123456
Sending SMS...
```

### Check Frontend Network
1. Press `F12` in browser
2. Go to **Network** tab
3. Click **Register** button
4. Look for the `register` request
5. Check:
   - Status: Should be 200 or 400 (not 500 or error)
   - Response: Should contain JSON data

---

## 📞 OTP Verification Options

### If Twilio Not Configured
Backend logs will show:
```
SMS (not sent - Twilio not configured): Your verification code is: 123456
```

**Solution:** Copy the OTP from backend console and enter in frontend

### If Twilio Configured
OTP will be sent via SMS to the phone number provided

---

## 🚀 Once Working

After successful registration:
1. ✅ Account created
2. ✅ Redirected to dashboard
3. ✅ Can access tenant/owner/admin pages based on role
4. ✅ JWT token stored in localStorage

---

## 💡 Quick Fix Checklist

If registration still fails:

- [ ] Restart backend: `npm start`
- [ ] Restart frontend: `npm run dev`
- [ ] Clear browser cache: `Ctrl+Shift+Delete`
- [ ] Check backend `.env` exists and has all variables
- [ ] Verify MongoDB running (if applicable)
- [ ] Check backend console for error messages
- [ ] Check frontend console (F12) for error messages

---

**The frontend and backend are connected! Just ensure backend is running properly.** ✅
