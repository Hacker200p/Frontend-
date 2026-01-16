import express from 'express';
const router = express.Router();
import {
  getAllUsers,
  getDashboardStats,
  verifyHostel,
  toggleUserStatus,
  getAllHostels,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

router.use(protect);
router.use(authorize('master_admin'));

router.get('/users', getAllUsers);
router.get('/stats', getDashboardStats);
router.get('/hostels', getAllHostels);
router.put('/hostels/:id/verify', verifyHostel);
router.put('/users/:id/toggle-status', toggleUserStatus);

export default router;
