# OTP Registration - Quick Reference

## 📱 Registration Flow

```
User Fills Form → Register (Send OTP) → User Receives SMS → Enter OTP → Account Activated ✅
```

## 🔑 API Endpoints

### 1. Register and Send OTP
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "tenant"
}
```
**Response:** `{ success: true, message: "OTP sent...", data: { userId, phone } }`

---

### 2. Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456"
}
```
**Response:** `{ success: true, data: { _id, name, email, phone, role, token } }`

---

### 3. Resend OTP
```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "phone": "9876543210"
}
```
**Response:** `{ success: true, message: "OTP resent successfully" }`

---

## 📝 Frontend Usage

```javascript
// Step 1: Register and send OTP
const response = await axios.post('/api/auth/register', {
  name, email, phone, password, role
});

// Step 2: Verify OTP  
const verifyResponse = await axios.post('/api/auth/verify-otp', {
  phone, otp
});

// Step 3: Store token
localStorage.setItem('token', verifyResponse.data.data.token);
```

---

## 🔐 Security

- ⏱️ OTP expires in **10 minutes**
- 🔢 **6-digit** random OTP
- 🚫 Account **inactive** until verified
- ✅ One-time use only
- 🔒 OTP field hidden in API responses

---

## 📱 SMS Format

**OTP SMS:**
```
Your SafeStay Hub verification code is: 123456. 
This code will expire in 10 minutes.
```

---

## ⚡ Quick Test (Postman)

1. **Register** → Copy phone number
2. Check **server logs** or **phone** for OTP
3. **Verify OTP** → Get token
4. Use token for authenticated requests

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| OTP not received | Check Twilio config in `.env` |
| OTP expired | Use resend-otp endpoint |
| Invalid OTP | Check entered digits match SMS |
| Account exists | Email/phone already registered |

---

## 📂 Modified Files

**Backend:**
- `models/User.js` - Added OTP fields
- `controllers/authController.js` - OTP endpoints
- `routes/authRoutes.js` - New routes
- `utils/generateOTP.js` - OTP generator

**Frontend:**
- `pages/Register.js` - Two-step form

---

## 🚀 Environment Variables

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 📖 Full Documentation

See `OTP_REGISTRATION_GUIDE.md` for complete details.
