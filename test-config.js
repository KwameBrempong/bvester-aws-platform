// Simple Firebase configuration test
const fs = require('fs');
const path = require('path');

console.log('🔥 BizInvest Hub Firebase Configuration Test');
console.log('=============================================\n');

// Read the .env.production file
const envPath = path.join(__dirname, '.env.production');

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ .env.production file found');
  
  // Parse environment variables
  const envVars = {};
  envContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    }
  });
  
  console.log('\n📋 Configuration Check:');
  console.log('========================');
  
  const requiredVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', 
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID'
  ];
  
  let allValid = true;
  
  requiredVars.forEach(varName => {
    const value = envVars[varName];
    const isValid = value && 
                   value !== '' && 
                   !value.includes('YOUR_') && 
                   !value.includes('PLACEHOLDER') &&
                   !value.includes('HERE');
    
    console.log(`${varName.replace('EXPO_PUBLIC_FIREBASE_', '')}: ${isValid ? '✅' : '❌'} ${isValid ? 'Valid' : 'Missing or placeholder'}`);
    
    if (!isValid) {
      allValid = false;
    }
  });
  
  // Optional measurement ID
  const measurementId = envVars['EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'];
  const measurementValid = measurementId && !measurementId.includes('YOUR_');
  console.log(`MEASUREMENT_ID: ${measurementValid ? '✅' : '⚠️'} ${measurementValid ? 'Valid' : 'Optional'}`);
  
  console.log('\n🎯 Summary:');
  console.log('===========');
  
  if (allValid) {
    console.log('🎉 Firebase configuration is ready!');
    console.log(`📊 Project ID: ${envVars['EXPO_PUBLIC_FIREBASE_PROJECT_ID']}`);
    console.log(`🌐 Auth Domain: ${envVars['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN']}`);
    console.log(`🔑 API Key: ${envVars['EXPO_PUBLIC_FIREBASE_API_KEY']?.substring(0, 10)}...`);
    
    console.log('\n✅ Your Firebase configuration looks good!');
    console.log('📱 Ready for testing once Expo starts successfully.');
  } else {
    console.log('❌ Some configuration values need attention.');
    console.log('📝 Please check your .env.production file.');
  }
  
} catch (error) {
  console.log('❌ Error reading .env.production file:', error.message);
  console.log('📝 Make sure the file exists in your project root.');
}

console.log('\n🔧 Next Steps:');
console.log('==============');
console.log('1. Fix any configuration issues above');
console.log('2. Resolve Node.js v24 compatibility issues');
console.log('3. Start Expo: npm run start:safe');
console.log('4. Test Firebase functionality in app');