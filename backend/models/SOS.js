import mongoose from 'mongoose';

const sosSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: false
  },
  type: {
    type: String,
    enum: ['medical', 'fire', 'security', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    trim: true,
    default: 'Current hostel location'
  },
  status: {
    type: String,
    enum: ['active', 'in-progress', 'resolved'],
    default: 'active'
  },
  response: {
    type: String,
    trim: true
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
sosSchema.index({ tenant: 1, createdAt: -1 });
sosSchema.index({ hostel: 1, status: 1 });

export default mongoose.model('SOS', sosSchema);
