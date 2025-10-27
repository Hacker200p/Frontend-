const express = require('express');
const router = express.Router();
const {
  createContract,
  getContract,
  signContract,
  uploadContractDocument,
  terminateContract,
  getOwnerContracts,
} = require('../controllers/contractController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.post('/', authorize('owner'), createContract);
router.get('/owner/contracts', authorize('owner'), getOwnerContracts);
router.get('/:id', getContract);
router.put('/:id/sign', signContract);
router.post('/:id/upload', authorize('owner'), upload.single('document'), uploadContractDocument);
router.put('/:id/terminate', authorize('owner', 'master_admin'), terminateContract);

module.exports = router;
