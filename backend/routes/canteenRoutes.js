const express = require('express');
const router = express.Router();
const {
  createCanteen,
  getMyCanteens,
  addMenuItem,
  getCanteenMenu,
  updateMenuItem,
  createOrder,
  verifyPayment,
  getProviderOrders,
  updateOrderStatus,
  getMyOrders,
} = require('../controllers/canteenController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Provider routes
router.post('/', protect, authorize('canteen_provider'), createCanteen);
router.get('/my-canteens', protect, authorize('canteen_provider'), getMyCanteens);
router.post('/:id/menu', protect, authorize('canteen_provider'), addMenuItem);
router.put('/menu/:id', protect, authorize('canteen_provider'), updateMenuItem);
router.get('/orders', protect, authorize('canteen_provider'), getProviderOrders);
router.put('/orders/:id/status', protect, authorize('canteen_provider'), updateOrderStatus);

// Public/Tenant routes
router.get('/:id/menu', getCanteenMenu);
router.post('/orders', protect, authorize('tenant'), createOrder);
router.post('/orders/verify-payment', protect, authorize('tenant'), verifyPayment);
router.get('/my-orders', protect, authorize('tenant'), getMyOrders);

module.exports = router;
