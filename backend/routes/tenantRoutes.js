const express = require('express');
const router = express.Router();
const {
  searchHostels,
  getHostelDetails,
  getMyExpenses,
  addExpense,
  deleteExpense,
  submitFeedback,
  submitOrderFeedback,
  getMyContracts,
  createBookingOrder,
  bookRoom,
  requestAccountDeletion,
  getMyDeletionRequest,
  cancelDeletionRequest,
  getMyFeedbacks,
  sendSOSAlert,
  getSOSHistory,
} = require('../controllers/tenantController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('tenant'));

router.get('/hostels/search', searchHostels);
router.get('/hostels/:id', getHostelDetails);
router.get('/expenses', getMyExpenses);
router.post('/expenses', addExpense);
router.delete('/expenses/:id', deleteExpense);
router.post('/feedback', submitFeedback);
router.get('/feedbacks', getMyFeedbacks);
router.post('/orders/:orderId/feedback', submitOrderFeedback);
router.get('/contracts', getMyContracts);
router.post('/create-booking-order', createBookingOrder);
router.post('/book-room', bookRoom);
router.post('/deletion-request', requestAccountDeletion);
router.get('/deletion-request', getMyDeletionRequest);
router.delete('/deletion-request/:id', cancelDeletionRequest);
router.post('/sos', sendSOSAlert);
router.get('/sos/history', getSOSHistory);

module.exports = router;
