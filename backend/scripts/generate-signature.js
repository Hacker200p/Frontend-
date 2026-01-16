/**
 * Quick Razorpay Signature Generator
 * Use this to generate valid signatures for testing payment verification
 * 
 * Usage: node generate-signature.js
 */

require('dotenv').config();
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║     RAZORPAY PAYMENT SIGNATURE GENERATOR          ║');
console.log('╚════════════════════════════════════════════════════╝\n');

// Check if Razorpay secret is configured
if (!process.env.RAZORPAY_KEY_SECRET) {
  console.log('❌ RAZORPAY_KEY_SECRET not found in .env file');
  console.log('Please add it to your .env file and try again.\n');
  process.exit(1);
}

function generateSignature(razorpayOrderId, razorpayPaymentId) {
  const sign = razorpayPaymentId + '|' + razorpayOrderId;
  const signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest('hex');
  
  return signature;
}

function promptForInput() {
  rl.question('\nEnter Razorpay Order ID (from create order response): ', (orderId) => {
    if (!orderId.trim()) {
      console.log('❌ Order ID is required');
      rl.close();
      return;
    }
    
    rl.question('\nEnter Payment ID (or press Enter to generate mock): ', (paymentId) => {
      // Generate mock payment ID if not provided
      const finalPaymentId = paymentId.trim() || `pay_${Date.now()}${Math.random().toString(36).substring(7)}`;
      
      const signature = generateSignature(orderId.trim(), finalPaymentId);
      
      console.log('\n' + '─'.repeat(60));
      console.log('✅ Signature Generated Successfully!');
      console.log('─'.repeat(60));
      console.log('\nUse these values in your verify payment request:\n');
      console.log(`{`);
      console.log(`  "orderId": "YOUR_ORDER_ID",`);
      console.log(`  "razorpayPaymentId": "${finalPaymentId}",`);
      console.log(`  "razorpaySignature": "${signature}"`);
      console.log(`}\n`);
      console.log('─'.repeat(60));
      console.log('\nCopy the above JSON to test payment verification!\n');
      
      rl.question('Generate another signature? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          promptForInput();
        } else {
          console.log('\nGoodbye! 👋\n');
          rl.close();
        }
      });
    });
  });
}

// Start the interactive prompt
promptForInput();
