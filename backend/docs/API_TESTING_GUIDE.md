# API Testing Guide - SafeStay Hub

## Base URL
```
http://localhost:5000
```

## Testing Steps Overview

### Prerequisites
1. Make sure the server is running: `npm start` or `node server.js`
2. Have Postman or any API testing tool ready
3. Use the provided Postman collection or follow the manual steps below

---

## Step 1: Health Check

**Endpoint:** `GET /api/health`

**Request:**
```bash
GET http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "SafeStay Hub API is running"
}
```

---

## Step 2: Auth Endpoints

### 2.1 Register (No Auth Required)

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
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

**Available Roles:** `tenant`, `owner`, `canteen_provider`, `master_admin`

**Action:** Save the token and user ID from response.

**Common validation errors**

- The API validates input and will return HTTP 400 with an `errors` array when a field is missing or invalid. Typical causes:
  - Missing `name`, `email`, `phone`, `password`, or `role`.
  - `email` is not a valid email address string.
  - `phone` must be exactly 10 digits (e.g., `9876543210`).
  - `password` must be at least 6 characters.
  - `role` must be one of `master_admin`, `owner`, `canteen_provider`, or `tenant`.

If you get a 400 response, inspect the JSON body — it will look like:

```json
{
  "success": false,
  "errors": [
    { "msg": "Valid email is required", "param": "email", "location": "body" },
    { "msg": "Valid 10-digit phone number is required", "param": "phone", "location": "body" }
  ]
}
```

Make sure your request includes all required fields and that `Content-Type: application/json` is set.

---

### 2.2 Login (No Auth Required)

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Action:** Save the token from response (e.g., `eyJhbGc...`)

---

### 2.3 Get Current User (Protected)

**Endpoint:** `GET /api/auth/me`

**Request:**
```bash
GET http://localhost:5000/api/auth/me
Authorization: Bearer YOUR_TOKEN
```

---

### 2.4 Update Profile (Protected)

**Endpoint:** `PUT /api/auth/profile`

**Request:**
```json
PUT http://localhost:5000/api/auth/profile
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "9999999999"
}
```

---

## Step 3: Tenant Endpoints

**Note:** Login as a tenant first using Step 2.2 with `"role": "tenant"`

### 3.1 Search Hostels (Protected)

**Endpoint:** `GET /api/tenant/hostels/search`

**Request:**
```bash
GET http://localhost:5000/api/tenant/hostels/search?city=Mysore&hostelType=boys
Authorization: Bearer TENANT_TOKEN
```

**Query Parameters:**
- `city`: String
- `hostelType`: String (e.g., "boys", "girls")
- `minPrice`: Number
- `maxPrice`: Number

---

### 3.2 Get Hostel Details (Protected)

**Endpoint:** `GET /api/tenant/hostels/:hostelId`

**Request:**
```bash
GET http://localhost:5000/api/tenant/hostels/HOSTEL_ID
Authorization: Bearer TENANT_TOKEN
```

---

### 3.3 Get My Expenses (Protected)

**Endpoint:** `GET /api/tenant/expenses`

**Request:**
```bash
GET http://localhost:5000/api/tenant/expenses
Authorization: Bearer TENANT_TOKEN
```

---

### 3.4 Add Expense (Protected)

**Endpoint:** `POST /api/tenant/expenses`

**Request:**
```json
POST http://localhost:5000/api/tenant/expenses
Authorization: Bearer TENANT_TOKEN
Content-Type: application/json

{
  "amount": 1500,
  "category": "food",
  "description": "Monthly groceries",
  "date": "2025-01-15"
}
```

---

### 3.5 Submit Feedback (Protected)

**Endpoint:** `POST /api/tenant/feedback`

**Request:**
```json
POST http://localhost:5000/api/tenant/feedback
Authorization: Bearer TENANT_TOKEN
Content-Type: application/json

{
  "hostel": "HOSTEL_ID",
  "rating": 4,
  "comment": "Great facilities and friendly staff"
}
```

---

### 3.6 Get My Contracts (Protected)

**Endpoint:** `GET /api/tenant/contracts`

**Request:**
```bash
GET http://localhost:5000/api/tenant/contracts
Authorization: Bearer TENANT_TOKEN
```

---

## Step 4: Owner Endpoints

**Note:** Login as an owner first using Step 2.2 with `"role": "owner"`

### 4.1 Create Hostel (Protected)

**Endpoint:** `POST /api/owner/hostels`

**Request:**
```json
POST http://localhost:5000/api/owner/hostels
Authorization: Bearer OWNER_TOKEN
Content-Type: application/json

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
  "amenities": ["WiFi", "AC", "Laundry"],
  "priceRange": {
    "min": 5000,
    "max": 8000
  }
}
```

**Action:** Save the `hostelId` from response.

---

### 4.2 Get My Hostels (Protected)

**Endpoint:** `GET /api/owner/hostels`

**Request:**
```bash
GET http://localhost:5000/api/owner/hostels
Authorization: Bearer OWNER_TOKEN
```

---

### 4.3 Update Hostel (Protected)

**Endpoint:** `PUT /api/owner/hostels/:id`

**Request:**
```json
PUT http://localhost:5000/api/owner/hostels/HOSTEL_ID
Authorization: Bearer OWNER_TOKEN
Content-Type: application/json

{
  "name": "Updated Hostel Name",
  "description": "Updated description"
}
```

---

### 4.4 Upload Hostel Media (Protected)

**Endpoint:** `POST /api/owner/hostels/:id/upload`

**Request:**
```
POST http://localhost:5000/api/owner/hostels/HOSTEL_ID/upload
Authorization: Bearer OWNER_TOKEN
Content-Type: multipart/form-data

files: [FILE1, FILE2, ...] (max 10 files)
```

---

### 4.5 Create Room (Protected)

**Endpoint:** `POST /api/owner/hostels/:id/rooms`

**Request:**
```json
POST http://localhost:5000/api/owner/hostels/HOSTEL_ID/rooms
Authorization: Bearer OWNER_TOKEN
Content-Type: application/json

{
  "roomNumber": "101",
  "roomType": "single",
  "floor": 1,
  "capacity": 2,
  "rent": 6500,
  "amenities": ["WiFi", "AC", "Attached Bathroom"]
}
```

---

### 4.6 Get Hostel Rooms (Protected)

**Endpoint:** `GET /api/owner/hostels/:id/rooms`

**Request:**
```bash
GET http://localhost:5000/api/owner/hostels/HOSTEL_ID/rooms
Authorization: Bearer OWNER_TOKEN
```

---

### 4.7 Update Room (Protected)

**Endpoint:** `PUT /api/owner/rooms/:id`

**Request:**
```json
PUT http://localhost:5000/api/owner/rooms/ROOM_ID
Authorization: Bearer OWNER_TOKEN
Content-Type: application/json

{
  "capacity": 3,
  "rent": 7000
}
```

---

## Step 5: Canteen Endpoints

### 5.1 Provider Endpoints

**Note:** Login as canteen_provider first.

#### 5.1.1 Create Canteen (Protected)

**Endpoint:** `POST /api/canteen`

**Request:**
```json
POST http://localhost:5000/api/canteen
Authorization: Bearer CANTEEN_PROVIDER_TOKEN
Content-Type: application/json

{
  "name": "Central Mess",
  "description": "Healthy meals all day",
  "location": "Building A, Ground Floor",
  "openTime": "07:00",
  "closeTime": "22:00"
}
```

---

#### 5.1.2 Get My Canteens (Protected)

**Endpoint:** `GET /api/canteen/my-canteens`

**Request:**
```bash
GET http://localhost:5000/api/canteen/my-canteens
Authorization: Bearer CANTEEN_PROVIDER_TOKEN
```

---

#### 5.1.3 Add Menu Item (Protected)

**Endpoint:** `POST /api/canteen/:id/menu`

**Request:**
```json
POST http://localhost:5000/api/canteen/CANTEEN_ID/menu
Authorization: Bearer CANTEEN_PROVIDER_TOKEN
Content-Type: application/json

{
  "name": "Biryani",
  "description": "Special chicken biryani",
  "price": 150,
  "category": "main_course",
  "available": true
}
```

---

#### 5.1.4 Update Menu Item (Protected)

**Endpoint:** `PUT /api/canteen/menu/:id`

**Request:**
```json
PUT http://localhost:5000/api/canteen/menu/MENU_ITEM_ID
Authorization: Bearer CANTEEN_PROVIDER_TOKEN
Content-Type: application/json

{
  "price": 160,
  "available": true
}
```

---

#### 5.1.5 Get Provider Orders (Protected)

**Endpoint:** `GET /api/canteen/orders`

**Request:**
```bash
GET http://localhost:5000/api/canteen/orders
Authorization: Bearer CANTEEN_PROVIDER_TOKEN
```

---

#### 5.1.6 Update Order Status (Protected)

**Endpoint:** `PUT /api/canteen/orders/:id/status`

**Request:**
```json
PUT http://localhost:5000/api/canteen/orders/ORDER_ID/status
Authorization: Bearer CANTEEN_PROVIDER_TOKEN
Content-Type: application/json

{
  "status": "preparing"
}
```

**Status values:** `pending`, `preparing`, `ready`, `delivered`, `cancelled`

---

### 5.2 Tenant Canteen Endpoints

#### 5.2.1 Get Canteen Menu (Public/Tenant)

**Endpoint:** `GET /api/canteen/:id/menu`

**Request:**
```bash
GET http://localhost:5000/api/canteen/CANTEEN_ID/menu
```

---

#### 5.2.2 Create Order (Protected - Tenant)

**Endpoint:** `POST /api/canteen/orders`

**Request:**
```json
POST http://localhost:5000/api/canteen/orders
Authorization: Bearer TENANT_TOKEN
Content-Type: application/json

{
  "canteen": "CANTEEN_ID",
  "items": [
    {
      "menuItem": "MENU_ITEM_ID",
      "quantity": 2
    }
  ],
  "deliveryAddress": {
    "roomNumber": "101",
    "floor": 1
  },
  "specialInstructions": "Leave at gate"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "ORDER_ID",
    "orderNumber": "ORD1730300000123",
    "totalAmount": 300,
    "orderStatus": "pending",
    "paymentStatus": "pending",
    "razorpayOrderId": "order_ABC123XYZ"
  },
  "razorpayOrderId": "order_ABC123XYZ",
  "razorpayKeyId": "rzp_test_xxxxxxxxxxxx",
  "amount": 300,
  "currency": "INR"
}
```

**Important - Payment Flow:**

The response does NOT include `razorpay_payment_id` or `razorpay_signature` because those are only generated AFTER the user completes payment. Here's the complete flow:

1. **Create Order (this endpoint)** → Get `razorpayOrderId` and `razorpayKeyId`
2. **Frontend** → Use the `razorpayOrderId` and `razorpayKeyId` to initialize Razorpay checkout
3. **User pays** → Razorpay returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature` to your frontend
4. **Verify Payment** → Send those values to the verify-payment endpoint (5.2.3 below)

**Note:** Razorpay credentials must be configured in `.env` for orders to work. If not configured, you'll get a 503 error.

---

#### 5.2.3 Verify Payment (Protected - Tenant)

**Endpoint:** `POST /api/canteen/orders/verify-payment`

**Request:**
```json
POST http://localhost:5000/api/canteen/orders/verify-payment
Authorization: Bearer TENANT_TOKEN
Content-Type: application/json

{
  "orderId": "ORDER_ID",
  "razorpayPaymentId": "pay_ABC123XYZ",
  "razorpaySignature": "signature_from_razorpay_response"
}
```

**IMPORTANT - Field Definitions:**
- `orderId` → MongoDB `_id` from the order (found in `data._id` of create order response)
- `razorpayPaymentId` → Payment ID from Razorpay after user pays
- `razorpaySignature` → Signature from Razorpay after user pays

**Common Mistake:**
❌ DO NOT use `razorpayOrderId` (e.g., `order_ABC123`) as the `orderId`
✅ USE the MongoDB `_id` (e.g., `67423abc123def...`) as the `orderId`

**Example Values:**
```json
{
  "orderId": "67423abc123def456789",           // ← MongoDB _id
  "razorpayPaymentId": "pay_TEST123456",       // ← From Razorpay
  "razorpaySignature": "a1b2c3d4e5f6..."      // ← Generated signature
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "_id": "ORDER_ID",
    "orderNumber": "ORD1730300000123",
    "orderStatus": "confirmed",
    "paymentStatus": "paid",
    "razorpayPaymentId": "pay_ABC123XYZ"
  }
}
```

**Note:** The `razorpayPaymentId` and `razorpaySignature` come from Razorpay's frontend SDK after the user completes payment, NOT from the create order response.

**Testing without Frontend:**

Since you don't have a frontend yet, you need to manually generate the payment signature. Here's how:

1. **Create an order** (Step 5.2.2) and save BOTH IDs:
   - `data._id` → Use this as `orderId` in verify payment ✅
   - `razorpayOrderId` → Use this to generate the signature

2. **Generate a mock payment ID**: `pay_` + any random string (e.g., `pay_ABC123XYZ`)

3. **Generate the signature** using the `razorpayOrderId` (NOT the MongoDB _id):

```javascript
const crypto = require('crypto');

const razorpayOrderId = 'order_ABC123XYZ'; // From create order response
const razorpayPaymentId = 'pay_TEST123456'; // Mock payment ID
const razorpayKeySecret = 'your_razorpay_key_secret'; // From .env

const sign = razorpayPaymentId + '|' + razorpayOrderId;
const signature = crypto
  .createHmac('sha256', razorpayKeySecret)
  .update(sign.toString())
  .digest('hex');

console.log('Payment ID:', razorpayPaymentId);
console.log('Signature:', signature);
```

4. **Use the generated values** in the verify payment request with the MongoDB `orderId`

**Automated Testing:**

Run the provided test script:
```bash
node test-payment.js
```

This script automatically:
- Creates a tenant user
- Sets up a canteen and menu item
- Creates an order
- Generates a valid payment signature
- Verifies the payment

---

#### 5.2.4 Get My Orders (Protected - Tenant)

**Endpoint:** `GET /api/canteen/my-orders`

**Request:**
```bash
GET http://localhost:5000/api/canteen/my-orders
Authorization: Bearer TENANT_TOKEN
```

---

## Step 6: Contract Endpoints

### 6.1 Create Contract (Owner)

**Endpoint:** `POST /api/contract`

**Request:**
```json
POST http://localhost:5000/api/contract
Authorization: Bearer OWNER_TOKEN
Content-Type: application/json

{
  "tenant": "TENANT_USER_ID",
  "hostel": "HOSTEL_ID",
  "room": "ROOM_ID",
  "startDate": "2025-11-01",
  "endDate": "2026-10-31",
  "monthlyRent": 7000,
  "securityDeposit": 14000,
  "terms": [
    {
      "clause": "Payment",
      "description": "Rent due on 1st of every month"
    }
  ]
}
```

---

### 6.2 Get Owner Contracts (Protected)

**Endpoint:** `GET /api/contract/owner/contracts`

**Request:**
```bash
GET http://localhost:5000/api/contract/owner/contracts
Authorization: Bearer OWNER_TOKEN
```

---

### 6.3 Get Contract Details (Protected)

**Endpoint:** `GET /api/contract/:id`

**Request:**
```bash
GET http://localhost:5000/api/contract/CONTRACT_ID
Authorization: Bearer YOUR_TOKEN
```

---

### 6.4 Sign Contract (Protected)

**Endpoint:** `PUT /api/contract/:id/sign`

**Request:**
```bash
PUT http://localhost:5000/api/contract/CONTRACT_ID/sign
Authorization: Bearer TENANT_OR_OWNER_TOKEN
```

---

### 6.5 Upload Contract Document (Owner)

**Endpoint:** `POST /api/contract/:id/upload`

**Request:**
```
POST http://localhost:5000/api/contract/CONTRACT_ID/upload
Authorization: Bearer OWNER_TOKEN
Content-Type: multipart/form-data

document: FILE
```

---

### 6.6 Terminate Contract (Owner/Admin)

**Endpoint:** `PUT /api/contract/:id/terminate`

**Request:**
```json
PUT http://localhost:5000/api/contract/CONTRACT_ID/terminate
Authorization: Bearer OWNER_OR_ADMIN_TOKEN
Content-Type: application/json

{
  "reason": "Violation of terms"
}
```

---

## Step 7: Admin Endpoints

**Note:** Login as master_admin first.

### 7.1 Get All Users (Admin)

**Endpoint:** `GET /api/admin/users`

**Request:**
```bash
GET http://localhost:5000/api/admin/users
Authorization: Bearer ADMIN_TOKEN
```

---

### 7.2 Get Dashboard Stats (Admin)

**Endpoint:** `GET /api/admin/stats`

**Request:**
```bash
GET http://localhost:5000/api/admin/stats
Authorization: Bearer ADMIN_TOKEN
```

---

### 7.3 Get All Hostels (Admin)

**Endpoint:** `GET /api/admin/hostels`

**Request:**
```bash
GET http://localhost:5000/api/admin/hostels
Authorization: BearER ADMIN_TOKEN
```

---

### 7.4 Verify Hostel (Admin)

**Endpoint:** `PUT /api/admin/hostels/:id/verify`

**Request:**
```bash
PUT http://localhost:5000/api/admin/hostels/HOSTEL_ID/verify
Authorization: Bearer ADMIN_TOKEN
```

---

### 7.5 Toggle User Status (Admin)

**Endpoint:** `PUT /api/admin/users/:id/toggle-status`

**Request:**
```bash
PUT http://localhost:5000/api/admin/users/USER_ID/toggle-status
Authorization: Bearer ADMIN_TOKEN
```

---

## Testing Workflow Recommendations

### For Complete Testing:

1. **Start with Health Check**
   - Verify server is running

2. **Test Auth Flow**
   - Register users for each role
   - Login and save tokens

3. **Test Tenant Flow**
   - Search hostels
   - View hostel details
   - Track expenses
   - Submit feedback

4. **Test Owner Flow**
   - Create hostel
   - Add rooms
   - View hostels and rooms

5. **Test Canteen Flow**
   - Provider: Create canteen, add menu items
   - Tenant: Browse menu, create orders
   - Provider: Update order status

6. **Test Contract Flow**
   - Owner: Create contract
   - Tenant: Sign contract
   - Both: View contracts

7. **Test Admin Flow**
   - View stats
   - Manage users
   - Verify hostels

---

## Postman Collection Usage

The project includes `postman_collection_safestay.postman_collection.json`.

### To use in Postman:

1. Import the collection file into Postman
2. Set up environment variables:
   - `baseUrl`: `http://localhost:5000`
   - `token`: (Will be set after login)
   - `hostelId`, `roomId`, `canteenId`, etc.
3. Execute requests in sequence
4. Use "Set Variable" tests to auto-save tokens and IDs

---

## Quick Test Checklist

- [ ] Health check works
- [ ] Registration works for all roles
- [ ] Login returns valid token
- [ ] Protected routes require authentication
- [ ] Owner can create and manage hostels
- [ ] Tenant can search and view hostels
- [ ] Canteen provider can manage canteen
- [ ] Tenant can place orders
- [ ] Contracts can be created and signed
- [ ] Admin can access admin endpoints
- [ ] File uploads work
- [ ] Error handling works for invalid requests

