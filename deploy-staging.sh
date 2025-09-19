#!/bin/bash

# Bvester Staging Deployment Script
echo "🚀 Deploying to Bvester Staging Environment..."

# Check if files exist
if [ ! -f "index.html" ]; then
    echo "❌ index.html not found!"
    exit 1
fi

echo "📂 Deploying HTML files to staging..."

# Deploy essential files to staging
aws s3 cp index.html s3://bvester-staging/index.html --content-type "text/html" || exit 1
aws s3 cp login-final.html s3://bvester-staging/login-final.html --content-type "text/html" || exit 1
aws s3 cp signup-final.html s3://bvester-staging/signup-final.html --content-type "text/html" || exit 1
aws s3 cp investment-assessment.html s3://bvester-staging/investment-assessment.html --content-type "text/html" || exit 1

echo "✅ Staging deployment complete!"
echo "🌐 Staging URL: http://bvester-staging.s3-website.eu-west-2.amazonaws.com"
echo ""
echo "🧪 Please test the following:"
echo "- Homepage loads and buttons work"
echo "- Login page accessible and functional"
echo "- Signup page accessible and functional"
echo "- Investment assessment page accessible"
echo "- Mobile responsiveness"
echo ""
echo "👉 After testing, run: ./deploy-production.sh"