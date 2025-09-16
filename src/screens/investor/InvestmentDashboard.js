import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { InvestmentService } from '../../services/firebase/InvestmentService';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../../config/firebase';

const { width } = Dimensions.get('window');

export default function InvestmentDashboard({ navigation }) {
  const { user, userProfile } = useContext(AuthContext);
  const { formatCurrency } = useApp();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    portfolioSummary: {
      totalInvested: 0,
      totalValue: 0,
      activeInvestments: 0,
      pendingPledges: 0,
      returns: 0,
      returnPercentage: 0
    },
    recentActivity: [],
    topPerforming: [],
    investmentBreakdown: {
      equity: 0,
      loans: 0,
      revenueShare: 0
    },
    geographicDistribution: {},
    industryDistribution: {}
  });
  const [investorProfile, setInvestorProfile] = useState(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading investment dashboard data...');

      // Load investor profile
      const profile = await InvestmentService.getInvestorProfile(user.uid);
      setInvestorProfile(profile);

      // Load investment pledges
      const pledgesQuery = query(
        collection(db, 'investmentPledges'),
        where('investorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const pledgesSnapshot = await getDocs(pledgesQuery);
      const pledges = pledgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Load interests expressed
      const interestsQuery = query(
        collection(db, 'investmentInterests'),
        where('investorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const interestsSnapshot = await getDocs(interestsQuery);
      const interests = interestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Process data for dashboard
      const processedData = processDashboardData(pledges, interests, profile);
      setDashboardData(processedData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const processDashboardData = (pledges, interests, profile) => {
    const summary = {
      totalInvested: 0,
      totalValue: 0,
      activeInvestments: 0,
      pendingPledges: 0,
      returns: 0,
      returnPercentage: 0
    };

    const investmentBreakdown = { equity: 0, loans: 0, revenueShare: 0 };
    const geographicDistribution = {};
    const industryDistribution = {};
    const recentActivity = [];

    // Process pledges
    pledges.forEach(pledge => {
      if (pledge.mockInvestment) {
        summary.totalInvested += pledge.amount || 0;
        
        if (pledge.status === 'accepted' || pledge.status === 'completed') {
          summary.activeInvestments += 1;
          
          // Mock returns calculation (5-15% annual return)
          const mockReturn = pledge.amount * (Math.random() * 0.1 + 0.05);
          summary.returns += mockReturn;
          summary.totalValue += pledge.amount + mockReturn;
          
          // Investment type breakdown
          const type = pledge.investmentType;
          if (type === 'equity') investmentBreakdown.equity += pledge.amount;
          else if (type === 'loan') investmentBreakdown.loans += pledge.amount;
          else if (type === 'revenue_sharing') investmentBreakdown.revenueShare += pledge.amount;
          
        } else if (pledge.status === 'pending') {
          summary.pendingPledges += 1;
        }

        // Add to recent activity
        recentActivity.push({
          id: pledge.id,
          type: 'pledge',
          businessName: pledge.businessName,
          amount: pledge.amount,
          status: pledge.status,
          investmentType: pledge.investmentType,
          date: pledge.createdAt,
          description: `${pledge.investmentType.charAt(0).toUpperCase() + pledge.investmentType.slice(1)} investment of ${formatCurrency(pledge.amount, 'USD')}`
        });
      }
    });

    // Process interests
    interests.forEach(interest => {
      recentActivity.push({
        id: interest.id,
        type: 'interest',
        businessName: interest.businessName || 'Business',
        status: interest.status,
        date: interest.createdAt,
        description: 'Expressed interest in business'
      });
    });

    // Calculate return percentage
    if (summary.totalInvested > 0) {
      summary.returnPercentage = (summary.returns / summary.totalInvested) * 100;
    }

    // Sort recent activity by date
    recentActivity.sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB - dateA;
    });

    // Mock geographic and industry distribution
    geographicDistribution['Nigeria'] = 40;
    geographicDistribution['Kenya'] = 30;
    geographicDistribution['South Africa'] = 20;
    geographicDistribution['Ghana'] = 10;

    industryDistribution['Technology'] = 35;
    industryDistribution['Agriculture'] = 25;
    industryDistribution['Healthcare'] = 20;
    industryDistribution['Manufacturing'] = 20;

    return {
      portfolioSummary: summary,
      recentActivity: recentActivity.slice(0, 10),
      topPerforming: pledges.filter(p => p.status === 'accepted').slice(0, 5),
      investmentBreakdown,
      geographicDistribution,
      industryDistribution
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
      case 'completed':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'rejected':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusIcon = (status, type) => {
    if (type === 'pledge') {
      switch (status) {
        case 'accepted': return '✅';
        case 'completed': return '🎉';
        case 'pending': return '⏳';
        case 'rejected': return '❌';
        default: return '📝';
      }
    } else {
      switch (status) {
        case 'accepted': return '🤝';
        case 'pending': return '💌';
        case 'rejected': return '📧';
        default: return '👀';
      }
    }
  };

  const renderPortfolioSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.sectionTitle}>💼 Portfolio Summary</Text>
      
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {formatCurrency(dashboardData.portfolioSummary.totalInvested, 'USD')}
          </Text>
          <Text style={styles.summaryLabel}>Total Invested</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {formatCurrency(dashboardData.portfolioSummary.totalValue, 'USD')}
          </Text>
          <Text style={styles.summaryLabel}>Portfolio Value</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { 
            color: dashboardData.portfolioSummary.returns >= 0 ? '#28a745' : '#dc3545' 
          }]}>
            {dashboardData.portfolioSummary.returns >= 0 ? '+' : ''}
            {formatCurrency(dashboardData.portfolioSummary.returns, 'USD')}
          </Text>
          <Text style={styles.summaryLabel}>Total Returns</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={[styles.summaryValue, { 
            color: dashboardData.portfolioSummary.returnPercentage >= 0 ? '#28a745' : '#dc3545' 
          }]}>
            {dashboardData.portfolioSummary.returnPercentage >= 0 ? '+' : ''}
            {dashboardData.portfolioSummary.returnPercentage.toFixed(1)}%
          </Text>
          <Text style={styles.summaryLabel}>Return Rate</Text>
        </View>
      </View>

      <View style={styles.investmentStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{dashboardData.portfolioSummary.activeInvestments}</Text>
          <Text style={styles.statLabel}>Active Investments</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{dashboardData.portfolioSummary.pendingPledges}</Text>
          <Text style={styles.statLabel}>Pending Pledges</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {investorProfile ? Object.keys(dashboardData.geographicDistribution).length : 0}
          </Text>
          <Text style={styles.statLabel}>Countries</Text>
        </View>
      </View>
    </View>
  );

  const renderInvestmentBreakdown = () => (
    <View style={styles.breakdownContainer}>
      <Text style={styles.sectionTitle}>📊 Investment Breakdown</Text>
      
      <View style={styles.breakdownGrid}>
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownIcon}>💼</Text>
          <Text style={styles.breakdownType}>Equity</Text>
          <Text style={styles.breakdownValue}>
            {formatCurrency(dashboardData.investmentBreakdown.equity, 'USD')}
          </Text>
          <Text style={styles.breakdownPercentage}>
            {dashboardData.portfolioSummary.totalInvested > 0 ? 
              ((dashboardData.investmentBreakdown.equity / dashboardData.portfolioSummary.totalInvested) * 100).toFixed(0) : 0}%
          </Text>
        </View>
        
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownIcon}>💰</Text>
          <Text style={styles.breakdownType}>Loans</Text>
          <Text style={styles.breakdownValue}>
            {formatCurrency(dashboardData.investmentBreakdown.loans, 'USD')}
          </Text>
          <Text style={styles.breakdownPercentage}>
            {dashboardData.portfolioSummary.totalInvested > 0 ? 
              ((dashboardData.investmentBreakdown.loans / dashboardData.portfolioSummary.totalInvested) * 100).toFixed(0) : 0}%
          </Text>
        </View>
        
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownIcon}>📈</Text>
          <Text style={styles.breakdownType}>Rev Share</Text>
          <Text style={styles.breakdownValue}>
            {formatCurrency(dashboardData.investmentBreakdown.revenueShare, 'USD')}
          </Text>
          <Text style={styles.breakdownPercentage}>
            {dashboardData.portfolioSummary.totalInvested > 0 ? 
              ((dashboardData.investmentBreakdown.revenueShare / dashboardData.portfolioSummary.totalInvested) * 100).toFixed(0) : 0}%
          </Text>
        </View>
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View style={styles.activityContainer}>
      <View style={styles.activityHeader}>
        <Text style={styles.sectionTitle}>📋 Recent Activity</Text>
        <TouchableOpacity onPress={() => navigation.navigate('InvestmentHistory')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      {dashboardData.recentActivity.length > 0 ? (
        dashboardData.recentActivity.map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <Text style={styles.activityIcon}>
              {getStatusIcon(activity.status, activity.type)}
            </Text>
            <View style={styles.activityContent}>
              <Text style={styles.activityDescription} numberOfLines={1}>
                {activity.description}
              </Text>
              <Text style={styles.activityBusiness}>
                {activity.businessName}
              </Text>
              <Text style={styles.activityDate}>
                {activity.date?.toDate ? 
                  activity.date.toDate().toLocaleDateString() : 
                  new Date(activity.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.activityStatus}>
              <Text style={[styles.statusBadge, { 
                backgroundColor: getStatusColor(activity.status) + '20',
                color: getStatusColor(activity.status)
              }]}>
                {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
              </Text>
              {activity.amount && (
                <Text style={styles.activityAmount}>
                  {formatCurrency(activity.amount, 'USD')}
                </Text>
              )}
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyActivity}>
          <Text style={styles.emptyActivityText}>No recent activity</Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => navigation.navigate('InvestmentSearch')}
          >
            <Text style={styles.exploreButtonText}>🔍 Explore Opportunities</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.actionsContainer}>
      <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
      
      <View style={styles.actionsGrid}>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('InvestmentSearch')}
        >
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionLabel}>Find Investments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('InvestorProfile')}
        >
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionLabel}>Update Preferences</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('InvestmentHistory')}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionLabel}>View Portfolio</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('MarketInsights')}
        >
          <Text style={styles.actionIcon}>🌍</Text>
          <Text style={styles.actionLabel}>Market Insights</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>📊 Loading your investment dashboard...</Text>
          <Text style={styles.loadingSubtext}>Analyzing portfolio performance</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Investment Dashboard</Text>
        <Text style={styles.subtitle}>
          Welcome back, {investorProfile?.name || userProfile?.name || 'Investor'}!
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderPortfolioSummary()}
        {renderInvestmentBreakdown()}
        {renderRecentActivity()}
        {renderQuickActions()}

        {/* Mock Investment Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ <Text style={styles.disclaimerBold}>Demo Portfolio:</Text> This dashboard shows mock 
            investment data for demonstration purposes. No real funds are involved in any transactions 
            shown here. All returns and values are simulated.
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  
  // Portfolio Summary Styles
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  investmentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D8F',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  
  // Investment Breakdown Styles
  breakdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  breakdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  breakdownIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  breakdownType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  breakdownPercentage: {
    fontSize: 12,
    color: '#2E7D8F',
    fontWeight: '600',
  },
  
  // Recent Activity Styles
  activityContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2E7D8F',
    fontWeight: '600',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  activityContent: {
    flex: 1,
    marginRight: 10,
  },
  activityDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activityBusiness: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 11,
    color: '#999',
  },
  activityStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 2,
  },
  activityAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D8F',
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyActivityText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  exploreButton: {
    backgroundColor: '#2E7D8F',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Quick Actions Styles
  actionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Disclaimer
  disclaimer: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 16,
  },
  disclaimerBold: {
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 30,
  },
});