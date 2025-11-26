const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    required: [true, 'Please provide a phone number'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['master_admin', 'owner', 'canteen_provider', 'tenant'],
    default: 'tenant',
  },
  profileImage: {
    type: String,
    default: '',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // OTP fields for phone verification
  otp: {
    type: String,
    select: false,
  },
  otpExpiry: {
    type: Date,
    select: false,
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  // Profile fields
  displayName: {
    type: String,
    trim: true,
    default: ''
  },
  hobbies: [{
    type: String,
    trim: true
  }],
  foodPreferences: [{
    type: String,
    trim: true
  }],
  // Tenant specific fields
  foodPreference: {
    type: String,
    enum: ['veg', 'non-veg', 'both'],
    default: 'both',
  },
  currentHostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
  },
  currentRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  },
  // Owner specific fields
  ownedHostels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
  }],
  // Canteen provider specific fields
  canteens: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canteen',
  }],
  kycDocuments: {
    aadhar: String,
    pan: String,
    businessLicense: String,
  },
  bio: {
    type: String,
    default: ''
  },
  addressString: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: ''
  },
  refreshToken: {
    type: String,
    select: false,
  },
  refreshTokenExpiry: {
    type: Date,
    select: false,
  },
  // Phone change OTP fields
  phoneChangeOTP: {
    type: String,
    select: false,
  },
  phoneChangeOTPExpiry: {
    type: Date,
    select: false,
  },
  pendingPhoneNumber: {
    type: String,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);