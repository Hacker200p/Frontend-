// // ==================== PROJECT STRUCTURE ====================
// /*
// safestay-hub-backend/
// ├── config/
// │   ├── db.js
// │   ├── cloudinary.js
// │   └── razorpay.js
// ├── models/
// │   ├── User.js
// │   ├── Hostel.js
// │   ├── Room.js
// │   ├── Canteen.js
// │   ├── MenuItem.js
// │   ├── Order.js
// │   ├── Contract.js
// │   ├── Feedback.js
// │   └── Expense.js
// ├── controllers/
// │   ├── authController.js
// │   ├── adminController.js
// │   ├── ownerController.js
// │   ├── tenantController.js
// │   ├── canteenController.js
// │   └── contractController.js
// ├── routes/
// │   ├── authRoutes.js
// │   ├── adminRoutes.js
// │   ├── ownerRoutes.js
// │   ├── tenantRoutes.js
// │   ├── canteenRoutes.js
// │   └── contractRoutes.js
// ├── middleware/
// │   ├── authMiddleware.js
// │   ├── roleMiddleware.js
// │   ├── errorMiddleware.js
// │   └── uploadMiddleware.js
// ├── utils/
// │   ├── sendEmail.js
// │   ├── sendSMS.js
// │   ├── generateToken.js
// │   └── validators.js
// ├── .env.example
// ├── .gitignore
// ├── server.js
// └── package.json
// */

// // ==================== package.json ====================
// {
//   "name": "safestay-hub-backend",
//   "version": "1.0.0",
//   "description": "Hostel/PG Booking and Management Platform Backend",
//   "main": "server.js",
//   "scripts": {
//     "start": "node server.js",
//     "dev": "nodemon server.js"
//   },
//   "dependencies": {
//     "express": "^4.18.2",
//     "mongoose": "^8.0.0",
//     "bcryptjs": "^2.4.3",
//     "jsonwebtoken": "^9.0.2",
//     "dotenv": "^16.3.1",
//     "cors": "^2.8.5",
//     "express-validator": "^7.0.1",
//     "multer": "^1.4.5-lts.1",
//     "cloudinary": "^1.41.0",
//     "razorpay": "^2.9.2",
//     "twilio": "^4.19.0",
//     "socket.io": "^4.6.1",
//     "nodemailer": "^6.9.7",
//     "helmet": "^7.1.0",
//     "express-rate-limit": "^7.1.5",
//     "compression": "^1.7.4",
//     "morgan": "^1.10.0"
//   },
//   "devDependencies": {
//     "nodemon": "^3.0.2"
//   }
// }

// // ==================== .env.example ====================
// /*
// NODE_ENV=development
// PORT=5000
// MONGO_URI=mongodb://localhost:27017/safestay-hub
// JWT_SECRET=your_jwt_secret_key_here_change_in_production
// JWT_EXPIRE=7d

// # Cloudinary
// CLOUDINARY_CLOUD_NAME=your_cloud_name
// CLOUDINARY_API_KEY=your_api_key
// CLOUDINARY_API_SECRET=your_api_secret

// # Razorpay
// RAZORPAY_KEY_ID=your_razorpay_key_id
// RAZORPAY_KEY_SECRET=your_razorpay_key_secret

// # Twilio
// TWILIO_ACCOUNT_SID=your_twilio_account_sid
// TWILIO_AUTH_TOKEN=your_twilio_auth_token
// TWILIO_PHONE_NUMBER=your_twilio_phone_number

// # Email
// EMAIL_HOST=smtp.gmail.com
// EMAIL_PORT=587
// EMAIL_USER=your_email@gmail.com
// EMAIL_PASSWORD=your_email_password

// # Frontend URL
// FRONTEND_URL=http://localhost:3000
// */

// // ==================== .gitignore ====================
// /*
// node_modules/
// .env
// uploads/
// *.log
// .DS_Store
// */

// // ==================== config/db.js ====================
// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URI);
//     console.log(`MongoDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(`Error: ${error.message}`);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;

// // ==================== config/cloudinary.js ====================
// const cloudinary = require('cloudinary').v2;

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// module.exports = cloudinary;

// // ==================== config/razorpay.js ====================
// const Razorpay = require('razorpay');

// const razorpayInstance = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// module.exports = razorpayInstance;

// // ==================== models/User.js ====================
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'Please provide a name'],
//     trim: true,
//   },
//   email: {
//     type: String,
//     required: [true, 'Please provide an email'],
//     unique: true,
//     lowercase: true,
//     match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
//   },
//   phone: {
//     type: String,
//     required: [true, 'Please provide a phone number'],
//     unique: true,
//     match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number'],
//   },
//   password: {
//     type: String,
//     required: [true, 'Please provide a password'],
//     minlength: 6,
//     select: false,
//   },
//   role: {
//     type: String,
//     enum: ['master_admin', 'owner', 'canteen_provider', 'tenant'],
//     default: 'tenant',
//   },
//   profileImage: {
//     type: String,
//     default: '',
//   },
//   isVerified: {
//     type: Boolean,
//     default: false,
//   },
//   isActive: {
//     type: Boolean,
//     default: true,
//   },
//   // Tenant specific fields
//   foodPreference: {
//     type: String,
//     enum: ['veg', 'non-veg', 'both'],
//     default: 'both',
//   },
//   currentHostel: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Hostel',
//   },
//   currentRoom: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Room',
//   },
//   // Owner specific fields
//   ownedHostels: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Hostel',
//   }],
//   // Canteen provider specific fields
//   canteens: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Canteen',
//   }],
//   kycDocuments: {
//     aadhar: String,
//     pan: String,
//     businessLicense: String,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// }, { timestamps: true });

// // Hash password before saving
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) {
//     next();
//   }
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

// // Compare password method
// userSchema.methods.matchPassword = async function(enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model('User', userSchema);

// // ==================== models/Hostel.js ====================
// const mongoose = require('mongoose');

// const hostelSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'Please provide a hostel name'],
//     trim: true,
//   },
//   owner: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   address: {
//     street: String,
//     city: {
//       type: String,
//       required: true,
//     },
//     state: {
//       type: String,
//       required: true,
//     },
//     pincode: {
//       type: String,
//       required: true,
//     },
//     landmark: String,
//   },
//   location: {
//     type: {
//       type: String,
//       enum: ['Point'],
//       default: 'Point',
//     },
//     coordinates: {
//       type: [Number],
//       default: [0, 0],
//     },
//   },
//   description: {
//     type: String,
//     required: true,
//   },
//   hostelType: {
//     type: String,
//     enum: ['boys', 'girls', 'co-ed'],
//     required: true,
//   },
//   amenities: [{
//     type: String,
//   }],
//   photos: [{
//     url: String,
//     publicId: String,
//   }],
//   video360: [{
//     url: String,
//     publicId: String,
//   }],
//   totalRooms: {
//     type: Number,
//     default: 0,
//   },
//   availableRooms: {
//     type: Number,
//     default: 0,
//   },
//   priceRange: {
//     min: {
//       type: Number,
//       required: true,
//     },
//     max: {
//       type: Number,
//       required: true,
//     },
//   },
//   rating: {
//     type: Number,
//     default: 0,
//   },
//   reviewCount: {
//     type: Number,
//     default: 0,
//   },
//   verificationStatus: {
//     type: String,
//     enum: ['pending', 'verified', 'rejected'],
//     default: 'pending',
//   },
//   verificationNotes: String,
//   isActive: {
//     type: Boolean,
//     default: true,
//   },
//   hasCanteen: {
//     type: Boolean,
//     default: false,
//   },
//   canteen: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Canteen',
//   },
// }, { timestamps: true });

// hostelSchema.index({ location: '2dsphere' });

// module.exports = mongoose.model('Hostel', hostelSchema);

// // ==================== models/Room.js ====================
// const mongoose = require('mongoose');

// const roomSchema = new mongoose.Schema({
//   hostel: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Hostel',
//     required: true,
//   },
//   roomNumber: {
//     type: String,
//     required: true,
//   },
//   floor: {
//     type: Number,
//     required: true,
//   },
//   roomType: {
//     type: String,
//     enum: ['single', 'double', 'triple', 'quad'],
//     required: true,
//   },
//   capacity: {
//     type: Number,
//     required: true,
//   },
//   currentOccupancy: {
//     type: Number,
//     default: 0,
//   },
//   rent: {
//     type: Number,
//     required: true,
//   },
//   securityDeposit: {
//     type: Number,
//     required: true,
//   },
//   amenities: [{
//     type: String,
//   }],
//   photos: [{
//     url: String,
//     publicId: String,
//   }],
//   isAvailable: {
//     type: Boolean,
//     default: true,
//   },
//   tenants: [{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//   }],
// }, { timestamps: true });

// module.exports = mongoose.model('Room', roomSchema);

// // ==================== models/Canteen.js ====================
// const mongoose = require('mongoose');

// const canteenSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'Please provide a canteen name'],
//     trim: true,
//   },
//   provider: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   hostel: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Hostel',
//     required: true,
//   },
//   description: String,
//   cuisineTypes: [{
//     type: String,
//   }],
//   operatingHours: {
//     breakfast: {
//       start: String,
//       end: String,
//     },
//     lunch: {
//       start: String,
//       end: String,
//     },
//     dinner: {
//       start: String,
//       end: String,
//     },
//   },
//   isActive: {
//     type: Boolean,
//     default: true,
//   },
//   rating: {
//     type: Number,
//     default: 0,
//   },
//   reviewCount: {
//     type: Number,
//     default: 0,
//   },
//   deliveryCharge: {
//     type: Number,
//     default: 0,
//   },
//   minimumOrderAmount: {
//     type: Number,
//     default: 0,
//   },
// }, { timestamps: true });

// module.exports = mongoose.model('Canteen', canteenSchema);

// // ==================== models/MenuItem.js ====================
// const mongoose = require('mongoose');

// const menuItemSchema = new mongoose.Schema({
//   canteen: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Canteen',
//     required: true,
//   },
//   name: {
//     type: String,
//     required: [true, 'Please provide a menu item name'],
//     trim: true,
//   },
//   description: String,
//   category: {
//     type: String,
//     enum: ['breakfast', 'lunch', 'dinner', 'snacks', 'beverages'],
//     required: true,
//   },
//   foodType: {
//     type: String,
//     enum: ['veg', 'non-veg', 'vegan'],
//     required: true,
//   },
//   price: {
//     type: Number,
//     required: true,
//   },
//   image: {
//     url: String,
//     publicId: String,
//   },
//   isAvailable: {
//     type: Boolean,
//     default: true,
//   },
//   preparationTime: {
//     type: Number,
//     default: 20,
//   },
//   rating: {
//     type: Number,
//     default: 0,
//   },
//   orderCount: {
//     type: Number,
//     default: 0,
//   },
// }, { timestamps: true });

// module.exports = mongoose.model('MenuItem', menuItemSchema);

// // ==================== models/Order.js ====================
// const mongoose = require('mongoose');

// const orderSchema = new mongoose.Schema({
//   orderNumber: {
//     type: String,
//     unique: true,
//     required: true,
//   },
//   tenant: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   canteen: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Canteen',
//     required: true,
//   },
//   items: [{
//     menuItem: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'MenuItem',
//     },
//     name: String,
//     quantity: Number,
//     price: Number,
//   }],
//   totalAmount: {
//     type: Number,
//     required: true,
//   },
//   deliveryCharge: {
//     type: Number,
//     default: 0,
//   },
//   deliveryAddress: {
//     roomNumber: String,
//     floor: Number,
//     notes: String,
//   },
//   orderStatus: {
//     type: String,
//     enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
//     default: 'pending',
//   },
//   paymentStatus: {
//     type: String,
//     enum: ['pending', 'paid', 'failed', 'refunded'],
//     default: 'pending',
//   },
//   paymentMethod: {
//     type: String,
//     enum: ['cash', 'online', 'wallet'],
//     default: 'online',
//   },
//   razorpayOrderId: String,
//   razorpayPaymentId: String,
//   specialInstructions: String,
//   estimatedDeliveryTime: Date,
//   deliveredAt: Date,
// }, { timestamps: true });

// module.exports = mongoose.model('Order', orderSchema);

// // ==================== models/Contract.js ====================
// const mongoose = require('mongoose');

// const contractSchema = new mongoose.Schema({
//   contractNumber: {
//     type: String,
//     unique: true,
//     required: true,
//   },
//   tenant: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   hostel: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Hostel',
//     required: true,
//   },
//   room: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Room',
//     required: true,
//   },
//   owner: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   startDate: {
//     type: Date,
//     required: true,
//   },
//   endDate: {
//     type: Date,
//     required: true,
//   },
//   monthlyRent: {
//     type: Number,
//     required: true,
//   },
//   securityDeposit: {
//     type: Number,
//     required: true,
//   },
//   terms: [{
//     clause: String,
//     description: String,
//   }],
//   penalties: [{
//     type: String,
//     amount: Number,
//     description: String,
//   }],
//   contractDocument: {
//     url: String,
//     publicId: String,
//   },
//   tenantSignature: {
//     signed: {
//       type: Boolean,
//       default: false,
//     },
//     signedAt: Date,
//     ipAddress: String,
//   },
//   ownerSignature: {
//     signed: {
//       type: Boolean,
//       default: false,
//     },
//     signedAt: Date,
//     ipAddress: String,
//   },
//   status: {
//     type: String,
//     enum: ['draft', 'pending_signatures', 'active', 'expired', 'terminated'],
//     default: 'draft',
//   },
//   terminationReason: String,
//   terminatedAt: Date,
// }, { timestamps: true });

// module.exports = mongoose.model('Contract', contractSchema);

// // ==================== models/Feedback.js ====================
// const mongoose = require('mongoose');

// const feedbackSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   targetType: {
//     type: String,
//     enum: ['hostel', 'canteen', 'order'],
//     required: true,
//   },
//   targetId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//   },
//   rating: {
//     type: Number,
//     min: 1,
//     max: 5,
//     required: true,
//   },
//   comment: {
//     type: String,
//     required: true,
//   },
//   photos: [{
//     url: String,
//     publicId: String,
//   }],
//   response: {
//     message: String,
//     respondedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//     },
//     respondedAt: Date,
//   },
//   isVerified: {
//     type: Boolean,
//     default: false,
//   },
// }, { timestamps: true });

// module.exports = mongoose.model('Feedback', feedbackSchema);

// // ==================== models/Expense.js ====================
// const mongoose = require('mongoose');

// const expenseSchema = new mongoose.Schema({
//   tenant: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true,
//   },
//   month: {
//     type: Number,
//     required: true,
//     min: 1,
//     max: 12,
//   },
//   year: {
//     type: Number,
//     required: true,
//   },
//   rent: {
//     type: Number,
//     default: 0,
//   },
//   electricity: {
//     type: Number,
//     default: 0,
//   },
//   water: {
//     type: Number,
//     default: 0,
//   },
//   food: {
//     type: Number,
//     default: 0,
//   },
//   maintenance: {
//     type: Number,
//     default: 0,
//   },
//   other: [{
//     description: String,
//     amount: Number,
//   }],
//   totalExpense: {
//     type: Number,
//     default: 0,
//   },
//   notes: String,
// }, { timestamps: true });

// expenseSchema.index({ tenant: 1, month: 1, year: 1 }, { unique: true });

// module.exports = mongoose.model('Expense', expenseSchema);

// // ==================== utils/generateToken.js ====================
// const jwt = require('jsonwebtoken');

// const generateToken = (userId) => {
//   return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRE,
//   });
// };

// module.exports = generateToken;

// // ==================== utils/sendEmail.js ====================
// const nodemailer = require('nodemailer');

// const sendEmail = async (options) => {
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   const mailOptions = {
//     from: `SafeStay Hub <${process.env.EMAIL_USER}>`,
//     to: options.email,
//     subject: options.subject,
//     html: options.message,
//   };

//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;

// // ==================== utils/sendSMS.js ====================
// const twilio = require('twilio');

// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

// const sendSMS = async (phone, message) => {
//   try {
//     await client.messages.create({
//       body: message,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: `+91${phone}`,
//     });
//   } catch (error) {
//     console.error('SMS Error:', error);
//   }
// };

// module.exports = sendSMS;

// // ==================== utils/validators.js ====================
// const { body, validationResult } = require('express-validator');

// const validateRegister = [
//   body('name').trim().notEmpty().withMessage('Name is required'),
//   body('email').isEmail().withMessage('Valid email is required'),
//   body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
//   body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
//   body('role').isIn(['master_admin', 'owner', 'canteen_provider', 'tenant']).withMessage('Invalid role'),
// ];

// const validateLogin = [
//   body('email').isEmail().withMessage('Valid email is required'),
//   body('password').notEmpty().withMessage('Password is required'),
// ];

// const handleValidationErrors = (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ success: false, errors: errors.array() });
//   }
//   next();
// };

// module.exports = {
//   validateRegister,
//   validateLogin,
//   handleValidationErrors,
// };

// // ==================== middleware/authMiddleware.js ====================
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const protect = async (req, res, next) => {
//   let token;

//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//     try {
//       token = req.headers.authorization.split(' ')[1];
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       req.user = await User.findById(decoded.id).select('-password');
      
//       if (!req.user) {
//         return res.status(401).json({ success: false, message: 'User not found' });
//       }

//       if (!req.user.isActive) {
//         return res.status(401).json({ success: false, message: 'Account is deactivated' });
//       }

//       next();
//     } catch (error) {
//       return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
//     }
//   }

//   if (!token) {
//     return res.status(401).json({ success: false, message: 'Not authorized, no token' });
//   }
// };

// module.exports = { protect };

// // ==================== middleware/roleMiddleware.js ====================
// const authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: `User role ${req.user.role} is not authorized to access this route`,
//       });
//     }
//     next();
//   };
// };

// module.exports = { authorize };

// // ==================== middleware/errorMiddleware.js ====================
// const errorHandler = (err, req, res, next) => {
//   console.error(err.stack);

//   const error = { ...err };
//   error.message = err.message;

//   // Mongoose bad ObjectId
//   if (err.name === 'CastError') {
//     const message = 'Resource not found';
//     return res.status(404).json({ success: false, message });
//   }

//   // Mongoose duplicate key
//   if (err.code === 11000) {
//     const message = 'Duplicate field value entered';
//     return res.status(400).json({ success: false, message });
//   }

//   // Mongoose validation error
//   if (err.name === 'ValidationError') {
//     const message = Object.values(err.errors).map(val => val.message);
//     return res.status(400).json({ success: false, message });
//   }

//   res.status(error.statusCode || 500).json({
//     success: false,
//     message: error.message || 'Server Error',
//   });
// };

// module.exports = { errorHandler };

// // ==================== middleware/uploadMiddleware.js ====================
// const multer = require('multer');

// const storage = multer.memoryStorage();

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image') || file.mimetype.startsWith('video')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Not an image or video! Please upload only images or videos.'), false);
//   }
// };

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
// });

// module.exports = upload;

// // ==================== controllers/authController.js ====================
// const User = require('../models/User');
// const generateToken = require('../utils/generateToken');
// const sendEmail = require('../utils/sendEmail');
// const sendSMS = require('../utils/sendSMS');

// // @desc    Create contract
// // @route   POST /api/contract
// // @access  Private/Owner
// const createContract = async (req, res) => {
//   try {
//     const { tenant, hostel, room, startDate, endDate, monthlyRent, securityDeposit, terms, penalties } = req.body;

//     // Verify room and hostel ownership
//     const roomData = await Room.findById(room).populate('hostel');
//     if (!roomData) {
//       return res.status(404).json({ success: false, message: 'Room not found' });
//     }

//     if (roomData.hostel.owner.toString() !== req.user.id) {
//       return res.status(403).json({ success: false, message: 'Not authorized' });
//     }

//     // Generate contract number
//     const contractNumber = `CNT${Date.now()}${Math.floor(Math.random() * 1000)}`;

//     const contract = await Contract.create({
//       contractNumber,
//       tenant,
//       hostel,
//       room,
//       owner: req.user.id,
//       startDate,
//       endDate,
//       monthlyRent,
//       securityDeposit,
//       terms,
//       penalties,
//       status: 'pending_signatures',
//     });

//     // Send email to tenant
//     const tenantUser = await require('../models/User').findById(tenant);
//     await sendEmail({
//       email: tenantUser.email,
//       subject: 'New Contract - SafeStay Hub',
//       message: `<h2>New Contract Created</h2><p>Contract Number: ${contractNumber}</p><p>Please review and sign the contract.</p>`,
//     });

//     res.status(201).json({ success: true, data: contract });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get contract by ID
// // @route   GET /api/contract/:id
// // @access  Private
// const getContract = async (req, res) => {
//   try {
//     const contract = await Contract.findById(req.params.id)
//       .populate('tenant', 'name email phone')
//       .populate('owner', 'name email phone')
//       .populate('hostel', 'name address')
//       .populate('room', 'roomNumber floor');

//     if (!contract) {
//       return res.status(404).json({ success: false, message: 'Contract not found' });
//     }

//     // Check if user is authorized to view
//     if (
//       contract.tenant.toString() !== req.user.id &&
//       contract.owner.toString() !== req.user.id &&
//       req.user.role !== 'master_admin'
//     ) {
//       return res.status(403).json({ success: false, message: 'Not authorized' });
//     }

//     res.json({ success: true, data: contract });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Sign contract
// // @route   PUT /api/contract/:id/sign
// // @access  Private/Tenant/Owner
// const signContract = async (req, res) => {
//   try {
//     const contract = await Contract.findById(req.params.id);

//     if (!contract) {
//       return res.status(404).json({ success: false, message: 'Contract not found' });
//     }

//     const ipAddress = req.ip || req.connection.remoteAddress;

//     // Check if tenant is signing
//     if (contract.tenant.toString() === req.user.id) {
//       contract.tenantSignature = {
//         signed: true,
//         signedAt: Date.now(),
//         ipAddress,
//       };
//     }
//     // Check if owner is signing
//     else if (contract.owner.toString() === req.user.id) {
//       contract.ownerSignature = {
//         signed: true,
//         signedAt: Date.now(),
//         ipAddress,
//       };
//     } else {
//       return res.status(403).json({ success: false, message: 'Not authorized to sign this contract' });
//     }

//     // If both signed, activate contract
//     if (contract.tenantSignature.signed && contract.ownerSignature.signed) {
//       contract.status = 'active';

//       // Update room occupancy
//       const room = await Room.findById(contract.room);
//       room.tenants.push(contract.tenant);
//       room.currentOccupancy += 1;
//       if (room.currentOccupancy >= room.capacity) {
//         room.isAvailable = false;
//       }
//       await room.save();

//       // Update tenant's current hostel and room
//       const tenant = await require('../models/User').findById(contract.tenant);
//       tenant.currentHostel = contract.hostel;
//       tenant.currentRoom = contract.room;
//       await tenant.save();
//     }

//     await contract.save();

//     res.json({ success: true, data: contract });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Upload contract document
// // @route   POST /api/contract/:id/upload
// // @access  Private/Owner
// const uploadContractDocument = async (req, res) => {
//   try {
//     const contract = await Contract.findById(req.params.id);

//     if (!contract) {
//       return res.status(404).json({ success: false, message: 'Contract not found' });
//     }

//     if (contract.owner.toString() !== req.user.id) {
//       return res.status(403).json({ success: false, message: 'Not authorized' });
//     }

//     const file = req.file;

//     const uploadPromise = new Promise((resolve, reject) => {
//       const stream = cloudinary.uploader.upload_stream(
//         { resource_type: 'auto', folder: 'safestay/contracts' },
//         (error, result) => {
//           if (error) reject(error);
//           else resolve({ url: result.secure_url, publicId: result.public_id });
//         }
//       );
//       stream.end(file.buffer);
//     });

//     const uploadedFile = await uploadPromise;

//     contract.contractDocument = uploadedFile;
//     await contract.save();

//     res.json({ success: true, data: contract });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Terminate contract
// // @route   PUT /api/contract/:id/terminate
// // @access  Private/Owner
// const terminateContract = async (req, res) => {
//   try {
//     const { reason } = req.body;

//     const contract = await Contract.findById(req.params.id);

//     if (!contract) {
//       return res.status(404).json({ success: false, message: 'Contract not found' });
//     }

//     if (contract.owner.toString() !== req.user.id && req.user.role !== 'master_admin') {
//       return res.status(403).json({ success: false, message: 'Not authorized' });
//     }

//     contract.status = 'terminated';
//     contract.terminationReason = reason;
//     contract.terminatedAt = Date.now();

//     await contract.save();

//     // Update room occupancy
//     const room = await Room.findById(contract.room);
//     room.tenants = room.tenants.filter(t => t.toString() !== contract.tenant.toString());
//     room.currentOccupancy -= 1;
//     room.isAvailable = true;
//     await room.save();

//     // Clear tenant's current hostel and room
//     const tenant = await require('../models/User').findById(contract.tenant);
//     tenant.currentHostel = null;
//     tenant.currentRoom = null;
//     await tenant.save();

//     res.json({ success: true, data: contract });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get all contracts for owner
// // @route   GET /api/contract/owner/contracts
// // @access  Private/Owner
// const getOwnerContracts = async (req, res) => {
//   try {
//     const { status } = req.query;
//     const query = { owner: req.user.id };

//     if (status) query.status = status;

//     const contracts = await Contract.find(query)
//       .populate('tenant', 'name email phone')
//       .populate('hostel', 'name')
//       .populate('room', 'roomNumber')
//       .sort({ createdAt: -1 });

//     res.json({ success: true, data: contracts });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = {
//   createContract,
//   getContract,
//   signContract,
//   uploadContractDocument,
//   terminateContract,
//   getOwnerContracts,
// };

// // ==================== routes/authRoutes.js ====================
// const express = require('express');
// const router = express.Router();
// const { register, login, getMe, updateProfile } = require('../controllers/authController');
// const { protect } = require('../middleware/authMiddleware');
// const { validateRegister, validateLogin, handleValidationErrors } = require('../utils/validators');

// router.post('/register', validateRegister, handleValidationErrors, register);
// router.post('/login', validateLogin, handleValidationErrors, login);
// router.get('/me', protect, getMe);
// router.put('/profile', protect, updateProfile);

// module.exports = router;

// // ==================== routes/adminRoutes.js ====================
// const express = require('express');
// const router = express.Router();
// const {
//   getAllUsers,
//   getDashboardStats,
//   verifyHostel,
//   toggleUserStatus,
//   getAllHostels,
// } = require('../controllers/adminController');
// const { protect } = require('../middleware/authMiddleware');
// const { authorize } = require('../middleware/roleMiddleware');

// router.use(protect);
// router.use(authorize('master_admin'));

// router.get('/users', getAllUsers);
// router.get('/stats', getDashboardStats);
// router.get('/hostels', getAllHostels);
// router.put('/hostels/:id/verify', verifyHostel);
// router.put('/users/:id/toggle-status', toggleUserStatus);

// module.exports = router;

// // ==================== routes/ownerRoutes.js ====================
// const express = require('express');
// const router = express.Router();
// const {
//   createHostel,
//   getMyHostels,
//   updateHostel,
//   uploadHostelMedia,
//   createRoom,
//   getHostelRooms,
//   updateRoom,
// } = require('../controllers/ownerController');
// const { protect } = require('../middleware/authMiddleware');
// const { authorize } = require('../middleware/roleMiddleware');
// const upload = require('../middleware/uploadMiddleware');

// router.use(protect);
// router.use(authorize('owner'));

// router.route('/hostels')
//   .post(createHostel)
//   .get(getMyHostels);

// router.route('/hostels/:id')
//   .put(updateHostel);

// router.post('/hostels/:id/upload', upload.array('files', 10), uploadHostelMedia);

// router.route('/hostels/:id/rooms')
//   .post(createRoom)
//   .get(getHostelRooms);

// router.put('/rooms/:id', updateRoom);

// module.exports = router;

// // ==================== routes/tenantRoutes.js ====================
// const express = require('express');
// const router = express.Router();
// const {
//   searchHostels,
//   getHostelDetails,
//   getMyExpenses,
//   addExpense,
//   submitFeedback,
//   getMyContracts,
// } = require('../controllers/tenantController');
// const { protect } = require('../middleware/authMiddleware');
// const { authorize } = require('../middleware/roleMiddleware');

// router.use(protect);
// router.use(authorize('tenant'));

// router.get('/hostels/search', searchHostels);
// router.get('/hostels/:id', getHostelDetails);
// router.get('/expenses', getMyExpenses);
// router.post('/expenses', addExpense);
// router.post('/feedback', submitFeedback);
// router.get('/contracts', getMyContracts);

// module.exports = router;

// // ==================== routes/canteenRoutes.js ====================
// const express = require('express');
// const router = express.Router();
// const {
//   createCanteen,
//   getMyCanteens,
//   addMenuItem,
//   getCanteenMenu,
//   updateMenuItem,
//   createOrder,
//   verifyPayment,
//   getProviderOrders,
//   updateOrderStatus,
//   getMyOrders,
// } = require('../controllers/canteenController');
// const { protect } = require('../middleware/authMiddleware');
// const { authorize } = require('../middleware/roleMiddleware');

// // Provider routes
// router.post('/', protect, authorize('canteen_provider'), createCanteen);
// router.get('/my-canteens', protect, authorize('canteen_provider'), getMyCanteens);
// router.post('/:id/menu', protect, authorize('canteen_provider'), addMenuItem);
// router.put('/menu/:id', protect, authorize('canteen_provider'), updateMenuItem);
// router.get('/orders', protect, authorize('canteen_provider'), getProviderOrders);
// router.put('/orders/:id/status', protect, authorize('canteen_provider'), updateOrderStatus);

// // Public/Tenant routes
// router.get('/:id/menu', getCanteenMenu);
// router.post('/orders', protect, authorize('tenant'), createOrder);
// router.post('/orders/verify-payment', protect, authorize('tenant'), verifyPayment);
// router.get('/my-orders', protect, authorize('tenant'), getMyOrders);

// module.exports = router;

// // ==================== routes/contractRoutes.js ====================
// const express = require('express');
// const router = express.Router();
// const {
//   createContract,
//   getContract,
//   signContract,
//   uploadContractDocument,
//   terminateContract,
//   getOwnerContracts,
// } = require('../controllers/contractController');
// const { protect } = require('../middleware/authMiddleware');
// const { authorize } = require('../middleware/roleMiddleware');
// const upload = require('../middleware/uploadMiddleware');

// router.use(protect);

// router.post('/', authorize('owner'), createContract);
// router.get('/owner/contracts', authorize('owner'), getOwnerContracts);
// router.get('/:id', getContract);
// router.put('/:id/sign', signContract);
// router.post('/:id/upload', authorize('owner'), upload.single('document'), uploadContractDocument);
// router.put('/:id/terminate', authorize('owner', 'master_admin'), terminateContract);

// module.exports = router;

// // ==================== server.js ====================
// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const compression = require('compression');
// const morgan = require('morgan');
// const rateLimit = require('express-rate-limit');
// const http = require('http');
// const socketIO = require('socket.io');
// const connectDB = require('./config/db');
// const { errorHandler } = require('./middleware/errorMiddleware');

// // Import routes
// const authRoutes = require('./routes/authRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// const ownerRoutes = require('./routes/ownerRoutes');
// const tenantRoutes = require('./routes/tenantRoutes');
// const canteenRoutes = require('./routes/canteenRoutes');
// const contractRoutes = require('./routes/contractRoutes');

// // Initialize express
// const app = express();
// const server = http.createServer(app);
// const io = socketIO(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     methods: ['GET', 'POST'],
//   },
// });

// // Connect to database
// connectDB();

// // Middleware
// app.use(helmet());
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true,
// }));
// app.use(compression());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Logging
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// }

// // Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
// });
// app.use('/api/', limiter);

// // Socket.IO - Real-time order tracking
// io.on('connection', (socket) => {
//   console.log('New client connected:', socket.id);

//   socket.on('join-order-room', (orderId) => {
//     socket.join(`order-${orderId}`);
//     console.log(`Socket ${socket.id} joined order room: ${orderId}`);
//   });

//   socket.on('order-status-update', (data) => {
//     io.to(`order-${data.orderId}`).emit('order-updated', data);
//   });

//   socket.on('disconnect', () => {
//     console.log('Client disconnected:', socket.id);
//   });
// });

// // Make io accessible to routes
// app.set('io', io);

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/owner', ownerRoutes);
// app.use('/api/tenant', tenantRoutes);
// app.use('/api/canteen', canteenRoutes);
// app.use('/api/contract', contractRoutes);

// // Health check
// app.get('/api/health', (req, res) => {
//   res.json({ success: true, message: 'SafeStay Hub API is running' });
// });

// // 404 handler
// app.use((req, res) => {
//   res.status(404).json({ success: false, message: 'Route not found' });
// });

// // Error handler
// app.use(errorHandler);

// // Start server
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err) => {
//   console.log(`Error: ${err.message}`);
//   server.close(() => process.exit(1));
// });

// // ==================== API DOCUMENTATION ====================
// /*
// ========================================
// SAFESTAY HUB API ENDPOINTS
// ========================================

// BASE URL: http://localhost:5000/api

// ========================================
// AUTH ROUTES (/api/auth)
// ========================================
// POST   /register              - Register new user
// POST   /login                 - Login user
// GET    /me                    - Get current user (Protected)
// PUT    /profile               - Update user profile (Protected)

// ========================================
// ADMIN ROUTES (/api/admin)
// ========================================
// GET    /users                 - Get all users with filters
// GET    /stats                 - Get dashboard statistics
// GET    /hostels               - Get all hostels for verification
// PUT    /hostels/:id/verify    - Verify/reject hostel
// PUT    /users/:id/toggle-status - Activate/deactivate user

// ========================================
// OWNER ROUTES (/api/owner)
// ========================================
// POST   /hostels               - Create new hostel
// GET    /hostels               - Get owner's hostels
// PUT    /hostels/:id           - Update hostel
// POST   /hostels/:id/upload    - Upload hostel photos/videos
// POST   /hostels/:id/rooms     - Create room in hostel
// GET    /hostels/:id/rooms     - Get hostel rooms
// PUT    /rooms/:id             - Update room

// ========================================
// TENANT ROUTES (/api/tenant)
// ========================================
// GET    /hostels/search        - Search hostels with filters
// GET    /hostels/:id           - Get hostel details with rooms
// GET    /expenses              - Get tenant's expenses
// POST   /expenses              - Add/update monthly expense
// POST   /feedback              - Submit feedback
// GET    /contracts             - Get tenant's contracts

// ========================================
// CANTEEN ROUTES (/api/canteen)
// ========================================
// POST   /                      - Create canteen (Provider)
// GET    /my-canteens           - Get provider's canteens
// POST   /:id/menu              - Add menu item (Provider)
// GET    /:id/menu              - Get canteen menu (Public)
// PUT    /menu/:id              - Update menu item (Provider)
// POST   /orders                - Create order (Tenant)
// POST   /orders/verify-payment - Verify payment (Tenant)
// GET    /orders                - Get provider orders
// PUT    /orders/:id/status     - Update order status (Provider)
// GET    /my-orders             - Get tenant orders

// ========================================
// CONTRACT ROUTES (/api/contract)
// ========================================
// POST   /                      - Create contract (Owner)
// GET    /owner/contracts       - Get owner's contracts
// GET    /:id                   - Get contract by ID
// PUT    /:id/sign              - Sign contract (Tenant/Owner)
// POST   /:id/upload            - Upload contract document (Owner)
// PUT    /:id/terminate         - Terminate contract (Owner/Admin)

// ========================================
// REQUEST EXAMPLES
// ========================================

// 1. Register User:
// POST /api/auth/register
// {
//   "name": "John Doe",
//   "email": "john@example.com",
//   "phone": "9876543210",
//   "password": "password123",
//   "role": "tenant"
// }

// 2. Login:
// POST /api/auth/login
// {
//   "email": "john@example.com",
//   "password": "password123"
// }

// 3. Create Hostel:
// POST /api/owner/hostels
// Headers: { "Authorization": "Bearer <token>" }
// {
//   "name": "Green Valley PG",
//   "address": {
//     "street": "123 Main St",
//     "city": "Mysore",
//     "state": "Karnataka",
//     "pincode": "570001"
//   },
//   "description": "Comfortable PG with all amenities",
//   "hostelType": "boys",
//   "amenities": ["WiFi", "AC", "Laundry"],
//   "priceRange": { "min": 5000, "max": 8000 }
// }

// 4. Search Hostels:
// GET /api/tenant/hostels/search?city=Mysore&hostelType=boys&minPrice=5000

// 5. Create Order:
// POST /api/canteen/orders
// Headers: { "Authorization": "Bearer <token>" }
// {
//   "canteen": "canteen_id",
//   "items": [
//     { "menuItem": "item_id", "quantity": 2 }
//   ],
//   "deliveryAddress": {
//     "roomNumber": "101",
//     "floor": 1
//   }
// }

// 6. Create Contract:
// POST /api/contract
// Headers: { "Authorization": "Bearer <token>" }
// {
//   "tenant": "tenant_id",
//   "hostel": "hostel_id",
//   "room": "room_id",
//   "startDate": "2025-11-01",
//   "endDate": "2026-10-31",
//   "monthlyRent": 7000,
//   "securityDeposit": 14000,
//   "terms": [
//     { "clause": "Payment", "description": "Rent due on 1st of every month" }
//   ]
// }

// ========================================
// SOCKET.IO EVENTS (Real-time)
// ========================================
// Event: join-order-room
// Payload: orderId
// Description: Join room for real-time order updates

// Event: order-status-update
// Payload: { orderId, status, message }
// Description: Broadcast order status updates

// Event: order-updated
// Payload: { orderId, status, estimatedTime }
// Description: Receive order updates

// ========================================
// FEATURES IMPLEMENTED
// ========================================
// ✅ JWT Authentication & Authorization
// ✅ Role-based Access Control (Admin, Owner, Canteen Provider, Tenant)
// ✅ Hostel Management with 360° media upload
// ✅ Room Management & Occupancy Tracking
// ✅ Canteen System with Menu & Order Management
// ✅ Razorpay Payment Integration
// ✅ Digital Contract Management
// ✅ Expense Tracking for Tenants
// ✅ Feedback & Rating System
// ✅ Email & SMS Notifications (Nodemailer & Twilio)
// ✅ Real-time Order Tracking (Socket.IO)
// ✅ File Upload (Cloudinary)
// ✅ Input Validation & Error Handling
// ✅ Security (Helmet, Rate Limiting)
// ✅ API Documentation

// ========================================
// INSTALLATION & SETUP
// ========================================
// 1. npm install
// 2. Create .env file (refer .env.example)
// 3. Configure MongoDB, Cloudinary, Razorpay, Twilio
// 4. npm run dev (development)
// 5. npm start (production)

// ========================================
// TECH STACK
// ========================================
// - Node.js & Express.js
// - MongoDB & Mongoose
// - JWT & bcryptjs
// - Razorpay (Payments)
// - Twilio (SMS)
// - Nodemailer (Email)
// - Cloudinary (Media Storage)
// - Socket.IO (Real-time)
// - Express Validator
// - Helmet & CORS
// */Register new user
// // @route   POST /api/auth/register
// // @access  Public
// const register = async (req, res) => {
//   try {
//     const { name, email, phone, password, role } = req.body;

//     // Check if user exists
//     const userExists = await User.findOne({ $or: [{ email }, { phone }] });
//     if (userExists) {
//       return res.status(400).json({ success: false, message: 'User already exists' });
//     }

//     // Create user
//     const user = await User.create({
//       name,
//       email,
//       phone,
//       password,
//       role,
//     });

//     // Send welcome email
//     await sendEmail({
//       email: user.email,
//       subject: 'Welcome to SafeStay Hub',
//       message: `<h1>Welcome ${user.name}!</h1><p>Your account has been created successfully.</p>`,
//     });

//     // Send SMS
//     await sendSMS(user.phone, `Welcome to SafeStay Hub! Your account has been created successfully.`);

//     res.status(201).json({
//       success: true,
//       data: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//         token: generateToken(user._id),
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Login user
// // @route   POST /api/auth/login
// // @access  Public
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email }).select('+password');

//     if (!user || !(await user.matchPassword(password))) {
//       return res.status(401).json({ success: false, message: 'Invalid credentials' });
//     }

//     if (!user.isActive) {
//       return res.status(401).json({ success: false, message: 'Account is deactivated' });
//     }

//     res.json({
//       success: true,
//       data: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//         token: generateToken(user._id),
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get current user profile
// // @route   GET /api/auth/me
// // @access  Private
// const getMe = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     res.json({ success: true, data: user });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Update user profile
// // @route   PUT /api/auth/profile
// // @access  Private
// const updateProfile = async (req, res) => {
//   try {
//     const { name, phone, foodPreference } = req.body;

//     const user = await User.findById(req.user.id);
    
//     if (name) user.name = name;
//     if (phone) user.phone = phone;
//     if (foodPreference) user.foodPreference = foodPreference;

//     await user.save();

//     res.json({ success: true, data: user });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = { register, login, getMe, updateProfile };

// // ==================== controllers/adminController.js ====================
// const User = require('../models/User');
// const Hostel = require('../models/Hostel');
// const sendEmail = require('../utils/sendEmail');

// // @desc    Get all users
// // @route   GET /api/admin/users
// // @access  Private/Admin
// const getAllUsers = async (req, res) => {
//   try {
//     const { role, isActive, page = 1, limit = 10 } = req.query;
//     const query = {};

//     if (role) query.role = role;
//     if (isActive !== undefined) query.isActive = isActive === 'true';

//     const users = await User.find(query)
//       .select('-password')
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .sort({ createdAt: -1 });

//     const count = await User.countDocuments(query);

//     res.json({
//       success: true,
//       data: users,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(count / limit),
//         totalUsers: count,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get dashboard stats
// // @route   GET /api/admin/stats
// // @access  Private/Admin
// const getDashboardStats = async (req, res) => {
//   try {
//     const totalUsers = await User.countDocuments();
//     const totalOwners = await User.countDocuments({ role: 'owner' });
//     const totalTenants = await User.countDocuments({ role: 'tenant' });
//     const totalCanteenProviders = await User.countDocuments({ role: 'canteen_provider' });
    
//     const totalHostels = await Hostel.countDocuments();
//     const verifiedHostels = await Hostel.countDocuments({ verificationStatus: 'verified' });
//     const pendingHostels = await Hostel.countDocuments({ verificationStatus: 'pending' });

//     res.json({
//       success: true,
//       data: {
//         users: {
//           total: totalUsers,
//           owners: totalOwners,
//           tenants: totalTenants,
//           canteenProviders: totalCanteenProviders,
//         },
//         hostels: {
//           total: totalHostels,
//           verified: verifiedHostels,
//           pending: pendingHostels,
//         },
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Verify hostel
// // @route   PUT /api/admin/hostels/:id/verify
// // @access  Private/Admin
// const verifyHostel = async (req, res) => {
//   try {
//     const { status, notes } = req.body;

//     const hostel = await Hostel.findById(req.params.id).populate('owner');

//     if (!hostel) {
//       return res.status(404).json({ success: false, message: 'Hostel not found' });
//     }

//     hostel.verificationStatus = status;
//     hostel.verificationNotes = notes;

//     await hostel.save();

//     // Send email notification to owner
//     await sendEmail({
//       email: hostel.owner.email,
//       subject: `Hostel Verification ${status === 'verified' ? 'Approved' : 'Update'}`,
//       message: `<h2>Hostel: ${hostel.name}</h2><p>Status: ${status}</p><p>Notes: ${notes || 'N/A'}</p>`,
//     });

//     res.json({ success: true, data: hostel });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Toggle user active status
// // @route   PUT /api/admin/users/:id/toggle-status
// // @access  Private/Admin
// const toggleUserStatus = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);

//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     user.isActive = !user.isActive;
//     await user.save();

//     res.json({ success: true, data: user });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get all hostels for verification
// // @route   GET /api/admin/hostels
// // @access  Private/Admin
// const getAllHostels = async (req, res) => {
//   try {
//     const { verificationStatus, page = 1, limit = 10 } = req.query;
//     const query = {};

//     if (verificationStatus) query.verificationStatus = verificationStatus;

//     const hostels = await Hostel.find(query)
//       .populate('owner', 'name email phone')
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .sort({ createdAt: -1 });

//     const count = await Hostel.countDocuments(query);

//     res.json({
//       success: true,
//       data: hostels,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(count / limit),
//         totalHostels: count,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = {
//   getAllUsers,
//   getDashboardStats,
//   verifyHostel,
//   toggleUserStatus,
//   getAllHostels,
// };

// // ==================== controllers/ownerController.js ====================
// const Hostel = require('../models/Hostel');
// const Room = require('../models/Room');
// const cloudinary = require('../config/cloudinary');

// // @desc    Create new hostel
// // @route   POST /api/owner/hostels
// // @access  Private/Owner
// const createHostel = async (req, res) => {
//   try {
//     const hostelData = {
//       ...req.body,
//       owner: req.user.id,
//     };

//     const hostel = await Hostel.create(hostelData);

//     // Add hostel to user's owned hostels
//     req.user.ownedHostels.push(hostel._id);
//     await req.user.save();

//     res.status(201).json({ success: true, data: hostel });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get owner's hostels
// // @route   GET /api/owner/hostels
// // @access  Private/Owner
// const getMyHostels = async (req, res) => {
//   try {
//     const hostels = await Hostel.find({ owner: req.user.id })
//       .populate('canteen')
//       .sort({ createdAt: -1 });

//     res.json({ success: true, data: hostels });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Update hostel
// // @route   PUT /api/owner/hostels/:id
// // @access  Private/Owner
// const updateHostel = async (req, res) => {
//   try {
//     let hostel = await Hostel.findById(req.params.id);

//     if (!hostel) {
//       return res.status(404).json({ success: false, message: 'Hostel not found' });
//     }

//     // Check ownership
//     if (hostel.owner.toString() !== req.user.id) {
//       return res.status(403).json({ success: false, message: 'Not authorized' });
//     }

//     hostel = await Hostel.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     res.json({ success: true, data: hostel });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Upload hostel photos/videos
// // @route   POST /api/owner/hostels/:id/upload
// // @access  Private/Owner
// const uploadHostelMedia = async (req, res) => {
//   try {
//     const hostel = await Hostel.findById(req.params.id);

//     if (!hostel) {
//       return res.status(404).json({ success: false, message: 'Hostel not found' });
//     }

//     if (hostel.owner.toString() !== req.user.id) {
//       return res.status(403).json({ success: false, message: 'Not authorized' });
//     }

//     const files = req.files;
//     const uploadPromises = [];

//     for (const file of files) {
//       const uploadPromise = new Promise((resolve, reject) => {
//         const stream = cloudinary.uploader.upload_stream(
//           { resource_type: 'auto', folder: 'safestay/hostels' },
//           (error, result) => {
//             if (error) reject(error);
//             else resolve({ url: result.secure_url, publicId: result.public_id });
//           }
//         );
//         stream.end(file.buffer);
//       });
//       uploadPromises.push(uploadPromise);
//     }

//     const uploadedFiles = await Promise.all(uploadPromises);

//     // Separate photos and videos
//     uploadedFiles.forEach(file => {
//       if (file.url.includes('video')) {
//         hostel.video360.push(file);
//       } else {
//         hostel.photos.push(file);
//       }
//     });

//     await hostel.save();

//     res.json({ success: true, data: hostel });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Create room
// // @route   POST /api/owner/hostels/:id/rooms
// // @access  Private/Owner
// const createRoom = async (req, res) => {
//   try {
//     const hostel = await Hostel.findById(req.params.id);

//     if (!hostel) {
//       return res.status(404).json({ success: false, message: 'Hostel not found' });
//     }

//     if (hostel.owner.toString() !== req.user.id) {
//       return res.status(403).json({ success: false, message: 'Not authorized' });
//     }

//     const room = await Room.create({
//       ...req.body,
//       hostel: hostel._id,
//     });

//     hostel.totalRooms += 1;
//     if (room.isAvailable) {
//       hostel.availableRooms += 1;
//     }

//     await hostel.save();

//     res.status(201).json({ success: true, data: room });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get hostel rooms
// // @route   GET /api/owner/hostels/:id/rooms
// // @access  Private/Owner
// const getHostelRooms = async (req, res) => {
//   try {
//     const hostel = await Hostel.findById(req.params.id);

//     if (!hostel) {
//       return res.status(404).json({ success: false, message: 'Hostel not found' });
//     }

//     if (hostel.owner.toString() !== req.user.id) {
//       return res.status(403).json({ success: false, message: 'Not authorized' });
//     }

//     const rooms = await Room.find({ hostel: hostel._id }).populate('tenants', 'name email phone');

//     res.json({ success: true, data: rooms });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Update room
// // @route   PUT /api/owner/rooms/:id
// // @access  Private/Owner
// const updateRoom = async (req, res) => {
//   try {
//     const room = await Room.findById(req.params.id).populate('hostel');

//     if (!room) {
//       return res.status(404).json({ success: false, message: 'Room not found' });
//     }

//     if (room.hostel.owner.toString() !== req.user.id) {
//       return res.status(403).json({ success: false, message: 'Not authorized' });
//     }

//     const updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     res.json({ success: true, data: updatedRoom });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = {
//   createHostel,
//   getMyHostels,
//   updateHostel,
//   uploadHostelMedia,
//   createRoom,
//   getHostelRooms,
//   updateRoom,
// };

// // ==================== controllers/tenantController.js ====================
// const Hostel = require('../models/Hostel');
// const Room = require('../models/Room');
// const Order = require('../models/Order');
// const Expense = require('../models/Expense');
// const Feedback = require('../models/Feedback');
// const Contract = require('../models/Contract');

// // @desc    Search hostels
// // @route   GET /api/tenant/hostels/search
// // @access  Private/Tenant
// const searchHostels = async (req, res) => {
//   try {
//     const { city, hostelType, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    
//     const query = { verificationStatus: 'verified', isActive: true };

//     if (city) query['address.city'] = new RegExp(city, 'i');
//     if (hostelType) query.hostelType = hostelType;
//     if (minPrice || maxPrice) {
//       query['priceRange.min'] = { $gte: minPrice || 0 };
//       query['priceRange.max'] = { $lte: maxPrice || 999999 };
//     }

//     const hostels = await Hostel.find(query)
//       .populate('owner', 'name phone')
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .sort({ rating: -1 });

//     const count = await Hostel.countDocuments(query);

//     res.json({
//       success: true,
//       data: hostels,
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(count / limit),
//         totalHostels: count,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get hostel details
// // @route   GET /api/tenant/hostels/:id
// // @access  Private/Tenant
// const getHostelDetails = async (req, res) => {
//   try {
//     const hostel = await Hostel.findById(req.params.id)
//       .populate('owner', 'name email phone')
//       .populate('canteen');

//     if (!hostel) {
//       return res.status(404).json({ success: false, message: 'Hostel not found' });
//     }

//     const rooms = await Room.find({ hostel: hostel._id, isAvailable: true });

//     res.json({ success: true, data: { hostel, rooms } });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get tenant's expenses
// // @route   GET /api/tenant/expenses
// // @access  Private/Tenant
// const getMyExpenses = async (req, res) => {
//   try {
//     const { year, month } = req.query;
//     const query = { tenant: req.user.id };

//     if (year) query.year = parseInt(year);
//     if (month) query.month = parseInt(month);

//     const expenses = await Expense.find(query).sort({ year: -1, month: -1 });

//     res.json({ success: true, data: expenses });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Add/Update monthly expense
// // @route   POST /api/tenant/expenses
// // @access  Private/Tenant
// const addExpense = async (req, res) => {
//   try {
//     const { month, year, rent, electricity, water, food, maintenance, other } = req.body;

//     const totalExpense = (rent || 0) + (electricity || 0) + (water || 0) + 
//                         (food || 0) + (maintenance || 0) + 
//                         (other || []).reduce((sum, item) => sum + item.amount, 0);

//     const expense = await Expense.findOneAndUpdate(
//       { tenant: req.user.id, month, year },
//       { rent, electricity, water, food, maintenance, other, totalExpense },
//       { new: true, upsert: true, runValidators: true }
//     );

//     res.status(201).json({ success: true, data: expense });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Submit feedback
// // @route   POST /api/tenant/feedback
// // @access  Private/Tenant
// const submitFeedback = async (req, res) => {
//   try {
//     const { targetType, targetId, rating, comment } = req.body;

//     const feedback = await Feedback.create({
//       user: req.user.id,
//       targetType,
//       targetId,
//       rating,
//       comment,
//     });

//     // Update rating for target
//     if (targetType === 'hostel') {
//       const hostel = await Hostel.findById(targetId);
//       const feedbacks = await Feedback.find({ targetType: 'hostel', targetId });
//       const avgRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
      
//       hostel.rating = avgRating;
//       hostel.reviewCount = feedbacks.length;
//       await hostel.save();
//     }

//     res.status(201).json({ success: true, data: feedback });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get tenant's contracts
// // @route   GET /api/tenant/contracts
// // @access  Private/Tenant
// const getMyContracts = async (req, res) => {
//   try {
//     const contracts = await Contract.find({ tenant: req.user.id })
//       .populate('hostel', 'name address')
//       .populate('room', 'roomNumber floor')
//       .populate('owner', 'name phone')
//       .sort({ createdAt: -1 });

//     res.json({ success: true, data: contracts });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = {
//   searchHostels,
//   getHostelDetails,
//   getMyExpenses,
//   addExpense,
//   submitFeedback,
//   getMyContracts,
// };

// // ==================== controllers/canteenController.js ====================
// const Canteen = require('../models/Canteen');
// const MenuItem = require('../models/MenuItem');
// const Order = require('../models/Order');
// const razorpay = require('../config/razorpay');
// const crypto = require('crypto');

// // @desc    Create canteen
// // @route   POST /api/canteen
// // @access  Private/CanteenProvider
// const createCanteen = async (req, res) => {
//   try {
//     const canteen = await Canteen.create({
//       ...req.body,
//       provider: req.user.id,
//     });

//     req.user.canteens.push(canteen._id);
//     await req.user.save();

//     res.status(201).json({ success: true, data: canteen });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get provider's canteens
// // @route   GET /api/canteen/my-canteens
// // @access  Private/CanteenProvider
// const getMyCanteens = async (req, res) => {
//   try {
//     const canteens = await Canteen.find({ provider: req.user.id })
//       .populate('hostel', 'name address');

//     res.json({ success: true, data: canteens });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Add menu item
// // @route   POST /api/canteen/:id/menu
// // @access  Private/CanteenProvider
// const addMenuItem = async (req, res) => {
//   try {
//     const canteen = await Canteen.findById(req.params.id);

//     if (!canteen) {
//       return res.status(404).json({ success: false, message: 'Canteen not found' });
//     }

//     if (canteen.provider.toString() !== req.user.id) {
//       return res.status(403).json({ success: false, message: 'Not authorized' });
//     }

//     const menuItem = await MenuItem.create({
//       ...req.body,
//       canteen: canteen._id,
//     });

//     res.status(201).json({ success: true, data: menuItem });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get canteen menu
// // @route   GET /api/canteen/:id/menu
// // @access  Public
// const getCanteenMenu = async (req, res) => {
//   try {
//     const { category, foodType } = req.query;
//     const query = { canteen: req.params.id, isAvailable: true };

//     if (category) query.category = category;
//     if (foodType) query.foodType = foodType;

//     const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });

//     res.json({ success: true, data: menuItems });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Update menu item
// // @route   PUT /api/canteen/menu/:id
// // @access  Private/CanteenProvider
// const updateMenuItem = async (req, res) => {
//   try {
//     const menuItem = await MenuItem.findById(req.params.id).populate('canteen');

//     if (!menuItem) {
//       return res.status(404).json({ success: false, message: 'Menu item not found' });
//     }

//     if (menuItem.canteen.provider.toString() !== req.user.id) {
//       return res.status(403).json({ success: false, message: 'Not authorized' });
//     }

//     const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     res.json({ success: true, data: updatedItem });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Create order
// // @route   POST /api/canteen/orders
// // @access  Private/Tenant
// const createOrder = async (req, res) => {
//   try {
//     const { canteen, items, deliveryAddress, specialInstructions } = req.body;

//     // Calculate total
//     let totalAmount = 0;
//     const orderItems = [];

//     for (const item of items) {
//       const menuItem = await MenuItem.findById(item.menuItem);
//       if (!menuItem || !menuItem.isAvailable) {
//         return res.status(400).json({ success: false, message: `Item ${item.menuItem} not available` });
//       }
      
//       totalAmount += menuItem.price * item.quantity;
//       orderItems.push({
//         menuItem: menuItem._id,
//         name: menuItem.name,
//         quantity: item.quantity,
//         price: menuItem.price,
//       });
//     }

//     const canteenData = await Canteen.findById(canteen);
//     totalAmount += canteenData.deliveryCharge;

//     // Generate order number
//     const orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

//     // Create Razorpay order
//     const razorpayOrder = await razorpay.orders.create({
//       amount: totalAmount * 100, // Amount in paise
//       currency: 'INR',
//       receipt: orderNumber,
//     });

//     const order = await Order.create({
//       orderNumber,
//       tenant: req.user.id,
//       canteen,
//       items: orderItems,
//       totalAmount,
//       deliveryCharge: canteenData.deliveryCharge,
//       deliveryAddress,
//       specialInstructions,
//       razorpayOrderId: razorpayOrder.id,
//     });

//     res.status(201).json({
//       success: true,
//       data: order,
//       razorpayOrderId: razorpayOrder.id,
//       razorpayKeyId: process.env.RAZORPAY_KEY_ID,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Verify payment
// // @route   POST /api/canteen/orders/verify-payment
// // @access  Private/Tenant
// const verifyPayment = async (req, res) => {
//   try {
//     const { orderId, razorpayPaymentId, razorpaySignature } = req.body;

//     const order = await Order.findById(orderId);

//     if (!order) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     const sign = razorpayPaymentId + '|' + order.razorpayOrderId;
//     const expectedSign = crypto
//       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//       .update(sign.toString())
//       .digest('hex');

//     if (razorpaySignature === expectedSign) {
//       order.paymentStatus = 'paid';
//       order.razorpayPaymentId = razorpayPaymentId;
//       order.orderStatus = 'confirmed';
//       await order.save();

//       res.json({ success: true, message: 'Payment verified successfully', data: order });
//     } else {
//       order.paymentStatus = 'failed';
//       await order.save();
//       res.status(400).json({ success: false, message: 'Invalid payment signature' });
//     }
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get provider orders
// // @route   GET /api/canteen/orders
// // @access  Private/CanteenProvider
// const getProviderOrders = async (req, res) => {
//   try {
//     const { status, canteenId } = req.query;
    
//     const canteenQuery = canteenId ? { _id: canteenId } : { provider: req.user.id };
//     const canteens = await Canteen.find(canteenQuery);
//     const canteenIds = canteens.map(c => c._id);

//     const query = { canteen: { $in: canteenIds } };
//     if (status) query.orderStatus = status;

//     const orders = await Order.find(query)
//       .populate('tenant', 'name phone')
//       .populate('canteen', 'name')
//       .sort({ createdAt: -1 });

//     res.json({ success: true, data: orders });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Update order status
// // @route   PUT /api/canteen/orders/:id/status
// // @access  Private/CanteenProvider
// const updateOrderStatus = async (req, res) => {
//   try {
//     const { status } = req.body;

//     const order = await Order.findById(req.params.id).populate('canteen');

//     if (!order) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     if (order.canteen.provider.toString() !== req.user.id) {
//       return res.status(403).json({ success: false, message: 'Not authorized' });
//     }

//     order.orderStatus = status;
//     if (status === 'delivered') {
//       order.deliveredAt = Date.now();
//     }

//     await order.save();

//     res.json({ success: true, data: order });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // @desc    Get tenant orders
// // @route   GET /api/canteen/my-orders
// // @access  Private/Tenant
// const getMyOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({ tenant: req.user.id })
//       .populate('canteen', 'name')
//       .sort({ createdAt: -1 });

//     res.json({ success: true, data: orders });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = {
//   createCanteen,
//   getMyCanteens,
//   addMenuItem,
//   getCanteenMenu,
//   updateMenuItem,
//   createOrder,
//   verifyPayment,
//   getProviderOrders,
//   updateOrderStatus,
//   getMyOrders,
// };

// // ==================== controllers/contractController.js ====================
// const Contract = require('../models/Contract');
// const Room = require('../models/Room');
// const Hostel = require('../models/Hostel');
// const cloudinary = require('../config/cloudinary');
// const sendEmail = require('../utils/sendEmail');

// // @desc
