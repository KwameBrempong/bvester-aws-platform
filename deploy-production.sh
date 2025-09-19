#!/bin/bash

# Bvester Production Deployment Script
echo "🚀 Deploying to Bvester Production Environment..."

# Warning prompt
echo "⚠️  WARNING: This will deploy to PRODUCTION (bvester.com)"
echo "Have you tested in staging first? (y/N)"
read -r confirmation
if [ "$confirmation" != "y" ] && [ "$confirmation" != "Y" ]; then
    echo "❌ Deployment cancelled. Please test in staging first."
    exit 1
fi

# Check if files exist
if [ ! -f "index.html" ]; then
    echo "❌ index.html not found!"
    exit 1
fi

echo "📂 Deploying HTML files to production..."

# Deploy to production
aws s3 cp index.html s3://bvester-website-public/index.html --content-type "text/html" --cache-control "no-cache" || exit 1
aws s3 cp login-final.html s3://bvester-website-public/login-final.html --content-type "text/html" --cache-control "no-cache" || exit 1
aws s3 cp signup-final.html s3://bvester-website-public/signup-final.html --content-type "text/html" --cache-control "no-cache" || exit 1
aws s3 cp investment-assessment.html s3://bvester-website-public/investment-assessment.html --content-type "text/html" --cache-control "no-cache" || exit 1

echo "🔄 Invalidating CloudFront cache..."

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E2ZOWJPDCAC1Z9 --invalidation-batch '{"Paths":{"Quantity":4,"Items":["/index.html","/login-final.html","/signup-final.html","/investment-assessment.html"]},"CallerReference":"prod-'$(date +%s)'"}' || exit 1

echo "✅ Production deployment complete!"
echo "🌐 Production URL: https://bvester.com"
echo ""
echo "🧪 Please verify production deployment:"
echo "curl -I https://bvester.com"
echo "curl -I https://bvester.com/login-final.html"
echo "curl -I https://bvester.com/signup-final.html"
echo "curl -I https://bvester.com/investment-assessment.html"