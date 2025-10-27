# Manual Postman Testing Guide
## All Requests to Test in Postman

---

## 🔵 Step 1: Setup

### Create Environment Variables in Postman:
1. Click "Environments" → "Create Environment"
2. Add these variables:
   - `baseUrl` = `http://localhost:5000`
   - `token` = (leave empty, will be set after login)
   - `tenantToken` = (leave empty)
   - `ownerToken` = (leave empty)
   - `providerToken` = (leave empty)
   - `adminToken` = (leave empty)
   - `hostelId` = (leave empty)
   - `roomId` = (leave empty)
   - `canteenId` = (leave empty)
   - `menuItemId` = (leave empty)
   - `contractId` = (leave empty)
   - `orderId` = (leave empty)
   - `userId` = (leave empty)

---

## 🟢 PUBLIC ENDPOINTS (No Auth Required)

### 1. Health Check

**Method:** GET

**URL:** 
```
http://localhost:5000/api/health
```

**Headers:** None

**Body:** None

**Expected Response:**
```json
{
  "success": true,
  "message": "SafeStay Hub API is running"
}
```

---

## 🟡 AUTH ENDPOINTS

### 2. Register - Tenant

**Method:** POST

**URL:**
```
http://localhost:5000/api/auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "John Tenant",
  "email": "tenant@test.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "tenant"
}
```

**Response:** Save the `token` from response → Set `tenantToken` variable

---

### 3. Register - Owner

**Method:** POST

**URL:**
```
http://localhost:5000/api/auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Jane Owner",
  "email": "owner@test.com",
  "phone": "9876543211",
  "password": "password123",
  "role": "owner"
}
```

**Response:** Save the `token` from response → Set `ownerToken` variable

---

### 4. Register - Canteen Provider

**Method:** POST

**URL:**
```
http://localhost:5000/api/auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Bob Provider",
  "email": "provider@test.com",
  "phone": "9876543212",
  "password": "password123",
  "role": "canteen_provider"
}
```

**Response:** Save the `token` from response → Set `providerToken` variable

---

### 5. Register - Admin

**Method:** POST

**URL:**
```
http://localhost:5000/api/auth/register
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "name": "Admin User",
  "email": "admin@test.com",
  "phone": "9876543213",
  "password": "password123",
  "role": "master_admin"
}
```

**Response:** Save the `token` from response → Set `adminToken` variable

---

### 6. Login

**Method:** POST

**URL:**
```
http://localhost:5000/api/auth/login
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "tenant@test.com",
  "password": "password123"
}
```

**Response:** Save the `token` from response

---

### 7. Get Current User (Protected)

**Method:** GET

**URL:**
```
http://localhost:5000/api/auth/me
```

**Headers:**
```
Authorization: Bearer {{tenantToken}}
```

**Body:** None

---

### 8. Update Profile (Protected)

**Method:** PUT

**URL:**
```
http://localhost:5000/api/auth/profile
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{tenantToken}}
```

**Body (raw JSON):**
```json
{
  "name": "John Updated",
  "phone": "9999999999"
}
```

---

## 🟢 TENANT ENDPOINTS (Use tenantToken)

### 9. Search Hostels

**Method:** GET

**URL:**
```
http://localhost:5000/api/tenant/hostels/search?city=Mysore&hostelType=boys
```

**Headers:**
```
Authorization: Bearer {{tenantToken}}
```

**Body:** None

**Query Params:**
- `city` = Mysore
- `hostelType` = boys
- `minPrice` = 5000 (optional)
- `maxPrice` = 8000 (optional)

---

### 10. Get Hostel Details

**Method:** GET

**URL:**
```
http://localhost:5000/api/tenant/hostels/{{hostelId}}
```

**Headers:**
```
Authorization: Bearer {{tenantToken}}
```

**Body:** None

---

### 11. Get My Expenses

**Method:** GET

**URL:**
```
http://localhost:5000/api/tenant/expenses
```

**Headers:**
```
Authorization: Bearer {{tenantToken}}
```

**Body:** None

---

### 12. Add Expense

**Method:** POST

**URL:**
```
http://localhost:5000/api/tenant/expenses
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{tenantToken}}
```

**Body (raw JSON):**
```json
{
  "amount": 1500,
  "category": "food",
  "description": "Monthly groceries",
  "date": "2025-01-15"
}
```

---

### 13. Submit Feedback

**Method:** POST

**URL:**
```
http://localhost:5000/api/tenant/feedback
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{tenantToken}}
```

**Body (raw JSON):**
```json
{
  "hostel": "{{hostelId}}",
  "rating": 4,
  "comment": "Great facilities and friendly staff"
}
```

---

### 14. Get My Contracts

**Method:** GET

**URL:**
```
http://localhost:5000/api/tenant/contracts
```

**Headers:**
```
Authorization: Bearer {{tenantToken}}
```

**Body:** None

---

## 🟢 OWNER ENDPOINTS (Use ownerToken)

### 15. Create Hostel

**Method:** POST

**URL:**
```
http://localhost:5000/api/owner/hostels
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{ownerToken}}
```

**Body (raw JSON):**
```json
{
  "name": "Green Valley PG",
  "address": {
    "street": "123 Main St",
    "city": "Mysore",
    "state": "Karnataka",
    "pincode": "570001"
  },
  "description": "Comfortable PG with all amenities",
  "hostelType": "boys",
  "amenities": ["WiFi", "AC", "Laundry", "Parking"],
  "priceRange": {
    "min": 5000,
    "max": 8000
  }
}
```

**Response:** Save `_id` from response → Set `hostelId` variable

---

### 16. Get My Hostels

**Method:** GET

**URL:**
```
http://localhost:5000/api/owner/hostels
```

**Headers:**
```
Authorization: Bearer {{ownerToken}}
```

**Body:** None

---

### 17. Update Hostel

**Method:** PUT

**URL:**
```
http://localhost:5000/api/owner/hostels/{{hostelId}}
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{ownerToken}}
```

**Body (raw JSON):**
```json
{
  "name": "Updated Hostel Name",
  "description": "Updated description with better amenities"
}
```

---

### 18. Upload Hostel Media

**Method:** POST

**URL:**
```
http://localhost:5000/api/owner/hostels/{{hostelId}}/upload
```

**Headers:**
```
Authorization: Bearer {{ownerToken}}
```

**Body (form-data):**
- Key: `files`
- Type: File
- Value: Select image files (can upload up to 10 files)

---

### 19. Create Room

**Method:** POST

**URL:**
```
http://localhost:5000/api/owner/hostels/{{hostelId}}/rooms
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{ownerToken}}
```

**Body (raw JSON):**
```json
{
  "roomNumber": "101",
  "roomType": "single",
  "floor": 1,
  "capacity": 2,
  "rent": 6500,
  "amenities": ["WiFi", "AC", "Attached Bathroom"]
}
```

**Response:** Save `_id` from response → Set `roomId` variable

---

### 20. Get Hostel Rooms

**Method:** GET

**URL:**
```
http://localhost:5000/api/owner/hostels/{{hostelId}}/rooms
```

**Headers:**
```
Authorization: Bearer {{ownerToken}}
```

**Body:** None

---

### 21. Update Room

**Method:** PUT

**URL:**
```
http://localhost:5000/api/owner/rooms/{{roomId}}
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{ownerToken}}
```

**Body (raw JSON):**
```json
{
  "capacity": 3,
  "rent": 7000,
  "available": true
}
```

---

## 🟢 CANTEEN PROVIDER ENDPOINTS (Use providerToken)

### 22. Create Canteen

**Method:** POST

**URL:**
```
http://localhost:5000/api/canteen
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{providerToken}}
```

**Body (raw JSON):**
```json
{
  "name": "Central Mess",
  "description": "Healthy meals all day long",
  "location": "Building A, Ground Floor",
  "openTime": "07:00",
  "closeTime": "22:00"
}
```

**Response:** Save `_id` from response → Set `canteenId` variable

---

### 23. Get My Canteens

**Method:** GET

**URL:**
```
http://localhost:5000/api/canteen/my-canteens
```

**Headers:**
```
Authorization: Bearer {{providerToken}}
```

**Body:** None

---

### 24. Add Menu Item

**Method:** POST

**URL:**
```
http://localhost:5000/api/canteen/{{canteenId}}/menu
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{providerToken}}
```

**Body (raw JSON):**
```json
{
  "name": "Biryani",
  "description": "Special chicken biryani",
  "price": 150,
  "category": "main_course",
  "available": true
}
```

**Response:** Save `_id` from response → Set `menuItemId` variable

---

### 25. Update Menu Item

**Method:** PUT

**URL:**
```
http://localhost:5000/api/canteen/menu/{{menuItemId}}
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{providerToken}}
```

**Body (raw JSON):**
```json
{
  "price": 160,
  "available": true
}
```

---

### 26. Get Provider Orders

**Method:** GET

**URL:**
```
http://localhost:5000/api/canteen/orders
```

**Headers:**
```
Authorization: Bearer {{providerToken}}
```

**Body:** None

---

### 27. Update Order Status

**Method:** PUT

**URL:**
```
http://localhost:5000/api/canteen/orders/{{orderId}}/status
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{providerToken}}
```

**Body (raw JSON):**
```json
{
  "status": "preparing"
}
```

**Status values:** `pending`, `preparing`, `ready`, `delivered`, `cancelled`

---

## 🟢 CANTEEN (Tenant) ENDPOINTS (Use tenantToken)

### 28. Get Canteen Menu (Public)

**Method:** GET

**URL:**
```
http://localhost:5000/api/canteen/{{canteenId}}/menu
```

**Headers:** None

**Body:** None

---

### 29. Create Order

**Method:** POST

**URL:**
```
http://localhost:5000/api/canteen/orders
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{tenantToken}}
```

**Body (raw JSON):**
```json
{
  "canteen": "{{canteenId}}",
  "items": [
    {
      "menuItem": "{{menuItemId}}",
      "quantity": 2
    }
  ],
  "deliveryAddress": {
    "roomNumber": "101",
    "floor": 1
  },
  "specialInstructions": "Leave at gate if not available"
}
```

**Response:** Save `_id` from response → Set `orderId` variable

---

### 30. Verify Payment

**Method:** POST

**URL:**
```
http://localhost:5000/api/canteen/orders/verify-payment
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{tenantToken}}
```

**Body (raw JSON):**
```json
{
  "orderId": "{{orderId}}",
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

---

### 31. Get My Orders (Tenant)

**Method:** GET

**URL:**
```
http://localhost:5000/api/canteen/my-orders
```

**Headers:**
```
Authorization: Bearer {{tenantToken}}
```

**Body:** None

---

## 🟢 CONTRACT ENDPOINTS

### 32. Create Contract (Owner)

**Method:** POST

**URL:**
```
http://localhost:5000/api/contract
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{ownerToken}}
```

**Body (raw JSON):**
```json
{
  "tenant": "{{userId}}",
  "hostel": "{{hostelId}}",
  "room": "{{roomId}}",
  "startDate": "2025-02-01",
  "endDate": "2026-01-31",
  "monthlyRent": 7000,
  "securityDeposit": 14000,
  "terms": [
    {
      "clause": "Payment",
      "description": "Rent due on 1st of every month"
    },
    {
      "clause": "Utilities",
      "description": "Water and electricity included"
    }
  ]
}
```

**Response:** Save `_id` from response → Set `contractId` variable

---

### 33. Get Owner Contracts

**Method:** GET

**URL:**
```
http://localhost:5000/api/contract/owner/contracts
```

**Headers:**
```
Authorization: Bearer {{ownerToken}}
```

**Body:** None

---

### 34. Get Contract Details

**Method:** GET

**URL:**
```
http://localhost:5000/api/contract/{{contractId}}
```

**Headers:**
```
Authorization: Bearer {{ownerToken}}
```

**Body:** None

---

### 35. Sign Contract

**Method:** PUT

**URL:**
```
http://localhost:5000/api/contract/{{contractId}}/sign
```

**Headers:**
```
Authorization: Bearer {{tenantToken}}
```

**Body:** None

---

### 36. Upload Contract Document (Owner)

**Method:** POST

**URL:**
```
http://localhost:5000/api/contract/{{contractId}}/upload
```

**Headers:**
```
Authorization: Bearer {{ownerToken}}
```

**Body (form-data):**
- Key: `document`
- Type: File
- Value: Select PDF/document file

---

### 37. Terminate Contract

**Method:** PUT

**URL:**
```
http://localhost:5000/api/contract/{{contractId}}/terminate
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{ownerToken}}
```

**Body (raw JSON):**
```json
{
  "reason": "Violation of contract terms"
}
```

---

## 🟢 ADMIN ENDPOINTS (Use adminToken)

### 38. Get All Users

**Method:** GET

**URL:**
```
http://localhost:5000/api/admin/users
```

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Body:** None

---

### 39. Get Dashboard Stats

**Method:** GET

**URL:**
```
http://localhost:5000/api/admin/stats
```

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Body:** None

---

### 40. Get All Hostels

**Method:** GET

**URL:**
```
http://localhost:5000/api/admin/hostels
```

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Body:** None

---

### 41. Verify Hostel

**Method:** PUT

**URL:**
```
http://localhost:5000/api/admin/hostels/{{hostelId}}/verify
```

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Body:** None

---

### 42. Toggle User Status

**Method:** PUT

**URL:**
```
http://localhost:5000/api/admin/users/{{userId}}/toggle-status
```

**Headers:**
```
Authorization: Bearer {{adminToken}}
```

**Body:** None

---

## 📝 How to Save Variables in Postman

### In "Tests" Tab, add these scripts:

**After Login:**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("tenantToken", jsonData.token);
}
```

**After Creating Hostel:**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("hostelId", jsonData._id);
}
```

**After Creating Canteen:**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("canteenId", jsonData._id);
}
```

**After Creating Room:**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("roomId", jsonData._id);
}
```

**After Creating Order:**
```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("orderId", jsonData._id);
}
```

---

## ✅ Testing Order

1. Test Health Check
2. Register all users (tenant, owner, provider, admin)
3. Login to get tokens
4. Owner: Create hostel → Create rooms
5. Provider: Create canteen → Add menu items
6. Tenant: Search hostels → Create expenses → Submit feedback
7. Owner: Create contract
8. Tenant: Sign contract
9. Tenant: Create order
10. Provider: Update order status
11. Admin: View stats → Verify hostels

---

## 🎯 Expected Response Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden
- **404** - Not Found
- **500** - Server Error

---

## 💡 Tips

1. **Copy & Paste:** Use Ctrl+C/V for easy copying of requests
2. **Collections:** Create folders for better organization
3. **Variables:** Use `{{variableName}}` syntax in URLs
4. **Environment:** Make sure correct environment is selected
5. **Order:** Follow the testing order for dependencies

---

Happy Testing! 🚀

