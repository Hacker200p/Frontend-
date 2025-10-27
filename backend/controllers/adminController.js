const User = require('../models/User');
const Hostel = require('../models/Hostel');
const sendEmail = require('../utils/sendEmail');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 10 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalUsers: count,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const totalTenants = await User.countDocuments({ role: 'tenant' });
    const totalCanteenProviders = await User.countDocuments({ role: 'canteen_provider' });
    
    const totalHostels = await Hostel.countDocuments();
    const verifiedHostels = await Hostel.countDocuments({ verificationStatus: 'verified' });
    const pendingHostels = await Hostel.countDocuments({ verificationStatus: 'pending' });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          owners: totalOwners,
          tenants: totalTenants,
          canteenProviders: totalCanteenProviders,
        },
        hostels: {
          total: totalHostels,
          verified: verifiedHostels,
          pending: pendingHostels,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify hostel
// @route   PUT /api/admin/hostels/:id/verify
// @access  Private/Admin
const verifyHostel = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const hostel = await Hostel.findById(req.params.id).populate('owner');

    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    hostel.verificationStatus = status;
    hostel.verificationNotes = notes;

    await hostel.save();

    // Send email notification to owner
    await sendEmail({
      email: hostel.owner.email,
      subject: `Hostel Verification ${status === 'verified' ? 'Approved' : 'Update'}`,
      message: `<h2>Hostel: ${hostel.name}</h2><p>Status: ${status}</p><p>Notes: ${notes || 'N/A'}</p>`,
    });

    res.json({ success: true, data: hostel });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all hostels for verification
// @route   GET /api/admin/hostels
// @access  Private/Admin
const getAllHostels = async (req, res) => {
  try {
    const { verificationStatus, page = 1, limit = 10 } = req.query;
    const query = {};

    if (verificationStatus) query.verificationStatus = verificationStatus;

    const hostels = await Hostel.find(query)
      .populate('owner', 'name email phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

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

module.exports = {
  getAllUsers,
  getDashboardStats,
  verifyHostel,
  toggleUserStatus,
  getAllHostels,
};
