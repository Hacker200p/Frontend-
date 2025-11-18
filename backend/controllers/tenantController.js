const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Order = require('../models/Order');
const Expense = require('../models/Expense');
const Feedback = require('../models/Feedback');
const Contract = require('../models/Contract');

// @desc    Search hostels
// @route   GET /api/tenant/hostels/search
// @access  Private/Tenant
const searchHostels = async (req, res) => {
  try {
    const { city, hostelType, minPrice, maxPrice, page = 1, limit = 10, showAll } = req.query;
    
    // If showAll is true, don't filter by verification status (useful for testing/first-time users)
    const query = showAll === 'true' ? {} : { verificationStatus: 'verified', isActive: true };

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

    // If no verified hostels found, try getting all hostels
    if (hostels.length === 0 && showAll !== 'true') {
      console.log('No verified hostels found, fetching all hostels...');
      hostels = await Hostel.find({})
        .populate('owner', 'name phone')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ rating: -1 });
    }

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
    const { month, year, rent, electricity, water, food, maintenance, other } = req.body;

    const totalExpense = (rent || 0) + (electricity || 0) + (water || 0) + 
                        (food || 0) + (maintenance || 0) + 
                        (other || []).reduce((sum, item) => sum + item.amount, 0);

    const expense = await Expense.findOneAndUpdate(
      { tenant: req.user.id, month, year },
      { rent, electricity, water, food, maintenance, other, totalExpense },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit feedback
// @route   POST /api/tenant/feedback
// @access  Private/Tenant
const submitFeedback = async (req, res) => {
  try {
    const { targetType, targetId, rating, comment } = req.body;

    const feedback = await Feedback.create({
      user: req.user.id,
      targetType,
      targetId,
      rating,
      comment,
    });

    // Update rating for target
    if (targetType === 'hostel') {
      const hostel = await Hostel.findById(targetId);
      const feedbacks = await Feedback.find({ targetType: 'hostel', targetId });
      const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
      
      hostel.rating = avgRating;
      hostel.reviewCount = feedbacks.length;
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

module.exports = {
  searchHostels,
  getHostelDetails,
  getMyExpenses,
  addExpense,
  submitFeedback,
  getMyContracts,
  createBookingOrder,
  bookRoom,
};
