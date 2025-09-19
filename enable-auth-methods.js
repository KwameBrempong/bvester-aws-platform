// Script to configure Firebase Authentication methods via CLI
const { spawn } = require('child_process');

async function enableAuthMethods() {
  console.log('🔧 Configuring Firebase Authentication methods...');
  
  // Note: Firebase doesn't have direct CLI commands to enable auth methods
  // This needs to be done in the Firebase Console
  
  console.log('📋 Authentication methods that need to be enabled:');
  console.log('1. Email/Password authentication');
  console.log('2. Anonymous authentication (optional for testing)');
  console.log('');
  console.log('🌍 Manual steps required:');
  console.log('1. Go to: https://console.firebase.google.com/project/bizinvest-hub-prod/authentication/providers');
  console.log('2. Enable "Email/Password" provider');
  console.log('3. Enable "Anonymous" provider (for testing)');
  console.log('4. Save changes');
  console.log('');
  console.log('🔑 Alternative: Update Firebase Security Rules to allow operations');
  
  // Check current project
  console.log('📊 Current Firebase project:');
  const listProjects = spawn('firebase', ['projects:list'], { stdio: 'inherit' });
  
  return new Promise((resolve) => {
    listProjects.on('close', (code) => {
      resolve(code);
    });
  });
}

enableAuthMethods();