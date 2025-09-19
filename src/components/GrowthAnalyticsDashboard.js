/**
 * Growth Analytics Dashboard Component
 * Comprehensive tracking and visualization of investor acquisition metrics
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { FirebaseService } from '../services/firebase/FirebaseService';
import { growthEngine } from '../services/GrowthEngineering';

const { width } = Dimensions.get('window');

export default function GrowthAnalyticsDashboard({ navigation }) {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [analytics, setAnalytics] = useState({
    overview: {},
    acquisition: {},
    engagement: {},
    conversion: {},
    revenue: {},
    viral: {}
  });

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const analyticsData = await Promise.all([
        loadOverviewMetrics(),
        loadAcquisitionMetrics(),
        loadEngagementMetrics(),
        loadConversionMetrics(),
        loadRevenueMetrics(),
        loadViralMetrics()
      ]);

      setAnalytics({
        overview: analyticsData[0],
        acquisition: analyticsData[1],
        engagement: analyticsData[2],
        conversion: analyticsData[3],
        revenue: analyticsData[4],
        viral: analyticsData[5]
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOverviewMetrics = async () => {
    // Simulate loading overview metrics
    return {
      totalInvestors: 2847,
      newInvestors: 156,
      totalInvested: 18750000,
      monthlyGrowth: 12.3,
      conversionRate: 15.8,
      avgInvestmentSize: 24500
    };
  };

  const loadAcquisitionMetrics = async () => {
    return {
      totalSignups: 1247,
      qualifiedLeads: 856,
      channelBreakdown: [
        { channel: 'LinkedIn Ads', signups: 425, cost: 8500, cpl: 20 },
        { channel: 'Google Ads', signups: 312, cost: 9360, cpl: 30 },
        { channel: 'Referrals', signups: 298, cost: 2980, cpl: 10 },
        { channel: 'Content Marketing', signups: 156, cost: 3120, cpl: 20 },
        { channel: 'Partnerships', signups: 56, cost: 1120, cpl: 20 }
      ],
      costPerLead: 22.5,
      leadQualityScore: 72
    };
  };

  const loadEngagementMetrics = async () => {
    return {
      emailMetrics: {
        openRate: 38.5,
        clickRate: 8.2,
        unsubscribeRate: 1.1,
        totalSent: 15420,
        totalOpened: 5937,
        totalClicked: 1264
      },
      webEngagement: {
        avgTimeOnSite: 285,
        pageViews: 45632,
        bounceRate: 32.1,
        returnVisitors: 68.4
      },
      contentPerformance: [
        { title: 'African Investment Guide', views: 3420, conversions: 89 },
        { title: 'Success Stories Blog', views: 2156, conversions: 45 },
        { title: 'Market Analysis Report', views: 1890, conversions: 67 }
      ]
    };
  };

  const loadConversionMetrics = async () => {
    return {
      funnelData: [
        { stage: 'Landing Page Visits', count: 12450, conversionRate: 100 },
        { stage: 'Email Signups', count: 1247, conversionRate: 10.0 },
        { stage: 'Qualified Leads', count: 856, conversionRate: 68.6 },
        { stage: 'First Investment', count: 198, conversionRate: 23.1 },
        { stage: 'Repeat Investment', count: 87, conversionRate: 43.9 }
      ],
      conversionBySource: [
        { source: 'Referral', rate: 28.5 },
        { source: 'LinkedIn', rate: 18.2 },
        { source: 'Google', rate: 15.7 },
        { source: 'Direct', rate: 12.1 },
        { source: 'Content', rate: 9.8 }
      ],
      timeToConversion: {
        average: 14.5,
        median: 8.0,
        distribution: [
          { period: '0-7 days', percentage: 35 },
          { period: '8-14 days', percentage: 28 },
          { period: '15-30 days', percentage: 22 },
          { period: '30+ days', percentage: 15 }
        ]
      }
    };
  };

  const loadRevenueMetrics = async () => {
    return {
      totalRevenue: 187500,
      monthlyRecurringRevenue: 15625,
      averageRevenuePerUser: 895,
      customerLifetimeValue: 3250,
      revenueBySegment: [
        { segment: 'High Capacity', revenue: 89250, percentage: 47.6 },
        { segment: 'Mid Capacity', revenue: 56250, percentage: 30.0 },
        { segment: 'Starter', revenue: 28125, percentage: 15.0 },
        { segment: 'Other', revenue: 13875, percentage: 7.4 }
      ]
    };
  };

  const loadViralMetrics = async () => {
    return {
      viralCoefficient: 1.34,
      referralStats: {
        totalReferrals: 298,
        successfulReferrals: 198,
        conversionRate: 66.4,
        totalRewardsPaid: 29800
      },
      socialSharing: {
        totalShares: 1456,
        shareClicks: 892,
        shareConversions: 78,
        platformBreakdown: [
          { platform: 'LinkedIn', shares: 623, clicks: 445 },
          { platform: 'WhatsApp', shares: 412, clicks: 289 },
          { platform: 'Twitter', shares: 287, clicks: 158 },
          { platform: 'Other', shares: 134, clicks: 0 }
        ]
      },
      networkEffects: {
        averageConnectionsPerUser: 2.8,
        networkGrowthRate: 15.2,
        clusteringCoefficient: 0.42
      }
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const renderOverviewCards = () => (
    <View style={styles.overviewSection}>
      <Text style={styles.sectionTitle}>Growth Overview</Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <LinearGradient
            colors={['#2E7D8F', '#3A9BB0']}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>{formatNumber(analytics.overview.totalInvestors)}</Text>
            <Text style={styles.metricLabel}>Total Investors</Text>
            <Text style={styles.metricChange}>+{analytics.overview.newInvestors} this month</Text>
          </LinearGradient>
        </View>

        <View style={styles.metricCard}>
          <LinearGradient
            colors={['#28a745', '#34ce57']}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>{formatCurrency(analytics.overview.totalInvested)}</Text>
            <Text style={styles.metricLabel}>Total Invested</Text>
            <Text style={styles.metricChange}>+{formatPercentage(analytics.overview.monthlyGrowth)} growth</Text>
          </LinearGradient>
        </View>

        <View style={styles.metricCard}>
          <LinearGradient
            colors={['#FF6B35', '#FF8A5C']}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>{formatPercentage(analytics.overview.conversionRate)}</Text>
            <Text style={styles.metricLabel}>Conversion Rate</Text>
            <Text style={styles.metricChange}>Industry avg: 8.2%</Text>
          </LinearGradient>
        </View>

        <View style={styles.metricCard}>
          <LinearGradient
            colors={['#6f42c1', '#8e5fd1']}
            style={styles.metricGradient}
          >
            <Text style={styles.metricValue}>{formatCurrency(analytics.overview.avgInvestmentSize)}</Text>
            <Text style={styles.metricLabel}>Avg Investment</Text>
            <Text style={styles.metricChange}>Per investor</Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  );

  const renderAcquisitionMetrics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Investor Acquisition</Text>
      
      <View style={styles.acquisitionSummary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatNumber(analytics.acquisition.totalSignups)}</Text>
          <Text style={styles.summaryLabel}>Total Signups</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatNumber(analytics.acquisition.qualifiedLeads)}</Text>
          <Text style={styles.summaryLabel}>Qualified Leads</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>${analytics.acquisition.costPerLead}</Text>
          <Text style={styles.summaryLabel}>Cost Per Lead</Text>
        </View>
      </View>

      <Text style={styles.subsectionTitle}>Channel Performance</Text>
      {analytics.acquisition.channelBreakdown.map((channel, index) => (
        <View key={index} style={styles.channelRow}>
          <View style={styles.channelInfo}>
            <Text style={styles.channelName}>{channel.channel}</Text>
            <Text style={styles.channelMetrics}>
              {channel.signups} signups • ${channel.cpl} CPL
            </Text>
          </View>
          <View style={styles.channelCost}>
            <Text style={styles.channelCostValue}>{formatCurrency(channel.cost)}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderConversionFunnel = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Conversion Funnel</Text>
      
      {analytics.conversion.funnelData.map((stage, index) => (
        <View key={index} style={styles.funnelStage}>
          <View style={styles.funnelInfo}>
            <Text style={styles.funnelStageLabel}>{stage.stage}</Text>
            <Text style={styles.funnelStageCount}>{formatNumber(stage.count)}</Text>
          </View>
          <View style={styles.funnelBar}>
            <View 
              style={[
                styles.funnelBarFill,
                { width: `${stage.conversionRate}%` }
              ]} 
            />
            <Text style={styles.funnelRate}>{formatPercentage(stage.conversionRate)}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.subsectionTitle}>Time to Conversion</Text>
      <View style={styles.conversionTime}>
        <Text style={styles.conversionTimeText}>
          Average: {analytics.conversion.timeToConversion.average} days
        </Text>
        <Text style={styles.conversionTimeText}>
          Median: {analytics.conversion.timeToConversion.median} days
        </Text>
      </View>
    </View>
  );

  const renderEngagementMetrics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Engagement Metrics</Text>
      
      <Text style={styles.subsectionTitle}>Email Performance</Text>
      <View style={styles.engagementGrid}>
        <View style={styles.engagementCard}>
          <Text style={styles.engagementValue}>{formatPercentage(analytics.engagement.emailMetrics.openRate)}</Text>
          <Text style={styles.engagementLabel}>Open Rate</Text>
        </View>
        <View style={styles.engagementCard}>
          <Text style={styles.engagementValue}>{formatPercentage(analytics.engagement.emailMetrics.clickRate)}</Text>
          <Text style={styles.engagementLabel}>Click Rate</Text>
        </View>
        <View style={styles.engagementCard}>
          <Text style={styles.engagementValue}>{formatPercentage(analytics.engagement.emailMetrics.unsubscribeRate)}</Text>
          <Text style={styles.engagementLabel}>Unsubscribe</Text>
        </View>
      </View>

      <Text style={styles.subsectionTitle}>Content Performance</Text>
      {analytics.engagement.contentPerformance.map((content, index) => (
        <View key={index} style={styles.contentRow}>
          <View style={styles.contentInfo}>
            <Text style={styles.contentTitle}>{content.title}</Text>
            <Text style={styles.contentMetrics}>
              {formatNumber(content.views)} views • {content.conversions} conversions
            </Text>
          </View>
          <Text style={styles.contentConversion}>
            {((content.conversions / content.views) * 100).toFixed(1)}%
          </Text>
        </View>
      ))}
    </View>
  );

  const renderViralMetrics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Viral Growth</Text>
      
      <View style={styles.viralSummary}>
        <View style={styles.viralCard}>
          <Text style={styles.viralValue}>{analytics.viral.viralCoefficient}</Text>
          <Text style={styles.viralLabel}>Viral Coefficient</Text>
          <Text style={styles.viralNote}>Target: >1.0</Text>
        </View>
        <View style={styles.viralCard}>
          <Text style={styles.viralValue}>{formatNumber(analytics.viral.referralStats.totalReferrals)}</Text>
          <Text style={styles.viralLabel}>Total Referrals</Text>
          <Text style={styles.viralNote}>{formatPercentage(analytics.viral.referralStats.conversionRate)} convert</Text>
        </View>
      </View>

      <Text style={styles.subsectionTitle}>Social Sharing</Text>
      {analytics.viral.socialSharing.platformBreakdown.map((platform, index) => (
        <View key={index} style={styles.socialRow}>
          <Text style={styles.socialPlatform}>{platform.platform}</Text>
          <View style={styles.socialMetrics}>
            <Text style={styles.socialShares}>{formatNumber(platform.shares)} shares</Text>
            <Text style={styles.socialClicks}>{formatNumber(platform.clicks)} clicks</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderDateRangeSelector = () => (
    <View style={styles.dateRangeSelector}>
      {['7d', '30d', '90d', '1y'].map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.dateRangeButton,
            dateRange === range && styles.dateRangeButtonActive
          ]}
          onPress={() => setDateRange(range)}
        >
          <Text
            style={[
              styles.dateRangeText,
              dateRange === range && styles.dateRangeTextActive
            ]}
          >
            {range}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Growth Analytics</Text>
        <Text style={styles.subtitle}>Investor acquisition and engagement insights</Text>
        {renderDateRangeSelector()}
      </View>

      {renderOverviewCards()}
      {renderAcquisitionMetrics()}
      {renderConversionFunnel()}
      {renderEngagementMetrics()}
      {renderViralMetrics()}

      <View style={styles.exportSection}>
        <TouchableOpacity style={styles.exportButton}>
          <Text style={styles.exportButtonText}>📊 Export Report</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    marginBottom: 20,
  },
  dateRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
  },
  dateRangeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  dateRangeButtonActive: {
    backgroundColor: '#2E7D8F',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  dateRangeTextActive: {
    color: '#fff',
  },
  
  // Overview Section
  overviewSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  metricGradient: {
    padding: 20,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 3,
  },
  metricChange: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },

  // Section Styles
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },

  // Acquisition Styles
  acquisitionSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D8F',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  channelMetrics: {
    fontSize: 12,
    color: '#666',
  },
  channelCost: {
    alignItems: 'flex-end',
  },
  channelCostValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },

  // Conversion Funnel Styles
  funnelStage: {
    marginBottom: 15,
  },
  funnelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  funnelStageLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  funnelStageCount: {
    fontSize: 14,
    color: '#666',
  },
  funnelBar: {
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  funnelBarFill: {
    height: '100%',
    backgroundColor: '#2E7D8F',
    borderRadius: 12,
    position: 'absolute',
    left: 0,
  },
  funnelRate: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  conversionTime: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
  },
  conversionTimeText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },

  // Engagement Styles
  engagementGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  engagementCard: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  engagementValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D8F',
    marginBottom: 5,
  },
  engagementLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  contentMetrics: {
    fontSize: 12,
    color: '#666',
  },
  contentConversion: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },

  // Viral Metrics Styles
  viralSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  viralCard: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  viralValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D8F',
    marginBottom: 5,
  },
  viralLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  },
  viralNote: {
    fontSize: 12,
    color: '#666',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  socialPlatform: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  socialMetrics: {
    alignItems: 'flex-end',
  },
  socialShares: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  socialClicks: {
    fontSize: 12,
    color: '#666',
  },

  // Export Section
  exportSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  exportButton: {
    backgroundColor: '#2E7D8F',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
});