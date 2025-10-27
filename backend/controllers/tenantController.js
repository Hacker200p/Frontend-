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
    const { city, hostelType, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    
    const query = { verificationStatus: 'verified', isActive: true };

    if (city) query['address.city'] = new RegExp(city, 'i');
    if (hostelType) query.hostelType = hostelType;
    if (minPrice || maxPrice) {
      query['priceRange.min'] = { $gte: minPrice || 0 };
      query['priceRange.max'] = { $lte: maxPrice || 999999 };
    }

    const hostels = await Hostel.find(query)
      .populate('owner', 'name phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1 });

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
      .populate('room', 'roomNumber floor')
      .populate('owner', 'name phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: contracts });
  } catch (error) {
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
};
