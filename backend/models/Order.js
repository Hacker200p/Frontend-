const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
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
  items: [{
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
    },
    name: String,
    quantity: Number,
    price: Number,
  }],
  totalAmount: {
    type: Number,
    required: true,
  },
  deliveryCharge: {
    type: Number,
    default: 0,
  },
  deliveryAddress: {
    hostel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
    },
    hostelName: String,
    hostelAddress: String,
    roomNumber: String,
    floor: Number,
    notes: String,
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'wallet'],
    default: 'online',
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  specialInstructions: String,
  estimatedDeliveryTime: Date,
  deliveredAt: Date,
  feedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback',
  },
  tenantRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: String,
    ratedAt: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
