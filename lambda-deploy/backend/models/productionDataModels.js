/**
 * BVESTER PLATFORM - PRODUCTION DATA MODELS
 * Enhanced data models for real money investment platform
 * Includes payment processing, KYC, compliance, and audit trail
 * Generated: August 1, 2025
 */

// ============================================================================
// PAYMENT & TRANSACTION MODELS
// ============================================================================

/**
 * Payment Transaction - Complete payment lifecycle tracking
 */
const PaymentTransactionModel = {
  transactionId: String, // Unique transaction identifier
  userId: String, // User initiating the payment
  relatedInvestmentId: String, // Optional: if payment is for investment
  
  paymentDetails: {
    amount: Number, // Amount in minor currency units (cents)
    currency: String, // ISO 4217 currency code
    amountUSD: Number, // Equivalent amount in USD for reporting
    exchangeRate: Number, // Exchange rate used
    
    // Payment method information
    paymentMethod: String, // 'stripe', 'flutterwave', 'bank_transfer', 'crypto'
    paymentProvider: String, // Provider-specific identifier
    paymentMethodId: String, // Stripe payment method ID, etc.
    
    // Payment processing
    processorTransactionId: String, // External processor transaction ID
    processorFee: Number, // Fee charged by payment processor
    platformFee: Number, // Bvester platform fee
    netAmount: Number, // Amount after all fees
  },
  
  status: {
    current: String, // 'pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'
    history: Array, // [{status, timestamp, reason}]
    lastUpdated: Date,
    completedAt: Date,
    failureReason: String,
  },
  
  compliance: {
    amlCheck: {
      status: String, // 'pending', 'cleared', 'flagged'
      provider: String, // AML check provider
      checkedAt: Date,
      riskScore: Number, // 0-100
      flags: Array, // Any compliance flags
    },
    
    sanctionsCheck: {
      status: String, // 'pending', 'cleared', 'blocked'
      provider: String,
      checkedAt: Date,
      matchFound: Boolean,
      details: String,
    },
    
    taxReporting: {
      reportable: Boolean,
      jurisdiction: String,
      taxYear: Number,
      reportingThreshold: Number,
    }
  },
  
  riskAssessment: {
    riskLevel: String, // 'low', 'medium', 'high', 'critical'
    riskScore: Number, // 0-100
    riskFactors: Array, // Identified risk factors
    manualReviewRequired: Boolean,
    reviewedBy: String, // Admin user ID if manually reviewed
    reviewedAt: Date,
  },
  
  metadata: {
    createdAt: Date,
    updatedAt: Date,
    ipAddress: String,
    userAgent: String,
    deviceFingerprint: String,
    location: {
      country: String,
      region: String,
      city: String,
    },
    refundRequested: Boolean,
    refundedAt: Date,
    refundReason: String,
  }
};

/**
 * User Wallet - Digital wallet for each user
 */
const UserWalletModel = {
  walletId: String,
  userId: String,
  
  balances: {
    available: {
      USD: Number,
      NGN: Number,
      KES: Number,
      ZAR: Number,
      GHS: Number,
    },
    locked: {
      USD: Number,
      NGN: Number,
      KES: Number,
      ZAR: Number,
      GHS: Number,
    },
    pending: {
      USD: Number,
      NGN: Number,
      KES: Number,
      ZAR: Number,
      GHS: Number,
    }
  },
  
  limits: {
    dailyWithdrawal: Number,
    monthlyWithdrawal: Number,
    singleTransaction: Number,
    monthlyDeposit: Number,
  },
  
  linkedAccounts: Array, // [{type, provider, accountId, verified, addedAt}]
  
  transactions: {
    totalDeposits: Number,
    totalWithdrawals: Number,
    totalInvestments: Number,
    transactionCount: Number,
    lastTransactionAt: Date,
  },
  
  security: {
    pin: String, // Encrypted wallet PIN
    twoFactorEnabled: Boolean,
    withdrawalApprovalRequired: Boolean,
    suspiciousActivityFlags: Array,
  },
  
  metadata: {
    createdAt: Date,
    updatedAt: Date,
    status: String, // 'active', 'suspended', 'closed'
    closedAt: Date,
    closureReason: String,
  }
};

// ============================================================================
// KYC & VERIFICATION MODELS
// ============================================================================

/**
 * KYC Document - Individual verification document
 */
const KYCDocumentModel = {
  documentId: String,
  userId: String,
  
  documentInfo: {
    type: String, // 'passport', 'national_id', 'drivers_license', 'utility_bill'
    category: String, // 'identity', 'address', 'financial'
    country: String, // Issuing country
    documentNumber: String, // Encrypted document number
    expiryDate: Date,
    issueDate: Date,
  },
  
  files: {
    frontImage: String, // Secure URL to front image
    backImage: String, // Secure URL to back image
    selfieImage: String, // Selfie with document
    originalFileName: String,
    fileSize: Number,
    mimeType: String,
    encryptionKey: String, // For encrypted storage
  },
  
  verification: {
    status: String, // 'pending', 'processing', 'verified', 'rejected', 'expired'
    provider: String, // 'onfido', 'jumio', 'veriff'
    providerDocumentId: String,
    
    checks: {
      documentAuthenticity: {
        status: String, // 'clear', 'consider', 'suspect'
        score: Number, // 0-100
        details: Object,
      },
      faceMatch: {
        status: String,
        score: Number,
        details: Object,
      },
      dataExtraction: {
        extractedData: Object, // Extracted document data
        confidence: Number,
      }
    },
    
    overallScore: Number, // 0-100
    reviewedBy: String, // Admin user ID if manually reviewed
    reviewedAt: Date,
    rejectionReason: String,
  },
  
  compliance: {
    sanctionsCheck: Boolean,
    pepCheck: Boolean, // Politically Exposed Person
    adverseMediaCheck: Boolean,
    watchlistCheck: Boolean,
  },
  
  metadata: {
    submittedAt: Date,
    processedAt: Date,
    expiresAt: Date, // When verification expires
    ipAddress: String,
    userAgent: String,
  }
};

/**
 * KYC Profile - Complete user verification profile
 */
const KYCProfileModel = {
  kycId: String,
  userId: String,
  
  personalInfo: {
    // Extracted and verified personal information
    firstName: String,
    lastName: String,
    middleName: String,
    dateOfBirth: Date,
    nationality: String,
    phoneNumber: String,
    email: String,
    
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      verified: Boolean,
      verifiedAt: Date,
    }
  },
  
  verificationLevel: {
    current: String, // 'basic', 'enhanced', 'premium'
    basicVerified: Boolean,
    enhancedVerified: Boolean,
    premiumVerified: Boolean,
    lastUpgraded: Date,
  },
  
  documents: Array, // Array of document IDs
  
  riskProfile: {
    riskLevel: String, // 'low', 'medium', 'high'
    pepStatus: Boolean, // Politically Exposed Person
    sanctionsMatch: Boolean,
    adverseMediaHits: Number,
    lastScreened: Date,
    nextScreeningDue: Date,
  },
  
  investorClassification: {
    isAccredited: Boolean,
    accreditationType: String, // 'income', 'net_worth', 'professional'
    accreditationEvidence: String, // Document reference
    accreditedUntil: Date,
    investmentLimits: {
      annual: Number,
      perInvestment: Number,
      totalPortfolio: Number,
    }
  },
  
  compliance: {
    cddCompleted: Boolean, // Customer Due Diligence
    eddRequired: Boolean, // Enhanced Due Diligence
    sourceOfFunds: String,
    sourceOfWealth: String,
    expectedTransactionVolume: String,
    businessRelationshipPurpose: String,
  },
  
  status: {
    overall: String, // 'pending', 'verified', 'rejected', 'expired', 'suspended'
    canInvest: Boolean,
    canReceiveFunds: Boolean,
    canWithdraw: Boolean,
    restrictions: Array, // Any imposed restrictions
    
    statusHistory: Array, // [{status, timestamp, reason, changedBy}]
    lastReviewed: Date,
    nextReviewDue: Date,
  },
  
  metadata: {
    createdAt: Date,
    updatedAt: Date,
    completedAt: Date,
    assignedReviewer: String,
    internalNotes: String, // Admin notes
  }
};

// ============================================================================
// COMPLIANCE & AUDIT MODELS
// ============================================================================

/**
 * Audit Trail - Comprehensive system activity logging
 */
const AuditTrailModel = {
  auditId: String,
  
  event: {
    type: String, // 'user_action', 'system_action', 'financial_transaction', 'compliance_check'
    action: String, // Specific action taken
    category: String, // 'authentication', 'payment', 'investment', 'kyc', 'admin'
    severity: String, // 'low', 'medium', 'high', 'critical'
  },
  
  actor: {
    userId: String, // User who performed the action
    userType: String, // 'investor', 'business', 'admin', 'system'
    ipAddress: String,
    userAgent: String,
    sessionId: String,
  },
  
  resource: {
    type: String, // 'user', 'investment', 'payment', 'document'
    id: String, // Resource identifier
    previousState: Object, // State before action
    newState: Object, // State after action
    changes: Array, // Specific fields changed
  },
  
  context: {
    requestId: String, // Unique request identifier
    apiEndpoint: String,
    httpMethod: String,
    responseCode: Number,
    processingTime: Number, // milliseconds
    
    businessContext: {
      investmentId: String,
      transactionId: String,
      amount: Number,
      currency: String,
    }
  },
  
  compliance: {
    regulatoryRelevant: Boolean,
    retentionPeriod: Number, // Days
    dataClassification: String, // 'public', 'internal', 'confidential', 'restricted'
    encryptionRequired: Boolean,
  },
  
  metadata: {
    timestamp: Date,
    timezone: String,
    source: String, // 'web', 'mobile', 'api', 'system'
    version: String, // Application version
    environment: String, // 'production', 'staging', 'development'
  }
};

/**
 * Compliance Report - Regulatory reporting and monitoring
 */
const ComplianceReportModel = {
  reportId: String,
  
  reportInfo: {
    type: String, // 'monthly_transactions', 'suspicious_activity', 'kyc_summary', 'large_transactions'
    period: {
      startDate: Date,
      endDate: Date,
      frequency: String, // 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
    },
    jurisdiction: String, // Regulatory jurisdiction
    regulator: String, // Specific regulatory body
  },
  
  data: {
    summary: Object, // High-level statistics
    details: Array, // Detailed transaction/user data
    flags: Array, // Compliance flags or issues
    recommendations: Array, // Recommended actions
  },
  
  metrics: {
    totalUsers: Number,
    newUsers: Number,
    totalTransactions: Number,
    totalVolume: Number,
    suspiciousActivities: Number,
    blockedTransactions: Number,
    kycApprovals: Number,
    kycRejections: Number,
  },
  
  filing: {
    required: Boolean,
    deadline: Date,
    filedAt: Date,
    filingReference: String,
    acknowledgment: String,
    status: String, // 'draft', 'filed', 'accepted', 'rejected'
  },
  
  metadata: {
    generatedAt: Date,
    generatedBy: String, // System or admin user
    approvedBy: String,
    approvedAt: Date,
    version: Number,
  }
};

/**
 * Transaction Monitoring - Real-time transaction analysis
 */
const TransactionMonitoringModel = {
  monitoringId: String,
  transactionId: String,
  userId: String,
  
  analysis: {
    riskScore: Number, // 0-100
    riskLevel: String, // 'low', 'medium', 'high', 'critical'
    
    patterns: {
      velocityCheck: Boolean, // Unusual transaction frequency
      amountCheck: Boolean, // Unusual transaction amount
      behaviorCheck: Boolean, // Unusual user behavior
      geographicCheck: Boolean, // Unusual location
      timeCheck: Boolean, // Unusual timing
    },
    
    rules: Array, // [{ruleId, triggered, severity, description}]
    
    machineLearningSrc: {
      anomalyScore: Number,
      similarTransactions: Array,
      confidenceLevel: Number,
    }
  },
  
  decision: {
    action: String, // 'allow', 'block', 'hold', 'review'
    reason: String,
    automaticDecision: Boolean,
    reviewRequired: Boolean,
    reviewedBy: String,
    reviewedAt: Date,
    finalDecision: String,
  },
  
  escalation: {
    escalated: Boolean,
    escalatedTo: String, // 'compliance_team', 'senior_management', 'regulator'
    escalatedAt: Date,
    escalationReason: String,
    resolution: String,
    resolvedAt: Date,
  },
  
  metadata: {
    timestamp: Date,
    processingTime: Number, // milliseconds
    algorithmVersion: String,
    dataSource: Array, // Sources used for analysis
  }
};

/**
 * Suspicious Activity Report - SAR for regulatory compliance
 */
const SuspiciousActivityModel = {
  sarId: String,
  
  subject: {
    userId: String,
    userType: String, // 'individual', 'business'
    identificationInfo: Object, // Encrypted sensitive data
  },
  
  suspiciousActivity: {
    type: String, // 'money_laundering', 'terrorist_financing', 'fraud', 'structuring'
    description: String,
    timeframe: {
      startDate: Date,
      endDate: Date,
    },
    
    transactions: Array, // Related transaction IDs
    totalAmount: Number,
    currency: String,
    
    indicators: Array, // Specific suspicious indicators
    narrative: String, // Detailed narrative explanation
  },
  
  investigation: {
    initiatedBy: String, // System or admin user
    investigator: String,
    status: String, // 'open', 'under_investigation', 'closed', 'filed'
    findings: String,
    evidence: Array, // Document references
    
    timeline: Array, // [{date, action, details}]
  },
  
  filing: {
    required: Boolean,
    deadline: Date,
    filedWith: String, // Regulatory body
    filedAt: Date,
    filingReference: String,
    followUpRequired: Boolean,
  },
  
  metadata: {
    createdAt: Date,
    priority: String, // 'low', 'medium', 'high', 'urgent'
    confidentiality: String, // 'internal', 'restricted', 'confidential'
    lastUpdated: Date,
  }
};

// ============================================================================
// PORTFOLIO & INVESTMENT TRACKING MODELS
// ============================================================================

/**
 * Investment Portfolio - Complete investor portfolio tracking
 */
const PortfolioModel = {
  portfolioId: String,
  investorId: String,
  
  summary: {
    totalInvestments: Number,
    totalValue: Number, // Current portfolio value
    totalCost: Number, // Total amount invested
    totalGainLoss: Number,
    totalGainLossPercentage: Number,
    
    breakdown: {
      equity: { count: Number, value: Number, percentage: Number },
      debt: { count: Number, value: Number, percentage: Number },
      revenueShare: { count: Number, value: Number, percentage: Number },
    },
    
    performance: {
      ytdReturn: Number,
      allTimeReturn: Number,
      annualizedReturn: Number,
      sharpeRatio: Number,
      maxDrawdown: Number,
    }
  },
  
  investments: Array, // Array of investment IDs
  
  riskMetrics: {
    portfolioRisk: String, // 'conservative', 'moderate', 'aggressive'
    riskScore: Number, // 0-100
    diversificationScore: Number, // 0-100
    concentration: Object, // Sector/geographic concentration
  },
  
  analytics: {
    bestPerformer: String, // Investment ID
    worstPerformer: String, // Investment ID
    sectorAllocation: Object,
    geographicAllocation: Object,
    stageAllocation: Object,
  },
  
  projections: {
    expectedAnnualReturn: Number,
    projectedValue1Year: Number,
    projectedValue5Year: Number,
    riskAdjustedReturn: Number,
  },
  
  metadata: {
    createdAt: Date,
    updatedAt: Date,
    lastValuationDate: Date,
    nextRebalanceDate: Date,
    benchmarkIndex: String,
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Payment & Transaction Models
  PaymentTransactionModel,
  UserWalletModel,
  
  // KYC & Verification Models
  KYCDocumentModel,
  KYCProfileModel,
  
  // Compliance & Audit Models
  AuditTrailModel,
  ComplianceReportModel,
  TransactionMonitoringModel,
  SuspiciousActivityModel,
  
  // Portfolio & Investment Models
  PortfolioModel,
  
  // Combined export with original models
  ...require('./dataModels')
};

/**
 * PRODUCTION DATA MODELS SUMMARY:
 * 
 * 🏦 PAYMENT PROCESSING:
 * - Complete payment transaction lifecycle
 * - Multi-currency wallet management
 * - Real-time payment status tracking
 * - Integration with multiple payment providers
 * 
 * 🔐 KYC & VERIFICATION:
 * - Document verification workflow
 * - Risk-based customer profiling
 * - Accredited investor classification
 * - Compliance with global standards
 * 
 * 📊 COMPLIANCE & AUDIT:
 * - Comprehensive audit trail
 * - Real-time transaction monitoring
 * - Suspicious activity reporting
 * - Regulatory compliance reporting
 * 
 * 💼 PORTFOLIO MANAGEMENT:
 * - Real-time portfolio valuation
 * - Performance analytics
 * - Risk assessment and monitoring
 * - Investment diversification tracking
 * 
 * These models are designed for production use with real money,
 * providing the necessary data structures for regulatory compliance,
 * risk management, and professional investment platform operations.
 */