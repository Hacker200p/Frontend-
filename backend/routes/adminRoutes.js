const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getDashboardStats,
  verifyHostel,
  toggleUserStatus,
  getAllHostels,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('master_admin'));

router.get('/users', getAllUsers);
router.get('/stats', getDashboardStats);
router.get('/hostels', getAllHostels);
router.put('/hostels/:id/verify', verifyHostel);
router.put('/users/:id/toggle-status', toggleUserStatus);

module.exports = router;
