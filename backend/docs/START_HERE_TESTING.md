# 🧪 Start Here - Testing Your API Endpoints

## ✅ What I've Created for You

Three comprehensive testing resources:

1. **`TESTING_QUICKSTART.md`** - Quick reference for testing (start here!)
2. **`API_TESTING_GUIDE.md`** - Complete endpoint documentation
3. **`test-api.js`** - Automated test script

---

## 🚀 Quick Start (Choose One)

### Option A: Automated Testing (Fastest)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start your server** (in one terminal):
   ```bash
   npm start
   ```

3. **Run tests** (in another terminal):
   ```bash
   npm test
   ```
   
   OR directly:
   ```bash
   node test-api.js
   ```

This will test all endpoints automatically! ✅

---

### Option B: Postman (Visual)

1. Import `postman_collection_safestay.postman_collection.json` into Postman
2. Set `baseUrl` environment variable to `http://localhost:5000`
3. Run requests in sequence - tokens will be saved automatically

---

### Option C: Manual Testing

Follow the step-by-step guide in `API_TESTING_GUIDE.md` for detailed instructions.

---

## 📊 What Gets Tested?

### ✅ Test Coverage

- **Health Check** - Basic connectivity
- **Authentication** - Register & Login for all roles
- **Tenant Features** - Search hostels, manage expenses, feedback
- **Owner Features** - Create/manage hostels and rooms
- **Canteen Features** - Create canteens, manage orders
- **Contract Features** - Create, sign, and manage contracts
- **Admin Features** - System management and stats

---

## 🎯 Testing All Endpoints - Step by Step

### 1. Start Your Server
```bash
npm start
```

### 2. Run Automated Tests
```bash
npm test
```

### 3. Review Results
- ✅ Green checks = Passed
- ❌ Red X = Failed (check error message)
- Summary shows total passed/failed

---

## 📝 Manual Testing Workflow

If you prefer manual testing:

### Step 1: Health Check ✅
```
GET http://localhost:5000/api/health
```

### Step 2: Register Users
```
POST http://localhost:5000/api/auth/register
Body: { "name": "Test User", "email": "test@example.com", "phone": "9876543210", "password": "password123", "role": "tenant" }
```

**Test with different roles:**
- `tenant` - For tenant features
- `owner` - For owner/hostel features
- `canteen_provider` - For canteen management
- `master_admin` - For admin access

### Step 3: Login
```
POST http://localhost:5000/api/auth/login
Body: { "email": "test@example.com", "password": "password123" }
```
**Save the token!**

### Step 4: Test Role-Specific Endpoints
Use the token in Authorization header:
```
Authorization: Bearer YOUR_TOKEN
```

**Test endpoints based on user role:**
- Tenant → `/api/tenant/*`
- Owner → `/api/owner/*`
- Canteen Provider → `/api/canteen/*`
- Admin → `/api/admin/*`

---

## 🔑 Key Testing Tips

1. **Tokens**: Save tokens after login for protected endpoints
2. **Role Testing**: Test each role separately
3. **Order Matters**: Create hostels before rooms, canteens before orders
4. **IDs**: Save resource IDs (hostelId, roomId, etc.) for dependent operations
5. **File Uploads**: Use multipart/form-data for file upload endpoints

---

## 📚 All Endpoints Summary

### Public (No Auth)
- ✅ `GET /api/health`
- ✅ `POST /api/auth/register`
- ✅ `POST /api/auth/login`

### Protected (Need Auth Token)
- Auth: `/api/auth/me`, `/api/auth/profile`
- Tenant: `/api/tenant/*` (hostels, expenses, feedback, contracts)
- Owner: `/api/owner/*` (hostels, rooms, media upload)
- Canteen: `/api/canteen/*` (canteens, menu, orders)
- Contract: `/api/contract/*` (create, sign, manage)
- Admin: `/api/admin/*` (users, stats, hostels, verification)

**Total: 40+ endpoints**

---

## 🎓 Full Documentation

- **Detailed Guide**: See `API_TESTING_GUIDE.md`
- **Quick Reference**: See `TESTING_QUICKSTART.md`
- **Postman Collection**: Already included!
- **Auto Tests**: Run with `npm test`

---

## 💡 Need Help?

**Common Issues:**

**"Cannot connect"**
→ Make sure server is running on port 5000

**"401 Unauthorized"**
→ Include Bearer token in Authorization header

**"403 Forbidden"**
→ Check user role matches endpoint requirement

**"404 Not Found"**
→ Verify correct endpoint URL

**"500 Server Error"**
→ Check database connection and .env configuration

---

## 🎉 You're Ready!

Run `npm test` to test all endpoints automatically!

Or follow the detailed guide in `API_TESTING_GUIDE.md` for manual testing.

Happy Testing! 🚀

