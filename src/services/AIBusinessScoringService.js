/**
 * AI-Powered Business Scoring Service
 * Advanced algorithm for evaluating investment readiness and business potential
 */
class AIBusinessScoringService {
  constructor() {
    this.initialized = false;
    this.models = {
      financial: new FinancialScoringModel(),
      market: new MarketAnalysisModel(),
      team: new TeamAssessmentModel(),
      operations: new OperationalEfficiencyModel(),
      risk: new RiskAssessmentModel(),
      growth: new GrowthPotentialModel(),
    };
    this.weights = {
      financial: 0.25,
      market: 0.20,
      team: 0.15,
      operations: 0.15,
      risk: 0.15,
      growth: 0.10,
    };
  }

  /**
   * Initialize the AI business scoring service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize all scoring models
      await Promise.all(
        Object.values(this.models).map(model => model.initialize())
      );

      this.initialized = true;
      console.log('✅ AI Business Scoring Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize AI Business Scoring Service:', error);
    }
  }

  /**
   * Calculate comprehensive business score
   */
  async calculateBusinessScore(businessData) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      console.log('🧠 Calculating AI business score for:', businessData.name);

      // Get scores from each model
      const scores = {};
      const insights = {};
      const recommendations = {};

      for (const [modelName, model] of Object.entries(this.models)) {
        const result = await model.evaluate(businessData);
        scores[modelName] = result.score;
        insights[modelName] = result.insights;
        recommendations[modelName] = result.recommendations;
      }

      // Calculate weighted overall score
      const overallScore = this.calculateWeightedScore(scores);

      // Generate investment readiness rating
      const readinessRating = this.getInvestmentReadinessRating(overallScore);

      // Identify strengths and weaknesses
      const analysis = this.analyzeScoreComponents(scores);

      // Generate AI recommendations
      const aiRecommendations = this.generateAIRecommendations(
        scores, 
        insights, 
        recommendations, 
        businessData
      );

      const result = {
        overallScore: Math.round(overallScore * 100) / 100,
        readinessRating,
        scores,
        insights,
        analysis,
        recommendations: aiRecommendations,
        calculatedAt: new Date().toISOString(),
        version: '2.0',
      };

      console.log('✅ Business score calculated:', result.overallScore);
      return result;

    } catch (error) {
      console.error('❌ Failed to calculate business score:', error);
      return {
        overallScore: 0,
        readinessRating: 'Unable to assess',
        error: error.message,
      };
    }
  }

  /**
   * Calculate weighted overall score
   */
  calculateWeightedScore(scores) {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [category, score] of Object.entries(scores)) {
      if (score !== null && score !== undefined) {
        const weight = this.weights[category] || 0;
        weightedSum += score * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Get investment readiness rating
   */
  getInvestmentReadinessRating(score) {
    if (score >= 0.9) return 'Excellent - Highly Investment Ready';
    if (score >= 0.8) return 'Very Good - Investment Ready';
    if (score >= 0.7) return 'Good - Nearly Investment Ready';
    if (score >= 0.6) return 'Fair - Needs Improvement';
    if (score >= 0.5) return 'Poor - Significant Improvements Needed';
    return 'Very Poor - Not Ready for Investment';
  }

  /**
   * Analyze score components
   */
  analyzeScoreComponents(scores) {
    const sortedScores = Object.entries(scores)
      .filter(([_, score]) => score !== null && score !== undefined)
      .sort(([, a], [, b]) => b - a);

    const strengths = sortedScores.slice(0, 2).map(([category, score]) => ({
      category: this.formatCategoryName(category),
      score: Math.round(score * 100),
      level: this.getScoreLevel(score),
    }));

    const weaknesses = sortedScores.slice(-2).map(([category, score]) => ({
      category: this.formatCategoryName(category),
      score: Math.round(score * 100),
      level: this.getScoreLevel(score),
    }));

    return {
      strengths,
      weaknesses,
      averageScore: Math.round((sortedScores.reduce((sum, [, score]) => sum + score, 0) / sortedScores.length) * 100),
    };
  }

  /**
   * Generate AI-powered recommendations
   */
  generateAIRecommendations(scores, insights, recommendations, businessData) {
    const priority = [];
    const quickWins = [];
    const longTerm = [];

    // Analyze each category and generate recommendations
    for (const [category, score] of Object.entries(scores)) {
      const categoryRecommendations = recommendations[category] || [];
      const categoryInsights = insights[category] || [];

      if (score < 0.6) {
        // High priority improvements needed
        priority.push(...categoryRecommendations.filter(r => r.priority === 'high'));
      } else if (score < 0.8) {
        // Medium priority improvements
        quickWins.push(...categoryRecommendations.filter(r => r.type === 'quick_win'));
      }

      // Long-term strategic recommendations
      longTerm.push(...categoryRecommendations.filter(r => r.type === 'strategic'));
    }

    // Generate industry-specific recommendations
    const industryRecommendations = this.getIndustrySpecificRecommendations(
      businessData.industry,
      scores
    );

    // Generate size-specific recommendations
    const sizeRecommendations = this.getSizeSpecificRecommendations(
      businessData.employeeCount,
      businessData.revenue,
      scores
    );

    return {
      priority: priority.slice(0, 3), // Top 3 priority items
      quickWins: quickWins.slice(0, 5), // Top 5 quick wins
      longTerm: longTerm.slice(0, 3), // Top 3 long-term strategies
      industry: industryRecommendations,
      size: sizeRecommendations,
      actionPlan: this.generateActionPlan(priority, quickWins, longTerm),
    };
  }

  /**
   * Generate industry-specific recommendations
   */
  getIndustrySpecificRecommendations(industry, scores) {
    const industryData = {
      technology: {
        focus: ['team', 'growth', 'market'],
        recommendations: [
          'Focus on technical talent acquisition',
          'Demonstrate scalable technology architecture',
          'Show clear path to market dominance',
        ],
      },
      healthcare: {
        focus: ['risk', 'operations', 'financial'],
        recommendations: [
          'Ensure regulatory compliance',
          'Demonstrate clinical efficacy',
          'Show sustainable revenue model',
        ],
      },
      agriculture: {
        focus: ['operations', 'market', 'risk'],
        recommendations: [
          'Optimize supply chain efficiency',
          'Demonstrate market access',
          'Mitigate weather and climate risks',
        ],
      },
      fintech: {
        focus: ['risk', 'team', 'operations'],
        recommendations: [
          'Strengthen cybersecurity measures',
          'Build experienced financial team',
          'Ensure regulatory compliance',
        ],
      },
    };

    const data = industryData[industry?.toLowerCase()] || industryData.technology;
    return data.recommendations;
  }

  /**
   * Generate size-specific recommendations
   */
  getSizeSpecificRecommendations(employeeCount, revenue, scores) {
    if (employeeCount < 10 && revenue < 100000) {
      return [
        'Focus on product-market fit',
        'Build core team with essential skills',
        'Establish basic financial tracking',
      ];
    } else if (employeeCount < 50 && revenue < 1000000) {
      return [
        'Implement scalable processes',
        'Build management structure',
        'Establish growth metrics tracking',
      ];
    } else {
      return [
        'Optimize operational efficiency',
        'Expand to new markets',
        'Consider strategic partnerships',
      ];
    }
  }

  /**
   * Generate actionable action plan
   */
  generateActionPlan(priority, quickWins, longTerm) {
    return {
      phase1: {
        title: 'Immediate Actions (1-3 months)',
        items: priority.concat(quickWins.slice(0, 2)),
        expectedImpact: 'Significant score improvement',
      },
      phase2: {
        title: 'Short-term Goals (3-6 months)',
        items: quickWins.slice(2),
        expectedImpact: 'Enhanced investment readiness',
      },
      phase3: {
        title: 'Long-term Strategy (6-12 months)',
        items: longTerm,
        expectedImpact: 'Market leadership position',
      },
    };
  }

  // Utility methods
  formatCategoryName(category) {
    const names = {
      financial: 'Financial Health',
      market: 'Market Position',
      team: 'Team & Leadership',
      operations: 'Operations',
      risk: 'Risk Management',
      growth: 'Growth Potential',
    };
    return names[category] || category;
  }

  getScoreLevel(score) {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.7) return 'Good';
    if (score >= 0.6) return 'Fair';
    if (score >= 0.5) return 'Poor';
    return 'Very Poor';
  }

  /**
   * Compare business with industry benchmarks
   */
  async benchmarkAnalysis(businessData, industryBenchmarks) {
    const comparison = {};
    const metrics = ['revenue', 'profitability', 'growth_rate', 'market_share'];

    metrics.forEach(metric => {
      const businessValue = businessData[metric];
      const industryAverage = industryBenchmarks[metric];
      const industryTop10 = industryBenchmarks[`${metric}_top10`];

      comparison[metric] = {
        value: businessValue,
        industryAverage,
        industryTop10,
        percentileRank: this.calculatePercentileRank(businessValue, industryBenchmarks[`${metric}_distribution`]),
        recommendation: this.getBenchmarkRecommendation(businessValue, industryAverage, industryTop10),
      };
    });

    return comparison;
  }

  calculatePercentileRank(value, distribution) {
    if (!distribution || !Array.isArray(distribution)) return 50;
    
    const sorted = distribution.sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    return index === -1 ? 100 : Math.round((index / sorted.length) * 100);
  }

  getBenchmarkRecommendation(value, average, top10) {
    if (value >= top10) return 'Maintain excellence';
    if (value >= average * 1.2) return 'Above average performance';
    if (value >= average * 0.8) return 'Industry average performance';
    return 'Below average - needs improvement';
  }
}

/**
 * Financial Scoring Model
 */
class FinancialScoringModel {
  async initialize() {
    console.log('📊 Financial scoring model initialized');
  }

  async evaluate(businessData) {
    const metrics = {
      revenue: this.evaluateRevenue(businessData.revenue, businessData.revenueGrowth),
      profitability: this.evaluateProfitability(businessData.profit, businessData.margins),
      cashFlow: this.evaluateCashFlow(businessData.cashFlow, businessData.burnRate),
      fundingHistory: this.evaluateFundingHistory(businessData.fundingHistory),
      financialControls: this.evaluateFinancialControls(businessData.financialSystems),
    };

    const score = Object.values(metrics).reduce((sum, metric) => sum + metric.score, 0) / Object.keys(metrics).length;

    return {
      score,
      insights: Object.values(metrics).map(m => m.insight).filter(Boolean),
      recommendations: Object.values(metrics).map(m => m.recommendation).filter(Boolean),
      metrics,
    };
  }

  evaluateRevenue(revenue, growth) {
    let score = 0;
    let insight = '';
    let recommendation = null;

    if (revenue > 1000000) {
      score = 0.9;
      insight = 'Strong revenue base provides stability';
    } else if (revenue > 500000) {
      score = 0.7;
      insight = 'Moderate revenue with room for growth';
    } else if (revenue > 100000) {
      score = 0.5;
      insight = 'Early-stage revenue generation';
    } else {
      score = 0.3;
      insight = 'Limited revenue requires focus on sales';
      recommendation = {
        title: 'Accelerate Revenue Growth',
        description: 'Focus on sales and marketing to increase revenue',
        priority: 'high',
        type: 'quick_win',
      };
    }

    // Adjust for growth rate
    if (growth > 0.5) score += 0.1;
    else if (growth < 0) score -= 0.2;

    return { score: Math.min(score, 1), insight, recommendation };
  }

  evaluateProfitability(profit, margins) {
    let score = 0;
    let insight = '';

    if (margins > 0.2) {
      score = 0.9;
      insight = 'Excellent profit margins indicate efficient operations';
    } else if (margins > 0.1) {
      score = 0.7;
      insight = 'Good profitability with optimization opportunities';
    } else if (margins > 0) {
      score = 0.5;
      insight = 'Break-even operations need margin improvement';
    } else {
      score = 0.2;
      insight = 'Negative margins require immediate attention';
    }

    return { score, insight };
  }

  evaluateCashFlow(cashFlow, burnRate) {
    let score = 0.6; // Default score
    let insight = 'Cash flow analysis requires more data';

    if (cashFlow > 0 && burnRate < cashFlow * 0.1) {
      score = 0.9;
      insight = 'Positive cash flow with low burn rate';
    } else if (cashFlow > 0) {
      score = 0.7;
      insight = 'Positive cash flow but monitor burn rate';
    } else if (burnRate && cashFlow / burnRate > 12) {
      score = 0.5;
      insight = 'Sufficient runway for growth';
    }

    return { score, insight };
  }

  evaluateFundingHistory(fundingHistory) {
    if (!fundingHistory || fundingHistory.length === 0) {
      return {
        score: 0.5,
        insight: 'No previous funding history',
      };
    }

    const totalFunding = fundingHistory.reduce((sum, round) => sum + round.amount, 0);
    const latestRound = fundingHistory[fundingHistory.length - 1];

    let score = 0.6;
    if (totalFunding > 1000000) score = 0.8;
    if (latestRound.stage === 'Series A' || latestRound.stage === 'Series B') score += 0.1;

    return {
      score: Math.min(score, 1),
      insight: `Previous funding of $${totalFunding.toLocaleString()} shows investor confidence`,
    };
  }

  evaluateFinancialControls(systems) {
    let score = 0.5; // Default
    let insight = 'Financial systems assessment needed';

    if (systems && systems.accounting && systems.budgeting && systems.reporting) {
      score = 0.9;
      insight = 'Comprehensive financial controls in place';
    } else if (systems && (systems.accounting || systems.budgeting)) {
      score = 0.7;
      insight = 'Basic financial controls established';
    }

    return { score, insight };
  }
}

/**
 * Market Analysis Model
 */
class MarketAnalysisModel {
  async initialize() {
    console.log('🎯 Market analysis model initialized');
  }

  async evaluate(businessData) {
    const metrics = {
      marketSize: this.evaluateMarketSize(businessData.marketSize, businessData.tam),
      competition: this.evaluateCompetition(businessData.competitors, businessData.marketShare),
      differentiation: this.evaluateDifferentiation(businessData.uniqueValue, businessData.barriers),
      customerTraction: this.evaluateCustomerTraction(businessData.customers, businessData.retention),
      marketTrends: this.evaluateMarketTrends(businessData.industry, businessData.trends),
    };

    const score = Object.values(metrics).reduce((sum, metric) => sum + metric.score, 0) / Object.keys(metrics).length;

    return {
      score,
      insights: Object.values(metrics).map(m => m.insight).filter(Boolean),
      recommendations: Object.values(metrics).map(m => m.recommendation).filter(Boolean),
      metrics,
    };
  }

  evaluateMarketSize(marketSize, tam) {
    let score = 0.6;
    let insight = 'Market size analysis needed';

    if (tam > 1000000000) { // $1B+ market
      score = 0.9;
      insight = 'Large addressable market with significant opportunity';
    } else if (tam > 100000000) { // $100M+ market
      score = 0.7;
      insight = 'Substantial market opportunity';
    } else if (tam > 10000000) { // $10M+ market
      score = 0.5;
      insight = 'Niche market with growth potential';
    }

    return { score, insight };
  }

  evaluateCompetition(competitors, marketShare) {
    let score = 0.5;
    let insight = 'Competitive landscape analysis in progress';

    if (competitors && competitors.length < 3) {
      score = 0.8;
      insight = 'Low competition provides market opportunity';
    } else if (competitors && competitors.length < 10) {
      score = 0.6;
      insight = 'Moderate competition requires differentiation';
    } else if (competitors && competitors.length >= 10) {
      score = 0.4;
      insight = 'Highly competitive market requires strong positioning';
    }

    if (marketShare > 0.1) score += 0.1; // 10%+ market share bonus

    return { score: Math.min(score, 1), insight };
  }

  evaluateDifferentiation(uniqueValue, barriers) {
    let score = 0.5;
    let insight = 'Value proposition assessment needed';

    if (uniqueValue && barriers && barriers.length > 2) {
      score = 0.9;
      insight = 'Strong differentiation with multiple competitive barriers';
    } else if (uniqueValue) {
      score = 0.7;
      insight = 'Clear value proposition established';
    }

    return { score, insight };
  }

  evaluateCustomerTraction(customers, retention) {
    let score = 0.5;
    let insight = 'Customer traction metrics needed';

    if (customers > 10000 && retention > 0.8) {
      score = 0.9;
      insight = 'Excellent customer base with high retention';
    } else if (customers > 1000 && retention > 0.7) {
      score = 0.7;
      insight = 'Good customer traction with solid retention';
    } else if (customers > 100) {
      score = 0.6;
      insight = 'Growing customer base';
    }

    return { score, insight };
  }

  evaluateMarketTrends(industry, trends) {
    let score = 0.6; // Default neutral
    let insight = 'Market trends analysis in progress';

    // This would integrate with external market data APIs
    const favorableTrends = ['ai', 'fintech', 'healthcare', 'sustainability', 'mobile'];
    
    if (favorableTrends.includes(industry?.toLowerCase())) {
      score = 0.8;
      insight = 'Operating in a high-growth industry with favorable trends';
    }

    return { score, insight };
  }
}

/**
 * Team Assessment Model
 */
class TeamAssessmentModel {
  async initialize() {
    console.log('👥 Team assessment model initialized');
  }

  async evaluate(businessData) {
    const metrics = {
      leadership: this.evaluateLeadership(businessData.founders, businessData.leadership),
      experience: this.evaluateExperience(businessData.team, businessData.advisors),
      skills: this.evaluateSkills(businessData.team, businessData.requiredSkills),
      culture: this.evaluateCulture(businessData.culture, businessData.retention),
      governance: this.evaluateGovernance(businessData.board, businessData.governance),
    };

    const score = Object.values(metrics).reduce((sum, metric) => sum + metric.score, 0) / Object.keys(metrics).length;

    return {
      score,
      insights: Object.values(metrics).map(m => m.insight).filter(Boolean),
      recommendations: Object.values(metrics).map(m => m.recommendation).filter(Boolean),
      metrics,
    };
  }

  evaluateLeadership(founders, leadership) {
    let score = 0.6;
    let insight = 'Leadership assessment in progress';

    if (founders && founders.length > 0) {
      const hasExperiencedFounder = founders.some(f => f.experience > 5);
      const hasIndustryExperience = founders.some(f => f.industryExperience);
      const hasComplementarySkills = founders.length > 1;

      if (hasExperiencedFounder && hasIndustryExperience && hasComplementarySkills) {
        score = 0.9;
        insight = 'Strong founding team with complementary skills and experience';
      } else if (hasExperiencedFounder || hasIndustryExperience) {
        score = 0.7;
        insight = 'Capable founding team with relevant experience';
      }
    }

    return { score, insight };
  }

  evaluateExperience(team, advisors) {
    let score = 0.5;
    let insight = 'Team experience evaluation needed';

    const avgExperience = team?.reduce((sum, member) => sum + (member.experience || 0), 0) / (team?.length || 1);
    
    if (avgExperience > 8) {
      score = 0.9;
      insight = 'Highly experienced team';
    } else if (avgExperience > 5) {
      score = 0.7;
      insight = 'Experienced team members';
    } else if (avgExperience > 2) {
      score = 0.6;
      insight = 'Growing team experience';
    }

    if (advisors && advisors.length > 2) score += 0.1;

    return { score: Math.min(score, 1), insight };
  }

  evaluateSkills(team, requiredSkills) {
    // Simplified skills assessment
    return {
      score: 0.7,
      insight: 'Team skills assessment requires detailed analysis',
    };
  }

  evaluateCulture(culture, retention) {
    let score = 0.6;
    let insight = 'Company culture assessment needed';

    if (retention > 0.9) {
      score = 0.9;
      insight = 'Excellent employee retention indicates strong culture';
    } else if (retention > 0.8) {
      score = 0.7;
      insight = 'Good employee retention';
    }

    return { score, insight };
  }

  evaluateGovernance(board, governance) {
    let score = 0.5;
    let insight = 'Governance structure assessment needed';

    if (board && board.length >= 3 && governance) {
      score = 0.8;
      insight = 'Proper governance structure in place';
    }

    return { score, insight };
  }
}

/**
 * Operational Efficiency Model
 */
class OperationalEfficiencyModel {
  async initialize() {
    console.log('⚙️ Operational efficiency model initialized');
  }

  async evaluate(businessData) {
    const score = 0.7; // Simplified for demo
    return {
      score,
      insights: ['Operational efficiency assessment in progress'],
      recommendations: [],
    };
  }
}

/**
 * Risk Assessment Model
 */
class RiskAssessmentModel {
  async initialize() {
    console.log('⚠️ Risk assessment model initialized');
  }

  async evaluate(businessData) {
    const score = 0.6; // Simplified for demo
    return {
      score,
      insights: ['Risk assessment analysis in progress'],
      recommendations: [],
    };
  }
}

/**
 * Growth Potential Model
 */
class GrowthPotentialModel {
  async initialize() {
    console.log('📈 Growth potential model initialized');
  }

  async evaluate(businessData) {
    const score = 0.8; // Simplified for demo
    return {
      score,
      insights: ['Strong growth potential identified'],
      recommendations: [],
    };
  }
}

// Export singleton instance
const aiBusinessScoringService = new AIBusinessScoringService();
export default aiBusinessScoringService;