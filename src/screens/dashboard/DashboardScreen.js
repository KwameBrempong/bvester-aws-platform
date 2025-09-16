import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import AfricaInsightsWidget from '../../components/AfricaInsights/AfricaInsightsWidget';
import { userDataService } from '../../services/firebase/UserDataService';
import { transactionService, businessService } from '../../services/firebase/FirebaseService';
import { cmsService } from '../../services/firebase/CMSService';
import { 
  Card, 
  Button, 
  MetricCard, 
  EnhancedMetricCard,
  ProfessionalHeader,
  getColor, 
  getEnhancedColor,
  responsive,
  useTheme,
  getFont,
  getSpacing,
  getFontSize
} from '../../components/ui';

const { width } = Dimensions.get('window');

// Helper function to get time ago string
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export default function DashboardScreen({ navigation }) {
  const { user, userProfile, userRole, logout } = useContext(AuthContext);
  const { formatCurrency, currency, viewCurrency, toggleCurrencyView } = useApp();
  const { colors, isDark } = useTheme();
  // Real user data states
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [featuredContent, setFeaturedContent] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      setupRealTimeUpdates();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data for user:', user.uid);

      // Load all user data in parallel
      const [
        completeProfile,
        transactions,
        business,
        featuredTools,
        featuredResources,
        notifications
      ] = await Promise.all([
        userDataService.getCompleteUserProfile(user.uid),
        transactionService.getUserTransactions(user.uid, { limit: 10 }),
        businessService.getUserBusiness(user.uid),
        cmsService.getFeaturedContent('business_tool'),
        cmsService.getFeaturedContent('growth_resource'),
        userDataService.getUserNotifications(user.uid, { unreadOnly: true, limit: 5 })
      ]);

      setUserStats(completeProfile.stats);
      setBusinessData(business);
      setRecentTransactions(transactions);
      setFeaturedContent([...featuredTools.slice(0, 2), ...featuredResources.slice(0, 2)]);
      setUnreadNotifications(notifications.length);

      console.log('Dashboard data loaded successfully');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    // Set up real-time listeners for transactions and notifications
    const unsubscribeTransactions = transactionService.subscribeToUserTransactions(
      user.uid,
      (updatedTransactions) => {
        setRecentTransactions(updatedTransactions.slice(0, 10));
      }
    );

    const unsubscribeNotifications = userDataService.subscribeToUserNotifications(
      user.uid,
      (notifications) => {
        setUnreadNotifications(notifications.length);
      }
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeNotifications();
    };
  };

  const SMEDashboard = () => (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Professional Header */}
      <ProfessionalHeader
        userInfo={{
          name: userProfile?.firstName + ' ' + userProfile?.lastName || user?.displayName || 'Business Owner',
          businessName: businessData?.name || userProfile?.businessName || 'Your Business',
          subtitle: 'SME Dashboard'
        }}
        notificationCount={unreadNotifications}
        variant="premium"
        onNotificationPress={() => navigation.navigate('Notifications')}
        onProfilePress={() => navigation.navigate('Profile')}
        rightAction={
          <TouchableOpacity
            style={styles.currencyToggle}
            onPress={toggleCurrencyView}
          >
            <Text style={[styles.currencyToggleText, { color: colors.primary[600] }]}>
              {viewCurrency}
            </Text>
            <Ionicons 
              name="swap-horizontal" 
              size={16} 
              color={colors.primary[600]} 
            />
          </TouchableOpacity>
        }
      />

      {/* Business Health Score Card */}
      <View style={styles.healthScoreCard}>
        <LinearGradient 
          colors={userStats?.investmentReadinessScore > 0 ? ['#48bb78', '#38a169'] : ['#6b7280', '#4b5563']} 
          style={styles.scoreGradient}
        >
          <View style={styles.scoreContent}>
            <Ionicons 
              name={userStats?.investmentReadinessScore > 0 ? "trending-up" : "analytics-outline"} 
              size={32} 
              color="white" 
            />
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>Investment Readiness</Text>
              <Text style={styles.scoreValue}>
                {userStats?.investmentReadinessScore || 0}/100
              </Text>
              <Text style={styles.scoreStatus}>
                {userStats?.investmentReadinessScore >= 80 ? 'Excellent' :
                 userStats?.investmentReadinessScore >= 60 ? 'Good' :
                 userStats?.investmentReadinessScore >= 40 ? 'Fair' : 
                 userStats?.investmentReadinessScore > 0 ? 'Needs Improvement' : 'Upload financial data to see your business health'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Enhanced Metrics Grid */}
      <View style={styles.metricsGrid}>
        <EnhancedMetricCard
          title="Monthly Revenue"
          value={userStats?.monthlyIncome > 0 ? formatCurrency(userStats.monthlyIncome, viewCurrency) : formatCurrency(0, viewCurrency)}
          trend={userStats?.incomeGrowth > 0 ? "up" : userStats?.incomeGrowth < 0 ? "down" : "stable"}
          trendValue={userStats?.incomeGrowth ? `${userStats.incomeGrowth > 0 ? '+' : ''}${userStats.incomeGrowth.toFixed(1)}%` : 'Start recording transactions'}
          icon="cash-outline"
          color={getEnhancedColor('primary.500')}
          variant="premium"
          showSparkline={userStats?.monthlyIncome > 0}
          sparklineData={userStats?.monthlyIncome > 0 ? [38000, 41000, 39000, 43000, 42000, userStats.monthlyIncome] : [0, 0, 0, 0, 0, 0]}
          style={styles.metricCard}
          onPress={() => navigation.navigate('Records')}
          emptyStateMessage={!userStats?.monthlyIncome ? "Add your first transaction to see insights" : null}
        />
        
        <EnhancedMetricCard
          title="Business Health"
          value={userStats?.businessHealthScore > 0 ? `${userStats.businessHealthScore}/100` : 'Not calculated'}
          trend={userStats?.businessHealthScore >= 70 ? "up" : userStats?.businessHealthScore >= 40 ? "stable" : userStats?.businessHealthScore > 0 ? "down" : "stable"}
          trendValue={userStats?.businessHealthScore >= 70 ? 'Strong' : userStats?.businessHealthScore >= 40 ? 'Fair' : userStats?.businessHealthScore > 0 ? 'Needs Work' : 'Add transactions'}
          icon="trending-up-outline"
          color={getEnhancedColor('success.500')}
          variant="premium"
          showSparkline={userStats?.businessHealthScore > 0}
          sparklineData={userStats?.businessHealthScore > 0 ? [20, 35, 45, 60, 70, userStats.businessHealthScore] : [0, 0, 0, 0, 0, 0]}
          style={styles.metricCard}
          onPress={() => navigation.navigate('Records')}
          emptyStateMessage={!userStats?.businessHealthScore ? "Upload financial data to see your business health" : null}
        />
        
        <EnhancedMetricCard
          title="Net Cash Flow"
          value={userStats?.monthlyNetIncome !== undefined ? formatCurrency(userStats.monthlyNetIncome, viewCurrency) : 'No data'}
          trend={userStats?.monthlyNetIncome > 0 ? "up" : userStats?.monthlyNetIncome < 0 ? "down" : "stable"}
          trendValue={userStats?.monthlyNetIncome > 0 ? 'Positive' : userStats?.monthlyNetIncome < 0 ? 'Negative' : userStats?.monthlyNetIncome === 0 ? 'Break-even' : 'Add transactions'}
          icon="trending-up-outline"
          color={getEnhancedColor('warning.500')}
          variant="premium"
          showSparkline={userStats?.monthlyNetIncome !== undefined}
          sparklineData={userStats?.monthlyNetIncome !== undefined ? [1000, 2000, 1500, 3000, 2500, userStats.monthlyNetIncome] : [0, 0, 0, 0, 0, 0]}
          style={styles.metricCard}
          onPress={() => navigation.navigate('Records')}
          emptyStateMessage={userStats?.monthlyNetIncome === undefined ? "Add your first transaction to see insights" : null}
        />
        
        <EnhancedMetricCard
          title="Active Days"
          value={userStats?.activeStreak > 0 ? `${userStats.activeStreak}` : '0'}
          trend={userStats?.activeStreak > 7 ? "up" : userStats?.activeStreak > 3 ? "stable" : "down"}
          trendValue={userStats?.totalTransactions > 0 ? `${userStats.totalTransactions} total` : 'Start tracking'}
          icon="calendar-outline"
          color={getEnhancedColor('semantic.investment')}
          variant="premium"
          showSparkline={userStats?.activeStreak > 0}
          sparklineData={userStats?.activeStreak > 0 ? [5, 8, 10, 12, 15, userStats.activeStreak] : [0, 0, 0, 0, 0, 0]}
          style={styles.metricCard}
          onPress={() => navigation.navigate('Records')}
          emptyStateMessage={!userStats?.activeStreak ? "Record daily to build your streak" : null}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.modernActionCard}
            onPress={() => navigation.navigate('AddTransaction')}
          >
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.actionGradient}>
              <Ionicons name="add-circle-outline" size={28} color="white" />
              <Text style={styles.actionText}>Add Record</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modernActionCard}
            onPress={() => navigation.navigate('BusinessTools')}
          >
            <LinearGradient colors={['#48bb78', '#38a169']} style={styles.actionGradient}>
              <Ionicons name="construct-outline" size={28} color="white" />
              <Text style={styles.actionText}>Business Tools</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modernActionCard}
            onPress={() => navigation.navigate('GrowthResources')}
          >
            <LinearGradient colors={['#ed8936', '#dd6b20']} style={styles.actionGradient}>
              <Ionicons name="library-outline" size={28} color="white" />
              <Text style={styles.actionText}>Growth Resources</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modernActionCard}
            onPress={() => navigation.navigate('Analysis')}
          >
            <LinearGradient colors={['#9f7aea', '#805ad5']} style={styles.actionGradient}>
              <Ionicons name="analytics-outline" size={28} color="white" />
              <Text style={styles.actionText}>Analytics</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Content */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured for You</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BusinessTools')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {featuredContent.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredContent.map((item, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.contentCard}
                onPress={() => {
                  if (item.type === 'business_tool') {
                    navigation.navigate('BusinessTools');
                  } else {
                    navigation.navigate('GrowthResources');
                  }
                }}
              >
                <View style={styles.contentHeader}>
                  <Ionicons 
                    name={item.type === 'business_tool' ? 'construct' : 'library'} 
                    size={24} 
                    color={colors.primary[500]} 
                  />
                  <Text style={styles.contentBadge}>
                    {item.type === 'business_tool' ? 'Tool' : 'Resource'}
                  </Text>
                </View>
                <Text style={styles.contentTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.contentDescription} numberOfLines={3}>
                  {item.description}
                </Text>
                <View style={styles.contentStats}>
                  <Text style={styles.contentStat}>{item.views || 0} views</Text>
                  <Text style={styles.contentStat}>{item.likes || 0} likes</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noContentCard}>
            <Ionicons name="library-outline" size={48} color={colors.gray[400]} />
            <Text style={styles.noContentText}>No featured content available</Text>
            <Text style={styles.noContentSubtext}>Check back later for business tools and growth resources</Text>
          </View>
        )}
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Records')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {recentTransactions && recentTransactions.length > 0 ? (
          <View style={styles.activityCard}>
            {recentTransactions.slice(0, 3).map((transaction, index) => {
              const transactionDate = transaction.date.toDate ? transaction.date.toDate() : new Date(transaction.date);
              const timeAgo = getTimeAgo(transactionDate);
              
              return (
                <View key={transaction.id || index} style={styles.activityItem}>
                  <Ionicons 
                    name={transaction.type === 'income' ? 'trending-up' : 'trending-down'} 
                    size={20} 
                    color={transaction.type === 'income' ? '#48bb78' : '#ed8936'} 
                  />
                  <View style={styles.activityText}>
                    <Text style={styles.activityTitle}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount, viewCurrency)}
                    </Text>
                    <Text style={styles.activityDescription}>{transaction.description}</Text>
                    <Text style={styles.activityTime}>{timeAgo}</Text>
                  </View>
                  <View style={styles.activityCategory}>
                    <Text style={styles.activityCategoryText}>
                      {transaction.category?.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.noActivityCard}>
            <Ionicons name="document-outline" size={48} color={colors.gray[400]} />
            <Text style={styles.noActivityText}>No recent transactions</Text>
            <Text style={styles.noActivitySubtext}>Start recording your business transactions to see them here</Text>
            <TouchableOpacity 
              style={styles.addTransactionButton}
              onPress={() => navigation.navigate('AddTransaction')}
            >
              <Text style={styles.addTransactionButtonText}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Africa Insights Widget */}
      <View style={styles.section}>
        <AfricaInsightsWidget 
          userCountry={userProfile?.country?.toUpperCase() || 'REGIONAL'}
          businessSector={userProfile?.businessName ? 'general' : null}
          onInsightTap={(insight) => console.log('Insight tapped:', insight)}
        />
      </View>
    </ScrollView>
  );

  const InvestorDashboard = () => (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Professional Header */}
      <ProfessionalHeader
        userInfo={{
          name: userProfile?.name || user?.displayName || 'Investor',
          businessName: 'Investment Portfolio',
          subtitle: 'Portfolio Manager'
        }}
        notificationCount={5}
        variant="premium"
        onNotificationPress={() => navigation.navigate('Notifications')}
        onProfilePress={() => navigation.navigate('Profile')}
      />

      {/* Portfolio Overview Card */}
      <View style={styles.healthScoreCard}>
        <LinearGradient 
          colors={userStats?.totalInvested > 0 ? ['#667eea', '#764ba2'] : ['#6b7280', '#4b5563']} 
          style={styles.scoreGradient}
        >
          <View style={styles.scoreContent}>
            <Ionicons 
              name={userStats?.totalInvested > 0 ? "wallet-outline" : "wallet"} 
              size={32} 
              color="white" 
            />
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>Portfolio Value</Text>
              <Text style={styles.scoreValue}>{formatCurrency(userStats?.totalInvested || 0)}</Text>
              <Text style={styles.scoreStatus}>
                {userStats?.portfolioGrowth > 0 ? `+${userStats.portfolioGrowth}% Growth` : 
                 userStats?.totalInvested > 0 ? 'Building your portfolio' : 'Start building your investment portfolio'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Investment Metrics Grid */}
      <View style={styles.metricsGrid}>
        <EnhancedMetricCard
          title="Total Returns"
          value={userStats?.totalReturns > 0 ? formatCurrency(userStats.totalReturns, userProfile?.currency || 'USD') : formatCurrency(0, userProfile?.currency || 'USD')}
          trend={userStats?.totalReturns > 0 ? "up" : "stable"}
          trendValue={userStats?.totalReturns > 0 ? "+18.4%" : "Start building your portfolio"}
          icon="trending-up-outline"
          color={getEnhancedColor('success.500')}
          variant="premium"
          showSparkline={userStats?.totalReturns > 0}
          sparklineData={userStats?.totalReturns > 0 ? [18000, 19500, 21000, 22000, 22500, userStats.totalReturns] : [0, 0, 0, 0, 0, 0]}
          style={styles.metricCard}
          onPress={() => navigation.navigate('Portfolio')}
          emptyStateMessage={!userStats?.totalReturns ? "Start building your investment portfolio" : null}
        />
        
        <EnhancedMetricCard
          title="Active Investments"
          value={userStats?.activeInvestments > 0 ? userStats.activeInvestments.toString() : '0'}
          trend={userStats?.activeInvestments > 0 ? "up" : "stable"}
          trendValue={userStats?.activeInvestments > 0 ? `${userStats.activeInvestments} opportunities` : "Browse opportunities"}
          icon="business-outline"
          color={getEnhancedColor('primary.500')}
          variant="premium"
          showSparkline={userStats?.activeInvestments > 0}
          sparklineData={userStats?.activeInvestments > 0 ? [0, 0, 0, 1, 1, userStats.activeInvestments] : [0, 0, 0, 0, 0, 0]}
          style={styles.metricCard}
          onPress={() => navigation.navigate('InvestmentOpportunities')}
          emptyStateMessage={!userStats?.activeInvestments ? "Browse opportunities to start investing" : null}
        />
        
        <EnhancedMetricCard
          title="Avg ROI"
          value={userStats?.averageROI > 0 ? `${userStats.averageROI}%` : "0%"}
          trend={userStats?.averageROI > 0 ? "up" : "stable"}
          trendValue={userStats?.averageROI > 0 ? "+2.1%" : "Track performance"}
          icon="stats-chart-outline"
          color={getEnhancedColor('warning.500')}
          variant="premium"
          showSparkline={userStats?.averageROI > 0}
          sparklineData={userStats?.averageROI > 0 ? [0, 5, 10, 15, 20, userStats.averageROI] : [0, 0, 0, 0, 0, 0]}
          style={styles.metricCard}
          onPress={() => navigation.navigate('Portfolio')}
          emptyStateMessage={!userStats?.averageROI ? "Your investment history will appear here" : null}
        />
        
        <EnhancedMetricCard
          title="New Opportunities"
          value="24"
          trend="up"
          trendValue="Browse available"
          icon="globe-outline"
          color={getEnhancedColor('semantic.investment')}
          variant="premium"
          showSparkline={false}
          sparklineData={[15, 18, 20, 22, 24, 24]}
          style={styles.metricCard}
          onPress={() => navigation.navigate('InvestmentOpportunities')}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.modernActionCard}
            onPress={() => navigation.navigate('InvestmentSearch')}
          >
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.actionGradient}>
              <Ionicons name="search-outline" size={28} color="white" />
              <Text style={styles.actionText}>Discover</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modernActionCard}
            onPress={() => navigation.navigate('InvestmentDashboard')}
          >
            <LinearGradient colors={['#48bb78', '#38a169']} style={styles.actionGradient}>
              <Ionicons name="pie-chart-outline" size={28} color="white" />
              <Text style={styles.actionText}>Portfolio</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modernActionCard}
            onPress={() => navigation.navigate('Messages')}
          >
            <LinearGradient colors={['#ed8936', '#dd6b20']} style={styles.actionGradient}>
              <Ionicons name="chatbubbles-outline" size={28} color="white" />
              <Text style={styles.actionText}>Messages</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modernActionCard}
            onPress={() => navigation.navigate('InvestmentHistory')}
          >
            <LinearGradient colors={['#9f7aea', '#805ad5']} style={styles.actionGradient}>
              <Ionicons name="time-outline" size={28} color="white" />
              <Text style={styles.actionText}>History</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Market Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Insights</Text>
        <View style={styles.insightGrid}>
          <View style={styles.insightCard}>
            <Ionicons name="trending-up" size={20} color="#48bb78" />
            <Text style={styles.insightValue}>+32%</Text>
            <Text style={styles.insightLabel}>Tech Sector Growth</Text>
          </View>
          <View style={styles.insightCard}>
            <Ionicons name="cash" size={20} color="#667eea" />
            <Text style={styles.insightValue}>$45K</Text>
            <Text style={styles.insightLabel}>Avg Deal Size</Text>
          </View>
          <View style={styles.insightCard}>
            <Ionicons name="checkmark-circle" size={20} color="#9f7aea" />
            <Text style={styles.insightValue}>84%</Text>
            <Text style={styles.insightLabel}>Success Rate</Text>
          </View>
        </View>
      </View>

      {/* Top Performing Investments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Performers</Text>
        <View style={styles.performanceCard}>
          <View style={styles.performanceItem}>
            <View style={styles.companyLogo}>
              <Text style={styles.logoText}>GT</Text>
            </View>
            <View style={styles.performanceDetails}>
              <Text style={styles.companyName}>GreenTech Solutions</Text>
              <Text style={styles.companyIndustry}>Clean Technology</Text>
            </View>
            <View style={styles.performanceStats}>
              <Text style={styles.roiValue}>+28%</Text>
              <Text style={styles.roiLabel}>ROI</Text>
            </View>
          </View>
          
          <View style={styles.performanceItem}>
            <View style={[styles.companyLogo, { backgroundColor: '#48bb78' }]}>
              <Text style={styles.logoText}>AC</Text>
            </View>
            <View style={styles.performanceDetails}>
              <Text style={styles.companyName}>AgriConnect</Text>
              <Text style={styles.companyIndustry}>Agriculture Tech</Text>
            </View>
            <View style={styles.performanceStats}>
              <Text style={styles.roiValue}>+25%</Text>
              <Text style={styles.roiLabel}>ROI</Text>
            </View>
          </View>
          
          <View style={styles.performanceItem}>
            <View style={[styles.companyLogo, { backgroundColor: '#ed8936' }]}>
              <Text style={styles.logoText}>EA</Text>
            </View>
            <View style={styles.performanceDetails}>
              <Text style={styles.companyName}>EduTech Africa</Text>
              <Text style={styles.companyIndustry}>Education Tech</Text>
            </View>
            <View style={styles.performanceStats}>
              <Text style={styles.roiValue}>+23%</Text>
              <Text style={styles.roiLabel}>ROI</Text>
            </View>
          </View>
        </View>
      </View>

      {/* AI Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Recommendations</Text>
        <View style={styles.recommendationCard}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.recGradient}>
            <Ionicons name="bulb-outline" size={24} color="white" />
            <View style={styles.recContent}>
              <Text style={styles.recTitle}>Diversify into Healthcare</Text>
              <Text style={styles.recDescription}>Based on your portfolio, healthcare shows +15% potential</Text>
              <Text style={styles.recConfidence}>High Confidence</Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <SafeAreaView style={styles.safeArea}>
        {userRole === 'SME_OWNER' ? <SMEDashboard /> : <InvestorDashboard />}
        
        <Button
          title="Logout"
          variant="danger"
          icon="log-out-outline"
          onPress={logout}
          style={styles.logoutButton}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  
  // Header Styles
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  businessName: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#e53e3e',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Health Score / Portfolio Card
  healthScoreCard: {
    marginHorizontal: 20,
    marginTop: -15,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  scoreGradient: {
    borderRadius: 16,
    padding: 20,
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreInfo: {
    marginLeft: 15,
    flex: 1,
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  scoreStatus: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing('md'),
    marginBottom: getSpacing('xl'),
    gap: getSpacing('md')
  },
  metricCard: {
    width: (width - getSpacing('md') * 3) / 2,
    marginBottom: getSpacing('md'),
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginVertical: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 11,
    color: '#48bb78',
    fontWeight: '600',
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 15,
  },

  // Action Grid
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modernActionCard: {
    width: (width - 60) / 2,
    marginBottom: 15,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  actionGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  actionText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },

  // Activity Card
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activityText: {
    marginLeft: 15,
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    color: '#2d3748',
    fontWeight: '600',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#718096',
  },

  // Insights Grid
  insightGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginVertical: 8,
  },
  insightLabel: {
    fontSize: 11,
    color: '#718096',
    textAlign: 'center',
  },

  // Performance Card
  performanceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  performanceDetails: {
    flex: 1,
    marginLeft: 15,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  companyIndustry: {
    fontSize: 13,
    color: '#718096',
  },
  performanceStats: {
    alignItems: 'center',
  },
  roiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#48bb78',
    marginBottom: 4,
  },
  roiLabel: {
    fontSize: 12,
    color: '#718096',
  },

  // Recommendation Card
  recommendationCard: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  recGradient: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recContent: {
    marginLeft: 15,
    flex: 1,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },
  recDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    lineHeight: 20,
  },
  recConfidence: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },

  // Currency Toggle
  currencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getSpacing('sm'),
    paddingVertical: getSpacing('xs'),
    borderRadius: getBorderRadius('md'),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    gap: getSpacing('xs'),
  },
  currencyToggleText: {
    fontSize: getFontSize('sm'),
    fontFamily: getFont('semibold'),
  },

  // Logout Button
  logoutButton: {
    margin: getSpacing('md'),
  },
});