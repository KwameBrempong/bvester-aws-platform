/**
 * 🚀 BVESTER INVESTMENT CMS SCREEN
 * Specialized Content Management for Investment Opportunities and SME Profiles
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { 
  cmsService, 
  CONTENT_TYPES, 
  CONTENT_CATEGORIES, 
  CONTENT_STATUS 
} from '../../services/firebase/CMSService';
import { enhancedDesignSystem } from '../../styles/enhancedDesignSystem';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const { width, height } = Dimensions.get('window');

export default function InvestmentCMSScreen({ navigation }) {
  const { user, userProfile } = useContext(AuthContext);
  
  // State management
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('opportunities');
  const [investmentData, setInvestmentData] = useState([]);
  const [smeData, setSmeData] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalType, setModalType] = useState('opportunity'); // 'opportunity', 'sme', 'analysis'
  const [stats, setStats] = useState({});
  
  // Form state for Investment Opportunity
  const [opportunityForm, setOpportunityForm] = useState({
    title: '',
    description: '',
    companyName: '',
    sector: CONTENT_CATEGORIES.FINTECH,
    country: '',
    fundingGoal: '',
    minimumInvestment: '',
    expectedROI: '',
    investmentTerm: '',
    riskLevel: 'medium',
    businessModel: '',
    useOfFunds: '',
    teamInfo: '',
    financialHighlights: '',
    marketOpportunity: '',
    competitiveAdvantage: '',
    exitStrategy: '',
    isActive: false
  });

  // Form state for SME Profile
  const [smeForm, setSmeForm] = useState({
    companyName: '',
    title: '',
    description: '',
    sector: CONTENT_CATEGORIES.FINTECH,
    country: '',
    foundingYear: new Date().getFullYear().toString(),
    employeeCount: '',
    revenue: '',
    growthRate: '',
    fundingStage: 'seed',
    businessModel: '',
    targetMarket: '',
    productDescription: '',
    traction: '',
    challenges: '',
    goals: '',
    teamSize: '',
    isVerified: false
  });

  useEffect(() => {
    loadInvestmentData();
    loadStats();
  }, []);

  const loadInvestmentData = async () => {
    try {
      setLoading(true);
      
      // Load investment opportunities
      const opportunities = await cmsService.getActiveInvestmentOpportunities();
      setInvestmentData(opportunities);
      
      // Load SME profiles
      const smeProfiles = await cmsService.getAllContent({
        type: CONTENT_TYPES.SME_PROFILE
      });
      setSmeData(smeProfiles);
      
    } catch (error) {
      console.error('Error loading investment data:', error);
      Alert.alert('Error', 'Failed to load investment data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const investmentStats = await cmsService.getInvestmentStats();
      setStats(investmentStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const createInvestmentOpportunity = async () => {
    try {
      setLoading(true);
      
      const opportunityData = {
        ...opportunityForm,
        fundingGoal: parseFloat(opportunityForm.fundingGoal) || 0,
        minimumInvestment: parseFloat(opportunityForm.minimumInvestment) || 1000,
        content: `${opportunityForm.businessModel}\n\n${opportunityForm.useOfFunds}\n\n${opportunityForm.marketOpportunity}`
      };
      
      await cmsService.createInvestmentOpportunity(opportunityData, user.uid);
      
      Alert.alert('Success', 'Investment opportunity created successfully!');
      setShowCreateModal(false);
      resetOpportunityForm();
      loadInvestmentData();
      loadStats();
      
    } catch (error) {
      console.error('Error creating opportunity:', error);
      Alert.alert('Error', 'Failed to create investment opportunity');
    } finally {
      setLoading(false);
    }
  };

  const createSMEProfile = async () => {
    try {
      setLoading(true);
      
      const smeData = {
        ...smeForm,
        foundingYear: parseInt(smeForm.foundingYear) || new Date().getFullYear(),
        content: `${smeForm.productDescription}\n\n${smeForm.traction}\n\n${smeForm.challenges}\n\n${smeForm.goals}`,
        category: smeForm.sector
      };
      
      await cmsService.createSMEProfile(smeData, user.uid);
      
      Alert.alert('Success', 'SME profile created successfully!');
      setShowCreateModal(false);
      resetSmeForm();
      loadInvestmentData();
      loadStats();
      
    } catch (error) {
      console.error('Error creating SME profile:', error);
      Alert.alert('Error', 'Failed to create SME profile');
    } finally {
      setLoading(false);
    }
  };

  const resetOpportunityForm = () => {
    setOpportunityForm({
      title: '',
      description: '',
      companyName: '',
      sector: CONTENT_CATEGORIES.FINTECH,
      country: '',
      fundingGoal: '',
      minimumInvestment: '',
      expectedROI: '',
      investmentTerm: '',
      riskLevel: 'medium',
      businessModel: '',
      useOfFunds: '',
      teamInfo: '',
      financialHighlights: '',
      marketOpportunity: '',
      competitiveAdvantage: '',
      exitStrategy: '',
      isActive: false
    });
  };

  const resetSmeForm = () => {
    setSmeForm({
      companyName: '',
      title: '',
      description: '',
      sector: CONTENT_CATEGORIES.FINTECH,
      country: '',
      foundingYear: new Date().getFullYear().toString(),
      employeeCount: '',
      revenue: '',
      growthRate: '',
      fundingStage: 'seed',
      businessModel: '',
      targetMarket: '',
      productDescription: '',
      traction: '',
      challenges: '',
      goals: '',
      teamSize: '',
      isVerified: false
    });
  };

  const renderStatsCard = () => (
    <Card style={styles.statsCard}>
      <Text style={styles.statsTitle}>Investment Platform Stats</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalOpportunities || 0}</Text>
          <Text style={styles.statLabel}>Total Opportunities</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.activeOpportunities || 0}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalSMEProfiles || 0}</Text>
          <Text style={styles.statLabel}>SME Profiles</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.verifiedSMEs || 0}</Text>
          <Text style={styles.statLabel}>Verified SMEs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.sectorsWithOpportunities || 0}</Text>
          <Text style={styles.statLabel}>Sectors</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.countriesWithOpportunities || 0}</Text>
          <Text style={styles.statLabel}>Countries</Text>
        </View>
      </View>
    </Card>
  );

  const renderOpportunityItem = ({ item }) => (
    <Card style={styles.contentItem}>
      <View style={styles.contentHeader}>
        <View style={styles.contentInfo}>
          <Text style={styles.contentTitle}>{item.title}</Text>
          <Text style={styles.contentCompany}>{item.companyName}</Text>
          <Text style={styles.contentMeta}>
            {item.sector?.replace(/_/g, ' ').toUpperCase()} • {item.country}
          </Text>
        </View>
        <View style={styles.contentStats}>
          <Text style={styles.fundingGoal}>
            ${item.fundingGoal?.toLocaleString() || '0'}
          </Text>
          <Text style={styles.fundingLabel}>Goal</Text>
        </View>
      </View>
      
      <View style={styles.contentDetails}>
        <Text style={styles.contentDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.contentTags}>
          <View style={[styles.statusBadge, styles[`status${item.status}`]]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          <View style={styles.riskBadge}>
            <Text style={styles.riskText}>{item.riskLevel} risk</Text>
          </View>
          {item.isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>Active</Text>
            </View>
          )}
        </View>
      </View>
    </Card>
  );

  const renderSMEItem = ({ item }) => (
    <Card style={styles.contentItem}>
      <View style={styles.contentHeader}>
        <View style={styles.contentInfo}>
          <Text style={styles.contentTitle}>{item.companyName}</Text>
          <Text style={styles.contentMeta}>
            Founded {item.foundingYear} • {item.sector?.replace(/_/g, ' ').toUpperCase()}
          </Text>
          <Text style={styles.contentMeta}>
            {item.employeeCount} employees • {item.fundingStage} stage
          </Text>
        </View>
        <View style={styles.contentStats}>
          {item.isVerified && (
            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          )}
        </View>
      </View>
      
      <Text style={styles.contentDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.contentTags}>
        <View style={[styles.statusBadge, styles[`status${item.status}`]]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        {item.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>
    </Card>
  );

  const renderOpportunityForm = () => (
    <ScrollView style={styles.modalContent}>
      <Text style={styles.modalTitle}>Create Investment Opportunity</Text>
      
      <Input
        label="Opportunity Title"
        placeholder="e.g., Series A Funding for FinTech Startup"
        value={opportunityForm.title}
        onChangeText={(text) => setOpportunityForm(prev => ({ ...prev, title: text }))}
      />
      
      <Input
        label="Company Name"
        placeholder="Company seeking investment"
        value={opportunityForm.companyName}
        onChangeText={(text) => setOpportunityForm(prev => ({ ...prev, companyName: text }))}
      />
      
      <Input
        label="Description"
        placeholder="Brief description of the investment opportunity"
        value={opportunityForm.description}
        onChangeText={(text) => setOpportunityForm(prev => ({ ...prev, description: text }))}
        multiline
        numberOfLines={3}
      />
      
      <View style={styles.rowInputs}>
        <View style={styles.halfInput}>
          <Input
            label="Funding Goal ($)"
            placeholder="500000"
            value={opportunityForm.fundingGoal}
            onChangeText={(text) => setOpportunityForm(prev => ({ ...prev, fundingGoal: text }))}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfInput}>
          <Input
            label="Min Investment ($)"
            placeholder="1000"
            value={opportunityForm.minimumInvestment}
            onChangeText={(text) => setOpportunityForm(prev => ({ ...prev, minimumInvestment: text }))}
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <View style={styles.rowInputs}>
        <View style={styles.halfInput}>
          <Input
            label="Expected ROI"
            placeholder="20% annually"
            value={opportunityForm.expectedROI}
            onChangeText={(text) => setOpportunityForm(prev => ({ ...prev, expectedROI: text }))}
          />
        </View>
        <View style={styles.halfInput}>
          <Input
            label="Investment Term"
            placeholder="3 years"
            value={opportunityForm.investmentTerm}
            onChangeText={(text) => setOpportunityForm(prev => ({ ...prev, investmentTerm: text }))}
          />
        </View>
      </View>
      
      <Input
        label="Country"
        placeholder="Nigeria, Kenya, etc."
        value={opportunityForm.country}
        onChangeText={(text) => setOpportunityForm(prev => ({ ...prev, country: text }))}
      />
      
      <Input
        label="Business Model"
        placeholder="Describe the business model and revenue streams"
        value={opportunityForm.businessModel}
        onChangeText={(text) => setOpportunityForm(prev => ({ ...prev, businessModel: text }))}
        multiline
        numberOfLines={3}
      />
      
      <Input
        label="Use of Funds"
        placeholder="How will the investment be used?"
        value={opportunityForm.useOfFunds}
        onChangeText={(text) => setOpportunityForm(prev => ({ ...prev, useOfFunds: text }))}
        multiline
        numberOfLines={3}
      />
      
      <Input
        label="Market Opportunity"
        placeholder="Describe the market size and opportunity"
        value={opportunityForm.marketOpportunity}
        onChangeText={(text) => setOpportunityForm(prev => ({ ...prev, marketOpportunity: text }))}
        multiline
        numberOfLines={3}
      />
      
      <View style={styles.modalActions}>
        <Button
          title="Cancel"
          onPress={() => setShowCreateModal(false)}
          variant="outline"
          style={styles.modalButton}
        />
        <Button
          title="Create Opportunity"
          onPress={createInvestmentOpportunity}
          loading={loading}
          style={styles.modalButton}
        />
      </View>
    </ScrollView>
  );

  const renderSMEForm = () => (
    <ScrollView style={styles.modalContent}>
      <Text style={styles.modalTitle}>Create SME Profile</Text>
      
      <Input
        label="Company Name"
        placeholder="Company name"
        value={smeForm.companyName}
        onChangeText={(text) => setSmeForm(prev => ({ ...prev, companyName: text }))}
      />
      
      <Input
        label="Profile Title"
        placeholder="e.g., Leading AgriTech Company in Nigeria"
        value={smeForm.title}
        onChangeText={(text) => setSmeForm(prev => ({ ...prev, title: text }))}
      />
      
      <Input
        label="Company Description"
        placeholder="Brief overview of the company"
        value={smeForm.description}
        onChangeText={(text) => setSmeForm(prev => ({ ...prev, description: text }))}
        multiline
        numberOfLines={3}
      />
      
      <View style={styles.rowInputs}>
        <View style={styles.halfInput}>
          <Input
            label="Founding Year"
            placeholder="2020"
            value={smeForm.foundingYear}
            onChangeText={(text) => setSmeForm(prev => ({ ...prev, foundingYear: text }))}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfInput}>
          <Input
            label="Employee Count"
            placeholder="10-50"
            value={smeForm.employeeCount}
            onChangeText={(text) => setSmeForm(prev => ({ ...prev, employeeCount: text }))}
          />
        </View>
      </View>
      
      <View style={styles.rowInputs}>
        <View style={styles.halfInput}>
          <Input
            label="Annual Revenue"
            placeholder="$500K"
            value={smeForm.revenue}
            onChangeText={(text) => setSmeForm(prev => ({ ...prev, revenue: text }))}
          />
        </View>
        <View style={styles.halfInput}>
          <Input
            label="Growth Rate"
            placeholder="25% YoY"
            value={smeForm.growthRate}
            onChangeText={(text) => setSmeForm(prev => ({ ...prev, growthRate: text }))}
          />
        </View>
      </View>
      
      <Input
        label="Country"
        placeholder="Nigeria, Kenya, etc."
        value={smeForm.country}
        onChangeText={(text) => setSmeForm(prev => ({ ...prev, country: text }))}
      />
      
      <Input
        label="Product Description"
        placeholder="Describe your main products or services"
        value={smeForm.productDescription}
        onChangeText={(text) => setSmeForm(prev => ({ ...prev, productDescription: text }))}
        multiline
        numberOfLines={3}
      />
      
      <Input
        label="Traction & Achievements"
        placeholder="Key milestones, partnerships, awards"
        value={smeForm.traction}
        onChangeText={(text) => setSmeForm(prev => ({ ...prev, traction: text }))}
        multiline
        numberOfLines={3}
      />
      
      <View style={styles.modalActions}>
        <Button
          title="Cancel"
          onPress={() => setShowCreateModal(false)}
          variant="outline"
          style={styles.modalButton}
        />
        <Button
          title="Create Profile"
          onPress={createSMEProfile}
          loading={loading}
          style={styles.modalButton}
        />
      </View>
    </ScrollView>
  );

  if (!user || !userProfile?.role === 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDenied}>
          <Ionicons name="lock-closed" size={48} color="#ef4444" />
          <Text style={styles.accessDeniedText}>
            Admin Access Required
          </Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Investment CMS</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            loadInvestmentData();
            loadStats();
          }}
        >
          <Ionicons name="refresh" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Stats Card */}
      {renderStatsCard()}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'opportunities' && styles.activeTab]}
          onPress={() => setActiveTab('opportunities')}
        >
          <Text style={[styles.tabText, activeTab === 'opportunities' && styles.activeTabText]}>
            Investment Opportunities
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'smes' && styles.activeTab]}
          onPress={() => setActiveTab('smes')}
        >
          <Text style={[styles.tabText, activeTab === 'smes' && styles.activeTabText]}>
            SME Profiles
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading investment data...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'opportunities' ? investmentData : smeData}
          keyExtractor={(item) => item.id}
          renderItem={activeTab === 'opportunities' ? renderOpportunityItem : renderSMEItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons 
                name={activeTab === 'opportunities' ? 'trending-up' : 'business'} 
                size={48} 
                color="#ccc" 
              />
              <Text style={styles.emptyText}>
                No {activeTab === 'opportunities' ? 'investment opportunities' : 'SME profiles'} yet
              </Text>
              <Text style={styles.emptySubtext}>
                Create your first {activeTab === 'opportunities' ? 'opportunity' : 'SME profile'} to get started
              </Text>
            </View>
          }
        />
      )}

      {/* Create Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => {
          setModalType(activeTab === 'opportunities' ? 'opportunity' : 'sme');
          setShowCreateModal(true);
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modal}>
          {modalType === 'opportunity' ? renderOpportunityForm() : renderSMEForm()}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: enhancedDesignSystem.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: enhancedDesignSystem.colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    margin: 20,
    padding: 20,
    backgroundColor: enhancedDesignSystem.colors.primary[50],
    borderWidth: 1,
    borderColor: enhancedDesignSystem.colors.primary[200],
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: enhancedDesignSystem.colors.primary[600],
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#000',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  contentItem: {
    marginBottom: 16,
    padding: 16,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  contentInfo: {
    flex: 1,
    marginRight: 16,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  contentCompany: {
    fontSize: 14,
    fontWeight: '500',
    color: enhancedDesignSystem.colors.primary[600],
    marginBottom: 4,
  },
  contentMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  contentStats: {
    alignItems: 'flex-end',
  },
  fundingGoal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  fundingLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  contentDetails: {
    marginTop: 8,
  },
  contentDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  contentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusdraft: {
    backgroundColor: '#fef3c7',
  },
  statuspublished: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  riskBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '500',
  },
  activeBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    fontSize: 10,
    color: '#1e40af',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  verifiedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    color: '#065f46',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  createButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: enhancedDesignSystem.colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 32,
    marginBottom: 40,
  },
  modalButton: {
    flex: 1,
  },
  accessDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  accessDeniedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginVertical: 16,
    textAlign: 'center',
  },
});