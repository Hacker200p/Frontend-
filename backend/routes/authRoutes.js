import express from 'express';
const router = express.Router();
import { 
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
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRegister, validateLogin, handleValidationErrors } from '../validators/validators.js';
import upload from '../middleware/uploadMiddleware.js';

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

export default router;
