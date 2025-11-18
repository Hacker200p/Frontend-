const mongoose = require('mongoose');

const deletionRequestSchema = new mongoose.Schema({
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
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  contract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contract',
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  ownerResponse: {
    message: String,
    respondedAt: Date,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Index for querying
deletionRequestSchema.index({ tenant: 1, status: 1 });
deletionRequestSchema.index({ owner: 1, status: 1 });

module.exports = mongoose.model('DeletionRequest', deletionRequestSchema);
