const mongoose = require('mongoose');

const canteenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a canteen name'],
    trim: true,
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
  },
  servingHostels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
  }],
  city: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  description: String,
  cuisineTypes: [{
    type: String,
  }],
  operatingHours: {
    breakfast: {
      start: String,
      end: String,
    },
    lunch: {
      start: String,
      end: String,
    },
    dinner: {
      start: String,
      end: String,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  deliveryCharge: {
    type: Number,
    default: 0,
  },
  minimumOrderAmount: {
    type: Number,
    default: 0,
  },
  subscriptionPlans: {
    breakfast: {
      enabled: { type: Boolean, default: false },
      pure_veg: { type: Number, default: 0 },
      veg: { type: Number, default: 0 },
      non_veg_mix: { type: Number, default: 0 },
      weeklyMenu: {
        monday: { type: String, default: '' },
        tuesday: { type: String, default: '' },
        wednesday: { type: String, default: '' },
        thursday: { type: String, default: '' },
        friday: { type: String, default: '' },
        saturday: { type: String, default: '' },
        sunday: { type: String, default: '' },
      },
    },
    lunch: {
      enabled: { type: Boolean, default: false },
      pure_veg: { type: Number, default: 0 },
      veg: { type: Number, default: 0 },
      non_veg_mix: { type: Number, default: 0 },
      weeklyMenu: {
        monday: { type: String, default: '' },
        tuesday: { type: String, default: '' },
        wednesday: { type: String, default: '' },
        thursday: { type: String, default: '' },
        friday: { type: String, default: '' },
        saturday: { type: String, default: '' },
        sunday: { type: String, default: '' },
      },
    },
    dinner: {
      enabled: { type: Boolean, default: false },
      pure_veg: { type: Number, default: 0 },
      veg: { type: Number, default: 0 },
      non_veg_mix: { type: Number, default: 0 },
      weeklyMenu: {
        monday: { type: String, default: '' },
        tuesday: { type: String, default: '' },
        wednesday: { type: String, default: '' },
        thursday: { type: String, default: '' },
        friday: { type: String, default: '' },
        saturday: { type: String, default: '' },
        sunday: { type: String, default: '' },
      },
    },
    breakfast_lunch: {
      enabled: { type: Boolean, default: false },
      pure_veg: { type: Number, default: 0 },
      veg: { type: Number, default: 0 },
      non_veg_mix: { type: Number, default: 0 },
    },
    lunch_dinner: {
      enabled: { type: Boolean, default: false },
      pure_veg: { type: Number, default: 0 },
      veg: { type: Number, default: 0 },
      non_veg_mix: { type: Number, default: 0 },
    },
    all_meals: {
      enabled: { type: Boolean, default: false },
      pure_veg: { type: Number, default: 0 },
      veg: { type: Number, default: 0 },
      non_veg_mix: { type: Number, default: 0 },
    },
  },
  subscriberCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('Canteen', canteenSchema);
