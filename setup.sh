#!/bin/bash

echo "🚀 Setting up BizInvest Hub..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Expo CLI if not installed
if ! command -v expo &> /dev/null; then
    echo "📱 Installing Expo CLI..."
    npm install -g @expo/cli
fi

echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm start"
echo ""
echo "To run on specific platforms:"
echo "  npm run android"
echo "  npm run ios"
echo "  npm run web"
echo ""
echo "🎉 Happy coding!"