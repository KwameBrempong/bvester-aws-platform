// Live Payment Configuration for Bvester
// This file contains live payment processing setup for production launch

class PaymentConfig {
    constructor() {
        this.environment = 'production'; // Changed from test to production
        this.apiBaseUrl = 'https://bvester-platform-9ro801e68-kwame-brempongs-projects.vercel.app/api';
        this.stripeConfig = this.getStripeConfig();
        this.flutterwaveConfig = this.getFlutterwaveConfig();
    }

    getStripeConfig() {
        return {
            // Production Stripe keys - these need to be set in environment variables
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_live_your_live_stripe_key_here',
            // Feature configuration
            paymentMethods: ['card', 'bank_transfer', 'ach_debit'],
            supportedCurrencies: ['USD', 'EUR', 'GBP', 'ZAR', 'KES', 'NGN', 'GHS'],
            minimumAmount: {
                USD: 100, // $1.00 minimum
                EUR: 100, // €1.00 minimum
                GBP: 100, // £1.00 minimum
                ZAR: 1500, // R15.00 minimum
                KES: 10000, // KSh 100.00 minimum
                NGN: 50000, // ₦500.00 minimum
                GHS: 600 // GH₵6.00 minimum
            }
        };
    }

    getFlutterwaveConfig() {
        return {
            // Production Flutterwave keys - these need to be set in environment variables
            publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK-your_live_flutterwave_key_here',
            // African market optimization
            preferredMethods: ['card', 'mobilemoney', 'banktransfer', 'ussd'],
            supportedCountries: ['NG', 'GH', 'KE', 'ZA', 'UG', 'TZ', 'RW'],
            currencies: ['NGN', 'GHS', 'KES', 'ZAR', 'UGX', 'TZS', 'RWF'],
            minimumAmount: {
                NGN: 50000, // ₦500.00 minimum
                GHS: 600, // GH₵6.00 minimum
                KES: 10000, // KSh 100.00 minimum
                ZAR: 1500, // R15.00 minimum
                UGX: 370000, // USh 3,700 minimum
                TZS: 230000, // TSh 2,300 minimum
                RWF: 100000 // RWF 1,000 minimum
            }
        };
    }

    // Get payment processor based on user location
    getOptimalProcessor(userCountry, currency) {
        const africanCountries = ['NG', 'GH', 'KE', 'ZA', 'UG', 'TZ', 'RW'];
        
        if (africanCountries.includes(userCountry)) {
            return 'flutterwave';
        }
        
        // For international markets, use Stripe
        return 'stripe';
    }

    // Validate minimum investment amounts
    validateAmount(amount, currency) {
        const processor = this.getOptimalProcessor(navigator.language.split('-')[1], currency);
        
        if (processor === 'flutterwave') {
            const minimum = this.flutterwaveConfig.minimumAmount[currency] || 50000;
            return amount >= minimum;
        } else {
            const minimum = this.stripeConfig.minimumAmount[currency] || 100;
            return amount >= minimum;
        }
    }

    // Security and compliance features
    getSecurityFeatures() {
        return {
            // PCI DSS compliance
            pciCompliant: true,
            
            // 3D Secure authentication
            require3DSecure: true,
            
            // Fraud detection
            fraudDetection: {
                enabled: true,
                rules: [
                    'velocity_checks',
                    'unusual_patterns',
                    'high_risk_countries',
                    'device_fingerprinting'
                ]
            },
            
            // KYC integration
            kycRequired: {
                threshold: 100000, // $1,000 USD equivalent
                documents: ['identity', 'address', 'income_verification']
            },
            
            // Anti-money laundering
            amlCompliance: {
                enabled: true,
                watchlistScreening: true,
                transactionMonitoring: true
            }
        };
    }

    // Regional compliance settings
    getComplianceSettings() {
        return {
            // African markets
            africa: {
                requiredLicenses: ['CAM_License', 'SEC_Registration'],
                localPartners: {
                    nigeria: 'SEC_Nigeria',
                    ghana: 'SEC_Ghana',
                    kenya: 'CMA_Kenya',
                    southAfrica: 'FSCA_SA'
                }
            },
            
            // International markets
            international: {
                requiredLicenses: ['SEC_US', 'FCA_UK', 'ESMA_EU'],
                dataProtection: ['GDPR', 'CCPA', 'POPIA']
            }
        };
    }

    // Production monitoring and alerting
    getMonitoringConfig() {
        return {
            // Real-time transaction monitoring
            transactionAlerts: {
                failureRate: 5, // Alert if failure rate > 5%
                highValueThreshold: 500000, // $5,000 USD equivalent
                velocityLimit: 10 // Max 10 transactions per minute per user
            },
            
            // System health monitoring
            healthChecks: {
                paymentGateways: true,
                database: true,
                authentication: true,
                kycServices: true
            },
            
            // Business metrics tracking
            metrics: [
                'total_volume',
                'success_rate',
                'average_transaction_size',
                'user_acquisition_cost',
                'lifetime_value'
            ]
        };
    }
}

// Export for use in other modules
window.PaymentConfig = PaymentConfig;

// Initialize global payment configuration
window.paymentConfig = new PaymentConfig();

console.log('Live Payment Configuration Loaded - Production Environment');
console.log('Supported processors:', ['Stripe', 'Flutterwave']);
console.log('Security features enabled:', Object.keys(window.paymentConfig.getSecurityFeatures()));