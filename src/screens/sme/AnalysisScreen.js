import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { transactionService } from '../../services/firebase/FirebaseService';
import { FinancialMetricsCalculator } from '../../utils/financialMetrics';
import { ProfessionalChart, MetricChart } from '../../components/charts/ProfessionalChart';
import { ProfessionalHeader, useTheme, getEnhancedColor, getSpacing, getFontSize, getFont } from '../../components/ui';

const { width } = Dimensions.get('window');

export default function AnalysisScreen() {
  const { user, userProfile } = useContext(AuthContext);
  const { formatCurrency } = useApp();
  const { colors, isDark } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('all'); // all, 6months, 3months

  useEffect(() => {
    if (user) {
      loadAnalysisData();
    }
  }, [user, selectedTimeframe]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      console.log('Loading transactions for analysis...');
      
      const userTransactions = await transactionService.getUserTransactions(user.uid, {
        limit: 200 // Get more data for better analysis
      });
      
      // Filter by timeframe if needed
      let filteredTransactions = userTransactions;
      if (selectedTimeframe !== 'all') {
        const months = selectedTimeframe === '6months' ? 6 : 3;
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - months);
        
        filteredTransactions = userTransactions.filter(t => {
          const transactionDate = t.date?.toDate ? t.date.toDate() : new Date(t.date);
          return transactionDate >= cutoffDate;
        });
      }
      
      setTransactions(filteredTransactions);
      
      // Calculate financial metrics
      const calculator = new FinancialMetricsCalculator(filteredTransactions, userProfile);
      
      const analysis = {
        cashFlow: calculator.calculateCashFlow(),
        profitability: calculator.calculateProfitabilityRatios(),
        liquidity: calculator.calculateLiquidityMetrics(),
        africanMetrics: calculator.calculateAfricanMarketMetrics(),
        readinessScore: calculator.calculateInvestmentReadinessScore(),
        advanced: calculator.calculateAdvancedMetrics(),
        benchmarks: calculator.getIndustryBenchmarks(),
        predictions: calculator.predictCashFlow(6),
        riskAssessment: calculator.calculateComprehensiveRisk()
      };
      
      setAnalysisData(analysis);
      console.log('Analysis completed:', analysis.readinessScore.overallScore);
      
    } catch (error) {
      console.error('Error loading analysis data:', error);
      Alert.alert('Error', 'Failed to load analysis data');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#28a745'; // Green
    if (score >= 60) return '#ffc107'; // Yellow
    if (score >= 40) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  };

  const getScoreStatus = (score) => {
    if (score >= 80) return 'Investment Ready';
    if (score >= 60) return 'Nearly Ready';
    if (score >= 40) return 'Needs Improvement';
    return 'High Risk';
  };

  const getTrendIcon = (value, isPositive = true) => {
    if (value > 0) return isPositive ? '📈' : '📉';
    if (value < 0) return isPositive ? '📉' : '📈';
    return '➡️';
  };

  // Helper function to generate chart data
  const generateCashFlowChartData = (cashFlow) => {
    if (!cashFlow) return [];
    
    // Generate sample monthly data based on cash flow metrics
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const baseValue = cashFlow.averageMonthlyIncome || 50000;
    const volatility = cashFlow.cashFlowVolatility || 5000;
    
    return months.map((month, index) => ({
      label: month,
      value: baseValue + (Math.random() - 0.5) * volatility * 2,
      month: index + 1
    }));
  };

  // Helper function for revenue trend data
  const generateRevenueChartData = (profitability) => {
    if (!profitability) return [];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const growthRate = profitability.revenueGrowthRate || 5;
    let baseRevenue = 40000;
    
    return months.map((month, index) => {
      baseRevenue = baseRevenue * (1 + growthRate / 100 / 12);
      return {
        label: month,
        value: baseRevenue,
        month: index + 1
      };
    });
  };

  const renderAdvancedMetrics = () => {
    if (!analysisData?.advanced) return null;
    
    const { advanced } = analysisData;
    
    return (
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>🚀 Advanced Business Metrics</Text>
        
        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>⚡</Text>
            <Text style={styles.metricLabel}>Scalability Index</Text>
            <Text style={styles.metricValue}>
              {advanced.scalabilityIndex?.overallScore || 0}/100
            </Text>
            <Text style={styles.metricTrend}>
              {advanced.scalabilityIndex?.overallScore >= 70 ? '🚀 High' : 
               advanced.scalabilityIndex?.overallScore >= 50 ? '📈 Medium' : '🔧 Build'}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>💻</Text>
            <Text style={styles.metricLabel}>Digital Readiness</Text>
            <Text style={styles.metricValue}>
              {advanced.digitalReadiness?.overallScore || 0}%
            </Text>
            <Text style={styles.metricTrend}>
              {advanced.digitalReadiness?.overallScore >= 70 ? '✅ Ready' : 
               advanced.digitalReadiness?.overallScore >= 50 ? '📈 Growing' : '🔧 Develop'}
            </Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>🎯</Text>
            <Text style={styles.metricLabel}>Customer Metrics</Text>
            <Text style={styles.metricValue}>
              {advanced.customerMetrics?.totalCustomers || 0}
            </Text>
            <Text style={styles.metricTrend}>
              {formatCurrency(advanced.customerMetrics?.averageRevenuePerCustomer || 0, userProfile?.currency || 'USD')} avg
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>💰</Text>
            <Text style={styles.metricLabel}>Working Capital</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(advanced.workingCapital?.workingCapital || 0, userProfile?.currency || 'USD')}
            </Text>
            <Text style={styles.metricTrend}>
              Ratio: {advanced.workingCapital?.currentRatio?.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>

        {advanced.burnRate?.monthlyBurnRate > 0 && (
          <View style={styles.burnRateAlert}>
            <Text style={styles.burnRateIcon}>⚠️</Text>
            <View style={styles.burnRateContent}>
              <Text style={styles.burnRateTitle}>Cash Burn Analysis</Text>
              <Text style={styles.burnRateText}>
                Monthly burn: {formatCurrency(advanced.burnRate.monthlyBurnRate, userProfile?.currency || 'USD')}
              </Text>
              {advanced.runway && (
                <Text style={styles.burnRateText}>
                  Runway: {advanced.runway.monthsRemaining.toFixed(1)} months
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderIndustryBenchmarks = () => {
    if (!analysisData?.benchmarks) return null;
    
    const { benchmarks } = analysisData;
    
    return (
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>📊 Industry Benchmarks</Text>
        <Text style={styles.benchmarkSubtitle}>
          {benchmarks.industry} • {benchmarks.country}
        </Text>
        
        {Object.entries(benchmarks.comparison || {}).map(([metric, data]) => (
          <View key={metric} style={styles.benchmarkCard}>
            <View style={styles.benchmarkHeader}>
              <Text style={styles.benchmarkMetric}>
                {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
              <Text style={[
                styles.benchmarkPerformance,
                styles[`performance${data.performance.charAt(0).toUpperCase() + data.performance.slice(1)}`]
              ]}>
                {data.performance.toUpperCase()}
              </Text>
            </View>
            <View style={styles.benchmarkBar}>
              <View style={[
                styles.benchmarkFill,
                { width: `${Math.min(100, data.percentile)}%` },
                styles[`performance${data.performance.charAt(0).toUpperCase() + data.performance.slice(1)}`]
              ]} />
            </View>
            <Text style={styles.benchmarkValue}>
              Your: {typeof data.value === 'number' ? data.value.toFixed(1) : data.value}
              {metric.includes('Margin') || metric.includes('Rate') ? '%' : ''}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderPredictiveAnalytics = () => {
    if (!analysisData?.predictions) return null;
    
    const { predictions } = analysisData;
    
    return (
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>🔮 Cash Flow Predictions</Text>
        
        <View style={styles.predictionSummary}>
          <Text style={styles.predictionTitle}>6-Month Outlook</Text>
          
          {predictions.predictions.slice(0, 3).map((prediction, index) => (
            <View key={index} style={styles.predictionItem}>
              <Text style={styles.predictionMonth}>
                Month {prediction.month}
              </Text>
              <Text style={[
                styles.predictionValue,
                { color: prediction.netCashFlow >= 0 ? '#28a745' : '#dc3545' }
              ]}>
                {prediction.netCashFlow >= 0 ? '+' : ''}
                {formatCurrency(prediction.netCashFlow, userProfile?.currency || 'USD')}
              </Text>
              <Text style={styles.predictionConfidence}>
                {prediction.confidence}% confidence
              </Text>
            </View>
          ))}
        </View>

        {predictions.opportunities.length > 0 && (
          <View style={styles.opportunitiesCard}>
            <Text style={styles.opportunitiesTitle}>💡 Opportunities</Text>
            {predictions.opportunities.slice(0, 2).map((opp, index) => (
              <Text key={index} style={styles.opportunityText}>
                • {opp.description}
              </Text>
            ))}
          </View>
        )}

        {predictions.riskFactors.length > 0 && (
          <View style={styles.riskFactorsCard}>
            <Text style={styles.riskFactorsTitle}>⚠️ Risk Factors</Text>
            {predictions.riskFactors.slice(0, 2).map((risk, index) => (
              <Text key={index} style={styles.riskFactorText}>
                • {risk.description} (Month {risk.month})
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderRiskAssessment = () => {
    if (!analysisData?.riskAssessment) return null;
    
    const { riskAssessment } = analysisData;
    const riskColor = {
      'low': '#28a745',
      'medium': '#ffc107', 
      'high': '#fd7e14',
      'critical': '#dc3545'
    };
    
    return (
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>⚠️ Risk Assessment</Text>
        
        <View style={styles.riskOverviewCard}>
          <Text style={styles.riskOverviewLabel}>Overall Risk Level</Text>
          <Text style={[
            styles.riskOverviewValue,
            { color: riskColor[riskAssessment.riskLevel] }
          ]}>
            {riskAssessment.riskLevel.toUpperCase()}
          </Text>
          <Text style={styles.riskScore}>
            Score: {riskAssessment.overallRiskScore.toFixed(1)}/4.0
          </Text>
        </View>

        <View style={styles.riskFactorsGrid}>
          {Object.entries(riskAssessment.riskFactors || {}).map(([factor, data]) => (
            <View key={factor} style={styles.riskFactorCard}>
              <Text style={styles.riskFactorName}>
                {factor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('Risk', '')}
              </Text>
              <Text style={[
                styles.riskFactorLevel,
                { color: riskColor[data.level] }
              ]}>
                {data.level.toUpperCase()}
              </Text>
              {data.factors && data.factors.length > 0 && (
                <Text style={styles.riskFactorDetails}>
                  {data.factors[0]}
                </Text>
              )}
            </View>
          ))}
        </View>

        {riskAssessment.mitigation && riskAssessment.mitigation.length > 0 && (
          <View style={styles.mitigationCard}>
            <Text style={styles.mitigationTitle}>🛡️ Risk Mitigation Plan</Text>
            {riskAssessment.mitigation.slice(0, 3).map((plan, index) => (
              <View key={index} style={styles.mitigationItem}>
                <Text style={styles.mitigationRisk}>
                  {plan.riskType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Text>
                <Text style={styles.mitigationAction}>
                  {plan.actions[0]}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTimeframeSelector = () => (
    <View style={styles.timeframeSelector}>
      {['all', '6months', '3months'].map(timeframe => (
        <TouchableOpacity
          key={timeframe}
          style={[
            styles.timeframeButton,
            selectedTimeframe === timeframe && styles.timeframeButtonActive
          ]}
          onPress={() => setSelectedTimeframe(timeframe)}
        >
          <Text style={[
            styles.timeframeButtonText,
            selectedTimeframe === timeframe && styles.timeframeButtonTextActive
          ]}>
            {timeframe === 'all' ? 'All Time' : 
             timeframe === '6months' ? '6 Months' : '3 Months'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderReadinessScore = () => {
    if (!analysisData) return null;
    
    const score = analysisData.readinessScore.overallScore;
    const scoreColor = getScoreColor(score);
    
    return (
      <View style={styles.readinessCard}>
        <Text style={styles.scoreLabel}>Investment Readiness Score</Text>
        <Text style={[styles.scoreValue, { color: scoreColor }]}>{score}/100</Text>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill, 
            { width: `${score}%`, backgroundColor: scoreColor }
          ]} />
        </View>
        <Text style={[styles.scoreStatus, { color: scoreColor }]}>
          {getScoreStatus(score)}
        </Text>
        
        {/* Score Breakdown */}
        <View style={styles.scoreBreakdown}>
          <Text style={styles.breakdownTitle}>Score Breakdown:</Text>
          {Object.entries(analysisData.readinessScore.breakdown).map(([key, value]) => (
            <View key={key} style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
              <Text style={styles.breakdownValue}>
                {value > 0 ? '+' : ''}{Math.round(value)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderFinancialMetrics = () => {
    if (!analysisData) return null;
    
    const { cashFlow, profitability, liquidity } = analysisData;
    
    return (
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>💰 Financial Health</Text>
        
        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>💵</Text>
            <Text style={styles.metricLabel}>Net Cash Flow</Text>
            <Text style={[
              styles.metricValue,
              { color: cashFlow.netCashFlow >= 0 ? '#28a745' : '#dc3545' }
            ]}>
              {cashFlow.netCashFlow >= 0 ? '+' : ''}
              {formatCurrency(cashFlow.netCashFlow, userProfile?.currency || 'USD')}
            </Text>
            <Text style={styles.metricTrend}>
              {getTrendIcon(cashFlow.netCashFlow)} 
              {cashFlow.netCashFlow >= 0 ? 'Positive' : 'Negative'}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>📊</Text>
            <Text style={styles.metricLabel}>Profit Margin</Text>
            <Text style={styles.metricValue}>
              {profitability.netProfitMargin.toFixed(1)}%
            </Text>
            <Text style={styles.metricTrend}>
              {getTrendIcon(profitability.netProfitMargin)} 
              {profitability.profitabilityTrend}
            </Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>📈</Text>
            <Text style={styles.metricLabel}>Revenue Growth</Text>
            <Text style={[
              styles.metricValue,
              { color: profitability.revenueGrowthRate >= 0 ? '#28a745' : '#dc3545' }
            ]}>
              {profitability.revenueGrowthRate >= 0 ? '+' : ''}
              {profitability.revenueGrowthRate.toFixed(1)}%
            </Text>
            <Text style={styles.metricTrend}>
              {getTrendIcon(profitability.revenueGrowthRate)} 
              {profitability.revenueGrowthRate >= 10 ? 'Strong' : 
               profitability.revenueGrowthRate >= 0 ? 'Moderate' : 'Declining'}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>🏦</Text>
            <Text style={styles.metricLabel}>Liquidity</Text>
            <Text style={styles.metricValue}>
              {liquidity.monthsOfExpensesCovered.toFixed(1)} mo
            </Text>
            <Text style={styles.metricTrend}>
              ⏰ {liquidity.liquidityRisk === 'very-low' ? 'Safe' : 
                  liquidity.liquidityRisk === 'low' ? 'Good' :
                  liquidity.liquidityRisk === 'medium' ? 'Watch' : 'Risk'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAfricanMetrics = () => {
    if (!analysisData) return null;
    
    const { africanMetrics } = analysisData;
    
    return (
      <View style={styles.metricsContainer}>
        <Text style={styles.sectionTitle}>🌍 African Market Position</Text>
        
        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>📱</Text>
            <Text style={styles.metricLabel}>Mobile Money</Text>
            <Text style={styles.metricValue}>
              {africanMetrics.mobileMoneyDependency.toFixed(1)}%
            </Text>
            <Text style={styles.metricTrend}>
              {africanMetrics.mobileMoneyDependency > 30 ? '✅ Adopted' : '📈 Growth Opportunity'}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>💱</Text>
            <Text style={styles.metricLabel}>Forex Exposure</Text>
            <Text style={styles.metricValue}>
              {africanMetrics.forexExposureRisk.exposurePercentage.toFixed(1)}%
            </Text>
            <Text style={styles.metricTrend}>
              {africanMetrics.forexExposureRisk.riskLevel === 'minimal' ? '✅ Low Risk' :
               africanMetrics.forexExposureRisk.riskLevel === 'low' ? '⚠️ Moderate' :
               africanMetrics.forexExposureRisk.riskLevel === 'medium' ? '⚠️ Medium' : '🚨 High Risk'}
            </Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>🤝</Text>
            <Text style={styles.metricLabel}>AfCFTA Readiness</Text>
            <Text style={styles.metricValue}>
              {africanMetrics.afcftaReadiness.toFixed(0)}%
            </Text>
            <Text style={styles.metricTrend}>
              {africanMetrics.afcftaReadiness > 70 ? '🚀 Ready' : 
               africanMetrics.afcftaReadiness > 50 ? '📈 Preparing' : '🔧 Build Capacity'}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>📊</Text>
            <Text style={styles.metricLabel}>Seasonality</Text>
            <Text style={styles.metricValue}>
              {africanMetrics.seasonalityIndex.toFixed(1)}%
            </Text>
            <Text style={styles.metricTrend}>
              {africanMetrics.seasonalityIndex < 20 ? '✅ Stable' : 
               africanMetrics.seasonalityIndex < 40 ? '⚠️ Moderate' : '🌊 High Variation'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!analysisData?.readinessScore.recommendations.length) return null;
    
    return (
      <View style={styles.recommendationsContainer}>
        <Text style={styles.sectionTitle}>💡 Recommendations</Text>
        
        {analysisData.readinessScore.recommendations.map((rec, index) => (
          <View key={index} style={[
            styles.recommendationCard,
            styles[`priority${rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}`]
          ]}>
            <View style={styles.recommendationHeader}>
              <Text style={styles.recommendationPriority}>
                {rec.priority === 'critical' ? '🚨' : 
                 rec.priority === 'high' ? '⚠️' : 
                 rec.priority === 'medium' ? '💡' : '📝'} {rec.priority.toUpperCase()}
              </Text>
              <Text style={styles.recommendationCategory}>
                {rec.category.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.recommendationTitle}>{rec.title}</Text>
            <Text style={styles.recommendationDescription}>{rec.description}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderCashFlowInsights = () => {
    if (!analysisData) return null;
    
    const { cashFlow } = analysisData;
    
    return (
      <View style={styles.insightsContainer}>
        <Text style={styles.sectionTitle}>📊 Cash Flow Insights</Text>
        
        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Monthly Averages</Text>
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Income:</Text>
            <Text style={[styles.insightValue, { color: '#28a745' }]}>
              {formatCurrency(cashFlow.averageMonthlyIncome, userProfile?.currency || 'USD')}
            </Text>
          </View>
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Expenses:</Text>
            <Text style={[styles.insightValue, { color: '#dc3545' }]}>
              {formatCurrency(cashFlow.averageMonthlyExpenses, userProfile?.currency || 'USD')}
            </Text>
          </View>
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Volatility:</Text>
            <Text style={styles.insightValue}>
              {formatCurrency(cashFlow.cashFlowVolatility, userProfile?.currency || 'USD')}
            </Text>
          </View>
        </View>

        <ProfessionalChart
          data={generateCashFlowChartData(cashFlow)}
          type="area"
          title="Cash Flow Trend"
          subtitle="Monthly cash flow analysis"
          height={220}
          color={getEnhancedColor('primary.500')}
          gradient={true}
          animated={true}
          showGrid={true}
          currency={userProfile?.currency || 'USD'}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🔍 Analyzing your business data...</Text>
          <Text style={styles.loadingSubtext}>Calculating financial metrics and investment readiness</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!analysisData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>No Analysis Data</Text>
          <Text style={styles.emptyText}>
            Add more transactions to your business records to see detailed financial analysis
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadAnalysisData}
          >
            <Text style={styles.retryButtonText}>Refresh Analysis</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ProfessionalHeader
        title="Business Analysis"
        subtitle="AI-powered investment readiness insights"
        showBackButton={false}
        variant="premium"
      />
      
      {/* Charts Section */}
      {analysisData && (
        <View style={[styles.chartsSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { 
            color: colors.text,
            fontFamily: getFont('semibold') 
          }]}>
            📊 Financial Performance
          </Text>
          
          <View style={styles.chartGrid}>
            <ProfessionalChart
              data={generateRevenueChartData(analysisData.profitability)}
              type="bar"
              title="Revenue Growth"
              subtitle="Monthly revenue trend"
              height={180}
              color={getEnhancedColor('success.500')}
              gradient={true}
              animated={true}
              currency={userProfile?.currency || 'USD'}
            />
            
            <ProfessionalChart
              data={generateCashFlowChartData(analysisData.cashFlow)}
              type="line"
              title="Profit Margin"
              subtitle="Monthly profitability"
              height={180}
              color={getEnhancedColor('warning.500')}
              gradient={true}
              animated={true}
              currency="percentage"
            />
          </View>
        </View>
      )}

      {renderTimeframeSelector()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderReadinessScore()}
        {renderFinancialMetrics()}
        {renderAdvancedMetrics()}
        {renderIndustryBenchmarks()}
        {renderAfricanMetrics()}
        {renderPredictiveAnalytics()}
        {renderRiskAssessment()}
        {renderCashFlowInsights()}
        {renderRecommendations()}

        {/* African SME Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>🌍 African SME Growth Tips</Text>
          
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💰</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Investment Readiness</Text>
              <Text style={styles.tipText}>
                Maintain 6+ months of consistent records and positive cash flow to attract investors.
              </Text>
            </View>
          </View>
          
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>🤝</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>AfCFTA Opportunities</Text>
              <Text style={styles.tipText}>
                Prepare for continental trade by tracking multi-currency transactions and export readiness.
              </Text>
            </View>
          </View>
          
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>📱</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Mobile Money Integration</Text>
              <Text style={styles.tipText}>
                Leverage mobile money for better cash flow tracking and financial inclusion.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  chartsSection: {
    padding: getSpacing('lg'),
    marginBottom: getSpacing('md')
  },
  
  chartGrid: {
    gap: getSpacing('md')
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  timeframeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: '#2E7D8F',
  },
  timeframeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  timeframeButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#2E7D8F',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  readinessCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  scoreBreakdown: {
    width: '100%',
    marginTop: 10,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  metricsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    flex: 0.48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  metricTrend: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  insightsContainer: {
    marginBottom: 20,
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  insightLabel: {
    fontSize: 14,
    color: '#666',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  chartPlaceholder: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  chartPlaceholderSubtext: {
    fontSize: 12,
    color: '#999',
  },
  recommendationsContainer: {
    marginBottom: 20,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  priorityCritical: {
    borderLeftColor: '#dc3545',
  },
  priorityHigh: {
    borderLeftColor: '#fd7e14',
  },
  priorityMedium: {
    borderLeftColor: '#ffc107',
  },
  priorityLow: {
    borderLeftColor: '#28a745',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recommendationPriority: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  recommendationCategory: {
    fontSize: 10,
    color: '#999',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  recommendationDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  tipsContainer: {
    marginBottom: 20,
  },
  tipCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D8F',
    marginBottom: 5,
  },
  tipText: {
    fontSize: 12,
    color: '#2E7D8F',
    lineHeight: 16,
  },
  bottomSpacing: {
    height: 30,
  },
  // Advanced Metrics Styles
  burnRateAlert: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  burnRateIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  burnRateContent: {
    flex: 1,
  },
  burnRateTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 5,
  },
  burnRateText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
  },
  // Benchmarks Styles
  benchmarkSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  benchmarkCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  benchmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  benchmarkMetric: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  benchmarkPerformance: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  performanceExcellent: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  performanceGood: {
    backgroundColor: '#d1ecf1',
    color: '#0c5460',
  },
  performanceAverage: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  performancePoor: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  benchmarkBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginBottom: 8,
  },
  benchmarkFill: {
    height: '100%',
    borderRadius: 3,
  },
  benchmarkValue: {
    fontSize: 12,
    color: '#666',
  },
  // Predictions Styles
  predictionSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  predictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  predictionMonth: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  predictionValue: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'center',
  },
  predictionConfidence: {
    fontSize: 10,
    color: '#999',
    flex: 1,
    textAlign: 'right',
  },
  opportunitiesCard: {
    backgroundColor: '#d4edda',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  opportunitiesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#155724',
    marginBottom: 8,
  },
  opportunityText: {
    fontSize: 12,
    color: '#155724',
    lineHeight: 16,
    marginBottom: 4,
  },
  riskFactorsCard: {
    backgroundColor: '#f8d7da',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  riskFactorsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 8,
  },
  riskFactorText: {
    fontSize: 12,
    color: '#721c24',
    lineHeight: 16,
    marginBottom: 4,
  },
  // Risk Assessment Styles
  riskOverviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  riskOverviewLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  riskOverviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  riskScore: {
    fontSize: 12,
    color: '#999',
  },
  riskFactorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  riskFactorCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    width: '48%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  riskFactorName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  riskFactorLevel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  riskFactorDetails: {
    fontSize: 10,
    color: '#666',
    lineHeight: 12,
  },
  mitigationCard: {
    backgroundColor: '#e7f3ff',
    borderRadius: 12,
    padding: 15,
  },
  mitigationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 10,
  },
  mitigationItem: {
    marginBottom: 8,
  },
  mitigationRisk: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066cc',
    marginBottom: 2,
  },
  mitigationAction: {
    fontSize: 11,
    color: '#0066cc',
    lineHeight: 14,
  },
});