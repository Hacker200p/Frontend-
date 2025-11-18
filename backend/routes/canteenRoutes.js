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
} = require('../controllers/canteenController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Subscription routes (must come before :id routes)
router.post('/subscriptions/create-order', protect, authorize('tenant'), createSubscriptionOrder);
router.post('/subscriptions/verify-payment', protect, authorize('tenant'), verifySubscriptionPayment);
router.get('/subscriptions/my-subscriptions', protect, authorize('tenant'), getMySubscriptions);
router.put('/subscriptions/:id/cancel', protect, authorize('tenant'), cancelSubscription);

// Provider order management routes (must come before /orders/:id routes)
router.get('/provider/orders', protect, authorize('canteen_provider'), getProviderOrders);
router.put('/provider/orders/:id/status', protect, authorize('canteen_provider'), updateOrderStatus);
router.get('/:id/subscriptions', protect, authorize('canteen_provider'), getCanteenSubscriptions);

// Provider feedback routes
router.get('/provider/feedbacks', protect, authorize('canteen_provider'), getProviderFeedbacks);
router.get('/feedbacks/:canteenId', protect, authorize('canteen_provider'), getCanteenFeedbacks);

// Tenant order and feedback routes (must come before /:id routes)
router.get('/my-orders', protect, authorize('tenant'), getMyOrders);
router.post('/orders', protect, authorize('tenant'), createOrder);
router.post('/orders/verify-payment', protect, authorize('tenant'), verifyPayment);
router.post('/feedback', protect, authorize('tenant'), submitFeedback);

// Provider canteen management routes
router.post('/', protect, authorize('canteen_provider'), createCanteen);
router.get('/my-canteens', protect, authorize('canteen_provider'), getMyCanteens);
router.get('/available-hostels', protect, authorize('canteen_provider', 'owner'), getAvailableHostels);
router.put('/:id/subscription-plans', protect, authorize('canteen_provider'), updateSubscriptionPlans);
router.post('/:id/menu', protect, authorize('canteen_provider'), upload.single('image'), addMenuItem);
router.put('/menu/:id', protect, authorize('canteen_provider'), upload.single('image'), updateMenuItem);
router.delete('/menu/:id', protect, authorize('canteen_provider'), deleteMenuItem);
router.delete('/:id', protect, authorize('canteen_provider'), deleteCanteen);
router.get('/orders', protect, authorize('canteen_provider'), getProviderOrders);
router.put('/orders/:id/status', protect, authorize('canteen_provider'), updateOrderStatus);

// Public/Tenant routes
router.get('/available', protect, authorize('tenant'), getAvailableCanteens);
router.get('/:id/menu', getCanteenMenu);

module.exports = router;
