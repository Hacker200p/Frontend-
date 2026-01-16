# OTP-Based Registration Flow

## Overview
The registration system has been updated to use OTP (One-Time Password) verification for phone numbers. Users must verify their phone number with an OTP before their account is fully created.

## Flow

### 1. Register and Send OTP
**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "tenant"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent successfully to your phone number",
  "data": {
    "userId": "64abc123def456...",
    "phone": "9876543210"
  }
}
```

**What happens:**
- Creates a temporary user account (inactive)
- Generates a 6-digit OTP
- Sets OTP expiry to 10 minutes
- Sends OTP via SMS to the phone number
- User account remains inactive until verified

### 2. Verify OTP (Complete Registration)
**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Phone verified successfully",
  "data": {
    "_id": "64abc123def456...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "tenant",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**What happens:**
- Verifies the OTP matches and hasn't expired
- Activates the user account
- Marks phone as verified
- Sends welcome email and SMS
- Returns user data with JWT token

### 3. Resend OTP (Optional)
**Endpoint:** `POST /api/auth/resend-otp`

**Request Body:**
```json
{
  "phone": "9876543210"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP resent successfully"
}
```

**What happens:**
- Generates a new OTP
- Updates OTP expiry to 10 minutes from now
- Sends new OTP via SMS

## User Model Changes

### New Fields Added:
```javascript
{
  otp: String,              // Stores the OTP (not returned in queries by default)
  otpExpiry: Date,          // OTP expiration timestamp
  phoneVerified: Boolean,   // Whether phone is verified (default: false)
  // isActive is now false until phone is verified
}
```

## Error Handling

### Common Error Responses:

**User Already Exists:**
```json
{
  "success": false,
  "message": "User already exists"
}
```

**Invalid OTP:**
```json
{
  "success": false,
  "message": "Invalid OTP"
}
```

**OTP Expired:**
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new one"
}
```

**User Not Found:**
```json
{
  "success": false,
  "message": "User not found"
}
```

## SMS Format

**OTP SMS:**
```
Your SafeStay Hub verification code is: 123456. This code will expire in 10 minutes.
```

**Welcome SMS (after verification):**
```
Welcome to SafeStay Hub! Your account has been verified successfully.
```

## Frontend Integration

### Registration Flow:

```javascript
// Step 1: Register and send OTP
const sendOTP = async (userData) => {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
};

// Step 2: Verify OTP
const verifyOTP = async (phone, otp) => {
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp })
  });
  return response.json();
};

// Step 3: Resend OTP (if needed)
const resendOTP = async (phone) => {
  const response = await fetch('/api/auth/resend-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone })
  });
  return response.json();
};
```

### Example Usage:

```javascript
// User fills registration form
const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '9876543210',
  password: 'password123',
  role: 'tenant'
};

// Register and send OTP
const otpResponse = await sendOTP(userData);
if (otpResponse.success) {
  // Show OTP input form
  const enteredOTP = prompt('Enter OTP sent to your phone');
  
  // Verify OTP
  const verifyResponse = await verifyOTP(userData.phone, enteredOTP);
  if (verifyResponse.success) {
    // Store token and redirect to dashboard
    localStorage.setItem('token', verifyResponse.data.token);
    window.location.href = '/dashboard';
  }
}
```

## Testing with Postman

### Test Sequence:

1. **Register and Send OTP:**
   - POST `http://localhost:5000/api/auth/register`
   - Body: User registration data
   - Check your phone for OTP (or check server logs if Twilio not configured)

2. **Verify OTP:**
   - POST `http://localhost:5000/api/auth/verify-otp`
   - Body: `{ "phone": "9876543210", "otp": "123456" }`
   - Copy the token from response

3. **Resend OTP (if needed):**
   - POST `http://localhost:5000/api/auth/resend-otp`
   - Body: `{ "phone": "9876543210" }`

## Security Features

1. **OTP Expiry:** OTPs expire after 10 minutes
2. **One-Time Use:** OTP is cleared after successful verification
3. **Inactive Until Verified:** User accounts remain inactive until phone is verified
4. **Duplicate Prevention:** Cannot create account if email or phone already exists
5. **Password Security:** Passwords are hashed before storing

## Backward Compatibility

The `/api/auth/register` endpoint now sends OTP instead of directly creating an active account. You must complete the verification flow with `/api/auth/verify-otp` to activate the account.

## Troubleshooting

### OTP Not Received:
- Check Twilio configuration in `.env`
- Verify phone number format (10 digits without +91)
- Check server logs for SMS errors

### OTP Expired:
- Request a new OTP using `/api/auth/resend-otp`
- OTPs are valid for 10 minutes only

### Account Already Exists:
- User with same email or phone already registered
- Use login instead or use different credentials
