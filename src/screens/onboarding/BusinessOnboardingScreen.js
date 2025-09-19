import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function BusinessOnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const onboardingSteps = [
    {
      id: 'welcome',
      title: '🎉 Welcome, Business Builder!',
      subtitle: 'Let\'s set up your investment-ready profile',
      description: 'We\'ll guide you through creating a compelling business profile that attracts global investors to your African SME.',
      action: 'Get Started',
      gradient: ['#667eea', '#764ba2'],
    },
    {
      id: 'business_stage',
      title: '📈 What stage is your business?',
      subtitle: 'Help us understand your journey',
      description: 'This helps us customize your experience and connect you with the right investors.',
      options: [
        { id: 'idea', title: '💡 Idea Stage', description: 'Concept development, market research' },
        { id: 'startup', title: '🚀 Startup', description: 'Early operations, building product/service' },
        { id: 'growth', title: '📈 Growth Stage', description: 'Scaling operations, expanding market' },
        { id: 'established', title: '🏢 Established', description: 'Stable revenue, seeking expansion capital' }
      ],
      gradient: ['#f093fb', '#f5576c'],
    },
    {
      id: 'industry',
      title: '🏭 What industry are you in?',
      subtitle: 'Choose your primary sector',
      description: 'This helps investors find opportunities in their preferred sectors.',
      options: [
        { id: 'tech', title: '💻 Technology', description: 'Software, apps, digital services' },
        { id: 'agriculture', title: '🌾 Agriculture', description: 'Farming, agtech, food production' },
        { id: 'healthcare', title: '🏥 Healthcare', description: 'Medical services, healthtech' },
        { id: 'manufacturing', title: '🏭 Manufacturing', description: 'Production, industrial goods' },
        { id: 'retail', title: '🛍️ Retail & E-commerce', description: 'Sales, online stores, consumer goods' },
        { id: 'services', title: '🔧 Professional Services', description: 'Consulting, business services' }
      ],
      gradient: ['#4facfe', '#00f2fe'],
    },
    {
      id: 'funding_goal',
      title: '💰 What\'s your funding goal?',
      subtitle: 'Investment amount you\'re seeking',
      description: 'This helps investors understand your capital needs and growth plans.',
      options: [
        { id: 'micro', title: '$1K - $10K', description: 'Micro-financing for small operations' },
        { id: 'small', title: '$10K - $50K', description: 'Small business growth capital' },
        { id: 'medium', title: '$50K - $200K', description: 'Medium-scale expansion funding' },
        { id: 'large', title: '$200K - $1M', description: 'Large-scale development capital' },
        { id: 'major', title: '$1M+', description: 'Major expansion or acquisition' }
      ],
      gradient: ['#43e97b', '#38f9d7'],
    },
    {
      id: 'investment_type',
      title: '🤝 What type of investment?',
      subtitle: 'Choose your preferred funding structure',
      description: 'Different investors prefer different investment types. You can select multiple options.',
      multiSelect: true,
      options: [
        { id: 'equity', title: '💼 Equity Investment', description: 'Sell ownership stakes for funding' },
        { id: 'loan', title: '💰 Business Loans', description: 'Borrowing with repayment terms' },
        { id: 'revenue_share', title: '📊 Revenue Sharing', description: 'Share future revenue with investors' }
      ],
      gradient: ['#fa709a', '#fee140'],
    },
    {
      id: 'goals',
      title: '🎯 What are your main goals?',
      subtitle: 'How will you use the investment?',
      description: 'Investors want to know how their money will help grow your business.',
      multiSelect: true,
      options: [
        { id: 'inventory', title: '📦 Inventory & Stock', description: 'Purchase products to sell' },
        { id: 'equipment', title: '🔧 Equipment & Tools', description: 'Buy machinery or technology' },
        { id: 'marketing', title: '📣 Marketing & Sales', description: 'Promote and grow customer base' },
        { id: 'team', title: '👥 Hire Team Members', description: 'Expand your workforce' },
        { id: 'location', title: '🏢 New Location/Office', description: 'Expand physical presence' },
        { id: 'technology', title: '💻 Technology Upgrade', description: 'Improve systems and software' }
      ],
      gradient: ['#667eea', '#764ba2'],
    },
    {
      id: 'complete',
      title: '🎊 Profile Setup Complete!',
      subtitle: 'You\'re ready to attract investors',
      description: 'Your business profile is now set up. Next, we\'ll help you improve your investment readiness score and connect with potential investors.',
      action: 'Continue to Dashboard',
      gradient: ['#ff6b6b', '#ffa726'],
    }
  ];

  useEffect(() => {
    animateStepChange();
  }, [currentStep]);

  const animateStepChange = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(progressAnim, {
          toValue: currentStep / (onboardingSteps.length - 1),
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    });
  };

  const handleOptionSelect = (optionId) => {
    const step = onboardingSteps[currentStep];
    
    if (step.multiSelect) {
      const current = selectedOptions[step.id] || [];
      const updated = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
      
      setSelectedOptions({
        ...selectedOptions,
        [step.id]: updated
      });
    } else {
      setSelectedOptions({
        ...selectedOptions,
        [step.id]: optionId
      });
    }
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      navigation.navigate('Register', { 
        userType: 'business',
        onboardingData: selectedOptions 
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const canProceed = () => {
    const step = onboardingSteps[currentStep];
    if (!step.options) return true;
    
    const selections = selectedOptions[step.id];
    return step.multiSelect ? (selections && selections.length > 0) : !!selections;
  };

  const renderStep = () => {
    const step = onboardingSteps[currentStep];
    
    return (
      <Animated.View style={[
        styles.stepContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <LinearGradient
          colors={step.gradient}
          style={styles.stepGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>

            {step.options && (
              <View style={styles.optionsContainer}>
                {step.options.map((option) => {
                  const isSelected = step.multiSelect
                    ? (selectedOptions[step.id] || []).includes(option.id)
                    : selectedOptions[step.id] === option.id;

                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.optionCard, isSelected && styles.selectedOption]}
                      onPress={() => handleOptionSelect(option.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.optionContent}>
                        <View style={styles.optionHeader}>
                          <Text style={styles.optionTitle}>{option.title}</Text>
                          {isSelected && (
                            <View style={styles.selectionBadge}>
                              <Text style={styles.selectionCheck}>✓</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.optionDescription}>{option.description}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {step.action && (
              <TouchableOpacity style={styles.actionButton} onPress={handleNext}>
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E53']}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.actionText}>{step.action}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]} />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {onboardingSteps.length}
          </Text>
        </View>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {onboardingSteps[currentStep].options && (
            <TouchableOpacity
              style={[styles.nextButton, !canProceed() && styles.disabledButton]}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <LinearGradient
                colors={canProceed() ? ['#43e97b', '#38f9d7'] : ['#ccc', '#999']}
                style={styles.nextGradient}
              >
                <Text style={styles.nextText}>
                  {currentStep === onboardingSteps.length - 1 ? 'Complete' : 'Next →'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  safeArea: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
  },
  progressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#43e97b',
    borderRadius: 2,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.7,
  },
  stepContainer: {
    flex: 1,
    margin: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  stepGradient: {
    flex: 1,
  },
  scrollContent: {
    padding: 25,
    minHeight: '100%',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  stepSubtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 15,
  },
  stepDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  optionsContainer: {
    gap: 15,
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  selectionBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCheck: {
    color: '#43e97b',
    fontSize: 14,
    fontWeight: 'bold',
  },
  optionDescription: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.8,
    lineHeight: 18,
  },
  actionButton: {
    alignSelf: 'center',
    borderRadius: 25,
    marginTop: 20,
  },
  actionGradient: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.7,
  },
  nextButton: {
    borderRadius: 25,
  },
  disabledButton: {
    opacity: 0.5,
  },
  nextGradient: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});