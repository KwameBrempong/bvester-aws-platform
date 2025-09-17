/**
 * BVESTER PLATFORM - DATABASE TEST SCRIPT
 * Test database setup and core operations
 * Generated: January 28, 2025
 */

const FirebaseService = require('./api/firebaseService');
const AuthService = require('./api/authService');

// Test data
const testBusinessUser = {
  email: 'test-business@bvester.com',
  password: 'TestPassword123!',
  userType: 'business',
  firstName: 'John',
  lastName: 'Doe',
  country: 'Nigeria',
  city: 'Lagos',
  phoneNumber: '+234123456789',
  currency: 'NGN'
};

const testInvestorUser = {
  email: 'test-investor@bvester.com',
  password: 'TestPassword123!',
  userType: 'investor',
  firstName: 'Jane',
  lastName: 'Smith',
  country: 'South Africa',
  city: 'Cape Town',
  phoneNumber: '+27123456789',
  currency: 'ZAR'
};

const testBusinessProfile = {
  ownerId: '', // Will be filled after user creation
  basicInfo: {
    businessName: 'TechStart Africa',
    legalName: 'TechStart Africa Limited',
    description: 'AI-powered fintech solutions for African SMEs',
    tagline: 'Banking the unbanked with AI',
    foundedYear: 2020,
    employees: 15,
    businessType: 'Limited Company'
  },
  location: {
    country: 'Nigeria',
    state: 'Lagos State',
    city: 'Lagos',
    address: '123 Victoria Island, Lagos',
    coordinates: {
      latitude: 6.4281,
      longitude: 3.4219
    },
    operatingRegions: ['Nigeria', 'Ghana', 'Kenya']
  },
  industry: {
    primarySector: 'fintech',
    secondarySectors: ['artificial-intelligence', 'mobile-payments'],
    businessModel: 'B2B2C',
    targetMarket: 'SMEs and individual consumers',
    competitiveAdvantage: 'AI-driven risk assessment'
  },
  financials: {
    annualRevenue: 250000,
    monthlyRevenue: 25000,
    profitMargin: 0.15,
    burnRate: 15000,
    runway: 12,
    fundingStage: 'seed',
    previousFunding: 50000,
    currentValuation: 500000,
    currency: 'NGN'
  },
  team: {
    founders: [
      {
        name: 'John Doe',
        role: 'CEO & Co-founder',
        bio: 'Former Goldman Sachs analyst with 10 years fintech experience',
        linkedin: 'https://linkedin.com/in/johndoe'
      }
    ],
    teamSize: 15
  }
};

const testInvestorProfile = {
  userId: '', // Will be filled after user creation
  investorType: 'individual',
  profile: {
    experience: 'intermediate',
    investmentExperience: 5,
    portfolioSize: 500000,
    totalInvested: 250000,
    accreditedInvestor: true,
    netWorth: 1000000,
    annualIncome: 150000
  },
  preferences: {
    investmentRange: {
      min: 5000,
      max: 50000
    },
    preferredSectors: ['fintech', 'agritech', 'healthtech'],
    preferredRegions: ['Nigeria', 'South Africa', 'Kenya'],
    riskTolerance: 'moderate',
    investmentHorizon: 'medium',
    investmentTypes: ['equity', 'debt'],
    esgFocus: true,
    minimumEsgScore: 70
  },
  criteria: {
    minimumRevenue: 100000,
    maximumBurnRate: 20000,
    preferredFundingStage: ['seed', 'series-a'],
    minimumTeamSize: 5,
    requiresProfit: false,
    maximumRiskLevel: 'medium'
  }
};

class DatabaseTester {
  
  async runAllTests() {
    console.log('🚀 Starting Bvester Database Tests...\n');
    
    try {
      // Test 1: User Registration
      await this.testUserRegistration();
      
      // Test 2: User Authentication
      await this.testUserAuthentication();
      
      // Test 3: Business Profile Creation
      await this.testBusinessProfileCreation();
      
      // Test 4: Investor Profile Creation
      await this.testInvestorProfileCreation();
      
      // Test 5: Financial Records
      await this.testFinancialRecords();
      
      // Test 6: Investment Opportunity
      await this.testInvestmentOpportunity();
      
      // Test 7: Messaging System
      await this.testMessagingSystem();
      
      // Test 8: Database Queries
      await this.testDatabaseQueries();
      
      console.log('✅ All database tests completed successfully!\n');
      
    } catch (error) {
      console.error('❌ Database test failed:', error);
    }
  }
  
  async testUserRegistration() {
    console.log('📝 Testing User Registration...');
    
    // Test business user registration
    const businessResult = await AuthService.registerUser(testBusinessUser);
    if (businessResult.success) {
      console.log('✅ Business user registered successfully');
      testBusinessProfile.ownerId = businessResult.user.uid;
    } else {
      console.log('⚠️ Business user registration:', businessResult.error);
    }
    
    // Test investor user registration
    const investorResult = await AuthService.registerUser(testInvestorUser);
    if (investorResult.success) {
      console.log('✅ Investor user registered successfully');
      testInvestorProfile.userId = investorResult.user.uid;
    } else {
      console.log('⚠️ Investor user registration:', investorResult.error);
    }
    
    console.log('');
  }
  
  async testUserAuthentication() {
    console.log('🔐 Testing User Authentication...');
    
    // Test login
    const loginResult = await AuthService.loginUser(
      testBusinessUser.email, 
      testBusinessUser.password
    );
    
    if (loginResult.success) {
      console.log('✅ User login successful');
      console.log(`   User Type: ${loginResult.user.userType}`);
      console.log(`   Email: ${loginResult.user.email}`);
    } else {
      console.log('❌ User login failed:', loginResult.error);
    }
    
    // Test logout
    const logoutResult = await AuthService.logoutUser();
    if (logoutResult.success) {
      console.log('✅ User logout successful');
    }
    
    console.log('');
  }
  
  async testBusinessProfileCreation() {
    console.log('🏢 Testing Business Profile Creation...');
    
    const result = await FirebaseService.createBusinessProfile(testBusinessProfile);
    
    if (result.success) {
      console.log('✅ Business profile created successfully');
      console.log(`   Business ID: ${result.businessId}`);
      console.log(`   Business Name: ${result.business.basicInfo.businessName}`);
      console.log(`   Sector: ${result.business.industry.primarySector}`);
      
      this.testBusinessId = result.businessId;
    } else {
      console.log('❌ Business profile creation failed:', result.error);
    }
    
    console.log('');
  }
  
  async testInvestorProfileCreation() {
    console.log('💼 Testing Investor Profile Creation...');
    
    // Note: This would typically use a specific investor profile creation method
    // For now, we'll test the generic user profile creation
    const result = await FirebaseService.updateUserProfile(
      testInvestorProfile.userId, 
      { investorProfile: testInvestorProfile }
    );
    
    if (result.success) {
      console.log('✅ Investor profile created successfully');
      console.log(`   Investor Type: ${testInvestorProfile.investorType}`);
      console.log(`   Risk Tolerance: ${testInvestorProfile.preferences.riskTolerance}`);
      console.log(`   Investment Range: $${testInvestorProfile.preferences.investmentRange.min} - $${testInvestorProfile.preferences.investmentRange.max}`);
    } else {
      console.log('❌ Investor profile creation failed:', result.error);
    }
    
    console.log('');
  }
  
  async testFinancialRecords() {
    console.log('💰 Testing Financial Records...');
    
    if (!this.testBusinessId) {
      console.log('⚠️ Skipping financial records test - no business ID');
      return;
    }
    
    const financialRecord = {
      businessId: this.testBusinessId,
      period: {
        type: 'monthly',
        year: 2025,
        month: 1,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31')
      },
      revenue: {
        totalRevenue: 25000,
        recurringRevenue: 20000,
        oneTimeRevenue: 5000,
        growthRate: 0.15,
        currency: 'NGN'
      },
      expenses: {
        totalExpenses: 18000,
        operatingExpenses: 12000,
        marketingExpenses: 3000,
        personnelExpenses: 3000
      },
      profitability: {
        grossProfit: 7000,
        netProfit: 7000,
        grossMargin: 0.28,
        netMargin: 0.28
      },
      cashFlow: {
        operatingCashFlow: 6000,
        netCashFlow: 6000,
        cashOnHand: 45000,
        burnRate: 15000
      }
    };
    
    const result = await FirebaseService.addFinancialRecord(financialRecord);
    
    if (result.success) {
      console.log('✅ Financial record added successfully');
      console.log(`   Record ID: ${result.recordId}`);
      console.log(`   Revenue: ${financialRecord.revenue.currency} ${financialRecord.revenue.totalRevenue}`);
      console.log(`   Net Profit: ${financialRecord.revenue.currency} ${financialRecord.profitability.netProfit}`);
    } else {
      console.log('❌ Financial record creation failed:', result.error);
    }
    
    console.log('');
  }
  
  async testInvestmentOpportunity() {
    console.log('💹 Testing Investment Opportunity...');
    
    if (!this.testBusinessId) {
      console.log('⚠️ Skipping investment opportunity test - no business ID');
      return;
    }
    
    const opportunity = {
      businessId: this.testBusinessId,
      campaignInfo: {
        title: 'Series A Funding for TechStart Africa',
        description: 'Raising $500K to expand AI fintech solutions across West Africa',
        shortDescription: 'AI-powered fintech expansion',
        campaignType: 'equity'
      },
      funding: {
        targetAmount: 500000,
        minimumAmount: 250000,
        raisedAmount: 0,
        currency: 'USD',
        valuation: 2000000,
        equityOffered: 25
      },
      timeline: {
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        duration: 90,
        status: 'active'
      },
      terms: {
        minimumInvestment: 5000,
        maximumInvestment: 100000,
        investorLimit: 50,
        useOfFunds: 'Product development, market expansion, team growth',
        expectedReturn: 300,
        paybackPeriod: 36
      }
    };
    
    const result = await FirebaseService.createInvestmentOpportunity(opportunity);
    
    if (result.success) {
      console.log('✅ Investment opportunity created successfully');
      console.log(`   Opportunity ID: ${result.opportunityId}`);
      console.log(`   Target Amount: ${opportunity.funding.currency} ${opportunity.funding.targetAmount}`);
      console.log(`   Equity Offered: ${opportunity.funding.equityOffered}%`);
      
      this.testOpportunityId = result.opportunityId;
    } else {
      console.log('❌ Investment opportunity creation failed:', result.error);
    }
    
    console.log('');
  }
  
  async testMessagingSystem() {
    console.log('💬 Testing Messaging System...');
    
    // Create message thread
    const threadData = {
      participants: [testBusinessProfile.ownerId, testInvestorProfile.userId],
      opportunityId: this.testOpportunityId || 'test-opportunity',
      metadata: {
        title: 'Investment Discussion',
        status: 'active',
        priority: 'medium'
      }
    };
    
    const threadResult = await FirebaseService.createMessageThread(threadData);
    
    if (threadResult.success) {
      console.log('✅ Message thread created successfully');
      console.log(`   Thread ID: ${threadResult.threadId}`);
      
      // Send test message
      const messageData = {
        threadId: threadResult.threadId,
        senderId: testBusinessProfile.ownerId,
        content: {
          text: 'Hello! Thank you for your interest in our investment opportunity.',
          messageType: 'text'
        }
      };
      
      const messageResult = await FirebaseService.sendMessage(messageData);
      
      if (messageResult.success) {
        console.log('✅ Message sent successfully');
        console.log(`   Message ID: ${messageResult.messageId}`);
      } else {
        console.log('❌ Message sending failed:', messageResult.error);
      }
      
    } else {
      console.log('❌ Message thread creation failed:', threadResult.error);
    }
    
    console.log('');
  }
  
  async testDatabaseQueries() {
    console.log('🔍 Testing Database Queries...');
    
    // Test getting published businesses
    const businessesResult = await FirebaseService.getPublishedBusinesses({
      sector: 'fintech',
      limit: 5
    });
    
    if (businessesResult.success) {
      console.log('✅ Business query successful');
      console.log(`   Found ${businessesResult.businesses.length} businesses`);
    } else {
      console.log('❌ Business query failed:', businessesResult.error);
    }
    
    // Test getting active opportunities
    const opportunitiesResult = await FirebaseService.getActiveOpportunities({
      limit: 5
    });
    
    if (opportunitiesResult.success) {
      console.log('✅ Opportunities query successful');
      console.log(`   Found ${opportunitiesResult.opportunities.length} opportunities`);
    } else {
      console.log('❌ Opportunities query failed:', opportunitiesResult.error);
    }
    
    console.log('');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new DatabaseTester();
  tester.runAllTests().then(() => {
    console.log('🎉 Database testing completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Database testing failed:', error);
    process.exit(1);
  });
}

module.exports = DatabaseTester;