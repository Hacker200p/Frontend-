const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
  },
  roomNumber: {
    type: String,
    required: true,
  },
  floor: {
    type: Number,
    required: true,
  },
  roomType: {
    type: String,
    enum: ['single', 'double', 'triple', 'quad'],
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  currentOccupancy: {
    type: Number,
    default: 0,
  },
  rent: {
    type: Number,
    required: true,
  },
  securityDeposit: {
    type: Number,
    required: true,
  },
  amenities: [{
    type: String,
  }],
  photos: [{
    url: String,
    publicId: String,
  }],
  videoUrl: {
    type: String,
    default: '',
  },
  view360Url: {
    type: String,
    default: '',
  },
  panorama: {
    url: String,
    publicId: String,
    originalFilename: String,
    uploadedAt: Date,
    dimensions: {
      width: Number,
      height: Number,
    },
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  tenants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
