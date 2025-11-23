const express = require('express');
const router = express.Router();
const {
  createHostel,
  getMyHostels,
  updateHostel,
  uploadHostelMedia,
  createRoom,
  getHostelRooms,
  updateRoom,
  uploadRoomMedia,
  deleteRoomPanorama,
  getMyTenants,
  getHostelTenants,
  approveTenantContract,
  terminateTenantContract,
  getDeletionRequests,
  approveDeletionRequest,
  rejectDeletionRequest,
  getHostelFeedbacks,
} = require('../controllers/ownerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);
router.use(authorize('owner'));

router.route('/hostels')
  .post(createHostel)
  .get(getMyHostels);

router.route('/hostels/:id')
  .put(updateHostel)
  .delete(require('../controllers/ownerController').deleteHostel);

router.post('/hostels/:id/upload', upload.array('files', 10), uploadHostelMedia);
router.delete('/hostels/:id/media', require('../controllers/ownerController').deleteHostelMedia);

router.route('/hostels/:id/rooms')
  .post(createRoom)
  .get(getHostelRooms);

router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', require('../controllers/ownerController').deleteRoom);
router.post('/rooms/:id/upload', upload.fields([
  { name: 'photos', maxCount: 10 },
  { name: 'video', maxCount: 1 },
  { name: 'view360', maxCount: 1 },
  { name: 'panorama', maxCount: 1 }
]), uploadRoomMedia);
router.delete('/rooms/:id/panorama', deleteRoomPanorama);

// Tenant management routes
router.get('/tenants', getMyTenants);
router.get('/hostels/:id/tenants', getHostelTenants);
router.post('/tenants/:contractId/approve', approveTenantContract);
router.post('/tenants/:contractId/terminate', terminateTenantContract);

// Deletion request routes
router.get('/deletion-requests', getDeletionRequests);
router.put('/deletion-requests/:id/approve', approveDeletionRequest);
router.put('/deletion-requests/:id/reject', rejectDeletionRequest);

// Feedback routes
router.get('/feedbacks', getHostelFeedbacks);

module.exports = router;
