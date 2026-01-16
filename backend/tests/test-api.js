/**
 * API Testing Script for SafeStay Hub
 * Run with: node test-api.js
 * 
 * Install axios first: npm install axios
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let tokens = {};
let testData = {};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Test result logger
class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async test(name, testFn) {
    try {
      await testFn();
      this.passed++;
      this.tests.push({ name, status: 'PASS' });
      console.log(`${colors.green}✓${colors.reset} ${name}`);
    } catch (error) {
      this.failed++;
      this.tests.push({ name, status: 'FAIL', error: error.message });
      console.log(`${colors.red}✗${colors.reset} ${name}`);
      console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    }
  }

  summary() {
    console.log(`\n${colors.blue}========== Test Summary ==========${colors.reset}`);
    console.log(`${colors.green}Passed: ${this.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.failed}${colors.reset}`);
    console.log(`Total: ${this.passed + this.failed}`);
    
    if (this.failed > 0) {
      console.log(`\n${colors.yellow}Failed tests:${colors.reset}`);
      this.tests.filter(t => t.status === 'FAIL').forEach(t => {
        console.log(`  - ${t.name}`);
        if (t.error) console.log(`    ${colors.red}${t.error}${colors.reset}`);
      });
    }
  }
}

const test = new TestRunner();

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {}
  };

  if (data) {
    config.headers['Content-Type'] = 'application/json';
    config.data = data;
  }

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`${error.response.status}: ${error.response.data.message || error.message}`);
    }
    throw error;
  }
}

// Test Suite
async function runTests() {
  console.log(`${colors.blue}Starting API Tests for SafeStay Hub...\n${colors.reset}`);

  // 1. Health Check
  await test.test('Health Check - GET /api/health', async () => {
    const response = await apiCall('get', '/health');
    if (!response.success) throw new Error('Health check failed');
  });

  // 2. Registration
  await test.test('Register Tenant - POST /api/auth/register', async () => {
    const response = await apiCall('post', '/auth/register', {
      name: 'Test Tenant',
      email: `tenant${Date.now()}@test.com`,
      phone: '9876543210',
      password: 'password123',
      role: 'tenant'
    });
    tokens.tenant = response.token;
    testData.tenantId = response.user._id;
  });

  await test.test('Register Owner - POST /api/auth/register', async () => {
    const response = await apiCall('post', '/auth/register', {
      name: 'Test Owner',
      email: `owner${Date.now()}@test.com`,
      phone: '9876543211',
      password: 'password123',
      role: 'owner'
    });
    tokens.owner = response.token;
    testData.ownerId = response.user._id;
  });

  await test.test('Register Canteen Provider - POST /api/auth/register', async () => {
    const response = await apiCall('post', '/auth/register', {
      name: 'Test Provider',
      email: `provider${Date.now()}@test.com`,
      phone: '9876543212',
      password: 'password123',
      role: 'canteen_provider'
    });
    tokens.provider = response.token;
    testData.providerId = response.user._id;
  });

  // 3. Login
  await test.test('Login Tenant - POST /api/auth/login', async () => {
    const response = await apiCall('post', '/auth/login', {
      email: `tenant${Date.now()}@test.com`,
      password: 'password123'
    });
    if (!response.token) throw new Error('Login failed');
  });

  // 4. Protected Routes - Auth
  await test.test('Get Current User - GET /api/auth/me', async () => {
    if (!tokens.tenant) throw new Error('No tenant token');
    const response = await apiCall('get', '/auth/me', null, tokens.tenant);
    if (!response._id) throw new Error('Invalid user data');
  });

  // 5. Owner Routes
  await test.test('Create Hostel - POST /api/owner/hostels', async () => {
    if (!tokens.owner) throw new Error('No owner token');
    const response = await apiCall('post', '/owner/hostels', {
      name: 'Test Hostel',
      address: {
        street: '123 Test St',
        city: 'Mysore',
        state: 'Karnataka',
        pincode: '570001'
      },
      description: 'Test description',
      hostelType: 'boys',
      amenities: ['WiFi', 'AC'],
      priceRange: { min: 5000, max: 8000 }
    }, tokens.owner);
    testData.hostelId = response._id;
  });

  await test.test('Get My Hostels - GET /api/owner/hostels', async () => {
    if (!tokens.owner) throw new Error('No owner token');
    const response = await apiCall('get', '/owner/hostels', null, tokens.owner);
    if (!Array.isArray(response)) throw new Error('Expected array');
  });

  // 6. Tenant Routes
  await test.test('Search Hostels - GET /api/tenant/hostels/search', async () => {
    if (!tokens.tenant) throw new Error('No tenant token');
    const response = await apiCall('get', '/tenant/hostels/search?city=Mysore', null, tokens.tenant);
    if (!Array.isArray(response)) throw new Error('Expected array');
  });

  await test.test('Get My Expenses - GET /api/tenant/expenses', async () => {
    if (!tokens.tenant) throw new Error('No tenant token');
    const response = await apiCall('get', '/tenant/expenses', null, tokens.tenant);
    if (!Array.isArray(response)) throw new Error('Expected array');
  });

  await test.test('Add Expense - POST /api/tenant/expenses', async () => {
    if (!tokens.tenant) throw new Error('No tenant token');
    const response = await apiCall('post', '/tenant/expenses', {
      amount: 1500,
      category: 'food',
      description: 'Test expense',
      date: new Date().toISOString()
    }, tokens.tenant);
    if (!response._id) throw new Error('Failed to create expense');
  });

  // 7. Canteen Provider Routes
  await test.test('Create Canteen - POST /api/canteen', async () => {
    if (!tokens.provider) throw new Error('No provider token');
    const response = await apiCall('post', '/canteen', {
      name: 'Test Canteen',
      description: 'Test canteen description',
      location: 'Building A',
      openTime: '07:00',
      closeTime: '22:00'
    }, tokens.provider);
    testData.canteenId = response._id;
  });

  await test.test('Get My Canteens - GET /api/canteen/my-canteens', async () => {
    if (!tokens.provider) throw new Error('No provider token');
    const response = await apiCall('get', '/canteen/my-canteens', null, tokens.provider);
    if (!Array.isArray(response)) throw new Error('Expected array');
  });

  // 8. Contract Routes
  await test.test('Get My Contracts (Tenant) - GET /api/tenant/contracts', async () => {
    if (!tokens.tenant) throw new Error('No tenant token');
    const response = await apiCall('get', '/tenant/contracts', null, tokens.tenant);
    if (!Array.isArray(response)) throw new Error('Expected array');
  });

  // Print summary
  test.summary();
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});

