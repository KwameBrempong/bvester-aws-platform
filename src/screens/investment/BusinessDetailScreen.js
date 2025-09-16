import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import InvestmentService from '../../services/firebase/InvestmentService';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const BusinessDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentUser } = useAuth();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pledgeLoading, setPledgeLoading] = useState(false);
  const [hasExpressedInterest, setHasExpressedInterest] = useState(false);

  const businessId = route.params?.businessId;

  useEffect(() => {
    loadBusinessDetails();
    checkInterestStatus();
  }, [businessId]);

  const loadBusinessDetails = async () => {
    try {
      setLoading(true);
      const businessData = await InvestmentService.getBusinessById(businessId);
      setBusiness(businessData);
    } catch (error) {
      console.error('Error loading business details:', error);
      Alert.alert('Error', 'Failed to load business details');
    } finally {
      setLoading(false);
    }
  };

  const checkInterestStatus = async () => {
    try {
      const interests = await InvestmentService.getInvestorInterests(currentUser.uid);
      const hasInterest = interests.some(interest => interest.businessId === businessId);
      setHasExpressedInterest(hasInterest);
    } catch (error) {
      console.error('Error checking interest status:', error);
    }
  };

  const handleExpressInterest = async () => {
    if (hasExpressedInterest) {
      Alert.alert('Already Interested', 'You have already expressed interest in this business.');
      return;
    }

    try {
      setPledgeLoading(true);
      
      const interestData = {
        businessId: businessId,
        businessName: business.businessName,
        investorId: currentUser.uid,
        investorEmail: currentUser.email,
        amount: business.fundingGoal,
        status: 'interested',
        createdAt: new Date(),
        businessOwner: business.ownerId,
        type: 'interest_expression'
      };

      await InvestmentService.createInvestmentPledge(interestData);
      setHasExpressedInterest(true);
      
      Alert.alert(
        'Interest Recorded!',
        `Your interest in ${business.businessName} has been recorded. The business owner will be notified.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error expressing interest:', error);
      Alert.alert('Error', 'Failed to express interest. Please try again.');
    } finally {
      setPledgeLoading(false);
    }
  };

  const handleMakeInvestment = () => {
    navigation.navigate('InvestmentPledge', {
      businessId: businessId,
      business: business
    });
  };

  const handleContactBusiness = () => {
    Alert.alert(
      'Contact Business',
      'This feature will be available soon. For now, your interest has been recorded and the business owner will be notified.',
      [{ text: 'OK' }]
    );
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskLevel = (score) => {
    if (score >= 80) return { level: 'Low Risk', color: '#10B981' };
    if (score >= 60) return { level: 'Medium Risk', color: '#F59E0B' };
    return { level: 'High Risk', color: '#EF4444' };
  };

  const getInvestmentStageColor = (stage) => {
    switch (stage.toLowerCase()) {
      case 'seed': return '#8B5CF6';
      case 'series a': return '#3B82F6';
      case 'series b': return '#10B981';
      case 'growth': return '#F59E0B';
      case 'expansion': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading business details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!business) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Business not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const riskInfo = getRiskLevel(business.readinessScore || 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Business Header */}
        <View style={styles.businessHeader}>
          <View style={styles.businessLogo}>
            <Text style={styles.businessLogoText}>
              {business.businessName?.charAt(0).toUpperCase() || 'B'}
            </Text>
          </View>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{business.businessName}</Text>
            <Text style={styles.businessCategory}>{business.category}</Text>
            <Text style={styles.businessLocation}>{business.location}</Text>
          </View>
          <View style={styles.readinessScore}>
            <Text style={styles.scoreValue}>{business.readinessScore || 0}</Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
        </View>

        {/* Investment Stage and Risk */}
        <View style={styles.statusContainer}>
          <View style={[styles.stageTag, { backgroundColor: getInvestmentStageColor(business.stage || 'seed') }]}>
            <Text style={styles.stageText}>{business.stage || 'Seed'}</Text>
          </View>
          <View style={[styles.riskTag, { backgroundColor: riskInfo.color }]}>
            <Text style={styles.riskText}>{riskInfo.level}</Text>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatCurrency(business.fundingGoal || 0)}</Text>
              <Text style={styles.metricLabel}>Funding Goal</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{formatCurrency(business.annualRevenue || 0)}</Text>
              <Text style={styles.metricLabel}>Annual Revenue</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{business.employees || 0}</Text>
              <Text style={styles.metricLabel}>Employees</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{business.yearsInBusiness || 0}y</Text>
              <Text style={styles.metricLabel}>Years Active</Text>
            </View>
          </View>
        </View>

        {/* Business Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>About the Business</Text>
          <Text style={styles.descriptionText}>
            {business.description || 
            `${business.businessName} is a ${business.category} business based in ${business.location}. 
            They are seeking ${formatCurrency(business.fundingGoal || 0)} to support their growth and expansion plans.`}
          </Text>
        </View>

        {/* Financial Details */}
        <View style={styles.financialContainer}>
          <Text style={styles.sectionTitle}>Financial Information</Text>
          <View style={styles.financialGrid}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Monthly Revenue</Text>
              <Text style={styles.financialValue}>
                {formatCurrency((business.annualRevenue || 0) / 12)}
              </Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Profit Margin</Text>
              <Text style={styles.financialValue}>{business.profitMargin || 15}%</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Growth Rate</Text>
              <Text style={styles.financialValue}>{business.growthRate || 20}%/year</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Break-even</Text>
              <Text style={styles.financialValue}>{business.breakEvenMonths || 18} months</Text>
            </View>
          </View>
        </View>

        {/* Investment Opportunity */}
        <View style={styles.opportunityContainer}>
          <Text style={styles.sectionTitle}>Investment Opportunity</Text>
          <View style={styles.opportunityDetails}>
            <View style={styles.opportunityItem}>
              <Ionicons name="trending-up" size={20} color="#4F46E5" />
              <Text style={styles.opportunityText}>
                Expected ROI: {business.expectedROI || 25}% annually
              </Text>
            </View>
            <View style={styles.opportunityItem}>
              <Ionicons name="time" size={20} color="#4F46E5" />
              <Text style={styles.opportunityText}>
                Investment Period: {business.investmentPeriod || 36} months
              </Text>
            </View>
            <View style={styles.opportunityItem}>
              <Ionicons name="shield-checkmark" size={20} color="#4F46E5" />
              <Text style={styles.opportunityText}>
                Investment Type: {business.investmentType || 'Equity'}
              </Text>
            </View>
          </View>
        </View>

        {/* Use of Funds */}
        <View style={styles.fundsContainer}>
          <Text style={styles.sectionTitle}>Use of Funds</Text>
          <View style={styles.fundsList}>
            <View style={styles.fundItem}>
              <View style={styles.fundDot} />
              <Text style={styles.fundText}>Equipment and Technology (40%)</Text>
            </View>
            <View style={styles.fundItem}>
              <View style={styles.fundDot} />
              <Text style={styles.fundText}>Marketing and Sales (25%)</Text>
            </View>
            <View style={styles.fundItem}>
              <View style={styles.fundDot} />
              <Text style={styles.fundText}>Working Capital (20%)</Text>
            </View>
            <View style={styles.fundItem}>
              <View style={styles.fundDot} />
              <Text style={styles.fundText}>Team Expansion (15%)</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.interestButton, hasExpressedInterest && styles.interestButtonDisabled]}
            onPress={handleExpressInterest}
            disabled={pledgeLoading || hasExpressedInterest}
          >
            {pledgeLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons 
                  name={hasExpressedInterest ? "checkmark-circle" : "heart-outline"} 
                  size={20} 
                  color="#FFFFFF" 
                />
                <Text style={styles.interestButtonText}>
                  {hasExpressedInterest ? 'Interest Recorded' : 'Express Interest'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.investButton}
            onPress={handleMakeInvestment}
          >
            <Ionicons name="cash" size={20} color="#FFFFFF" />
            <Text style={styles.investButtonText}>Make Investment</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactButton}
            onPress={handleContactBusiness}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#4F46E5" />
            <Text style={styles.contactButtonText}>Contact Business</Text>
          </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 24,
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
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  businessLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  businessLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  businessLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  readinessScore: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  stageTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  stageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  riskTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metricsContainer: {
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  descriptionContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
  },
  financialContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 8,
  },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  financialItem: {
    width: '48%',
    marginBottom: 16,
  },
  financialLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  opportunityContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 8,
  },
  opportunityDetails: {
    gap: 12,
  },
  opportunityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  opportunityText: {
    fontSize: 16,
    color: '#4B5563',
    marginLeft: 12,
  },
  fundsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 8,
  },
  fundsList: {
    gap: 12,
  },
  fundItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fundDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginRight: 12,
  },
  fundText: {
    fontSize: 16,
    color: '#4B5563',
  },
  actionContainer: {
    padding: 20,
    gap: 12,
  },
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  interestButtonDisabled: {
    backgroundColor: '#10B981',
  },
  interestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  investButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  investButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default BusinessDetailScreen;