# Payment Flow Guide - SafeStay Hub

## Understanding Order Creation & Payment with Razorpay

### The Complete Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ORDER & PAYMENT FLOW                     │
└─────────────────────────────────────────────────────────────┘

Step 1: CREATE ORDER (Backend)
   POST /api/canteen/orders
   ↓
   Returns: { razorpayOrderId, razorpayKeyId, amount, data: {...} }
   
Step 2: INITIALIZE PAYMENT (Frontend)
   Use Razorpay SDK with razorpayOrderId + razorpayKeyId
   ↓
   User completes payment
   ↓
   Razorpay returns: {
     razorpay_payment_id,
     razorpay_order_id,
     razorpay_signature
   }
   
Step 3: VERIFY PAYMENT (Backend)
   POST /api/canteen/orders/verify-payment
   Body: { orderId, razorpayPaymentId, razorpaySignature }
   ↓
   Backend verifies signature
   ↓
   Order status updated to 'paid' and 'confirmed'
```

---

## Why Payment ID & Signature Are NOT in Create Order Response

**Common Confusion:** Expecting `razorpay_payment_id` and `razorpay_signature` in the create order response.

**Reality:** These values are only generated AFTER the user pays on the frontend using Razorpay's checkout.

### What You Get at Each Step:

#### Step 1: Create Order Response
```json
{
  "success": true,
  "data": {
    "_id": "67423abc...",
    "orderNumber": "ORD1730300000123",
    "totalAmount": 300,
    "orderStatus": "pending",
    "paymentStatus": "pending",
    "razorpayOrderId": "order_ABC123XYZ"  // ✅ This is generated
  },
  "razorpayOrderId": "order_ABC123XYZ",    // ✅ Use this in frontend
  "razorpayKeyId": "rzp_test_xxxxxx",      // ✅ Use this in frontend
  "amount": 300,
  "currency": "INR"
}
```

**Note:** No `razorpay_payment_id` or `razorpay_signature` yet!

#### Step 2: Frontend Payment (Razorpay SDK)

```javascript
// Frontend code example (React/vanilla JS)
const options = {
  key: razorpayKeyId,                    // From create order response
  amount: amount * 100,                  // In paise
  currency: 'INR',
  order_id: razorpayOrderId,             // From create order response
  name: 'SafeStay Canteen',
  description: 'Food Order Payment',
  handler: function (response) {
    // ✅ NOW you get payment_id and signature
    console.log(response.razorpay_payment_id);
    console.log(response.razorpay_order_id);
    console.log(response.razorpay_signature);
    
    // Send these to verify endpoint
    verifyPayment(orderId, response);
  },
  prefill: {
    name: 'User Name',
    email: 'user@example.com',
    contact: '9999999999'
  },
  theme: {
    color: '#3399cc'
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

#### Step 3: Verify Payment Request
```json
POST /api/canteen/orders/verify-payment

{
  "orderId": "67423abc...",
  "razorpayPaymentId": "pay_ABC123XYZ",      // From Razorpay handler
  "razorpaySignature": "signature_string"    // From Razorpay handler
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "_id": "67423abc...",
    "orderStatus": "confirmed",
    "paymentStatus": "paid",
    "razorpayPaymentId": "pay_ABC123XYZ"
  }
}
```

---

## Configuring Razorpay (Required)

Razorpay configuration is **required** for the payment system to work.

### Setup Steps:

1. Sign up at https://razorpay.com/
2. Get your test/live API keys from the dashboard
3. Add to `backend/.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxx
   ```
4. Restart the server
5. You should see: `Razorpay initialized successfully`

### If Not Configured:

If Razorpay credentials are not set, order creation will fail with:
```json
{
  "success": false,
  "message": "Payment service not configured. Please contact administrator."
}
```

---

## Common Errors

### Error: "Payment service not configured"
**Cause:** Razorpay credentials are missing from `.env`
**Solution:** Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to your `.env` file

### Error: "razorpayPaymentId and razorpaySignature are required"
**Cause:** You didn't send payment details to the verify endpoint
**Solution:** Ensure your frontend sends both fields from Razorpay's response

### Error: "Invalid payment signature"
**Cause:** The signature verification failed
**Solution:** 
- Check that `RAZORPAY_KEY_SECRET` in `.env` matches your Razorpay account
- Ensure you're sending the exact signature from Razorpay's response
- Verify the payment was made to the correct Razorpay account

### Error: "Payment already verified"
**Cause:** Attempting to verify the same order multiple times
**Solution:** Check order status before attempting verification

### Error: "Invalid order - no Razorpay order ID found"
**Cause:** The order was not created with Razorpay
**Solution:** Ensure the order was created successfully before attempting payment

---

## Frontend Integration Example

### Complete React Example:

```javascript
import axios from 'axios';

const createAndPayOrder = async (orderData, token) => {
  try {
    // Step 1: Create order
    const response = await axios.post(
      'http://localhost:5000/api/canteen/orders',
      orderData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { razorpayOrderId, razorpayKeyId, amount, data } = response.data;

    // Step 2: Initialize Razorpay
    const options = {
      key: razorpayKeyId,
      amount: amount * 100,
      currency: 'INR',
      order_id: razorpayOrderId,
      name: 'SafeStay Canteen',
      description: `Order #${data.orderNumber}`,
      handler: async function (razorpayResponse) {
        // Step 3: Verify payment
        try {
          const verifyResponse = await axios.post(
            'http://localhost:5000/api/canteen/orders/verify-payment',
            {
              orderId: data._id,
              razorpayPaymentId: razorpayResponse.razorpay_payment_id,
              razorpaySignature: razorpayResponse.razorpay_signature
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('Payment verified:', verifyResponse.data);
          alert('Payment successful!');
        } catch (error) {
          console.error('Verification failed:', error);
          alert('Payment verification failed');
        }
      },
      prefill: {
        name: 'User Name',
        email: 'user@example.com',
        contact: '9999999999'
      },
      theme: {
        color: '#3399cc'
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error('Order creation failed:', error);
    alert('Failed to create order');
  }
};
```

---

## Testing Checklist

- [ ] Razorpay credentials are configured in `.env`
- [ ] Server shows "Razorpay initialized successfully" on startup
- [ ] Create order returns `razorpayOrderId` and `razorpayKeyId`
- [ ] Frontend can initialize Razorpay checkout with returned order ID
- [ ] User can complete payment in Razorpay checkout
- [ ] Razorpay returns payment_id, order_id, and signature to frontend
- [ ] Verify payment endpoint accepts and validates signature correctly
- [ ] Order status changes to 'confirmed' and payment status to 'paid'
- [ ] Invalid signature is rejected with appropriate error
- [ ] Duplicate verification attempts are rejected

---

## Security Notes

1. **Never expose your Razorpay Key Secret** - It should only be in `.env` on the server
2. **Always verify signatures** - The backend verification prevents payment fraud
3. **Use HTTPS in production** - Never send payment data over HTTP
4. **Validate order amounts** - Ensure frontend and backend amounts match
5. **Check order ownership** - Users should only verify their own orders
