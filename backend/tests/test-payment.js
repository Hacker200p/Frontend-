/**
 * Test script for Razorpay payment flow
 * This simulates the complete payment process without a frontend
 * 
 * Usage: node test-payment.js
 */

require('dotenv').config();
const crypto = require('crypto');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let authToken = '';
let userId = '';
let canteenId = '';
let menuItemId = '';
let orderId = '';
let razorpayOrderId = '';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}`),
  data: (label, data) => console.log(`${colors.yellow}${label}:${colors.reset}`, data),
};

// Step 1: Register/Login as tenant
async function loginAsTenant() {
  log.step('STEP 1: Login as Tenant');
  
  try {
    // Try to login first
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test.tenant@example.com',
      password: 'password123',
    });
    
    authToken = loginResponse.data.data.token;
    userId = loginResponse.data.data._id;
    log.success('Logged in successfully');
    log.data('Token', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    // If login fails, register
    log.info('Login failed, attempting to register...');
    
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
        name: 'Test Tenant',
        email: 'test.tenant@example.com',
        phone: '9876543210',
        password: 'password123',
        role: 'tenant',
      });
      
      authToken = registerResponse.data.data.token;
      userId = registerResponse.data.data._id;
      log.success('Registered successfully');
      log.data('Token', authToken.substring(0, 20) + '...');
      return true;
    } catch (regError) {
      log.error('Registration failed: ' + regError.response?.data?.message || regError.message);
      return false;
    }
  }
}

// Step 2: Get or create a canteen and menu item
async function setupCanteenAndMenu() {
  log.step('STEP 2: Setup Canteen & Menu');
  
  // First, login/register as canteen provider
  let providerToken = '';
  
  try {
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test.provider@example.com',
      password: 'password123',
    });
    providerToken = loginResponse.data.data.token;
  } catch (error) {
    try {
      const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
        name: 'Test Provider',
        email: 'test.provider@example.com',
        phone: '9876543211',
        password: 'password123',
        role: 'canteen_provider',
      });
      providerToken = registerResponse.data.data.token;
    } catch (regError) {
      log.error('Failed to setup provider: ' + regError.message);
      return false;
    }
  }
  
  // Get existing canteens or create one
  try {
    const canteensResponse = await axios.get(`${BASE_URL}/api/canteen/my-canteens`, {
      headers: { Authorization: `Bearer ${providerToken}` },
    });
    
    if (canteensResponse.data.data.length > 0) {
      canteenId = canteensResponse.data.data[0]._id;
      log.success('Using existing canteen');
    } else {
      // Create canteen
      const createCanteen = await axios.post(
        `${BASE_URL}/api/canteen`,
        {
          name: 'Test Canteen',
          description: 'Test canteen for payment testing',
          location: 'Test Location',
          openTime: '08:00',
          closeTime: '20:00',
        },
        { headers: { Authorization: `Bearer ${providerToken}` } }
      );
      canteenId = createCanteen.data.data._id;
      log.success('Created new canteen');
    }
    
    log.data('Canteen ID', canteenId);
    
    // Create a menu item
    const menuItem = await axios.post(
      `${BASE_URL}/api/canteen/${canteenId}/menu`,
      {
        name: 'Test Biryani',
        description: 'Delicious test biryani',
        price: 150,
        category: 'main_course',
        isAvailable: true,
      },
      { headers: { Authorization: `Bearer ${providerToken}` } }
    );
    
    menuItemId = menuItem.data.data._id;
    log.success('Created menu item');
    log.data('Menu Item ID', menuItemId);
    
    return true;
  } catch (error) {
    log.error('Setup failed: ' + (error.response?.data?.message || error.message));
    return false;
  }
}

// Step 3: Create order
async function createOrder() {
  log.step('STEP 3: Create Order');
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/canteen/orders`,
      {
        canteen: canteenId,
        items: [
          {
            menuItem: menuItemId,
            quantity: 2,
          },
        ],
        deliveryAddress: {
          roomNumber: '101',
          floor: 1,
        },
        specialInstructions: 'Test order - please handle with care',
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    orderId = response.data.data._id;
    razorpayOrderId = response.data.razorpayOrderId;
    
    log.success('Order created successfully');
    log.data('Order ID', orderId);
    log.data('Razorpay Order ID', razorpayOrderId);
    log.data('Amount', response.data.amount);
    log.data('Razorpay Key ID', response.data.razorpayKeyId);
    
    return response.data;
  } catch (error) {
    log.error('Order creation failed: ' + (error.response?.data?.message || error.message));
    if (error.response?.data?.message === 'Payment service not configured. Please contact administrator.') {
      log.info('Make sure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in your .env file');
    }
    return null;
  }
}

// Step 4: Simulate Razorpay payment and generate signature
function generateRazorpaySignature(razorpayOrderId, razorpayPaymentId) {
  log.step('STEP 4: Simulate Razorpay Payment');
  
  // In real scenario, this payment_id comes from Razorpay after user pays
  // For testing, we generate a mock payment ID
  const mockPaymentId = razorpayPaymentId || `pay_${Date.now()}${Math.random().toString(36).substring(7)}`;
  
  // Generate signature using the same algorithm Razorpay uses
  const sign = mockPaymentId + '|' + razorpayOrderId;
  const signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest('hex');
  
  log.success('Generated mock payment details');
  log.data('Payment ID', mockPaymentId);
  log.data('Signature', signature);
  
  return {
    razorpayPaymentId: mockPaymentId,
    razorpaySignature: signature,
  };
}

// Step 5: Verify payment
async function verifyPayment(paymentDetails) {
  log.step('STEP 5: Verify Payment');
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/canteen/orders/verify-payment`,
      {
        orderId: orderId,
        razorpayPaymentId: paymentDetails.razorpayPaymentId,
        razorpaySignature: paymentDetails.razorpaySignature,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    log.success('Payment verified successfully!');
    log.data('Order Status', response.data.data.orderStatus);
    log.data('Payment Status', response.data.data.paymentStatus);
    
    return true;
  } catch (error) {
    log.error('Payment verification failed: ' + (error.response?.data?.message || error.message));
    return false;
  }
}

// Main test flow
async function runPaymentTest() {
  console.log('\n' + '='.repeat(60));
  console.log('  RAZORPAY PAYMENT FLOW TEST');
  console.log('='.repeat(60));
  
  // Check if Razorpay is configured
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    log.error('Razorpay credentials not found in .env file');
    log.info('Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file');
    process.exit(1);
  }
  
  try {
    // Step 1: Login
    const loginSuccess = await loginAsTenant();
    if (!loginSuccess) {
      log.error('Failed to login. Exiting...');
      return;
    }
    
    // Step 2: Setup canteen and menu
    const setupSuccess = await setupCanteenAndMenu();
    if (!setupSuccess) {
      log.error('Failed to setup canteen. Exiting...');
      return;
    }
    
    // Step 3: Create order
    const orderData = await createOrder();
    if (!orderData) {
      log.error('Failed to create order. Exiting...');
      return;
    }
    
    // Step 4: Generate payment signature (simulating Razorpay response)
    const paymentDetails = generateRazorpaySignature(razorpayOrderId);
    
    // Step 5: Verify payment
    const verifySuccess = await verifyPayment(paymentDetails);
    
    if (verifySuccess) {
      console.log('\n' + '='.repeat(60));
      log.success('PAYMENT TEST COMPLETED SUCCESSFULLY! 🎉');
      console.log('='.repeat(60) + '\n');
    } else {
      console.log('\n' + '='.repeat(60));
      log.error('PAYMENT TEST FAILED');
      console.log('='.repeat(60) + '\n');
    }
  } catch (error) {
    log.error('Unexpected error: ' + error.message);
    console.error(error);
  }
}

// Run the test
runPaymentTest();
