# Razorpay Real Money Integration Guide

This guide explains how to set up Razorpay to receive actual payments from customers.

---

## 📋 Prerequisites

1. Valid Indian business registration (PAN card, business details)
2. Bank account for settlements
3. Government-issued ID proof
4. Business address proof

---

## 🚀 Step 1: Create Razorpay Account

### 1.1 Sign Up
1. Go to https://razorpay.com/
2. Click **"Sign Up"** or **"Get Started"**
3. Enter your email and create a password
4. Verify your email address

### 1.2 Complete KYC (Know Your Customer)
After signing up, you need to complete KYC to activate live mode:

**Required Documents:**
- **Business PAN Card**
- **Business Registration Certificate** (for companies)
- **Bank Account Details** (account number, IFSC code)
- **Address Proof** (business address)
- **Identity Proof** (Aadhar, Passport, Driver's License)

**Submission Process:**
1. Log in to Razorpay Dashboard
2. Navigate to **Settings → Account & Settings**
3. Complete the **KYC** section
4. Upload required documents
5. Wait for verification (usually 1-3 business days)

---

## 🔑 Step 2: Get API Keys

### 2.1 Test Mode Keys (For Development)
1. Log in to https://dashboard.razorpay.com/
2. Navigate to **Settings → API Keys**
3. Click **"Generate Test Key"** if not already generated
4. You'll see:
   - **Key ID**: `rzp_test_xxxxxxxxxxxxxx`
   - **Key Secret**: `xxxxxxxxxxxxxxxxxxxxxx` (click "Show" to reveal)

### 2.2 Live Mode Keys (For Production)
⚠️ **Only available after KYC is approved**

1. Navigate to **Settings → API Keys**
2. Switch to **"Live Mode"** toggle
3. Click **"Generate Live Key"**
4. You'll see:
   - **Key ID**: `rzp_live_xxxxxxxxxxxxxx`
   - **Key Secret**: `xxxxxxxxxxxxxxxxxxxxxx`

**⚠️ Important:** Keep your **Key Secret** safe and NEVER commit it to version control!

---

## 💳 Step 3: Configure Your Application

### 3.1 Add Keys to .env File

**For Development (Test Mode):**
```env
NODE_ENV=development
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_key_secret_here
```

**For Production (Live Mode):**
```env
NODE_ENV=production
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_live_key_secret_here
```

### 3.2 Environment-Based Configuration (Best Practice)

Create separate `.env` files:

**`.env.development`:**
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=test_secret_here
```

**`.env.production`:**
```env
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=live_secret_here
```

---

## 🧪 Step 4: Testing in Test Mode

### 4.1 Test Mode Features
- No real money transactions
- Use test cards for payments
- Immediate payment confirmation
- All Razorpay features available

### 4.2 Test Card Details

**For Successful Payments:**
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
Name: Any name
```

**For Failed Payments:**
```
Card Number: 4000 0000 0000 0002
CVV: Any 3 digits
Expiry: Any future date
```

**For UPI (Test Mode):**
```
UPI ID: success@razorpay
```

### 4.3 Test Your Integration
1. Make sure `RAZORPAY_KEY_ID` starts with `rzp_test_`
2. Create an order using your API
3. Use Razorpay checkout with test card
4. Complete payment
5. Verify payment on your backend
6. Check Razorpay Dashboard → Payments

---

## 💰 Step 5: Go Live (Accept Real Money)

### 5.1 Pre-Launch Checklist

✅ **Complete KYC verification**
✅ **Test all payment flows thoroughly**
✅ **Set up webhook for payment notifications**
✅ **Configure settlement account**
✅ **Test refund functionality**
✅ **Set up email notifications**
✅ **Review Razorpay fees and pricing**

### 5.2 Switch to Live Mode

1. **Update Environment Variables:**
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_live_secret_here
   ```

2. **Restart Your Server:**
   ```bash
   npm start
   ```

3. **Verify Live Mode:**
   - Check server logs: "Razorpay initialized successfully"
   - Make a small test payment with real card
   - Verify payment appears in Dashboard → Live → Payments

### 5.3 Configure Settlement Account

1. Go to **Settings → Settlements**
2. Add your **Bank Account Details:**
   - Account Number
   - IFSC Code
   - Account Holder Name
   - Account Type (Savings/Current)
3. Verify bank account (Razorpay will send ₹1 for verification)
4. Set settlement schedule:
   - **Instant** (for eligible merchants)
   - **Daily** (most common)
   - **Weekly**
   - **Custom**

---

## 🔔 Step 6: Set Up Webhooks (Recommended)

Webhooks notify your server when payment status changes.

### 6.1 Create Webhook Endpoint in Your Code

Add to `backend/routes/webhookRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Order = require('../models/Order');

// Razorpay webhook endpoint
router.post('/razorpay', async (req, res) => {
  try {
    // Verify webhook signature
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    
    if (webhookSignature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    // Handle the event
    const event = req.body.event;
    const payment = req.body.payload.payment.entity;
    
    switch (event) {
      case 'payment.authorized':
        console.log('Payment authorized:', payment.id);
        break;
        
      case 'payment.captured':
        // Update order status
        await Order.findOneAndUpdate(
          { razorpayOrderId: payment.order_id },
          { 
            paymentStatus: 'paid',
            razorpayPaymentId: payment.id,
            orderStatus: 'confirmed'
          }
        );
        console.log('Payment captured:', payment.id);
        break;
        
      case 'payment.failed':
        await Order.findOneAndUpdate(
          { razorpayOrderId: payment.order_id },
          { paymentStatus: 'failed' }
        );
        console.log('Payment failed:', payment.id);
        break;
        
      default:
        console.log('Unhandled event:', event);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
```

### 6.2 Register Webhook in Razorpay Dashboard

1. Go to **Settings → Webhooks**
2. Click **"+ Add New Webhook"**
3. Enter your webhook URL:
   ```
   https://yourdomain.com/api/webhooks/razorpay
   ```
4. Select events to listen to:
   - ✅ payment.authorized
   - ✅ payment.captured
   - ✅ payment.failed
   - ✅ refund.created
   - ✅ order.paid
5. Set **Webhook Secret** (any strong password)
6. Add this secret to your `.env`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
   ```
7. Click **"Create Webhook"**

### 6.3 Test Webhook

1. Razorpay Dashboard → Webhooks → Your webhook → **"Test"**
2. Send test event
3. Check your server logs for webhook processing

---

## 💸 Step 7: Understanding Razorpay Fees

### 7.1 Pricing Structure (as of 2025)

**For Businesses < ₹50L/year:**
- Domestic Cards: **2% + GST**
- UPI: **Free** (government mandate)
- Netbanking: **₹3-5 per transaction + GST**
- Wallets: **2% + GST**

**For Businesses > ₹50L/year:**
- Custom pricing available
- Contact Razorpay sales

**Additional Fees:**
- Setup: **Free**
- AMC: **Free**
- Refunds: **Free** (original fees not refunded)
- International Cards: **3% + GST**

### 7.2 Settlement Timing

**Instant Settlement (T+0):**
- Available for eligible merchants
- Receive money instantly after payment
- Additional charges may apply

**Standard Settlement:**
- **T+2** to **T+4** business days
- No extra charges
- Most common for new merchants

---

## 🛡️ Step 8: Security Best Practices

### 8.1 Protect API Keys

✅ **DO:**
- Store keys in `.env` file
- Add `.env` to `.gitignore`
- Use environment variables
- Rotate keys periodically
- Use different keys for dev/production

❌ **DON'T:**
- Commit keys to Git
- Share keys in public channels
- Hardcode keys in source code
- Use production keys in development

### 8.2 Implement Signature Verification

Always verify payment signatures on your backend:

```javascript
const crypto = require('crypto');

function verifyPaymentSignature(orderId, paymentId, signature) {
  const sign = paymentId + '|' + orderId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest('hex');
  
  return signature === expectedSignature;
}
```

### 8.3 Use HTTPS in Production

- Never send payment data over HTTP
- Get SSL certificate (Let's Encrypt is free)
- Redirect all HTTP traffic to HTTPS

---

## 📊 Step 9: Monitor Payments

### 9.1 Razorpay Dashboard

Access at: https://dashboard.razorpay.com/

**Key Sections:**
- **Payments** - View all transactions
- **Settlements** - Track money transfers to bank
- **Refunds** - Manage refund requests
- **Analytics** - View payment statistics
- **Disputes** - Handle chargebacks

### 9.2 Important Metrics to Track

- **Success Rate** - % of successful payments
- **Failure Reasons** - Why payments fail
- **Average Ticket Size** - Average payment amount
- **Payment Methods** - Popular payment options
- **Settlement Schedule** - When money arrives

---

## 🔄 Step 10: Handling Refunds

### 10.1 Full Refund (via API)

```javascript
const refund = await razorpay.payments.refund(paymentId, {
  amount: amountInPaise, // Optional (full refund if omitted)
  notes: {
    reason: 'Customer requested cancellation'
  }
});
```

### 10.2 Partial Refund

```javascript
const refund = await razorpay.payments.refund(paymentId, {
  amount: 5000, // ₹50 in paise
  notes: {
    reason: 'Partial cancellation'
  }
});
```

### 10.3 Refund via Dashboard

1. Go to **Payments** → Find the payment
2. Click on payment ID
3. Click **"Refund"** button
4. Enter amount (full or partial)
5. Add reason (optional)
6. Click **"Initiate Refund"**

**Refund Timeline:**
- **Cards**: 5-7 business days
- **UPI**: Instant to 1 day
- **Netbanking**: 3-5 business days

---

## 🌐 Step 11: Going International (Optional)

### 11.1 Enable International Payments

1. Complete international KYC
2. Go to **Settings → Configuration**
3. Enable **"International Payments"**
4. Select accepted currencies
5. Configure conversion rates

### 11.2 International Cards

**Supported:**
- Visa
- Mastercard
- American Express
- Discover

**Fees:** 3% + GST + forex markup

---

## 📱 Step 12: Frontend Integration (When Ready)

### 12.1 Install Razorpay SDK

```bash
npm install razorpay
```

### 12.2 Frontend Code (React Example)

```javascript
import axios from 'axios';

const handlePayment = async (orderData) => {
  try {
    // 1. Create order on backend
    const { data } = await axios.post('/api/canteen/orders', orderData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // 2. Initialize Razorpay
    const options = {
      key: data.razorpayKeyId,
      amount: data.amount * 100,
      currency: 'INR',
      order_id: data.razorpayOrderId,
      name: 'SafeStay Hub',
      description: `Order #${data.data.orderNumber}`,
      image: '/logo.png',
      handler: async function(response) {
        // 3. Verify payment on backend
        try {
          await axios.post('/api/canteen/orders/verify-payment', {
            orderId: data.data._id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          alert('Payment successful!');
        } catch (error) {
          alert('Payment verification failed');
        }
      },
      prefill: {
        name: 'Customer Name',
        email: 'customer@example.com',
        contact: '9999999999'
      },
      theme: {
        color: '#3399cc'
      }
    };
    
    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error('Payment error:', error);
  }
};
```

### 12.3 Load Razorpay Script

Add to `public/index.html`:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## ✅ Launch Checklist

Before accepting real payments:

- [ ] KYC verification complete
- [ ] Live API keys configured
- [ ] Settlement account verified
- [ ] Test mode thoroughly tested
- [ ] Webhooks configured and tested
- [ ] SSL certificate installed (HTTPS)
- [ ] Payment signature verification working
- [ ] Refund functionality tested
- [ ] Error handling implemented
- [ ] Terms & Conditions page ready
- [ ] Privacy Policy page ready
- [ ] Refund/Cancellation policy displayed
- [ ] Customer support contact available
- [ ] Razorpay branding displayed (required)

---

## 🆘 Troubleshooting

### Payment Failing?
- Check if live keys are correct
- Verify customer card details
- Check bank/card issuer restrictions
- Review Razorpay Dashboard for error codes

### Settlement Delayed?
- Verify bank account details
- Check settlement schedule
- Contact Razorpay support if > 7 days

### Webhook Not Working?
- Verify webhook URL is accessible
- Check signature verification
- Ensure HTTPS (webhooks require SSL)
- Test webhook from Dashboard

---

## 📞 Support

**Razorpay Support:**
- Email: support@razorpay.com
- Phone: 1800-123-7777
- Dashboard: Help → Contact Support
- Docs: https://razorpay.com/docs/

**Integration Help:**
- API Docs: https://razorpay.com/docs/api/
- Test Mode: https://razorpay.com/docs/payment-gateway/test-card-details/
- Webhooks: https://razorpay.com/docs/webhooks/

---

## 💡 Pro Tips

1. **Start with Test Mode** - Thoroughly test before going live
2. **Enable Auto-capture** - Payments are automatically captured (recommended)
3. **Set Timeout** - Configure payment timeout in Settings
4. **Use Webhooks** - Don't rely only on frontend payment status
5. **Monitor Daily** - Check dashboard for failed payments/disputes
6. **Keep Records** - Maintain payment logs in your database
7. **Handle Failures Gracefully** - Show clear error messages to users
8. **Offer Multiple Payment Methods** - UPI, Cards, Netbanking, Wallets
9. **Display Total Amount** - Show final amount before payment
10. **Send Receipts** - Email payment receipts to customers

---

## 🚀 You're Ready!

Follow these steps carefully and you'll be accepting real payments in no time. Remember to:

1. Complete KYC first
2. Test thoroughly in test mode
3. Switch to live keys when ready
4. Monitor payments regularly
5. Provide good customer support

Good luck with your payment integration! 💰🎉
