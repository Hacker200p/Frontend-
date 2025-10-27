const twilio = require('twilio');

// Initialize Twilio client only if credentials are available
let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('Twilio SMS client initialized');
  } catch (error) {
    console.warn('Twilio initialization error:', error.message);
  }
} else {
  console.log('Twilio credentials not configured - SMS disabled');
}

const sendSMS = async (phone, message) => {
  // If Twilio is not configured, just log and return
  if (!client) {
    console.log(`SMS (not sent - Twilio not configured): ${message} to ${phone}`);
    return;
  }

  // If phone number is not configured, skip
  if (!process.env.TWILIO_PHONE_NUMBER) {
    console.log(`SMS (not sent - phone number not configured): ${message} to ${phone}`);
    return;
  }

  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phone}`,
    });
    console.log(`SMS sent successfully to ${phone}`);
  } catch (error) {
    console.error('SMS Error:', error.message);
  }
};

module.exports = sendSMS;
