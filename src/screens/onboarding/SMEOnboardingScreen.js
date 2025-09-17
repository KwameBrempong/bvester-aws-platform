import React, { useState, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { dynamoDBService } from '../../services/aws/DynamoDBService';
import {
  Card,
  Button,
  getColor,
  getEnhancedColor,
  useTheme,
  getSpacing,
  getFontSize
} from '../../components/ui';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SMEOnboardingScreen = ({ navigation }) => {
  const { user, updateUserProfile } = useContext(AuthContext);
  const { colors, isDark } = useTheme();

  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    businessName: '',
    industry: '',
    businessSize: '',
    monthlyRevenue: '',
    primaryGoal: '',
    hasFinancialRecords: false,
    wantsInvestment: false
  });

  const scrollViewRef = useRef(null);

  const onboardingSteps = [
    {
      id: 'welcome',
      title: '🎉 Welcome to Bvester!',
      subtitle: 'The #1 platform helping African SMEs access capital',
      component: WelcomeStep
    },
    {
      id: 'business_info',
      title: '🏢 Tell us about your business',
      subtitle: 'Help us personalize your experience',
      component: BusinessInfoStep
    },
    {
      id: 'goals',
      title: '🎯 What are your goals?',
      subtitle: 'We\'ll customize features for your needs',
      component: GoalsStep
    },
    {
      id: 'features',
      title: '🚀 Your personalized toolkit',
      subtitle: 'Here\'s what we\'ve prepared for you',
      component: FeaturesStep
    },
    {
      id: 'action',
      title: '⚡ Ready to start?',
      subtitle: 'Take your first step to business growth',
      component: ActionStep
    }
  ];

  const updateOnboardingData = (key, value) => {
    setOnboardingData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  const completeOnboarding = async () => {
    try {
      // Save onboarding data to user profile
      await dynamoDBService.updateUserProfile(user.uid, {
        ...onboardingData,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString()
      });

      // Navigate to dashboard
      navigation.replace('Dashboard');

      // Show completion message
      setTimeout(() => {
        Alert.alert(
          '🎉 Welcome to Bvester!',
          'Your business journey starts now. Check out the Chat Records feature to start tracking your transactions!',
          [
            {
              text: 'Take Assessment',
              onPress: () => navigation.navigate('BusinessHealthAssessment')
            },
            {
              text: 'Start Recording',
              onPress: () => navigation.navigate('ChatRecords')
            },
            { text: 'Continue', style: 'default' }
          ]
        );
      }, 1000);

    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Could not save your information. Please try again.');
    }
  };

  // Welcome Step Component
  function WelcomeStep() {
    return (
      <View style={styles.stepContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.welcomeGradient}
        >
          <Text style={styles.welcomeEmoji}>🚀</Text>
          <Text style={styles.welcomeTitle}>Welcome to Bvester!</Text>
          <Text style={styles.welcomeSubtitle}>
            The #1 platform helping African SMEs access investment capital
          </Text>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Ionicons name="chatbubbles" size={24} color="white" />
              <Text style={styles.benefitText}>WhatsApp-style record keeping</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="fitness" size={24} color="white" />
              <Text style={styles.benefitText}>Free business health assessment</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="trending-up" size={24} color="white" />
              <Text style={styles.benefitText}>Investment readiness preparation</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.stepActions}>
          <Button
            title="Let's Get Started! 🎯"
            variant="primary"
            onPress={nextStep}
            style={styles.primaryButton}
          />
        </View>
      </View>
    );
  }

  // Business Info Step Component
  function BusinessInfoStep() {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Tell us about your business</Text>
        <Text style={styles.stepSubtitle}>
          This helps us personalize your experience and recommendations
        </Text>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Business Name *</Text>
            <TextInput
              style={styles.textInput}
              value={onboardingData.businessName}
              onChangeText={(value) => updateOnboardingData('businessName', value)}
              placeholder="e.g. Akosua's Restaurant"
              placeholderTextColor={colors.gray[400]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>What industry are you in? *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['Food & Beverage', 'Retail', 'Agriculture', 'Technology', 'Services', 'Manufacturing', 'Other'].map((industry) => (
                <TouchableOpacity
                  key={industry}
                  style={[
                    styles.optionButton,
                    onboardingData.industry === industry && styles.optionButtonSelected
                  ]}
                  onPress={() => updateOnboardingData('industry', industry)}
                >
                  <Text style={[
                    styles.optionText,
                    onboardingData.industry === industry && styles.optionTextSelected
                  ]}>
                    {industry}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>How many employees do you have?</Text>
            <View style={styles.optionsGrid}>
              {[
                { label: 'Just me', value: 'solo' },
                { label: '2-5 people', value: 'small' },
                { label: '6-20 people', value: 'medium' },
                { label: '20+ people', value: 'large' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.gridOption,
                    onboardingData.businessSize === option.value && styles.gridOptionSelected
                  ]}
                  onPress={() => updateOnboardingData('businessSize', option.value)}
                >
                  <Text style={[
                    styles.gridOptionText,
                    onboardingData.businessSize === option.value && styles.gridOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.stepActions}>
          <Button
            title="Previous"
            variant="secondary"
            onPress={previousStep}
            style={styles.secondaryButton}
          />
          <Button
            title="Continue"
            variant="primary"
            onPress={nextStep}
            disabled={!onboardingData.businessName || !onboardingData.industry}
            style={styles.primaryButton}
          />
        </View>
      </View>
    );
  }

  // Goals Step Component
  function GoalsStep() {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>What are your main goals?</Text>
        <Text style={styles.stepSubtitle}>
          Select your primary goal so we can customize your experience
        </Text>

        <View style={styles.goalsContainer}>
          {[
            {
              value: 'track_finances',
              icon: 'calculator',
              title: 'Track Finances Better',
              description: 'Get organized with easy record keeping',
              color: '#48bb78'
            },
            {
              value: 'get_investment',
              icon: 'trending-up',
              title: 'Attract Investment',
              description: 'Prepare your business for funding',
              color: '#667eea'
            },
            {
              value: 'grow_business',
              icon: 'rocket',
              title: 'Grow My Business',
              description: 'Scale operations and increase revenue',
              color: '#ed8936'
            },
            {
              value: 'business_tools',
              icon: 'construct',
              title: 'Access Business Tools',
              description: 'Get tools and resources for growth',
              color: '#9f7aea'
            }
          ].map((goal) => (
            <TouchableOpacity
              key={goal.value}
              style={[
                styles.goalCard,
                onboardingData.primaryGoal === goal.value && styles.goalCardSelected
              ]}
              onPress={() => updateOnboardingData('primaryGoal', goal.value)}
            >
              <View style={[styles.goalIcon, { backgroundColor: goal.color }]}>
                <Ionicons name={goal.icon} size={24} color="white" />
              </View>
              <View style={styles.goalContent}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalDescription}>{goal.description}</Text>
              </View>
              {onboardingData.primaryGoal === goal.value && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.stepActions}>
          <Button
            title="Previous"
            variant="secondary"
            onPress={previousStep}
            style={styles.secondaryButton}
          />
          <Button
            title="Continue"
            variant="primary"
            onPress={nextStep}
            disabled={!onboardingData.primaryGoal}
            style={styles.primaryButton}
          />
        </View>
      </View>
    );
  }

  // Features Step Component
  function FeaturesStep() {
    const getPersonalizedFeatures = () => {
      const baseFeatures = [
        {
          icon: 'chatbubbles',
          title: 'Chat-Based Records',
          description: 'Type "Sold rice for GHC 100" and we\'ll track it automatically!',
          action: 'Try it now'
        },
        {
          icon: 'fitness',
          title: 'Business Health Check',
          description: 'Get your free business health score in 5 minutes',
          action: 'Take assessment'
        }
      ];

      if (onboardingData.primaryGoal === 'get_investment') {
        baseFeatures.push({
          icon: 'trending-up',
          title: 'Investment Readiness',
          description: 'Prepare for funding with our 30-day program',
          action: 'Join program'
        });
      }

      if (onboardingData.primaryGoal === 'grow_business') {
        baseFeatures.push({
          icon: 'library',
          title: 'Growth Resources',
          description: 'Access business growth tools and training',
          action: 'Browse tools'
        });
      }

      return baseFeatures;
    };

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Your personalized toolkit is ready!</Text>
        <Text style={styles.stepSubtitle}>
          Based on your goals, here's what we've prepared for {onboardingData.businessName}
        </Text>

        <View style={styles.featuresContainer}>
          {getPersonalizedFeatures().map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureHeader}>
                <Ionicons name={feature.icon} size={32} color={colors.primary[500]} />
                <Text style={styles.featureTitle}>{feature.title}</Text>
              </View>
              <Text style={styles.featureDescription}>{feature.description}</Text>
              <TouchableOpacity style={styles.featureAction}>
                <Text style={styles.featureActionText}>{feature.action}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary[500]} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.stepActions}>
          <Button
            title="Previous"
            variant="secondary"
            onPress={previousStep}
            style={styles.secondaryButton}
          />
          <Button
            title="Continue"
            variant="primary"
            onPress={nextStep}
            style={styles.primaryButton}
          />
        </View>
      </View>
    );
  }

  // Action Step Component
  function ActionStep() {
    return (
      <View style={styles.stepContainer}>
        <LinearGradient
          colors={['#48bb78', '#38a169']}
          style={styles.actionGradient}
        >
          <Text style={styles.actionEmoji}>🎯</Text>
          <Text style={styles.actionTitle}>You're all set!</Text>
          <Text style={styles.actionSubtitle}>
            {onboardingData.businessName} is ready to grow with Bvester
          </Text>
        </LinearGradient>

        <View style={styles.quickStarts}>
          <Text style={styles.quickStartTitle}>Choose your first action:</Text>

          <TouchableOpacity
            style={styles.quickStartCard}
            onPress={() => {
              completeOnboarding();
              navigation.navigate('ChatRecords');
            }}
          >
            <Ionicons name="chatbubbles" size={32} color={colors.primary[500]} />
            <View style={styles.quickStartContent}>
              <Text style={styles.quickStartText}>Start Recording Transactions</Text>
              <Text style={styles.quickStartDescription}>
                Try our viral chat-based system: "Sold items for GHC 200"
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickStartCard}
            onPress={() => {
              completeOnboarding();
              navigation.navigate('BusinessHealthAssessment');
            }}
          >
            <Ionicons name="fitness" size={32} color={colors.success[500]} />
            <View style={styles.quickStartContent}>
              <Text style={styles.quickStartText}>Take Health Assessment</Text>
              <Text style={styles.quickStartDescription}>
                Get your free business health score and recommendations
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickStartCard}
            onPress={completeOnboarding}
          >
            <Ionicons name="home" size={32} color={colors.warning[500]} />
            <View style={styles.quickStartContent}>
              <Text style={styles.quickStartText}>Explore Dashboard</Text>
              <Text style={styles.quickStartDescription}>
                See your personalized business dashboard
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>

        <View style={styles.stepActions}>
          <Button
            title="Previous"
            variant="secondary"
            onPress={previousStep}
            style={styles.secondaryButton}
          />
        </View>
      </View>
    );
  }

  const currentStepData = onboardingSteps[currentStep];
  const CurrentStepComponent = currentStepData.component;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[
              styles.progressFill,
              { width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }
            ]} />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {onboardingSteps.length}
          </Text>
        </View>

        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={completeOnboarding}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <CurrentStepComponent />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: getEnhancedColor('gray.100'),
  },
  progressContainer: {
    flex: 1,
    paddingRight: getSpacing('md'),
  },
  progressBar: {
    height: 6,
    backgroundColor: getEnhancedColor('gray.200'),
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: getEnhancedColor('primary.500'),
  },
  progressText: {
    fontSize: getFontSize('sm'),
    color: getEnhancedColor('gray.600'),
    marginTop: getSpacing('xs'),
  },
  skipButton: {
    padding: getSpacing('sm'),
  },
  skipText: {
    fontSize: getFontSize('base'),
    color: getEnhancedColor('primary.500'),
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
    padding: getSpacing('md'),
  },
  stepTitle: {
    fontSize: getFontSize('2xl'),
    fontWeight: '700',
    color: getEnhancedColor('gray.900'),
    textAlign: 'center',
    marginBottom: getSpacing('sm'),
  },
  stepSubtitle: {
    fontSize: getFontSize('base'),
    color: getEnhancedColor('gray.600'),
    textAlign: 'center',
    marginBottom: getSpacing('xl'),
    lineHeight: 22,
  },
  welcomeGradient: {
    borderRadius: 20,
    padding: getSpacing('xl'),
    alignItems: 'center',
    marginBottom: getSpacing('xl'),
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: getSpacing('md'),
  },
  welcomeTitle: {
    fontSize: getFontSize('3xl'),
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: getSpacing('sm'),
  },
  welcomeSubtitle: {
    fontSize: getFontSize('lg'),
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: getSpacing('xl'),
  },
  benefitsContainer: {
    alignSelf: 'stretch',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('md'),
  },
  benefitText: {
    fontSize: getFontSize('base'),
    color: 'white',
    marginLeft: getSpacing('md'),
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: getSpacing('xl'),
  },
  inputGroup: {
    marginBottom: getSpacing('lg'),
  },
  inputLabel: {
    fontSize: getFontSize('base'),
    fontWeight: '600',
    color: getEnhancedColor('gray.700'),
    marginBottom: getSpacing('sm'),
  },
  textInput: {
    borderWidth: 2,
    borderColor: getEnhancedColor('gray.200'),
    borderRadius: 12,
    padding: getSpacing('md'),
    fontSize: getFontSize('base'),
    color: getEnhancedColor('gray.900'),
  },
  optionButton: {
    backgroundColor: getEnhancedColor('gray.100'),
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    borderRadius: 20,
    marginRight: getSpacing('sm'),
  },
  optionButtonSelected: {
    backgroundColor: getEnhancedColor('primary.500'),
  },
  optionText: {
    fontSize: getFontSize('sm'),
    color: getEnhancedColor('gray.700'),
    fontWeight: '500',
  },
  optionTextSelected: {
    color: 'white',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing('sm'),
  },
  gridOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: getEnhancedColor('gray.50'),
    borderWidth: 2,
    borderColor: getEnhancedColor('gray.200'),
    borderRadius: 12,
    padding: getSpacing('md'),
    alignItems: 'center',
  },
  gridOptionSelected: {
    borderColor: getEnhancedColor('primary.500'),
    backgroundColor: getEnhancedColor('primary.50'),
  },
  gridOptionText: {
    fontSize: getFontSize('sm'),
    color: getEnhancedColor('gray.700'),
    fontWeight: '500',
    textAlign: 'center',
  },
  gridOptionTextSelected: {
    color: getEnhancedColor('primary.700'),
  },
  goalsContainer: {
    marginBottom: getSpacing('xl'),
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: getEnhancedColor('gray.50'),
    borderWidth: 2,
    borderColor: getEnhancedColor('gray.200'),
    borderRadius: 16,
    padding: getSpacing('md'),
    marginBottom: getSpacing('md'),
  },
  goalCardSelected: {
    borderColor: getEnhancedColor('primary.500'),
    backgroundColor: getEnhancedColor('primary.50'),
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getSpacing('md'),
  },
  goalContent: {
    flex: 1,
  },
  goalTitle: {
    fontSize: getFontSize('base'),
    fontWeight: '600',
    color: getEnhancedColor('gray.900'),
    marginBottom: getSpacing('xs'),
  },
  goalDescription: {
    fontSize: getFontSize('sm'),
    color: getEnhancedColor('gray.600'),
  },
  featuresContainer: {
    marginBottom: getSpacing('xl'),
  },
  featureCard: {
    backgroundColor: getEnhancedColor('gray.50'),
    borderRadius: 16,
    padding: getSpacing('lg'),
    marginBottom: getSpacing('md'),
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing('sm'),
  },
  featureTitle: {
    fontSize: getFontSize('lg'),
    fontWeight: '600',
    color: getEnhancedColor('gray.900'),
    marginLeft: getSpacing('md'),
  },
  featureDescription: {
    fontSize: getFontSize('base'),
    color: getEnhancedColor('gray.600'),
    marginBottom: getSpacing('md'),
    lineHeight: 20,
  },
  featureAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureActionText: {
    fontSize: getFontSize('base'),
    color: getEnhancedColor('primary.500'),
    fontWeight: '500',
    marginRight: getSpacing('sm'),
  },
  actionGradient: {
    borderRadius: 20,
    padding: getSpacing('xl'),
    alignItems: 'center',
    marginBottom: getSpacing('xl'),
  },
  actionEmoji: {
    fontSize: 64,
    marginBottom: getSpacing('md'),
  },
  actionTitle: {
    fontSize: getFontSize('3xl'),
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: getSpacing('sm'),
  },
  actionSubtitle: {
    fontSize: getFontSize('lg'),
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  quickStarts: {
    marginBottom: getSpacing('xl'),
  },
  quickStartTitle: {
    fontSize: getFontSize('lg'),
    fontWeight: '600',
    color: getEnhancedColor('gray.900'),
    textAlign: 'center',
    marginBottom: getSpacing('lg'),
  },
  quickStartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: getEnhancedColor('gray.50'),
    borderRadius: 16,
    padding: getSpacing('lg'),
    marginBottom: getSpacing('md'),
  },
  quickStartContent: {
    flex: 1,
    marginLeft: getSpacing('md'),
  },
  quickStartText: {
    fontSize: getFontSize('base'),
    fontWeight: '600',
    color: getEnhancedColor('gray.900'),
    marginBottom: getSpacing('xs'),
  },
  quickStartDescription: {
    fontSize: getFontSize('sm'),
    color: getEnhancedColor('gray.600'),
  },
  stepActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: getSpacing('lg'),
  },
  primaryButton: {
    flex: 1,
    marginLeft: getSpacing('sm'),
  },
  secondaryButton: {
    flex: 1,
    marginRight: getSpacing('sm'),
  },
});

export default SMEOnboardingScreen;