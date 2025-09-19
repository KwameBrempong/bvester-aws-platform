// Test script for Stripe, WhatsApp, and SendGrid integrations
require('dotenv').config({ path: '.env.production' });

async function testIntegrations() {
  console.log('🧪 Testing Bvester Production Integrations...\n');
  
  // Test Stripe
  console.log('💳 Testing Stripe Integration...');
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const balance = await stripe.balance.retrieve();
    console.log('✅ Stripe connected successfully!');
    console.log(`   Available balance: ${balance.available.map(b => `${b.amount/100} ${b.currency.toUpperCase()}`).join(', ')}`);
    console.log(`   Pending balance: ${balance.pending.map(b => `${b.amount/100} ${b.currency.toUpperCase()}`).join(', ')}`);
  } catch (error) {
    console.error('❌ Stripe connection failed:', error.message);
  }

  console.log('\n📧 Testing SendGrid Integration...');
  try {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('✅ SendGrid API key configured!');
    console.log('   Ready to send emails from:', process.env.SENDGRID_FROM_EMAIL);
  } catch (error) {
    console.error('❌ SendGrid setup failed:', error.message);
  }

  console.log('\n📱 Testing WhatsApp Business API...');
  try {
    const axios = require('axios');
    const response = await axios.get(
      `https://graph.facebook.com/v17.0/me`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
        }
      }
    );
    console.log('✅ WhatsApp Business API connected!');
    console.log('   Account ID:', response.data.id);
    console.log('   Name:', response.data.name);
  } catch (error) {
    console.error('❌ WhatsApp API connection failed:', error.response?.data || error.message);
  }

  console.log('\n🔐 Environment Configuration:');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   API_URL:', process.env.API_URL);
  console.log('   FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('   Payment Processing:', process.env.ENABLE_PAYMENTS === 'true' ? '✅ Enabled' : '❌ Disabled');
  console.log('   KYC System:', process.env.ENABLE_KYC === 'true' ? '✅ Enabled' : '❌ Disabled');

  console.log('\n🎉 Integration tests complete!');
}

// Run tests
testIntegrations().catch(console.error);