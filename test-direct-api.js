// Test Firebase API key directly via REST API
const https = require('https');

const API_KEY = "AIzaSyAdTIb1Hpue64ZqzkcsjlTWP747TW_CJ80";
const PROJECT_ID = "bizinvest-hub-prod";

async function testFirebaseAPIKey() {
  console.log('🔑 Testing Firebase API Key directly...');
  console.log('API Key:', API_KEY);
  console.log('Project ID:', PROJECT_ID);
  console.log('');

  // Test 1: Identity Toolkit API (Auth)
  console.log('🔐 Testing Authentication API...');
  
  const authData = JSON.stringify({
    email: 'test@example.com',
    password: 'testpassword123',
    returnSecureToken: true
  });

  const authOptions = {
    hostname: 'identitytoolkit.googleapis.com',
    port: 443,
    path: `/v1/accounts:signUp?key=${API_KEY}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': authData.length
    }
  };

  return new Promise((resolve) => {
    const req = https.request(authOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Auth API Status:', res.statusCode);
        
        if (res.statusCode === 200) {
          console.log('✅ API Key is valid for Authentication');
          const response = JSON.parse(data);
          console.log('User created with ID:', response.localId);
        } else {
          console.log('❌ API Key validation failed');
          console.log('Error response:', data);
        }
        
        // Test 2: Firestore API
        console.log('');
        console.log('📄 Testing Firestore API...');
        
        const firestoreOptions = {
          hostname: 'firestore.googleapis.com',
          port: 443,
          path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/test/apitest?key=${API_KEY}`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        };
        
        const firestoreReq = https.request(firestoreOptions, (firestoreRes) => {
          let firestoreData = '';
          
          firestoreRes.on('data', (chunk) => {
            firestoreData += chunk;
          });
          
          firestoreRes.on('end', () => {
            console.log('Firestore API Status:', firestoreRes.statusCode);
            
            if (firestoreRes.statusCode === 200 || firestoreRes.statusCode === 404) {
              console.log('✅ API Key is valid for Firestore');
            } else {
              console.log('❌ Firestore API validation failed');
              console.log('Error response:', firestoreData);
            }
            
            resolve();
          });
        });
        
        firestoreReq.on('error', (error) => {
          console.error('❌ Firestore API request error:', error.message);
          resolve();
        });
        
        firestoreReq.end();
      });
    });

    req.on('error', (error) => {
      console.error('❌ Auth API request error:', error.message);
      resolve();
    });

    req.write(authData);
    req.end();
  });
}

testFirebaseAPIKey();