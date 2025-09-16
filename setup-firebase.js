#!/usr/bin/env node

// Firebase Environment Setup Helper for BizInvest Hub
// Run with: node setup-firebase.js

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔥 Firebase Environment Setup for BizInvest Hub');
console.log('==============================================\n');

console.log('This script will help you create your .env.production file.');
console.log('You need to get these values from Firebase Console after creating your project.\n');

console.log('📋 Follow these steps first:');
console.log('1. Go to https://console.firebase.google.com');
console.log('2. Create a new project called "bizinvest-hub-prod"');
console.log('3. Enable Authentication (Email/Password)');
console.log('4. Create Firestore Database');
console.log('5. Add a Web app to get the config values\n');

const questions = [
  'Firebase API Key (apiKey): ',
  'Auth Domain (authDomain): ',
  'Project ID (projectId): ',
  'Storage Bucket (storageBucket): ',
  'Messaging Sender ID (messagingSenderId): ',
  'App ID (appId): ',
  'Measurement ID (measurementId - optional): '
];

const envKeys = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID'
];

const answers = [];

function askQuestion(index) {
  if (index >= questions.length) {
    createEnvFile();
    return;
  }

  rl.question(questions[index], (answer) => {
    answers.push(answer.trim());
    askQuestion(index + 1);
  });
}

function createEnvFile() {
  console.log('\n🔧 Creating .env.production file...');
  
  let envContent = '# Production Firebase Configuration for BizInvest Hub\n';
  envContent += '# Generated automatically - DO NOT COMMIT TO GIT\n\n';
  
  for (let i = 0; i < envKeys.length; i++) {
    if (answers[i]) {
      envContent += `${envKeys[i]}=${answers[i]}\n`;
    }
  }
  
  try {
    fs.writeFileSync('.env.production', envContent);
    console.log('✅ .env.production file created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: expo start --clear');
    console.log('2. Check console for Firebase configuration verification');
    console.log('3. Follow PRODUCTION_TESTING_CHECKLIST.md for testing');
    console.log('\n🔒 Security reminder: Never commit .env.production to git!');
  } catch (error) {
    console.error('❌ Error creating .env.production file:', error.message);
  }
  
  rl.close();
}

console.log('Ready to collect your Firebase configuration values:\n');
askQuestion(0);