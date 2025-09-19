#!/bin/bash
# 🚀 BVESTER PRODUCTION DEPLOYMENT SCRIPT (Unix/Mac/Linux)

echo "🚀 BVESTER PRODUCTION DEPLOYMENT SCRIPT"
echo "======================================="

echo ""
echo "📋 Step 1: Installing Firebase CLI..."
npm install -g firebase-tools

echo ""
echo "🔑 Step 2: Firebase Login (Browser will open)..."
firebase login

echo ""
echo "🔥 Step 3: Initialize Firebase Project..."
firebase init

echo ""
echo "🛡️ Step 4: Deploying Security Rules..."
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

echo ""
echo "📱 Step 5: Building Web App..."
npm run build:web

echo ""
echo "🌐 Step 6: Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🎯 Your app is now live at:"
echo "   https://bizinvest-hub-prod.web.app"
echo "   https://bizinvest-hub-prod.firebaseapp.com"
echo ""
echo "🔧 Next Steps:"
echo "   1. Set up payment processors (Stripe + Flutterwave)"
echo "   2. Create admin user in Firebase Console"
echo "   3. Upload content through CMS"
echo "   4. Launch marketing campaigns"