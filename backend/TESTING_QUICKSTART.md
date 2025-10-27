# Quick Start - Testing All Endpoints

## 🚀 Quick Steps

### Option 1: Automated Testing (Recommended)

1. **Install axios** (if not already installed):
   ```bash
   npm install axios
   ```

2. **Make sure your server is running**:
   ```bash
   npm start
   ```

3. **Run the automated test script**:
   ```bash
   node test-api.js
   ```

This will automatically test all major endpoints and provide a summary.

---

### Option 2: Using Postman

1. **Import the Postman Collection**:
   - Open Postman
   - Click "Import"
   - Select `postman_collection_safestay.postman_collection.json`
   - Click "Import"

2. **Set Environment Variables**:
   - Create a new environment
   - Set `baseUrl` to `http://localhost:5000`
   - Leave `token` empty (it will be set automatically after login)

3. **Run requests in order**:
   - Start with "Health" endpoint
   - Then "Auth > Register" for each role
   - Then "Auth > Login" to get tokens
   - Continue with other endpoints

4. **Auto-set variables**:
   - In Postman, use the "Tests" tab to auto-save tokens and IDs
   - Example for Login:
     ```javascript
     if (pm.response.code === 200) {
         const jsonData = pm.response.json();
         pm.environment.set("token", jsonData.token);
     }
     ```

---

### Option 3: Manual Testing with curl

```bash
# Health check
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","phone":"9876543210","password":"password123","role":"tenant"}'

# Login (replace with your credentials)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get current user (replace TOKEN with actual token)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

## 📋 Complete Endpoint Checklist

### Public Endpoints
- [x] `GET /api/health` - Health check
- [x] `POST /api/auth/register` - User registration
- [x] `POST /api/auth/login` - User login

### Auth Endpoints (Protected)
- [x] `GET /api/auth/me` - Get current user
- [x] `PUT /api/auth/profile` - Update profile

### Tenant Endpoints
- [x] `GET /api/tenant/hostels/search` - Search hostels
- [x] `GET /api/tenant/hostels/:id` - Get hostel details
- [x] `GET /api/tenant/expenses` - Get expenses
- [x] `POST /api/tenant/expenses` - Add expense
- [x] `POST /api/tenant/feedback` - Submit feedback
- [x] `GET /api/tenant/contracts` - Get contracts

### Owner Endpoints
- [x] `POST /api/owner/hostels` - Create hostel
- [x] `GET /api/owner/hostels` - Get my hostels
- [x] `PUT /api/owner/hostels/:id` - Update hostel
- [x] `POST /api/owner/hostels/:id/upload` - Upload media
- [x] `POST /api/owner/hostels/:id/rooms` - Create room
- [x] `GET /api/owner/hostels/:id/rooms` - Get rooms
- [x] `PUT /api/owner/rooms/:id` - Update room

### Canteen Provider Endpoints
- [x] `POST /api/canteen` - Create canteen
- [x] `GET /api/canteen/my-canteens` - Get my canteens
- [x] `POST /api/canteen/:id/menu` - Add menu item
- [x] `PUT /api/canteen/menu/:id` - Update menu item
- [x] `GET /api/canteen/orders` - Get provider orders
- [x] `PUT /api/canteen/orders/:id/status` - Update order status

### Tenant Canteen Endpoints
- [x] `GET /api/canteen/:id/menu` - Get canteen menu
- [x] `POST /api/canteen/orders` - Create order
- [x] `POST /api/canteen/orders/verify-payment` - Verify payment
- [x] `GET /api/canteen/my-orders` - Get my orders

### Contract Endpoints
- [x] `POST /api/contract` - Create contract (owner)
- [x] `GET /api/contract/owner/contracts` - Get owner contracts
- [x] `GET /api/contract/:id` - Get contract details
- [x] `PUT /api/contract/:id/sign` - Sign contract
- [x] `POST /api/contract/:id/upload` - Upload document (owner)
- [x] `PUT /api/contract/:id/terminate` - Terminate contract

### Admin Endpoints
- [x] `GET /api/admin/users` - Get all users
- [x] `GET /api/admin/stats` - Get dashboard stats
- [x] `GET /api/admin/hostels` - Get all hostels
- [x] `PUT /api/admin/hostels/:id/verify` - Verify hostel
- [x] `PUT /api/admin/users/:id/toggle-status` - Toggle user status

---

## 🔑 Important Notes

1. **Authentication**: Most endpoints (except health check, register, login, and public menu) require a Bearer token in the Authorization header.

2. **User Roles**: Different roles have different access:
   - `tenant` - Can search hostels, track expenses, submit feedback
   - `owner` - Can manage hostels and rooms
   - `canteen_provider` - Can manage canteens and orders
   - `master_admin` - Full system access

3. **Testing Order**: 
   - Register users first
   - Login to get tokens
   - Test role-specific endpoints
   - Create relationships (hostels, rooms, contracts) in order

4. **Environment Variables**: Make sure your `.env` file has all required variables:
   - Database connection string
   - JWT secrets
   - Cloudinary credentials (for file uploads)
   - Razorpay keys (for payments)
   - Email/SMS credentials

---

## 🐛 Troubleshooting

**Server not starting?**
- Check if port 5000 is available
- Verify MongoDB is running
- Check .env file configuration

**401 Unauthorized errors?**
- Make sure you're sending the token in Authorization header
- Verify the token hasn't expired
- Login again to get a fresh token

**403 Forbidden errors?**
- Check user role matches the endpoint requirement
- Some endpoints require specific roles (e.g., owner, admin)

**404 Not Found?**
- Verify the endpoint URL is correct
- Check server is running on correct port

**File upload errors?**
- Ensure multipart/form-data content type
- Check Cloudinary configuration in .env

---

## 📊 Expected Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 📚 Additional Resources

- See `API_TESTING_GUIDE.md` for detailed endpoint documentation
- See `postman_collection_safestay.postman_collection.json` for Postman collection
- See source code in `routes/` and `controllers/` directories

