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
  getMyTenants,
  getHostelTenants,
  terminateTenantContract,
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
  { name: 'view360', maxCount: 1 }
]), uploadRoomMedia);

// Tenant management routes
router.get('/tenants', getMyTenants);
router.get('/hostels/:id/tenants', getHostelTenants);
router.post('/tenants/:contractId/terminate', terminateTenantContract);

module.exports = router;
