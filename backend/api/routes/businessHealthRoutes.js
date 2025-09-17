/**
 * 📊 BVESTER - BUSINESS HEALTH ASSESSMENT API ROUTES
 * API endpoints for business health scoring and assessment
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { dynamoDBService } = require('../../services/aws/DynamoDBService');
const authMiddleware = require('../../middleware/authMiddleware');
const logger = require('../../utils/logger');

/**
 * 📋 GET ASSESSMENT QUESTIONS
 * Get business health assessment questionnaire
 */
router.get('/questions', authMiddleware, async (req, res) => {
  try {
    const { tier = 'free' } = req.query;

    const baseQuestions = [
      {
        id: 'revenue_consistency',
        category: 'financial',
        question: 'How consistent is your monthly revenue?',
        type: 'multiple_choice',
        options: [
          { value: 'very_consistent', label: 'Very consistent (less than 10% variation)', weight: 5 },
          { value: 'mostly_consistent', label: 'Mostly consistent (10-25% variation)', weight: 4 },
          { value: 'somewhat_consistent', label: 'Somewhat consistent (25-50% variation)', weight: 3 },
          { value: 'inconsistent', label: 'Inconsistent (50%+ variation)', weight: 2 },
          { value: 'very_inconsistent', label: 'Very inconsistent or no revenue', weight: 1 }
        ],
        weight: 0.2,
        required: true
      },
      {
        id: 'record_keeping',
        category: 'operations',
        question: 'How do you currently keep your business records?',
        type: 'multiple_choice',
        options: [
          { value: 'digital_software', label: 'Digital accounting software', weight: 5 },
          { value: 'spreadsheet', label: 'Excel/Google Sheets', weight: 4 },
          { value: 'written_book', label: 'Written ledger book', weight: 3 },
          { value: 'memory_notes', label: 'Memory and occasional notes', weight: 2 },
          { value: 'no_records', label: 'No formal record keeping', weight: 1 }
        ],
        weight: 0.15,
        required: true
      },
      {
        id: 'business_age',
        category: 'stability',
        question: 'How long has your business been operating?',
        type: 'multiple_choice',
        options: [
          { value: 'over_5_years', label: 'More than 5 years', weight: 5 },
          { value: '3_to_5_years', label: '3-5 years', weight: 4 },
          { value: '1_to_3_years', label: '1-3 years', weight: 3 },
          { value: '6_months_to_1_year', label: '6 months to 1 year', weight: 2 },
          { value: 'under_6_months', label: 'Less than 6 months', weight: 1 }
        ],
        weight: 0.1,
        required: true
      },
      {
        id: 'customer_base',
        category: 'market',
        question: 'How would you describe your customer base?',
        type: 'multiple_choice',
        options: [
          { value: 'diverse_loyal', label: 'Diverse and loyal customers', weight: 5 },
          { value: 'mostly_repeat', label: 'Mostly repeat customers', weight: 4 },
          { value: 'mix_repeat_new', label: 'Mix of repeat and new customers', weight: 3 },
          { value: 'mostly_new', label: 'Mostly new customers each time', weight: 2 },
          { value: 'struggling_customers', label: 'Struggling to find customers', weight: 1 }
        ],
        weight: 0.15,
        required: true
      },
      {
        id: 'monthly_profit',
        category: 'financial',
        question: 'What is your average monthly profit margin?',
        type: 'multiple_choice',
        options: [
          { value: 'over_30', label: 'More than 30%', weight: 5 },
          { value: '20_to_30', label: '20-30%', weight: 4 },
          { value: '10_to_20', label: '10-20%', weight: 3 },
          { value: '5_to_10', label: '5-10%', weight: 2 },
          { value: 'under_5', label: 'Less than 5% or break even', weight: 1 }
        ],
        weight: 0.2,
        required: true
      },
      {
        id: 'growth_plan',
        category: 'strategy',
        question: 'Do you have a clear growth plan?',
        type: 'multiple_choice',
        options: [
          { value: 'detailed_plan', label: 'Yes, detailed written plan', weight: 5 },
          { value: 'basic_plan', label: 'Yes, basic plan', weight: 4 },
          { value: 'some_ideas', label: 'Some ideas but not formal', weight: 3 },
          { value: 'vague_plans', label: 'Vague plans', weight: 2 },
          { value: 'no_plan', label: 'No clear plan', weight: 1 }
        ],
        weight: 0.1,
        required: true
      },
      {
        id: 'competition',
        category: 'market',
        question: 'How do you handle competition?',
        type: 'multiple_choice',
        options: [
          { value: 'unique_advantage', label: 'I have unique advantages', weight: 5 },
          { value: 'better_service', label: 'I provide better service', weight: 4 },
          { value: 'competitive', label: 'I can compete well', weight: 3 },
          { value: 'struggling', label: 'I struggle against competition', weight: 2 },
          { value: 'losing_customers', label: 'I\'m losing customers to competitors', weight: 1 }
        ],
        weight: 0.1,
        required: true
      }
    ];

    // Premium tier gets additional detailed questions
    const premiumQuestions = tier === 'premium' ? [
      {
        id: 'cash_flow',
        category: 'financial',
        question: 'How is your cash flow management?',
        type: 'multiple_choice',
        options: [
          { value: 'excellent', label: 'Always have enough working capital', weight: 5 },
          { value: 'good', label: 'Usually have enough cash', weight: 4 },
          { value: 'manageable', label: 'Sometimes tight but manageable', weight: 3 },
          { value: 'challenging', label: 'Often struggle with cash flow', weight: 2 },
          { value: 'critical', label: 'Constantly have cash flow problems', weight: 1 }
        ],
        weight: 0.15,
        required: true
      },
      {
        id: 'inventory_management',
        category: 'operations',
        question: 'How well do you manage inventory?',
        type: 'multiple_choice',
        options: [
          { value: 'optimized', label: 'Optimized system with minimal waste', weight: 5 },
          { value: 'tracked', label: 'Well tracked and managed', weight: 4 },
          { value: 'basic_tracking', label: 'Basic tracking in place', weight: 3 },
          { value: 'poor_tracking', label: 'Poor tracking, some waste', weight: 2 },
          { value: 'no_system', label: 'No formal inventory system', weight: 1 }
        ],
        weight: 0.1,
        required: true
      },
      {
        id: 'staff_management',
        category: 'operations',
        question: 'How do you manage staff (if applicable)?',
        type: 'multiple_choice',
        options: [
          { value: 'professional_hr', label: 'Professional HR practices', weight: 5 },
          { value: 'structured', label: 'Structured management approach', weight: 4 },
          { value: 'informal_good', label: 'Informal but good relationships', weight: 3 },
          { value: 'basic', label: 'Basic supervision only', weight: 2 },
          { value: 'no_staff', label: 'No staff/one-person business', weight: 3 }
        ],
        weight: 0.05,
        required: false
      },
      {
        id: 'market_research',
        category: 'strategy',
        question: 'Do you conduct market research?',
        type: 'multiple_choice',
        options: [
          { value: 'regular_formal', label: 'Regular formal market research', weight: 5 },
          { value: 'occasional_formal', label: 'Occasional formal research', weight: 4 },
          { value: 'informal_regular', label: 'Regular informal research', weight: 3 },
          { value: 'rare', label: 'Rarely research the market', weight: 2 },
          { value: 'never', label: 'Never do market research', weight: 1 }
        ],
        weight: 0.05,
        required: false
      },
      {
        id: 'digital_presence',
        category: 'marketing',
        question: 'What is your digital marketing presence?',
        type: 'multiple_choice',
        options: [
          { value: 'comprehensive', label: 'Website, social media, online ads', weight: 5 },
          { value: 'social_website', label: 'Website and social media', weight: 4 },
          { value: 'social_only', label: 'Social media only', weight: 3 },
          { value: 'minimal', label: 'Minimal online presence', weight: 2 },
          { value: 'none', label: 'No digital presence', weight: 1 }
        ],
        weight: 0.1,
        required: false
      }
    ] : [];

    res.json({
      success: true,
      questions: [...baseQuestions, ...premiumQuestions],
      tier: tier,
      totalQuestions: baseQuestions.length + premiumQuestions.length
    });

  } catch (error) {
    logger.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assessment questions'
    });
  }
});

/**
 * 📊 SUBMIT ASSESSMENT
 * Submit business health assessment and calculate score
 */
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { answers, tier = 'free', businessInfo = {} } = req.body;
    const userId = req.user.uid;

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Assessment answers are required'
      });
    }

    // Calculate score
    const scoreResult = calculateBusinessHealthScore(answers, tier);

    // Create assessment record
    const assessment = {
      id: uuidv4(),
      userId: userId,
      tier: tier,
      answers: answers,
      businessInfo: businessInfo,
      score: scoreResult.overallScore,
      categoryScores: scoreResult.categoryScores,
      strengths: scoreResult.strengths,
      improvements: scoreResult.improvements,
      recommendations: scoreResult.recommendations,
      investmentReadiness: scoreResult.investmentReadiness,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    await dynamoDBService.create('bvester-business-health-assessments-prod', assessment);

    // Update user's latest assessment
    const userData = await dynamoDBService.get('bvester-users-prod', userId);
    if (userData) {
      userData.latestAssessment = {
        id: assessment.id,
        score: assessment.score,
        tier: tier,
        completedAt: assessment.completedAt
      };
      userData.updatedAt = new Date().toISOString();

      await dynamoDBService.update('bvester-users-prod', userId, userData);
    }

    res.json({
      success: true,
      assessment: assessment,
      message: 'Assessment completed successfully!'
    });

  } catch (error) {
    logger.error('Submit assessment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit assessment'
    });
  }
});

/**
 * 📋 GET USER ASSESSMENTS
 * Get user's assessment history
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { limit = 10 } = req.query;

    const assessments = await dynamoDBService.queryByUserId('bvester-business-health-assessments-prod', userId, {
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      assessments: assessments.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    });

  } catch (error) {
    logger.error('Get assessments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assessment history'
    });
  }
});

/**
 * 📄 GENERATE REPORT
 * Generate detailed assessment report
 */
router.get('/report/:assessmentId', authMiddleware, async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const userId = req.user.uid;
    const { format = 'json' } = req.query;

    const assessment = await dynamoDBService.get('bvester-business-health-assessments-prod', assessmentId);

    if (!assessment || assessment.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
    }

    const report = generateDetailedReport(assessment);

    if (format === 'pdf') {
      // For PDF generation, you'd integrate with a PDF library
      return res.status(501).json({
        success: false,
        error: 'PDF generation not yet implemented'
      });
    }

    res.json({
      success: true,
      report: report
    });

  } catch (error) {
    logger.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
});

/**
 * Helper function to calculate business health score
 */
function calculateBusinessHealthScore(answers, tier) {
  const categoryWeights = {
    financial: 0.4,
    operations: 0.25,
    market: 0.2,
    strategy: 0.1,
    stability: 0.05
  };

  if (tier === 'premium') {
    categoryWeights.marketing = 0.05;
    categoryWeights.financial = 0.35;
    categoryWeights.operations = 0.25;
  }

  // Question definitions with weights and categories
  const questionConfig = {
    revenue_consistency: { category: 'financial', weight: 0.2 },
    record_keeping: { category: 'operations', weight: 0.15 },
    business_age: { category: 'stability', weight: 0.1 },
    customer_base: { category: 'market', weight: 0.15 },
    monthly_profit: { category: 'financial', weight: 0.2 },
    growth_plan: { category: 'strategy', weight: 0.1 },
    competition: { category: 'market', weight: 0.1 },
    cash_flow: { category: 'financial', weight: 0.15 },
    inventory_management: { category: 'operations', weight: 0.1 },
    staff_management: { category: 'operations', weight: 0.05 },
    market_research: { category: 'strategy', weight: 0.05 },
    digital_presence: { category: 'marketing', weight: 0.1 }
  };

  const categoryScores = {};
  const answeredQuestions = {};

  // Initialize category scores
  Object.keys(categoryWeights).forEach(category => {
    categoryScores[category] = { total: 0, weight: 0, score: 0 };
  });

  // Calculate scores for each answer
  Object.entries(answers).forEach(([questionId, answer]) => {
    const config = questionConfig[questionId];
    if (!config) return;

    const category = config.category;
    const weight = config.weight;
    const score = answer.weight || 0;

    categoryScores[category].total += score * weight;
    categoryScores[category].weight += weight;
    answeredQuestions[questionId] = { score, weight, category };
  });

  // Calculate category averages
  Object.keys(categoryScores).forEach(category => {
    if (categoryScores[category].weight > 0) {
      categoryScores[category].score = (categoryScores[category].total / categoryScores[category].weight) * 20; // Convert to percentage
    }
  });

  // Calculate overall score
  let overallScore = 0;
  let totalWeight = 0;

  Object.entries(categoryScores).forEach(([category, data]) => {
    if (data.weight > 0) {
      overallScore += data.score * categoryWeights[category];
      totalWeight += categoryWeights[category];
    }
  });

  overallScore = totalWeight > 0 ? overallScore / totalWeight : 0;

  // Determine strengths and improvements
  const strengths = [];
  const improvements = [];

  Object.entries(categoryScores).forEach(([category, data]) => {
    if (data.score >= 75) {
      strengths.push(category);
    } else if (data.score < 50) {
      improvements.push(category);
    }
  });

  // Generate recommendations
  const recommendations = generateRecommendations(categoryScores, tier);

  // Determine investment readiness
  const investmentReadiness = determineInvestmentReadiness(overallScore, categoryScores);

  return {
    overallScore: Math.round(overallScore),
    categoryScores,
    strengths,
    improvements,
    recommendations,
    investmentReadiness,
    tier
  };
}

/**
 * Generate recommendations based on scores
 */
function generateRecommendations(categoryScores, tier) {
  const recommendations = [];

  Object.entries(categoryScores).forEach(([category, data]) => {
    if (data.score < 60) {
      switch (category) {
        case 'financial':
          recommendations.push({
            category: 'financial',
            priority: 'high',
            title: 'Improve Financial Management',
            description: 'Focus on consistent revenue tracking and profit margin optimization.',
            actions: [
              'Set up proper bookkeeping system',
              'Track daily income and expenses',
              'Calculate monthly profit margins',
              'Create cash flow projections'
            ]
          });
          break;
        case 'operations':
          recommendations.push({
            category: 'operations',
            priority: 'medium',
            title: 'Strengthen Operations',
            description: 'Improve record keeping and inventory management.',
            actions: [
              'Implement digital record keeping',
              'Set up inventory tracking system',
              'Document business processes',
              'Train staff on procedures'
            ]
          });
          break;
        case 'market':
          recommendations.push({
            category: 'market',
            priority: 'medium',
            title: 'Enhance Market Position',
            description: 'Build stronger customer relationships and competitive advantage.',
            actions: [
              'Conduct customer satisfaction surveys',
              'Identify unique selling propositions',
              'Analyze competitor offerings',
              'Develop customer loyalty programs'
            ]
          });
          break;
        case 'strategy':
          recommendations.push({
            category: 'strategy',
            priority: 'low',
            title: 'Develop Strategic Planning',
            description: 'Create clear business goals and growth strategies.',
            actions: [
              'Write a business plan',
              'Set quarterly goals',
              'Research market opportunities',
              'Plan for business expansion'
            ]
          });
          break;
      }
    }
  });

  return recommendations;
}

/**
 * Determine investment readiness
 */
function determineInvestmentReadiness(overallScore, categoryScores) {
  let readinessLevel = 'Not Ready';
  let description = '';
  let requiredActions = [];

  if (overallScore >= 80) {
    readinessLevel = 'Investment Ready';
    description = 'Your business shows strong fundamentals and is ready for investment opportunities.';
  } else if (overallScore >= 65) {
    readinessLevel = 'Nearly Ready';
    description = 'Your business is on the right track but needs some improvements before seeking investment.';
    requiredActions = ['Improve financial record keeping', 'Strengthen cash flow management'];
  } else if (overallScore >= 50) {
    readinessLevel = 'Needs Development';
    description = 'Your business has potential but requires significant improvements before being investment-ready.';
    requiredActions = ['Establish consistent revenue', 'Implement proper record keeping', 'Develop business plan'];
  } else {
    readinessLevel = 'Not Ready';
    description = 'Your business needs substantial development before considering investment opportunities.';
    requiredActions = ['Focus on basic business fundamentals', 'Establish regular income', 'Create proper business records'];
  }

  return {
    level: readinessLevel,
    description,
    requiredActions,
    estimatedTimeToReady: overallScore >= 65 ? '1-3 months' : overallScore >= 50 ? '3-6 months' : '6+ months'
  };
}

/**
 * Generate detailed report
 */
function generateDetailedReport(assessment) {
  return {
    summary: {
      overallScore: assessment.score,
      tier: assessment.tier,
      completedAt: assessment.completedAt,
      investmentReadiness: assessment.investmentReadiness
    },
    categoryBreakdown: assessment.categoryScores,
    strengths: assessment.strengths,
    areasForImprovement: assessment.improvements,
    recommendations: assessment.recommendations,
    nextSteps: assessment.investmentReadiness.requiredActions,
    benchmarking: {
      industryAverage: 62,
      topPerformers: 85,
      yourRanking: assessment.score >= 80 ? 'Top 20%' : assessment.score >= 65 ? 'Top 40%' : assessment.score >= 50 ? 'Average' : 'Below Average'
    }
  };
}

module.exports = router;