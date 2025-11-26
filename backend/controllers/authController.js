const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const generateOTP = require('../utils/generateOTP');
const cloudinary = require('../config/cloudinary');

// Register new user - Now sends OTP for verification
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    console.log(`[REGISTER] Raw request body:`, req.body);
    const { name, email, phoneNumber, phone, password, userRole, role } = req.body;

    // Accept both phoneNumber and phone for compatibility
    const phoneNum = phoneNumber || phone;

    // Normalize role aliases coming from frontend
    const normalizeRole = (r) => {
      if (!r) return 'tenant';
      const value = String(r).toLowerCase();
      switch (value) {
        case 'admin':
        case 'master_admin':
          return 'master_admin';
        case 'provider':
        case 'canteen_provider':
        case 'canteen':
          return 'canteen_provider';
        case 'owner':
          return 'owner';
        case 'tenant':
        default:
          return 'tenant';
      }
    };
    const userRole_ = normalizeRole(userRole || role);

    console.log(`[REGISTER] Received registration request:`, { name, email, phoneNum, password: '***', userRole_ });

    // Validate required fields
    if (!name || !email || !phoneNum || !password) {
      console.log(`[REGISTER] Validation failed - missing fields:`, { name: !!name, email: !!email, phoneNum: !!phoneNum, password: !!password });
      return res.status(400).json({ success: false, message: 'Name, email, phone number, and password are required' });
    }

    // Validate phone number format (10 digits)
    if (!/^[0-9]{10}$/.test(phoneNum)) {
      console.log(`[REGISTER] Invalid phone format:`, phoneNum);
      return res.status(400).json({ success: false, message: 'Phone number must be 10 digits without spaces or special characters' });
    }

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { phone: phoneNum }] });
    
    // If user exists and is already verified, block registration
    if (userExists && userExists.phoneVerified && userExists.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists with this email or phone number. Please login instead.' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log(`[REGISTER] Generated OTP: ${otp} for phone: ${phoneNum}`);

    let tempUser;

    // If user exists but not verified, update their details and send new OTP
    if (userExists && !userExists.phoneVerified) {
      console.log(`[REGISTER] User exists but not verified. Updating details and resending OTP.`);
      
      // Update the existing user's OTP without triggering unique constraint
      userExists.name = name;
      userExists.otp = otp;
      userExists.otpExpiry = otpExpiry;
      userExists.phoneVerified = false;
      userExists.isActive = false;
      
      // If email or role changed, update those too
      if (userExists.email !== email) userExists.email = email;
      if (userExists.role !== userRole_) userExists.role = userRole_;
      
      // Only update password if provided
      if (password) {
        userExists.password = password; // Will be hashed by pre-save hook
      }
      
      await userExists.save({ validateModifiedOnly: true });
      tempUser = userExists;
      console.log(`[REGISTER] Updated unverified user with ID: ${tempUser._id}`);
    } else {
      // Create new temporary user with OTP (not verified)
      tempUser = await User.create({
        name,
        email,
        phone: phoneNum,
        password,
        role: userRole_,
        otp,
        otpExpiry,
        phoneVerified: false,
        isActive: false, // User is inactive until phone is verified
      });
      
      console.log(`[REGISTER] Created new temporary user with ID: ${tempUser._id}`);
    }

    // Send OTP via SMS
    await sendSMS(phoneNum, `Your SafeStay Hub verification code is: ${otp}. This code will expire in 10 minutes.`);

    console.log(`[REGISTER] OTP SMS sent to ${phoneNum}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your phone number',
      data: {
        userId: tempUser._id,
        phone: tempUser.phone,
      },
    });
  } catch (error) {
    console.error(`[REGISTER] Error:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP and complete registration
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    console.log('[VERIFY OTP] Request received:', req.body);
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      console.log('[VERIFY OTP] Missing phone or OTP');
      return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
    }

    console.log(`[VERIFY OTP] Looking for user with phone: ${phone}`);
    // Find user with phone and OTP
    const user = await User.findOne({ phone }).select('+otp +otpExpiry +password');

    if (!user) {
      console.log('[VERIFY OTP] User not found');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log(`[VERIFY OTP] User found: ${user._id}, OTP: ${user.otp}, Verified: ${user.phoneVerified}`);

    // Check if already verified
    if (user.phoneVerified && user.isActive) {
      console.log('[VERIFY OTP] User already verified');
      return res.status(400).json({ success: false, message: 'Phone number already verified' });
    }

    // Check if OTP matches
    console.log(`[VERIFY OTP] Comparing OTPs - Received: ${otp}, Stored: ${user.otp}`);
    if (user.otp !== otp) {
      console.log('[VERIFY OTP] OTP mismatch');
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Check if OTP has expired
    if (user.otpExpiry < new Date()) {
      console.log('[VERIFY OTP] OTP expired');
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one' });
    }

    console.log('[VERIFY OTP] Updating user to verified status');
    // Verify user
    user.phoneVerified = true;
    user.isActive = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    console.log(`[VERIFY OTP] User ${user._id} verified successfully`);

    // Generate token
    const token = generateToken(user._id);

    // Send response immediately (don't wait for email/SMS)
    res.status(201).json({
      success: true,
      message: 'Phone verified successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profileImage: user.profileImage,
          displayName: user.displayName,
          bio: user.bio,
          hobbies: user.hobbies,
          foodPreferences: user.foodPreferences,
          isVerified: user.isVerified,
          phoneVerified: user.phoneVerified,
        },
        token: token,
      },
    });

    // Send welcome email and SMS in background (don't await)
    sendEmail({
      email: user.email,
      subject: 'Welcome to SafeStay Hub',
      message: `<h1>Welcome ${user.name}!</h1><p>Your account has been created successfully.</p>`,
    }).catch(err => console.error('Welcome email error:', err.message));

    sendSMS(user.phone, `Welcome to SafeStay Hub! Your account has been verified successfully.`)
      .catch(err => console.error('Welcome SMS error:', err.message));
  } catch (error) {
    console.error('[VERIFY OTP] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Find user with phone
    const user = await User.findOne({ phone }).select('+otp +otpExpiry');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already verified
    if (user.phoneVerified && user.isActive) {
      return res.status(400).json({ success: false, message: 'Phone number already verified' });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP via SMS
    await sendSMS(phone, `Your SafeStay Hub verification code is: ${otp}. This code will expire in 10 minutes.`);

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const { accessToken, refreshToken } = generateToken(user._id);

    // Save refresh token to database
    user.refreshToken = refreshToken;
    user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await user.save();

    res.json({
      success: true,
      data: {
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profileImage: user.profileImage,
          displayName: user.displayName,
          bio: user.bio,
          hobbies: user.hobbies,
          foodPreferences: user.foodPreferences,
          isVerified: user.isVerified,
          phoneVerified: user.phoneVerified,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, foodPreference, bio, addressString, city, state, displayName, hobbies, foodPreferences } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Update name if provided
    if (name) user.name = name;
    if (typeof displayName !== 'undefined') user.displayName = displayName;

    // Update email with uniqueness check
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      user.email = email;
    }

    // Update phone with basic validation and uniqueness
    if (phone && phone !== user.phone) {
      if (!/^[0-9]{10}$/.test(phone)) {
        return res.status(400).json({ success: false, message: 'Phone number must be 10 digits' });
      }
      const existingPhone = await User.findOne({ phone });
      if (existingPhone && existingPhone._id.toString() !== user._id.toString()) {
        return res.status(400).json({ success: false, message: 'Phone number already in use' });
      }
      user.phone = phone;
    }

    if (foodPreference) user.foodPreference = foodPreference;
    if (typeof bio !== 'undefined') user.bio = bio;
    if (typeof addressString !== 'undefined') user.addressString = addressString;
    if (typeof city !== 'undefined') user.city = city;
    if (typeof state !== 'undefined') user.state = state;
    if (hobbies !== undefined) user.hobbies = Array.isArray(hobbies) ? hobbies : [];
    if (foodPreferences !== undefined) user.foodPreferences = Array.isArray(foodPreferences) ? foodPreferences : [];

    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send OTP for phone number change
// @route   POST /api/auth/send-phone-change-otp
// @access  Private
const sendPhoneChangeOTP = async (req, res) => {
  try {
    const { newPhone } = req.body;

    if (!newPhone) {
      return res.status(400).json({ success: false, message: 'New phone number is required' });
    }

    // Validate phone number format (10 digits)
    if (!/^[0-9]{10}$/.test(newPhone)) {
      return res.status(400).json({ success: false, message: 'Phone number must be 10 digits' });
    }

    // Check if phone is already in use by another user
    const existingUser = await User.findOne({ phone: newPhone });
    if (existingUser && existingUser._id.toString() !== req.user.id) {
      return res.status(400).json({ success: false, message: 'Phone number already in use' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP temporarily (using phone change specific fields)
    const user = await User.findById(req.user.id);
    user.phoneChangeOTP = otp;
    user.phoneChangeOTPExpiry = otpExpiry;
    user.pendingPhoneNumber = newPhone;
    await user.save();

    // Send OTP via SMS
    await sendSMS(newPhone, `Your SafeStay Hub phone change verification code is: ${otp}. This code will expire in 10 minutes.`);

    res.status(200).json({
      success: true,
      message: 'OTP sent to new phone number',
    });
  } catch (error) {
    console.error('Send phone change OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP and update phone number
// @route   POST /api/auth/verify-phone-change-otp
// @access  Private
const verifyPhoneChangeOTP = async (req, res) => {
  try {
    const { newPhone, otp } = req.body;

    if (!newPhone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
    }

    const user = await User.findById(req.user.id);

    if (!user.phoneChangeOTP || !user.phoneChangeOTPExpiry) {
      return res.status(400).json({ success: false, message: 'No OTP found. Please request a new OTP.' });
    }

    if (user.phoneChangeOTPExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new OTP.' });
    }

    if (user.phoneChangeOTP !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.pendingPhoneNumber !== newPhone) {
      return res.status(400).json({ success: false, message: 'Phone number mismatch' });
    }

    // Update phone number
    user.phone = newPhone;
    user.phoneChangeOTP = undefined;
    user.phoneChangeOTPExpiry = undefined;
    user.pendingPhoneNumber = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Phone number updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Verify phone change OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshTokenController = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token is required' });
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    // Find user and verify refresh token matches
    const user = await User.findById(decoded.id).select('+refreshToken +refreshTokenExpiry');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token mismatch or user not found' });
    }

    if (user.refreshTokenExpiry < new Date()) {
      return res.status(401).json({ success: false, message: 'Refresh token has expired' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    res.json({
      success: true,
      data: {
        token: newAccessToken,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    // Get user with password field
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isPasswordMatch = await user.matchPassword(currentPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload profile photo
// @route   POST /api/auth/upload-profile-photo
// @access  Private (All authenticated users)
const uploadProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log('Uploading profile photo for user:', user.email);
    console.log('File details:', { mimetype: req.file.mimetype, size: req.file.size });

    // Delete old profile image from cloudinary if exists
    if (user.profileImage && user.profileImage.includes('cloudinary')) {
      try {
        const urlParts = user.profileImage.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExt.split('.')[0];
        await cloudinary.uploader.destroy(`profile_photos/${publicId}`);
        console.log('Old profile image deleted');
      } catch (err) {
        console.error('Error deleting old profile image:', err);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new image to cloudinary from buffer
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    
    console.log('Uploading to Cloudinary...');
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(dataURI, {
        folder: 'profile_photos',
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    console.log('Upload successful:', result.secure_url);

    user.profileImage = result.secure_url;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Profile photo uploaded successfully',
      data: { profileImage: result.secure_url } 
    });
  } catch (error) {
    console.error('Upload profile photo error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to upload profile photo' 
    });
  }
};

module.exports = { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  verifyOTP, 
  resendOTP, 
  refreshTokenController,
  sendPhoneChangeOTP,
  verifyPhoneChangeOTP,
  changePassword,
  uploadProfilePhoto
};
