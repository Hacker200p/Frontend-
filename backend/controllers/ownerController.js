const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');
const DeletionRequest = require('../models/DeletionRequest');
const Contract = require('../models/Contract');
const Feedback = require('../models/Feedback');
const axios = require('axios');
const FormData = require('form-data');

// Panorama service URL from environment
const PANORAMA_SERVICE_URL = process.env.PANORAMA_SERVICE_URL || 'http://localhost:5001';

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

    // Delete panorama from Cloudinary if exists
    if (room.panorama?.publicId) {
      try {
        await cloudinary.uploader.destroy(room.panorama.publicId);
        console.log('Deleted panorama from Cloudinary:', room.panorama.publicId);
      } catch (deleteError) {
        console.error('Error deleting panorama:', deleteError.message);
      }
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

    // Handle panorama upload - send to Python service then upload to Cloudinary
    if (files.panorama && files.panorama[0]) {
      try {
        // Delete old panorama from Cloudinary if exists
        if (room.panorama?.publicId) {
          try {
            await cloudinary.uploader.destroy(room.panorama.publicId);
            console.log('Deleted old panorama from Cloudinary:', room.panorama.publicId);
          } catch (deleteError) {
            console.error('Error deleting old panorama:', deleteError.message);
          }
        }
        
        const formData = new FormData();
        formData.append('file', files.panorama[0].buffer, files.panorama[0].originalname);
        formData.append('width', '4096'); // High quality for Three.js
        
        const panoramaResponse = await axios.post(
          `${PANORAMA_SERVICE_URL}/stitch-base64`,
          formData,
          {
            headers: formData.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 60000, // 60 second timeout
          }
        );

        if (panoramaResponse.data.success && panoramaResponse.data.imageBase64) {
          // Upload base64 image to Cloudinary
          const cloudinaryResult = await cloudinary.uploader.upload(
            `data:image/jpeg;base64,${panoramaResponse.data.imageBase64}`,
            {
              resource_type: 'image',
              folder: 'safestay/rooms/panoramas',
              transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
              ]
            }
          );

          room.panorama = {
            url: cloudinaryResult.secure_url,
            publicId: cloudinaryResult.public_id,
            originalFilename: files.panorama[0].originalname,
            uploadedAt: new Date(),
            dimensions: {
              width: panoramaResponse.data.width,
              height: panoramaResponse.data.height
            }
          };
          
          console.log('Panorama uploaded to Cloudinary:', cloudinaryResult.public_id);
        }
      } catch (panoramaError) {
        console.error('Panorama upload error:', panoramaError.message);
        // Continue without panorama if it fails
      }
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

// @desc    Accept/Approve tenant booking (change status to active)
// @route   POST /api/owner/tenants/:contractId/approve
// @access  Private/Owner
const approveTenantContract = async (req, res) => {
  try {
    const Contract = require('../models/Contract');
    
    const contract = await Contract.findById(req.params.contractId)
      .populate('hostel', 'owner')
      .populate('room')
      .populate('tenant', 'name email');

    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    if (contract.hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (contract.status === 'active') {
      return res.status(400).json({ success: false, message: 'Contract is already active' });
    }

    // Update contract status to active
    contract.status = 'active';
    
    // Add tenant to room's tenant list
    const room = contract.room;
    if (!room.tenants.includes(contract.tenant._id)) {
      room.tenants.push(contract.tenant._id);
    }
    
    // Update room occupancy and availability
    room.currentOccupancy = room.tenants.length;
    
    if (room.currentOccupancy >= room.capacity) {
      room.isAvailable = false;
    }
    
    await room.save();
    
    // Update hostel available rooms count
    const hostel = await Hostel.findById(contract.hostel._id);
    if (hostel) {
      hostel.availableRooms = Math.max(0, (hostel.availableRooms || 0) - 1);
      await hostel.save();
    }
    
    await contract.save();

    res.json({ success: true, message: 'Booking approved successfully', data: contract });
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
    
    // Remove tenant from room's tenants array
    room.tenants = room.tenants.filter(t => t.toString() !== contract.tenant.toString());
    
    // Update occupancy based on actual tenant count
    room.currentOccupancy = room.tenants.length;
    
    // Make room available if under capacity
    if (room.currentOccupancy < room.capacity) {
      room.isAvailable = true;
    }
    
    await room.save();

    // Update hostel available rooms count
    const hostel = await Hostel.findById(contract.hostel._id);
    if (hostel) {
      hostel.availableRooms = Math.min(hostel.totalRooms || 100, (hostel.availableRooms || 0) + 1);
      await hostel.save();
    }

    res.json({ success: true, message: 'Contract terminated successfully', data: contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get deletion requests for owner's hostels
// @route   GET /api/owner/deletion-requests
// @access  Private/Owner
const getDeletionRequests = async (req, res) => {
  try {
    const { status } = req.query;
    
    const query = { owner: req.user.id };
    if (status) {
      query.status = status;
    }

    const deletionRequests = await DeletionRequest.find(query)
      .populate('tenant', 'name email phone')
      .populate('hostel', 'name address')
      .populate('contract', 'contractNumber monthlyRent startDate endDate')
      .sort({ requestedAt: -1 });

    res.json({ success: true, data: deletionRequests });
  } catch (error) {
    console.error('Get deletion requests error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve deletion request and delete tenant account
// @route   PUT /api/owner/deletion-requests/:id/approve
// @access  Private/Owner
const approveDeletionRequest = async (req, res) => {
  try {
    const { message } = req.body;

    const deletionRequest = await DeletionRequest.findOne({
      _id: req.params.id,
      owner: req.user.id,
      status: 'pending'
    });

    if (!deletionRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Deletion request not found or already processed' 
      });
    }

    // Update deletion request status
    deletionRequest.status = 'approved';
    deletionRequest.ownerResponse = {
      message: message || 'Deletion request approved',
      respondedAt: new Date()
    };
    await deletionRequest.save();

    // Update contracts to terminated before deleting user
    await Contract.updateMany(
      { tenant: deletionRequest.tenant, status: 'active' },
      { status: 'terminated' }
    );

    // Remove tenant from room
    if (deletionRequest.contract) {
      const contract = await Contract.findById(deletionRequest.contract);
      if (contract && contract.room) {
        const room = await Room.findById(contract.room);
        if (room) {
          room.tenants = room.tenants.filter(t => t.toString() !== deletionRequest.tenant.toString());
          room.currentOccupancy = Math.max(0, room.currentOccupancy - 1);
          await room.save();
        }
      }
    }

    // Populate tenant info before deletion for response
    await deletionRequest.populate([
      { path: 'tenant', select: 'name email phone' },
      { path: 'hostel', select: 'name address' }
    ]);

    const deletionResponse = {
      success: true,
      message: 'Deletion request approved and tenant account deleted',
      data: deletionRequest
    };

    // Actually delete the tenant account (allows re-registration with same email)
    await User.findByIdAndDelete(deletionRequest.tenant);

    res.json(deletionResponse);
  } catch (error) {
    console.error('Approve deletion request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject deletion request
// @route   PUT /api/owner/deletion-requests/:id/reject
// @access  Private/Owner
const rejectDeletionRequest = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rejection reason is required' 
      });
    }

    const deletionRequest = await DeletionRequest.findOne({
      _id: req.params.id,
      owner: req.user.id,
      status: 'pending'
    });

    if (!deletionRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Deletion request not found or already processed' 
      });
    }

    deletionRequest.status = 'rejected';
    deletionRequest.ownerResponse = {
      message: message.trim(),
      respondedAt: new Date()
    };
    await deletionRequest.save();

    await deletionRequest.populate([
      { path: 'tenant', select: 'name email phone' },
      { path: 'hostel', select: 'name address' }
    ]);

    res.json({ 
      success: true, 
      message: 'Deletion request rejected',
      data: deletionRequest 
    });
  } catch (error) {
    console.error('Reject deletion request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get feedbacks for owner's hostels (latest rating per tenant only)
// @route   GET /api/owner/feedbacks
// @access  Private/Owner
const getHostelFeedbacks = async (req, res) => {
  try {
    // Get all hostels owned by this owner
    const hostels = await Hostel.find({ owner: req.user.id }).select('_id name');
    const hostelIds = hostels.map(h => h._id);

    // Get all feedbacks for these hostels, grouped by user and hostel
    // For each user-hostel combination, only get the latest feedback
    const feedbacks = await Feedback.aggregate([
      {
        $match: {
          targetType: 'hostel',
          targetId: { $in: hostelIds }
        }
      },
      // Sort by createdAt descending to get latest first
      {
        $sort: { createdAt: -1 }
      },
      // Group by user and targetId (hostel) to get only the latest feedback per user per hostel
      {
        $group: {
          _id: {
            user: '$user',
            targetId: '$targetId'
          },
          doc: { $first: '$$ROOT' } // Take the first (latest) document
        }
      },
      // Replace root with the document
      {
        $replaceRoot: { newRoot: '$doc' }
      },
      // Sort again by createdAt descending for display
      {
        $sort: { createdAt: -1 }
      }
    ]);

    // Populate user and targetId fields manually since aggregate doesn't support populate
    await Feedback.populate(feedbacks, [
      { path: 'user', select: 'name email' },
      { path: 'targetId', select: 'name address' }
    ]);

    res.json({ success: true, data: feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete room panorama
// @route   DELETE /api/owner/rooms/:id/panorama
// @access  Private/Owner
const deleteRoomPanorama = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('hostel');
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    if (room.hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!room.panorama || !room.panorama.filename) {
      return res.status(404).json({ success: false, message: 'No panorama found' });
    }

    // Delete from Python service
    try {
      await axios.delete(`${PANORAMA_SERVICE_URL}/panorama/${room.panorama.filename}`);
    } catch (deleteError) {
      console.error('Failed to delete panorama from service:', deleteError.message);
      // Continue even if deletion fails on the service
    }

    // Remove from database
    room.panorama = undefined;
    await room.save();

    res.json({ success: true, message: 'Panorama deleted successfully' });
  } catch (error) {
    console.error('Delete panorama error:', error);
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
  deleteRoomPanorama,
  getMyTenants,
  getHostelTenants,
  approveTenantContract,
  terminateTenantContract,
  getDeletionRequests,
  approveDeletionRequest,
  rejectDeletionRequest,
  getHostelFeedbacks,
};
