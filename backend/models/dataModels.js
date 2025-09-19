/**
 * BVESTER PLATFORM - COMPREHENSIVE DATA MODELS
 * Complete database schema for African SME Investment Platform
 * Generated: January 28, 2025
 */

// ============================================================================
// USER MANAGEMENT MODELS
// ============================================================================

/**
 * User Profile - Core user information
 */
const UserModel = {
  userId: String, // Firebase Auth UID
  email: String,
  userType: String, // 'investor' | 'business' | 'admin'
  profile: {
    firstName: String,
    lastName: String,
    displayName: String,
    avatar: String, // URL to profile image
    phoneNumber: String,
    country: String,
    city: String,
    timezone: String,
    language: String, // 'en', 'fr', 'ar', etc.
  },
  verification: {
    emailVerified: Boolean,
    phoneVerified: Boolean,
    kycStatus: String, // 'pending' | 'verified' | 'rejected'
    kycDocuments: Array, // Document URLs
    kycProvider: String, // 'onfido', 'jumio', etc.
    verifiedAt: Date,
  },
  subscription: {
    plan: String, // 'basic' | 'professional' | 'enterprise'
    status: String, // 'active' | 'cancelled' | 'past_due'
    startDate: Date,
    endDate: Date,
    paymentMethod: String,
    subscriptionId: String, // Stripe subscription ID
  },
  preferences: {
    notifications: {
      email: Boolean,
      sms: Boolean,
      push: Boolean,
      marketing: Boolean,
    },
    privacy: {
      profileVisibility: String, // 'public' | 'investors' | 'private'
      dataSharing: Boolean,
    },
    currency: String, // Default currency preference
  },
  metadata: {
    createdAt: Date,
    updatedAt: Date,
    lastLoginAt: Date,
    loginCount: Number,
    referralCode: String,
    referredBy: String,
  }
};

/**
 * Business Profile - SME business information
 */
const BusinessModel = {
  businessId: String,
  ownerId: String, // User ID of business owner
  basicInfo: {
    businessName: String,
    legalName: String,
    description: String,
    tagline: String,
    logo: String, // URL to logo
    coverImage: String,
    website: String,
    foundedYear: Number,
    employees: Number,
    businessType: String, // 'LLC', 'Corporation', 'Partnership', etc.
  },
  location: {
    country: String,
    state: String,
    city: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    operatingRegions: Array, // Countries/regions where business operates
  },
  industry: {
    primarySector: String, // 'fintech', 'agritech', 'healthcare', etc.
    secondarySectors: Array,
    businessModel: String, // 'B2B', 'B2C', 'B2B2C', 'marketplace'
    targetMarket: String,
    competitiveAdvantage: String,
  },
  financials: {
    annualRevenue: Number,
    monthlyRevenue: Number,
    profitMargin: Number,
    burnRate: Number,
    runway: Number, // Months
    fundingStage: String, // 'pre-seed', 'seed', 'series-a', etc.
    previousFunding: Number,
    currentValuation: Number,
    currency: String,
  },
  team: {
    founders: Array, // [{name, role, bio, linkedin, image}]
    keyPersonnel: Array,
    advisors: Array,
    teamSize: Number,
  },
  metrics: {
    customers: Number,
    monthlyActiveUsers: Number,
    growthRate: Number,
    churnRate: Number,
    customerAcquisitionCost: Number,
    lifetimeValue: Number,
  },
  legal: {
    registrationNumber: String,
    taxId: String,
    licenses: Array, // Business licenses
    patents: Array,
    legalStructure: String,
    complianceStatus: String,
  },
  scores: {
    investmentReadiness: Number, // 0-100
    financialHealth: Number, // 0-100
    esgScore: Number, // 0-100
    riskLevel: String, // 'low', 'medium', 'high'
    lastCalculated: Date,
  },
  status: {
    isActive: Boolean,
    isPublished: Boolean,
    isVerified: Boolean,
    lastUpdated: Date,
    createdAt: Date,
  }
};

/**
 * Investor Profile - Investor information and preferences
 */
const InvestorModel = {
  investorId: String,
  userId: String, // User ID
  investorType: String, // 'individual', 'institutional', 'fund'
  profile: {
    experience: String, // 'beginner', 'intermediate', 'expert'
    investmentExperience: Number, // Years
    portfolioSize: Number,
    totalInvested: Number,
    accreditedInvestor: Boolean,
    netWorth: Number,
    annualIncome: Number,
  },
  preferences: {
    investmentRange: {
      min: Number,
      max: Number,
    },
    preferredSectors: Array, // Industries of interest
    preferredRegions: Array, // Geographic preferences
    riskTolerance: String, // 'conservative', 'moderate', 'aggressive'
    investmentHorizon: String, // 'short', 'medium', 'long'
    investmentTypes: Array, // 'equity', 'debt', 'revenue-share'
    esgFocus: Boolean,
    minimumEsgScore: Number,
  },
  criteria: {
    minimumRevenue: Number,
    maximumBurnRate: Number,
    preferredFundingStage: Array,
    minimumTeamSize: Number,
    requiresProfit: Boolean,
    maximumRiskLevel: String,
  },
  performance: {
    totalInvestments: Number,
    activeInvestments: Number,
    successfulExits: Number,
    averageReturn: Number,
    bestReturn: Number,
    portfolioValue: Number,
    lastCalculated: Date,
  },
  verification: {
    isAccredited: Boolean,
    accreditationDate: Date,
    accreditationProvider: String,
    bankAccountVerified: Boolean,
    documentsSubmitted: Array,
  },
  metadata: {
    createdAt: Date,
    updatedAt: Date,
    lastActive: Date,
  }
};

// ============================================================================
// INVESTMENT & TRANSACTION MODELS
// ============================================================================

/**
 * Investment Opportunity - Business funding campaigns
 */
const InvestmentOpportunityModel = {
  opportunityId: String,
  businessId: String,
  campaignInfo: {
    title: String,
    description: String,
    shortDescription: String,
    images: Array, // Campaign images/videos
    campaignType: String, // 'equity', 'debt', 'revenue-share'
  },
  funding: {
    targetAmount: Number,
    minimumAmount: Number,
    raisedAmount: Number,
    currency: String,
    valuation: Number,
    equityOffered: Number, // Percentage for equity campaigns
    interestRate: Number, // For debt campaigns
    revenueSharePercentage: Number, // For revenue-share
  },
  timeline: {
    startDate: Date,
    endDate: Date,
    expectedClosingDate: Date,
    duration: Number, // Days
    status: String, // 'draft', 'active', 'funded', 'cancelled', 'expired'
  },
  terms: {
    minimumInvestment: Number,
    maximumInvestment: Number,
    investorLimit: Number,
    useOfFunds: String,
    expectedReturn: Number,
    paybackPeriod: Number, // Months
    liquidityEvents: Array,
  },
  documents: {
    businessPlan: String, // URL
    financialStatements: Array,
    legalDocuments: Array,
    dueDiligencePackage: String,
    pitchDeck: String,
  },
  performance: {
    viewCount: Number,
    interestedInvestors: Number,
    committedInvestors: Number,
    averageInvestmentSize: Number,
    conversionRate: Number,
    socialShares: Number,
  },
  metadata: {
    createdAt: Date,
    updatedAt: Date,
    publishedAt: Date,
    featuredUntil: Date,
  }
};

/**
 * Investment Transaction - Individual investment records
 */
const InvestmentModel = {
  investmentId: String,
  opportunityId: String,
  investorId: String,
  businessId: String,
  transaction: {
    amount: Number,
    currency: String,
    investmentType: String, // 'equity', 'debt', 'revenue-share'
    equityPercentage: Number,
    shares: Number,
    pricePerShare: Number,
    status: String, // 'pending', 'confirmed', 'completed', 'cancelled'
  },
  payment: {
    paymentMethod: String, // 'stripe', 'bank_transfer', 'crypto'
    paymentId: String, // Payment processor ID
    paymentStatus: String,
    transactionFee: Number,
    netAmount: Number,
    paidAt: Date,
  },
  legal: {
    contractSigned: Boolean,
    contractUrl: String,
    signedAt: Date,
    legalStatus: String,
    shareholderAgreement: String,
  },
  returns: {
    expectedReturn: Number,
    actualReturn: Number,
    dividendsPaid: Number,
    lastDividendDate: Date,
    currentValue: Number,
    unrealizedGain: Number,
  },
  metadata: {
    createdAt: Date,
    completedAt: Date,
    lastUpdated: Date,
    notes: String,
  }
};

// ============================================================================
// FINANCIAL RECORDS MODELS
// ============================================================================

/**
 * Financial Record - Business financial data
 */
const FinancialRecordModel = {
  recordId: String,
  businessId: String,
  period: {
    type: String, // 'monthly', 'quarterly', 'annual'
    year: Number,
    month: Number, // 1-12, null for annual
    quarter: Number, // 1-4, null for monthly/annual
    startDate: Date,
    endDate: Date,
  },
  revenue: {
    totalRevenue: Number,
    recurringRevenue: Number,
    oneTimeRevenue: Number,
    revenueStreams: Array, // [{source, amount, percentage}]
    growthRate: Number,
    currency: String,
  },
  expenses: {
    totalExpenses: Number,
    operatingExpenses: Number,
    marketingExpenses: Number,
    personnelExpenses: Number,
    technologyExpenses: Number,
    otherExpenses: Number,
    expenseBreakdown: Array,
  },
  profitability: {
    grossProfit: Number,
    netProfit: Number,
    ebitda: Number,
    grossMargin: Number,
    netMargin: Number,
    operatingMargin: Number,
  },
  cashFlow: {
    operatingCashFlow: Number,
    investingCashFlow: Number,
    financingCashFlow: Number,
    netCashFlow: Number,
    cashOnHand: Number,
    burnRate: Number,
  },
  balanceSheet: {
    totalAssets: Number,
    currentAssets: Number,
    fixedAssets: Number,
    totalLiabilities: Number,
    currentLiabilities: Number,
    longTermLiabilities: Number,
    equity: Number,
  },
  metrics: {
    customerCount: Number,
    averageRevenuePerUser: Number,
    customerAcquisitionCost: Number,
    lifetimeValue: Number,
    churnRate: Number,
    monthlyRecurringRevenue: Number,
  },
  verification: {
    isVerified: Boolean,
    verifiedBy: String, // Accountant/auditor
    verificationDate: Date,
    auditFirm: String,
    certificationLevel: String,
  },
  metadata: {
    createdAt: Date,
    updatedAt: Date,
    submittedBy: String,
    status: String, // 'draft', 'submitted', 'verified'
  }
};

// ============================================================================
// ANALYTICS & SCORING MODELS
// ============================================================================

/**
 * ESG Score - Environmental, Social, Governance scoring
 */
const ESGScoreModel = {
  scoreId: String,
  businessId: String,
  environmental: {
    score: Number, // 0-100
    energyEfficiency: Number,
    wasteManagement: Number,
    carbonFootprint: Number,
    renewableEnergy: Number,
    environmentalPolicies: Boolean,
    certifications: Array, // Environmental certifications
  },
  social: {
    score: Number, // 0-100
    employeeWelfare: Number,
    communityImpact: Number,
    diversityInclusion: Number,
    customerSatisfaction: Number,
    socialPrograms: Array,
    localHiring: Number, // Percentage
  },
  governance: {
    score: Number, // 0-100
    boardDiversity: Number,
    transparency: Number,
    ethicsScore: Number,
    regulatoryCompliance: Number,
    reportingQuality: Number,
    stakeholderRights: Number,
  },
  overall: {
    totalScore: Number, // 0-100
    grade: String, // 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D'
    ranking: Number, // Industry ranking
    improvementAreas: Array,
    strengths: Array,
  },
  assessment: {
    lastAssessed: Date,
    assessor: String,
    methodology: String,
    dataSource: String,
    nextAssessment: Date,
  }
};

/**
 * AI Matchmaking Score - Investor-Business compatibility
 */
const MatchScoreModel = {
  matchId: String,
  investorId: String,
  businessId: String,
  compatibility: {
    overallScore: Number, // 0-100
    riskMatch: Number, // 0-100
    sectorMatch: Number, // 0-100
    sizeMatch: Number, // 0-100
    geographicMatch: Number, // 0-100
    esgMatch: Number, // 0-100
    stageMatch: Number, // 0-100
  },
  reasoning: {
    strengths: Array, // Why it's a good match
    concerns: Array, // Potential issues
    recommendations: Array, // Suggested actions
    confidenceLevel: String, // 'high', 'medium', 'low'
  },
  prediction: {
    investmentProbability: Number, // 0-100
    expectedInvestmentSize: Number,
    timeToDecision: Number, // Days
    successProbability: Number, // Long-term success
  },
  metadata: {
    calculatedAt: Date,
    algorithm: String, // Algorithm version
    dataPoints: Number, // Number of factors considered
    lastUpdated: Date,
  }
};

// ============================================================================
// COMMUNICATION & INTERACTION MODELS
// ============================================================================

/**
 * Message Thread - Investor-Business communication
 */
const MessageThreadModel = {
  threadId: String,
  participants: Array, // [investorId, businessId]
  opportunityId: String, // Related investment opportunity
  metadata: {
    title: String,
    status: String, // 'active', 'archived', 'closed'
    priority: String, // 'low', 'medium', 'high'
    createdAt: Date,
    lastMessageAt: Date,
    messageCount: Number,
  }
};

/**
 * Individual Message
 */
const MessageModel = {
  messageId: String,
  threadId: String,
  senderId: String,
  content: {
    text: String,
    attachments: Array, // File URLs
    messageType: String, // 'text', 'document', 'meeting_request'
  },
  status: {
    sent: Boolean,
    delivered: Boolean,
    read: Boolean,
    readAt: Date,
  },
  metadata: {
    sentAt: Date,
    editedAt: Date,
    isDeleted: Boolean,
  }
};

// ============================================================================
// SYSTEM & AUDIT MODELS
// ============================================================================

/**
 * Activity Log - System activity tracking
 */
const ActivityLogModel = {
  logId: String,
  userId: String,
  action: String, // 'login', 'investment', 'profile_update', etc.
  resource: {
    type: String, // 'business', 'investment', 'user'
    id: String,
    name: String,
  },
  details: Object, // Action-specific details
  metadata: {
    timestamp: Date,
    ipAddress: String,
    userAgent: String,
    location: String,
  }
};

/**
 * System Notification
 */
const NotificationModel = {
  notificationId: String,
  userId: String,
  type: String, // 'investment', 'message', 'system', 'marketing'
  title: String,
  message: String,
  data: Object, // Additional data
  channels: {
    push: Boolean,
    email: Boolean,
    sms: Boolean,
  },
  status: {
    sent: Boolean,
    delivered: Boolean,
    read: Boolean,
    readAt: Date,
  },
  metadata: {
    createdAt: Date,
    sentAt: Date,
    expiresAt: Date,
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  UserModel,
  BusinessModel,
  InvestorModel,
  InvestmentOpportunityModel,
  InvestmentModel,
  FinancialRecordModel,
  ESGScoreModel,
  MatchScoreModel,
  MessageThreadModel,
  MessageModel,
  ActivityLogModel,
  NotificationModel,
  VRTourModel,
  AIInsightsModel,
  SmartContractModel,
  MarketIntelligenceModel
};

// ============================================================================
// ADVANCED AI & VR MODELS (CREATIVE ENHANCEMENTS)
// ============================================================================

/**
 * VR Tour Experience - Immersive business presentations
 */
const VRTourModel = {
  tourId: String,
  businessId: String,
  tourData: {
    title: String,
    description: String,
    duration: Number, // minutes
    tourType: String, // 'factory', 'office', 'market', 'product_demo'
    thumbnailUrl: String,
    vrContentUrl: String, // 360° video/scene URL
    hotspots: Array, // Interactive points in VR space
  },
  technical: {
    quality: String, // '4K', '8K', '360_stereo'
    compatibility: Array, // ['oculus', 'cardboard', 'web_vr']
    fileSize: Number, // MB
    streamingUrl: String,
    downloadUrl: String,
  },
  analytics: {
    totalViews: Number,
    averageViewTime: Number,
    completionRate: Number,
    interactionPoints: Number,
    leadGenerated: Number,
  },
  scheduling: {
    liveDemoSlots: Array, // Available times for live demos
    bookedSessions: Array,
    maxConcurrentViewers: Number,
    timeZone: String,
  },
  createdAt: Date,
  updatedAt: Date
};

/**
 * AI Business Insights - Advanced predictive analytics
 */
const AIInsightsModel = {
  insightId: String,
  businessId: String,
  insights: {
    businessHealthScore: Number, // 0-100
    growthProjection: {
      nextQuarter: Number,
      nextYear: Number,
      confidenceLevel: Number, // 0-100
      factors: Array, // Key growth drivers
    },
    riskAssessment: {
      overallRisk: String, // 'low', 'medium', 'high'
      riskFactors: Array,
      mitigationStrategies: Array,
      probability: Number, // % of success
    },
    marketPosition: {
      competitiveRank: Number,
      marketShare: Number,
      threats: Array,
      opportunities: Array,
    },
    investmentReadiness: {
      score: Number, // 0-100
      readinessLevel: String, // 'not_ready', 'developing', 'ready', 'prime'
      improvementAreas: Array,
      strengths: Array,
    }
  },
  predictions: {
    fundingSuccess: Number, // % probability
    optimalFundingAmount: Number,
    expectedTimeToFund: Number, // days
    recommendedInvestors: Array,
    marketTiming: String, // 'excellent', 'good', 'fair', 'poor'
  },
  generatedAt: Date,
  algorithmVersion: String,
  dataQuality: Number // 0-100
};

/**
 * Smart Contract Integration - Blockchain investment tracking
 */
const SmartContractModel = {
  contractId: String,
  investmentId: String,
  blockchain: String, // 'ethereum', 'polygon', 'bsc'
  contractAddress: String,
  contractType: String, // 'equity', 'revenue_share', 'convertible'
  terms: {
    totalShares: Number,
    pricePerShare: Number,
    vestingSchedule: Object,
    liquidityEvents: Array,
    votingRights: Boolean,
    dividendRights: Boolean,
  },
  automation: {
    autoExecute: Boolean,
    triggers: Array, // Conditions for auto-execution
    milestones: Array,
    paymentSchedule: Object,
  },
  status: String, // 'deployed', 'active', 'completed', 'cancelled'
  transactions: Array, // Blockchain transaction hashes
  gasUsed: Number,
  deployedAt: Date
};

/**
 * Market Intelligence - Real-time market data and trends
 */
const MarketIntelligenceModel = {
  marketId: String,
  region: String, // 'nigeria', 'kenya', 'south_africa', 'africa'
  industry: String,
  data: {
    marketSize: Number,
    growthRate: Number,
    competitorCount: Number,
    averageValuation: Number,
    fundingTrends: {
      totalFunding: Number,
      dealCount: Number,
      averageDealSize: Number,
      topSectors: Array,
    },
    regulations: {
      businessFriendliness: Number, // 0-100
      taxRate: Number,
      startupIncentives: Array,
      compliance: Object,
    }
  },
  insights: {
    hotSectors: Array,
    emergingTrends: Array,
    investorSentiment: String, // 'bullish', 'neutral', 'bearish'
    recommendedActions: Array,
  },
  lastUpdated: Date,
  dataSource: String
};

// ============================================================================
// ENHANCED EXPORTS
// ============================================================================

/**
 * DATA MODEL SUMMARY:
 * - 16+ comprehensive models covering all platform functionality
 * - Advanced AI-powered insights and predictions
 * - VR/AR integration for immersive experiences
 * - Blockchain smart contract support
 * - Real-time market intelligence
 * - Comprehensive user, business, and investment management
 * - Advanced analytics and scoring capabilities  
 * - Communication and notification systems
 * - Audit trails and system monitoring
 * - Designed for scalability and African market needs
 * - Supports multi-currency and multi-language
 * - Includes compliance and verification features
 * - Creative features: VR tours, AI insights, smart contracts
 */