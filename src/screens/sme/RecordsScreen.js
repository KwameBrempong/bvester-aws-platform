import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
  Alert,
  Dimensions,
  Share,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { transactionService } from '../../services/firebase/FirebaseService';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function RecordsScreen({ navigation }) {
  const { user, userProfile } = useContext(AuthContext);
  const { formatCurrency } = useApp();
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    transactionCount: 0,
    avgDailyIncome: 0,
    avgDailyExpenses: 0,
    topExpenseCategory: '',
    growthRate: 0,
    cashFlowTrend: []
  });

  useEffect(() => {
    if (user) {
      loadTransactions();
      setupRealTimeUpdates();
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      console.log('Loading transactions for user:', user.uid);
      const userTransactions = await transactionService.getUserTransactions(user.uid, {
        limit: 50 // Get recent 50 transactions
      });
      
      setTransactions(userTransactions);
      calculateSummary(userTransactions);
      console.log(`Loaded ${userTransactions.length} transactions`);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    console.log('Setting up real-time transaction updates');
    const unsubscribe = transactionService.subscribeToUserTransactions(
      user.uid,
      (updatedTransactions) => {
        console.log('Real-time update:', updatedTransactions.length, 'transactions');
        setTransactions(updatedTransactions);
        calculateSummary(updatedTransactions);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  };

  const calculateSummary = (transactionsList) => {
    const now = new Date();
    const periodStart = getPeriodStart(selectedPeriod);
    const filteredTransactions = transactionsList.filter(t => {
      const transactionDate = t.date.toDate ? t.date.toDate() : new Date(t.date);
      return transactionDate >= periodStart;
    });
    
    const summary = filteredTransactions.reduce((acc, transaction) => {
      const amount = transaction.amount || 0;
      
      if (transaction.type === 'income') {
        acc.totalIncome += amount;
      } else if (transaction.type === 'expense') {
        acc.totalExpenses += amount;
        if (!acc.categoryTotals[transaction.category]) {
          acc.categoryTotals[transaction.category] = 0;
        }
        acc.categoryTotals[transaction.category] += amount;
      }
      
      acc.transactionCount++;
      return acc;
    }, {
      totalIncome: 0,
      totalExpenses: 0,
      transactionCount: 0,
      categoryTotals: {}
    });

    summary.netCashFlow = summary.totalIncome - summary.totalExpenses;
    
    // Calculate additional metrics
    const daysInPeriod = Math.ceil((now - periodStart) / (1000 * 60 * 60 * 24)) || 1;
    summary.avgDailyIncome = summary.totalIncome / daysInPeriod;
    summary.avgDailyExpenses = summary.totalExpenses / daysInPeriod;
    
    // Find top expense category
    const topCategory = Object.entries(summary.categoryTotals)
      .sort(([,a], [,b]) => b - a)[0];
    summary.topExpenseCategory = topCategory ? topCategory[0] : '';
    
    // Calculate growth rate (simplified)
    summary.growthRate = summary.netCashFlow > 0 ? 
      ((summary.totalIncome - summary.totalExpenses) / summary.totalExpenses * 100) : 0;
    
    setSummary(summary);
  };

  const getPeriodStart = (period) => {
    const now = new Date();
    switch (period) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'thisWeek':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return weekStart;
      case 'thisMonth':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'lastMonth':
        return new Date(now.getFullYear(), now.getMonth() - 1, 1);
      case 'thisYear':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const getTransactionIcon = (type, category) => {
    if (type === 'income') {
      const incomeIcons = {
        sales: '💰',
        services: '🔧',
        investment: '📈',
        grants: '🎁',
        loans: '🏦',
        other_income: '📊'
      };
      return incomeIcons[category] || '💰';
    }
    if (type === 'expense') {
      const expenseIcons = {
        inventory: '📦',
        salaries: '👥',
        rent: '🏢',
        transport: '🚗',
        marketing: '📢',
        equipment: '⚙️',
        licenses: '📋',
        taxes: '💸',
        insurance: '🛡️',
        utilities: '⚡',
        supplies: '📋',
        professional: '👔',
        other_expense: '📝'
      };
      return expenseIcons[category] || '📝';
    }
    return '🔄';
  };

  const exportToCSV = async () => {
    try {
      const csvHeader = 'Date,Description,Category,Type,Amount,Currency,Payment Method,Reference\n';
      const csvData = transactions.map(t => {
        const date = t.date.toDate ? t.date.toDate() : new Date(t.date);
        return [
          date.toISOString().split('T')[0],
          `"${t.description.replace(/"/g, '""')}"`,
          t.category,
          t.type,
          t.amount,
          t.currency || 'USD',
          t.paymentMethod || 'cash',
          t.reference || ''
        ].join(',');
      }).join('\n');
      
      const csvContent = csvHeader + csvData;
      const fileName = `bvester_records_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', `Records exported to ${fileName}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export records');
    }
  };

  const shareFinancialSummary = async () => {
    try {
      const summaryText = `Bvester Financial Summary - ${selectedPeriod}\n\n` +
        `💰 Total Income: ${formatCurrency(summary.totalIncome, userProfile?.currency || 'USD')}\n` +
        `💸 Total Expenses: ${formatCurrency(summary.totalExpenses, userProfile?.currency || 'USD')}\n` +
        `📈 Net Cash Flow: ${formatCurrency(summary.netCashFlow, userProfile?.currency || 'USD')}\n` +
        `📊 Transactions: ${summary.transactionCount}\n\n` +
        `Generated by Bvester - African SME Investment Platform`;
      
      await Share.share({
        message: summaryText,
        title: 'Financial Summary'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const getFilteredTransactions = () => {
    let filtered = [...transactions];
    
    // Filter by period
    const periodStart = getPeriodStart(selectedPeriod);
    filtered = filtered.filter(t => {
      const transactionDate = t.date.toDate ? t.date.toDate() : new Date(t.date);
      return transactionDate >= periodStart;
    });
    
    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'income') {
        filtered = filtered.filter(t => t.type === 'income');
      } else if (selectedCategory === 'expense') {
        filtered = filtered.filter(t => t.type === 'expense');
      } else {
        filtered = filtered.filter(t => t.category === selectedCategory);
      }
    }
    
    return filtered.sort((a, b) => {
      const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
      return dateB - dateA;
    });
  };

  const formatDate = (date) => {
    if (!date) return 'No date';
    const transactionDate = date.toDate ? date.toDate() : new Date(date);
    return transactionDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderTransaction = ({ item }) => (
    <TouchableOpacity 
      style={styles.transactionCard}
      onPress={() => {
        Alert.alert(
          'Transaction Details',
          `${item.description}\n\n` +
          `Amount: ${item.type === 'income' ? '+' : '-'}${formatCurrency(item.amount, item.currency)}\n` +
          `Category: ${item.category.replace('_', ' ')}\n` +
          `Date: ${formatDate(item.date)}\n` +
          `Payment: ${item.paymentMethod || 'Cash'}\n` +
          `${item.reference ? `Reference: ${item.reference}\n` : ''}` +
          `\nTransaction ID: ${item.id}`,
          [
            { text: 'Close' },
            { 
              text: 'Edit', 
              onPress: () => {
                Alert.alert('Edit Transaction', 'Transaction editing coming soon!');
              }
            }
          ]
        );
      }}
    >
      <View style={styles.transactionHeader}>
        <View style={[
          styles.transactionIcon,
          item.type === 'income' ? styles.incomeIcon : styles.expenseIcon
        ]}>
          <Text style={styles.iconText}>{getTransactionIcon(item.type, item.category)}</Text>
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {item.description}
          </Text>
          <View style={styles.transactionMeta}>
            <Text style={styles.transactionCategory}>
              {item.category.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.transactionDate}>
              {formatDate(item.date)}
            </Text>
          </View>
          {item.reference && (
            <Text style={styles.transactionReference} numberOfLines={1}>
              Ref: {item.reference}
            </Text>
          )}
        </View>
        <View style={styles.transactionAmount}>
          <Text style={[
            styles.amountText,
            item.type === 'income' ? styles.incomeAmount : styles.expenseAmount
          ]}>
            {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, item.currency)}
          </Text>
          <Text style={styles.paymentMethod}>
            {item.paymentMethod === 'mobile_money' ? '📱' : 
             item.paymentMethod === 'bank_transfer' ? '🏦' : 
             item.paymentMethod === 'card' ? '💳' : '💵'}
            {' '}{item.paymentMethod?.replace('_', ' ') || 'Cash'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Business Records</Text>
        <Text style={styles.subtitle}>Manage your financial data</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Period & Category Filters */}
        <View style={styles.filtersContainer}>
          <Text style={styles.sectionTitle}>📊 Financial Dashboard</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodTabs}>
            {['today', 'thisWeek', 'thisMonth', 'lastMonth', 'thisYear'].map(period => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodTab,
                  selectedPeriod === period && styles.periodTabActive
                ]}
                onPress={() => {
                  setSelectedPeriod(period);
                  calculateSummary(transactions);
                }}
              >
                <Text style={[
                  styles.periodTabText,
                  selectedPeriod === period && styles.periodTabTextActive
                ]}>
                  {period.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
            {['all', 'income', 'expense', 'inventory', 'salaries', 'marketing'].map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  selectedCategory === category && styles.categoryTabActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryTabText,
                  selectedCategory === category && styles.categoryTabTextActive
                ]}>
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Enhanced Financial Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryHeaderLeft}>
              <Text style={styles.summaryTitle}>Financial Overview</Text>
              <Text style={styles.summaryPeriod}>{selectedPeriod.replace(/([A-Z])/g, ' $1')}</Text>
            </View>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={shareFinancialSummary}
            >
              <Ionicons name="share-outline" size={20} color="#2E7D8F" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.summaryCards}>
            <View style={[styles.summaryCard, styles.incomeCard]}>
              <View style={styles.summaryCardHeader}>
                <Ionicons name="trending-up" size={20} color="#27ae60" />
                <Text style={styles.summaryLabel}>Total Income</Text>
              </View>
              <Text style={styles.summaryValue}>
                {formatCurrency(summary.totalIncome, userProfile?.currency || 'USD')}
              </Text>
              <Text style={styles.summarySubtext}>
                Avg: {formatCurrency(summary.avgDailyIncome, userProfile?.currency || 'USD')}/day
              </Text>
            </View>
            
            <View style={[styles.summaryCard, styles.expenseCard]}>
              <View style={styles.summaryCardHeader}>
                <Ionicons name="trending-down" size={20} color="#e74c3c" />
                <Text style={styles.summaryLabel}>Total Expenses</Text>
              </View>
              <Text style={styles.summaryValue}>
                {formatCurrency(summary.totalExpenses, userProfile?.currency || 'USD')}
              </Text>
              <Text style={styles.summarySubtext}>
                Top: {summary.topExpenseCategory || 'None'}
              </Text>
            </View>
          </View>

          <View style={[styles.summaryCard, styles.netCashFlowCard]}>
            <View style={styles.summaryCardHeader}>
              <Ionicons 
                name={summary.netCashFlow >= 0 ? "checkmark-circle" : "alert-circle"} 
                size={24} 
                color={summary.netCashFlow >= 0 ? "#27ae60" : "#e74c3c"} 
              />
              <Text style={styles.summaryLabel}>Net Cash Flow</Text>
            </View>
            <Text style={[
              styles.summaryValue,
              summary.netCashFlow >= 0 ? styles.positiveFlow : styles.negativeFlow
            ]}>
              {summary.netCashFlow >= 0 ? '+' : ''}
              {formatCurrency(summary.netCashFlow, userProfile?.currency || 'USD')}
            </Text>
            <View style={styles.summaryMetrics}>
              <Text style={styles.transactionCount}>
                {summary.transactionCount} transactions
              </Text>
              {summary.growthRate !== 0 && (
                <Text style={[
                  styles.growthRate,
                  summary.growthRate > 0 ? styles.positiveGrowth : styles.negativeGrowth
                ]}>
                  {summary.growthRate > 0 ? '+' : ''}{summary.growthRate.toFixed(1)}% efficiency
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          </View>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={[styles.quickActionCard, styles.primaryAction]}
              onPress={() => navigation.navigate('AddTransaction')}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="add-circle" size={28} color="#fff" />
              </View>
              <Text style={styles.quickActionTitle}>Add Transaction</Text>
              <Text style={styles.quickActionSubtext}>Record income/expenses</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={exportToCSV}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="download-outline" size={24} color="#2E7D8F" />
              </View>
              <Text style={styles.quickActionTitle}>Export Data</Text>
              <Text style={styles.quickActionSubtext}>CSV format</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => {
                Alert.alert(
                  'Bulk Import', 
                  'Import transactions from:\n• Bank statements\n• Spreadsheet files\n• Previous systems\n\nFeature coming soon!',
                  [{ text: 'OK' }]
                );
              }}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="cloud-upload-outline" size={24} color="#2E7D8F" />
              </View>
              <Text style={styles.quickActionTitle}>Import Records</Text>
              <Text style={styles.quickActionSubtext}>Bulk upload</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionCard}
              onPress={() => {
                Alert.alert(
                  'Financial Report', 
                  'Generate comprehensive reports:\n• Profit & Loss\n• Cash Flow Analysis\n• Investment Readiness\n• Tax Preparation\n\nFeature coming soon!',
                  [{ text: 'OK' }]
                );
              }}
            >
              <View style={styles.quickActionIcon}>
                <Ionicons name="stats-chart-outline" size={24} color="#2E7D8F" />
              </View>
              <Text style={styles.quickActionTitle}>Generate Report</Text>
              <Text style={styles.quickActionSubtext}>Detailed analysis</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Transactions List */}
        <View style={styles.transactionsContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>📋 Transaction History</Text>
            <View style={styles.headerActions}>
              {getFilteredTransactions().length > 5 && (
                <TouchableOpacity onPress={() => {
                  Alert.alert(
                    'All Transactions',
                    `Showing ${getFilteredTransactions().length} transactions for ${selectedPeriod}\n\nFull transaction management coming soon!`
                  );
                }}>
                  <Text style={styles.viewAllButton}>View All ({getFilteredTransactions().length})</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="sync" size={24} color="#2E7D8F" />
              <Text style={styles.loadingText}>Loading your financial data...</Text>
            </View>
          ) : getFilteredTransactions().length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#6b7280" />
              <Text style={styles.emptyStateTitle}>
                {selectedCategory === 'all' ? 'Start Recording Your Business Finances' : `No ${selectedCategory} transactions found`}
              </Text>
              <Text style={styles.emptyStateText}>
                {selectedCategory === 'all' 
                  ? 'Track your revenue, expenses, and cash flow to build investment readiness and grow your business.'
                  : `No ${selectedCategory} transactions found for ${selectedPeriod.replace(/([A-Z])/g, ' $1').toLowerCase()}. Try selecting a different period or category.`
                }
              </Text>
              {selectedCategory === 'all' && (
                <View style={styles.emptyFeatures}>
                  <View style={styles.emptyFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.emptyFeatureText}>Build investment readiness score</Text>
                  </View>
                  <View style={styles.emptyFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.emptyFeatureText}>Track cash flow trends</Text>
                  </View>
                  <View style={styles.emptyFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.emptyFeatureText}>Export for taxes & reports</Text>
                  </View>
                </View>
              )}
              <TouchableOpacity 
                style={styles.addFirstButton}
                onPress={() => navigation.navigate('AddTransaction')}
              >
                <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.addFirstButtonText}>
                  {selectedCategory === 'all' ? 'Add Your First Transaction' : 'Add Transaction'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Transaction Summary for Period */}
              <View style={styles.transactionsSummary}>
                <Text style={styles.transactionsSummaryText}>
                  {getFilteredTransactions().length} transaction{getFilteredTransactions().length !== 1 ? 's' : ''} • 
                  {selectedPeriod.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  {selectedCategory !== 'all' && ` • ${selectedCategory}`}
                </Text>
              </View>
              
              <FlatList
                data={getFilteredTransactions().slice(0, 10)} // Show recent 10
                renderItem={renderTransaction}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.transactionSeparator} />}
              />
              
              {getFilteredTransactions().length > 10 && (
                <TouchableOpacity 
                  style={styles.loadMoreButton}
                  onPress={() => {
                    Alert.alert('Load More', 'Advanced pagination coming soon!');
                  }}
                >
                  <Text style={styles.loadMoreText}>View {getFilteredTransactions().length - 10} more transactions</Text>
                  <Ionicons name="chevron-down" size={16} color="#2E7D8F" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* African SME Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>🌍 African SME Record-Keeping Tips</Text>
          
          <View style={styles.tip}>
            <Text style={styles.tipIcon}>📱</Text>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Mobile Money Integration:</Text> Track M-Pesa, MTN Mobile Money, and Airtel Money transactions separately for better cash flow analysis.
            </Text>
          </View>
          
          <View style={styles.tip}>
            <Text style={styles.tipIcon}>💸</Text>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Tax Compliance:</Text> Properly categorize expenses for easier VAT filing. Keep receipts for equipment and business expenses.
            </Text>
          </View>
          
          <View style={styles.tip}>
            <Text style={styles.tipIcon}>📊</Text>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Investment Readiness:</Text> Consistent record-keeping for 6+ months significantly improves your business readiness score.
            </Text>
          </View>

          <View style={styles.tip}>
            <Text style={styles.tipIcon}>💱</Text>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Multi-Currency:</Text> Record transactions in their original currency, especially for cross-border trade under AfCFTA.
            </Text>
          </View>
        </View>
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
  filtersContainer: {
    marginVertical: 20,
  },
  periodTabs: {
    marginVertical: 15,
  },
  periodTab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  periodTabActive: {
    backgroundColor: '#2E7D8F',
    borderColor: '#2E7D8F',
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  periodTabTextActive: {
    color: '#fff',
  },
  categoryTabs: {
    marginBottom: 10,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryTabActive: {
    backgroundColor: '#e8f4f8',
    borderColor: '#2E7D8F',
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6c757d',
  },
  categoryTabTextActive: {
    color: '#2E7D8F',
    fontWeight: '600',
  },
  summaryContainer: {
    marginBottom: 25,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryHeaderLeft: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryPeriod: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summarySubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  summaryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  growthRate: {
    fontSize: 12,
    fontWeight: '600',
  },
  positiveGrowth: {
    color: '#27ae60',
  },
  negativeGrowth: {
    color: '#e74c3c',
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  incomeCard: {
    flex: 0.48,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  expenseCard: {
    flex: 0.48,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  netCashFlowCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D8F',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  positiveFlow: {
    color: '#27ae60',
  },
  negativeFlow: {
    color: '#e74c3c',
  },
  transactionCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  quickActionsContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  primaryAction: {
    backgroundColor: '#2E7D8F',
    borderColor: '#2E7D8F',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  transactionsContainer: {
    marginBottom: 30,
  },
  transactionsSummary: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  transactionsSummaryText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  transactionSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  loadMoreButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    color: '#2E7D8F',
    fontWeight: '500',
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    fontSize: 14,
    color: '#2E7D8F',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyFeatures: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  emptyFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  emptyFeatureText: {
    fontSize: 14,
    color: '#2E7D8F',
    marginLeft: 12,
    fontWeight: '500',
  },
  addFirstButton: {
    backgroundColor: '#2E7D8F',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f8f9fa',
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  incomeIcon: {
    backgroundColor: '#e8f5e8',
  },
  expenseIcon: {
    backgroundColor: '#fdeaea',
  },
  iconText: {
    fontSize: 18,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionReference: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  incomeAmount: {
    color: '#27ae60',
  },
  expenseAmount: {
    color: '#e74c3c',
  },
  paymentMethod: {
    fontSize: 11,
    color: '#666',
    textTransform: 'capitalize',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  tipsSection: {
    backgroundColor: '#f0f8ff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D8F',
    marginBottom: 15,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2,
  },
  tipText: {
    fontSize: 13,
    color: '#2E7D8F',
    lineHeight: 18,
    flex: 1,
  },
  tipBold: {
    fontWeight: 'bold',
  },
  placeholder: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});