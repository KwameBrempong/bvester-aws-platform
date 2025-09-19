/**
 * High-Converting Investor Landing Page Component
 * Optimized for investor acquisition and conversion
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { growthEngine } from '../services/GrowthEngineering';

const { width, height } = Dimensions.get('window');

export default function InvestorLandingPage({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [investmentCapacity, setInvestmentCapacity] = useState('');
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [loading, setLoading] = useState(false);

  // Extract referral code from URL params
  useEffect(() => {
    if (route.params?.ref) {
      setReferralCode(route.params.ref);
      // Track referral landing
      growthEngine.trackGrowthEvent('referral_landing', {
        referralCode: route.params.ref,
        source: route.params.utm_source || 'direct',
        timestamp: Date.now()
      });
    }
  }, [route.params]);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      name: "Sarah Chen",
      location: "Toronto, Canada",
      role: "Software Engineer",
      text: "Invested $25,000 across 5 African SMEs and earned 18% returns in my first year. The platform makes due diligence so easy!",
      roi: "18% ROI",
      amount: "$25,000"
    },
    {
      name: "David Okoye", 
      location: "London, UK",
      role: "Investment Banker",
      text: "Finally found a way to invest back home in Nigeria while living abroad. Already seeing great returns from 3 businesses.",
      roi: "22% ROI",
      amount: "$50,000"
    },
    {
      name: "Maria Santos",
      location: "New York, USA", 
      role: "Portfolio Manager",
      text: "Diversified my portfolio with African opportunities. The readiness scores help me make informed decisions quickly.",
      roi: "15% ROI",
      amount: "$75,000"
    }
  ];

  const successMetrics = [
    { number: "2,340+", label: "Active Investors", icon: "👥" },
    { number: "$45M+", label: "Total Invested", icon: "💰" },
    { number: "890+", label: "SMEs Funded", icon: "🏢" },
    { number: "16.8%", label: "Avg. Returns", icon: "📈" }
  ];

  const investmentOpportunities = [
    {
      name: "TechFlow Nigeria",
      industry: "Fintech",
      country: "Nigeria",
      seeking: "$150,000",
      readiness: 87,
      roi: "24% projected",
      description: "Mobile payment solution for rural communities"
    },
    {
      name: "AgriBoost Kenya", 
      industry: "Agriculture",
      country: "Kenya",
      seeking: "$200,000",
      readiness: 82,
      roi: "19% projected", 
      description: "Smart irrigation systems for small farms"
    },
    {
      name: "EduTech Ghana",
      industry: "Education",
      country: "Ghana", 
      seeking: "$100,000",
      readiness: 79,
      roi: "21% projected",
      description: "Digital learning platform for African students"
    }
  ];

  const handleEmailSignup = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setShowSignupModal(true);
    
    // Track email capture
    growthEngine.trackGrowthEvent('email_captured', {
      email,
      source: 'landing_page',
      referralCode: referralCode || null,
      timestamp: Date.now()
    });
  };

  const handleFullSignup = async () => {
    if (!fullName.trim() || !investmentCapacity.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Create lead record
      const leadData = {
        email,
        fullName,
        investmentCapacity: parseInt(investmentCapacity.replace(/[^0-9]/g, '')),
        referralCode: referralCode || null,
        source: 'landing_page',
        status: 'qualified_lead',
        createdAt: new Date().toISOString()
      };

      // Track qualified lead
      growthEngine.trackGrowthEvent('qualified_lead_created', leadData);

      setShowSignupModal(false);
      setLoading(false);

      Alert.alert(
        'Success!', 
        'Thank you for your interest! Our investment team will contact you within 24 hours with exclusive opportunities.',
        [
          { 
            text: 'Start Investing Now', 
            onPress: () => navigation.navigate('Register', { leadData })
          }
        ]
      );

    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const renderHeroSection = () => (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800' }}
      style={styles.heroBackground}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(46, 125, 143, 0.9)', 'rgba(46, 125, 143, 0.7)']}
        style={styles.heroOverlay}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>
            Invest in Africa's{'\n'}Most Promising SMEs
          </Text>
          <Text style={styles.heroSubtitle}>
            Join 2,340+ investors earning average returns of 16.8% while supporting African entrepreneurship
          </Text>
          
          {referralCode && (
            <View style={styles.referralBadge}>
              <Text style={styles.referralText}>
                🎁 Special invite from a successful investor
              </Text>
            </View>
          )}

          <View style={styles.emailCaptureContainer}>
            <TextInput
              style={styles.emailInput}
              placeholder="Enter your email for exclusive opportunities"
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={handleEmailSignup}
            >
              <Text style={styles.ctaButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.trustSignal}>
            🔒 Secure • 📊 Vetted Opportunities • 🚀 High Returns
          </Text>
        </View>
      </LinearGradient>
    </ImageBackground>
  );

  const renderSocialProof = () => (
    <View style={styles.socialProofSection}>
      <Text style={styles.sectionTitle}>Trusted by Investors Worldwide</Text>
      
      <View style={styles.metricsContainer}>
        {successMetrics.map((metric, index) => (
          <View key={index} style={styles.metricCard}>
            <Text style={styles.metricIcon}>{metric.icon}</Text>
            <Text style={styles.metricNumber}>{metric.number}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.testimonialContainer}>
        <View style={styles.testimonialCard}>
          <Text style={styles.testimonialText}>
            "{testimonials[currentTestimonial].text}"
          </Text>
          <View style={styles.testimonialAuthor}>
            <View style={styles.testimonialInfo}>
              <Text style={styles.testimonialName}>
                {testimonials[currentTestimonial].name}
              </Text>
              <Text style={styles.testimonialLocation}>
                {testimonials[currentTestimonial].role} • {testimonials[currentTestimonial].location}
              </Text>
            </View>
            <View style={styles.testimonialStats}>
              <Text style={styles.testimonialRoi}>
                {testimonials[currentTestimonial].roi}
              </Text>
              <Text style={styles.testimonialAmount}>
                {testimonials[currentTestimonial].amount}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.testimonialDots}>
          {testimonials.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.testimonialDot,
                currentTestimonial === index && styles.testimonialDotActive
              ]}
              onPress={() => setCurrentTestimonial(index)}
            />
          ))}
        </View>
      </View>
    </View>
  );

  const renderFeaturedOpportunities = () => (
    <View style={styles.opportunitiesSection}>
      <Text style={styles.sectionTitle}>Featured Investment Opportunities</Text>
      <Text style={styles.sectionSubtitle}>
        Pre-vetted SMEs with high growth potential and strong readiness scores
      </Text>

      {investmentOpportunities.map((opportunity, index) => (
        <View key={index} style={styles.opportunityCard}>
          <View style={styles.opportunityHeader}>
            <View style={styles.opportunityInfo}>
              <Text style={styles.opportunityName}>{opportunity.name}</Text>
              <Text style={styles.opportunityLocation}>
                📍 {opportunity.country} • {opportunity.industry}
              </Text>
            </View>
            <View style={styles.readinessScore}>
              <Text style={styles.readinessNumber}>{opportunity.readiness}</Text>
              <Text style={styles.readinessLabel}>Readiness</Text>
            </View>
          </View>

          <Text style={styles.opportunityDescription}>
            {opportunity.description}
          </Text>

          <View style={styles.opportunityFooter}>
            <View style={styles.opportunityMetrics}>
              <Text style={styles.opportunityMetric}>
                💰 Seeking: {opportunity.seeking}
              </Text>
              <Text style={styles.opportunityMetric}>
                📈 Projected ROI: {opportunity.roi}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.viewOpportunityButton}
              onPress={() => setShowSignupModal(true)}
            >
              <Text style={styles.viewOpportunityText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => setShowSignupModal(true)}
      >
        <Text style={styles.viewAllText}>View All 150+ Opportunities →</Text>
      </TouchableOpacity>
    </View>
  );

  const renderValueProposition = () => (
    <View style={styles.valueSection}>
      <Text style={styles.sectionTitle}>Why Choose Bvester?</Text>
      
      <View style={styles.valueProps}>
        <View style={styles.valueProp}>
          <Text style={styles.valuePropIcon}>🎯</Text>
          <Text style={styles.valuePropTitle}>Vetted Opportunities</Text>
          <Text style={styles.valuePropText}>
            Every SME undergoes rigorous due diligence with AI-powered readiness scoring
          </Text>
        </View>

        <View style={styles.valueProp}>
          <Text style={styles.valuePropIcon}>🔒</Text>
          <Text style={styles.valuePropTitle}>Secure & Transparent</Text>
          <Text style={styles.valuePropText}>
            Bank-level security with real-time reporting and performance tracking
          </Text>
        </View>

        <View style={styles.valueProp}>
          <Text style={styles.valuePropIcon}>🌍</Text>
          <Text style={styles.valuePropTitle}>Impact + Returns</Text>
          <Text style={styles.valuePropText}>
            Generate strong returns while supporting African entrepreneurship and job creation
          </Text>
        </View>

        <View style={styles.valueProp}>
          <Text style={styles.valuePropIcon}>📊</Text>
          <Text style={styles.valuePropTitle}>Data-Driven Insights</Text>
          <Text style={styles.valuePropText}>
            Advanced analytics and market intelligence to guide your investment decisions
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSignupModal = () => (
    <Modal
      visible={showSignupModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowSignupModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowSignupModal(false)}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Start Your Investment Journey</Text>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalSubtitle}>
            Join thousands of investors earning strong returns while supporting African entrepreneurs
          </Text>

          <View style={styles.modalForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name *</Text>
              <TextInput
                style={styles.formInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email Address *</Text>
              <TextInput
                style={styles.formInput}
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Investment Capacity *</Text>
              <TextInput
                style={styles.formInput}
                value={investmentCapacity}
                onChangeText={setInvestmentCapacity}
                placeholder="e.g., $50,000"
                keyboardType="numeric"
              />
              <Text style={styles.formHint}>
                This helps us match you with suitable opportunities
              </Text>
            </View>

            {referralCode && (
              <View style={styles.referralInfo}>
                <Text style={styles.referralInfoText}>
                  🎁 You're joining through a referral! You'll receive bonus credits when you make your first investment.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.signupButton, loading && styles.signupButtonDisabled]}
              onPress={handleFullSignup}
              disabled={loading}
            >
              <Text style={styles.signupButtonText}>
                {loading ? 'Processing...' : 'Get Exclusive Access'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              By signing up, you agree to receive investment opportunities and market insights. No spam, unsubscribe anytime.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderHeroSection()}
      {renderSocialProof()}
      {renderFeaturedOpportunities()}
      {renderValueProposition()}
      
      <View style={styles.finalCTA}>
        <Text style={styles.finalCTATitle}>Ready to Start Investing?</Text>
        <Text style={styles.finalCTASubtitle}>
          Join thousands of investors building wealth while supporting African entrepreneurship
        </Text>
        <TouchableOpacity
          style={styles.finalCTAButton}
          onPress={() => setShowSignupModal(true)}
        >
          <Text style={styles.finalCTAButtonText}>Start Investing Today</Text>
        </TouchableOpacity>
      </View>

      {renderSignupModal()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Hero Section
  heroBackground: {
    height: height * 0.75,
    justifyContent: 'center',
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 42,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  referralBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 30,
  },
  referralText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emailCaptureContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  emailInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
    fontSize: 16,
    color: '#333',
  },
  ctaButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    justifyContent: 'center',
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  trustSignal: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
  },

  // Social Proof Section
  socialProofSection: {
    backgroundColor: '#fff',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  metricCard: {
    alignItems: 'center',
    flex: 1,
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D8F',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // Testimonial
  testimonialContainer: {
    alignItems: 'center',
  },
  testimonialCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    width: '100%',
  },
  testimonialText: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testimonialInfo: {
    flex: 1,
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  testimonialLocation: {
    fontSize: 14,
    color: '#666',
  },
  testimonialStats: {
    alignItems: 'flex-end',
  },
  testimonialRoi: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  testimonialAmount: {
    fontSize: 14,
    color: '#666',
  },
  testimonialDots: {
    flexDirection: 'row',
  },
  testimonialDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  testimonialDotActive: {
    backgroundColor: '#2E7D8F',
  },

  // Opportunities Section
  opportunitiesSection: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  opportunityCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  opportunityInfo: {
    flex: 1,
  },
  opportunityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  opportunityLocation: {
    fontSize: 14,
    color: '#666',
  },
  readinessScore: {
    alignItems: 'center',
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  readinessNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D8F',
  },
  readinessLabel: {
    fontSize: 10,
    color: '#2E7D8F',
  },
  opportunityDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  opportunityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  opportunityMetrics: {
    flex: 1,
  },
  opportunityMetric: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  viewOpportunityButton: {
    backgroundColor: '#2E7D8F',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewOpportunityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  viewAllText: {
    fontSize: 16,
    color: '#2E7D8F',
    fontWeight: '600',
  },

  // Value Proposition
  valueSection: {
    backgroundColor: '#fff',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  valueProps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  valueProp: {
    width: '48%',
    marginBottom: 30,
    alignItems: 'center',
  },
  valuePropIcon: {
    fontSize: 32,
    marginBottom: 15,
  },
  valuePropTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  valuePropText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Final CTA
  finalCTA: {
    backgroundColor: '#2E7D8F',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  finalCTATitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  finalCTASubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  finalCTAButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  finalCTAButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalClose: {
    fontSize: 18,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 22,
  },
  modalForm: {
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  formHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  referralInfo: {
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  referralInfoText: {
    fontSize: 14,
    color: '#2E7D8F',
    textAlign: 'center',
  },
  signupButton: {
    backgroundColor: '#2E7D8F',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
});