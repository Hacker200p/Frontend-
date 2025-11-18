const express = require('express');
const router = express.Router();
const {
  searchHostels,
  getHostelDetails,
  getMyExpenses,
  addExpense,
  submitFeedback,
  getMyContracts,
  createBookingOrder,
  bookRoom,
  createExpenseOrder,
  verifyExpensePayment,
} = require('../controllers/tenantController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public routes (no authentication required)
router.get('/hostels/search', searchHostels);
router.get('/hostels/:id', getHostelDetails);

// Protected tenant routes
router.use(protect);
router.use(authorize('tenant'));

router.get('/expenses', getMyExpenses);
router.post('/expenses', addExpense);
router.post('/feedback', submitFeedback);
router.get('/contracts', getMyContracts);
router.post('/create-booking-order', createBookingOrder);
router.post('/book-room', bookRoom);
router.post('/create-expense-order', createExpenseOrder);
router.post('/verify-expense-payment', verifyExpensePayment);

module.exports = router;
