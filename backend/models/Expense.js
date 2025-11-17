const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['hostel', 'canteen', 'other'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending',
  },
  dueDate: Date,
  paidDate: Date,
  paymentId: String, // Razorpay payment ID
  orderId: String, // Razorpay order ID
  
  // Old fields (kept for backward compatibility)
  month: {
    type: Number,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
  },
  rent: {
    type: Number,
    default: 0,
  },
  electricity: {
    type: Number,
    default: 0,
  },
  water: {
    type: Number,
    default: 0,
  },
  food: {
    type: Number,
    default: 0,
  },
  maintenance: {
    type: Number,
    default: 0,
  },
  other: [{
    description: String,
    amount: Number,
  }],
  totalExpense: {
    type: Number,
    default: 0,
  },
  notes: String,
}, { timestamps: true });

expenseSchema.index({ tenant: 1, type: 1 });
expenseSchema.index({ tenant: 1, status: 1 });
expenseSchema.index({ tenant: 1, createdAt: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
