import Razorpay from 'razorpay';

// Initialize Razorpay only if credentials are available
let razorpayInstance = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('Razorpay initialized successfully');
} else {
  console.log('Razorpay credentials not configured - payments disabled');
}

export default razorpayInstance;