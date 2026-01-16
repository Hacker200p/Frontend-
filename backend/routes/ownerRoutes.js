import express from 'express';
const router = express.Router();
import {
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
  deleteHostel,
  deleteHostelMedia,
  deleteRoom,
} from '../controllers/ownerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

router.use(protect);
router.use(authorize('owner'));

router.route('/hostels')
  .post(createHostel)
  .get(getMyHostels);

router.route('/hostels/:id')
  .put(updateHostel)
  .delete(deleteHostel);

router.post('/hostels/:id/upload', upload.array('files', 10), uploadHostelMedia);
router.delete('/hostels/:id/media', deleteHostelMedia);

router.route('/hostels/:id/rooms')
  .post(createRoom)
  .get(getHostelRooms);

router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', deleteRoom);
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

export default router;
