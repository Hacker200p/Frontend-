const express = require('express');
const router = express.Router();
const {
  createCanteen,
  getMyCanteens,
  getAvailableHostels,
  deleteCanteen,
  addMenuItem,
  getCanteenMenu,
  updateMenuItem,
  deleteMenuItem,
  createOrder,
  verifyPayment,
  getProviderOrders,
  updateOrderStatus,
  getMyOrders,
  updateSubscriptionPlans,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getMySubscriptions,
  getCanteenSubscriptions,
  cancelSubscription,
  getAvailableCanteens,
  getCanteenFeedbacks,
  rateTenant,
} = require('../controllers/canteenController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Provider routes
router.post('/', protect, authorize('canteen_provider'), createCanteen);
router.get('/my-canteens', protect, authorize('canteen_provider'), getMyCanteens);
router.get('/available-hostels', protect, authorize('canteen_provider', 'owner'), getAvailableHostels);
router.put('/:id/subscription-plans', protect, authorize('canteen_provider'), updateSubscriptionPlans);
router.get('/:id/subscriptions', protect, authorize('canteen_provider'), getCanteenSubscriptions);
router.post('/:id/menu', protect, authorize('canteen_provider'), upload.single('image'), addMenuItem);
router.put('/menu/:id', protect, authorize('canteen_provider'), upload.single('image'), updateMenuItem);
router.delete('/menu/:id', protect, authorize('canteen_provider'), deleteMenuItem);
router.delete('/:id', protect, authorize('canteen_provider'), deleteCanteen);
router.get('/orders', protect, authorize('canteen_provider'), getProviderOrders);
router.put('/orders/:id/status', protect, authorize('canteen_provider'), updateOrderStatus);
router.post('/orders/:orderId/rate-tenant', protect, authorize('canteen_provider'), rateTenant);
router.get('/:id/feedbacks', protect, authorize('canteen_provider'), getCanteenFeedbacks);

// Public/Tenant routes
router.get('/available', protect, authorize('tenant'), getAvailableCanteens);
router.get('/:id/menu', getCanteenMenu);
router.post('/orders', protect, authorize('tenant'), createOrder);
router.post('/orders/verify-payment', protect, authorize('tenant'), verifyPayment);
router.get('/my-orders', protect, authorize('tenant'), getMyOrders);

// Subscription routes
router.post('/subscriptions/create-order', protect, authorize('tenant'), createSubscriptionOrder);
router.post('/subscriptions/verify-payment', protect, authorize('tenant'), verifySubscriptionPayment);
router.get('/subscriptions/my-subscriptions', protect, authorize('tenant'), getMySubscriptions);
router.put('/subscriptions/:id/cancel', protect, authorize('tenant'), cancelSubscription);

module.exports = router;
