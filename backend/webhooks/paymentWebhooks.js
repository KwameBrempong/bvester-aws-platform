/**
 * BVESTER PLATFORM - PAYMENT WEBHOOKS
 * Secure webhook handlers for payment providers
 * Generated: January 28, 2025
 */

const express = require('express');
const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PaymentService = require('../api/paymentService');
const FirebaseService = require('../api/firebaseService');
const { FirebaseAdmin } = require('../config/firebase-admin');

const router = express.Router();

// ============================================================================
// STRIPE WEBHOOKS
// ============================================================================

/**
 * Stripe webhook handler
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  console.log(`✅ Stripe webhook received: ${event.type}`);
  
  try {
    switch (event.type) {
      
      // Subscription Events
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      // Invoice Events
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
        
      // Payment Intent Events
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
        
      // Customer Events
      case 'customer.created':
        await handleCustomerCreated(event.data.object);
        break;
        
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============================================================================
// FLUTTERWAVE WEBHOOKS
// ============================================================================

/**
 * Flutterwave webhook handler
 */
router.post('/flutterwave', express.json(), async (req, res) => {
  try {
    // Verify webhook signature
    const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    const signature = req.headers['verif-hash'];
    
    if (!signature || signature !== secretHash) {
      console.error('Flutterwave webhook signature verification failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const payload = req.body;
    console.log(`✅ Flutterwave webhook received: ${payload['event.type']}`);
    
    switch (payload['event.type']) {
      
      case 'charge.completed':
        await handleFlutterwaveChargeCompleted(payload.data);
        break;
        
      case 'charge.failed':
        await handleFlutterwaveChargeFailed(payload.data);
        break;
        
      case 'transfer.completed':
        await handleFlutterwaveTransferCompleted(payload.data);
        break;
        
      case 'transfer.failed':
        await handleFlutterwaveTransferFailed(payload.data);
        break;
        
      default:
        console.log(`Unhandled Flutterwave event type: ${payload['event.type']}`);
    }
    
    res.json({ status: 'success' });
    
  } catch (error) {
    console.error('Error processing Flutterwave webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ============================================================================
// STRIPE EVENT HANDLERS
// ============================================================================

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata.userId;
    
    if (!userId) {
      console.error('No userId found in customer metadata');
      return;
    }
    
    // Update user subscription status
    await FirebaseService.updateUserProfile(userId, {
      'subscription.status': subscription.status,
      'subscription.subscriptionId': subscription.id,
      'subscription.startDate': new Date(subscription.current_period_start * 1000),
      'subscription.endDate': new Date(subscription.current_period_end * 1000),
      'subscription.trialEnd': subscription.trial_end ? 
        new Date(subscription.trial_end * 1000) : null,
      'metadata.updatedAt': new Date()
    });
    
    // Log subscription creation
    await FirebaseService.logActivity(
      userId,
      'subscription_activated',
      'subscription',
      subscription.id,
      { 
        plan: subscription.items.data[0].price.nickname,
        amount: subscription.items.data[0].price.unit_amount / 100,
        currency: subscription.items.data[0].price.currency
      }
    );
    
    // Send welcome notification
    await FirebaseService.createNotification({
      userId: userId,
      type: 'subscription',
      title: 'Subscription Activated!',
      message: `Your ${subscription.items.data[0].price.nickname} subscription is now active.`,
      channels: { email: true, push: true }
    });
    
    console.log(`✅ Subscription created for user ${userId}`);
    
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata.userId;
    
    if (!userId) return;
    
    // Update subscription status
    await FirebaseService.updateUserProfile(userId, {
      'subscription.status': subscription.status,
      'subscription.endDate': new Date(subscription.current_period_end * 1000),
      'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
      'metadata.updatedAt': new Date()
    });
    
    // Log subscription update
    await FirebaseService.logActivity(
      userId,
      'subscription_updated',
      'subscription',
      subscription.id,
      { 
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    );
    
    console.log(`✅ Subscription updated for user ${userId}`);
    
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const userId = customer.metadata.userId;
    
    if (!userId) return;
    
    // Update subscription to cancelled
    await FirebaseService.updateUserProfile(userId, {
      'subscription.status': 'cancelled',
      'subscription.plan': 'basic', // Downgrade to basic
      'subscription.cancelledAt': new Date(),
      'metadata.updatedAt': new Date()
    });
    
    // Log subscription cancellation
    await FirebaseService.logActivity(
      userId,
      'subscription_cancelled',
      'subscription',
      subscription.id
    );
    
    // Send cancellation notification
    await FirebaseService.createNotification({
      userId: userId,
      type: 'subscription',
      title: 'Subscription Cancelled',
      message: 'Your subscription has been cancelled. You now have access to basic features.',
      channels: { email: true, push: true }
    });
    
    console.log(`✅ Subscription cancelled for user ${userId}`);
    
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

/**
 * Handle invoice payment succeeded
 */
async function handleInvoicePaymentSucceeded(invoice) {
  try {
    const customer = await stripe.customers.retrieve(invoice.customer);
    const userId = customer.metadata.userId;
    
    if (!userId) return;
    
    // Create payment record
    await FirebaseService.createPaymentRecord({
      userId: userId,
      type: 'subscription',
      provider: 'stripe',
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      status: 'completed',
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      paidAt: new Date(invoice.status_transitions.paid_at * 1000),
      metadata: {
        billingReason: invoice.billing_reason,
        hostedInvoiceUrl: invoice.hosted_invoice_url
      }
    });
    
    // Log successful payment
    await FirebaseService.logActivity(
      userId,
      'payment_successful',
      'payment',
      invoice.id,
      { 
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        type: 'subscription'
      }
    );
    
    // Send payment confirmation
    await FirebaseService.createNotification({
      userId: userId,
      type: 'payment',
      title: 'Payment Successful',
      message: `Your subscription payment of ${invoice.currency.toUpperCase()} ${invoice.amount_paid / 100} has been processed.`,
      channels: { email: true, push: true }
    });
    
    console.log(`✅ Invoice payment succeeded for user ${userId}`);
    
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice) {
  try {
    const customer = await stripe.customers.retrieve(invoice.customer);
    const userId = customer.metadata.userId;
    
    if (!userId) return;
    
    // Update subscription status
    await FirebaseService.updateUserProfile(userId, {
      'subscription.status': 'past_due',
      'subscription.lastPaymentFailed': new Date(),
      'metadata.updatedAt': new Date()
    });
    
    // Log failed payment
    await FirebaseService.logActivity(
      userId,
      'payment_failed',
      'payment',
      invoice.id,
      { 
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        type: 'subscription'
      }
    );
    
    // Send payment failure notification
    await FirebaseService.createNotification({
      userId: userId,
      type: 'payment',
      title: 'Payment Failed',
      message: 'Your subscription payment failed. Please update your payment method to continue using premium features.',
      channels: { email: true, push: true, sms: true }
    });
    
    console.log(`❌ Invoice payment failed for user ${userId}`);
    
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

/**
 * Handle payment intent succeeded
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const customerId = paymentIntent.customer;
    if (!customerId) return;
    
    const customer = await stripe.customers.retrieve(customerId);
    const userId = customer.metadata.userId;
    
    if (!userId) return;
    
    // Log successful payment intent
    await FirebaseService.logActivity(
      userId,
      'payment_intent_succeeded',
      'payment',
      paymentIntent.id,
      { 
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      }
    );
    
    console.log(`✅ Payment intent succeeded for user ${userId}`);
    
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

/**
 * Handle payment intent failed
 */
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const customerId = paymentIntent.customer;
    if (!customerId) return;
    
    const customer = await stripe.customers.retrieve(customerId);
    const userId = customer.metadata.userId;
    
    if (!userId) return;
    
    // Log failed payment intent
    await FirebaseService.logActivity(
      userId,
      'payment_intent_failed',
      'payment',
      paymentIntent.id,
      { 
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        failureReason: paymentIntent.last_payment_error?.message
      }
    );
    
    console.log(`❌ Payment intent failed for user ${userId}`);
    
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

/**
 * Handle customer created
 */
async function handleCustomerCreated(customer) {
  try {
    console.log(`✅ Stripe customer created: ${customer.id}`);
    
    // You can add any additional logic here for when a customer is created
    
  } catch (error) {
    console.error('Error handling customer created:', error);
  }
}

// ============================================================================
// FLUTTERWAVE EVENT HANDLERS
// ============================================================================

/**
 * Handle Flutterwave charge completed
 */
async function handleFlutterwaveChargeCompleted(charge) {
  try {
    const { tx_ref, amount, currency, customer, meta } = charge;
    
    // Verify the transaction
    const verificationResult = await PaymentService.verifyFlutterwavePayment(charge.id);
    
    if (!verificationResult.success) {
      console.error('Flutterwave charge verification failed:', verificationResult.error);
      return;
    }
    
    // Update payment record
    await PaymentService.updatePaymentRecord(tx_ref, {
      status: 'completed',
      transactionId: charge.id,
      paidAt: new Date(charge.created_at),
      verifiedAt: new Date()
    });
    
    // Process based on payment type
    if (meta && meta.type === 'investment') {
      await processInvestmentPayment(charge);
    } else if (meta && meta.type === 'subscription') {
      await processSubscriptionPayment(charge);
    }
    
    // Send success notification
    if (meta && meta.userId) {
      await FirebaseService.createNotification({
        userId: meta.userId,
        type: 'payment',
        title: 'Payment Successful!',
        message: `Your payment of ${currency} ${amount} has been processed successfully.`,
        channels: { email: true, push: true, sms: true }
      });
    }
    
    console.log(`✅ Flutterwave charge completed: ${tx_ref}`);
    
  } catch (error) {
    console.error('Error handling Flutterwave charge completed:', error);
  }
}

/**
 * Handle Flutterwave charge failed
 */
async function handleFlutterwaveChargeFailed(charge) {
  try {
    const { tx_ref, amount, currency, meta } = charge;
    
    // Update payment record
    await PaymentService.updatePaymentRecord(tx_ref, {
      status: 'failed',
      failedAt: new Date(),
      failureReason: charge.processor_response || 'Payment failed'
    });
    
    // Send failure notification
    if (meta && meta.userId) {
      await FirebaseService.createNotification({
        userId: meta.userId,
        type: 'payment',
        title: 'Payment Failed',
        message: `Your payment of ${currency} ${amount} could not be processed. Please try again.`,
        channels: { email: true, push: true }
      });
      
      // Log failed payment
      await FirebaseService.logActivity(
        meta.userId,
        'payment_failed',
        'payment',
        tx_ref,
        { 
          amount: amount,
          currency: currency,
          reason: charge.processor_response
        }
      );
    }
    
    console.log(`❌ Flutterwave charge failed: ${tx_ref}`);
    
  } catch (error) {
    console.error('Error handling Flutterwave charge failed:', error);
  }
}

/**
 * Handle Flutterwave transfer completed
 */
async function handleFlutterwaveTransferCompleted(transfer) {
  try {
    console.log(`✅ Flutterwave transfer completed: ${transfer.reference}`);
    
    // Handle transfer completion logic here
    // This could be for payouts to businesses or refunds
    
  } catch (error) {
    console.error('Error handling Flutterwave transfer completed:', error);
  }
}

/**
 * Handle Flutterwave transfer failed
 */
async function handleFlutterwaveTransferFailed(transfer) {
  try {
    console.log(`❌ Flutterwave transfer failed: ${transfer.reference}`);
    
    // Handle transfer failure logic here
    
  } catch (error) {
    console.error('Error handling Flutterwave transfer failed:', error);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Process investment payment
 */
async function processInvestmentPayment(paymentData) {
  try {
    const { meta, amount, currency, tx_ref } = paymentData;
    
    // Create investment record
    const investmentData = {
      opportunityId: meta.opportunityId,
      investorId: meta.userId,
      businessId: meta.businessId,
      transaction: {
        amount: amount,
        currency: currency,
        status: 'completed'
      },
      payment: {
        paymentMethod: 'flutterwave',
        paymentId: paymentData.id,
        paymentStatus: 'completed',
        txRef: tx_ref,
        paidAt: new Date(paymentData.created_at)
      }
    };
    
    const result = await FirebaseService.createInvestment(investmentData);
    
    if (result.success) {
      console.log(`✅ Investment created: ${result.investmentId}`);
    }
    
  } catch (error) {
    console.error('Error processing investment payment:', error);
  }
}

/**
 * Process subscription payment
 */
async function processSubscriptionPayment(paymentData) {
  try {
    const { meta, amount, currency } = paymentData;
    
    // Update user subscription
    await FirebaseService.updateUserProfile(meta.userId, {
      'subscription.status': 'active',
      'subscription.lastPayment': new Date(),
      'subscription.nextBilling': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      'metadata.updatedAt': new Date()
    });
    
    console.log(`✅ Subscription payment processed for user ${meta.userId}`);
    
  } catch (error) {
    console.error('Error processing subscription payment:', error);
  }
}

// ============================================================================
// WEBHOOK VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validate webhook source
 */
function validateWebhookSource(req, res, next) {
  // Add IP whitelist validation if needed
  // const allowedIPs = ['54.240.196.102', '54.240.197.243']; // Stripe IPs
  
  next();
}

module.exports = router;