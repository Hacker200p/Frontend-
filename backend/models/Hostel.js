const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a hostel name'],
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  address: {
    street: String,
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    landmark: String,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  description: {
    type: String,
    required: true,
  },
  hostelType: {
    type: String,
    enum: ['boys', 'girls', 'co-ed'],
    required: true,
  },
  amenities: [{
    type: String,
  }],
  photos: [{
    url: String,
    publicId: String,
  }],
  video360: [{
    url: String,
    publicId: String,
  }],
  totalRooms: {
    type: Number,
    default: 0,
  },
  availableRooms: {
    type: Number,
    default: 0,
  },
  priceRange: {
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
  },
  rating: {
    type: Number,
    default: 0,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  verificationNotes: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  hasCanteen: {
    type: Boolean,
    default: false,
  },
  canteen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen',
  },
}, { timestamps: true });

hostelSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hostel', hostelSchema);
