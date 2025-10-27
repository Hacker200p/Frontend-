const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  canteen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide a menu item name'],
    trim: true,
  },
  description: String,
  category: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snacks', 'beverages'],
    required: true,
  },
  foodType: {
    type: String,
    enum: ['veg', 'non-veg', 'vegan'],
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    url: String,
    publicId: String,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  preparationTime: {
    type: Number,
    default: 20,
  },
  rating: {
    type: Number,
    default: 0,
  },
  orderCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
