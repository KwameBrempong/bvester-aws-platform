# Bvester Web Deployment Checklist & Procedures

## 🚦 PRE-DEPLOYMENT CHECKLIST

### ✅ Development Environment
- [ ] Code changes made in development branch
- [ ] All changes committed to git with descriptive messages
- [ ] No sensitive data (API keys, passwords) in code
- [ ] Code follows existing conventions and style

### ✅ Staging Environment Testing
- [ ] Deploy changes to staging environment first
- [ ] Test staging URL: `http://bvester-staging.s3-website.eu-west-2.amazonaws.com`
- [ ] All navigation buttons work correctly
- [ ] Login/signup pages load and function
- [ ] Investment assessment page accessible
- [ ] Mobile responsiveness verified
- [ ] No JavaScript console errors
- [ ] All API endpoints responding correctly

### ✅ Critical User Flow Verification
- [ ] Homepage → Login flow works
- [ ] Homepage → Signup flow works
- [ ] Homepage → Investment Assessment works
- [ ] Back navigation from all pages works
- [ ] Error handling works for invalid inputs
- [ ] Success messages display correctly

## 🚀 DEPLOYMENT PROCEDURES

### Step 1: Deploy to Staging
```bash
aws s3 cp index.html s3://bvester-staging/index.html --content-type "text/html"
aws s3 cp login-final.html s3://bvester-staging/login-final.html --content-type "text/html"
aws s3 cp signup-final.html s3://bvester-staging/signup-final.html --content-type "text/html"
aws s3 cp investment-assessment.html s3://bvester-staging/investment-assessment.html --content-type "text/html"
```

### Step 2: Deploy to Production
```bash
aws s3 cp index.html s3://bvester-website-public/index.html --content-type "text/html" --cache-control "no-cache"
aws s3 cp login-final.html s3://bvester-website-public/login-final.html --content-type "text/html" --cache-control "no-cache"
aws s3 cp signup-final.html s3://bvester-website-public/signup-final.html --content-type "text/html" --cache-control "no-cache"
aws s3 cp investment-assessment.html s3://bvester-website-public/investment-assessment.html --content-type "text/html" --cache-control "no-cache"

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E2ZOWJPDCAC1Z9 --invalidation-batch '{"Paths":{"Quantity":4,"Items":["/index.html","/login-final.html","/signup-final.html","/investment-assessment.html"]},"CallerReference":"'$(date +%s)'"}'
```

## 🛡️ SAFETY RULES

### Never:
- ❌ Deploy directly to production without staging test
- ❌ Deploy untested code
- ❌ Deploy without backup plan

### Always:
- ✅ Test in staging first
- ✅ Verify all button functionality
- ✅ Check mobile responsiveness