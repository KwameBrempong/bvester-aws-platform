import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../context/AuthContext';
import InvestmentService from '../../services/firebase/InvestmentService';

const InvestorProfileScreen = () => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    country: 'Nigeria',
    preferredCurrency: 'USD',
    riskTolerance: 'moderate',
    investmentGoals: [],
    minInvestmentAmount: 1000,
    maxInvestmentAmount: 50000,
    preferredSectors: [],
    investmentHorizon: 'medium',
    accreditedInvestor: false,
    receiveNotifications: true,
    receiveMarketUpdates: true,
    biography: '',
    linkedInProfile: '',
    totalInvestments: 0,
    totalPortfolioValue: 0,
    successfulExits: 0,
    averageROI: 0
  });
  const [editMode, setEditMode] = useState(false);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);

  const investmentGoalOptions = [
    'Wealth Building',
    'Passive Income',
    'Social Impact',
    'Portfolio Diversification',
    'Supporting African SMEs',
    'High Growth Potential',
    'Risk Mitigation',
    'Currency Hedging'
  ];

  const sectorOptions = [
    'Technology',
    'Agriculture',
    'Healthcare',
    'Manufacturing',
    'Retail',
    'Financial Services',
    'Education',
    'Real Estate',
    'Energy',
    'Transportation',
    'Tourism',
    'Food & Beverage'
  ];

  const riskToleranceOptions = [
    { value: 'conservative', label: 'Conservative', description: 'Low risk, stable returns' },
    { value: 'moderate', label: 'Moderate', description: 'Balanced risk and return' },
    { value: 'aggressive', label: 'Aggressive', description: 'High risk, high potential returns' }
  ];

  const investmentHorizonOptions = [
    { value: 'short', label: 'Short-term (< 2 years)' },
    { value: 'medium', label: 'Medium-term (2-5 years)' },
    { value: 'long', label: 'Long-term (5+ years)' }
  ];

  const africanCountries = [
    'Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Uganda', 'Tanzania',
    'Rwanda', 'Senegal', 'Côte d\'Ivoire', 'Ethiopia', 'Morocco', 'Egypt'
  ];

  const currencies = ['USD', 'NGN', 'KES', 'ZAR', 'GHS', 'UGX'];

  useEffect(() => {
    loadInvestorProfile();
  }, []);

  const loadInvestorProfile = async () => {
    try {
      setLoading(true);
      const profileData = await InvestmentService.getInvestorProfile(currentUser.uid);
      
      if (profileData) {
        setProfile(prev => ({
          ...prev,
          ...profileData,
          email: currentUser.email,
        }));
      } else {
        // Initialize with user email
        setProfile(prev => ({
          ...prev,
          email: currentUser.email,
          fullName: currentUser.displayName || ''
        }));
      }

      // Load investment statistics
      const stats = await InvestmentService.getInvestorStats(currentUser.uid);
      setProfile(prev => ({
        ...prev,
        ...stats
      }));
    } catch (error) {
      console.error('Error loading investor profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      await InvestmentService.updateInvestorProfile(currentUser.uid, {
        ...profile,
        updatedAt: new Date()
      });
      
      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleGoalToggle = (goal) => {
    const updatedGoals = profile.investmentGoals.includes(goal)
      ? profile.investmentGoals.filter(g => g !== goal)
      : [...profile.investmentGoals, goal];
    
    setProfile(prev => ({ ...prev, investmentGoals: updatedGoals }));
  };

  const handleSectorToggle = (sector) => {
    const updatedSectors = profile.preferredSectors.includes(sector)
      ? profile.preferredSectors.filter(s => s !== sector)
      : [...profile.preferredSectors, sector];
    
    setProfile(prev => ({ ...prev, preferredSectors: updatedSectors }));
  };

  const formatCurrency = (amount, currency = profile.preferredCurrency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderStatCard = (title, value, icon, color) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderSelectorModal = (visible, onClose, title, options, selectedOptions, onToggle, isMultiSelect = true) => (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalDone}>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalContent}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.optionItem}
              onPress={() => onToggle(option)}
            >
              <Text style={styles.optionText}>{option}</Text>
              <View style={[
                styles.checkbox,
                (isMultiSelect ? selectedOptions.includes(option) : selectedOptions === option) && styles.checkboxSelected
              ]}>
                {(isMultiSelect ? selectedOptions.includes(option) : selectedOptions === option) && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading investor profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Investor Profile</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => editMode ? saveProfile() : setEditMode(true)}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#4F46E5" />
          ) : (
            <Text style={styles.editButtonText}>
              {editMode ? 'Save' : 'Edit'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.fullName?.charAt(0).toUpperCase() || currentUser.email.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.fullName || 'Investor'}</Text>
            <Text style={styles.profileEmail}>{profile.email}</Text>
            <Text style={styles.profileLocation}>{profile.country}</Text>
          </View>
          <View style={styles.verificationBadge}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
          </View>
        </View>

        {/* Investment Statistics */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Investment Overview</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Total Invested',
              formatCurrency(profile.totalPortfolioValue || 0),
              'wallet',
              '#4F46E5'
            )}
            {renderStatCard(
              'Active Investments',
              profile.totalInvestments || 0,
              'briefcase',
              '#10B981'
            )}
            {renderStatCard(
              'Successful Exits',
              profile.successfulExits || 0,
              'trophy',
              '#F59E0B'
            )}
            {renderStatCard(
              'Average ROI',
              `${profile.averageROI || 0}%`,
              'trending-up',
              '#EF4444'
            )}
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, !editMode && styles.inputDisabled]}
              value={profile.fullName}
              onChangeText={(text) => setProfile(prev => ({ ...prev, fullName: text }))}
              editable={editMode}
              placeholder="Enter your full name"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, !editMode && styles.inputDisabled]}
              value={profile.phoneNumber}
              onChangeText={(text) => setProfile(prev => ({ ...prev, phoneNumber: text }))}
              editable={editMode}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Country</Text>
            <View style={[styles.pickerContainer, !editMode && styles.inputDisabled]}>
              <Picker
                selectedValue={profile.country}
                onValueChange={(value) => setProfile(prev => ({ ...prev, country: value }))}
                enabled={editMode}
                style={styles.picker}
              >
                {africanCountries.map(country => (
                  <Picker.Item key={country} label={country} value={country} />
                ))}
              </Picker>
            </View>
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Biography</Text>
            <TextInput
              style={[styles.textArea, !editMode && styles.inputDisabled]}
              value={profile.biography}
              onChangeText={(text) => setProfile(prev => ({ ...prev, biography: text }))}
              editable={editMode}
              placeholder="Tell us about your investment experience and goals"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Investment Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment Preferences</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Preferred Currency</Text>
            <View style={[styles.pickerContainer, !editMode && styles.inputDisabled]}>
              <Picker
                selectedValue={profile.preferredCurrency}
                onValueChange={(value) => setProfile(prev => ({ ...prev, preferredCurrency: value }))}
                enabled={editMode}
                style={styles.picker}
              >
                {currencies.map(currency => (
                  <Picker.Item key={currency} label={currency} value={currency} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Risk Tolerance</Text>
            <View style={styles.riskOptions}>
              {riskToleranceOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.riskOption,
                    profile.riskTolerance === option.value && styles.riskOptionSelected,
                    !editMode && styles.inputDisabled
                  ]}
                  onPress={() => editMode && setProfile(prev => ({ ...prev, riskTolerance: option.value }))}
                  disabled={!editMode}
                >
                  <Text style={[
                    styles.riskOptionTitle,
                    profile.riskTolerance === option.value && styles.riskOptionTitleSelected
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    styles.riskOptionDescription,
                    profile.riskTolerance === option.value && styles.riskOptionDescriptionSelected
                  ]}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Investment Range</Text>
            <View style={styles.rangeContainer}>
              <View style={styles.rangeInput}>
                <Text style={styles.rangeLabel}>Minimum</Text>
                <TextInput
                  style={[styles.input, !editMode && styles.inputDisabled]}
                  value={profile.minInvestmentAmount?.toString()}
                  onChangeText={(text) => setProfile(prev => ({ 
                    ...prev, 
                    minInvestmentAmount: parseInt(text) || 0 
                  }))}
                  editable={editMode}
                  keyboardType="numeric"
                  placeholder="1000"
                />
              </View>
              <View style={styles.rangeInput}>
                <Text style={styles.rangeLabel}>Maximum</Text>
                <TextInput
                  style={[styles.input, !editMode && styles.inputDisabled]}
                  value={profile.maxInvestmentAmount?.toString()}
                  onChangeText={(text) => setProfile(prev => ({ 
                    ...prev, 
                    maxInvestmentAmount: parseInt(text) || 0 
                  }))}
                  editable={editMode}
                  keyboardType="numeric"
                  placeholder="50000"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.selectorButton, !editMode && styles.inputDisabled]}
            onPress={() => editMode && setShowGoalsModal(true)}
            disabled={!editMode}
          >
            <Text style={styles.selectorLabel}>Investment Goals</Text>
            <Text style={styles.selectorValue}>
              {profile.investmentGoals.length > 0 
                ? `${profile.investmentGoals.length} selected`
                : 'Select goals'
              }
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.selectorButton, !editMode && styles.inputDisabled]}
            onPress={() => editMode && setShowSectorModal(true)}
            disabled={!editMode}
          >
            <Text style={styles.selectorLabel}>Preferred Sectors</Text>
            <Text style={styles.selectorValue}>
              {profile.preferredSectors.length > 0 
                ? `${profile.preferredSectors.length} selected`
                : 'Select sectors'
              }
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Investment Horizon</Text>
            <View style={[styles.pickerContainer, !editMode && styles.inputDisabled]}>
              <Picker
                selectedValue={profile.investmentHorizon}
                onValueChange={(value) => setProfile(prev => ({ ...prev, investmentHorizon: value }))}
                enabled={editMode}
                style={styles.picker}
              >
                {investmentHorizonOptions.map(option => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.switchRow}>
            <View style={styles.switchContent}>
              <Text style={styles.switchLabel}>Accredited Investor</Text>
              <Text style={styles.switchDescription}>
                I meet the criteria for accredited investor status
              </Text>
            </View>
            <Switch
              value={profile.accreditedInvestor}
              onValueChange={(value) => setProfile(prev => ({ ...prev, accreditedInvestor: value }))}
              disabled={!editMode}
              trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
              thumbColor={profile.accreditedInvestor ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchContent}>
              <Text style={styles.switchLabel}>Investment Notifications</Text>
              <Text style={styles.switchDescription}>
                Receive notifications about new investment opportunities
              </Text>
            </View>
            <Switch
              value={profile.receiveNotifications}
              onValueChange={(value) => setProfile(prev => ({ ...prev, receiveNotifications: value }))}
              disabled={!editMode}
              trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
              thumbColor={profile.receiveNotifications ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchContent}>
              <Text style={styles.switchLabel}>Market Updates</Text>
              <Text style={styles.switchDescription}>
                Receive weekly market insights and analysis
              </Text>
            </View>
            <Switch
              value={profile.receiveMarketUpdates}
              onValueChange={(value) => setProfile(prev => ({ ...prev, receiveMarketUpdates: value }))}
              disabled={!editMode}
              trackColor={{ false: '#E5E7EB', true: '#4F46E5' }}
              thumbColor={profile.receiveMarketUpdates ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modals */}
      {renderSelectorModal(
        showGoalsModal,
        () => setShowGoalsModal(false),
        'Investment Goals',
        investmentGoalOptions,
        profile.investmentGoals,
        handleGoalToggle,
        true
      )}

      {renderSelectorModal(
        showSectorModal,
        () => setShowSectorModal(false),
        'Preferred Sectors',
        sectorOptions,
        profile.preferredSectors,
        handleSectorToggle,
        true
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  profileLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  verificationBadge: {
    padding: 8,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  riskOptions: {
    gap: 8,
  },
  riskOption: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  riskOptionSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#F3F4F6',
  },
  riskOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  riskOptionTitleSelected: {
    color: '#4F46E5',
  },
  riskOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  riskOptionDescriptionSelected: {
    color: '#4F46E5',
  },
  rangeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  rangeInput: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  selectorValue: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default InvestorProfileScreen;