# OTP Registration Flow Diagram

## 📊 Visual Flow Chart

```
┌─────────────────────────────────────────────────────────────────┐
│                    OTP REGISTRATION FLOW                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   User Opens │
│   /register  │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: REGISTRATION FORM                                       │
│  ┌────────────────────────────────────────┐                     │
│  │  Name:     [________________]          │                     │
│  │  Email:    [________________]          │                     │
│  │  Phone:    [__________]                │                     │
│  │  Role:     [Tenant ▼]                  │                     │
│  │  Password: [________________]          │                     │
│  │  Confirm:  [________________]          │                     │
│  │                                         │                     │
│  │         [ Send OTP ]                   │                     │
│  └────────────────────────────────────────┘                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ Click "Send OTP"
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND: /api/auth/register                                     │
│  ┌────────────────────────────────────────────────────┐         │
│  │  1. Validate form data                             │         │
│  │  2. Check if user already exists                   │         │
│  │  3. Generate 6-digit OTP (e.g., 123456)           │         │
│  │  4. Create inactive user in DB                     │         │
│  │     - isActive: false                              │         │
│  │     - phoneVerified: false                         │         │
│  │     - otp: "123456"                                │         │
│  │     - otpExpiry: now + 10 minutes                  │         │
│  │  5. Send SMS via Twilio                            │         │
│  └────────────────────────────────────────────────────┘         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ OTP Sent ✓
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  USER RECEIVES SMS                                               │
│  ┌────────────────────────────────────────────────────┐         │
│  │  Your SafeStay Hub verification code is: 123456    │         │
│  │  This code will expire in 10 minutes.              │         │
│  └────────────────────────────────────────────────────┘         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: OTP VERIFICATION                                        │
│  ┌────────────────────────────────────────┐                     │
│  │  We sent OTP to: 9876543210            │                     │
│  │                                         │                     │
│  │  Enter OTP: [  1  2  3  4  5  6  ]    │                     │
│  │                                         │                     │
│  │    [Back]        [Verify OTP]          │                     │
│  │                                         │                     │
│  │           [Resend OTP]                 │                     │
│  └────────────────────────────────────────┘                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ Click "Verify OTP"
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND: /api/auth/verify-otp                                   │
│  ┌────────────────────────────────────────────────────┐         │
│  │  1. Find user by phone                             │         │
│  │  2. Check if OTP matches                           │         │
│  │  3. Check if OTP expired                           │         │
│  │  4. If valid:                                      │         │
│  │     - Set phoneVerified: true                      │         │
│  │     - Set isActive: true                           │         │
│  │     - Clear otp and otpExpiry                      │         │
│  │  5. Send welcome email & SMS                       │         │
│  │  6. Generate JWT token                             │         │
│  └────────────────────────────────────────────────────┘         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ Verification Success ✓
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  USER LOGGED IN                                                  │
│  ┌────────────────────────────────────────────────────┐         │
│  │  • Token stored in localStorage                    │         │
│  │  • Redirected to /dashboard                        │         │
│  │  • Account fully activated                         │         │
│  └────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
                        ALTERNATE FLOWS
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  SCENARIO: OTP EXPIRED                                           │
├─────────────────────────────────────────────────────────────────┤
│  User enters OTP after 10+ minutes                              │
│         ↓                                                        │
│  Error: "OTP has expired"                                        │
│         ↓                                                        │
│  User clicks "Resend OTP"                                        │
│         ↓                                                        │
│  POST /api/auth/resend-otp                                       │
│         ↓                                                        │
│  New OTP generated & sent                                        │
│         ↓                                                        │
│  User enters new OTP                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SCENARIO: INVALID OTP                                           │
├─────────────────────────────────────────────────────────────────┤
│  User enters wrong OTP (e.g., 999999)                           │
│         ↓                                                        │
│  Error: "Invalid OTP"                                            │
│         ↓                                                        │
│  User can try again or resend OTP                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SCENARIO: BACK BUTTON                                           │
├─────────────────────────────────────────────────────────────────┤
│  User on OTP screen clicks "Back"                                │
│         ↓                                                        │
│  Returns to registration form                                    │
│         ↓                                                        │
│  Form data preserved, can edit                                   │
│         ↓                                                        │
│  Click "Send OTP" again → New OTP sent                          │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
                        DATABASE STATES
═══════════════════════════════════════════════════════════════════

BEFORE OTP VERIFICATION:
┌─────────────────────────────────────────────────────────────────┐
│ User Document in MongoDB                                         │
├─────────────────────────────────────────────────────────────────┤
│ {                                                                │
│   name: "John Doe",                                              │
│   email: "john@example.com",                                     │
│   phone: "9876543210",                                           │
│   password: "$2a$10$hashed...",                                  │
│   role: "tenant",                                                │
│   isActive: false,           ❌ INACTIVE                         │
│   phoneVerified: false,       ❌ NOT VERIFIED                    │
│   otp: "123456",              🔐 STORED OTP                      │
│   otpExpiry: "2025-10-29T10:15:00Z"  ⏰ EXPIRY TIME             │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ User verifies OTP
                           ▼
AFTER OTP VERIFICATION:
┌─────────────────────────────────────────────────────────────────┐
│ User Document in MongoDB                                         │
├─────────────────────────────────────────────────────────────────┤
│ {                                                                │
│   name: "John Doe",                                              │
│   email: "john@example.com",                                     │
│   phone: "9876543210",                                           │
│   password: "$2a$10$hashed...",                                  │
│   role: "tenant",                                                │
│   isActive: true,            ✅ ACTIVE                           │
│   phoneVerified: true,        ✅ VERIFIED                        │
│   // otp removed                                                 │
│   // otpExpiry removed                                           │
│ }                                                                │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
                        API ENDPOINTS
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  POST /api/auth/register                                         │
├─────────────────────────────────────────────────────────────────┤
│  Request:                                                        │
│  {                                                               │
│    "name": "John Doe",                                           │
│    "email": "john@example.com",                                  │
│    "phone": "9876543210",                                        │
│    "password": "password123",                                    │
│    "role": "tenant"                                              │
│  }                                                               │
│                                                                  │
│  Response:                                                       │
│  {                                                               │
│    "success": true,                                              │
│    "message": "OTP sent successfully",                           │
│    "data": { "userId": "...", "phone": "9876543210" }           │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  POST /api/auth/verify-otp                                       │
├─────────────────────────────────────────────────────────────────┤
│  Request:                                                        │
│  {                                                               │
│    "phone": "9876543210",                                        │
│    "otp": "123456"                                               │
│  }                                                               │
│                                                                  │
│  Response:                                                       │
│  {                                                               │
│    "success": true,                                              │
│    "message": "Phone verified successfully",                     │
│    "data": {                                                     │
│      "_id": "...",                                               │
│      "name": "John Doe",                                         │
│      "email": "john@example.com",                                │
│      "phone": "9876543210",                                      │
│      "role": "tenant",                                           │
│      "token": "eyJhbGc..."                                       │
│    }                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  POST /api/auth/resend-otp                                       │
├─────────────────────────────────────────────────────────────────┤
│  Request:                                                        │
│  {                                                               │
│    "phone": "9876543210"                                         │
│  }                                                               │
│                                                                  │
│  Response:                                                       │
│  {                                                               │
│    "success": true,                                              │
│    "message": "OTP resent successfully"                          │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
                        SECURITY FEATURES
═══════════════════════════════════════════════════════════════════

🔐 Password Hashing         → bcrypt before storage
⏰ OTP Expiry               → 10 minutes validity
🔢 Random OTP               → 6-digit (100000-999999)
🔒 Hidden Fields            → OTP not in API responses
🚫 Duplicate Prevention     → Unique email & phone
❌ Inactive Accounts        → Cannot login until verified
✅ One-Time Use             → OTP cleared after use
📱 SMS Delivery             → Twilio integration
```

## 🎨 Frontend Component Structure

```
Register Component
├── State Management
│   ├── step (1: Form, 2: OTP)
│   ├── formData (name, email, phone, password, role)
│   ├── otp (6-digit code)
│   ├── loading (button states)
│   └── resendLoading (resend button state)
│
├── Step 1: Registration Form
│   ├── Name Input
│   ├── Email Input
│   ├── Phone Input (10 digits)
│   ├── Role Dropdown
│   ├── Password Input
│   ├── Confirm Password Input
│   └── Send OTP Button
│
└── Step 2: OTP Verification
    ├── Phone Number Display
    ├── OTP Input (6 digits)
    ├── Back Button
    ├── Verify OTP Button
    └── Resend OTP Link
```

## 📊 Success/Error States

```
┌─────────────────────────────────────────────────────────────────┐
│  VALIDATION ERRORS                                               │
├─────────────────────────────────────────────────────────────────┤
│  ❌ Passwords don't match                                        │
│  ❌ Password too short (min 6 characters)                        │
│  ❌ Invalid phone number (not 10 digits)                         │
│  ❌ Invalid email format                                         │
│  ❌ Required fields missing                                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  OTP ERRORS                                                      │
├─────────────────────────────────────────────────────────────────┤
│  ❌ Invalid OTP                                                  │
│  ❌ OTP expired (>10 minutes)                                    │
│  ❌ OTP not 6 digits                                             │
│  ❌ Phone not found                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SUCCESS MESSAGES                                                │
├─────────────────────────────────────────────────────────────────┤
│  ✅ OTP sent successfully                                        │
│  ✅ New OTP sent to your phone                                   │
│  ✅ Registration successful!                                     │
│  ✅ Phone verified successfully                                  │
└─────────────────────────────────────────────────────────────────┘
```
