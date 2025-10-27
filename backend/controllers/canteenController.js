const Canteen = require('../models/Canteen');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const razorpay = require('../config/razorypay');
const crypto = require('crypto');

// @desc    Create canteen
// @route   POST /api/canteen
// @access  Private/CanteenProvider
const createCanteen = async (req, res) => {
  try {
    const canteen = await Canteen.create({
      ...req.body,
      provider: req.user.id,
    });

    req.user.canteens.push(canteen._id);
    await req.user.save();

    res.status(201).json({ success: true, data: canteen });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get provider's canteens
// @route   GET /api/canteen/my-canteens
// @access  Private/CanteenProvider
const getMyCanteens = async (req, res) => {
  try {
    const canteens = await Canteen.find({ provider: req.user.id })
      .populate('hostel', 'name address');

    res.json({ success: true, data: canteens });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add menu item
// @route   POST /api/canteen/:id/menu
// @access  Private/CanteenProvider
const addMenuItem = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);

    if (!canteen) {
      return res.status(404).json({ success: false, message: 'Canteen not found' });
    }

    if (canteen.provider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const menuItem = await MenuItem.create({
      ...req.body,
      canteen: canteen._id,
    });

    res.status(201).json({ success: true, data: menuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get canteen menu
// @route   GET /api/canteen/:id/menu
// @access  Public
const getCanteenMenu = async (req, res) => {
  try {
    const { category, foodType } = req.query;
    const query = { canteen: req.params.id, isAvailable: true };

    if (category) query.category = category;
    if (foodType) query.foodType = foodType;

    const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });

    res.json({ success: true, data: menuItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update menu item
// @route   PUT /api/canteen/menu/:id
// @access  Private/CanteenProvider
const updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('canteen');

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    if (menuItem.canteen.provider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: updatedItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create order
// @route   POST /api/canteen/orders
// @access  Private/Tenant
const createOrder = async (req, res) => {
  try {
    const { canteen, items, deliveryAddress, specialInstructions } = req.body;

    // Calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({ success: false, message: `Item ${item.menuItem} not available` });
      }
      
      totalAmount += menuItem.price * item.quantity;
      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
      });
    }

    const canteenData = await Canteen.findById(canteen);
    totalAmount += canteenData.deliveryCharge;

    // Generate order number
    const orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Check if Razorpay is configured
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured. Please contact administrator.',
      });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100, // Amount in paise
      currency: 'INR',
      receipt: orderNumber,
    });

    const order = await Order.create({
      orderNumber,
      tenant: req.user.id,
      canteen,
      items: orderItems,
      totalAmount,
      deliveryCharge: canteenData.deliveryCharge,
      deliveryAddress,
      specialInstructions,
      razorpayOrderId: razorpayOrder.id,
    });

    res.status(201).json({
      success: true,
      data: order,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify payment
// @route   POST /api/canteen/orders/verify-payment
// @access  Private/Tenant
const verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const sign = razorpayPaymentId + '|' + order.razorpayOrderId;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpaySignature === expectedSign) {
      order.paymentStatus = 'paid';
      order.razorpayPaymentId = razorpayPaymentId;
      order.orderStatus = 'confirmed';
      await order.save();

      res.json({ success: true, message: 'Payment verified successfully', data: order });
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get provider orders
// @route   GET /api/canteen/orders
// @access  Private/CanteenProvider
const getProviderOrders = async (req, res) => {
  try {
    const { status, canteenId } = req.query;
    
    const canteenQuery = canteenId ? { _id: canteenId } : { provider: req.user.id };
    const canteens = await Canteen.find(canteenQuery);
    const canteenIds = canteens.map(c => c._id);

    const query = { canteen: { $in: canteenIds } };
    if (status) query.orderStatus = status;

    const orders = await Order.find(query)
      .populate('tenant', 'name phone')
      .populate('canteen', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/canteen/orders/:id/status
// @access  Private/CanteenProvider
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id).populate('canteen');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.canteen.provider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    order.orderStatus = status;
    if (status === 'delivered') {
      order.deliveredAt = Date.now();
    }

    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tenant orders
// @route   GET /api/canteen/my-orders
// @access  Private/Tenant
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ tenant: req.user.id })
      .populate('canteen', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCanteen,
  getMyCanteens,
  addMenuItem,
  getCanteenMenu,
  updateMenuItem,
  createOrder,
  verifyPayment,
  getProviderOrders,
  updateOrderStatus,
  getMyOrders,
};
