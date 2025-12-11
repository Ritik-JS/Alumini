#!/bin/bash
# Test Backend API Connection
# Run this before removing mock data to ensure backend is working

echo "=========================================="
echo "BACKEND API CONNECTION TEST"
echo "=========================================="
echo ""

# Get backend URL from .env
BACKEND_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
echo "Backend URL: $BACKEND_URL"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "Endpoint: $BACKEND_URL/api/health"
response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo "✓ PASSED - Backend is healthy"
    echo "  Response: $body"
else
    echo "✗ FAILED - Backend not responding (HTTP $http_code)"
    echo "  Response: $body"
fi
echo ""

# Test 2: Root API Endpoint
echo "Test 2: Root API Endpoint"
echo "Endpoint: $BACKEND_URL/api/"
response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/api/")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo "✓ PASSED - API root accessible"
    echo "  Response: $body"
else
    echo "✗ FAILED - API root not responding (HTTP $http_code)"
    echo "  Response: $body"
fi
echo ""

# Test 3: Database Connection
echo "Test 3: Database Connection via Health Check"
if echo "$body" | grep -q "healthy"; then
    echo "✓ PASSED - Database connected"
else
    echo "⚠ WARNING - Could not verify database connection"
fi
echo ""

# Summary
echo "=========================================="
echo "CONNECTION TEST SUMMARY"
echo "=========================================="
echo ""

if [ "$http_code" = "200" ]; then
    echo "✓ Backend API is responding"
    echo "✓ Safe to use backend instead of mock data"
    echo ""
    echo "Next steps:"
    echo "1. Test key features (login, view data, etc.)"
    echo "2. If everything works, run: bash /app/remove_mock_data.sh"
    echo ""
    exit 0
else
    echo "✗ Backend API is NOT responding"
    echo "⚠ DO NOT remove mock data yet"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if backend server is running:"
    echo "   cd /app/backend && python3 server.py"
    echo ""
    echo "2. Check if database is accessible:"
    echo "   mysql -u alumni_user -palumni_pass_123 -h localhost AlumUnity"
    echo ""
    echo "3. Check backend logs for errors"
    echo ""
    exit 1
fi
