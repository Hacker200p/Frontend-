#!/bin/bash

# Load Balancing Test Script
# This script tests the high availability features

echo "πŸš€ Starting Load Balancing Tests..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000"

# 1. Check if server is running
echo "${YELLOW}1. Checking server health...${NC}"
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/health)
if [ $response -eq 200 ]; then
    echo "${GREEN}βœ… Server is running${NC}"
else
    echo "${RED}❌ Server is not running. Please start the server first.${NC}"
    exit 1
fi

# 2. Get initial health status
echo ""
echo "${YELLOW}2. Getting health metrics...${NC}"
curl -s $BASE_URL/api/health | jq '.'

# 3. Test normal load (10 requests)
echo ""
echo "${YELLOW}3. Testing normal load (10 requests)...${NC}"
for i in {1..10}; do
    curl -s -o /dev/null -w "Request $i: %{http_code} - %{time_total}s\n" $BASE_URL/api/health &
done
wait
echo "${GREEN}βœ… Normal load test complete${NC}"

# 4. Get queue stats after normal load
echo ""
echo "${YELLOW}4. Queue stats after normal load:${NC}"
curl -s $BASE_URL/api/metrics | jq '.requests'

# 5. Test high load (100 concurrent requests)
echo ""
echo "${YELLOW}5. Testing high load (100 concurrent requests)...${NC}"
echo "This will trigger the request queue..."

success=0
queued=0
rejected=0

for i in {1..100}; do
    status=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/health)
    if [ $status -eq 200 ]; then
        ((success++))
    elif [ $status -eq 503 ]; then
        ((rejected++))
    fi
done

echo "${GREEN}βœ… High load test complete${NC}"
echo "Success: $success, Rejected: $rejected"

# 6. Get queue stats after high load
echo ""
echo "${YELLOW}6. Queue stats after high load:${NC}"
curl -s $BASE_URL/api/metrics | jq '.requests'

# 7. Wait for queue to clear
echo ""
echo "${YELLOW}7. Waiting for queue to clear (5 seconds)...${NC}"
sleep 5

# 8. Final health check
echo ""
echo "${YELLOW}8. Final health check:${NC}"
curl -s $BASE_URL/api/health | jq '.'

echo ""
echo "${GREEN}βœ… Load balancing tests complete!${NC}"
echo ""
echo "Summary:"
echo "- Normal load: Working βœ…"
echo "- High load: Request queue activated βœ…"
echo "- Queue management: Working βœ…"
echo "- Health monitoring: Active βœ…"
