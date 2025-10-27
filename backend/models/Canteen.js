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
}, { timestamps: true });

module.exports = mongoose.model('Canteen', canteenSchema);
