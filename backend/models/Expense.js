const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
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

expenseSchema.index({ tenant: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Expense', expenseSchema);
