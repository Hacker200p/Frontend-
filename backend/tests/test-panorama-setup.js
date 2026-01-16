const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test panorama service health
async function testPanoramaServiceHealth() {
  console.log('🔍 Testing Panorama Service Health...');
  try {
    const response = await axios.get('http://localhost:5001/health');
    console.log('✅ Panorama service is running:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Panorama service is not running');
    console.error('   Make sure to start it with: python panorama_service.py');
    return false;
  }
}

// Test backend connection
async function testBackendConnection() {
  console.log('\n🔍 Testing Backend Connection...');
  try {
    const response = await axios.get('http://localhost:3000/api/health');
    console.log('✅ Backend is running');
    return true;
  } catch (error) {
    console.error('❌ Backend is not running');
    console.error('   Make sure to start it with: npm run dev');
    return false;
  }
}

// Test room endpoint (requires authentication)
async function testRoomEndpoint(token) {
  console.log('\n🔍 Testing Room Endpoint...');
  try {
    const response = await axios.get('http://localhost:3000/api/owner/hostels', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Room API accessible');
    return true;
  } catch (error) {
    console.error('❌ Room API test failed (might need authentication)');
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Panorama Feature Test Suite\n');
  console.log('=' .repeat(50));
  
  const results = {
    panoramaService: await testPanoramaServiceHealth(),
    backend: await testBackendConnection()
  };

  console.log('\n' + '=' .repeat(50));
  console.log('\n📊 Test Results Summary:');
  console.log('-' .repeat(50));
  
  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(r => r).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });
  
  console.log('-' .repeat(50));
  console.log(`\n${passed}/${total} tests passed\n`);
  
  if (passed === total) {
    console.log('🎉 All systems ready! You can now:');
    console.log('   1. Login as an owner');
    console.log('   2. Edit a room');
    console.log('   3. Upload a panoramic photo');
    console.log('   4. View the 360° tour\n');
  } else {
    console.log('⚠️  Some services are not running. Please check:');
    if (!results.panoramaService) {
      console.log('   • Start panorama service: python panorama_service.py');
    }
    if (!results.backend) {
      console.log('   • Start backend: npm run dev');
    }
    console.log();
  }
}

// Run tests
runTests();
