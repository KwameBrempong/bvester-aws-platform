/**
 * Seed Data Script for Bvester Platform
 * Populates DynamoDB with sample SMEs, investors, and investments
 */

require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'eu-west-2',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Sample data
const sampleSMEs = [
  {
    name: "AgroTech Solutions Ghana",
    industry: "Agriculture",
    country: "Ghana",
    description: "Leading provider of smart farming solutions using IoT sensors and AI to optimize crop yields for smallholder farmers.",
    monthlyRevenue: 85000,
    employeeCount: 24,
    foundedYear: 2019,
    readinessScore: 82,
    fundingNeeded: 500000,
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400"
  },
  {
    name: "MediCare Plus Nigeria",
    industry: "Healthcare",
    country: "Nigeria",
    description: "Telemedicine platform connecting rural patients with urban specialists, serving over 10,000 patients monthly.",
    monthlyRevenue: 120000,
    employeeCount: 45,
    foundedYear: 2018,
    readinessScore: 88,
    fundingNeeded: 1000000,
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400"
  },
  {
    name: "EduTech Kenya",
    industry: "Education",
    country: "Kenya",
    description: "E-learning platform providing affordable, quality education to over 50,000 students across East Africa.",
    monthlyRevenue: 95000,
    employeeCount: 32,
    foundedYear: 2020,
    readinessScore: 75,
    fundingNeeded: 750000,
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400"
  },
  {
    name: "Solar Power SA",
    industry: "Renewable Energy",
    country: "South Africa",
    description: "Residential solar installation company with proprietary battery storage technology, installed in 2000+ homes.",
    monthlyRevenue: 250000,
    employeeCount: 67,
    foundedYear: 2017,
    readinessScore: 92,
    fundingNeeded: 2000000,
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400"
  },
  {
    name: "FinTech Uganda",
    industry: "Financial Services",
    country: "Uganda",
    description: "Mobile money and micro-lending platform serving the unbanked population, 100,000+ active users.",
    monthlyRevenue: 180000,
    employeeCount: 38,
    foundedYear: 2019,
    readinessScore: 85,
    fundingNeeded: 1500000,
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400"
  },
  {
    name: "FoodTech Tanzania",
    industry: "Food & Beverage",
    country: "Tanzania",
    description: "Farm-to-table supply chain platform reducing food waste by 40% and increasing farmer incomes by 60%.",
    monthlyRevenue: 72000,
    employeeCount: 28,
    foundedYear: 2020,
    readinessScore: 70,
    fundingNeeded: 600000,
    image: "https://images.unsplash.com/photo-1543168256-418811576931?w=400"
  },
  {
    name: "LogiTech Rwanda",
    industry: "Logistics",
    country: "Rwanda",
    description: "Last-mile delivery service using electric bikes and drones, completing 5000+ deliveries daily.",
    monthlyRevenue: 110000,
    employeeCount: 52,
    foundedYear: 2018,
    readinessScore: 78,
    fundingNeeded: 800000,
    image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400"
  },
  {
    name: "CleanTech Ghana",
    industry: "Waste Management",
    country: "Ghana",
    description: "Plastic recycling company converting waste to building materials, processing 50 tons monthly.",
    monthlyRevenue: 65000,
    employeeCount: 35,
    foundedYear: 2019,
    readinessScore: 73,
    fundingNeeded: 450000,
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400"
  },
  {
    name: "TourTech Nigeria",
    industry: "Tourism",
    country: "Nigeria",
    description: "Digital tourism platform showcasing African heritage sites with VR experiences, 20,000+ bookings.",
    monthlyRevenue: 88000,
    employeeCount: 22,
    foundedYear: 2021,
    readinessScore: 68,
    fundingNeeded: 550000,
    image: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=400"
  },
  {
    name: "FashionTech Kenya",
    industry: "Fashion",
    country: "Kenya",
    description: "Sustainable fashion brand using traditional African designs with modern eco-friendly materials.",
    monthlyRevenue: 92000,
    employeeCount: 41,
    foundedYear: 2019,
    readinessScore: 77,
    fundingNeeded: 700000,
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400"
  }
];

const sampleInvestors = [
  {
    name: "John Smith",
    email: "john.smith@example.com",
    country: "USA",
    investmentCapacity: 100000,
    interests: ["Technology", "Healthcare", "Education"]
  },
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    country: "UK",
    investmentCapacity: 250000,
    interests: ["Renewable Energy", "Agriculture", "FinTech"]
  },
  {
    name: "Kwame Asante",
    email: "kwame.asante@example.com",
    country: "Ghana",
    investmentCapacity: 50000,
    interests: ["Agriculture", "Education", "Logistics"]
  },
  {
    name: "Amina Okonkwo",
    email: "amina.okonkwo@example.com",
    country: "Nigeria",
    investmentCapacity: 150000,
    interests: ["Healthcare", "Fashion", "Tourism"]
  },
  {
    name: "David Chen",
    email: "david.chen@example.com",
    country: "Canada",
    investmentCapacity: 200000,
    interests: ["Technology", "Renewable Energy", "Waste Management"]
  }
];

async function seedUsers() {
  console.log('🌱 Seeding users...');
  const hashedPassword = await bcrypt.hash('Demo123!', 10);
  
  // Create SME owners
  for (const sme of sampleSMEs) {
    const email = sme.name.toLowerCase().replace(/\s+/g, '.') + '@demo.com';
    const user = {
      userId: uuidv4(),
      email,
      password: hashedPassword,
      fullName: sme.name + ' Owner',
      role: 'sme',
      country: sme.country,
      phoneNumber: '+233' + Math.floor(Math.random() * 900000000 + 100000000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: true,
      kycStatus: 'verified',
      investmentReadinessScore: sme.readinessScore,
      totalInvestments: 0,
      totalFunding: 0,
      profileComplete: true
    };
    
    try {
      await docClient.send(new PutCommand({
        TableName: process.env.DYNAMODB_USERS_TABLE || 'bvester-users',
        Item: user
      }));
      console.log(`✅ Created SME user: ${email}`);
    } catch (error) {
      console.error(`❌ Failed to create user ${email}:`, error.message);
    }
  }
  
  // Create investors
  for (const investor of sampleInvestors) {
    const user = {
      userId: uuidv4(),
      email: investor.email,
      password: hashedPassword,
      fullName: investor.name,
      role: 'investor',
      country: investor.country,
      phoneNumber: '+1' + Math.floor(Math.random() * 9000000000 + 1000000000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: true,
      kycStatus: 'verified',
      investmentCapacity: investor.investmentCapacity,
      interests: investor.interests,
      totalInvestments: 0,
      totalInvested: 0,
      profileComplete: true
    };
    
    try {
      await docClient.send(new PutCommand({
        TableName: process.env.DYNAMODB_USERS_TABLE || 'bvester-users',
        Item: user
      }));
      console.log(`✅ Created investor: ${investor.email}`);
    } catch (error) {
      console.error(`❌ Failed to create investor ${investor.email}:`, error.message);
    }
  }
}

async function seedBusinesses() {
  console.log('🏢 Seeding businesses...');
  
  for (const sme of sampleSMEs) {
    const businessId = uuidv4();
    const ownerEmail = sme.name.toLowerCase().replace(/\s+/g, '.') + '@demo.com';
    
    const business = {
      businessId,
      ownerId: uuidv4(),
      ownerEmail,
      businessName: sme.name,
      industry: sme.industry,
      country: sme.country,
      city: sme.country === 'Ghana' ? 'Accra' : 
            sme.country === 'Nigeria' ? 'Lagos' :
            sme.country === 'Kenya' ? 'Nairobi' :
            sme.country === 'South Africa' ? 'Cape Town' :
            sme.country === 'Uganda' ? 'Kampala' :
            sme.country === 'Tanzania' ? 'Dar es Salaam' :
            sme.country === 'Rwanda' ? 'Kigali' : 'Unknown',
      description: sme.description,
      foundedYear: sme.foundedYear,
      employeeCount: sme.employeeCount,
      monthlyRevenue: sme.monthlyRevenue,
      yearlyRevenue: sme.monthlyRevenue * 12,
      website: `https://www.${sme.name.toLowerCase().replace(/\s+/g, '')}.com`,
      imageUrl: sme.image,
      investmentReadinessScore: sme.readinessScore,
      fundingNeeded: sme.fundingNeeded,
      fundingReceived: Math.floor(sme.fundingNeeded * 0.3),
      businessModel: 'B2B/B2C',
      competitiveAdvantage: 'First mover advantage with proprietary technology',
      marketSize: Math.floor(Math.random() * 900000000 + 100000000),
      growthRate: Math.floor(Math.random() * 40 + 20),
      hasFinancialRecords: true,
      hasBusinessPlan: true,
      hasTaxCompliance: true,
      hasInsurance: sme.readinessScore > 75,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      verified: true,
      totalFundingReceived: Math.floor(sme.fundingNeeded * 0.3),
      activeInvestors: Math.floor(Math.random() * 20 + 5)
    };
    
    try {
      await docClient.send(new PutCommand({
        TableName: process.env.DYNAMODB_BUSINESSES_TABLE || 'bvester-businesses',
        Item: business
      }));
      console.log(`✅ Created business: ${sme.name}`);
    } catch (error) {
      console.error(`❌ Failed to create business ${sme.name}:`, error.message);
    }
  }
}

async function seedInvestments() {
  console.log('💰 Seeding investment opportunities...');
  
  for (const sme of sampleSMEs) {
    const investmentId = uuidv4();
    const businessId = uuidv4();
    
    const investmentTypes = ['equity', 'loan', 'revenue-share'];
    const selectedType = investmentTypes[Math.floor(Math.random() * investmentTypes.length)];
    
    const investment = {
      investmentId,
      businessId,
      businessName: sme.name,
      creatorId: uuidv4(),
      creatorEmail: sme.name.toLowerCase().replace(/\s+/g, '.') + '@demo.com',
      amount: sme.fundingNeeded,
      minimumInvestment: Math.floor(sme.fundingNeeded / 100),
      type: selectedType,
      terms: selectedType === 'equity' ? `${Math.floor(Math.random() * 20 + 10)}% equity stake` :
             selectedType === 'loan' ? `${Math.floor(Math.random() * 8 + 12)}% annual interest, 3-year term` :
             `${Math.floor(Math.random() * 10 + 5)}% revenue share for 5 years`,
      description: `Investment opportunity in ${sme.name} - ${sme.description}`,
      expectedReturn: selectedType === 'equity' ? `${Math.floor(Math.random() * 200 + 100)}% over 5 years` :
                     selectedType === 'loan' ? `${Math.floor(Math.random() * 8 + 12)}% annually` :
                     `${Math.floor(Math.random() * 100 + 50)}% total return`,
      riskLevel: sme.readinessScore > 80 ? 'Low' : sme.readinessScore > 70 ? 'Medium' : 'High',
      industry: sme.industry,
      country: sme.country,
      status: 'open',
      currentRaised: Math.floor(sme.fundingNeeded * 0.3),
      percentageRaised: 30,
      investorCount: Math.floor(Math.random() * 20 + 5),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      highlights: [
        `${sme.employeeCount}+ employees`,
        `$${(sme.monthlyRevenue * 12 / 1000).toFixed(0)}k annual revenue`,
        `Founded in ${sme.foundedYear}`,
        `${sme.readinessScore}/100 readiness score`
      ]
    };
    
    try {
      await docClient.send(new PutCommand({
        TableName: process.env.DYNAMODB_INVESTMENTS_TABLE || 'bvester-investments',
        Item: investment
      }));
      console.log(`✅ Created investment opportunity for: ${sme.name}`);
    } catch (error) {
      console.error(`❌ Failed to create investment for ${sme.name}:`, error.message);
    }
  }
}

async function seedTransactions() {
  console.log('💳 Seeding sample transactions...');
  
  const sampleTransactions = [];
  
  // Create some sample transactions for each investor
  for (const investor of sampleInvestors) {
    for (let i = 0; i < 2; i++) {
      const randomSME = sampleSMEs[Math.floor(Math.random() * sampleSMEs.length)];
      const amount = Math.floor(Math.random() * 20000 + 5000);
      
      const transaction = {
        transactionId: uuidv4(),
        investmentId: uuidv4(),
        businessName: randomSME.name,
        investorId: uuidv4(),
        investorEmail: investor.email,
        investorName: investor.name,
        amount,
        paymentMethod: Math.random() > 0.5 ? 'stripe' : 'flutterwave',
        status: 'completed',
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000)).toISOString(),
        completedAt: new Date(Date.now() - Math.floor(Math.random() * 89 * 24 * 60 * 60 * 1000)).toISOString()
      };
      
      try {
        await docClient.send(new PutCommand({
          TableName: process.env.DYNAMODB_TRANSACTIONS_TABLE || 'bvester-transactions',
          Item: transaction
        }));
        console.log(`✅ Created transaction: ${investor.name} → ${randomSME.name} ($${amount})`);
      } catch (error) {
        console.error(`❌ Failed to create transaction:`, error.message);
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting Bvester data seeding...\n');
  console.log(`📍 Region: ${process.env.AWS_REGION || 'eu-west-2'}`);
  console.log(`📊 DynamoDB Tables:`);
  console.log(`   - Users: ${process.env.DYNAMODB_USERS_TABLE || 'bvester-users'}`);
  console.log(`   - Businesses: ${process.env.DYNAMODB_BUSINESSES_TABLE || 'bvester-businesses'}`);
  console.log(`   - Investments: ${process.env.DYNAMODB_INVESTMENTS_TABLE || 'bvester-investments'}`);
  console.log(`   - Transactions: ${process.env.DYNAMODB_TRANSACTIONS_TABLE || 'bvester-transactions'}\n`);
  
  try {
    await seedUsers();
    console.log('\n');
    
    await seedBusinesses();
    console.log('\n');
    
    await seedInvestments();
    console.log('\n');
    
    await seedTransactions();
    console.log('\n');
    
    console.log('✨ Data seeding completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   SME Owners: [business-name]@demo.com / Demo123!');
    console.log('   Investors: Use emails from script / Demo123!');
    console.log('\nExample SME login: agrotech.solutions.ghana@demo.com / Demo123!');
    console.log('Example Investor login: john.smith@example.com / Demo123!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding script
if (require.main === module) {
  main();
}

module.exports = { seedUsers, seedBusinesses, seedInvestments, seedTransactions };