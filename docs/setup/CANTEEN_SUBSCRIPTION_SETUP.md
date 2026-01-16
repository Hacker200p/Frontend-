# 🍱 Canteen Subscription Setup Guide

## Overview
This guide helps canteen providers set up monthly meal subscription plans that tenants can subscribe to.

## For Canteen Providers: Setting Up Subscription Plans

### Step 1: Login as Canteen Provider
1. Go to `http://localhost:3000/login`
2. Login with canteen provider credentials
3. You'll be redirected to the Canteen Dashboard

### Step 2: Navigate to Subscriptions Tab
1. In the left sidebar, click on **📅 Subscriptions**
2. Select your canteen from the dropdown (if you have multiple canteens)

### Step 3: Configure Subscription Plans

You can enable and configure 6 types of meal plans:

#### Individual Meal Plans (with weekly menus):
1. **🌅 Breakfast Only**
2. **🍱 Lunch Only**
3. **🌙 Dinner Only**

#### Combo Meal Plans:
4. **☀️ Breakfast + Lunch**
5. **🌆 Lunch + Dinner**
6. **🍽️ All Meals (3 meals/day)**

### Step 4: Enable and Price Plans

For each plan you want to offer:

1. ✅ **Check "Enable Plan"** checkbox
2. **Set prices** for each food type:
   - 🟢 **Pure Veg**: Price per month (e.g., ₹2000)
   - 🥗 **Veg**: Price per month (e.g., ₹2200)
   - 🍗 **Non-Veg Mix**: Price per month (e.g., ₹2500)

**Example Pricing:**
```
Breakfast Only:
✅ Enabled
- Pure Veg: ₹1500/month
- Veg: ₹1600/month
- Non-Veg Mix: ₹1800/month

Lunch Only:
✅ Enabled
- Pure Veg: ₹2500/month
- Veg: ₹2700/month
- Non-Veg Mix: ₹3000/month

All Meals:
✅ Enabled
- Pure Veg: ₹4500/month
- Veg: ₹4800/month
- Non-Veg Mix: ₹5500/month
```

### Step 5: Add Weekly Menus (For Individual Meal Plans)

For Breakfast, Lunch, and Dinner plans:

1. Click the **▶** button next to an enabled plan
2. The weekly menu section will expand
3. Add menu items for each day of the week

**Example Weekly Breakfast Menu:**
```
Monday: Idli, Vada, Sambar, Chutney, Tea
Tuesday: Poha, Jalebi, Tea
Wednesday: Upma, Chutney, Coffee
Thursday: Dosa, Sambar, Chutney, Tea
Friday: Paratha, Curd, Pickle, Tea
Saturday: Sandwich, Tea
Sunday: Special Breakfast - Chole Bhature
```

### Step 6: Save Plans
1. Scroll down
2. Click **"Save Subscription Plans"** button
3. Wait for success message: "✓ Subscription plans updated successfully!"

### Step 7: Verify
1. The plans are now live!
2. Tenants in your hostel can now see and subscribe to these plans
3. Go to **Orders Management** to track subscriptions

---

## For Tenants: Subscribing to Meal Plans

### Step 1: Login as Tenant
1. Login to your tenant account
2. Navigate to **🍽️ Canteen & Food** tab

### Step 2: Browse Available Canteens
1. You'll see all canteens operating in your hostel
2. Click **"View Menu →"** on any canteen card

### Step 3: View Subscription Plans
1. When you open a canteen menu, **subscription plans appear at the top**
2. You'll see a prominent green banner: **"🍱 Monthly Subscription Plans"**
3. All available plans are displayed with:
   - Plan name (e.g., Breakfast, Lunch, All Meals)
   - Food type options (Pure Veg, Veg, Non-Veg Mix)
   - Monthly pricing

### Step 4: Subscribe to a Plan
1. Click **"📅 Subscribe Now"** on your preferred plan
2. Choose your food type (Pure Veg, Veg, or Non-Veg Mix)
3. Click **"Proceed to Payment"**
4. Complete the Razorpay payment
5. Your subscription activates immediately!

### Step 5: Manage Subscriptions
1. View active subscriptions at the top of the Canteen & Food tab
2. See subscription details:
   - Plan type
   - Food preference
   - Start and end dates
   - Delivery location (auto-filled from your room booking)

---

## Current Status

✅ **Backend**: Fully implemented
✅ **Canteen Provider UI**: Subscription management interface ready
✅ **Tenant UI**: Subscription display and purchase flow ready
✅ **Payment Integration**: Razorpay integrated
✅ **Database Models**: Subscription schema ready

## Troubleshooting

### Issue: "Subscription Plans Coming Soon" message shows

**Cause**: Canteen provider hasn't enabled any subscription plans yet

**Solution**:
1. Login as canteen provider
2. Go to Subscriptions tab
3. Enable at least one plan
4. Set prices (must be > 0)
5. Click "Save Subscription Plans"

### Issue: Plans don't show after saving

**Solution**:
1. Refresh the browser (Ctrl+F5)
2. Check browser console for errors (F12)
3. Verify canteen is selected in dropdown
4. Ensure at least one plan has `enabled: true` and valid prices

### Issue: Tenants can't see plans

**Solution**:
1. Verify tenant has an active room booking
2. Check if canteen serves the tenant's hostel
3. Ensure prices are set and > 0
4. Refresh tenant's browser

---

## API Endpoints Used

### Canteen Provider:
- `PUT /api/canteen/:id/subscription-plans` - Update subscription plans
- `GET /api/canteen/:id/subscriptions` - View active subscriptions

### Tenant:
- `GET /api/canteen/available` - Get canteens in tenant's hostel
- `POST /api/canteen/subscriptions/create-order` - Create subscription order
- `POST /api/canteen/subscriptions/verify-payment` - Verify payment
- `GET /api/canteen/subscriptions/my-subscriptions` - Get tenant's subscriptions

---

## Quick Test Scenario

### As Canteen Provider:
1. Login → Subscriptions Tab
2. Enable "Breakfast Only" plan
3. Set Pure Veg: ₹1500, Veg: ₹1600
4. Add weekly menu
5. Save

### As Tenant:
1. Login → Canteen & Food Tab
2. Click canteen
3. See subscription plans at top
4. Click "Subscribe Now" on Breakfast
5. Choose Pure Veg
6. Complete payment
7. Subscription active! 🎉

---

## Database Schema

```javascript
subscriptionPlans: {
  breakfast: {
    enabled: Boolean,
    pure_veg: Number,
    veg: Number,
    non_veg_mix: Number,
    weeklyMenu: {
      monday: String,
      tuesday: String,
      // ... all days
    }
  },
  lunch: { /* same structure */ },
  dinner: { /* same structure */ },
  breakfast_lunch: { /* no weeklyMenu */ },
  lunch_dinner: { /* no weeklyMenu */ },
  all_meals: { /* no weeklyMenu */ }
}
```

---

## Support

For issues or questions:
1. Check browser console (F12)
2. Check backend logs
3. Verify JWT token is valid
4. Ensure MongoDB is running

**Happy Subscribing! 🍱**
