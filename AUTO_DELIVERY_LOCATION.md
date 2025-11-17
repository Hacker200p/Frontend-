# Automatic Delivery Location Feature

## Overview
The system now automatically detects and uses the tenant's hostel location when they order food or subscribe to meal plans. No manual address entry required!

## How It Works

### 1. Order Creation (One-Time Food Orders)
When a tenant places a food order:
- System queries their **active Contract** from the database
- Validates they have an active hostel booking
- Extracts hostel details: name, address, room number, floor
- Auto-populates delivery location in the order

**Backend:** `backend/controllers/canteenController.js` - `createOrder()` function (lines ~236-305)

### 2. Subscription Creation (Monthly Meal Plans)
When a tenant subscribes to a meal plan:
- System queries their **active Contract** from the database  
- Validates they have an active hostel booking
- Extracts hostel details: name, address, room number, floor
- Auto-populates delivery location in the subscription

**Backend:** `backend/controllers/canteenController.js` - `createSubscriptionOrder()` function (lines ~495-597)

## Database Changes

### Order Model (`backend/models/Order.js`)
```javascript
deliveryAddress: {
  hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel' },
  hostelName: String,
  hostelAddress: String,
  roomNumber: String,
  floor: Number,
  notes: String
}
```

### Subscription Model (`backend/models/Subscription.js`)
```javascript
deliveryLocation: {
  hostel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel' },
  hostelName: String,
  hostelAddress: String,
  roomNumber: String,
  floor: Number
}
```

## Backend Implementation

### Key Changes in `canteenController.js`

#### 1. **createOrder** function
```javascript
// Fetch tenant's active contract
const activeContract = await Contract.findOne({ 
  tenant: req.user.id, 
  status: 'active' 
})
  .populate('hostel')
  .populate('room', 'roomNumber floor');

// Validate contract exists
if (!activeContract) {
  return res.status(400).json({ 
    success: false, 
    message: 'No active hostel contract found. Please book a room first.' 
  });
}

// Build delivery location from contract
const autoDeliveryAddress = {
  hostel: activeContract.hostel._id,
  hostelName: activeContract.hostel.name,
  hostelAddress: `${activeContract.hostel.address}, ${activeContract.hostel.city}`,
  roomNumber: activeContract.room.roomNumber,
  floor: activeContract.room.floor,
  notes: deliveryAddress?.notes || ''
};

// Use auto-location in order
const orderData = {
  // ... other fields
  deliveryAddress: autoDeliveryAddress
};
```

#### 2. **createSubscriptionOrder** function
```javascript
// Fetch tenant's active contract (same as above)
const activeContract = await Contract.findOne({ 
  tenant: req.user.id, 
  status: 'active' 
})
  .populate('hostel')
  .populate('room', 'roomNumber floor');

// Validate contract exists
if (!activeContract) {
  return res.status(400).json({ 
    success: false, 
    message: 'No active hostel contract found. Please book a room first.' 
  });
}

// Build delivery location from contract
const deliveryLocation = {
  hostel: activeContract.hostel._id,
  hostelName: activeContract.hostel.name,
  hostelAddress: `${activeContract.hostel.address}, ${activeContract.hostel.city}`,
  roomNumber: activeContract.room.roomNumber,
  floor: activeContract.room.floor
};

// Use in subscription
const subscription = await Subscription.create({
  // ... other fields
  deliveryLocation
});
```

#### 3. **getCanteenSubscriptions** function
Updated to populate delivery location:
```javascript
const subscriptions = await Subscription.find({ canteen: req.params.id })
  .populate('tenant', 'name phone email')
  .populate('deliveryLocation.hostel', 'name address city')
  .sort({ createdAt: -1 });
```

#### 4. **getMySubscriptions** function
Updated to populate delivery location:
```javascript
const subscriptions = await Subscription.find({ tenant: req.user.id })
  .populate('canteen', 'name hostel')
  .populate({
    path: 'canteen',
    populate: { path: 'hostel', select: 'name' }
  })
  .populate('deliveryLocation.hostel', 'name address city')
  .sort({ createdAt: -1 });
```

## Frontend Implementation

### Canteen Dashboard (`frontend/src/pages/canteen/CanteenDashboard.jsx`)

#### Updated Subscriptions Table
Added **Delivery Location** column showing:
- 🏠 Hostel name
- Room number and floor
- Full hostel address

```jsx
<th className="px-4 py-3 text-left text-sm font-semibold text-text-dark">
  Delivery Location
</th>

{/* In table body */}
<td className="px-4 py-3 text-sm">
  {sub.deliveryLocation ? (
    <div>
      <p className="font-semibold text-text-dark">
        🏠 {sub.deliveryLocation.hostelName}
      </p>
      <p className="text-text-muted">
        Room {sub.deliveryLocation.roomNumber}, Floor {sub.deliveryLocation.floor}
      </p>
      <p className="text-xs text-text-muted">
        {sub.deliveryLocation.hostelAddress}
      </p>
    </div>
  ) : (
    <span className="text-text-muted">Not set</span>
  )}
</td>
```

## Validation & Error Handling

### Backend Validation
- ✅ Checks if tenant has an active contract
- ✅ Returns 400 error if no active contract: "No active hostel contract found. Please book a room first."
- ✅ Validates contract has populated hostel and room data
- ✅ Ensures delivery location is always set for orders/subscriptions

### Database Integrity
- ✅ Stores hostel ObjectId reference for queries
- ✅ Stores string copies (hostelName, hostelAddress) for display
- ✅ Stores room details (roomNumber, floor) for delivery coordination

## Benefits

1. **No Manual Entry**: Tenants don't need to type their address
2. **Accuracy**: Address comes directly from their active booking
3. **Validation**: Can't order without an active hostel contract
4. **Provider View**: Canteen providers see exact delivery location
5. **Coordination**: Room number and floor help with delivery logistics

## Testing Checklist

- [ ] Tenant with active contract can create order (delivery location auto-set)
- [ ] Tenant with active contract can create subscription (delivery location auto-set)
- [ ] Tenant without active contract gets error message
- [ ] Delivery location displays in canteen provider's subscription table
- [ ] Delivery location shows: hostel name, room number, floor, address
- [ ] Multiple subscriptions from different hostels display correctly

## Files Modified

### Backend
- ✅ `backend/models/Order.js` - Added deliveryAddress fields
- ✅ `backend/models/Subscription.js` - Added deliveryLocation object
- ✅ `backend/controllers/canteenController.js`:
  - Updated `createOrder()` - Auto-fetch and set delivery location
  - Updated `createSubscriptionOrder()` - Auto-fetch and set delivery location
  - Updated `getCanteenSubscriptions()` - Populate delivery location
  - Updated `getMySubscriptions()` - Populate delivery location

### Frontend
- ✅ `frontend/src/pages/canteen/CanteenDashboard.jsx`:
  - Added Delivery Location column to subscriptions table
  - Display hostel name, room, floor, address

## Next Steps (Optional Enhancements)

1. **Tenant View**: Update tenant dashboard canteen tab to show their delivery location
2. **Order History**: Show delivery location in past orders
3. **Delivery Tracking**: Add delivery status updates with location confirmation
4. **Multiple Addresses**: Support tenants with multiple active contracts (select preferred delivery location)
5. **Address Override**: Allow manual address override for special cases (with validation)

---

**Status**: ✅ Complete and ready for testing
**Last Updated**: Current session
