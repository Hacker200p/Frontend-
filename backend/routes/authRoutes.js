const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin, handleValidationErrors } = require('../utils/validators');
const upload = require('../middleware/uploadMiddleware');

// Registration with OTP verification
router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Authentication
router.post('/login', validateLogin, handleValidationErrors, login);
router.post('/refresh-token', refreshTokenController);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/upload-profile-photo', protect, upload.single('profilePhoto'), uploadProfilePhoto);

// Phone number change with OTP verification
router.post('/send-phone-change-otp', protect, sendPhoneChangeOTP);
router.post('/verify-phone-change-otp', protect, verifyPhoneChangeOTP);

// Password change
router.put('/change-password', protect, changePassword);

// Get payment config (public - safe to expose key ID)
router.get('/payment-config', (req, res) => {
  res.json({
    success: true,
    data: {
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_DbI9VsJE0wFwK2',
    }
  });
});

module.exports = router;
