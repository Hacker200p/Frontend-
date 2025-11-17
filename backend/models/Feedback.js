const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  tenantName: String,
  targetType: {
    type: String,
    enum: ['hostel', 'canteen', 'order'],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  canteen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen',
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  comment: {
    type: String,
    default: '',
  },
  orderDetails: {
    orderNumber: String,
    canteenName: String,
    totalAmount: Number,
  },
  photos: [{
    url: String,
    publicId: String,
  }],
  response: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    respondedAt: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
