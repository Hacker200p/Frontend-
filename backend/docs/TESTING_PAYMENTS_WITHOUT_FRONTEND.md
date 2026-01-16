# Testing Razorpay Payments Without Frontend

Since you don't have the frontend active yet, here are three ways to test the payment endpoints:

---

## Method 1: Automated Test Script (Recommended)

Run the complete payment flow test:

```bash
node test-payment.js
```

**What it does:**
- ✅ Creates/logs in as a tenant
- ✅ Sets up a canteen and menu item
- ✅ Creates an order
- ✅ Generates a valid payment signature
- ✅ Verifies the payment
- ✅ Shows detailed colored output for each step

**Output:**
```
============================================================
  RAZORPAY PAYMENT FLOW TEST
============================================================

STEP 1: Login as Tenant
✓ Logged in successfully
Token: eyJhbGciOiJIUzI1NiI...

STEP 2: Setup Canteen & Menu
✓ Created new canteen
Canteen ID: 67423abc...
✓ Created menu item
Menu Item ID: 67423def...

STEP 3: Create Order
✓ Order created successfully
Order ID: 67423ghi...
Razorpay Order ID: order_ABC123XYZ
Amount: 300

STEP 4: Simulate Razorpay Payment
✓ Generated mock payment details
Payment ID: pay_1730123456abc
Signature: a1b2c3d4e5f6...

STEP 5: Verify Payment
✓ Payment verified successfully!
Order Status: confirmed
Payment Status: paid

============================================================
✓ PAYMENT TEST COMPLETED SUCCESSFULLY! 🎉
============================================================
```

---

## Method 2: Interactive Signature Generator

If you already have an order created and just need to generate a signature:

```bash
node generate-signature.js
```

**Interactive prompts:**
```
╔════════════════════════════════════════════════════╗
║     RAZORPAY PAYMENT SIGNATURE GENERATOR          ║
╚════════════════════════════════════════════════════╝

Enter Razorpay Order ID (from create order response): order_ABC123XYZ

Enter Payment ID (or press Enter to generate mock): 

────────────────────────────────────────────────────────
✅ Signature Generated Successfully!
────────────────────────────────────────────────────────

Use these values in your verify payment request:

{
  "orderId": "YOUR_ORDER_ID",
  "razorpayPaymentId": "pay_1730123456abc",
  "razorpaySignature": "a1b2c3d4e5f6..."
}

────────────────────────────────────────────────────────
```

Then copy the JSON and use it in Postman or curl.

---

## Method 3: Manual Testing with Postman/curl

### Step-by-Step Process:

#### 1. Register/Login as Tenant
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Test Tenant",
  "email": "tenant@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "tenant"
}
```

Save the `token` from response.

#### 2. Create a Canteen (as canteen_provider)
First, register as a provider, then:

```bash
POST http://localhost:5000/api/canteen
Authorization: Bearer PROVIDER_TOKEN

{
  "name": "Test Canteen",
  "description": "Test canteen",
  "location": "Building A",
  "openTime": "08:00",
  "closeTime": "20:00"
}
```

Save the `canteen._id`.

#### 3. Add Menu Item
```bash
POST http://localhost:5000/api/canteen/CANTEEN_ID/menu
Authorization: Bearer PROVIDER_TOKEN

{
  "name": "Biryani",
  "price": 150,
  "category": "main_course",
  "isAvailable": true
}
```

Save the `menuItem._id`.

#### 4. Create Order (as tenant)
```bash
POST http://localhost:5000/api/canteen/orders
Authorization: Bearer TENANT_TOKEN

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
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { "_id": "ORDER_ID", ... },
  "razorpayOrderId": "order_ABC123XYZ",  // ← Save this
  "razorpayKeyId": "rzp_test_xxx",
  "amount": 300
}
```

#### 5. Generate Signature

Create a quick Node.js script or use `generate-signature.js`:

```javascript
const crypto = require('crypto');

const razorpayOrderId = 'order_ABC123XYZ'; // From step 4
const razorpayPaymentId = 'pay_TEST123456'; // Mock ID
const razorpayKeySecret = 'your_key_secret'; // From .env

const sign = razorpayPaymentId + '|' + razorpayOrderId;
const signature = crypto
  .createHmac('sha256', razorpayKeySecret)
  .update(sign)
  .digest('hex');

console.log('Payment ID:', razorpayPaymentId);
console.log('Signature:', signature);
```

#### 6. Verify Payment
```bash
POST http://localhost:5000/api/canteen/orders/verify-payment
Authorization: Bearer TENANT_TOKEN

{
  "orderId": "ORDER_ID",
  "razorpayPaymentId": "pay_TEST123456",
  "razorpaySignature": "GENERATED_SIGNATURE"
}
```

**⚠️ CRITICAL - Common Mistake:**

The `orderId` field has TWO different IDs that look similar but serve different purposes:

| Field Name | Example Value | Where to Find | Used For |
|------------|---------------|---------------|----------|
| `orderId` | `67423abc123def...` | `data._id` in create order response | Verify Payment Request ✅ |
| `razorpayOrderId` | `order_RZeq99ZuwQV7WC` | `razorpayOrderId` in create order response | Generating Signature |

**From Create Order Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67423abc123def456789",  // ← USE THIS as orderId ✅
    "orderNumber": "ORD1730300000123",
    "razorpayOrderId": "order_RZeq99ZuwQV7WC"  // ← Use for signature generation
  },
  "razorpayOrderId": "order_RZeq99ZuwQV7WC"  // ← Use for signature generation
}
```

**Correct Verify Request:**
```json
{
  "orderId": "67423abc123def456789",        // ← MongoDB _id (NOT razorpayOrderId!)
  "razorpayPaymentId": "pay_TEST123456",
  "razorpaySignature": "a1b2c3d4..."
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "_id": "ORDER_ID",
    "orderStatus": "confirmed",
    "paymentStatus": "paid",
    "razorpayPaymentId": "pay_TEST123456"
  }
}
```

---

## Quick PowerShell Example

```powershell
# 1. Create order and save response
$orderResponse = Invoke-RestMethod -Uri http://localhost:5000/api/canteen/orders `
  -Method POST `
  -Headers @{Authorization="Bearer YOUR_TOKEN"; "Content-Type"="application/json"} `
  -Body '{"canteen":"CANTEEN_ID","items":[{"menuItem":"MENU_ITEM_ID","quantity":2}],"deliveryAddress":{"roomNumber":"101","floor":1}}'

# 2. Extract razorpay order ID
$razorpayOrderId = $orderResponse.razorpayOrderId
Write-Host "Razorpay Order ID: $razorpayOrderId"

# 3. Run signature generator
node generate-signature.js

# 4. Use the generated signature to verify payment
```

---

## Troubleshooting

### Error: "Payment service not configured"
**Solution:** Make sure your `.env` has:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxx
```

### Error: "Invalid payment signature"
**Causes:**
- Wrong `RAZORPAY_KEY_SECRET` in `.env`
- Incorrect order ID used in signature generation
- Payment ID and signature don't match

**Solution:** Use the `generate-signature.js` script to ensure correct signature.

### Error: "razorpayPaymentId and razorpaySignature are required"
**Solution:** Make sure you're sending both fields in the verify request.

---

## Understanding the Flow

```
┌─────────────────────────────────────────────────────────┐
│                   BACKEND TESTING FLOW                  │
└─────────────────────────────────────────────────────────┘

1. CREATE ORDER
   ↓
   Backend generates: razorpayOrderId
   
2. SIMULATE PAYMENT (your script)
   ↓
   Generate mock: razorpayPaymentId
   
3. GENERATE SIGNATURE (using crypto)
   ↓
   Formula: HMAC-SHA256(paymentId|orderId, secret)
   
4. VERIFY PAYMENT
   ↓
   Backend validates signature
   ↓
   Order marked as PAID ✅
```

**Note:** In production with a real frontend, steps 2-3 happen on Razorpay's servers and the frontend receives the payment details. For testing, we simulate those steps.

---

## Tips

1. **Use test-payment.js for full automation** - Best for quick testing
2. **Use generate-signature.js for manual testing** - Best when debugging specific orders
3. **Check server logs** - Look for payment verification messages
4. **Test error cases** - Try invalid signatures to ensure validation works
5. **Clean up test data** - Delete test orders/users from DB after testing

---

## Next Steps

Once you have a frontend:
1. Integrate Razorpay SDK in the frontend
2. Use the real `razorpayOrderId` from create order response
3. Open Razorpay checkout with that order ID
4. Razorpay will handle payment and return real payment_id/signature
5. Send those to your verify endpoint

The backend payment verification logic remains the same! 🚀
