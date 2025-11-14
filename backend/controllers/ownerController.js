const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');

// @desc    Create new hostel
// @route   POST /api/owner/hostels
// @access  Private/Owner
const createHostel = async (req, res) => {
  try {
    // Mark hostels created by owners as verified by default
    // (requirement: change verification status to 'verified' once the hostel owner adds it)
    const hostelData = {
      ...req.body,
      owner: req.user.id,
      verificationStatus: 'verified',
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

// @desc    Delete hostel and its rooms
// @route   DELETE /api/owner/hostels/:id
// @access  Private/Owner
const deleteHostel = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }
    if (hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Optionally remove media from Cloudinary
    const destroyPromises = [];
    (hostel.photos || []).forEach((p) => {
      if (p.publicId) {
        destroyPromises.push(cloudinary.uploader.destroy(p.publicId, { resource_type: 'image' }));
      }
    });
    (hostel.video360 || []).forEach((v) => {
      if (v.publicId) {
        destroyPromises.push(cloudinary.uploader.destroy(v.publicId, { resource_type: 'video' }));
      }
    });
    await Promise.allSettled(destroyPromises);

    await Room.deleteMany({ hostel: hostel._id });

    // Remove from user's ownedHostels
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        user.ownedHostels = (user.ownedHostels || []).filter(
          (hId) => hId.toString() !== hostel._id.toString()
        );
        await user.save();
      }
    } catch {}

    await hostel.deleteOne();

    res.json({ success: true, message: 'Hostel deleted' });
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

// @desc    Delete a media item by publicId
// @route   DELETE /api/owner/hostels/:id/media
// @access  Private/Owner
const deleteHostelMedia = async (req, res) => {
  try {
    const { publicId } = req.query;
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }
    if (hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'publicId is required' });
    }

    // Remove from arrays
    hostel.photos = (hostel.photos || []).filter((p) => p.publicId !== publicId);
    hostel.video360 = (hostel.video360 || []).filter((v) => v.publicId !== publicId);

    // Try destroy both types (image/video)
    await Promise.allSettled([
      cloudinary.uploader.destroy(publicId, { resource_type: 'image' }),
      cloudinary.uploader.destroy(publicId, { resource_type: 'video' }),
    ]);

    await hostel.save();

    res.json({ success: true, message: 'Media removed', data: hostel });
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

    // Extract numberOfRooms from request body (default to 1 if not provided)
    const { numberOfRooms = 1, roomNumber, ...roomData } = req.body;
    const numRooms = parseInt(numberOfRooms);

    // Create multiple rooms in a loop
    const createdRooms = [];
    let availableCount = 0;

    for (let i = 0; i < numRooms; i++) {
      const room = await Room.create({
        ...roomData,
        roomNumber: numRooms === 1 ? roomNumber : `${roomNumber}-${i + 1}`,
        hostel: hostel._id,
      });
      
      createdRooms.push(room);
      
      if (room.isAvailable) {
        availableCount++;
      }
    }

    // Update hostel's total and available room counts
    hostel.totalRooms += numRooms;
    hostel.availableRooms += availableCount;

    await hostel.save();

    res.status(201).json({ 
      success: true, 
      data: createdRooms,
      message: `${numRooms} room(s) created successfully`
    });
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

// @desc    Delete room
// @route   DELETE /api/owner/rooms/:id
// @access  Private/Owner
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('hostel');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    if (room.hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await room.deleteOne();

    // Update hostel counters
    const hostel = await Hostel.findById(room.hostel._id);
    if (hostel) {
      hostel.totalRooms = Math.max((hostel.totalRooms || 0) - 1, 0);
      if (room.isAvailable) {
        hostel.availableRooms = Math.max((hostel.availableRooms || 0) - 1, 0);
      }
      await hostel.save();
    }

    res.json({ success: true, message: 'Room deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload room media (photos, video, 360 view)
// @route   POST /api/owner/rooms/:id/upload
// @access  Private/Owner
const uploadRoomMedia = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('hostel');
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    if (room.hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const files = req.files;
    
    // Handle photos
    if (files.photos) {
      const photoPromises = files.photos.map(file => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'image', folder: 'safestay/rooms/photos' },
            (error, result) => {
              if (error) reject(error);
              else resolve({ url: result.secure_url, publicId: result.public_id });
            }
          );
          stream.end(file.buffer);
        });
      });
      
      const uploadedPhotos = await Promise.all(photoPromises);
      room.photos.push(...uploadedPhotos);
    }
    
    // Handle video
    if (files.video && files.video[0]) {
      const videoResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'video', folder: 'safestay/rooms/videos' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.end(files.video[0].buffer);
      });
      room.videoUrl = videoResult;
    }
    
    // Handle 360 view
    if (files.view360 && files.view360[0]) {
      const view360Result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'safestay/rooms/360views' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        stream.end(files.view360[0].buffer);
      });
      room.view360Url = view360Result;
    }
    
    await room.save();
    
    res.json({ success: true, data: room, message: 'Media uploaded successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all tenants across owner's hostels
// @route   GET /api/owner/tenants
// @access  Private/Owner
const getMyTenants = async (req, res) => {
  try {
    const Contract = require('../models/Contract');
    
    // Get all hostels owned by this owner
    const hostels = await Hostel.find({ owner: req.user.id }).select('_id name');
    const hostelIds = hostels.map(h => h._id);

    // Get all contracts for these hostels
    const contracts = await Contract.find({ 
      hostel: { $in: hostelIds },
      status: { $in: ['active', 'pending_signatures', 'draft'] }
    })
    .populate('tenant', 'name email phone')
    .populate('hostel', 'name address')
    .populate('room', 'roomNumber floor roomType')
    .sort({ createdAt: -1 });

    res.json({ success: true, data: contracts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tenants for a specific hostel
// @route   GET /api/owner/hostels/:id/tenants
// @access  Private/Owner
const getHostelTenants = async (req, res) => {
  try {
    const Contract = require('../models/Contract');
    
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    if (hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const contracts = await Contract.find({ 
      hostel: req.params.id,
      status: { $in: ['active', 'pending_signatures', 'draft'] }
    })
    .populate('tenant', 'name email phone')
    .populate('room', 'roomNumber floor roomType capacity currentOccupancy')
    .sort({ createdAt: -1 });

    res.json({ success: true, data: contracts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove tenant from room (terminate contract)
// @route   POST /api/owner/tenants/:contractId/terminate
// @access  Private/Owner
const terminateTenantContract = async (req, res) => {
  try {
    const Contract = require('../models/Contract');
    
    const contract = await Contract.findById(req.params.contractId)
      .populate('hostel', 'owner')
      .populate('room');

    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    if (contract.hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Update contract status
    contract.status = 'terminated';
    contract.endDate = new Date();
    await contract.save();

    // Update room availability
    const room = contract.room;
    if (room.currentOccupancy > 0) {
      room.currentOccupancy -= 1;
    }
    if (room.currentOccupancy < room.capacity) {
      room.isAvailable = true;
    }
    
    // Remove tenant from room's tenants array
    room.tenants = room.tenants.filter(t => t.toString() !== contract.tenant.toString());
    await room.save();

    res.json({ success: true, message: 'Contract terminated successfully', data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createHostel,
  getMyHostels,
  updateHostel,
  deleteHostel,
  uploadHostelMedia,
  deleteHostelMedia,
  createRoom,
  getHostelRooms,
  updateRoom,
  deleteRoom,
  uploadRoomMedia,
  getMyTenants,
  getHostelTenants,
  terminateTenantContract,
};
