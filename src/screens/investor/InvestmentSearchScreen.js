import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { InvestmentService } from '../../services/firebase/InvestmentService';

const { width } = Dimensions.get('window');

export default function InvestmentSearchScreen({ navigation }) {
  const { user, userProfile } = useContext(AuthContext);
  const { formatCurrency } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [investorProfile, setInvestorProfile] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    minReadinessScore: 50,
    maxReadinessScore: 100,
    industry: '',
    country: '',
    minInvestment: 1000,
    maxInvestment: 100000,
    investmentType: '',
    sortBy: 'readinessScore'
  });

  // Pledge form state
  const [pledgeForm, setPledgeForm] = useState({
    amount: '',
    investmentType: 'equity',
    expectedReturn: '',
    timeframe: '24',
    conditions: '',
    message: ''
  });

  useEffect(() => {
    if (user) {
      loadInvestorData();
    }
  }, [user]);

  useEffect(() => {
    filterAndSearchBusinesses();
  }, [businesses, searchQuery, filters]);

  const loadInvestorData = async () => {
    try {
      setLoading(true);
      
      // Load or create investor profile
      let profile = await InvestmentService.getInvestorProfile(user.uid);
      
      if (!profile) {
        // Create default investor profile
        const defaultProfile = {
          name: userProfile?.name || 'Investor',
          email: user.email,
          investmentCapacity: 50000,
          industries: ['Technology', 'Agriculture', 'Healthcare'],
          countries: ['Nigeria', 'Kenya', 'South Africa'],
          minInvestment: 1000,
          maxInvestment: 50000,
          investmentTypes: ['equity', 'loan'],
          riskTolerance: 'medium'
        };
        
        profile = await InvestmentService.createInvestorProfile(user.uid, defaultProfile);
      }
      
      setInvestorProfile(profile);
      
      // Load matched businesses
      await loadBusinesses(profile);
      
    } catch (error) {
      console.error('Error loading investor data:', error);
      Alert.alert('Error', 'Failed to load investment opportunities');
    } finally {
      setLoading(false);
    }
  };

  const loadBusinesses = async (profile = investorProfile) => {
    try {
      console.log('Loading investment opportunities...');
      
      let businessList;
      if (profile && profile.preferences) {
        // Get matched businesses based on investor preferences
        businessList = await InvestmentService.getMatchedBusinesses(user.uid, profile);
      } else {
        // Get all public businesses with good readiness scores
        businessList = await InvestmentService.searchBusinesses({
          minReadinessScore: 60,
          sortBy: 'readinessScore',
          limit: 50
        });
      }
      
      setBusinesses(businessList);
      console.log(`Loaded ${businessList.length} investment opportunities`);
      
    } catch (error) {
      console.error('Error loading businesses:', error);
      Alert.alert('Error', 'Failed to load businesses');
    }
  };

  const filterAndSearchBusinesses = () => {
    let filtered = [...businesses];
    
    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(business => 
        business.businessName?.toLowerCase().includes(query) ||
        business.industry?.toLowerCase().includes(query) ||
        business.country?.toLowerCase().includes(query) ||
        business.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply filters
    filtered = filtered.filter(business => {
      const score = business.readinessScore || 0;
      const amount = business.seekingAmount || 0;
      
      return (
        score >= filters.minReadinessScore &&
        score <= filters.maxReadinessScore &&
        amount >= filters.minInvestment &&
        amount <= filters.maxInvestment &&
        (filters.industry === '' || business.industry === filters.industry) &&
        (filters.country === '' || business.country === filters.country) &&
        (filters.investmentType === '' || 
         (business.investmentTypes && business.investmentTypes.includes(filters.investmentType)))
      );
    });
    
    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'readinessScore':
          return (b.readinessScore || 0) - (a.readinessScore || 0);
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'popular':
          return (b.views || 0) - (a.views || 0);
        case 'amount':
          return (b.seekingAmount || 0) - (a.seekingAmount || 0);
        default:
          return 0;
      }
    });
    
    setFilteredBusinesses(filtered);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBusinesses();
    setRefreshing(false);
  };

  const handleExpressInterest = async (business) => {
    try {
      await InvestmentService.expressInterest(
        user.uid, 
        business.id, 
        `Interested in learning more about ${business.businessName}`
      );
      
      Alert.alert('Success', 'Your interest has been expressed to the business owner!');
    } catch (error) {
      console.error('Error expressing interest:', error);
      Alert.alert('Error', 'Failed to express interest');
    }
  };

  const handleMakePledge = (business) => {
    setSelectedBusiness(business);
    setPledgeForm({
      ...pledgeForm,
      amount: business.seekingAmount?.toString() || '',
    });
    setShowPledgeModal(true);
  };

  const submitPledge = async () => {
    try {
      if (!pledgeForm.amount || !pledgeForm.expectedReturn) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const pledgeData = {
        investorId: user.uid,
        listingId: selectedBusiness.id,
        businessName: selectedBusiness.businessName,
        amount: parseFloat(pledgeForm.amount),
        investmentType: pledgeForm.investmentType,
        expectedReturn: parseFloat(pledgeForm.expectedReturn),
        timeframe: pledgeForm.timeframe,
        conditions: pledgeForm.conditions,
        message: pledgeForm.message,
      };

      await InvestmentService.createInvestmentPledge(pledgeData);
      
      setShowPledgeModal(false);
      setPledgeForm({
        amount: '',
        investmentType: 'equity',
        expectedReturn: '',
        timeframe: '24',
        conditions: '',
        message: ''
      });
      
      Alert.alert(
        'Mock Investment Submitted!', 
        'This is a demonstration investment pledge. No real funds are involved. The business owner will be notified of your interest.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error submitting pledge:', error);
      Alert.alert('Error', 'Failed to submit investment pledge');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#ffc107';
    if (score >= 40) return '#fd7e14';
    return '#dc3545';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Investment Ready';
    if (score >= 60) return 'Nearly Ready';
    if (score >= 40) return 'Developing';
    return 'Early Stage';
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filter Opportunities</Text>
          <TouchableOpacity onPress={() => {
            filterAndSearchBusinesses();
            setShowFilters(false);
          }}>
            <Text style={styles.modalApplyButton}>Apply</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {/* Readiness Score Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Investment Readiness Score</Text>
            <View style={styles.rangeContainer}>
              <View style={styles.rangeInput}>
                <Text style={styles.rangeLabel}>Min:</Text>
                <TextInput
                  style={styles.rangeInputField}
                  value={filters.minReadinessScore.toString()}
                  onChangeText={(text) => setFilters({...filters, minReadinessScore: parseInt(text) || 0})}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <View style={styles.rangeInput}>
                <Text style={styles.rangeLabel}>Max:</Text>
                <TextInput
                  style={styles.rangeInputField}
                  value={filters.maxReadinessScore.toString()}
                  onChangeText={(text) => setFilters({...filters, maxReadinessScore: parseInt(text) || 100})}
                  keyboardType="numeric"
                  placeholder="100"
                />
              </View>
            </View>
          </View>

          {/* Investment Amount Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Investment Amount (USD)</Text>
            <View style={styles.rangeContainer}>
              <View style={styles.rangeInput}>
                <Text style={styles.rangeLabel}>Min:</Text>
                <TextInput
                  style={styles.rangeInputField}
                  value={filters.minInvestment.toString()}
                  onChangeText={(text) => setFilters({...filters, minInvestment: parseInt(text) || 0})}
                  keyboardType="numeric"
                  placeholder="1000"
                />
              </View>
              <View style={styles.rangeInput}>
                <Text style={styles.rangeLabel}>Max:</Text>
                <TextInput
                  style={styles.rangeInputField}
                  value={filters.maxInvestment.toString()}
                  onChangeText={(text) => setFilters({...filters, maxInvestment: parseInt(text) || 100000})}
                  keyboardType="numeric"
                  placeholder="100000"
                />
              </View>
            </View>
          </View>

          {/* Industry Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Industry</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.industry}
                onValueChange={(value) => setFilters({...filters, industry: value})}
                style={styles.picker}
              >
                <Picker.Item label="All Industries" value="" />
                <Picker.Item label="Technology" value="Technology" />
                <Picker.Item label="Agriculture" value="Agriculture" />
                <Picker.Item label="Healthcare" value="Healthcare" />
                <Picker.Item label="Manufacturing" value="Manufacturing" />
                <Picker.Item label="Retail" value="Retail" />
                <Picker.Item label="Services" value="Services" />
                <Picker.Item label="Education" value="Education" />
                <Picker.Item label="Financial Services" value="Financial Services" />
              </Picker>
            </View>
          </View>

          {/* Country Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Country</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.country}
                onValueChange={(value) => setFilters({...filters, country: value})}
                style={styles.picker}
              >
                <Picker.Item label="All Countries" value="" />
                <Picker.Item label="Nigeria" value="Nigeria" />
                <Picker.Item label="Kenya" value="Kenya" />
                <Picker.Item label="South Africa" value="South Africa" />
                <Picker.Item label="Ghana" value="Ghana" />
                <Picker.Item label="Rwanda" value="Rwanda" />
                <Picker.Item label="Uganda" value="Uganda" />
                <Picker.Item label="Tanzania" value="Tanzania" />
                <Picker.Item label="Egypt" value="Egypt" />
              </Picker>
            </View>
          </View>

          {/* Sort By */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.sortBy}
                onValueChange={(value) => setFilters({...filters, sortBy: value})}
                style={styles.picker}
              >
                <Picker.Item label="Investment Readiness" value="readinessScore" />
                <Picker.Item label="Newest Listed" value="newest" />
                <Picker.Item label="Most Popular" value="popular" />
                <Picker.Item label="Investment Amount" value="amount" />
              </Picker>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderPledgeModal = () => (
    <Modal
      visible={showPledgeModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowPledgeModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowPledgeModal(false)}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Investment Pledge</Text>
          <TouchableOpacity onPress={submitPledge}>
            <Text style={styles.modalApplyButton}>Submit</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.pledgeBusinessInfo}>
            <Text style={styles.pledgeBusinessName}>{selectedBusiness?.businessName}</Text>
            <Text style={styles.pledgeBusinessDetails}>
              {selectedBusiness?.industry} • {selectedBusiness?.country}
            </Text>
            <Text style={styles.pledgeReadinessScore}>
              Investment Readiness: {selectedBusiness?.readinessScore}/100
            </Text>
          </View>

          <View style={styles.pledgeDisclaimer}>
            <Text style={styles.disclaimerText}>
              ⚠️ This is a mock investment for demonstration purposes only. No real funds will be transferred.
            </Text>
          </View>

          <View style={styles.pledgeForm}>
            <View style={styles.pledgeField}>
              <Text style={styles.pledgeLabel}>Investment Amount (USD) *</Text>
              <TextInput
                style={styles.pledgeInput}
                value={pledgeForm.amount}
                onChangeText={(text) => setPledgeForm({...pledgeForm, amount: text})}
                keyboardType="numeric"
                placeholder="Enter amount"
              />
            </View>

            <View style={styles.pledgeField}>
              <Text style={styles.pledgeLabel}>Investment Type *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={pledgeForm.investmentType}
                  onValueChange={(value) => setPledgeForm({...pledgeForm, investmentType: value})}
                  style={styles.picker}
                >
                  <Picker.Item label="💼 Equity Investment" value="equity" />
                  <Picker.Item label="💰 Business Loan" value="loan" />
                  <Picker.Item label="📊 Revenue Sharing" value="revenue_sharing" />
                  <Picker.Item label="🤝 Partnership" value="partnership" />
                </Picker>
              </View>
            </View>

            <View style={styles.pledgeField}>
              <Text style={styles.pledgeLabel}>Expected Annual Return (%) *</Text>
              <TextInput
                style={styles.pledgeInput}
                value={pledgeForm.expectedReturn}
                onChangeText={(text) => setPledgeForm({...pledgeForm, expectedReturn: text})}
                keyboardType="numeric"
                placeholder="e.g., 12"
              />
            </View>

            <View style={styles.pledgeField}>
              <Text style={styles.pledgeLabel}>Investment Timeframe (months)</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={pledgeForm.timeframe}
                  onValueChange={(value) => setPledgeForm({...pledgeForm, timeframe: value})}
                  style={styles.picker}
                >
                  <Picker.Item label="12 months" value="12" />
                  <Picker.Item label="24 months" value="24" />
                  <Picker.Item label="36 months" value="36" />
                  <Picker.Item label="48 months" value="48" />
                  <Picker.Item label="60 months" value="60" />
                </Picker>
              </View>
            </View>

            <View style={styles.pledgeField}>
              <Text style={styles.pledgeLabel}>Additional Conditions</Text>
              <TextInput
                style={[styles.pledgeInput, styles.pledgeTextArea]}
                value={pledgeForm.conditions}
                onChangeText={(text) => setPledgeForm({...pledgeForm, conditions: text})}
                placeholder="Optional conditions or requirements"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.pledgeField}>
              <Text style={styles.pledgeLabel}>Message to Business Owner</Text>
              <TextInput
                style={[styles.pledgeInput, styles.pledgeTextArea]}
                value={pledgeForm.message}
                onChangeText={(text) => setPledgeForm({...pledgeForm, message: text})}
                placeholder="Introduce yourself and explain your interest"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderBusinessCard = (business) => (
    <TouchableOpacity 
      key={business.id} 
      style={styles.businessCard}
      onPress={() => navigation.navigate('BusinessDetail', { businessId: business.id })}
    >
      <View style={styles.businessHeader}>
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{business.businessName || 'Unnamed Business'}</Text>
          <Text style={styles.businessLocation}>
            📍 {business.country} • {business.industry}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreValue, { color: getScoreColor(business.readinessScore || 0) }]}>
            {business.readinessScore || 0}
          </Text>
          <Text style={styles.scoreLabel}>{getScoreLabel(business.readinessScore || 0)}</Text>
        </View>
      </View>

      <Text style={styles.businessDescription} numberOfLines={2}>
        {business.description || 'Business description not available'}
      </Text>

      <View style={styles.investmentInfo}>
        <View style={styles.investmentAmount}>
          <Text style={styles.investmentLabel}>Seeking:</Text>
          <Text style={styles.investmentValue}>
            {formatCurrency(business.seekingAmount || 0, 'USD')}
          </Text>
        </View>
        
        {business.investmentTypes && business.investmentTypes.length > 0 && (
          <View style={styles.investmentTypes}>
            {business.investmentTypes.slice(0, 2).map((type, index) => (
              <View key={index} style={styles.typeChip}>
                <Text style={styles.typeChipText}>
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {business.matchReasons && business.matchReasons.length > 0 && (
        <View style={styles.matchReasonsContainer}>
          <Text style={styles.matchReasonsTitle}>Why this matches you:</Text>
          <Text style={styles.matchReasons} numberOfLines={1}>
            {business.matchReasons.slice(0, 2).join(' • ')}
          </Text>
        </View>
      )}

      <View style={styles.businessActions}>
        <TouchableOpacity 
          style={styles.interestButton}
          onPress={() => handleExpressInterest(business)}
        >
          <Text style={styles.interestButtonText}>💌 Express Interest</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.pledgeButton}
          onPress={() => handleMakePledge(business)}
        >
          <Text style={styles.pledgeButtonText}>💰 Make Pledge</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🔍 Finding investment opportunities...</Text>
          <Text style={styles.loadingSubtext}>Matching businesses with your preferences</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Investment Opportunities</Text>
        <Text style={styles.subtitle}>Discover African SMEs ready for investment</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search businesses, industries, locations..."
        />
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Text style={styles.filterButtonText}>🔍 Filter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredBusinesses.length} opportunities found
        </Text>
        {investorProfile && (
          <Text style={styles.matchedText}>
            Matched to your preferences
          </Text>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredBusinesses.length > 0 ? (
          filteredBusinesses.map(renderBusinessCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No opportunities found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search criteria or filters to find more investment opportunities.
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleRefresh}
            >
              <Text style={styles.refreshButtonText}>Refresh Opportunities</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {renderFilterModal()}
      {renderPledgeModal()}
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 10,
  },
  filterButton: {
    backgroundColor: '#2E7D8F',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  matchedText: {
    fontSize: 12,
    color: '#2E7D8F',
    fontWeight: '600',
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
  businessCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  businessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  businessInfo: {
    flex: 1,
    marginRight: 15,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  businessLocation: {
    fontSize: 14,
    color: '#666',
  },
  scoreContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  businessDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  investmentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  investmentAmount: {
    flex: 1,
  },
  investmentLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  investmentValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D8F',
  },
  investmentTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  typeChip: {
    backgroundColor: '#e8f4f8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 5,
  },
  typeChipText: {
    fontSize: 10,
    color: '#2E7D8F',
    fontWeight: '600',
  },
  matchReasonsContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  matchReasonsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D8F',
    marginBottom: 3,
  },
  matchReasons: {
    fontSize: 11,
    color: '#2E7D8F',
  },
  businessActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  interestButton: {
    flex: 0.48,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  interestButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  pledgeButton: {
    flex: 0.48,
    backgroundColor: '#2E7D8F',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pledgeButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
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
  refreshButton: {
    backgroundColor: '#2E7D8F',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#666',
  },
  modalApplyButton: {
    fontSize: 16,
    color: '#2E7D8F',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Filter Modal Styles
  filterSection: {
    marginTop: 20,
    marginBottom: 15,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  rangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeInput: {
    flex: 0.48,
  },
  rangeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  rangeInputField: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  picker: {
    height: 50,
  },
  
  // Pledge Modal Styles
  pledgeBusinessInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  pledgeBusinessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  pledgeBusinessDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  pledgeReadinessScore: {
    fontSize: 14,
    color: '#2E7D8F',
    fontWeight: '600',
  },
  pledgeDisclaimer: {
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
  },
  pledgeForm: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  pledgeField: {
    marginBottom: 20,
  },
  pledgeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pledgeInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  pledgeTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});