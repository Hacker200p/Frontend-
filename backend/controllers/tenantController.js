const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Order = require('../models/Order');
const Expense = require('../models/Expense');
const Feedback = require('../models/Feedback');
const Contract = require('../models/Contract');
const DeletionRequest = require('../models/DeletionRequest');
const User = require('../models/User');
const SOS = require('../models/SOS');
const { sendSMS } = require('../utils/sendSMS');
const { sendEmail } = require('../utils/sendEmail');

// @desc    Search hostels
// @route   GET /api/tenant/hostels/search OR /api/hostels/search (public)
// @access  Private/Tenant or Public
const searchHostels = async (req, res) => {
  try {
    const { city, hostelType, minPrice, maxPrice, page = 1, limit = 10, showAll, search } = req.query;
    
    // If showAll is true or user is not authenticated, don't filter by verification status
    const isPublicAccess = !req.user;
    const query = (showAll === 'true' || isPublicAccess) ? {} : { verificationStatus: 'verified', isActive: true };

    // Handle general search parameter (case-insensitive search across name, city, state)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { 'address.city': searchRegex },
        { 'address.state': searchRegex },
        { city: searchRegex },
        { state: searchRegex }
      ];
    }
    
    if (city) query['address.city'] = new RegExp(city, 'i');
    if (hostelType) query.hostelType = hostelType;
    if (minPrice || maxPrice) {
      query['priceRange.min'] = { $gte: minPrice || 0 };
      query['priceRange.max'] = { $lte: maxPrice || 999999 };
    }

    let hostels = await Hostel.find(query)
      .populate('owner', 'name phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1 });

    // If no verified hostels found, try getting all hostels with location data
    if (hostels.length === 0 && showAll !== 'true') {
      console.log('No verified hostels found, fetching all hostels...');
      hostels = await Hostel.find({})
        .populate('owner', 'name phone')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ rating: -1 });
    }
    
    // Log hostel data for debugging
    console.log(`Found ${hostels.length} hostels`)
    hostels.forEach((h, idx) => {
      console.log(`Hostel ${idx + 1}: ${h.name}`)
      console.log(`  - Location: ${JSON.stringify(h.location)}`)
      console.log(`  - Photos: ${h.photos?.length || 0} photos`)
      if (h.photos?.length > 0) {
        console.log(`  - First photo URL: ${h.photos[0].url}`)
      }
    })

    const count = await Hostel.countDocuments(query);

    res.json({
      success: true,
      data: hostels,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalHostels: count,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get hostel details
// @route   GET /api/tenant/hostels/:id
// @access  Private/Tenant
const getHostelDetails = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate('canteen');

    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    const rooms = await Room.find({ hostel: hostel._id, isAvailable: true });

    res.json({ success: true, data: { hostel, rooms } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tenant's expenses
// @route   GET /api/tenant/expenses
// @access  Private/Tenant
const getMyExpenses = async (req, res) => {
  try {
    const { year, month } = req.query;
    const query = { tenant: req.user.id };

    if (year) query.year = parseInt(year);
    if (month) query.month = parseInt(month);

    const expenses = await Expense.find(query).sort({ year: -1, month: -1 });

    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add/Update monthly expense
// @route   POST /api/tenant/expenses
// @access  Private/Tenant
const addExpense = async (req, res) => {
  try {
    const { month, year, rent, electricity, water, food, maintenance, other, notes } = req.body;

    console.log('Adding expense for user:', req.user.id);
    console.log('Expense data:', { month, year, rent, electricity, water, food, maintenance, other, notes });

    const totalExpense = (rent || 0) + (electricity || 0) + (water || 0) + 
                        (food || 0) + (maintenance || 0) + 
                        (other || []).reduce((sum, item) => sum + (item.amount || 0), 0);

    const expense = await Expense.findOneAndUpdate(
      { tenant: req.user.id, month, year },
      { rent, electricity, water, food, maintenance, other, totalExpense, notes },
      { new: true, upsert: true, runValidators: true }
    );

    console.log('Expense saved:', expense);

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/tenant/expenses/:id
// @access  Private/Tenant
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (expense.tenant.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this expense' });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit feedback
// @route   POST /api/tenant/feedback
// @access  Private/Tenant
const submitFeedback = async (req, res) => {
  try {
    const { targetType, targetId, rating, comment } = req.body;

    console.log('Submit feedback request:', { targetType, targetId, rating, comment, userId: req.user.id });

    // Check if user already has feedback for this target
    let feedback = await Feedback.findOne({
      user: req.user.id,
      targetType,
      targetId
    });

    console.log('Existing feedback found:', feedback);

    if (feedback) {
      // Update existing feedback
      console.log('Updating existing feedback...');
      feedback.rating = rating;
      feedback.comment = comment;
      await feedback.save();
      console.log('Feedback updated:', feedback);
    } else {
      // Create new feedback
      console.log('Creating new feedback...');
      feedback = await Feedback.create({
        user: req.user.id,
        targetType,
        targetId,
        rating,
        comment,
      });
      console.log('Feedback created:', feedback);
    }

    // Update rating for target
    if (targetType === 'hostel') {
      const hostel = await Hostel.findById(targetId);
      
      // Get all unique feedbacks (latest per user)
      const allFeedbacks = await Feedback.find({ targetType: 'hostel', targetId });
      
      // Group by user and get only latest feedback per user
      const latestFeedbacksMap = new Map();
      allFeedbacks.forEach(fb => {
        const userId = fb.user.toString();
        const existing = latestFeedbacksMap.get(userId);
        if (!existing || new Date(fb.updatedAt) > new Date(existing.updatedAt)) {
          latestFeedbacksMap.set(userId, fb);
        }
      });
      
      const latestFeedbacks = Array.from(latestFeedbacksMap.values());
      const avgRating = latestFeedbacks.reduce((sum, f) => sum + f.rating, 0) / latestFeedbacks.length;
      
      hostel.rating = avgRating;
      hostel.reviewCount = latestFeedbacks.length;
      await hostel.save();
    }

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tenant's contracts
// @route   GET /api/tenant/contracts
// @access  Private/Tenant
const getMyContracts = async (req, res) => {
  try {
    const contracts = await Contract.find({ tenant: req.user.id })
      .populate('hostel', 'name address')
      .populate({
        path: 'room',
        select: 'roomNumber floor capacity currentOccupancy roomType',
        populate: {
          path: 'tenants',
          select: 'name email phone'
        }
      })
      .populate('owner', 'name phone email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: contracts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create payment order for room booking
// @route   POST /api/tenant/create-booking-order
// @access  Private/Tenant
const createBookingOrder = async (req, res) => {
  try {
    const { roomId, hostelId } = req.body;

    // Check if room exists and is available
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (!room.isAvailable) {
      return res.status(400).json({ success: false, message: 'Room is not available' });
    }

    // Calculate total amount (first month rent + security deposit)
    const amount = room.rent + room.securityDeposit;

    // Check if Razorpay is configured
    const razorpay = require('../config/razorypay');
    if (!razorpay) {
      // If Razorpay not configured, allow booking without payment for testing
      return res.status(200).json({
        success: true,
        testMode: true,
        order: {
          id: `test_order_${Date.now()}`,
          amount: amount,
          currency: 'INR',
          roomNumber: room.roomNumber,
          rent: room.rent,
          securityDeposit: room.securityDeposit
        },
        razorpayKeyId: 'test_key',
        message: 'Test mode - Razorpay not configured. Use test payment flow.'
      });
    }

    const options = {
      amount: amount * 100, // amount in paise
      currency: 'INR',
      receipt: `BK_${Date.now().toString().slice(-10)}`, // Max 40 chars, using last 10 digits of timestamp
      notes: {
        roomId,
        hostelId,
        tenantId: req.user.id,
        type: 'room_booking'
      }
    };

    const order = await razorpay.orders.create(options);

    console.log('✓ Razorpay order created successfully:', order.id);

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: amount,
        currency: 'INR',
        roomNumber: room.roomNumber,
        rent: room.rent,
        securityDeposit: room.securityDeposit
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('❌ Create order error:', error);
    console.error('Error details:', {
      message: error.message,
      statusCode: error.statusCode,
      error: error.error
    });
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create payment order. Please check Razorpay configuration.'
    });
  }
};

// @desc    Book a room after payment verification
// @route   POST /api/tenant/book-room
// @access  Private/Tenant
const bookRoom = async (req, res) => {
  try {
    const { roomId, hostelId, startDate, endDate, additionalInfo, paymentDetails } = req.body;

    // Validate required fields
    if (!roomId || !hostelId || !startDate || !paymentDetails) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room ID, Hostel ID, Start Date, and Payment Details are required' 
      });
    }

    // Validate minimum booking duration (1 month)
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.setMonth(start.getMonth() + 11));
    const diffTime = Math.abs(end - new Date(startDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return res.status(400).json({ 
        success: false, 
        message: 'Minimum booking duration is 1 month (30 days)' 
      });
    }

    // Verify payment signature
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentDetails;
    
    // Skip verification for test mode
    if (!razorpay_order_id.startsWith('test_order_')) {
      const crypto = require('crypto');
      const sign = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest('hex');

      if (razorpay_signature !== expectedSign) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature' });
      }
    }

    // Check if room exists and is available
    const room = await Room.findById(roomId).populate('hostel');
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (!room.isAvailable) {
      return res.status(400).json({ success: false, message: 'Room is not available' });
    }

    // Check if hostel exists
    const hostel = await Hostel.findById(hostelId).populate('owner');
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    // Check if tenant already has ANY active or pending booking (prevent multiple bookings)
    const existingContract = await Contract.findOne({
      tenant: req.user.id,
      status: { $in: ['pending_signatures', 'active', 'draft'] }
    });

    if (existingContract) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have an active or pending booking. Please wait for approval or cancel your existing booking first.' 
      });
    }

    // Generate contract number
    const contractNumber = `CNT${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create contract
    const contract = await Contract.create({
      contractNumber,
      tenant: req.user.id,
      hostel: hostelId,
      room: roomId,
      owner: hostel.owner._id,
      startDate,
      endDate: endDate || new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 11)), // Default 11 months if not provided
      monthlyRent: room.rent,
      securityDeposit: room.securityDeposit,
      status: 'pending_signatures',
      terms: [
        { clause: 'Payment Terms', description: 'Monthly rent must be paid by the 5th of each month' },
        { clause: 'Occupancy', description: `Maximum ${room.capacity} person(s) allowed` },
        { clause: 'Notice Period', description: '30 days notice required for vacating' },
        { clause: 'Additional Terms', description: additionalInfo?.terms || 'Standard terms and conditions apply' }
      ],
      penalties: [
        { penaltyType: 'Late Payment', amount: 500, description: 'Per day penalty for late rent payment' },
        { penaltyType: 'Damage', amount: 0, description: 'Repairs will be deducted from security deposit' },
        { penaltyType: 'Early Termination', amount: room.rent, description: 'One month rent if terminated before end date' }
      ],
    });

    // DON'T update room or hostel immediately - only update when owner approves the contract
    // Room occupancy, tenant list, and availability will be updated in approveTenantContract
    // This prevents rooms from being marked unavailable for pending bookings that may be rejected

    // Store payment details in contract
    contract.paymentId = razorpay_payment_id;
    contract.orderId = razorpay_order_id;
    contract.paymentStatus = 'paid';
    await contract.save();

    // Send notification email to owner
    const User = require('../models/User');
    const owner = await User.findById(hostel.owner._id);
    const tenant = await User.findById(req.user.id);
    
    if (owner && owner.email) {
      const sendEmail = require('../utils/sendEmail');
      await sendEmail({
        email: owner.email,
        subject: 'New Room Booking Request - SafeStay Hub',
        message: `
          <h2>New Room Booking Request</h2>
          <p><strong>Contract Number:</strong> ${contractNumber}</p>
          <p><strong>Tenant:</strong> ${tenant.name}</p>
          <p><strong>Phone:</strong> ${tenant.phone}</p>
          <p><strong>Room:</strong> ${room.roomNumber}</p>
          <p><strong>Hostel:</strong> ${hostel.name}</p>
          <p><strong>Monthly Rent:</strong> ₹${room.rent}</p>
          <p><strong>Security Deposit:</strong> ₹${room.securityDeposit}</p>
          <p><strong>Total Paid:</strong> ₹${room.rent + room.securityDeposit}</p>
          <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
          <p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>
          <p><strong>Payment Status:</strong> ✓ Verified & Confirmed</p>
          <p>Please review and approve the booking request.</p>
        `,
      }).catch(err => console.error('Email send error:', err));
    }

    // Populate contract data for response
    const populatedContract = await Contract.findById(contract._id)
      .populate('tenant', 'name email phone')
      .populate('hostel', 'name address')
      .populate('room', 'roomNumber floor roomType rent securityDeposit')
      .populate('owner', 'name phone');

    res.status(201).json({ 
      success: true, 
      message: 'Room booked successfully! Payment confirmed.',
      data: {
        contract: populatedContract,
        payment: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          amount: room.rent + room.securityDeposit,
          status: 'paid'
        }
      }
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit feedback for an order
// @route   POST /api/tenant/orders/:orderId/feedback
// @access  Private/Tenant
const submitOrderFeedback = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, comment } = req.body;

    // Verify order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.tenant.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to provide feedback for this order' });
    }

    // Check if order is delivered
    if (order.orderStatus !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Can only provide feedback for delivered orders' });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({ 
      targetType: 'order', 
      targetId: orderId,
      user: req.user.id 
    });

    if (existingFeedback) {
      return res.status(400).json({ success: false, message: 'Feedback already submitted for this order' });
    }

    // Create feedback
    const feedback = await Feedback.create({
      user: req.user.id,
      targetType: 'order',
      targetId: orderId,
      rating,
      comment,
    });

    // Update order with feedback reference
    order.feedback = feedback._id;
    await order.save();

    // Update canteen average rating
    const canteenFeedbacks = await Feedback.find({ 
      targetType: 'order',
      targetId: { $in: await Order.find({ canteen: order.canteen }).distinct('_id') }
    });
    
    if (canteenFeedbacks.length > 0) {
      const avgRating = canteenFeedbacks.reduce((sum, f) => sum + f.rating, 0) / canteenFeedbacks.length;
      const Canteen = require('../models/Canteen');
      await Canteen.findByIdAndUpdate(order.canteen, { 
        rating: avgRating,
        reviewCount: canteenFeedbacks.length 
      });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      data: feedback 
    });
  } catch (error) {
    console.error('Submit order feedback error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request account deletion
// @route   POST /api/tenant/deletion-request
// @access  Private/Tenant
const requestAccountDeletion = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Reason for deletion is required' });
    }

    // Get tenant's current hostel from active contract or user profile
    const tenant = await User.findById(req.user.id);

    // Get active contract if exists
    const contract = await Contract.findOne({
      tenant: req.user.id,
      status: 'active'
    }).populate('hostel owner');

    // Determine hostel and owner from contract or user profile
    let hostel, owner;
    
    if (contract) {
      hostel = contract.hostel;
      owner = contract.owner;
    } else if (tenant.currentHostel) {
      hostel = await Hostel.findById(tenant.currentHostel);
      if (hostel) {
        owner = await User.findById(hostel.owner);
      }
    }

    if (!hostel || !owner) {
      return res.status(400).json({ 
        success: false, 
        message: 'You must have an active contract or be associated with a hostel to request account deletion' 
      });
    }

    // Check if there's already a pending request
    const existingRequest = await DeletionRequest.findOne({
      tenant: req.user.id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have a pending deletion request' 
      });
    }

    // Create deletion request
    const deletionRequest = await DeletionRequest.create({
      tenant: req.user.id,
      hostel: hostel._id,
      owner: owner._id,
      contract: contract?._id,
      reason: reason.trim()
    });

    await deletionRequest.populate([
      { path: 'tenant', select: 'name email phone' },
      { path: 'hostel', select: 'name address' },
      { path: 'owner', select: 'name email phone' }
    ]);

    res.status(201).json({ 
      success: true, 
      message: 'Account deletion request sent to hostel owner',
      data: deletionRequest 
    });
  } catch (error) {
    console.error('Request account deletion error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my deletion request status
// @route   GET /api/tenant/deletion-request
// @access  Private/Tenant
const getMyDeletionRequest = async (req, res) => {
  try {
    const deletionRequest = await DeletionRequest.findOne({
      tenant: req.user.id,
      status: 'pending'
    })
      .populate('hostel', 'name address')
      .populate('owner', 'name phone email');

    res.json({ success: true, data: deletionRequest });
  } catch (error) {
    console.error('Get deletion request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel deletion request
// @route   DELETE /api/tenant/deletion-request/:id
// @access  Private/Tenant
const cancelDeletionRequest = async (req, res) => {
  try {
    const deletionRequest = await DeletionRequest.findOne({
      _id: req.params.id,
      tenant: req.user.id,
      status: 'pending'
    });

    if (!deletionRequest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Deletion request not found or already processed' 
      });
    }

    await deletionRequest.deleteOne();

    res.json({ 
      success: true, 
      message: 'Deletion request cancelled successfully' 
    });
  } catch (error) {
    console.error('Cancel deletion request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tenant's feedbacks
// @route   GET /api/tenant/feedbacks
// @access  Private/Tenant
const getMyFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user.id })
      .populate('user', 'name email')
      .sort('-createdAt');

    // Manually populate targetId based on targetType
    const Hostel = require('../models/Hostel');
    const Canteen = require('../models/Canteen');
    
    const populatedFeedbacks = await Promise.all(
      feedbacks.map(async (feedback) => {
        let target = null;
        if (feedback.targetType === 'hostel') {
          target = await Hostel.findById(feedback.targetId);
        } else if (feedback.targetType === 'canteen') {
          target = await Canteen.findById(feedback.targetId);
        }
        
        return {
          _id: feedback._id,
          rating: feedback.rating,
          comment: feedback.comment,
          targetType: feedback.targetType,
          target: target,
          createdAt: feedback.createdAt,
          updatedAt: feedback.updatedAt,
        };
      })
    );

    res.status(200).json({ success: true, data: populatedFeedbacks });
  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send SOS alert
// @route   POST /api/tenant/sos
// @access  Private/Tenant
const sendSOSAlert = async (req, res) => {
  try {
    const { type, description, location } = req.body;

    if (!type || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Emergency type and description are required' 
      });
    }

    // Get tenant's current hostel from active contract
    const activeContract = await Contract.findOne({
      tenant: req.user._id,
      status: 'active'
    }).populate('hostel');

    const sos = await SOS.create({
      tenant: req.user._id,
      hostel: activeContract?.hostel?._id || null,
      type,
      description,
      location: location || 'Current hostel location'
    });

    // Populate tenant details
    await sos.populate('tenant', 'name phone email');

    // Get hostel owner details if hostel exists
    let ownerNotified = false;
    if (activeContract?.hostel) {
      const hostel = await Hostel.findById(activeContract.hostel._id).populate('owner', 'name phone email');
      
      if (hostel && hostel.owner) {
        const owner = hostel.owner;
        const emergencyIcon = type === 'medical' ? '🏥' : type === 'fire' ? '🔥' : type === 'security' ? '🔒' : '⚠️';
        
        // Send SMS to hostel owner
        try {
          const smsMessage = `🚨 EMERGENCY SOS ALERT ${emergencyIcon}\n\nType: ${type.toUpperCase()}\nTenant: ${req.user.name}\nPhone: ${req.user.phone}\nLocation: ${location || 'Current hostel location'}\nDetails: ${description}\n\nHostel: ${hostel.name}\nPlease respond immediately!`;
          
          await sendSMS(owner.phone, smsMessage);
          console.log(`✓ SMS sent to owner: ${owner.name} (${owner.phone})`);
          ownerNotified = true;
        } catch (smsError) {
          console.error('Failed to send SMS to owner:', smsError.message);
        }

        // Send Email to hostel owner
        try {
          const emailSubject = `🚨 EMERGENCY: ${type.toUpperCase()} SOS Alert from ${req.user.name}`;
          const emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 4px solid #dc2626; border-radius: 10px; background: #fef2f2;">
              <h1 style="color: #dc2626; text-align: center; font-size: 32px;">🚨 EMERGENCY SOS ALERT ${emergencyIcon}</h1>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #991b1b; margin-top: 0;">Emergency Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">${type.toUpperCase()}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Tenant:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${req.user.name}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><a href="tel:${req.user.phone}">${req.user.phone}</a></td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${req.user.email}">${req.user.email}</a></td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Location:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${location || 'Current hostel location'}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Hostel:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${hostel.name}</td></tr>
                  <tr><td style="padding: 8px; vertical-align: top;"><strong>Description:</strong></td><td style="padding: 8px;">${description}</td></tr>
                </table>
              </div>
              
              <div style="background: #fef9c3; padding: 15px; border-radius: 8px; border: 2px solid #eab308;">
                <p style="margin: 0; color: #854d0e;"><strong>⚠️ URGENT ACTION REQUIRED:</strong> Please respond to this emergency immediately. Contact the tenant or visit the location as soon as possible.</p>
              </div>
              
              <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
                <p>Alert sent at: ${new Date().toLocaleString()}</p>
                <p>SafeStay Hub - Emergency Alert System</p>
              </div>
            </div>
          `;
          
          await sendEmail(owner.email, emailSubject, emailBody);
          console.log(`✓ Email sent to owner: ${owner.name} (${owner.email})`);
        } catch (emailError) {
          console.error('Failed to send email to owner:', emailError.message);
        }
      }
    }

    // Log to console for immediate visibility
    console.log(`🚨 EMERGENCY SOS ALERT: ${type} - ${description}`);
    console.log(`Tenant: ${req.user.name} (${req.user.phone})`);
    console.log(`Location: ${location || 'Current hostel location'}`);
    console.log(`Owner notified: ${ownerNotified ? 'Yes' : 'No'}`);

    res.status(201).json({ 
      success: true, 
      message: ownerNotified 
        ? 'SOS alert sent successfully! Hostel owner has been notified via SMS and email.' 
        : 'SOS alert recorded. Please contact hostel management directly.',
      data: sos 
    });
  } catch (error) {
    console.error('Send SOS error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get SOS history
// @route   GET /api/tenant/sos/history
// @access  Private/Tenant
const getSOSHistory = async (req, res) => {
  try {
    const sosAlerts = await SOS.find({ tenant: req.user._id })
      .populate('hostel', 'name address')
      .populate('respondedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, data: sosAlerts });
  } catch (error) {
    console.error('Get SOS history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  searchHostels,
  getHostelDetails,
  getMyExpenses,
  addExpense,
  deleteExpense,
  submitFeedback,
  submitOrderFeedback,
  getMyContracts,
  createBookingOrder,
  bookRoom,
  requestAccountDeletion,
  getMyDeletionRequest,
  cancelDeletionRequest,
  getMyFeedbacks,
  sendSOSAlert,
  getSOSHistory,
};
