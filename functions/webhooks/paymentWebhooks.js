// Firebase Functions - Payment Webhooks
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

const db = admin.firestore();

/**
 * Payment webhook handler for Stripe and Flutterwave
 */
module.exports = async (req, res) => {
  try {
    const { headers, body } = req;
    const rawBody = JSON.stringify(body);

    // Determine webhook source based on headers
    if (headers['stripe-signature']) {
      return await handleStripeWebhook(req, res, rawBody);
    } else if (headers['verif-hash'] || body.event) {
      return await handleFlutterwaveWebhook(req, res, body);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Unknown webhook source'
      });
    }

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
};

/**
 * Handle Stripe webhooks
 */
async function handleStripeWebhook(req, res, rawBody) {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).json({
      success: false,
      error: 'Invalid signature'
    });
  }

  console.log('Stripe webhook event:', event.type);

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handleStripePaymentSuccess(event.data.object);
      break;
    
    case 'payment_intent.payment_failed':
      await handleStripePaymentFailed(event.data.object);
      break;
    
    case 'payment_intent.requires_action':
      await handleStripePaymentRequiresAction(event.data.object);
      break;
    
    case 'charge.dispute.created':
      await handleStripeDispute(event.data.object);
      break;
    
    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  res.json({ received: true });
}

/**
 * Handle Flutterwave webhooks
 */
async function handleFlutterwaveWebhook(req, res, body) {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const signature = req.headers['verif-hash'];

  // Verify webhook signature
  if (!signature || signature !== secretHash) {
    console.error('Flutterwave webhook signature verification failed');
    return res.status(400).json({
      success: false,
      error: 'Invalid signature'
    });
  }

  console.log('Flutterwave webhook event:', body.event);

  switch (body.event) {
    case 'charge.completed':
      if (body.data.status === 'successful') {
        await handleFlutterwavePaymentSuccess(body.data);
      } else {
        await handleFlutterwavePaymentFailed(body.data);
      }
      break;
    
    case 'transfer.completed':
      await handleFlutterwaveTransferCompleted(body.data);
      break;
    
    default:
      console.log(`Unhandled Flutterwave event type: ${body.event}`);
  }

  res.json({ received: true });
}

/**
 * Handle successful Stripe payment
 */
async function handleStripePaymentSuccess(paymentIntent) {
  try {
    const investmentId = paymentIntent.metadata.investmentId;
    const userId = paymentIntent.metadata.userId;

    if (!investmentId || !userId) {
      console.error('Missing metadata in Stripe payment:', paymentIntent.id);
      return;
    }

    // Update investment status
    await db.collection('userInvestments').doc(investmentId).update({
      status: 'active',
      paymentStatus: 'completed',
      paymentDetails: {
        processor: 'stripe',
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        completedAt: new Date(),
        charges: paymentIntent.charges?.data || []
      },
      'metadata.updatedAt': new Date()
    });

    // Get investment details
    const investmentDoc = await db.collection('userInvestments').doc(investmentId).get();
    const investment = investmentDoc.data();

    // Update opportunity funding
    await updateOpportunityFunding(investment);

    // Update user portfolio
    await updateUserPortfolio(userId, investment.amount, 'add');

    // Send success notification
    await db.collection('notifications').add({
      userId: userId,
      type: 'payment',
      title: 'Investment Payment Successful',
      message: `Your investment of ${paymentIntent.currency.toUpperCase()} ${(paymentIntent.amount / 100).toLocaleString()} has been processed successfully.`,
      data: { 
        investmentId: investmentId,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase()
      },
      channels: { email: true, push: true },
      priority: 'high',
      createdAt: new Date(),
      read: false
    });

    // Log payment completion
    await db.collection('paymentLogs').add({
      userId: userId,
      investmentId: investmentId,
      paymentProcessor: 'stripe',
      action: 'webhook_payment_completed',
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      paymentIntentId: paymentIntent.id,
      status: 'success',
      timestamp: new Date(),
      webhookProcessedAt: new Date()
    });

    console.log('Stripe payment success processed:', paymentIntent.id);

  } catch (error) {
    console.error('Error processing Stripe payment success:', error);
  }
}

/**
 * Handle failed Stripe payment
 */
async function handleStripePaymentFailed(paymentIntent) {
  try {
    const investmentId = paymentIntent.metadata.investmentId;
    const userId = paymentIntent.metadata.userId;

    if (!investmentId || !userId) {
      console.error('Missing metadata in failed Stripe payment:', paymentIntent.id);
      return;
    }

    // Update investment status
    await db.collection('userInvestments').doc(investmentId).update({
      status: 'payment_failed',
      paymentStatus: 'failed',
      paymentDetails: {
        processor: 'stripe',
        paymentIntentId: paymentIntent.id,
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
        failedAt: new Date()
      },
      'metadata.updatedAt': new Date()
    });

    // Send failure notification
    await db.collection('notifications').add({
      userId: userId,
      type: 'payment',
      title: 'Investment Payment Failed',
      message: `Your investment payment failed. Please try again or contact support if the issue persists.`,
      data: { 
        investmentId: investmentId,
        reason: paymentIntent.last_payment_error?.message || 'Payment failed'
      },
      channels: { email: true, push: true },
      priority: 'high',
      createdAt: new Date(),
      read: false
    });

    // Log payment failure
    await db.collection('paymentLogs').add({
      userId: userId,
      investmentId: investmentId,
      paymentProcessor: 'stripe',
      action: 'webhook_payment_failed',
      paymentIntentId: paymentIntent.id,
      status: 'failed',
      error: paymentIntent.last_payment_error?.message || 'Payment failed',
      timestamp: new Date(),
      webhookProcessedAt: new Date()
    });

    console.log('Stripe payment failure processed:', paymentIntent.id);

  } catch (error) {
    console.error('Error processing Stripe payment failure:', error);
  }
}

/**
 * Handle Stripe payment requiring action
 */
async function handleStripePaymentRequiresAction(paymentIntent) {
  try {
    const investmentId = paymentIntent.metadata.investmentId;
    const userId = paymentIntent.metadata.userId;

    if (!investmentId || !userId) {
      return;
    }

    // Send notification about required action
    await db.collection('notifications').add({
      userId: userId,
      type: 'payment',
      title: 'Payment Action Required',
      message: 'Your payment requires additional verification. Please complete the verification to proceed with your investment.',
      data: { 
        investmentId: investmentId,
        paymentIntentId: paymentIntent.id,
        nextAction: paymentIntent.next_action
      },
      channels: { email: true, push: true },
      priority: 'high',
      createdAt: new Date(),
      read: false
    });

    console.log('Stripe payment requires action:', paymentIntent.id);

  } catch (error) {
    console.error('Error processing Stripe payment requires action:', error);
  }
}

/**
 * Handle successful Flutterwave payment
 */
async function handleFlutterwavePaymentSuccess(transaction) {
  try {
    // Extract investment ID from transaction reference
    const txRef = transaction.tx_ref;
    const investmentId = txRef.split('_')[1];
    const userId = transaction.meta?.userId;

    if (!investmentId || !userId) {
      console.error('Missing metadata in Flutterwave payment:', transaction.id);
      return;
    }

    // Update investment status
    await db.collection('userInvestments').doc(investmentId).update({
      status: 'active',
      paymentStatus: 'completed',
      paymentDetails: {
        processor: 'flutterwave',
        transactionId: transaction.id,
        txRef: txRef,
        amount: transaction.amount,
        currency: transaction.currency,
        completedAt: new Date(),
        customer: transaction.customer
      },
      'metadata.updatedAt': new Date()
    });

    // Get investment details
    const investmentDoc = await db.collection('userInvestments').doc(investmentId).get();
    const investment = investmentDoc.data();

    // Update opportunity funding
    await updateOpportunityFunding(investment);

    // Update user portfolio
    await updateUserPortfolio(userId, transaction.amount, 'add');

    // Send success notification
    await db.collection('notifications').add({
      userId: userId,
      type: 'payment',
      title: 'Investment Payment Successful',
      message: `Your investment of ${transaction.currency} ${transaction.amount.toLocaleString()} has been processed successfully.`,
      data: { 
        investmentId: investmentId,
        amount: transaction.amount,
        currency: transaction.currency
      },
      channels: { email: true, push: true },
      priority: 'high',
      createdAt: new Date(),
      read: false
    });

    // Log payment completion
    await db.collection('paymentLogs').add({
      userId: userId,
      investmentId: investmentId,
      paymentProcessor: 'flutterwave',
      action: 'webhook_payment_completed',
      amount: transaction.amount,
      currency: transaction.currency,
      transactionId: transaction.id,
      txRef: txRef,
      status: 'success',
      timestamp: new Date(),
      webhookProcessedAt: new Date()
    });

    console.log('Flutterwave payment success processed:', transaction.id);

  } catch (error) {
    console.error('Error processing Flutterwave payment success:', error);
  }
}

/**
 * Handle failed Flutterwave payment
 */
async function handleFlutterwavePaymentFailed(transaction) {
  try {
    const txRef = transaction.tx_ref;
    const investmentId = txRef.split('_')[1];
    const userId = transaction.meta?.userId;

    if (!investmentId || !userId) {
      console.error('Missing metadata in failed Flutterwave payment:', transaction.id);
      return;
    }

    // Update investment status
    await db.collection('userInvestments').doc(investmentId).update({
      status: 'payment_failed',
      paymentStatus: 'failed',
      paymentDetails: {
        processor: 'flutterwave',
        transactionId: transaction.id,
        txRef: txRef,
        failureReason: transaction.processor_response || 'Payment failed',
        failedAt: new Date()
      },
      'metadata.updatedAt': new Date()
    });

    // Send failure notification
    await db.collection('notifications').add({
      userId: userId,
      type: 'payment',
      title: 'Investment Payment Failed',
      message: `Your investment payment failed. Please try again or contact support if the issue persists.`,
      data: { 
        investmentId: investmentId,
        reason: transaction.processor_response || 'Payment failed'
      },
      channels: { email: true, push: true },
      priority: 'high',
      createdAt: new Date(),
      read: false
    });

    console.log('Flutterwave payment failure processed:', transaction.id);

  } catch (error) {
    console.error('Error processing Flutterwave payment failure:', error);
  }
}

/**
 * Update opportunity funding statistics
 */
async function updateOpportunityFunding(investment) {
  try {
    await db.runTransaction(async (transaction) => {
      const opportunityRef = db.collection('investments').doc(investment.opportunityId);
      const opportunityDoc = await transaction.get(opportunityRef);
      
      if (opportunityDoc.exists) {
        const opportunity = opportunityDoc.data();
        const newRaisedAmount = (opportunity.fundingDetails.raisedAmount || 0) + investment.amount;
        const newInvestorCount = (opportunity.fundingDetails.investorCount || 0) + 1;
        
        transaction.update(opportunityRef, {
          'fundingDetails.raisedAmount': newRaisedAmount,
          'fundingDetails.investorCount': newInvestorCount,
          'metadata.updatedAt': new Date()
        });

        // Check if funding target is reached
        if (newRaisedAmount >= opportunity.fundingDetails.targetAmount) {
          transaction.update(opportunityRef, {
            status: 'funded',
            'fundingDetails.fundedAt': new Date()
          });
        }
      }
    });
  } catch (error) {
    console.error('Error updating opportunity funding:', error);
  }
}

/**
 * Update user portfolio statistics
 */
async function updateUserPortfolio(userId, amount, operation = 'add') {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    const currentTotal = userData.investorProfile?.portfolio?.totalInvested || 0;
    const currentValue = userData.investorProfile?.portfolio?.currentValue || 0;
    const activeInvestments = userData.investorProfile?.portfolio?.activeInvestments || 0;
    
    const newTotal = operation === 'add' ? currentTotal + amount : currentTotal - amount;
    const newValue = operation === 'add' ? currentValue + amount : currentValue - amount;
    const newActiveCount = operation === 'add' ? activeInvestments + 1 : Math.max(0, activeInvestments - 1);
    
    await db.collection('users').doc(userId).update({
      'investorProfile.portfolio.totalInvested': newTotal,
      'investorProfile.portfolio.currentValue': newValue,
      'investorProfile.portfolio.activeInvestments': newActiveCount,
      'investorProfile.portfolio.totalReturn': newValue - newTotal,
      'metadata.updatedAt': new Date()
    });
  } catch (error) {
    console.error('Error updating user portfolio:', error);
  }
}

/**
 * Handle Stripe disputes
 */
async function handleStripeDispute(dispute) {
  try {
    const charge = dispute.charge;
    
    // Log dispute for manual review
    await db.collection('disputes').add({
      processor: 'stripe',
      disputeId: dispute.id,
      chargeId: charge,
      amount: dispute.amount / 100,
      currency: dispute.currency.toUpperCase(),
      reason: dispute.reason,
      status: dispute.status,
      evidence_due_by: new Date(dispute.evidence_details.due_by * 1000),
      createdAt: new Date(),
      requiresAction: true
    });

    // Alert admin team
    await db.collection('notifications').add({
      userId: 'admin',
      type: 'dispute',
      title: 'Payment Dispute Created',
      message: `A payment dispute has been created for charge ${charge}. Immediate attention required.`,
      data: { 
        disputeId: dispute.id,
        amount: dispute.amount / 100,
        currency: dispute.currency.toUpperCase(),
        reason: dispute.reason
      },
      channels: { email: true },
      priority: 'critical',
      createdAt: new Date(),
      read: false
    });

    console.log('Stripe dispute processed:', dispute.id);

  } catch (error) {
    console.error('Error processing Stripe dispute:', error);
  }
}