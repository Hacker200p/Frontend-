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
} = require('../controllers/tenantController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('tenant'));

router.get('/hostels/search', searchHostels);
router.get('/hostels/:id', getHostelDetails);
router.get('/expenses', getMyExpenses);
router.post('/expenses', addExpense);
router.post('/feedback', submitFeedback);
router.get('/contracts', getMyContracts);
router.post('/create-booking-order', createBookingOrder);
router.post('/book-room', bookRoom);

module.exports = router;
