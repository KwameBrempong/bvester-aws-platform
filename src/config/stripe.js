// Stripe configuration for BizInvest Hub
// TODO: Replace with your actual Stripe keys from https://dashboard.stripe.com/apikeys

// Test keys (safe to commit) - Replace with live keys in production
export const STRIPE_PUBLISHABLE_KEY = 'pk_test_PLACEHOLDER_REPLACE_WITH_REAL_TEST_KEY';
export const STRIPE_SECRET_KEY = 'sk_test_PLACEHOLDER_REPLACE_WITH_REAL_SECRET_KEY'; // Server-side only

// Subscription plan IDs (create these in Stripe Dashboard)
export const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: 'price_PLACEHOLDER_BASIC_PLAN',
    name: 'Basic',
    price: 0,
    currency: 'USD',
    features: ['Basic analysis', 'Up to 50 transactions', 'Standard support']
  },
  PREMIUM: {
    id: 'price_PLACEHOLDER_PREMIUM_PLAN', 
    name: 'Premium',
    price: 9.99,
    currency: 'USD',
    features: ['Advanced metrics', 'Unlimited transactions', 'AI insights', 'Priority support']
  },
  ENTERPRISE: {
    id: 'price_PLACEHOLDER_ENTERPRISE_PLAN',
    name: 'Enterprise', 
    price: 49.99,
    currency: 'USD',
    features: ['White-label solution', 'API access', 'Custom integrations', 'Dedicated support']
  }
};

// Transaction fee configuration for marketplace
export const TRANSACTION_FEES = {
  EQUITY_INVESTMENT: 0.025,      // 2.5% fee for equity investments
  LOAN_PROCESSING: 0.015,        // 1.5% fee for loan processing
  REVENUE_SHARE: 0.02,           // 2% fee for revenue sharing agreements
  MINIMUM_FEE: 5.00,             // Minimum fee in USD
  MAXIMUM_FEE: 500.00            // Maximum fee cap in USD
};

// Regional pricing for African markets
// TODO: Integrate with Paystack for local payment methods
export const REGIONAL_PRICING = {
  NIGERIA: {
    currency: 'NGN',
    basic: 0,
    premium: 3900,     // ~$9.99 in NGN
    enterprise: 19500, // ~$49.99 in NGN
    paymentMethods: ['card', 'bank_transfer', 'paystack'] // TODO: Add mobile money
  },
  SOUTH_AFRICA: {
    currency: 'ZAR', 
    basic: 0,
    premium: 185,      // ~$9.99 in ZAR
    enterprise: 925,   // ~$49.99 in ZAR
    paymentMethods: ['card', 'eft', 'payfast'] // TODO: Add local payment gateways
  },
  KENYA: {
    currency: 'KES',
    basic: 0, 
    premium: 1495,     // ~$9.99 in KES
    enterprise: 7475,  // ~$49.99 in KES
    paymentMethods: ['card', 'mpesa', 'bank_transfer'] // TODO: Integrate M-Pesa API
  }
};

// Mock functions for MVP - Replace with real Stripe integration
export const mockStripeService = {
  createSubscription: async (planId, customerId) => {
    console.log('Mock: Creating subscription', { planId, customerId });
    // TODO: Implement real Stripe subscription creation
    return {
      id: `sub_mock_${Date.now()}`,
      status: 'active',
      plan: planId,
      customer: customerId,
      created: new Date().toISOString()
    };
  },

  processPayment: async (amount, currency, paymentMethodId) => {
    console.log('Mock: Processing payment', { amount, currency, paymentMethodId });
    // TODO: Implement real payment processing
    return {
      id: `pi_mock_${Date.now()}`,
      status: 'succeeded',
      amount,
      currency,
      created: new Date().toISOString()
    };
  },

  calculateTransactionFee: (amount, investmentType) => {
    const feeRate = TRANSACTION_FEES[investmentType] || TRANSACTION_FEES.EQUITY_INVESTMENT;
    const fee = Math.max(
      Math.min(amount * feeRate, TRANSACTION_FEES.MAXIMUM_FEE),
      TRANSACTION_FEES.MINIMUM_FEE
    );
    console.log(`Transaction fee calculated: $${fee.toFixed(2)} for ${investmentType}`);
    return fee;
  }
};