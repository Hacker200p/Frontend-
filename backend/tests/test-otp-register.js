const axios = require('axios');

const testOTPRegistration = async () => {
  console.log('🧪 Testing OTP Registration Flow\n');
  
  const testData = {
    name: 'Test User OTP',
    email: `test${Date.now()}@example.com`,
    phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
    password: 'password123',
    role: 'tenant'
  };

  console.log('📝 Test Data:', testData);
  console.log('\n1️⃣ Testing POST /api/auth/register (should send OTP)...\n');

  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', testData);
    
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.message && response.data.message.includes('OTP')) {
      console.log('\n✅ SUCCESS: OTP flow is working!');
      console.log('📱 Check server logs for the OTP code');
      console.log(`📞 Phone: ${testData.phone}`);
    } else {
      console.log('\n❌ WARNING: Response doesn\'t mention OTP');
      console.log('This might be using old registration flow');
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
};

// Run test
testOTPRegistration();
