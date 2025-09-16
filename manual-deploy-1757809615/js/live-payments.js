// Live Payment Processing for Bvester Platform
// Production-ready payment implementation with African market optimization

class LivePaymentProcessor {
    constructor() {
        this.config = window.paymentConfig;
        this.stripe = null;
        this.flutterwave = null;
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.initializePaymentProcessors();
        this.setupSecurityFeatures();
        console.log('Live payment processors initialized successfully');
    }

    async initializePaymentProcessors() {
        try {
            // Initialize Stripe
            if (window.Stripe) {
                this.stripe = window.Stripe(this.config.stripeConfig.publishableKey);
                console.log('Stripe initialized for live payments');
            }

            // Initialize Flutterwave
            if (window.FlutterwaveCheckout) {
                this.flutterwave = window.FlutterwaveCheckout;
                console.log('Flutterwave initialized for African markets');
            }
        } catch (error) {
            console.error('Payment processor initialization failed:', error);
            this.handleCriticalError(error);
        }
    }

    setupSecurityFeatures() {
        // Enable fraud detection
        this.fraudDetection = new FraudDetectionService();
        
        // Setup 3D Secure
        this.threeDSecure = {
            enabled: true,
            fallback: false // Require 3DS, no fallback
        };

        // Initialize compliance monitoring
        this.complianceMonitor = new ComplianceMonitor();
    }

    async processInvestment(investmentData) {
        try {
            // Pre-transaction validation
            await this.validateTransaction(investmentData);
            
            // Determine optimal payment processor
            const processor = this.config.getOptimalProcessor(
                investmentData.userCountry, 
                investmentData.currency
            );

            // Route to appropriate processor
            if (processor === 'flutterwave') {
                return await this.processFlutterwavePayment(investmentData);
            } else {
                return await this.processStripePayment(investmentData);
            }
        } catch (error) {
            console.error('Investment processing failed:', error);
            return this.handlePaymentError(error);
        }
    }

    async processStripePayment(investmentData) {
        const { amount, currency, investmentId, userId } = investmentData;

        try {
            // Create payment intent with 3D Secure
            const response = await fetch(`${this.config.apiBaseUrl}/payments/create-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify({
                    amount,
                    currency,
                    investmentId,
                    userId,
                    processor: 'stripe',
                    securityFeatures: {
                        require3DSecure: true,
                        fraudDetection: true
                    }
                })
            });

            const { clientSecret } = await response.json();

            // Confirm payment with Stripe Elements
            const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: this.stripeCard,
                    billing_details: {
                        name: investmentData.billingName,
                        email: investmentData.email,
                        address: investmentData.billingAddress
                    }
                }
            });

            if (error) {
                throw new Error(error.message);
            }

            // Process successful payment
            return await this.handleSuccessfulPayment({
                paymentIntentId: paymentIntent.id,
                processor: 'stripe',
                investmentData
            });

        } catch (error) {
            console.error('Stripe payment failed:', error);
            throw error;
        }
    }

    async processFlutterwavePayment(investmentData) {
        const { amount, currency, investmentId, userId } = investmentData;

        try {
            // Initialize Flutterwave payment
            const paymentData = {
                public_key: this.config.flutterwaveConfig.publicKey,
                tx_ref: `bvester_${investmentId}_${Date.now()}`,
                amount: amount / 100, // Flutterwave expects major currency units
                currency,
                payment_options: "card,mobilemoney,ussd,banktransfer",
                customer: {
                    email: investmentData.email,
                    phone_number: investmentData.phone,
                    name: investmentData.fullName
                },
                customizations: {
                    title: "Bvester Investment",
                    description: `Investment in opportunity ${investmentData.opportunityName}`,
                    logo: "https://bizinvest-hub-prod.web.app/logo-icon.png"
                },
                callback: (response) => this.handleFlutterwaveCallback(response),
                onclose: () => this.handleFlutterwaveClose()
            };

            // Launch Flutterwave payment modal
            this.flutterwave(paymentData);

        } catch (error) {
            console.error('Flutterwave payment failed:', error);
            throw error;
        }
    }

    async handleFlutterwaveCallback(response) {
        try {
            if (response.status === 'successful') {
                // Verify transaction on backend
                const verification = await fetch(`${this.config.apiBaseUrl}/payments/verify-flutterwave`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await this.getAuthToken()}`
                    },
                    body: JSON.stringify({
                        transactionId: response.transaction_id,
                        txRef: response.tx_ref
                    })
                });

                const verificationResult = await verification.json();
                
                if (verificationResult.success) {
                    return await this.handleSuccessfulPayment({
                        transactionId: response.transaction_id,
                        processor: 'flutterwave',
                        investmentData: this.currentInvestmentData
                    });
                } else {
                    throw new Error('Payment verification failed');
                }
            } else {
                throw new Error('Payment was not successful');
            }
        } catch (error) {
            console.error('Flutterwave callback error:', error);
            this.handlePaymentError(error);
        }
    }

    async validateTransaction(investmentData) {
        // Amount validation
        if (!this.config.validateAmount(investmentData.amount, investmentData.currency)) {
            throw new Error('Investment amount below minimum threshold');
        }

        // KYC validation
        const kycStatus = await this.checkKYCStatus(investmentData.userId);
        if (!kycStatus.verified && investmentData.amount > this.config.getSecurityFeatures().kycRequired.threshold) {
            throw new Error('KYC verification required for this investment amount');
        }

        // Fraud detection
        const fraudCheck = await this.fraudDetection.analyzeTransaction(investmentData);
        if (fraudCheck.riskLevel === 'high') {
            throw new Error('Transaction flagged for manual review');
        }

        // Velocity checks
        const velocityCheck = await this.checkTransactionVelocity(investmentData.userId);
        if (!velocityCheck.allowed) {
            throw new Error('Transaction rate limit exceeded');
        }
    }

    async handleSuccessfulPayment(paymentResult) {
        try {
            // Record investment in database
            const investmentRecord = await fetch(`${this.config.apiBaseUrl}/investments/record`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify({
                    ...paymentResult,
                    status: 'completed',
                    timestamp: new Date().toISOString()
                })
            });

            const result = await investmentRecord.json();

            if (result.success) {
                // Send confirmation notifications
                await this.sendInvestmentConfirmation(result.investment);
                
                // Update UI
                this.displaySuccessMessage(result.investment);
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 3000);
                
                return result;
            } else {
                throw new Error('Failed to record investment');
            }
        } catch (error) {
            console.error('Post-payment processing failed:', error);
            // Payment succeeded but recording failed - requires manual intervention
            this.handleCriticalError(error);
        }
    }

    async sendInvestmentConfirmation(investment) {
        try {
            await fetch(`${this.config.apiBaseUrl}/notifications/investment-confirmation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify({
                    investmentId: investment.id,
                    userId: investment.userId,
                    amount: investment.amount,
                    currency: investment.currency
                })
            });
        } catch (error) {
            console.error('Confirmation notification failed:', error);
            // Non-critical error, continue processing
        }
    }

    displaySuccessMessage(investment) {
        const successDiv = document.createElement('div');
        successDiv.className = 'payment-success-message';
        successDiv.innerHTML = `
            <div class="success-icon">✅</div>
            <h2>Investment Successful!</h2>
            <p>Your investment of ${investment.currency} ${(investment.amount / 100).toLocaleString()} has been processed successfully.</p>
            <p>Investment ID: ${investment.id}</p>
            <p>You will receive a confirmation email shortly.</p>
            <div class="success-actions">
                <button onclick="window.location.href='/dashboard'" class="btn btn-primary">
                    View Dashboard
                </button>
            </div>
        `;
        
        document.body.appendChild(successDiv);
    }

    handlePaymentError(error) {
        console.error('Payment error:', error);
        
        // Display user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'payment-error-message';
        errorDiv.innerHTML = `
            <div class="error-icon">❌</div>
            <h3>Payment Failed</h3>
            <p>${this.getFriendlyErrorMessage(error.message)}</p>
            <div class="error-actions">
                <button onclick="this.parentElement.parentElement.remove()" class="btn btn-secondary">
                    Try Again
                </button>
                <button onclick="window.location.href='/support'" class="btn btn-outline">
                    Contact Support
                </button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Log to monitoring system
        this.logErrorToMonitoring(error);
    }

    getFriendlyErrorMessage(errorMessage) {
        const errorMap = {
            'insufficient_funds': 'Insufficient funds in your account. Please check your balance and try again.',
            'card_declined': 'Your card was declined. Please try a different payment method.',
            'expired_card': 'Your card has expired. Please use a valid card.',
            'incorrect_cvc': 'The security code (CVC) is incorrect. Please check and try again.',
            'processing_error': 'A temporary processing error occurred. Please try again in a few minutes.',
            'authentication_required': 'Additional authentication is required. Please complete the verification process.'
        };
        
        return errorMap[errorMessage] || 'An unexpected error occurred. Please try again or contact support.';
    }

    async getAuthToken() {
        // Retrieve authentication token from secure storage
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Authentication required');
        }
        return token;
    }

    handleCriticalError(error) {
        // Alert monitoring systems
        console.error('CRITICAL PAYMENT ERROR:', error);
        
        // Send immediate alert to ops team
        fetch(`${this.config.apiBaseUrl}/alerts/critical`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: error.message,
                timestamp: new Date().toISOString(),
                severity: 'critical',
                component: 'payment_processor'
            })
        }).catch(console.error);
    }
}

// Initialize live payment processor
window.livePaymentProcessor = new LivePaymentProcessor();

console.log('Live Payment Processor loaded - Production ready for African markets');