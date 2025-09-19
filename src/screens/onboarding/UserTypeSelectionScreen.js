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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function UserTypeSelectionScreen({ navigation }) {
  const [selectedType, setSelectedType] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideInLeft = useRef(new Animated.Value(-width)).current;
  const slideInRight = useRef(new Animated.Value(width)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const userTypes = [
    {
      id: 'business',
      title: '🏢 I\'m a Business Owner',
      subtitle: 'African SME seeking investment',
      description: 'Get investment-ready, connect with global investors, and grow your business with comprehensive analytics and funding opportunities.',
      benefits: [
        '📊 Investment readiness analysis',
        '🌍 Global investor network access',
        '💼 Business growth tools',
        '📈 Performance tracking'
      ],
      gradient: ['#667eea', '#764ba2'],
      icon: '🚀',
      route: 'BusinessOnboarding'
    },
    {
      id: 'investor',
      title: '💰 I\'m an Investor',
      subtitle: 'Seeking African investment opportunities',
      description: 'Discover vetted SMEs, analyze opportunities with transparent data, and build a diversified African portfolio with real impact.',
      benefits: [
        '🎯 Curated investment opportunities',
        '📋 Comprehensive due diligence',
        '🌍 African market insights',
        '💹 Portfolio management tools'
      ],
      gradient: ['#f093fb', '#f5576c'],
      icon: '💎',
      route: 'InvestorOnboarding'
    }
  ];

  useEffect(() => {
    // Staggered animations
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(slideInLeft, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(slideInRight, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ])
    ]).start();

    // Floating animation
    const createFloatingAnimation = () => {
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => createFloatingAnimation());
    };

    createFloatingAnimation();
  }, []);

  const handleCardPress = (userType) => {
    setSelectedType(userType.id);
    
    // Haptic feedback would go here
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Animate selection and navigate
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        navigation.navigate(userType.route);
      }, 300);
    });
  };

  const renderUserTypeCard = (userType, index) => {
    const isLeft = index === 0;
    const animatedStyle = {
      transform: [
        { translateX: isLeft ? slideInLeft : slideInRight },
        { scale: scaleAnim },
        { 
          translateY: floatAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -10]
          })
        }
      ],
      opacity: fadeAnim,
    };

    const isSelected = selectedType === userType.id;

    return (
      <Animated.View key={userType.id} style={[styles.cardContainer, animatedStyle]}>
        <TouchableOpacity
          style={[styles.userTypeCard, isSelected && styles.selectedCard]}
          onPress={() => handleCardPress(userType)}
          onPressIn={() => setHoveredCard(userType.id)}
          onPressOut={() => setHoveredCard(null)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={userType.gradient}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Selection indicator */}
            {isSelected && (
              <View style={styles.selectionIndicator}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}

            {/* Card content */}
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <Text style={styles.userTypeIcon}>{userType.icon}</Text>
              </View>

              <Text style={styles.userTypeTitle}>{userType.title}</Text>
              <Text style={styles.userTypeSubtitle}>{userType.subtitle}</Text>
              <Text style={styles.userTypeDescription}>{userType.description}</Text>

              <View style={styles.benefitsContainer}>
                {userType.benefits.map((benefit, idx) => (
                  <View key={idx} style={styles.benefitItem}>
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.actionHint}>
                <Text style={styles.actionText}>
                  {isSelected ? '🎉 Great choice!' : '👆 Tap to continue'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.backgroundGradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.headerTitle}>👋 Welcome to BizInvest Hub!</Text>
            <Text style={styles.headerSubtitle}>Let's get you started on your journey</Text>
            <Text style={styles.headerDescription}>
              Choose your role to unlock a personalized experience designed just for you
            </Text>
          </Animated.View>

          {/* User type cards */}
          <View style={styles.cardsContainer}>
            {userTypes.map(renderUserTypeCard)}
          </View>

          {/* Footer options */}
          <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
            <TouchableOpacity 
              style={styles.footerButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.footerText}>Already have an account? Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.footerButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.footerBackText}>← Back to Welcome</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Decorative elements */}
          <Animated.View style={[styles.decorativeCircle1, { 
            opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.1] }),
            transform: [{ rotate: floatAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }]
          }]} />
          <Animated.View style={[styles.decorativeCircle2, { 
            opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.05] }),
            transform: [{ rotate: floatAnim.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] }) }]
          }]} />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 10,
  },
  headerDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.6,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  cardContainer: {
    marginBottom: 15,
  },
  userTypeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  selectedCard: {
    transform: [{ scale: 1.02 }],
  },
  cardGradient: {
    padding: 25,
    minHeight: 280,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  userTypeIcon: {
    fontSize: 40,
  },
  userTypeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  userTypeSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 15,
  },
  userTypeDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  benefitsContainer: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.9,
  },
  actionHint: {
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  footerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  footerText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
  },
  footerBackText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.5,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: '20%',
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#fff',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: '20%',
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#fff',
  },
});