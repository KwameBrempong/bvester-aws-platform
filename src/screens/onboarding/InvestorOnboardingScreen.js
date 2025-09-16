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

export default function InvestorOnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const onboardingSteps = [
    {
      id: 'welcome',
      title: '💎 Welcome, Investor!',
      subtitle: 'Discover African investment opportunities',
      description: 'We\'ll help you set up your investor profile to find the best African SME opportunities that match your investment goals and risk tolerance.',
      action: 'Get Started',
      gradient: ['#f093fb', '#f5576c'],
    },
    {
      id: 'experience',
      title: '📊 What\'s your investment experience?',
      subtitle: 'Help us understand your background',
      description: 'This helps us provide appropriate investment recommendations and risk assessments.',
      options: [
        { id: 'beginner', title: '🌱 New to Investing', description: 'First-time investor seeking guidance' },
        { id: 'some', title: '📈 Some Experience', description: 'Basic knowledge, looking to diversify' },
        { id: 'experienced', title: '💼 Experienced', description: 'Active investor with portfolio' },
        { id: 'professional', title: '🏆 Professional', description: 'Institutional or professional investor' }
      ],
      gradient: ['#667eea', '#764ba2'],
    },
    {
      id: 'investment_size',
      title: '💰 What\'s your investment range?',
      subtitle: 'Typical investment amount per opportunity',
      description: 'This helps us show opportunities that match your investment capacity.',
      options: [
        { id: 'micro', title: '$500 - $5K', description: 'Micro-investments in early-stage SMEs' },
        { id: 'small', title: '$5K - $25K', description: 'Small investments in growing businesses' },
        { id: 'medium', title: '$25K - $100K', description: 'Medium-scale business investments' },
        { id: 'large', title: '$100K - $500K', description: 'Large investments in established SMEs' },
        { id: 'major', title: '$500K+', description: 'Major investments and partnerships' }
      ],
      gradient: ['#4facfe', '#00f2fe'],
    },
    {
      id: 'investment_type',
      title: '🤝 Preferred investment types?',
      subtitle: 'Choose your investment preferences',
      description: 'You can select multiple types based on your investment strategy.',
      multiSelect: true,
      options: [
        { id: 'equity', title: '💼 Equity Stakes', description: 'Ownership shares in businesses' },
        { id: 'loans', title: '💰 Business Loans', description: 'Lending with fixed returns' },
        { id: 'revenue_share', title: '📊 Revenue Sharing', description: 'Percentage of future revenues' }
      ],
      gradient: ['#43e97b', '#38f9d7'],
    },
    {
      id: 'sectors',
      title: '🏭 Preferred sectors?',
      subtitle: 'Which industries interest you most?',
      description: 'We\'ll prioritize showing opportunities in your preferred sectors.',
      multiSelect: true,
      options: [
        { id: 'technology', title: '💻 Technology', description: 'Software, fintech, digital services' },
        { id: 'agriculture', title: '🌾 Agriculture & Food', description: 'Farming, agtech, food production' },
        { id: 'healthcare', title: '🏥 Healthcare', description: 'Medical services, healthtech' },
        { id: 'manufacturing', title: '🏭 Manufacturing', description: 'Production and industrial goods' },
        { id: 'retail', title: '🛍️ Retail & E-commerce', description: 'Consumer goods and online sales' },
        { id: 'energy', title: '⚡ Energy & Utilities', description: 'Renewable energy, infrastructure' },
        { id: 'education', title: '📚 Education', description: 'Educational services and edtech' },
        { id: 'financial', title: '🏦 Financial Services', description: 'Banking, insurance, fintech' }
      ],
      gradient: ['#fa709a', '#fee140'],
    },
    {
      id: 'regions',
      title: '🌍 Preferred African regions?',
      subtitle: 'Which markets interest you most?',
      description: 'Focus on specific African markets or diversify across the continent.',
      multiSelect: true,
      options: [
        { id: 'west', title: '🇳🇬 West Africa', description: 'Nigeria, Ghana, Senegal, Ivory Coast' },
        { id: 'east', title: '🇰🇪 East Africa', description: 'Kenya, Uganda, Tanzania, Rwanda' },
        { id: 'south', title: '🇿🇦 Southern Africa', description: 'South Africa, Botswana, Zambia' },
        { id: 'north', title: '🇪🇬 North Africa', description: 'Egypt, Morocco, Tunisia' },
        { id: 'central', title: '🇨🇲 Central Africa', description: 'Cameroon, DRC, Chad' },
        { id: 'all', title: '🌍 All Regions', description: 'Open to opportunities continent-wide' }
      ],
      gradient: ['#667eea', '#764ba2'],
    },
    {
      id: 'goals',
      title: '🎯 What are your investment goals?',
      subtitle: 'What do you hope to achieve?',
      description: 'Understanding your goals helps us recommend the right opportunities.',
      multiSelect: true,
      options: [
        { id: 'returns', title: '📈 Financial Returns', description: 'Maximize investment returns' },
        { id: 'impact', title: '🌍 Social Impact', description: 'Create positive change in Africa' },
        { id: 'diversification', title: '📊 Portfolio Diversification', description: 'Spread investment risk' },
        { id: 'learning', title: '🎓 Learning Experience', description: 'Understand African markets' },
        { id: 'networking', title: '🤝 Business Networking', description: 'Build African business connections' },
        { id: 'mentorship', title: '👨‍🏫 Mentoring Entrepreneurs', description: 'Support business growth' }
      ],
      gradient: ['#f093fb', '#f5576c'],
    },
    {
      id: 'complete',
      title: '🎊 Investor Profile Complete!',
      subtitle: 'Ready to discover opportunities',
      description: 'Your investor profile is set up! We\'ll now show you curated investment opportunities that match your preferences and help you build a diverse African portfolio.',
      action: 'Explore Opportunities',
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
        userType: 'investor',
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