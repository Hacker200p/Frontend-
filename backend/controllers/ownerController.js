const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const cloudinary = require('../config/cloudinary');

// @desc    Create new hostel
// @route   POST /api/owner/hostels
// @access  Private/Owner
const createHostel = async (req, res) => {
  try {
    const hostelData = {
      ...req.body,
      owner: req.user.id,
    };

    const hostel = await Hostel.create(hostelData);

    // Add hostel to user's owned hostels
    req.user.ownedHostels.push(hostel._id);
    await req.user.save();

    res.status(201).json({ success: true, data: hostel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get owner's hostels
// @route   GET /api/owner/hostels
// @access  Private/Owner
const getMyHostels = async (req, res) => {
  try {
    const hostels = await Hostel.find({ owner: req.user.id })
      .populate('canteen')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: hostels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update hostel
// @route   PUT /api/owner/hostels/:id
// @access  Private/Owner
const updateHostel = async (req, res) => {
  try {
    let hostel = await Hostel.findById(req.params.id);

    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    // Check ownership
    if (hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    hostel = await Hostel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: hostel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload hostel photos/videos
// @route   POST /api/owner/hostels/:id/upload
// @access  Private/Owner
const uploadHostelMedia = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);

    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    if (hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const files = req.files;
    const uploadPromises = [];

    for (const file of files) {
      const uploadPromise = new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto', folder: 'safestay/hostels' },
          (error, result) => {
            if (error) reject(error);
            else resolve({ url: result.secure_url, publicId: result.public_id });
          }
        );
        stream.end(file.buffer);
      });
      uploadPromises.push(uploadPromise);
    }

    const uploadedFiles = await Promise.all(uploadPromises);

    // Separate photos and videos
    uploadedFiles.forEach(file => {
      if (file.url.includes('video')) {
        hostel.video360.push(file);
      } else {
        hostel.photos.push(file);
      }
    });

    await hostel.save();

    res.json({ success: true, data: hostel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create room
// @route   POST /api/owner/hostels/:id/rooms
// @access  Private/Owner
const createRoom = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);

    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    if (hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const room = await Room.create({
      ...req.body,
      hostel: hostel._id,
    });

    hostel.totalRooms += 1;
    if (room.isAvailable) {
      hostel.availableRooms += 1;
    }

    await hostel.save();

    res.status(201).json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get hostel rooms
// @route   GET /api/owner/hostels/:id/rooms
// @access  Private/Owner
const getHostelRooms = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);

    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    if (hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const rooms = await Room.find({ hostel: hostel._id }).populate('tenants', 'name email phone');

    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update room
// @route   PUT /api/owner/rooms/:id
// @access  Private/Owner
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('hostel');

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: updatedRoom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createHostel,
  getMyHostels,
  updateHostel,
  uploadHostelMedia,
  createRoom,
  getHostelRooms,
  updateRoom,
};
