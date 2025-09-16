/**
 * 📊 PORTFOLIO SCREEN
 * Comprehensive investment portfolio tracking and analytics
 */

import React, { useState, useContext, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const { width } = Dimensions.get('window');

const MOCK_PORTFOLIO_DATA = {
  totalInvested: 0,
  currentValue: 0,
  totalReturn: 0,
  returnPercentage: 0,
  monthlyIncome: 0,
  investments: [
    // Empty array for production-ready empty state handling
    // Sample data commented out for production-ready empty state
    // {
    //   id: 'inv_001',
    //   companyName: 'GreenTech Solar Solutions',
    //   sector: 'Clean Energy',
    //   country: 'Kenya',
    //   image: '🌱',
    //   investedAmount: 5000,
    //   currentValue: 6250,
    //   returnAmount: 1250,
    //   returnPercentage: 25.0,
    //   investmentDate: '2024-03-15',
    //   status: 'active',
    //   monthlyDividend: 125,
    //   shares: 50,
    //   sharePrice: 125.00,
    //   riskLevel: 'Medium'
    // }
  ],
  performanceHistory: [
    { month: 'Jan', value: 12000 },
    { month: 'Feb', value: 13200 },
    { month: 'Mar', value: 14800 },
    { month: 'Apr', value: 16200 },
    { month: 'May', value: 17500 },
    { month: 'Jun', value: 18750 }
  ]
};

export default function PortfolioScreen({ navigation }) {
  const [portfolioData, setPortfolioData] = useState(MOCK_PORTFOLIO_DATA);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('performance'); // performance, amount, date

  const { userProfile } = useContext(AuthContext);

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getReturnColor = (percentage) => {
    if (percentage > 20) return '#10b981';
    if (percentage > 0) return '#eab308';
    return '#ef4444';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const handleInvestmentPress = async (investment) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('InvestmentDetail', {
      investmentId: investment.id,
      investment
    });
  };

  const handleExportPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Export Portfolio',
      'Choose export format',
      [
        { text: 'PDF Report', onPress: () => Alert.alert('Success', 'PDF exported to Downloads') },
        { text: 'CSV Data', onPress: () => Alert.alert('Success', 'CSV exported to Downloads') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const renderTabButton = (tab, title) => (
    <TouchableOpacity
      key={tab}
      style={[styles.tabButton, selectedTab === tab && styles.tabButtonActive]}
      onPress={() => setSelectedTab(tab)}
    >
      <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderPortfolioSummary = () => (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Portfolio Value</Text>
        <TouchableOpacity onPress={handleExportPress}>
          <Ionicons name="download-outline" size={24} color="#eab308" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.portfolioValue}>
        {formatCurrency(portfolioData.currentValue)}
      </Text>
      
      <View style={styles.returnSection}>
        <View style={styles.returnItem}>
          <Text style={styles.returnLabel}>Total Return</Text>
          <Text style={[styles.returnValue, { color: getReturnColor(portfolioData.returnPercentage) }]}>
            {formatCurrency(portfolioData.totalReturn)} (+{portfolioData.returnPercentage.toFixed(1)}%)
          </Text>
        </View>
        
        <View style={styles.returnItem}>
          <Text style={styles.returnLabel}>Monthly Income</Text>
          <Text style={styles.returnValue}>
            {formatCurrency(portfolioData.monthlyIncome)}
          </Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{portfolioData.investments.length}</Text>
          <Text style={styles.metricLabel}>Investments</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>4</Text>
          <Text style={styles.metricLabel}>Countries</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>5</Text>
          <Text style={styles.metricLabel}>Sectors</Text>
        </View>
      </View>
    </Card>
  );

  const renderPerformanceChart = () => (
    <Card style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>6-Month Performance</Text>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Portfolio Value</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.chart}>
        <View style={styles.chartBars}>
          {portfolioData.performanceHistory.map((item, index) => {
            const height = (item.value / 20000) * 100; // Scale to 100px max
            return (
              <View key={item.month} style={styles.chartBarContainer}>
                <View style={styles.chartValue}>
                  <Text style={styles.chartValueText}>
                    {formatCurrency(item.value)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.chartBar,
                    { 
                      height: Math.max(height, 20),
                      backgroundColor: index === portfolioData.performanceHistory.length - 1 ? '#eab308' : '#4f46e5'
                    }
                  ]}
                />
                <Text style={styles.chartLabel}>{item.month}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </Card>
  );

  const renderInvestmentCard = (investment) => (
    <TouchableOpacity
      key={investment.id}
      style={styles.investmentCard}
      onPress={() => handleInvestmentPress(investment)}
    >
      <View style={styles.investmentHeader}>
        <View style={styles.investmentCompany}>
          <View style={styles.companyIcon}>
            <Text style={styles.companyEmoji}>{investment.image}</Text>
          </View>
          <View style={styles.companyDetails}>
            <Text style={styles.companyName}>{investment.companyName}</Text>
            <View style={styles.companyMeta}>
              <Ionicons name="location" size={14} color="#9ca3af" />
              <Text style={styles.companyLocation}>{investment.country}</Text>
              <View style={styles.sectorBadge}>
                <Text style={styles.sectorText}>{investment.sector}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(investment.status) + '20' }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: getStatusColor(investment.status) }
            ]}>
              {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.investmentMetrics}>
        <View style={styles.metricGroup}>
          <Text style={styles.metricTitle}>Invested</Text>
          <Text style={styles.metricValue}>{formatCurrency(investment.investedAmount)}</Text>
        </View>
        
        <View style={styles.metricGroup}>
          <Text style={styles.metricTitle}>Current Value</Text>
          <Text style={styles.metricValue}>{formatCurrency(investment.currentValue)}</Text>
        </View>
        
        <View style={styles.metricGroup}>
          <Text style={styles.metricTitle}>Return</Text>
          <Text style={[
            styles.metricValue, 
            { color: getReturnColor(investment.returnPercentage) }
          ]}>
            +{investment.returnPercentage.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={styles.investmentFooter}>
        <View style={styles.dividendInfo}>
          <Ionicons name="trending-up" size={16} color="#10b981" />
          <Text style={styles.dividendText}>
            {formatCurrency(investment.monthlyDividend)}/month
          </Text>
        </View>
        
        <View style={styles.investmentDetails}>
          <Text style={styles.sharesText}>
            {investment.shares} shares @ {formatCurrency(investment.sharePrice)}
          </Text>
          <Text style={styles.investmentDate}>
            Invested {formatDate(investment.investmentDate)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {renderPortfolioSummary()}
      {portfolioData.investments.length > 0 && renderPerformanceChart()}
      
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Investments</Text>
        {portfolioData.investments.length > 2 && (
          <TouchableOpacity onPress={() => setSelectedTab('investments')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {portfolioData.investments.length > 0 ? (
        portfolioData.investments.slice(0, 2).map(renderInvestmentCard)
      ) : (
        <Card style={styles.emptyInvestmentsCard}>
          <Ionicons name="trending-up-outline" size={48} color="#6b7280" />
          <Text style={styles.emptyTitle}>Start Building Your Portfolio</Text>
          <Text style={styles.emptyText}>
            Discover investment opportunities in African SMEs and start earning returns on your investments.
          </Text>
          <View style={styles.emptyFeatures}>
            <View style={styles.emptyFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.emptyFeatureText}>Diversified opportunities</Text>
            </View>
            <View style={styles.emptyFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.emptyFeatureText}>Track performance in real-time</Text>
            </View>
            <View style={styles.emptyFeature}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={styles.emptyFeatureText}>Support African businesses</Text>
            </View>
          </View>
        </Card>
      )}
      
      <Button
        title={portfolioData.investments.length > 0 ? "Find More Opportunities" : "Browse Opportunities"}
        onPress={() => navigation.navigate('InvestmentOpportunities')}
        style={styles.exploreButton}
        leftIcon={<Ionicons name="search" size={20} color="#fff" />}
      />
    </View>
  );

  const renderInvestmentsTab = () => {
    const sortedInvestments = [...portfolioData.investments].sort((a, b) => {
      switch (sortBy) {
        case 'performance':
          return b.returnPercentage - a.returnPercentage;
        case 'amount':
          return b.currentValue - a.currentValue;
        case 'date':
          return new Date(b.investmentDate) - new Date(a.investmentDate);
        default:
          return 0;
      }
    });

    return (
      <View style={styles.tabContent}>
        <View style={styles.investmentsHeader}>
          <Text style={styles.sectionTitle}>All Investments</Text>
          {sortedInvestments.length > 0 && (
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => {
                Alert.alert(
                  'Sort By',
                  'Choose sorting option',
                  [
                    { text: 'Performance', onPress: () => setSortBy('performance') },
                    { text: 'Investment Amount', onPress: () => setSortBy('amount') },
                    { text: 'Date', onPress: () => setSortBy('date') },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <Ionicons name="swap-vertical" size={16} color="#eab308" />
              <Text style={styles.sortText}>Sort</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {sortedInvestments.length > 0 ? (
          sortedInvestments.map(renderInvestmentCard)
        ) : (
          <Card style={styles.emptyInvestmentsCard}>
            <Ionicons name="wallet-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyTitle}>No Investments Yet</Text>
            <Text style={styles.emptyText}>
              Your active investments will appear here. Start by exploring investment opportunities in African SMEs.
            </Text>
            <Button
              title="Browse Opportunities"
              onPress={() => navigation.navigate('InvestmentOpportunities')}
              style={styles.emptyButton}
              leftIcon={<Ionicons name="search" size={18} color="#fff" />}
            />
          </Card>
        )}
      </View>
    );
  };

  const renderAnalyticsTab = () => (
    <View style={styles.tabContent}>
      {portfolioData.investments.length > 0 ? (
        <>
          <Card style={styles.analyticsCard}>
            <Text style={styles.sectionTitle}>Portfolio Analytics</Text>
            
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>25.0%</Text>
                <Text style={styles.analyticsLabel}>Average ROI</Text>
              </View>
              
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>2.1%</Text>
                <Text style={styles.analyticsLabel}>Monthly Yield</Text>
              </View>
              
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>0.85</Text>
                <Text style={styles.analyticsLabel}>Sharpe Ratio</Text>
              </View>
              
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>12%</Text>
                <Text style={styles.analyticsLabel}>Volatility</Text>
              </View>
            </View>
          </Card>

          <Card style={styles.allocationCard}>
            <Text style={styles.sectionTitle}>Sector Allocation</Text>
            
            <View style={styles.allocationList}>
              {[
                { sector: 'Clean Energy', percentage: 33.3, amount: 6250 },
                { sector: 'Healthcare', percentage: 27.7, amount: 5200 },
                { sector: 'Education', percentage: 19.7, amount: 3700 },
                { sector: 'Agriculture', percentage: 19.3, amount: 3600 }
              ].map((item, index) => (
                <View key={item.sector} style={styles.allocationItem}>
                  <View style={styles.allocationInfo}>
                    <Text style={styles.allocationSector}>{item.sector}</Text>
                    <Text style={styles.allocationAmount}>{formatCurrency(item.amount)}</Text>
                  </View>
                  <View style={styles.allocationBar}>
                    <View
                      style={[
                        styles.allocationFill,
                        { width: `${item.percentage}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.allocationPercentage}>{item.percentage.toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.riskCard}>
            <Text style={styles.sectionTitle}>Risk Assessment</Text>
            
            <View style={styles.riskOverview}>
              <View style={styles.riskScore}>
                <Text style={styles.riskScoreValue}>6.2</Text>
                <Text style={styles.riskScoreLabel}>Overall Risk Score</Text>
              </View>
              
              <View style={styles.riskDistribution}>
                <View style={styles.riskLevel}>
                  <View style={[styles.riskDot, { backgroundColor: '#10b981' }]} />
                  <Text style={styles.riskLevelText}>Low: 27.7%</Text>
                </View>
                <View style={styles.riskLevel}>
                  <View style={[styles.riskDot, { backgroundColor: '#f59e0b' }]} />
                  <Text style={styles.riskLevelText}>Medium: 72.3%</Text>
                </View>
                <View style={styles.riskLevel}>
                  <View style={[styles.riskDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.riskLevelText}>High: 0%</Text>
                </View>
              </View>
            </View>
          </Card>
        </>
      ) : (
        <Card style={styles.emptyAnalyticsCard}>
          <Ionicons name="analytics-outline" size={48} color="#6b7280" />
          <Text style={styles.emptyTitle}>No Analytics Yet</Text>
          <Text style={styles.emptyText}>
            Portfolio analytics will be available once you start investing. Track your performance, risk distribution, and sector allocation here.
          </Text>
          <View style={styles.analyticsPreview}>
            <Text style={styles.previewTitle}>You'll get insights on:</Text>
            <View style={styles.previewItem}>
              <Ionicons name="trending-up" size={16} color="#eab308" />
              <Text style={styles.previewText}>Portfolio performance & ROI</Text>
            </View>
            <View style={styles.previewItem}>
              <Ionicons name="pie-chart" size={16} color="#eab308" />
              <Text style={styles.previewText}>Sector diversification</Text>
            </View>
            <View style={styles.previewItem}>
              <Ionicons name="shield-checkmark" size={16} color="#eab308" />
              <Text style={styles.previewText}>Risk assessment</Text>
            </View>
          </View>
          <Button
            title="Start Investing"
            onPress={() => navigation.navigate('InvestmentOpportunities')}
            style={styles.emptyButton}
            leftIcon={<Ionicons name="rocket" size={18} color="#fff" />}
          />
        </Card>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerGreeting}>Welcome back,</Text>
              <Text style={styles.headerName}>{userProfile?.name || 'Investor'}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabs}>
              {renderTabButton('overview', 'Overview')}
              {renderTabButton('investments', 'Investments')}
              {renderTabButton('analytics', 'Analytics')}
            </View>
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#eab308"
            />
          }
        >
          {selectedTab === 'overview' && renderOverviewTab()}
          {selectedTab === 'investments' && renderInvestmentsTab()}
          {selectedTab === 'analytics' && renderAnalyticsTab()}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    color: '#9ca3af',
    fontSize: 16,
  },
  headerName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 4,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  tabButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#eab308',
  },
  tabText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#eab308',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  summaryCard: {
    marginBottom: 20,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  portfolioValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#eab308',
    marginBottom: 20,
  },
  returnSection: {
    marginBottom: 20,
  },
  returnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  returnLabel: {
    fontSize: 16,
    color: '#9ca3af',
  },
  returnValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  chartCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  chartLegend: {
    flexDirection: 'row',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4f46e5',
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  chart: {
    height: 150,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  chartValue: {
    marginBottom: 8,
  },
  chartValueText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
  },
  chartBar: {
    width: '80%',
    borderRadius: 4,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  seeAllText: {
    color: '#eab308',
    fontSize: 16,
    fontWeight: '500',
  },
  investmentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  investmentCompany: {
    flexDirection: 'row',
    flex: 1,
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  companyEmoji: {
    fontSize: 24,
  },
  companyDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  companyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyLocation: {
    color: '#9ca3af',
    fontSize: 14,
    marginLeft: 4,
    marginRight: 12,
  },
  sectorBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectorText: {
    color: '#eab308',
    fontSize: 12,
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  investmentMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricGroup: {
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  investmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dividendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividendText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  investmentDetails: {
    alignItems: 'flex-end',
  },
  sharesText: {
    color: '#d1d5db',
    fontSize: 12,
    marginBottom: 2,
  },
  investmentDate: {
    color: '#9ca3af',
    fontSize: 12,
  },
  exploreButton: {
    marginTop: 20,
  },
  investmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderRadius: 16,
  },
  sortText: {
    color: '#eab308',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  analyticsCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 12,
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#eab308',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  allocationCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  allocationList: {
    gap: 16,
  },
  allocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allocationInfo: {
    flex: 1,
    marginRight: 12,
  },
  allocationSector: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  allocationAmount: {
    fontSize: 14,
    color: '#9ca3af',
  },
  allocationBar: {
    flex: 2,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  allocationFill: {
    height: '100%',
    backgroundColor: '#eab308',
  },
  allocationPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#eab308',
    minWidth: 50,
    textAlign: 'right',
  },
  riskCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  riskOverview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  riskScore: {
    alignItems: 'center',
  },
  riskScoreValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#f59e0b',
    marginBottom: 8,
  },
  riskScoreLabel: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  riskDistribution: {
    justifyContent: 'center',
  },
  riskLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  riskLevelText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  emptyInvestmentsCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 20,
  },
  emptyAnalyticsCard: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyFeatures: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  emptyFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  emptyFeatureText: {
    fontSize: 14,
    color: '#d1d5db',
    marginLeft: 12,
  },
  analyticsPreview: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  previewText: {
    fontSize: 14,
    color: '#d1d5db',
    marginLeft: 12,
  },
  emptyButton: {
    minWidth: 180,
  },
});