#!/bin/bash

# Bvester Automated Testing Script
echo "🧪 Testing Bvester Critical User Flows..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test URL
test_url() {
    local url=$1
    local name=$2

    echo -n "Testing $name... "

    # Test HTTP status code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $status_code)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $status_code)"
        return 1
    fi
}

# Function to test button functionality
test_buttons() {
    local url=$1
    local name=$2

    echo -n "Testing $name button functionality... "

    # Check if JavaScript button handlers are present
    button_js=$(curl -s "$url" | grep -c "addEventListener.*click")

    if [ "$button_js" -gt 0 ]; then
        echo -e "${GREEN}✅ PASS${NC} ($button_js button handlers found)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (No button handlers found)"
        return 1
    fi
}

# Set environment (staging or production)
ENVIRONMENT=${1:-staging}

if [ "$ENVIRONMENT" = "production" ]; then
    BASE_URL="https://bvester.com"
    echo "🌐 Testing PRODUCTION environment"
else
    BASE_URL="http://bvester-staging.s3-website.eu-west-2.amazonaws.com"
    echo "🧪 Testing STAGING environment"
fi

echo "=========================================="

# Test results
failed_tests=0
total_tests=0

# Test 1: Homepage accessibility
((total_tests++))
test_url "$BASE_URL" "Homepage" || ((failed_tests++))

# Test 2: Login page accessibility
((total_tests++))
test_url "$BASE_URL/login-final.html" "Login Page" || ((failed_tests++))

# Test 3: Signup page accessibility
((total_tests++))
test_url "$BASE_URL/signup-final.html" "Signup Page" || ((failed_tests++))

# Test 4: Investment assessment accessibility
((total_tests++))
test_url "$BASE_URL/investment-assessment.html" "Investment Assessment" || ((failed_tests++))

# Test 5: Homepage button functionality
((total_tests++))
test_buttons "$BASE_URL" "Homepage" || ((failed_tests++))

echo "=========================================="

# Test JavaScript button navigation (only for staging/production that supports JS)
if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
    echo "🔍 Testing JavaScript button functionality..."

    # Check for specific button handlers
    homepage_content=$(curl -s "$BASE_URL")

    echo -n "Checking LOGIN button handler... "
    if echo "$homepage_content" | grep -q "login-final.html"; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((failed_tests++))
    fi
    ((total_tests++))

    echo -n "Checking SIGNUP button handler... "
    if echo "$homepage_content" | grep -q "signup-final.html"; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((failed_tests++))
    fi
    ((total_tests++))

    echo -n "Checking INVESTMENT SCORE button handler... "
    if echo "$homepage_content" | grep -q "investment-assessment.html"; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((failed_tests++))
    fi
    ((total_tests++))
fi

echo "=========================================="

# Summary
echo "📊 TEST SUMMARY:"
echo "Total Tests: $total_tests"
echo "Passed: $((total_tests - failed_tests))"
echo "Failed: $failed_tests"

if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo "✅ Environment is ready for deployment/use"
    exit 0
else
    echo -e "${RED}❌ $failed_tests TEST(S) FAILED!${NC}"
    echo "🚨 Please fix issues before deploying"
    exit 1
fi