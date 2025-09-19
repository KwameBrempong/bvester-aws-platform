/**
 * 🏥 BUSINESS HEALTH SERVICE
 * AI-powered business health assessment and scoring
 * Tailored for African SMEs
 */

import { dynamoDBService } from './aws/DynamoDBService';
import { BackendAPIService } from './BackendAPIService';
import { API_ENDPOINTS } from '../config/api';

class BusinessHealthService {
  constructor() {
    this.api = new BackendAPIService();

    // Question sets for free and premium users (fallback)
    this.questionSets = {
      free: [
        {
          id: 'revenue_consistency',
          title: 'How consistent is your monthly revenue?',
          subtitle: 'This helps us understand your business stability',
          category: 'financial',
          options: [
            { value: 4, label: 'Very consistent', description: 'Revenue varies by less than 20%' },
            { value: 3, label: 'Mostly consistent', description: 'Revenue varies by 20-40%' },
            { value: 2, label: 'Somewhat inconsistent', description: 'Revenue varies by 40-60%' },
            { value: 1, label: 'Very inconsistent', description: 'Revenue varies by more than 60%' }
          ]
        },
        {
          id: 'record_keeping',
          title: 'How do you track your business finances?',
          subtitle: 'Good record keeping is essential for business health',
          category: 'operations',
          options: [
            { value: 4, label: 'Digital system with regular updates', description: 'Daily transaction recording' },
            { value: 3, label: 'Regular manual records', description: 'Weekly record updates' },
            { value: 2, label: 'Basic record keeping', description: 'Monthly record keeping' },
            { value: 1, label: 'No formal records', description: 'Keep records in my head' }
          ]
        },
        {
          id: 'cash_flow',
          title: 'How often do you run out of cash for operations?',
          subtitle: 'Cash flow management is critical for business success',
          category: 'financial',
          options: [
            { value: 4, label: 'Never', description: 'Always have sufficient cash' },
            { value: 3, label: 'Rarely', description: 'Once or twice a year' },
            { value: 2, label: 'Sometimes', description: 'Several times a year' },
            { value: 1, label: 'Often', description: 'Monthly cash flow problems' }
          ]
        },
        {
          id: 'customer_base',
          title: 'How many regular customers do you have?',
          subtitle: 'A diversified customer base reduces business risk',
          category: 'market',
          options: [
            { value: 4, label: '50+ regular customers', description: 'Strong customer base' },
            { value: 3, label: '20-50 regular customers', description: 'Good customer base' },
            { value: 2, label: '10-20 regular customers', description: 'Growing customer base' },
            { value: 1, label: 'Less than 10 customers', description: 'Need to expand customer base' }
          ]
        },
        {
          id: 'business_plan',
          title: 'Do you have a written business plan?',
          subtitle: 'Planning is essential for business growth and investment',
          category: 'strategy',
          options: [
            { value: 4, label: 'Detailed written plan', description: 'Updated regularly' },
            { value: 3, label: 'Basic written plan', description: 'Some documentation' },
            { value: 2, label: 'Informal plan', description: 'Plan exists but not written' },
            { value: 1, label: 'No formal plan', description: 'Operating day by day' }
          ]
        }
      ],
      premium: [
        // All free questions plus additional detailed ones
        {
          id: 'revenue_consistency',
          title: 'How consistent is your monthly revenue?',
          subtitle: 'This helps us understand your business stability',
          category: 'financial',
          options: [
            { value: 4, label: 'Very consistent', description: 'Revenue varies by less than 20%' },
            { value: 3, label: 'Mostly consistent', description: 'Revenue varies by 20-40%' },
            { value: 2, label: 'Somewhat inconsistent', description: 'Revenue varies by 40-60%' },
            { value: 1, label: 'Very inconsistent', description: 'Revenue varies by more than 60%' }
          ]
        },
        {
          id: 'profit_margins',
          title: 'What are your typical profit margins?',
          subtitle: 'Understanding profitability is key to business sustainability',
          category: 'financial',
          options: [
            { value: 4, label: '30%+ profit margin', description: 'Excellent profitability' },
            { value: 3, label: '20-30% profit margin', description: 'Good profitability' },
            { value: 2, label: '10-20% profit margin', description: 'Moderate profitability' },
            { value: 1, label: 'Less than 10% margin', description: 'Low profitability' }
          ]
        },
        {
          id: 'expense_control',
          title: 'How well do you control your business expenses?',
          subtitle: 'Expense management directly impacts profitability',
          category: 'financial',
          options: [
            { value: 4, label: 'Strict expense control', description: 'Track and optimize all expenses' },
            { value: 3, label: 'Good expense management', description: 'Monitor major expenses' },
            { value: 2, label: 'Basic expense tracking', description: 'Some expense awareness' },
            { value: 1, label: 'Poor expense control', description: 'Limited expense tracking' }
          ]
        },
        {
          id: 'record_keeping',
          title: 'How do you track your business finances?',
          subtitle: 'Good record keeping is essential for business health',
          category: 'operations',
          options: [
            { value: 4, label: 'Digital system with regular updates', description: 'Daily transaction recording' },
            { value: 3, label: 'Regular manual records', description: 'Weekly record updates' },
            { value: 2, label: 'Basic record keeping', description: 'Monthly record keeping' },
            { value: 1, label: 'No formal records', description: 'Keep records in my head' }
          ]
        },
        {
          id: 'inventory_management',
          title: 'How do you manage your inventory/stock?',
          subtitle: 'Efficient inventory management improves cash flow',
          category: 'operations',
          options: [
            { value: 4, label: 'Systematic inventory tracking', description: 'Digital inventory system' },
            { value: 3, label: 'Regular inventory checks', description: 'Manual but regular tracking' },
            { value: 2, label: 'Basic inventory awareness', description: 'Occasional stock counts' },
            { value: 1, label: 'No formal inventory system', description: 'Ad-hoc inventory management' }
          ]
        },
        {
          id: 'staff_management',
          title: 'How do you manage your staff (if any)?',
          subtitle: 'Good staff management improves business efficiency',
          category: 'operations',
          options: [
            { value: 4, label: 'Formal HR processes', description: 'Written policies and procedures' },
            { value: 3, label: 'Structured management', description: 'Clear roles and expectations' },
            { value: 2, label: 'Basic staff coordination', description: 'Informal management style' },
            { value: 1, label: 'No formal staff management', description: 'Family/friends help informally' }
          ]
        },
        {
          id: 'cash_flow',
          title: 'How often do you run out of cash for operations?',
          subtitle: 'Cash flow management is critical for business success',
          category: 'financial',
          options: [
            { value: 4, label: 'Never', description: 'Always have sufficient cash' },
            { value: 3, label: 'Rarely', description: 'Once or twice a year' },
            { value: 2, label: 'Sometimes', description: 'Several times a year' },
            { value: 1, label: 'Often', description: 'Monthly cash flow problems' }
          ]
        },
        {
          id: 'customer_base',
          title: 'How many regular customers do you have?',
          subtitle: 'A diversified customer base reduces business risk',
          category: 'market',
          options: [
            { value: 4, label: '50+ regular customers', description: 'Strong customer base' },
            { value: 3, label: '20-50 regular customers', description: 'Good customer base' },
            { value: 2, label: '10-20 regular customers', description: 'Growing customer base' },
            { value: 1, label: 'Less than 10 customers', description: 'Need to expand customer base' }
          ]
        },
        {
          id: 'market_competition',
          title: 'How competitive is your market?',
          subtitle: 'Market dynamics affect business sustainability',
          category: 'market',
          options: [
            { value: 1, label: 'Highly competitive', description: 'Many similar businesses' },
            { value: 2, label: 'Moderately competitive', description: 'Some competition exists' },
            { value: 3, label: 'Limited competition', description: 'Few similar businesses' },
            { value: 4, label: 'Unique offering', description: 'Little to no direct competition' }
          ]
        },
        {
          id: 'customer_satisfaction',
          title: 'How do you measure customer satisfaction?',
          subtitle: 'Happy customers drive repeat business and referrals',
          category: 'market',
          options: [
            { value: 4, label: 'Formal feedback system', description: 'Regular customer surveys' },
            { value: 3, label: 'Regular customer check-ins', description: 'Ask for feedback informally' },
            { value: 2, label: 'Observe customer behavior', description: 'Watch for repeat customers' },
            { value: 1, label: 'No formal measurement', description: 'Assume customers are satisfied' }
          ]
        },
        {
          id: 'business_plan',
          title: 'Do you have a written business plan?',
          subtitle: 'Planning is essential for business growth and investment',
          category: 'strategy',
          options: [
            { value: 4, label: 'Detailed written plan', description: 'Updated regularly' },
            { value: 3, label: 'Basic written plan', description: 'Some documentation' },
            { value: 2, label: 'Informal plan', description: 'Plan exists but not written' },
            { value: 1, label: 'No formal plan', description: 'Operating day by day' }
          ]
        },
        {
          id: 'growth_strategy',
          title: 'How do you plan for business growth?',
          subtitle: 'Strategic planning drives sustainable business growth',
          category: 'strategy',
          options: [
            { value: 4, label: 'Systematic growth planning', description: 'Clear growth strategy and milestones' },
            { value: 3, label: 'Regular growth reviews', description: 'Periodic planning sessions' },
            { value: 2, label: 'Informal growth planning', description: 'Think about growth occasionally' },
            { value: 1, label: 'No growth planning', description: 'Focus on day-to-day operations' }
          ]
        },
        {
          id: 'innovation',
          title: 'How often do you introduce new products/services?',
          subtitle: 'Innovation helps businesses stay competitive',
          category: 'strategy',
          options: [
            { value: 4, label: 'Regular innovation', description: 'New offerings quarterly' },
            { value: 3, label: 'Periodic innovation', description: 'New offerings annually' },
            { value: 2, label: 'Occasional innovation', description: 'New offerings every few years' },
            { value: 1, label: 'Rarely innovate', description: 'Stick to current offerings' }
          ]
        },
        {
          id: 'technology_adoption',
          title: 'How do you use technology in your business?',
          subtitle: 'Technology adoption improves efficiency and competitiveness',
          category: 'technology',
          options: [
            { value: 4, label: 'Advanced technology use', description: 'Digital tools for most operations' },
            { value: 3, label: 'Moderate technology use', description: 'Some digital tools' },
            { value: 2, label: 'Basic technology use', description: 'Phone and basic apps' },
            { value: 1, label: 'Limited technology use', description: 'Mostly manual operations' }
          ]
        },
        {
          id: 'online_presence',
          title: 'What is your online/digital presence?',
          subtitle: 'Digital presence is crucial for modern business growth',
          category: 'technology',
          options: [
            { value: 4, label: 'Strong online presence', description: 'Website, social media, online sales' },
            { value: 3, label: 'Good online presence', description: 'Active social media and website' },
            { value: 2, label: 'Basic online presence', description: 'Social media or WhatsApp business' },
            { value: 1, label: 'No online presence', description: 'Rely on face-to-face interactions' }
          ]
        }
      ]
    };

    // Scoring weights for different categories
    this.categoryWeights = {
      financial: 0.35,    // 35% - Most important for investment readiness
      operations: 0.25,   // 25% - Operational efficiency matters
      market: 0.20,       // 20% - Market position and customers
      strategy: 0.15,     // 15% - Strategic planning
      technology: 0.05    // 5% - Technology adoption (bonus points)
    };
  }

  /**
   * Get assessment questions based on user tier
   */
  async getAssessmentQuestions(isPremium = false) {
    try {
      const tier = isPremium ? 'premium' : 'free';
      const response = await this.api.makeRequest(`${API_ENDPOINTS.BUSINESS_HEALTH.QUESTIONS}?tier=${tier}`, {
        method: 'GET'
      });

      if (response.success && response.questions) {
        return response.questions;
      }

      // Fallback to local questions if API fails
      return isPremium ? this.questionSets.premium : this.questionSets.free;
    } catch (error) {
      console.error('Error fetching questions from API, using fallback:', error);
      return isPremium ? this.questionSets.premium : this.questionSets.free;
    }
  }

  /**
   * Calculate comprehensive business health score
   */
  async calculateBusinessHealth({ userId, answers, businessInfo, isPremium = false }) {
    try {
      console.log('Calculating business health for:', userId);

      // Try to submit to backend API first
      try {
        const tier = isPremium ? 'premium' : 'free';
        const response = await this.api.makeRequest(API_ENDPOINTS.BUSINESS_HEALTH.SUBMIT, {
          method: 'POST',
          body: JSON.stringify({
            answers,
            tier,
            businessInfo
          })
        });

        if (response.success && response.assessment) {
          // Save to local storage as well
          await this.saveAssessmentResult(userId, response.assessment);
          return response.assessment;
        }
      } catch (apiError) {
        console.error('API submission failed, calculating locally:', apiError);
      }

      // Fallback to local calculation
      // Get questions to understand scoring context
      const questions = await this.getAssessmentQuestions(isPremium);

      // Calculate category scores
      const categoryScores = this.calculateCategoryScores(answers, questions);

      // Calculate overall weighted score
      const overallScore = this.calculateOverallScore(categoryScores);

      // Determine score level and recommendations
      const scoreLevel = this.getScoreLevel(overallScore);
      const recommendations = this.generateRecommendations(categoryScores, overallScore, isPremium);

      // Calculate investment readiness
      const investmentReadiness = this.calculateInvestmentReadiness(categoryScores, overallScore);

      const result = {
        userId,
        overallScore: Math.round(overallScore),
        scoreLevel,
        categories: this.formatCategoryResults(categoryScores),
        recommendations,
        investmentReadiness,
        businessInfo,
        isPremium,
        completedAt: new Date(),
        validUntil: new Date(Date.now() + (isPremium ? 30 : 90) * 24 * 60 * 60 * 1000), // 30 days premium, 90 days free
      };

      console.log('Business health calculated:', result);
      return result;

    } catch (error) {
      console.error('Error calculating business health:', error);
      throw error;
    }
  }

  /**
   * Calculate scores for each category
   */
  calculateCategoryScores(answers, questions) {
    const categoryScores = {};

    // Group questions by category
    const questionsByCategory = {};
    questions.forEach(q => {
      if (!questionsByCategory[q.category]) {
        questionsByCategory[q.category] = [];
      }
      questionsByCategory[q.category].push(q);
    });

    // Calculate average score for each category
    Object.keys(questionsByCategory).forEach(category => {
      const categoryQuestions = questionsByCategory[category];
      let totalScore = 0;
      let answeredQuestions = 0;

      categoryQuestions.forEach(question => {
        if (answers[question.id] !== undefined) {
          totalScore += answers[question.id];
          answeredQuestions++;
        }
      });

      // Convert to 0-100 scale (assuming max answer value is 4)
      const averageScore = answeredQuestions > 0 ? (totalScore / answeredQuestions) : 0;
      categoryScores[category] = (averageScore / 4) * 100;
    });

    return categoryScores;
  }

  /**
   * Calculate overall weighted score
   */
  calculateOverallScore(categoryScores) {
    let weightedSum = 0;
    let totalWeight = 0;

    Object.keys(categoryScores).forEach(category => {
      const weight = this.categoryWeights[category] || 0;
      weightedSum += categoryScores[category] * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Determine score level description
   */
  getScoreLevel(score) {
    if (score >= 80) return 'Excellent - Investment Ready';
    if (score >= 60) return 'Good - Nearly Investment Ready';
    if (score >= 40) return 'Fair - Needs Improvement';
    if (score >= 20) return 'Poor - Significant Work Needed';
    return 'Critical - Major Changes Required';
  }

  /**
   * Format category results for display
   */
  formatCategoryResults(categoryScores) {
    const categoryNames = {
      financial: 'Financial Management',
      operations: 'Operations & Efficiency',
      market: 'Market & Customers',
      strategy: 'Strategy & Planning',
      technology: 'Technology & Innovation'
    };

    return Object.keys(categoryScores).map(category => ({
      id: category,
      name: categoryNames[category] || category,
      score: Math.round(categoryScores[category]),
      weight: this.categoryWeights[category] || 0
    }));
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(categoryScores, overallScore, isPremium) {
    const recommendations = [];

    // Financial recommendations
    if (categoryScores.financial < 60) {
      recommendations.push({
        category: 'financial',
        priority: 'high',
        icon: 'cash-outline',
        title: 'Improve Financial Management',
        description: 'Start using Bvester\'s chat-based transaction recording to track your daily income and expenses. This will help you understand your cash flow patterns.',
        action: isPremium ? 'Set up automated financial tracking' : null
      });
    }

    // Operations recommendations
    if (categoryScores.operations < 60) {
      recommendations.push({
        category: 'operations',
        priority: categoryScores.operations < 40 ? 'high' : 'medium',
        icon: 'settings-outline',
        title: 'Streamline Operations',
        description: 'Implement basic inventory management and standardize your business processes to improve efficiency.',
        action: isPremium ? 'Access operational efficiency tools' : null
      });
    }

    // Market recommendations
    if (categoryScores.market < 60) {
      recommendations.push({
        category: 'market',
        priority: 'medium',
        icon: 'people-outline',
        title: 'Expand Customer Base',
        description: 'Focus on customer acquisition and retention strategies. Consider digital marketing to reach more customers.',
        action: isPremium ? 'Get personalized marketing plan' : null
      });
    }

    // Strategy recommendations
    if (categoryScores.strategy < 60) {
      recommendations.push({
        category: 'strategy',
        priority: overallScore < 50 ? 'high' : 'medium',
        icon: 'trending-up-outline',
        title: 'Develop Business Strategy',
        description: 'Create a written business plan with clear goals and milestones. This is essential for attracting investors.',
        action: isPremium ? 'Access business plan template' : null
      });
    }

    // Technology recommendations
    if (categoryScores.technology < 50) {
      recommendations.push({
        category: 'technology',
        priority: 'low',
        icon: 'phone-portrait-outline',
        title: 'Embrace Digital Tools',
        description: 'Adopt digital tools for business management, customer communication, and online presence.',
        action: isPremium ? 'Get technology adoption roadmap' : null
      });
    }

    // General recommendations based on overall score
    if (overallScore >= 70) {
      recommendations.push({
        category: 'investment',
        priority: 'high',
        icon: 'trophy-outline',
        title: 'Prepare for Investment',
        description: 'Your business shows strong fundamentals! Join our Investment Readiness Program to prepare for funding opportunities.',
        action: 'Join Investment Readiness Program'
      });
    }

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }

  /**
   * Calculate investment readiness score
   */
  calculateInvestmentReadiness(categoryScores, overallScore) {
    // Investment readiness heavily weighs financial and strategic categories
    const investmentWeights = {
      financial: 0.4,
      operations: 0.3,
      strategy: 0.2,
      market: 0.1
    };

    let investmentScore = 0;
    Object.keys(investmentWeights).forEach(category => {
      if (categoryScores[category]) {
        investmentScore += categoryScores[category] * investmentWeights[category];
      }
    });

    return {
      score: Math.round(investmentScore),
      level: investmentScore >= 75 ? 'Ready' : investmentScore >= 50 ? 'Nearly Ready' : 'Not Ready',
      requirements: this.getInvestmentRequirements(categoryScores)
    };
  }

  /**
   * Get specific requirements for investment readiness
   */
  getInvestmentRequirements(categoryScores) {
    const requirements = [];

    if (categoryScores.financial < 70) {
      requirements.push('Improve financial record keeping and cash flow management');
    }

    if (categoryScores.operations < 60) {
      requirements.push('Establish systematic business operations and processes');
    }

    if (categoryScores.strategy < 60) {
      requirements.push('Develop a comprehensive business plan with growth strategy');
    }

    if (categoryScores.market < 50) {
      requirements.push('Expand and diversify customer base');
    }

    return requirements;
  }

  /**
   * Save assessment result to database
   */
  async saveAssessmentResult(userId, result) {
    try {
      const savedResult = await dynamoDBService.saveAssessment(userId, result);

      console.log('Assessment result saved:', savedResult.id);
      return savedResult.id;

    } catch (error) {
      console.error('Error saving assessment result:', error);
      throw error;
    }
  }

  /**
   * Get user's latest assessment result
   */
  async getLatestAssessment(userId) {
    try {
      const assessment = await dynamoDBService.getLatestAssessment(userId);

      if (assessment) {
        return {
          ...assessment,
          completedAt: new Date(assessment.completedAt),
          validUntil: new Date(assessment.validUntil)
        };
      }

      return null;

    } catch (error) {
      console.error('Error getting latest assessment:', error);
      throw error;
    }
  }

  /**
   * Check if user needs to retake assessment
   */
  async needsRetakeAssessment(userId) {
    try {
      const latest = await this.getLatestAssessment(userId);

      if (!latest) return true;

      // Check if assessment has expired
      const now = new Date();
      return latest.validUntil < now;

    } catch (error) {
      console.error('Error checking retake needs:', error);
      return true; // Default to needing retake if there's an error
    }
  }

  /**
   * Get assessment statistics for analytics
   */
  async getAssessmentStats() {
    try {
      // This would typically aggregate stats from the database
      // For now, return mock stats
      return {
        totalAssessments: 1247,
        averageScore: 67,
        investmentReady: 234,
        topCategories: [
          { name: 'Financial Management', averageScore: 72 },
          { name: 'Operations & Efficiency', averageScore: 65 },
          { name: 'Market & Customers', averageScore: 63 },
          { name: 'Strategy & Planning', averageScore: 58 },
          { name: 'Technology & Innovation', averageScore: 54 }
        ]
      };

    } catch (error) {
      console.error('Error getting assessment stats:', error);
      throw error;
    }
  }
}

// Create singleton instance
const businessHealthService = new BusinessHealthService();

export { businessHealthService };