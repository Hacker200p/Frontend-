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
  .put(updateHostel);

router.post('/hostels/:id/upload', upload.array('files', 10), uploadHostelMedia);

router.route('/hostels/:id/rooms')
  .post(createRoom)
  .get(getHostelRooms);

router.put('/rooms/:id', updateRoom);

module.exports = router;
