import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import TutorialOverlay from '../../components/TutorialOverlay';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FirstTimeUserTutorial({ navigation, route }) {
  const { userProfile } = useContext(AuthContext);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tutorialSteps, setTutorialSteps] = useState([]);

  const userType = route.params?.userType || userProfile?.userType || 'business';

  // Tutorial steps for business owners
  const businessTutorialSteps = [
    {
      title: '🎉 Welcome to Your Dashboard!',
      description: 'This is your central hub where you can monitor your business performance, track investment readiness, and manage investor relationships.',
      icon: '📊',
      gradient: ['#667eea', '#764ba2'],
      tips: [
        'Check your investment readiness score regularly',
        'Keep your business data updated for better scores',
        'Monitor investor interest and inquiries'
      ]
    },
    {
      title: '📈 Investment Readiness Score',
      description: 'Your score shows how attractive your business is to investors. Higher scores get more investor attention and better funding opportunities.',
      icon: '🎯',
      gradient: ['#f093fb', '#f5576c'],
      targetArea: { top: 100, left: 20, right: 20, height: 150 },
      arrow: { top: 260, left: width/2 - 20 },
      tips: [
        'Aim for 80+ for maximum investor interest',
        'Upload financial records to improve your score',
        'Complete all business profile sections'
      ]
    },
    {
      title: '💼 Create Your Business Listing',
      description: 'List your business for investment to connect with global investors. A compelling listing attracts quality investment offers.',
      icon: '🚀',
      gradient: ['#4facfe', '#00f2fe'],
      tips: [
        'Write a compelling business description',
        'Clearly explain how you\'ll use the investment',
        'Highlight your competitive advantages'
      ]
    },
    {
      title: '📋 Manage Your Finances',
      description: 'Keep accurate financial records to improve your readiness score and build investor confidence in your business.',
      icon: '💰',
      gradient: ['#43e97b', '#38f9d7'],
      tips: [
        'Record all income and expenses',
        'Categorize transactions properly',
        'Upload supporting documents'
      ]
    },
    {
      title: '🔔 Stay Updated with Notifications',
      description: 'Get instant alerts when investors show interest, send messages, or when your readiness score improves.',
      icon: '🔔',
      gradient: ['#fa709a', '#fee140'],
      tips: [
        'Enable push notifications for important updates',
        'Respond quickly to investor inquiries',
        'Check for new investment opportunities'
      ]
    },
    {
      title: '🎯 You\'re All Set!',
      description: 'You now have everything you need to start attracting investors and growing your business. Good luck on your investment journey!',
      icon: '✨',
      gradient: ['#ff6b6b', '#ffa726'],
      tips: [
        'Complete your profile for better results',
        'Stay active and engaged with investors',
        'Keep improving your readiness score'
      ]
    }
  ];

  // Tutorial steps for investors
  const investorTutorialSteps = [
    {
      title: '💎 Welcome to Your Investment Hub!',
      description: 'Discover vetted African SME opportunities, track your portfolio performance, and make impactful investments across the continent.',
      icon: '🌍',
      gradient: ['#667eea', '#764ba2'],
      tips: [
        'Browse curated investment opportunities',
        'Access comprehensive business analytics',
        'Build a diversified African portfolio'
      ]
    },
    {
      title: '🔍 Discover Investment Opportunities',
      description: 'Search for businesses that match your investment criteria. Use filters to find opportunities in your preferred sectors and regions.',
      icon: '🎯',
      gradient: ['#f093fb', '#f5576c'],
      tips: [
        'Set your investment preferences in settings',
        'Use readiness score to assess opportunities',
        'Read business profiles thoroughly before investing'
      ]
    },
    {
      title: '📊 Investment Dashboard',
      description: 'Track your portfolio performance, monitor returns, and see the impact of your investments across African markets.',
      icon: '📈',
      gradient: ['#4facfe', '#00f2fe'],
      tips: [
        'Monitor your total invested amount',
        'Track returns and performance metrics',
        'Review geographic diversification'
      ]
    },
    {
      title: '🤝 Connect with Businesses',
      description: 'Express interest in promising businesses, send investment pledges, and communicate directly with entrepreneurs.',
      icon: '💼',
      gradient: ['#43e97b', '#38f9d7'],
      tips: [
        'Start with expressing interest before committing',
        'Ask questions about business plans',
        'Review due diligence documents carefully'
      ]
    },
    {
      title: '📄 Due Diligence Documents',
      description: 'Access financial statements, business plans, and other important documents shared by businesses seeking investment.',
      icon: '📋',
      gradient: ['#fa709a', '#fee140'],
      tips: [
        'Review all available documents',
        'Look for verified business profiles',
        'Consider the business\'s growth potential'
      ]
    },
    {
      title: '🎉 Start Investing!',
      description: 'You\'re ready to discover amazing African businesses and make investments that create both returns and positive impact.',
      icon: '🚀',
      gradient: ['#ff6b6b', '#ffa726'],
      tips: [
        'Start with smaller investments to learn',
        'Diversify across sectors and regions',
        'Remember: all investments shown are mock/demo'
      ]
    }
  ];

  useEffect(() => {
    checkIfFirstTime();
  }, []);

  const checkIfFirstTime = async () => {
    try {
      const hasSeenTutorial = await AsyncStorage.getItem(`tutorial_seen_${userType}`);
      if (!hasSeenTutorial) {
        setTutorialSteps(userType === 'investor' ? investorTutorialSteps : businessTutorialSteps);
        setShowTutorial(true);
      } else {
        // Navigate to appropriate screen
        navigateToMainApp();
      }
    } catch (error) {
      console.error('Error checking tutorial status:', error);
      navigateToMainApp();
    }
  };

  const navigateToMainApp = () => {
    if (userType === 'investor') {
      navigation.navigate('InvestorTabs', { screen: 'Dashboard' });
    } else {
      navigation.navigate('SMETabs', { screen: 'Dashboard' });
    }
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = async () => {
    try {
      await AsyncStorage.setItem(`tutorial_seen_${userType}`, 'true');
      setShowTutorial(false);
      
      // Show completion celebration
      Alert.alert(
        '🎉 Tutorial Complete!',
        `Welcome to BizInvest Hub! You're now ready to ${userType === 'investor' ? 'discover amazing investment opportunities' : 'attract investors and grow your business'}.`,
        [
          {
            text: 'Let\'s Go!',
            onPress: navigateToMainApp
          }
        ]
      );
    } catch (error) {
      console.error('Error saving tutorial completion:', error);
      navigateToMainApp();
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Tutorial?',
      'Are you sure you want to skip the tutorial? You can always access help from the settings menu.',
      [
        { text: 'Continue Tutorial', style: 'cancel' },
        { text: 'Skip', onPress: completeTutorial }
      ]
    );
  };

  const restartTutorial = async () => {
    try {
      await AsyncStorage.removeItem(`tutorial_seen_${userType}`);
      setCurrentStep(0);
      setShowTutorial(true);
    } catch (error) {
      console.error('Error restarting tutorial:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {userType === 'investor' ? '💎 Investor Portal' : '🏢 Business Hub'}
        </Text>
        <Text style={styles.subtitle}>
          {userType === 'investor' 
            ? 'Discover African Investment Opportunities'
            : 'Connect with Global Investors'
          }
        </Text>

        <TouchableOpacity style={styles.tutorialButton} onPress={restartTutorial}>
          <Text style={styles.tutorialButtonText}>🎓 Start Tutorial</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={navigateToMainApp}>
          <Text style={styles.skipButtonText}>Skip to App →</Text>
        </TouchableOpacity>
      </View>

      <TutorialOverlay
        visible={showTutorial}
        steps={tutorialSteps}
        currentStep={currentStep}
        onNext={handleNext}
        onPrev={handlePrev}
        onComplete={completeTutorial}
        onSkip={handleSkip}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  tutorialButton: {
    backgroundColor: '#2E7D8F',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  tutorialButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
  },
});