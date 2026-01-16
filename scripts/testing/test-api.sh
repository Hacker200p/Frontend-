#!/bin/bash
# Test API connectivity

echo "Testing SafeStay Hub API Connection..."
echo ""

# Test Backend Health
echo "1. Testing Backend Health Check"
curl -s http://localhost:5000/api/auth/login | head -c 200
echo ""
echo ""

# Test Auth Register Endpoint
echo "2. Testing Register Endpoint"
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phoneNumber": "+1234567890",
    "password": "testpass123",
    "userRole": "tenant"
  }' | head -c 500
echo ""
echo ""

echo "Done!"
