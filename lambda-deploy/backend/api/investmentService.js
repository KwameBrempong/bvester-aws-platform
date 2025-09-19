/**
 * INVESTMENT SERVICE
 * Handles investment opportunities, transactions, and portfolio management
 * Real money investment processing with compliance and audit trail
 */

const admin = require('firebase-admin');
const uuid = require('uuid');
const winston = require('winston');
const crypto = require('crypto');
const { PaymentProcessorService } = require('./paymentProcessor');

const db = admin.firestore();
const paymentService = new PaymentProcessorService();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/investments.log' }),
    new winston.transports.Console()
  ]
});

// ============================================================================
// INVESTMENT SERVICE CLASS
// ============================================================================

class InvestmentService {
  
  // Create Investment Opportunity
  async createInvestmentOpportunity(businessId, opportunityData) {
    try {
      // Validate business exists and is verified
      const businessDoc = await db.collection('businesses').doc(businessId).get();
      if (!businessDoc.exists) {
        throw new Error('Business not found');
      }

      const businessData = businessDoc.data();
      if (!businessData.verification?.verified) {
        throw new Error('Business must be verified to create investment opportunities');
      }

      const opportunityId = uuid.v4();
      
      const opportunity = {
        opportunityId,
        businessId,
        businessInfo: {
          name: businessData.basicInfo?.businessName,
          industry: businessData.basicInfo?.industry,
          country: businessData.basicInfo?.country,
          description: businessData.basicInfo?.description
        },
        
        investment: {
          type: opportunityData.investmentType, // 'equity', 'debt', 'revenue_share'
          minimumAmount: opportunityData.minimumAmount,
          maximumAmount: opportunityData.maximumAmount,
          targetAmount: opportunityData.targetAmount,
          currentAmount: 0,
          currency: opportunityData.currency || 'USD',
          
          // Equity specific
          equityPercentage: opportunityData.equityPercentage || null,
          valuation: opportunityData.valuation || null,
          
          // Debt specific
          interestRate: opportunityData.interestRate || null,
          termMonths: opportunityData.termMonths || null,
          
          // Revenue share specific
          revenueSharePercentage: opportunityData.revenueSharePercentage || null,
          shareDurationMonths: opportunityData.shareDurationMonths || null
        },
        
        timeline: {
          startDate: opportunityData.startDate ? new Date(opportunityData.startDate) : new Date(),
          endDate: opportunityData.endDate ? new Date(opportunityData.endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days default
          status: 'draft', // 'draft', 'active', 'paused', 'completed', 'cancelled'
          launchedAt: null,
          completedAt: null
        },
        
        documentation: {
          businessPlan: opportunityData.businessPlan || null,
          financials: opportunityData.financials || null,
          legalDocuments: opportunityData.legalDocuments || [],
          dueDiligenceReport: null,
          termSheet: opportunityData.termSheet || null
        },
        
        risks: {
          riskLevel: opportunityData.riskLevel || 'medium', // 'low', 'medium', 'high'
          riskFactors: opportunityData.riskFactors || [],
          mitigationStrategies: opportunityData.mitigationStrategies || []
        },
        
        compliance: {
          kycRequired: true,
          accreditedInvestorsOnly: opportunityData.accreditedOnly || false,
          geographicRestrictions: opportunityData.geographicRestrictions || [],
          regulatoryApproval: {
            required: opportunityData.regulatoryApprovalRequired || false,
            obtained: false,
            jurisdiction: opportunityData.jurisdiction || null
          }
        },
        
        performance: {
          investorCount: 0,
          averageInvestment: 0,
          completionPercentage: 0,
          projectedReturns: opportunityData.projectedReturns || null,
          expectedTimeline: opportunityData.expectedTimeline || null
        },
        
        metadata: {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: businessData.ownerId,
          featured: false,
          tags: opportunityData.tags || [],
          category: opportunityData.category || 'general'
        }
      };

      // Save opportunity
      await db.collection('opportunities').doc(opportunityId).set(opportunity);

      // Create activity log
      await this.createActivityLog(businessData.ownerId, 'opportunity_created', {
        type: 'opportunity',
        id: opportunityId,
        newState: { status: 'draft', targetAmount: opportunityData.targetAmount }
      });

      logger.info(`Investment opportunity created: ${opportunityId} for business: ${businessId}`);

      return {
        success: true,
        opportunityId,
        status: 'draft',
        message: 'Investment opportunity created successfully'
      };

    } catch (error) {
      logger.error('Create investment opportunity error:', error);
      throw error;
    }
  }

  // Launch Investment Opportunity
  async launchInvestmentOpportunity(opportunityId, userId) {
    try {
      const opportunityDoc = await db.collection('opportunities').doc(opportunityId).get();
      if (!opportunityDoc.exists) {
        throw new Error('Investment opportunity not found');
      }

      const opportunityData = opportunityDoc.data();
      
      // Verify user can launch this opportunity
      const businessDoc = await db.collection('businesses').doc(opportunityData.businessId).get();
      if (!businessDoc.exists || businessDoc.data().ownerId !== userId) {
        throw new Error('Unauthorized to launch this opportunity');
      }

      // Validate opportunity is ready to launch
      if (opportunityData.timeline.status !== 'draft') {
        throw new Error('Only draft opportunities can be launched');
      }

      // Perform final validation
      const validationErrors = this.validateOpportunityForLaunch(opportunityData);
      if (validationErrors.length > 0) {
        throw new Error(`Opportunity validation failed: ${validationErrors.join(', ')}`);
      }

      // Update opportunity status
      await db.collection('opportunities').doc(opportunityId).update({
        'timeline.status': 'active',
        'timeline.launchedAt': admin.firestore.FieldValue.serverTimestamp(),
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });

      // Create activity log
      await this.createActivityLog(userId, 'opportunity_launched', {
        type: 'opportunity',
        id: opportunityId,
        newState: { status: 'active' }
      });

      logger.info(`Investment opportunity launched: ${opportunityId}`);

      return {
        success: true,
        opportunityId,
        status: 'active',
        message: 'Investment opportunity launched successfully'
      };

    } catch (error) {
      logger.error('Launch investment opportunity error:', error);
      throw error;
    }
  }

  // Process Investment Transaction
  async processInvestment(investmentData) {
    try {
      const {
        investorId,
        opportunityId,
        amount,
        currency,
        paymentMethodId,
        metadata = {}
      } = investmentData;

      // Validate opportunity
      const opportunityDoc = await db.collection('opportunities').doc(opportunityId).get();
      if (!opportunityDoc.exists) {
        throw new Error('Investment opportunity not found');
      }

      const opportunityData = opportunityDoc.data();
      
      if (opportunityData.timeline.status !== 'active') {
        throw new Error('Investment opportunity is not active');
      }

      // Validate investment amount
      if (amount < opportunityData.investment.minimumAmount) {
        throw new Error(`Minimum investment amount is ${opportunityData.investment.minimumAmount} ${currency}`);
      }

      if (amount > opportunityData.investment.maximumAmount) {
        throw new Error(`Maximum investment amount is ${opportunityData.investment.maximumAmount} ${currency}`);
      }

      // Check if opportunity is fully funded
      const remainingAmount = opportunityData.investment.targetAmount - opportunityData.investment.currentAmount;
      if (amount > remainingAmount) {
        throw new Error(`Investment amount exceeds remaining target. Available: ${remainingAmount} ${currency}`);
      }

      // Validate investor eligibility
      await this.validateInvestorEligibility(investorId, opportunityData, amount);

      const investmentId = uuid.v4();
      
      // Create investment record
      const investment = {
        investmentId,
        investorId,
        opportunityId,
        businessId: opportunityData.businessId,
        
        transaction: {
          amount: amount * 100, // Store in minor units
          currency,
          status: 'pending', // 'pending', 'processing', 'completed', 'failed', 'cancelled'
          paymentMethodId,
          paymentIntentId: null,
          transactionId: null,
          processedAt: null,
          failureReason: null
        },
        
        investment: {
          type: opportunityData.investment.type,
          investmentTerms: {
            // Equity terms
            equityPercentage: opportunityData.investment.equityPercentage ? 
              (amount / opportunityData.investment.targetAmount) * opportunityData.investment.equityPercentage : null,
            
            // Debt terms
            interestRate: opportunityData.investment.interestRate,
            termMonths: opportunityData.investment.termMonths,
            
            // Revenue share terms
            revenueSharePercentage: opportunityData.investment.revenueSharePercentage,
            shareDurationMonths: opportunityData.investment.shareDurationMonths
          },
          expectedReturns: this.calculateExpectedReturns(amount, opportunityData),
          maturityDate: this.calculateMaturityDate(opportunityData)
        },
        
        legal: {
          contractGenerated: false,
          contractSigned: false,
          signedAt: null,
          legalDocuments: [],
          complianceChecked: false
        },
        
        returns: {
          totalReceived: 0,
          dividendsPaid: 0,
          interestPaid: 0,
          revenueSharePaid: 0,
          lastPaymentAt: null,
          roi: 0,
          irr: 0
        },
        
        status: {
          current: 'pending',
          history: [{
            status: 'pending',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            reason: 'Investment initiated'
          }]
        },
        
        compliance: {
          kycVerified: false,
          amlCleared: false,
          riskAssessed: false,
          accreditationVerified: false
        },
        
        metadata: {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          source: metadata.source || 'web'
        }
      };

      // Create payment intent
      const paymentResult = await paymentService.createPaymentIntent({
        userId: investorId,
        amount,
        currency,
        purpose: 'investment',
        paymentMethodId,
        metadata: {
          investmentId,
          opportunityId,
          businessId: opportunityData.businessId,
          ...metadata
        }
      });

      if (!paymentResult.success) {
        throw new Error(`Payment processing failed: ${paymentResult.error}`);
      }

      // Update investment with payment details
      investment.transaction.paymentIntentId = paymentResult.paymentIntent.id;
      investment.transaction.transactionId = paymentResult.transactionId;

      // Save investment record
      await db.collection('investments').doc(investmentId).set(investment);

      // Reserve the investment amount in opportunity
      await this.reserveInvestmentAmount(opportunityId, amount);

      logger.info(`Investment processed: ${investmentId} for opportunity: ${opportunityId}`);

      return {
        success: true,
        investmentId,
        paymentIntent: paymentResult.paymentIntent,
        transactionId: paymentResult.transactionId,
        message: 'Investment initiated successfully'
      };

    } catch (error) {
      logger.error('Process investment error:', error);
      throw error;
    }
  }

  // Complete Investment (after successful payment)
  async completeInvestment(investmentId, paymentDetails) {
    try {
      const investmentDoc = await db.collection('investments').doc(investmentId).get();
      if (!investmentDoc.exists) {
        throw new Error('Investment not found');
      }

      const investmentData = investmentDoc.data();

      // Update investment status
      await db.collection('investments').doc(investmentId).update({
        'transaction.status': 'completed',
        'transaction.processedAt': admin.firestore.FieldValue.serverTimestamp(),
        'status.current': 'completed',
        'status.history': admin.firestore.FieldValue.arrayUnion({
          status: 'completed',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          reason: 'Payment completed successfully'
        }),
        'compliance.kycVerified': true, // Assuming payment completion implies KYC
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });

      // Update opportunity funding
      await this.updateOpportunityFunding(investmentData.opportunityId, investmentData.transaction.amount / 100);

      // Update investor portfolio
      await this.updateInvestorPortfolio(investmentData.investorId, investmentData);

      // Generate legal documents
      await this.generateInvestmentDocuments(investmentId);

      // Create activity log
      await this.createActivityLog(investmentData.investorId, 'investment_completed', {
        type: 'investment',
        id: investmentId,
        newState: { status: 'completed', amount: investmentData.transaction.amount }
      });

      logger.info(`Investment completed: ${investmentId}`);

      return {
        success: true,
        investmentId,
        status: 'completed',
        message: 'Investment completed successfully'
      };

    } catch (error) {
      logger.error('Complete investment error:', error);
      throw error;
    }
  }

  // Get Investment Opportunities (with filtering)
  async getInvestmentOpportunities(filters = {}) {
    try {
      let query = db.collection('opportunities')
        .where('timeline.status', '==', 'active');

      // Apply filters
      if (filters.industry) {
        query = query.where('businessInfo.industry', '==', filters.industry);
      }

      if (filters.country) {
        query = query.where('businessInfo.country', '==', filters.country);
      }

      if (filters.investmentType) {
        query = query.where('investment.type', '==', filters.investmentType);
      }

      if (filters.riskLevel) {
        query = query.where('risks.riskLevel', '==', filters.riskLevel);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.orderBy(`metadata.${sortBy}`, sortOrder);

      // Apply pagination
      const limit = parseInt(filters.limit) || 20;
      const offset = parseInt(filters.offset) || 0;
      query = query.limit(limit).offset(offset);

      const snapshot = await query.get();
      const opportunities = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        opportunities.push({
          opportunityId: data.opportunityId,
          businessInfo: data.businessInfo,
          investment: {
            ...data.investment,
            completionPercentage: (data.investment.currentAmount / data.investment.targetAmount) * 100,
            remainingAmount: data.investment.targetAmount - data.investment.currentAmount
          },
          timeline: data.timeline,
          risks: data.risks,
          performance: data.performance,
          featured: data.metadata?.featured || false,
          tags: data.metadata?.tags || [],
          createdAt: data.metadata?.createdAt
        });
      });

      return {
        success: true,
        opportunities,
        pagination: {
          limit,
          offset,
          total: opportunities.length,
          hasMore: opportunities.length === limit
        }
      };

    } catch (error) {
      logger.error('Get investment opportunities error:', error);
      throw error;
    }
  }

  // Get User Investments (portfolio)
  async getUserInvestments(userId, filters = {}) {
    try {
      let query = db.collection('investments')
        .where('investorId', '==', userId);

      // Apply filters
      if (filters.status) {
        query = query.where('status.current', '==', filters.status);
      }

      if (filters.investmentType) {
        query = query.where('investment.type', '==', filters.investmentType);
      }

      // Apply sorting and pagination
      query = query.orderBy('metadata.createdAt', 'desc');
      const limit = parseInt(filters.limit) || 20;
      const offset = parseInt(filters.offset) || 0;
      query = query.limit(limit).offset(offset);

      const snapshot = await query.get();
      const investments = [];
      let totalInvested = 0;
      let totalReturns = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Get opportunity details
        const opportunityDoc = await db.collection('opportunities').doc(data.opportunityId).get();
        const opportunityData = opportunityDoc.exists ? opportunityDoc.data() : null;

        investments.push({
          investmentId: data.investmentId,
          opportunityInfo: opportunityData ? {
            name: opportunityData.businessInfo.name,
            industry: opportunityData.businessInfo.industry,
            status: opportunityData.timeline.status
          } : null,
          amount: data.transaction.amount / 100, // Convert from minor units
          currency: data.transaction.currency,
          type: data.investment.type,
          status: data.status.current,
          returns: data.returns,
          expectedReturns: data.investment.expectedReturns,
          investmentDate: data.metadata.createdAt,
          maturityDate: data.investment.maturityDate
        });

        if (data.status.current === 'completed') {
          totalInvested += data.transaction.amount / 100;
          totalReturns += data.returns.totalReceived;
        }
      }

      return {
        success: true,
        investments,
        summary: {
          totalInvestments: investments.length,
          totalInvested,
          totalReturns,
          netGain: totalReturns - totalInvested,
          averageROI: totalInvested > 0 ? ((totalReturns - totalInvested) / totalInvested) * 100 : 0
        },
        pagination: {
          limit,
          offset,
          hasMore: investments.length === limit
        }
      };

    } catch (error) {
      logger.error('Get user investments error:', error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  validateOpportunityForLaunch(opportunityData) {
    const errors = [];

    if (!opportunityData.investment.targetAmount || opportunityData.investment.targetAmount <= 0) {
      errors.push('Target amount is required and must be positive');
    }

    if (!opportunityData.investment.minimumAmount || opportunityData.investment.minimumAmount <= 0) {
      errors.push('Minimum investment amount is required and must be positive');
    }

    if (opportunityData.investment.minimumAmount > opportunityData.investment.targetAmount) {
      errors.push('Minimum investment cannot exceed target amount');
    }

    if (!opportunityData.timeline.endDate || new Date(opportunityData.timeline.endDate) <= new Date()) {
      errors.push('End date must be in the future');
    }

    if (!opportunityData.businessInfo.name) {
      errors.push('Business name is required');
    }

    return errors;
  }

  async validateInvestorEligibility(investorId, opportunityData, amount) {
    // Get investor profile
    const investorDoc = await db.collection('users').doc(investorId).get();
    if (!investorDoc.exists) {
      throw new Error('Investor not found');
    }

    const investorData = investorDoc.data();

    // Check KYC verification
    if (!investorData.kyc?.verified) {
      throw new Error('KYC verification required for investments');
    }

    // Check accredited investor requirement
    if (opportunityData.compliance.accreditedInvestorsOnly) {
      const kycDoc = await db.collection('kycProfiles').doc(investorId).get();
      if (!kycDoc.exists || !kycDoc.data().investorClassification?.isAccredited) {
        throw new Error('This opportunity requires accredited investor status');
      }
    }

    // Check investment limits
    if (opportunityData.compliance.accreditedInvestorsOnly) {
      const kycData = kycDoc.data();
      const annualLimit = kycData.investorClassification.investmentLimits.annual;
      const perInvestmentLimit = kycData.investorClassification.investmentLimits.perInvestment;

      if (amount > perInvestmentLimit) {
        throw new Error(`Investment exceeds per-investment limit of ${perInvestmentLimit}`);
      }

      // Check annual limit (would need to calculate YTD investments)
      // This is a simplified check
      if (amount > annualLimit) {
        throw new Error(`Investment exceeds annual limit of ${annualLimit}`);
      }
    }

    // Check geographic restrictions
    if (opportunityData.compliance.geographicRestrictions.length > 0) {
      const investorCountry = investorData.profile?.country;
      if (opportunityData.compliance.geographicRestrictions.includes(investorCountry)) {
        throw new Error('Investment not available in your location');
      }
    }
  }

  calculateExpectedReturns(amount, opportunityData) {
    const type = opportunityData.investment.type;
    
    if (type === 'equity') {
      return {
        type: 'equity',
        expectedReturn: null, // Depends on business performance
        timeframe: 'variable'
      };
    } else if (type === 'debt') {
      const monthlyRate = opportunityData.investment.interestRate / 100 / 12;
      const months = opportunityData.investment.termMonths;
      const totalInterest = amount * monthlyRate * months;
      
      return {
        type: 'debt',
        expectedReturn: amount + totalInterest,
        timeframe: `${months} months`,
        interestRate: opportunityData.investment.interestRate
      };
    } else if (type === 'revenue_share') {
      return {
        type: 'revenue_share',
        expectedReturn: null, // Depends on business revenue
        timeframe: `${opportunityData.investment.shareDurationMonths} months`,
        sharePercentage: opportunityData.investment.revenueSharePercentage
      };
    }

    return null;
  }

  calculateMaturityDate(opportunityData) {
    if (opportunityData.investment.type === 'debt' && opportunityData.investment.termMonths) {
      const maturityDate = new Date();
      maturityDate.setMonth(maturityDate.getMonth() + opportunityData.investment.termMonths);
      return maturityDate;
    }
    
    if (opportunityData.investment.type === 'revenue_share' && opportunityData.investment.shareDurationMonths) {
      const maturityDate = new Date();
      maturityDate.setMonth(maturityDate.getMonth() + opportunityData.investment.shareDurationMonths);
      return maturityDate;
    }

    return null; // No maturity date for equity
  }

  async reserveInvestmentAmount(opportunityId, amount) {
    return db.runTransaction(async (transaction) => {
      const opportunityRef = db.collection('opportunities').doc(opportunityId);
      const opportunityDoc = await transaction.get(opportunityRef);
      
      if (!opportunityDoc.exists) {
        throw new Error('Opportunity not found');
      }

      const currentAmount = opportunityDoc.data().investment.currentAmount;
      const newAmount = currentAmount + amount;

      transaction.update(opportunityRef, {
        'investment.currentAmount': newAmount,
        'performance.completionPercentage': (newAmount / opportunityDoc.data().investment.targetAmount) * 100,
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });
    });
  }

  async updateOpportunityFunding(opportunityId, amount) {
    return db.runTransaction(async (transaction) => {
      const opportunityRef = db.collection('opportunities').doc(opportunityId);
      const opportunityDoc = await transaction.get(opportunityRef);
      
      if (!opportunityDoc.exists) {
        throw new Error('Opportunity not found');
      }

      const data = opportunityDoc.data();
      const newAmount = data.investment.currentAmount + amount;
      const newInvestorCount = data.performance.investorCount + 1;
      const newAverageInvestment = newAmount / newInvestorCount;

      // Check if opportunity is fully funded
      let newStatus = data.timeline.status;
      let completedAt = null;
      
      if (newAmount >= data.investment.targetAmount && newStatus === 'active') {
        newStatus = 'completed';
        completedAt = admin.firestore.FieldValue.serverTimestamp();
      }

      transaction.update(opportunityRef, {
        'investment.currentAmount': newAmount,
        'performance.investorCount': newInvestorCount,
        'performance.averageInvestment': newAverageInvestment,
        'performance.completionPercentage': (newAmount / data.investment.targetAmount) * 100,
        'timeline.status': newStatus,
        'timeline.completedAt': completedAt,
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });
    });
  }

  async updateInvestorPortfolio(investorId, investmentData) {
    // Get or create portfolio
    const portfolioRef = db.collection('portfolios').doc(investorId);
    const portfolioDoc = await portfolioRef.get();

    if (!portfolioDoc.exists) {
      // Create new portfolio
      const portfolioData = {
        portfolioId: uuid.v4(),
        investorId,
        summary: {
          totalInvestments: 1,
          totalValue: investmentData.transaction.amount / 100,
          totalCost: investmentData.transaction.amount / 100,
          totalGainLoss: 0,
          totalGainLossPercentage: 0,
          breakdown: {
            equity: investmentData.investment.type === 'equity' ? { count: 1, value: investmentData.transaction.amount / 100, percentage: 100 } : { count: 0, value: 0, percentage: 0 },
            debt: investmentData.investment.type === 'debt' ? { count: 1, value: investmentData.transaction.amount / 100, percentage: 100 } : { count: 0, value: 0, percentage: 0 },
            revenueShare: investmentData.investment.type === 'revenue_share' ? { count: 1, value: investmentData.transaction.amount / 100, percentage: 100 } : { count: 0, value: 0, percentage: 0 }
          }
        },
        investments: [investmentData.investmentId],
        metadata: {
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastValuationDate: admin.firestore.FieldValue.serverTimestamp()
        }
      };

      await portfolioRef.set(portfolioData);
    } else {
      // Update existing portfolio
      const portfolioData = portfolioDoc.data();
      const investmentAmount = investmentData.transaction.amount / 100;
      
      await portfolioRef.update({
        'summary.totalInvestments': admin.firestore.FieldValue.increment(1),
        'summary.totalValue': admin.firestore.FieldValue.increment(investmentAmount),
        'summary.totalCost': admin.firestore.FieldValue.increment(investmentAmount),
        [`summary.breakdown.${investmentData.investment.type}.count`]: admin.firestore.FieldValue.increment(1),
        [`summary.breakdown.${investmentData.investment.type}.value`]: admin.firestore.FieldValue.increment(investmentAmount),
        'investments': admin.firestore.FieldValue.arrayUnion(investmentData.investmentId),
        'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp(),
        'metadata.lastValuationDate': admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  async generateInvestmentDocuments(investmentId) {
    // In production, this would generate legal documents using DocuSign or similar
    // For now, we'll create a placeholder record
    
    const documentRecord = {
      investmentId,
      documents: [
        {
          type: 'investment_agreement',
          status: 'pending_signature',
          generatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      ]
    };

    await db.collection('investmentDocuments').doc(investmentId).set(documentRecord);
  }

  async createActivityLog(userId, action, resource) {
    const activityLog = {
      userId,
      action,
      resource,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        source: 'investment_service'
      }
    };

    await db.collection('activityLogs').add(activityLog);
  }
}

module.exports = {
  InvestmentService
};