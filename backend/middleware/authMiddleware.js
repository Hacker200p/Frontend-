const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  console.log('🔐 Auth middleware - Checking authorization...')
  console.log('📌 Path:', req.path, 'Method:', req.method)
  console.log('🔑 Authorization header:', req.headers.authorization ? 'Present' : 'Missing')

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('✓ Token extracted:', token.substring(0, 20) + '...')
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✓ Token verified for user:', decoded.id)
      
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        console.warn('⚠️ User not found for ID:', decoded.id)
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      if (!req.user.isActive) {
        console.warn('⚠️ User account deactivated:', req.user._id)
        return res.status(401).json({ success: false, message: 'Account is deactivated' });
      }

      console.log('✓ Authentication successful for user:', req.user._id)
      next();
    } catch (error) {
      console.error('❌ Token verification failed:', error.message)
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    console.warn('⚠️ No token provided for route:', req.path)
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
