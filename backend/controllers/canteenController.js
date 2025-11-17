const Canteen = require('../models/Canteen');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const razorpay = require('../config/razorypay');
const crypto = require('crypto');
const cloudinary = require('../config/cloudinary');

// @desc    Create canteen
// @route   POST /api/canteen
// @access  Private/CanteenProvider
const createCanteen = async (req, res) => {
  try {
    const { hostel } = req.body;

    // Verify hostel exists
    const Hostel = require('../models/Hostel');
    const hostelData = await Hostel.findById(hostel);

    if (!hostelData) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    // Check if this hostel already has a canteen
    if (hostelData.canteen) {
      return res.status(400).json({ success: false, message: 'This hostel already has a canteen' });
    }

    const canteen = await Canteen.create({
      ...req.body,
      provider: req.user.id,
    });

    // Update hostel to reference this canteen
    hostelData.canteen = canteen._id;
    hostelData.hasCanteen = true;
    await hostelData.save();

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

// @desc    Get available hostels for canteen
// @route   GET /api/canteen/available-hostels
// @access  Private/CanteenProvider
const getAvailableHostels = async (req, res) => {
  try {
    const Hostel = require('../models/Hostel');
    const hostels = await Hostel.find({ isActive: true }).select('name address city');
    res.json({ success: true, data: hostels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete canteen
// @route   DELETE /api/canteen/:id
// @access  Private/CanteenProvider
const deleteCanteen = async (req, res) => {
  try {
    const Hostel = require('../models/Hostel');
    const canteen = await Canteen.findById(req.params.id);

    if (!canteen) {
      return res.status(404).json({ success: false, message: 'Canteen not found' });
    }

    if (canteen.provider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete all menu items associated with this canteen
    await MenuItem.deleteMany({ canteen: canteen._id });

    // Update hostel to remove canteen reference
    await Hostel.findByIdAndUpdate(canteen.hostel, {
      canteen: null,
      hasCanteen: false
    });

    // Delete the canteen
    await Canteen.findByIdAndDelete(req.params.id);

    // Remove canteen from user's canteens array
    req.user.canteens = req.user.canteens.filter(c => c.toString() !== req.params.id);
    await req.user.save();

    res.json({ success: true, message: 'Canteen deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add menu item
// @route   POST /api/canteen/:id/menu
// @access  Private/CanteenProvider
const addMenuItem = async (req, res) => {
  try {
    console.log('Adding menu item - File received:', req.file ? 'YES' : 'NO');
    console.log('Request body:', req.body);
    
    const canteen = await Canteen.findById(req.params.id);

    if (!canteen) {
      return res.status(404).json({ success: false, message: 'Canteen not found' });
    }

    if (canteen.provider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Handle image upload if provided
    let imageData = {};
    if (req.file) {
      console.log('Uploading image to Cloudinary...');
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'safestay/menu-items',
        resource_type: 'image',
      });
      console.log('Image uploaded successfully:', result.secure_url);
      imageData = {
        image: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      };
    }

    const menuItem = await MenuItem.create({
      ...req.body,
      ...imageData,
      canteen: canteen._id,
    });

    console.log('Menu item created:', menuItem);
    res.status(201).json({ success: true, data: menuItem });
  } catch (error) {
    console.error('Error adding menu item:', error);
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

    // Handle image upload if provided
    if (req.file) {
      // Delete old image if exists
      if (menuItem.image?.publicId) {
        try {
          await cloudinary.uploader.destroy(menuItem.image.publicId);
        } catch (err) {
          console.log('Error deleting old image:', err);
        }
      }

      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'safestay/menu-items',
        resource_type: 'image',
      });
      req.body.image = {
        url: result.secure_url,
        publicId: result.public_id,
      };
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

// @desc    Delete menu item
// @route   DELETE /api/canteen/menu/:id
// @access  Private/CanteenProvider
const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('canteen');

    if (!menuItem) {
      return res.status(404).json({ success: false, message: 'Menu item not found' });
    }

    if (menuItem.canteen.provider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete image from cloudinary if exists
    if (menuItem.image?.publicId) {
      try {
        await cloudinary.uploader.destroy(menuItem.image.publicId);
      } catch (err) {
        console.log('Error deleting image:', err);
      }
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Menu item deleted successfully' });
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

    // Check if Razorpay is configured
    if (!razorpay || !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not configured. Please contact administrator.',
      });
    }

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

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: totalAmount * 100, // Amount in paise
      currency: 'INR',
      receipt: orderNumber,
    });

    const orderData = {
      orderNumber,
      tenant: req.user.id,
      canteen,
      items: orderItems,
      totalAmount,
      deliveryCharge: canteenData.deliveryCharge,
      deliveryAddress,
      specialInstructions,
      razorpayOrderId: razorpayOrder.id,
    };

    const order = await Order.create(orderData);

    res.status(201).json({
      success: true,
      data: order,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: totalAmount,
      currency: 'INR',
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify payment
// @route   POST /api/canteen/orders/verify-payment
// @access  Private/Tenant
const verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'razorpayPaymentId and razorpaySignature are required',
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.tenant.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to verify this order' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Payment already verified' });
    }

    if (!order.razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order - no Razorpay order ID found',
      });
    }

    // Verify Razorpay signature
    const sign = razorpayPaymentId + '|' + order.razorpayOrderId;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpaySignature === expectedSign) {
      order.paymentStatus = 'paid';
      order.razorpayPaymentId = razorpayPaymentId;
      order.orderStatus = 'confirmed';
      order.paymentMethod = 'online';
      await order.save();

      console.log(`✅ Payment verified for order: ${order.orderNumber}`);

      return res.json({
        success: true,
        message: 'Payment verified successfully',
        data: order,
      });
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
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
      .populate('tenant', 'name phone email currentHostel currentRoom')
      .populate('canteen', 'name')
      .sort({ createdAt: -1 });

    // Enhance orders with hostel and room details
    const enhancedOrders = await Promise.all(orders.map(async (order) => {
      const orderObj = order.toObject();
      
      if (order.tenant?.currentHostel) {
        const Hostel = require('../models/Hostel');
        const Room = require('../models/Room');
        
        const hostel = await Hostel.findById(order.tenant.currentHostel).select('name address');
        const room = await Room.findById(order.tenant.currentRoom).select('roomNumber floor');
        
        orderObj.tenant = {
          ...orderObj.tenant,
          hostel: hostel ? { name: hostel.name, address: hostel.address } : null,
          room: room ? { roomNumber: room.roomNumber, floor: room.floor } : null,
        };
      }
      
      return orderObj;
    }));

    res.json({ success: true, data: enhancedOrders });
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

// @desc    Update canteen subscription plans
// @route   PUT /api/canteen/:id/subscription-plans
// @access  Private/CanteenProvider
const updateSubscriptionPlans = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);

    if (!canteen) {
      return res.status(404).json({ success: false, message: 'Canteen not found' });
    }

    if (canteen.provider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    canteen.subscriptionPlans = req.body.subscriptionPlans;
    await canteen.save();

    res.json({ success: true, data: canteen });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create subscription order
// @route   POST /api/canteen/subscriptions/create-order
// @access  Private/Tenant
const createSubscriptionOrder = async (req, res) => {
  try {
    const { canteenId, plan, duration } = req.body; // duration in months
    const Subscription = require('../models/Subscription');

    const canteen = await Canteen.findById(canteenId);
    if (!canteen) {
      return res.status(404).json({ success: false, message: 'Canteen not found' });
    }

    if (!canteen.subscriptionPlans[plan]?.enabled) {
      return res.status(400).json({ success: false, message: 'This subscription plan is not available' });
    }

    const monthlyPrice = canteen.subscriptionPlans[plan].price;
    const totalAmount = monthlyPrice * duration;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: 'INR',
      receipt: `sub_${Date.now()}`,
    });

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + duration);

    // Create subscription
    const subscription = await Subscription.create({
      tenant: req.user.id,
      canteen: canteenId,
      plan,
      price: totalAmount,
      startDate,
      endDate,
      razorpayOrderId: order.id,
      status: 'active',
      paymentStatus: 'pending',
    });

    res.json({
      success: true,
      data: {
        subscription,
        orderId: order.id,
        amount: totalAmount,
      },
    });
  } catch (error) {
    console.error('Error creating subscription order:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify subscription payment
// @route   POST /api/canteen/subscriptions/verify-payment
// @access  Private/Tenant
const verifySubscriptionPayment = async (req, res) => {
  try {
    const { subscriptionId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const Subscription = require('../models/Subscription');

    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    subscription.razorpayPaymentId = razorpayPaymentId;
    subscription.razorpaySignature = razorpaySignature;
    subscription.paymentStatus = 'paid';
    await subscription.save();

    // Update canteen subscriber count
    await Canteen.findByIdAndUpdate(subscription.canteen, {
      $inc: { subscriberCount: 1 },
    });

    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error('Error verifying subscription payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get tenant subscriptions
// @route   GET /api/canteen/subscriptions/my-subscriptions
// @access  Private/Tenant
const getMySubscriptions = async (req, res) => {
  try {
    const Subscription = require('../models/Subscription');
    const subscriptions = await Subscription.find({ tenant: req.user.id })
      .populate('canteen', 'name hostel')
      .populate({
        path: 'canteen',
        populate: { path: 'hostel', select: 'name' }
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get canteen subscriptions (for provider)
// @route   GET /api/canteen/:id/subscriptions
// @access  Private/CanteenProvider
const getCanteenSubscriptions = async (req, res) => {
  try {
    const Subscription = require('../models/Subscription');
    const canteen = await Canteen.findById(req.params.id);

    if (!canteen) {
      return res.status(404).json({ success: false, message: 'Canteen not found' });
    }

    if (canteen.provider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const subscriptions = await Subscription.find({ canteen: req.params.id, status: 'active' })
      .populate('tenant', 'name phone email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: subscriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel subscription
// @route   PUT /api/canteen/subscriptions/:id/cancel
// @access  Private/Tenant
const cancelSubscription = async (req, res) => {
  try {
    const Subscription = require('../models/Subscription');
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    if (subscription.tenant.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    subscription.status = 'cancelled';
    await subscription.save();

    // Update canteen subscriber count
    await Canteen.findByIdAndUpdate(subscription.canteen, {
      $inc: { subscriberCount: -1 },
    });

    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit feedback for an order
// @route   POST /api/canteen/feedback
// @access  Private/Tenant
const submitFeedback = async (req, res) => {
  try {
    const Feedback = require('../models/Feedback');
    const { order, canteen, rating, comment } = req.body;

    if (!order || !canteen || !rating) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID, Canteen ID, and rating are required' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be between 1 and 5' 
      });
    }

    // Get order details
    const Order = require('../models/Order');
    const orderData = await Order.findById(order).populate('canteen');

    if (!orderData) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if user is the tenant who placed the order
    if (orderData.tenant.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const feedback = await Feedback.create({
      user: req.user.id,
      targetType: 'order',
      targetId: order,
      rating,
      comment: comment || '',
      order,
      canteen,
      tenant: req.user.id,
      tenantName: req.user.name,
      orderDetails: {
        orderNumber: orderData.orderNumber,
        canteenName: orderData.canteen?.name,
        totalAmount: orderData.totalAmount,
      },
    });

    await feedback.populate('tenant', 'name');

    res.status(201).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get feedbacks for a canteen
// @route   GET /api/canteen/feedback/:canteenId
// @access  Private/CanteenProvider
const getCanteenFeedbacks = async (req, res) => {
  try {
    const Feedback = require('../models/Feedback');
    const { canteenId } = req.params;

    // Verify provider owns this canteen
    const canteen = await Canteen.findById(canteenId);
    if (!canteen) {
      return res.status(404).json({ success: false, message: 'Canteen not found' });
    }

    if (canteen.provider.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const feedbacks = await Feedback.find({
      targetType: 'order',
      canteen: canteenId,
    })
      .populate('tenant', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: feedbacks });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all feedbacks for provider's canteens
// @route   GET /api/canteen/provider/feedbacks
// @access  Private/CanteenProvider
const getProviderFeedbacks = async (req, res) => {
  try {
    const Feedback = require('../models/Feedback');

    // Get all canteens owned by provider
    const providerCanteens = await Canteen.find({ provider: req.user.id });
    const canteenIds = providerCanteens.map(c => c._id);

    // Get all feedbacks for these canteens
    const feedbacks = await Feedback.find({
      targetType: 'order',
      canteen: { $in: canteenIds },
    })
      .populate('tenant', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: feedbacks });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCanteen,
  getMyCanteens,
  getAvailableHostels,
  deleteCanteen,
  addMenuItem,
  getCanteenMenu,
  updateMenuItem,
  deleteMenuItem,
  createOrder,
  verifyPayment,
  getProviderOrders,
  updateOrderStatus,
  getMyOrders,
  updateSubscriptionPlans,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getMySubscriptions,
  getCanteenSubscriptions,
  cancelSubscription,
  submitFeedback,
  getCanteenFeedbacks,
  getProviderFeedbacks,
};
