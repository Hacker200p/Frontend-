import express from 'express';
const router = express.Router();
import {
  createContract,
  getContract,
  signContract,
  uploadContractDocument,
  terminateContract,
  getOwnerContracts,
} from '../controllers/contractController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

router.use(protect);

router.post('/', authorize('owner'), createContract);
router.get('/owner/contracts', authorize('owner'), getOwnerContracts);
router.get('/:id', getContract);
router.put('/:id/sign', signContract);
router.post('/:id/upload', authorize('owner'), upload.single('document'), uploadContractDocument);
router.put('/:id/terminate', authorize('owner', 'master_admin'), terminateContract);

export default router;
