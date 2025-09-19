import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import InvestmentService from '../../services/firebase/InvestmentService';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const InvestmentHistoryScreen = () => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, completed, pending
  const [totalInvested, setTotalInvested] = useState(0);
  const [activeInvestments, setActiveInvestments] = useState(0);
  const [totalReturns, setTotalReturns] = useState(0);

  useEffect(() => {
    loadInvestmentHistory();
  }, []);

  const loadInvestmentHistory = async () => {
    try {
      setLoading(true);
      const investmentData = await InvestmentService.getInvestorHistory(currentUser.uid);
      setInvestments(investmentData);
      calculateSummary(investmentData);
    } catch (error) {
      console.error('Error loading investment history:', error);
      Alert.alert('Error', 'Failed to load investment history');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (investmentData) => {
    let total = 0;
    let active = 0;
    let returns = 0;

    investmentData.forEach(investment => {
      total += investment.amount || 0;
      if (investment.status === 'active' || investment.status === 'funded') {
        active += 1;
        returns += (investment.currentValue || investment.amount) - investment.amount;
      }
    });

    setTotalInvested(total);
    setActiveInvestments(active);
    setTotalReturns(returns);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvestmentHistory();
    setRefreshing(false);
  };

  const getFilteredInvestments = () => {
    if (filter === 'all') return investments;
    return investments.filter(investment => {
      switch (filter) {
        case 'active':
          return investment.status === 'active' || investment.status === 'funded';
        case 'completed':
          return investment.status === 'completed' || investment.status === 'exited';
        case 'pending':
          return investment.status === 'pending' || investment.status === 'interested';
        default:
          return true;
      }
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'funded':
        return '#10B981';
      case 'pending':
      case 'interested':
        return '#F59E0B';
      case 'completed':
      case 'exited':
        return '#6B7280';
      case 'failed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'funded':
        return 'checkmark-circle';
      case 'pending':
      case 'interested':
        return 'time';
      case 'completed':
      case 'exited':
        return 'trophy';
      case 'failed':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const handleInvestmentPress = (investment) => {
    navigation.navigate('BusinessDetail', { businessId: investment.businessId });
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {[
        { key: 'all', label: 'All' },
        { key: 'active', label: 'Active' },
        { key: 'pending', label: 'Pending' },
        { key: 'completed', label: 'Completed' }
      ].map(filterOption => (
        <TouchableOpacity
          key={filterOption.key}
          style={[
            styles.filterButton,
            filter === filterOption.key && styles.filterButtonActive
          ]}
          onPress={() => setFilter(filterOption.key)}
        >
          <Text style={[
            styles.filterButtonText,
            filter === filterOption.key && styles.filterButtonTextActive
          ]}>
            {filterOption.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSummaryCards = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons name="wallet" size={24} color="#4F46E5" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryValue}>{formatCurrency(totalInvested)}</Text>
          <Text style={styles.summaryLabel}>Total Invested</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons name="trending-up" size={24} color="#10B981" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={[styles.summaryValue, { color: totalReturns >= 0 ? '#10B981' : '#EF4444' }]}>
            {formatCurrency(totalReturns)}
          </Text>
          <Text style={styles.summaryLabel}>Total Returns</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons name="briefcase" size={24} color="#F59E0B" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryValue}>{activeInvestments}</Text>
          <Text style={styles.summaryLabel}>Active Investments</Text>
        </View>
      </View>
    </View>
  );

  const renderInvestmentItem = (investment) => (
    <TouchableOpacity
      key={investment.id}
      style={styles.investmentCard}
      onPress={() => handleInvestmentPress(investment)}
    >
      <View style={styles.investmentHeader}>
        <View style={styles.businessInfo}>
          <View style={styles.businessLogo}>
            <Text style={styles.businessLogoText}>
              {investment.businessName?.charAt(0).toUpperCase() || 'B'}
            </Text>
          </View>
          <View style={styles.businessDetails}>
            <Text style={styles.businessName}>{investment.businessName}</Text>
            <Text style={styles.investmentDate}>
              Invested: {formatDate(investment.createdAt)}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(investment.status) }]}>
          <Ionicons 
            name={getStatusIcon(investment.status)} 
            size={16} 
            color="#FFFFFF" 
          />
        </View>
      </View>

      <View style={styles.investmentMetrics}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Amount</Text>
          <Text style={styles.metricValue}>{formatCurrency(investment.amount || 0)}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Current Value</Text>
          <Text style={[
            styles.metricValue,
            { color: (investment.currentValue || investment.amount) >= investment.amount ? '#10B981' : '#EF4444' }
          ]}>
            {formatCurrency(investment.currentValue || investment.amount)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Return</Text>
          <Text style={[
            styles.metricValue,
            { color: ((investment.currentValue || investment.amount) - investment.amount) >= 0 ? '#10B981' : '#EF4444' }
          ]}>
            {((investment.currentValue || investment.amount) - investment.amount) >= 0 ? '+' : ''}
            {formatCurrency((investment.currentValue || investment.amount) - investment.amount)}
          </Text>
        </View>
      </View>

      <View style={styles.investmentFooter}>
        <Text style={styles.investmentType}>
          {investment.type || 'Equity'} • {investment.status || 'Pending'}
        </Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min((investment.progress || 0) * 100, 100)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{Math.round((investment.progress || 0) * 100)}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Investment History</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading investment history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredInvestments = getFilteredInvestments();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Investment History</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Filter Buttons */}
        {renderFilterButtons()}

        {/* Investment List */}
        <View style={styles.investmentsList}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {filter === 'all' ? 'All Investments' : 
               filter === 'active' ? 'Active Investments' :
               filter === 'pending' ? 'Pending Investments' :
               'Completed Investments'}
            </Text>
            <Text style={styles.listCount}>({filteredInvestments.length})</Text>
          </View>

          {filteredInvestments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>
                {filter === 'all' ? 'No Investments Yet' : `No ${filter} Investments`}
              </Text>
              <Text style={styles.emptyDescription}>
                {filter === 'all' 
                  ? 'Start investing in African SMEs to build your portfolio'
                  : `You don't have any ${filter} investments at the moment`
                }
              </Text>
              {filter === 'all' && (
                <TouchableOpacity 
                  style={styles.exploreButton}
                  onPress={() => navigation.navigate('InvestmentSearch')}
                >
                  <Text style={styles.exploreButtonText}>Explore Opportunities</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredInvestments.map(renderInvestmentItem)
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  refreshButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#4F46E5',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  investmentsList: {
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  listCount: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  investmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  investmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  businessLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  businessLogoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  businessDetails: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  investmentDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  investmentMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  investmentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  investmentType: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default InvestmentHistoryScreen;