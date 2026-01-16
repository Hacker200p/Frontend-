# 🔧 Fix: OTP Not Being Sent

## Problem
The `/api/auth/register` endpoint is sending confirmation message instead of OTP.

## Root Cause
The server is likely running cached code or needs to be restarted to load the new changes.

## Solution Steps

### Step 1: Stop the Server
```powershell
# Press Ctrl+C in the terminal where server is running
# OR
# Find and kill the node process
Get-Process node | Stop-Process -Force
```

### Step 2: Clear Node Cache (Optional)
```powershell
cd backend
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
```

### Step 3: Restart the Server
```powershell
cd backend
npm start
```

### Step 4: Test the Endpoint

**Option A: Using the test script**
```powershell
# In a new terminal
cd backend
node test-otp-register.js
```

**Option B: Using curl/Postman**
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "tenant"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your phone number",
  "data": {
    "userId": "...",
    "phone": "9876543210"
  }
}
```

### Step 5: Check Server Logs

When you register, you should see in the server console:
```
[REGISTER] Generated OTP: 123456 for phone: 9876543210
[REGISTER] Created temporary user with ID: ...
SMS (not sent - Twilio not configured): Your SafeStay Hub verification code is: 123456...
[REGISTER] OTP SMS sent to 9876543210
```

The OTP will be visible in the logs if Twilio is not configured.

---

## Verification Checklist

- [ ] Server restarted
- [ ] Test endpoint with fresh request
- [ ] Check response message says "OTP sent successfully"
- [ ] Check server logs show "[REGISTER] Generated OTP: ..."
- [ ] OTP code visible in logs (if Twilio not configured)

---

## If Still Not Working

### Check the files are saved:
```powershell
# Check authController.js was modified
Select-String -Path "backend/controllers/authController.js" -Pattern "Generated OTP"

# Should show the console.log line
```

### Verify routes are correct:
```powershell
# Check authRoutes.js
Get-Content backend/routes/authRoutes.js
```

### Check for multiple node processes:
```powershell
Get-Process node
# Should only see one node process
```

---

## Quick Test Command

Run this in PowerShell to test:
```powershell
$body = @{
    name = "Test User"
    email = "test$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
    phone = "9876543210"
    password = "password123"
    role = "tenant"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

This should return:
```
success : True
message : OTP sent successfully to your phone number
data    : @{userId=...; phone=9876543210}
```

---

## Notes

1. **The OTP code is in server logs** (if Twilio not configured)
2. Look for line: `SMS (not sent - Twilio not configured): Your SafeStay Hub verification code is: XXXXXX`
3. The OTP is **6 digits** and valid for **10 minutes**
