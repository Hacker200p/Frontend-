const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
  contractNumber: {
    type: String,
    unique: true,
    required: true,
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  monthlyRent: {
    type: Number,
    required: true,
  },
  securityDeposit: {
    type: Number,
    required: true,
  },
  terms: [{
    clause: String,
    description: String,
  }],
  penalties: [{
    penaltyType: String,
    amount: Number,
    description: String,
  }],
  contractDocument: {
    url: String,
    publicId: String,
  },
  tenantSignature: {
    signed: {
      type: Boolean,
      default: false,
    },
    signedAt: Date,
    ipAddress: String,
  },
  ownerSignature: {
    signed: {
      type: Boolean,
      default: false,
    },
    signedAt: Date,
    ipAddress: String,
  },
  status: {
    type: String,
    enum: ['draft', 'pending_signatures', 'active', 'expired', 'terminated'],
    default: 'draft',
  },
  paymentId: String,
  orderId: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  terminationReason: String,
  terminatedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Contract', contractSchema);
