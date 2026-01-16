# OTP Registration Testing Guide

## 🧪 Testing Checklist

### Prerequisites
- ✅ Backend server running on `http://localhost:5000`
- ✅ Frontend server running on `http://localhost:3000`
- ✅ MongoDB connected
- ✅ Twilio credentials configured in `.env` (optional for testing)

---

## 📋 Test Scenarios

### 1. Happy Path - Successful Registration

#### Steps:
1. Navigate to `http://localhost:3000/register`
2. Fill in the registration form:
   - **Name:** Test User
   - **Email:** testuser@example.com
   - **Phone:** 9876543210
   - **Role:** Tenant
   - **Password:** password123
   - **Confirm Password:** password123
3. Click "Send OTP"
4. Check your phone for OTP (or server logs if Twilio not configured)
5. Enter the 6-digit OTP
6. Click "Verify OTP"
7. Should redirect to dashboard with login successful

#### Expected Results:
- ✅ OTP sent successfully message
- ✅ Receive SMS with 6-digit OTP
- ✅ Phone verification screen appears
- ✅ After verification, receive welcome SMS
- ✅ Redirected to dashboard
- ✅ User logged in with token

---

### 2. Invalid OTP Test

#### Steps:
1. Complete registration form
2. Click "Send OTP"
3. Enter wrong OTP (e.g., 999999)
4. Click "Verify OTP"

#### Expected Results:
- ❌ Error message: "Invalid OTP"
- 📱 Remains on OTP verification screen

---

### 3. Expired OTP Test

#### Steps:
1. Complete registration form
2. Click "Send OTP"
3. Wait 10+ minutes (or modify `otpExpiry` in code for faster testing)
4. Enter the original OTP
5. Click "Verify OTP"

#### Expected Results:
- ❌ Error message: "OTP has expired. Please request a new one"
- 🔄 User can click "Resend OTP"

---

### 4. Resend OTP Test

#### Steps:
1. Complete registration form
2. Click "Send OTP"
3. On OTP verification screen, click "Resend OTP"
4. Check for new OTP
5. Enter new OTP
6. Click "Verify OTP"

#### Expected Results:
- ✅ Success message: "New OTP sent to your phone"
- 📱 New SMS received
- ✅ New OTP works for verification

---

### 5. Duplicate Registration Test

#### Steps:
1. Register with email: existing@example.com, phone: 1234567890
2. Complete OTP verification
3. Logout
4. Try to register again with same email or phone

#### Expected Results:
- ❌ Error message: "User already exists"
- 🚫 No OTP sent

---

### 6. Back Button Test

#### Steps:
1. Complete registration form
2. Click "Send OTP"
3. On OTP screen, click "Back"
4. Modify any field (e.g., change name)
5. Click "Send OTP" again

#### Expected Results:
- ✅ Returns to registration form
- ✅ Form data preserved
- ✅ Can edit and resend OTP

---

### 7. Form Validation Tests

#### Test Cases:

**A. Password Mismatch**
- Password: password123
- Confirm: password456
- Expected: ❌ "Passwords do not match"

**B. Short Password**
- Password: 12345
- Expected: ❌ "Password must be at least 6 characters"

**C. Invalid Phone**
- Phone: 12345
- Expected: ❌ HTML5 validation error (not 10 digits)

**D. Invalid Email**
- Email: notanemail
- Expected: ❌ HTML5 validation error

**E. Empty Fields**
- Leave any field empty
- Expected: ❌ HTML5 required field validation

---

## 🔧 Backend API Testing (Postman)

### Setup:
1. Import `backend/postman_otp_registration.postman_collection.json`
2. Ensure server is running

### Test Sequence:

#### Test 1: Send OTP
```http
POST http://localhost:5000/api/auth/register

Body:
{
  "name": "API Test User",
  "email": "apitest@example.com",
  "phone": "8888888888",
  "password": "test123",
  "role": "tenant"
}

Expected: 200 OK
{
  "success": true,
  "message": "OTP sent successfully to your phone number",
  "data": {
    "userId": "...",
    "phone": "8888888888"
  }
}
```

#### Test 2: Verify OTP (Check Server Logs for OTP)
```http
POST http://localhost:5000/api/auth/verify-otp

Body:
{
  "phone": "8888888888",
  "otp": "123456"  // Use actual OTP from logs/SMS
}

Expected: 201 Created
{
  "success": true,
  "message": "Phone verified successfully",
  "data": {
    "_id": "...",
    "name": "API Test User",
    "email": "apitest@example.com",
    "phone": "8888888888",
    "role": "tenant",
    "token": "eyJhbGc..."
  }
}
```

#### Test 3: Resend OTP
```http
POST http://localhost:5000/api/auth/resend-otp

Body:
{
  "phone": "8888888888"
}

Expected: 200 OK
{
  "success": true,
  "message": "OTP resent successfully"
}
```

#### Test 4: Invalid OTP
```http
POST http://localhost:5000/api/auth/verify-otp

Body:
{
  "phone": "8888888888",
  "otp": "000000"
}

Expected: 400 Bad Request
{
  "success": false,
  "message": "Invalid OTP"
}
```

---

## 🔍 Database Verification

### Check User Document:

```javascript
// MongoDB Shell or Compass
db.users.findOne({ phone: "9876543210" })

// Before OTP verification:
{
  _id: ObjectId("..."),
  name: "Test User",
  email: "testuser@example.com",
  phone: "9876543210",
  role: "tenant",
  isActive: false,           // ❌ Inactive
  phoneVerified: false,       // ❌ Not verified
  otp: "123456",             // 🔐 Has OTP
  otpExpiry: ISODate("...")  // ⏱️ Expiry time
}

// After OTP verification:
{
  _id: ObjectId("..."),
  name: "Test User",
  email: "testuser@example.com",
  phone: "9876543210",
  role: "tenant",
  isActive: true,            // ✅ Active
  phoneVerified: true,        // ✅ Verified
  // otp and otpExpiry removed
}
```

---

## 🐛 Debugging

### If Twilio Not Configured:

**Check Server Logs:**
```bash
# Look for these log messages:
SMS (not sent - Twilio not configured): Your SafeStay Hub verification code is: 123456...
```

**Copy OTP from logs** and use it for testing.

### Enable Detailed Logging:

Add to `authController.js` for debugging:
```javascript
console.log('Generated OTP:', otp);
console.log('OTP Expiry:', otpExpiry);
console.log('User created:', tempUser._id);
```

---

## 📊 Test Results Template

| Test Case | Status | Notes |
|-----------|--------|-------|
| Happy Path Registration | ⬜ | |
| Invalid OTP | ⬜ | |
| Expired OTP | ⬜ | |
| Resend OTP | ⬜ | |
| Duplicate User | ⬜ | |
| Password Validation | ⬜ | |
| Phone Validation | ⬜ | |
| Back Button | ⬜ | |
| Login After Verification | ⬜ | |

---

## 🚀 Quick Test Script

```bash
# 1. Start Backend
cd backend
npm start

# 2. In new terminal, start Frontend
cd frontend
npm start

# 3. Open browser
# Navigate to http://localhost:3000/register

# 4. Monitor logs
# Backend terminal will show OTP if Twilio not configured
```

---

## ✅ Success Criteria

- [ ] User can complete registration with OTP
- [ ] OTP is received via SMS (or visible in logs)
- [ ] Invalid OTP is rejected
- [ ] Expired OTP is rejected
- [ ] Resend OTP works
- [ ] User can go back and edit details
- [ ] Duplicate emails/phones are prevented
- [ ] Form validation works correctly
- [ ] User is logged in after verification
- [ ] Welcome messages are sent
- [ ] Database shows correct user state

---

## 📞 Support

If tests fail:
1. Check `.env` configuration
2. Verify MongoDB connection
3. Check server logs for errors
4. Ensure all dependencies installed
5. Clear browser cache/localStorage
6. Try different browser

---

## 🔄 Reset Test Data

```javascript
// MongoDB Shell - Delete test user
db.users.deleteOne({ email: "testuser@example.com" })

// Or delete all test users
db.users.deleteMany({ email: { $regex: "test" } })
```

---

## 📝 Notes

- Default OTP expiry: **10 minutes**
- OTP format: **6 digits** (100000-999999)
- Phone format: **10 digits** without country code
- SMS sent to: **+91** + phone number
