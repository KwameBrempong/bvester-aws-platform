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
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { InvestmentService } from '../../services/firebase/InvestmentService';
import { FinancialMetricsCalculator } from '../../utils/financialMetrics';
import { transactionService } from '../../services/firebase/FirebaseService';

export default function BusinessListingScreen({ navigation }) {
  const { user, userProfile } = useContext(AuthContext);
  const { formatCurrency } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [existingListing, setExistingListing] = useState(null);
  const [readinessScore, setReadinessScore] = useState(0);
  const [businessAnalysis, setBusinessAnalysis] = useState(null);
  
  const [formData, setFormData] = useState({
    businessName: userProfile?.businessName || '',
    industry: '',
    description: '',
    country: userProfile?.country || 'Nigeria',
    seekingAmount: '',
    investmentTypes: ['equity'],
    useOfFunds: '',
    businessModel: '',
    targetMarket: '',
    competitiveAdvantage: '',
    financialHighlights: '',
    teamDescription: '',
    contactEmail: user?.email || '',
    website: '',
    socialMedia: '',
    visibility: 'public', // public, private
    acceptsEquity: true,
    acceptsLoans: true,
    acceptsRevShare: false,
  });

  useEffect(() => {
    if (user) {
      loadExistingListing();
      calculateReadinessScore();
    }
  }, [user]);

  const loadExistingListing = async () => {
    try {
      const listings = await InvestmentService.getUserBusinessListings(user.uid);
      if (listings.length > 0) {
        const listing = listings[0]; // Use the first/latest listing
        setExistingListing(listing);
        setFormData({
          businessName: listing.businessName || formData.businessName,
          industry: listing.industry || '',
          description: listing.description || '',
          country: listing.country || formData.country,
          seekingAmount: listing.seekingAmount?.toString() || '',
          investmentTypes: listing.investmentTypes || ['equity'],
          useOfFunds: listing.useOfFunds || '',
          businessModel: listing.businessModel || '',
          targetMarket: listing.targetMarket || '',
          competitiveAdvantage: listing.competitiveAdvantage || '',
          financialHighlights: listing.financialHighlights || '',
          teamDescription: listing.teamDescription || '',
          contactEmail: listing.contactEmail || formData.contactEmail,
          website: listing.website || '',
          socialMedia: listing.socialMedia || '',
          visibility: listing.visibility || 'public',
          acceptsEquity: listing.acceptsEquity !== false,
          acceptsLoans: listing.acceptsLoans !== false,
          acceptsRevShare: listing.acceptsRevShare === true,
        });
      }
    } catch (error) {
      console.error('Error loading existing listing:', error);
    }
  };

  const calculateReadinessScore = async () => {
    try {
      console.log('Calculating readiness score for business listing...');
      
      const transactions = await transactionService.getUserTransactions(user.uid, {
        limit: 200
      });
      
      const calculator = new FinancialMetricsCalculator(transactions, userProfile);
      const analysis = {
        cashFlow: calculator.calculateCashFlow(),
        profitability: calculator.calculateProfitabilityRatios(),
        liquidity: calculator.calculateLiquidityMetrics(),
        africanMetrics: calculator.calculateAfricanMarketMetrics(),
        readinessScore: calculator.calculateInvestmentReadinessScore()
      };
      
      setBusinessAnalysis(analysis);
      setReadinessScore(analysis.readinessScore.overallScore);
      
    } catch (error) {
      console.error('Error calculating readiness score:', error);
      setReadinessScore(0);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateInvestmentTypes = (type, accepted) => {
    let types = [...formData.investmentTypes];
    
    if (accepted && !types.includes(type)) {
      types.push(type);
    } else if (!accepted && types.includes(type)) {
      types = types.filter(t => t !== type);
    }
    
    updateFormData('investmentTypes', types);
  };

  const validateForm = () => {
    const required = ['businessName', 'industry', 'description', 'seekingAmount', 'useOfFunds'];
    
    for (const field of required) {
      if (!formData[field] || formData[field].toString().trim() === '') {
        Alert.alert('Validation Error', `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    
    if (formData.investmentTypes.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one investment type');
      return false;
    }
    
    const amount = parseFloat(formData.seekingAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid investment amount');
      return false;
    }
    
    if (readinessScore < 30) {
      Alert.alert(
        'Low Readiness Score',
        `Your current readiness score is ${readinessScore}/100. Consider improving your business records and financial metrics before listing for investment.`,
        [
          { text: 'Continue Anyway', onPress: () => true },
          { text: 'Improve First', style: 'cancel', onPress: () => false }
        ]
      );
      return false;
    }
    
    return true;
  };

  const submitListing = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const listingData = {
        ...formData,
        seekingAmount: parseFloat(formData.seekingAmount),
        readinessScore,
        businessAnalysis,
        
        // Additional metadata
        lastUpdated: new Date().toISOString(),
        metrics: businessAnalysis ? {
          netCashFlow: businessAnalysis.cashFlow.netCashFlow,
          profitMargin: businessAnalysis.profitability.netProfitMargin,
          revenueGrowth: businessAnalysis.profitability.revenueGrowthRate,
          liquidityMonths: businessAnalysis.liquidity.monthsOfExpensesCovered,
        } : null,
        
        // African market specific data
        africanMetrics: businessAnalysis?.africanMetrics || null,
      };
      
      let result;
      if (existingListing) {
        result = await InvestmentService.updateBusinessListing(existingListing.id, listingData);
        Alert.alert('Success', 'Your business listing has been updated successfully!');
      } else {
        result = await InvestmentService.createBusinessListing(user.uid, listingData);
        Alert.alert('Success', 'Your business listing has been created successfully! It will be reviewed before going public.');
        setExistingListing(result);
      }
      
      console.log('Business listing saved:', result.id);
      
    } catch (error) {
      console.error('Error submitting listing:', error);
      Alert.alert('Error', 'Failed to submit business listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getReadinessColor = (score) => {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#ffc107';
    if (score >= 40) return '#fd7e14';
    return '#dc3545';
  };

  const getReadinessLabel = (score) => {
    if (score >= 80) return 'Investment Ready';
    if (score >= 60) return 'Nearly Ready';
    if (score >= 40) return 'Developing';
    return 'Early Stage';
  };

  const renderReadinessCard = () => (
    <View style={styles.readinessCard}>
      <Text style={styles.readinessTitle}>🎯 Investment Readiness Score</Text>
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreValue, { color: getReadinessColor(readinessScore) }]}>
          {readinessScore}/100
        </Text>
        <Text style={[styles.scoreLabel, { color: getReadinessColor(readinessScore) }]}>
          {getReadinessLabel(readinessScore)}
        </Text>
      </View>
      
      {businessAnalysis && (
        <View style={styles.quickMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Cash Flow</Text>
            <Text style={[styles.metricValue, { 
              color: businessAnalysis.cashFlow.netCashFlow >= 0 ? '#28a745' : '#dc3545' 
            }]}>
              {formatCurrency(businessAnalysis.cashFlow.netCashFlow, userProfile?.currency || 'USD')}
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Profit Margin</Text>
            <Text style={styles.metricValue}>
              {businessAnalysis.profitability.netProfitMargin.toFixed(1)}%
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Growth Rate</Text>
            <Text style={styles.metricValue}>
              {businessAnalysis.profitability.revenueGrowthRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.improveButton}
        onPress={() => navigation.navigate('Analysis')}
      >
        <Text style={styles.improveButtonText}>📊 View Full Analysis</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {existingListing ? 'Update Business Listing' : 'List Your Business'}
          </Text>
          <Text style={styles.subtitle}>
            Connect with global investors seeking African SMEs
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderReadinessCard()}

          {/* Basic Business Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Name *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.businessName}
                onChangeText={(text) => updateFormData('businessName', text)}
                placeholder="Enter your business name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Industry *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.industry}
                  onValueChange={(value) => updateFormData('industry', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Industry" value="" />
                  <Picker.Item label="Technology" value="Technology" />
                  <Picker.Item label="Agriculture" value="Agriculture" />
                  <Picker.Item label="Healthcare" value="Healthcare" />
                  <Picker.Item label="Manufacturing" value="Manufacturing" />
                  <Picker.Item label="Retail" value="Retail" />
                  <Picker.Item label="Services" value="Services" />
                  <Picker.Item label="Education" value="Education" />
                  <Picker.Item label="Financial Services" value="Financial Services" />
                  <Picker.Item label="Real Estate" value="Real Estate" />
                  <Picker.Item label="Transportation" value="Transportation" />
                  <Picker.Item label="Energy" value="Energy" />
                  <Picker.Item label="Food & Beverage" value="Food & Beverage" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Country</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.country}
                  onValueChange={(value) => updateFormData('country', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Nigeria" value="Nigeria" />
                  <Picker.Item label="Kenya" value="Kenya" />
                  <Picker.Item label="South Africa" value="South Africa" />
                  <Picker.Item label="Ghana" value="Ghana" />
                  <Picker.Item label="Rwanda" value="Rwanda" />
                  <Picker.Item label="Uganda" value="Uganda" />
                  <Picker.Item label="Tanzania" value="Tanzania" />
                  <Picker.Item label="Egypt" value="Egypt" />
                  <Picker.Item label="Morocco" value="Morocco" />
                  <Picker.Item label="Ethiopia" value="Ethiopia" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                placeholder="Describe your business, products/services, and value proposition"
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Investment Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Investment Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Seeking Investment Amount (USD) *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.seekingAmount}
                onChangeText={(text) => updateFormData('seekingAmount', text)}
                placeholder="e.g., 50000"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Investment Types Accepted *</Text>
              <View style={styles.investmentTypes}>
                <View style={styles.typeRow}>
                  <Switch
                    value={formData.acceptsEquity}
                    onValueChange={(value) => {
                      updateFormData('acceptsEquity', value);
                      updateInvestmentTypes('equity', value);
                    }}
                  />
                  <Text style={styles.typeLabel}>💼 Equity Investment</Text>
                </View>
                
                <View style={styles.typeRow}>
                  <Switch
                    value={formData.acceptsLoans}
                    onValueChange={(value) => {
                      updateFormData('acceptsLoans', value);
                      updateInvestmentTypes('loan', value);
                    }}
                  />
                  <Text style={styles.typeLabel}>💰 Business Loans</Text>
                </View>
                
                <View style={styles.typeRow}>
                  <Switch
                    value={formData.acceptsRevShare}
                    onValueChange={(value) => {
                      updateFormData('acceptsRevShare', value);
                      updateInvestmentTypes('revenue_sharing', value);
                    }}
                  />
                  <Text style={styles.typeLabel}>📊 Revenue Sharing</Text>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Use of Funds *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.useOfFunds}
                onChangeText={(text) => updateFormData('useOfFunds', text)}
                placeholder="How will you use the investment? (e.g., inventory, equipment, marketing, expansion)"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Business Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏢 Business Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Model</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.businessModel}
                onChangeText={(text) => updateFormData('businessModel', text)}
                placeholder="How do you make money? Describe your revenue streams"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Market</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.targetMarket}
                onChangeText={(text) => updateFormData('targetMarket', text)}
                placeholder="Who are your customers? Market size and demographics"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Competitive Advantage</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.competitiveAdvantage}
                onChangeText={(text) => updateFormData('competitiveAdvantage', text)}
                placeholder="What makes your business unique? Why will you succeed?"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Financial Highlights</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.financialHighlights}
                onChangeText={(text) => updateFormData('financialHighlights', text)}
                placeholder="Key financial achievements, revenue milestones, growth metrics"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Team Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.teamDescription}
                onChangeText={(text) => updateFormData('teamDescription', text)}
                placeholder="Key team members, experience, and qualifications"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📞 Contact Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Email</Text>
              <TextInput
                style={styles.textInput}
                value={formData.contactEmail}
                onChangeText={(text) => updateFormData('contactEmail', text)}
                placeholder="business@example.com"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Website</Text>
              <TextInput
                style={styles.textInput}
                value={formData.website}
                onChangeText={(text) => updateFormData('website', text)}
                placeholder="https://yourbusiness.com"
                keyboardType="url"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Social Media</Text>
              <TextInput
                style={styles.textInput}
                value={formData.socialMedia}
                onChangeText={(text) => updateFormData('socialMedia', text)}
                placeholder="LinkedIn, Twitter, Instagram profiles"
              />
            </View>
          </View>

          {/* Listing Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Listing Settings</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Visibility</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.visibility}
                  onValueChange={(value) => updateFormData('visibility', value)}
                  style={styles.picker}
                >
                  <Picker.Item label="🌍 Public (Visible to all investors)" value="public" />
                  <Picker.Item label="🔒 Private (Only you can see)" value="private" />
                </Picker>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={submitListing}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? '🔄 Saving...' : 
               existingListing ? '💾 Update Listing' : '🚀 Create Listing'}
            </Text>
          </TouchableOpacity>

          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              💡 <Text style={styles.disclaimerBold}>Pro Tip:</Text> Businesses with higher readiness scores 
              (80+) receive 3x more investor interest. Complete your financial records and improve your 
              business metrics to increase your chances of securing investment.
            </Text>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  readinessCard: {
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
  readinessTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  improveButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  improveButtonText: {
    fontSize: 14,
    color: '#2E7D8F',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  picker: {
    height: 50,
  },
  investmentTypes: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#2E7D8F',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginVertical: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 13,
    color: '#2E7D8F',
    lineHeight: 18,
    textAlign: 'center',
  },
  disclaimerBold: {
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 30,
  },
});