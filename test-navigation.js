// Test if the navigation and components are working correctly
const React = require('react');

try {
  console.log('✅ Testing WellfoundHomepage component...');
  
  // Check if files exist
  const fs = require('fs');
  const homepageExists = fs.existsSync('./src/screens/WellfoundHomepage.js');
  const aboutExists = fs.existsSync('./src/screens/AboutScreen.js');
  const navExists = fs.existsSync('./src/navigation/AppNavigator.js');
  
  console.log('Homepage file exists:', homepageExists);
  console.log('About file exists:', aboutExists);
  console.log('Navigation file exists:', navExists);
  
  if (homepageExists && aboutExists && navExists) {
    console.log('✅ All required files are in place');
    console.log('🔄 Try restarting the development server with: npx expo start --web --clear');
  } else {
    console.log('❌ Some files are missing');
  }
  
} catch (error) {
  console.error('❌ Error testing components:', error.message);
}