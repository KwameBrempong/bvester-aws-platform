#!/bin/bash

# Bvester Emergency Rollback Script
echo "🚨 EMERGENCY ROLLBACK INITIATED"

echo "⚠️  WARNING: This will rollback production to staging version"
echo "Are you sure you want to proceed? (y/N)"
read -r confirmation
if [ "$confirmation" != "y" ] && [ "$confirmation" != "Y" ]; then
    echo "❌ Rollback cancelled."
    exit 1
fi

echo "🔄 Rolling back production to staging version..."

# Copy from staging to production
aws s3 cp s3://bvester-staging/index.html s3://bvester-website-public/index.html --content-type "text/html" --cache-control "no-cache" || exit 1
aws s3 cp s3://bvester-staging/login-final.html s3://bvester-website-public/login-final.html --content-type "text/html" --cache-control "no-cache" || exit 1
aws s3 cp s3://bvester-staging/signup-final.html s3://bvester-website-public/signup-final.html --content-type "text/html" --cache-control "no-cache" || exit 1
aws s3 cp s3://bvester-staging/investment-assessment.html s3://bvester-website-public/investment-assessment.html --content-type "text/html" --cache-control "no-cache" || exit 1

echo "🔄 Invalidating CloudFront cache..."

# Invalidate cache immediately
aws cloudfront create-invalidation --distribution-id E2ZOWJPDCAC1Z9 --invalidation-batch '{"Paths":{"Quantity":1,"Items":["/*"]},"CallerReference":"emergency-'$(date +%s)'"}' || exit 1

echo "✅ Emergency rollback complete!"
echo "🌐 Please verify: https://bvester.com"
echo ""
echo "📝 Next steps:"
echo "1. Investigate the issue that caused the rollback"
echo "2. Fix the problem in development"
echo "3. Test thoroughly in staging"
echo "4. Deploy the fix using normal deployment process"