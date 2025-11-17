/**
 * Razorpay Payment Handler
 * Handles Razorpay payment initialization and verification
 */

export const initializeRazorpay = () => {
  return new Promise((resolve) => {
    // Check if already loaded
    if (window.Razorpay) {
      console.log('✓ Razorpay already loaded')
      resolve(true)
      return
    }

    console.log('📡 Loading Razorpay script...')
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      console.log('✓ Razorpay script loaded successfully')
      resolve(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script')
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const handleExpensePayment = async (orderData, tenantAPI) => {
  try {
    console.log('🎯 handleExpensePayment called with orderData:', orderData)

    // Initialize Razorpay script
    const isRazorpayLoaded = await initializeRazorpay();
    if (!isRazorpayLoaded) {
      throw new Error('Failed to load Razorpay. Please check your internet connection.');
    }

    // Get current user info from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('👤 User data:', userData)

    const options = {
      key: orderData.razorpayKeyId,
      amount: orderData.order.amount * 100, // Convert to paise
      currency: orderData.order.currency,
      order_id: orderData.order.id,
      handler: async (response) => {
        console.log('✓ Payment handler called with response:', response)
        // Payment successful callback - will be handled by caller
        return response;
      },
      prefill: {
        name: userData.name || '',
        email: userData.email || '',
        contact: userData.phone || '',
      },
      theme: {
        color: '#3b82f6', // Primary color
      },
      modal: {
        ondismiss: function () {
          console.log('⚠️ Payment modal closed by user')
        }
      }
    };

    console.log('🔐 Razorpay options:', {
      key: options.key,
      amount: options.amount,
      currency: options.currency,
      order_id: options.order_id
    })

    return new Promise((resolve, reject) => {
      const razorpay = new window.Razorpay({
        ...options,
        handler: (response) => {
          console.log('✓ Payment successful, response:', response)
          resolve(response);
        }
      });

      razorpay.on('payment.failed', (error) => {
        console.error('❌ Payment failed:', error)
        reject(error);
      });

      console.log('🔓 Opening Razorpay checkout...')
      razorpay.open();
    });
  } catch (error) {
    console.error('❌ handleExpensePayment error:', error);
    throw error;
  }
};

export const handleBookingPayment = async (orderData, tenantAPI) => {
  try {
    // Initialize Razorpay script
    const isRazorpayLoaded = await initializeRazorpay();
    if (!isRazorpayLoaded) {
      throw new Error('Failed to load Razorpay. Please check your internet connection.');
    }

    // Get current user info from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');

    const options = {
      key: orderData.razorpayKeyId,
      amount: orderData.order.amount * 100, // Convert to paise
      currency: orderData.order.currency,
      order_id: orderData.order.id,
      handler: async (response) => {
        return response;
      },
      prefill: {
        name: userData.name || '',
        email: userData.email || '',
        contact: userData.phone || '',
      },
      theme: {
        color: '#3b82f6',
      },
    };

    return new Promise((resolve, reject) => {
      const razorpay = new window.Razorpay({
        ...options,
        handler: (response) => {
          resolve(response);
        }
      });

      razorpay.on('payment.failed', (error) => {
        reject(error);
      });

      razorpay.open();
    });
  } catch (error) {
    console.error('Razorpay error:', error);
    throw error;
  }
};
