const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, verifyOTP, resendOTP, refreshTokenController } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin, handleValidationErrors } = require('../utils/validators');

// Registration with OTP verification
router.post('/register', validateRegister, handleValidationErrors, register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Authentication
router.post('/login', validateLogin, handleValidationErrors, login);
router.post('/refresh-token', refreshTokenController);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

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
