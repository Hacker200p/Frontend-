const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  canteen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen',
    required: true,
  },
  deliveryLocation: {
    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
    },
    hostelName: String,
    hostelAddress: String,
    roomNumber: String,
    floor: Number,
  },
  plan: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'breakfast_lunch', 'lunch_dinner', 'all_meals'],
    required: true,
  },
  foodType: {
    type: String,
    enum: ['pure_veg', 'veg', 'non_veg_mix'],
    required: true,
    default: 'veg',
  },
  cuisinePreferences: [{
    type: String,
  }],
  dishPreferences: {
    breakfast: [{
      dishName: String,
      quantity: Number,
    }],
    lunch: [{
      dishName: String,
      quantity: Number,
    }],
    dinner: [{
      dishName: String,
      quantity: Number,
    }],
  },
  spiceLevel: {
    type: String,
    enum: ['mild', 'medium', 'spicy'],
    default: 'medium',
  },
  specialInstructions: String,
  allergies: [{
    type: String,
  }],
  price: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number,
    default: 1,  // months
  },
  totalAmount: {
    type: Number,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'expired'],
    default: 'active',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  mealsConsumed: {
    type: Number,
    default: 0,
  },
  autoRenew: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Index for efficient queries
subscriptionSchema.index({ tenant: 1, status: 1 });
subscriptionSchema.index({ canteen: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
