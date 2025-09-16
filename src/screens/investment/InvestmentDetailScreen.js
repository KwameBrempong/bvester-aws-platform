/**
 * 💎 INVESTMENT DETAIL SCREEN
 * Detailed view of investment opportunity with investment flow
 */

import React, { useState, useContext, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const { width, height } = Dimensions.get('window');

export default function InvestmentDetailScreen({ navigation, route }) {
  const { opportunity } = route.params;
  const [selectedTab, setSelectedTab] = useState('overview');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const { userProfile } = useContext(AuthContext);
  const slideAnim = useRef(new Animated.Value(height)).current;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getFundingProgress = () => {
    return (opportunity.currentFunding / opportunity.fundingGoal) * 100;
  };

  const getEstimatedReturns = (amount) => {
    const investment = parseFloat(amount) || 0;
    const annualReturn = investment * (opportunity.expectedROI / 100);
    return {
      annual: annualReturn,
      total: investment + (annualReturn * 3), // 3 year projection
    };
  };

  const handleInvestPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowInvestModal(true);
    
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeInvestModal = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowInvestModal(false);
      setModalStep(1);
      setInvestmentAmount('');
      setAgreeToTerms(false);
    });
  };

  const handleInvestmentSubmit = async () => {
    const amount = parseFloat(investmentAmount);
    
    if (!amount || amount < opportunity.minimumInvestment) {
      Alert.alert(
        'Invalid Amount',
        `Minimum investment is ${formatCurrency(opportunity.minimumInvestment)}`
      );
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('Terms Required', 'Please agree to the terms and conditions');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Alert.alert(
      'Investment Submitted!',
      `Your investment of ${formatCurrency(amount)} in ${opportunity.title} has been submitted for review.`,
      [
        {
          text: 'View Portfolio',
          onPress: () => {
            closeInvestModal();
            navigation.navigate('Portfolio');
          }
        },
        {
          text: 'Continue Browsing',
          onPress: closeInvestModal,
          style: 'cancel'
        }
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

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Key Metrics */}
      <Card style={styles.metricsCard}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{opportunity.expectedROI}%</Text>
            <Text style={styles.metricLabel}>Expected ROI</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{formatCurrency(opportunity.revenue)}</Text>
            <Text style={styles.metricLabel}>Annual Revenue</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{opportunity.revenueGrowth}%</Text>
            <Text style={styles.metricLabel}>Revenue Growth</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{opportunity.businessStage}</Text>
            <Text style={styles.metricLabel}>Business Stage</Text>
          </View>
        </View>
      </Card>

      {/* Business Description */}
      <Card style={styles.descriptionCard}>
        <Text style={styles.sectionTitle}>About the Business</Text>
        <Text style={styles.descriptionText}>{opportunity.description}</Text>
        
        <Text style={styles.subsectionTitle}>Key Highlights</Text>
        {opportunity.highlights.map((highlight, index) => (
          <View key={index} style={styles.highlightItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.highlightText}>{highlight}</Text>
          </View>
        ))}
      </Card>

      {/* Market Opportunity */}
      <Card style={styles.marketCard}>
        <Text style={styles.sectionTitle}>Market Opportunity</Text>
        <View style={styles.marketInfo}>
          <View style={styles.marketItem}>
            <Ionicons name="location" size={20} color="#eab308" />
            <View style={styles.marketText}>
              <Text style={styles.marketTitle}>Target Market</Text>
              <Text style={styles.marketDescription}>
                {opportunity.country} and East African region
              </Text>
            </View>
          </View>
          
          <View style={styles.marketItem}>
            <Ionicons name="trending-up" size={20} color="#eab308" />
            <View style={styles.marketText}>
              <Text style={styles.marketTitle}>Market Size</Text>
              <Text style={styles.marketDescription}>
                ${opportunity.sector === 'Clean Energy' ? '2.1B' : '1.5B'} TAM in region
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderFinancialsTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.financialsCard}>
        <Text style={styles.sectionTitle}>Financial Overview</Text>
        
        <View style={styles.financialMetric}>
          <Text style={styles.financialLabel}>Current Valuation</Text>
          <Text style={styles.financialValue}>{formatCurrency(opportunity.fundingGoal * 4)}</Text>
        </View>
        
        <View style={styles.financialMetric}>
          <Text style={styles.financialLabel}>Annual Revenue (2024)</Text>
          <Text style={styles.financialValue}>{formatCurrency(opportunity.revenue)}</Text>
        </View>
        
        <View style={styles.financialMetric}>
          <Text style={styles.financialLabel}>Revenue Growth (YoY)</Text>
          <Text style={[styles.financialValue, { color: '#10b981' }]}>
            +{opportunity.revenueGrowth}%
          </Text>
        </View>
        
        <View style={styles.financialMetric}>
          <Text style={styles.financialLabel}>Gross Margin</Text>
          <Text style={styles.financialValue}>72%</Text>
        </View>
        
        <View style={styles.financialMetric}>
          <Text style={styles.financialLabel}>Burn Rate (Monthly)</Text>
          <Text style={styles.financialValue}>{formatCurrency(opportunity.revenue * 0.15)}</Text>
        </View>
        
        <View style={styles.financialMetric}>
          <Text style={styles.financialLabel}>Runway</Text>
          <Text style={styles.financialValue}>18 months</Text>
        </View>
      </Card>

      <Card style={styles.projectionCard}>
        <Text style={styles.sectionTitle}>3-Year Projection</Text>
        <Text style={styles.projectionNote}>
          Based on current growth trajectory and market expansion plans
        </Text>
        
        <View style={styles.projectionChart}>
          {[2025, 2026, 2027].map((year, index) => (
            <View key={year} style={styles.projectionYear}>
              <Text style={styles.yearLabel}>{year}</Text>
              <View 
                style={[
                  styles.projectionBar, 
                  { height: 40 + (index * 25) }
                ]} 
              />
              <Text style={styles.projectionValue}>
                {formatCurrency(opportunity.revenue * Math.pow(2.2, index + 1))}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );

  const renderRisksTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.riskCard}>
        <Text style={styles.sectionTitle}>Risk Assessment</Text>
        
        <View style={styles.riskOverall}>
          <Text style={styles.riskLevel}>Risk Level: {opportunity.riskLevel}</Text>
          <Text style={styles.riskScore}>Score: 6.2/10</Text>
        </View>

        <View style={styles.riskCategory}>
          <Text style={styles.riskCategoryTitle}>Market Risks</Text>
          <View style={styles.riskItem}>
            <View style={styles.riskIndicator} />
            <Text style={styles.riskText}>Regulatory changes in renewable energy sector</Text>
          </View>
          <View style={styles.riskItem}>
            <View style={styles.riskIndicator} />
            <Text style={styles.riskText}>Competition from established energy companies</Text>
          </View>
        </View>

        <View style={styles.riskCategory}>
          <Text style={styles.riskCategoryTitle}>Operational Risks</Text>
          <View style={styles.riskItem}>
            <View style={styles.riskIndicator} />
            <Text style={styles.riskText}>Supply chain dependencies</Text>
          </View>
          <View style={styles.riskItem}>
            <View style={styles.riskIndicator} />
            <Text style={styles.riskText}>Key personnel retention</Text>
          </View>
        </View>

        <View style={styles.riskCategory}>
          <Text style={styles.riskCategoryTitle}>Financial Risks</Text>
          <View style={styles.riskItem}>
            <View style={styles.riskIndicator} />
            <Text style={styles.riskText}>Currency fluctuation exposure</Text>
          </View>
          <View style={styles.riskItem}>
            <View style={styles.riskIndicator} />
            <Text style={styles.riskText}>Working capital requirements</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.mitigationCard}>
        <Text style={styles.sectionTitle}>Risk Mitigation</Text>
        <View style={styles.mitigationItem}>
          <Ionicons name="shield-checkmark" size={20} color="#10b981" />
          <Text style={styles.mitigationText}>
            Diversified supplier base across 3 countries
          </Text>
        </View>
        <View style={styles.mitigationItem}>
          <Ionicons name="shield-checkmark" size={20} color="#10b981" />
          <Text style={styles.mitigationText}>
            Government contracts provide revenue stability
          </Text>
        </View>
        <View style={styles.mitigationItem}>
          <Ionicons name="shield-checkmark" size={20} color="#10b981" />
          <Text style={styles.mitigationText}>
            Strong management team with 15+ years experience
          </Text>
        </View>
      </Card>
    </View>
  );

  const renderInvestmentModal = () => (
    <Modal
      visible={showInvestModal}
      transparent
      animationType="none"
      onRequestClose={closeInvestModal}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Invest in {opportunity.title}
            </Text>
            <TouchableOpacity onPress={closeInvestModal}>
              <Ionicons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {modalStep === 1 && (
            <View style={styles.modalStep}>
              <Text style={styles.stepTitle}>Investment Amount</Text>
              <Text style={styles.stepSubtitle}>
                Minimum investment: {formatCurrency(opportunity.minimumInvestment)}
              </Text>

              <Input
                label="Investment Amount (USD)"
                placeholder={formatCurrency(opportunity.minimumInvestment)}
                value={investmentAmount}
                onChangeText={setInvestmentAmount}
                keyboardType="numeric"
                leftIcon={<Text style={styles.currencySymbol}>$</Text>}
                style={styles.amountInput}
              />

              {investmentAmount && parseFloat(investmentAmount) >= opportunity.minimumInvestment && (
                <Card style={styles.returnsCard}>
                  <Text style={styles.returnsTitle}>Estimated Returns</Text>
                  <View style={styles.returnsRow}>
                    <Text style={styles.returnsLabel}>Annual Return:</Text>
                    <Text style={styles.returnsValue}>
                      {formatCurrency(getEstimatedReturns(investmentAmount).annual)}
                    </Text>
                  </View>
                  <View style={styles.returnsRow}>
                    <Text style={styles.returnsLabel}>3-Year Total:</Text>
                    <Text style={[styles.returnsValue, { color: '#10b981' }]}>
                      {formatCurrency(getEstimatedReturns(investmentAmount).total)}
                    </Text>
                  </View>
                </Card>
              )}

              <Button
                title="Continue"
                onPress={() => setModalStep(2)}
                disabled={!investmentAmount || parseFloat(investmentAmount) < opportunity.minimumInvestment}
                style={styles.continueButton}
              />
            </View>
          )}

          {modalStep === 2 && (
            <View style={styles.modalStep}>
              <Text style={styles.stepTitle}>Review & Confirm</Text>
              
              <View style={styles.reviewSection}>
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Investment Amount:</Text>
                  <Text style={styles.reviewValue}>{formatCurrency(parseFloat(investmentAmount))}</Text>
                </View>
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Expected Annual ROI:</Text>
                  <Text style={styles.reviewValue}>{opportunity.expectedROI}%</Text>
                </View>
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Estimated Annual Return:</Text>
                  <Text style={styles.reviewValue}>
                    {formatCurrency(getEstimatedReturns(investmentAmount).annual)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.termsCheckbox}
                onPress={() => setAgreeToTerms(!agreeToTerms)}
              >
                <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                  {agreeToTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>Investment Terms</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Risk Disclosure</Text>
                </Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <Button
                  title="Back"
                  onPress={() => setModalStep(1)}
                  variant="outline"
                  style={[styles.modalButton, { marginRight: 10 }]}
                />
                <Button
                  title="Confirm Investment"
                  onPress={handleInvestmentSubmit}
                  disabled={!agreeToTerms}
                  style={[styles.modalButton, { flex: 1 }]}
                />
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="heart-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Company Info */}
        <View style={styles.companySection}>
          <View style={styles.companyHeader}>
            <View style={styles.companyIcon}>
              <Text style={styles.companyEmoji}>{opportunity.image}</Text>
            </View>
            <View style={styles.companyDetails}>
              <Text style={styles.companyName}>{opportunity.title}</Text>
              <View style={styles.companyMeta}>
                <Ionicons name="location" size={16} color="#9ca3af" />
                <Text style={styles.companyLocation}>{opportunity.country}</Text>
                <Text style={styles.companySector}>{opportunity.sector}</Text>
              </View>
            </View>
          </View>

          {/* Funding Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                {formatCurrency(opportunity.currentFunding)} raised of {formatCurrency(opportunity.fundingGoal)}
              </Text>
              <Text style={styles.progressPercentage}>
                {getFundingProgress().toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(getFundingProgress(), 100)}%` }
                ]}
              />
            </View>
            <View style={styles.progressMeta}>
              <Text style={styles.investorCount}>
                {opportunity.investorCount} investors
              </Text>
              <Text style={styles.daysLeft}>
                {opportunity.daysLeft} days left
              </Text>
            </View>
          </View>

          {/* Investment Button */}
          <Button
            title={`Invest (Min. ${formatCurrency(opportunity.minimumInvestment)})`}
            onPress={handleInvestPress}
            style={styles.investButton}
            leftIcon={<Ionicons name="trending-up" size={20} color="#fff" />}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabs}>
              {renderTabButton('overview', 'Overview')}
              {renderTabButton('financials', 'Financials')}
              {renderTabButton('risks', 'Risks')}
            </View>
          </ScrollView>
        </View>

        {/* Tab Content */}
        <ScrollView style={styles.content}>
          {selectedTab === 'overview' && renderOverviewTab()}
          {selectedTab === 'financials' && renderFinancialsTab()}
          {selectedTab === 'risks' && renderRisksTab()}
        </ScrollView>

        {renderInvestmentModal()}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  companySection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  companyHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  companyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  companyEmoji: {
    fontSize: 32,
  },
  companyDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  companyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyLocation: {
    color: '#9ca3af',
    fontSize: 16,
    marginLeft: 6,
    marginRight: 16,
  },
  companySector: {
    color: '#eab308',
    fontSize: 16,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    color: '#d1d5db',
    fontSize: 16,
    fontWeight: '500',
  },
  progressPercentage: {
    color: '#eab308',
    fontSize: 18,
    fontWeight: '700',
  },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#eab308',
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  investorCount: {
    color: '#9ca3af',
    fontSize: 14,
  },
  daysLeft: {
    color: '#9ca3af',
    fontSize: 14,
  },
  investButton: {
    marginBottom: 8,
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
  metricsCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#eab308',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  descriptionCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  descriptionText: {
    color: '#d1d5db',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  highlightText: {
    color: '#d1d5db',
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
  },
  marketCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  marketInfo: {
    gap: 16,
  },
  marketItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketText: {
    marginLeft: 12,
    flex: 1,
  },
  marketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  marketDescription: {
    fontSize: 14,
    color: '#9ca3af',
  },
  financialsCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  financialMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  financialLabel: {
    fontSize: 16,
    color: '#d1d5db',
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  projectionCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  projectionNote: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  projectionChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  projectionYear: {
    alignItems: 'center',
  },
  yearLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  projectionBar: {
    width: 40,
    backgroundColor: '#eab308',
    borderRadius: 4,
    marginBottom: 8,
  },
  projectionValue: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  riskCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  riskOverall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
  },
  riskLevel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
  },
  riskScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
  },
  riskCategory: {
    marginBottom: 20,
  },
  riskCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
    marginRight: 12,
  },
  riskText: {
    color: '#d1d5db',
    fontSize: 14,
    flex: 1,
  },
  mitigationCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  mitigationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mitigationText: {
    color: '#d1d5db',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalStep: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 20,
  },
  amountInput: {
    marginBottom: 20,
  },
  currencySymbol: {
    color: '#9ca3af',
    fontSize: 18,
    fontWeight: '600',
  },
  returnsCard: {
    padding: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  returnsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 12,
  },
  returnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  returnsLabel: {
    fontSize: 14,
    color: '#d1d5db',
  },
  returnsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  continueButton: {
    marginTop: 20,
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  reviewLabel: {
    fontSize: 16,
    color: '#d1d5db',
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  termsCheckbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#6b7280',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  termsText: {
    color: '#d1d5db',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: '#eab308',
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
  },
  modalButton: {
    flex: 1,
  },
});