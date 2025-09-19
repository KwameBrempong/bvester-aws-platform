import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function AchievementSystem({ userType = 'business' }) {
  const [achievements, setAchievements] = useState([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [showAchievement, setShowAchievement] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  
  // Animation refs
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  // Achievement definitions for business owners
  const businessAchievements = [
    {
      id: 'profile_complete',
      title: '🎯 Profile Master',
      description: 'Complete your business profile with all required information',
      points: 100,
      gradient: ['#667eea', '#764ba2'],
      trigger: 'profile_completion',
      rarity: 'common'
    },
    {
      id: 'first_transaction',
      title: '💰 First Steps',
      description: 'Record your first business transaction',
      points: 50,
      gradient: ['#f093fb', '#f5576c'],
      trigger: 'transaction_added',
      rarity: 'common'
    },
    {
      id: 'readiness_50',
      title: '📈 Growing Strong',
      description: 'Achieve 50+ investment readiness score',
      points: 200,
      gradient: ['#4facfe', '#00f2fe'],
      trigger: 'readiness_score',
      threshold: 50,
      rarity: 'uncommon'
    },
    {
      id: 'readiness_80',
      title: '🚀 Investment Ready',
      description: 'Achieve 80+ investment readiness score',
      points: 500,
      gradient: ['#43e97b', '#38f9d7'],
      trigger: 'readiness_score',
      threshold: 80,
      rarity: 'rare'
    },
    {
      id: 'first_listing',
      title: '🏢 Public Debut',
      description: 'Create your first investment listing',
      points: 300,
      gradient: ['#fa709a', '#fee140'],
      trigger: 'business_listed',
      rarity: 'uncommon'
    },
    {
      id: 'first_investor_interest',
      title: '👥 Drawing Attention',
      description: 'Receive your first investor interest',
      points: 400,
      gradient: ['#667eea', '#764ba2'],
      trigger: 'investor_interest',
      rarity: 'rare'
    },
    {
      id: 'first_investment',
      title: '🎉 Funded!',
      description: 'Receive your first investment pledge',
      points: 1000,
      gradient: ['#ff6b6b', '#ffa726'],
      trigger: 'investment_received',
      rarity: 'legendary'
    },
    {
      id: 'monthly_consistent',
      title: '📊 Consistency King',
      description: 'Record transactions for 30 consecutive days',
      points: 750,
      gradient: ['#a8edea', '#fed6e3'],
      trigger: 'consistent_tracking',
      rarity: 'epic'
    }
  ];

  // Achievement definitions for investors
  const investorAchievements = [
    {
      id: 'profile_complete',
      title: '💎 Investor Profile',
      description: 'Complete your investor profile and preferences',
      points: 100,
      gradient: ['#667eea', '#764ba2'],
      trigger: 'profile_completion',
      rarity: 'common'
    },
    {
      id: 'first_search',
      title: '🔍 Opportunity Seeker',
      description: 'Search for your first investment opportunity',
      points: 50,
      gradient: ['#f093fb', '#f5576c'],
      trigger: 'search_performed',
      rarity: 'common'
    },
    {
      id: 'first_interest',
      title: '👀 Showing Interest',
      description: 'Express interest in your first business',
      points: 150,
      gradient: ['#4facfe', '#00f2fe'],
      trigger: 'interest_expressed',
      rarity: 'common'
    },
    {
      id: 'first_investment',
      title: '💰 First Investment',
      description: 'Make your first investment pledge',
      points: 500,
      gradient: ['#43e97b', '#38f9d7'],
      trigger: 'investment_made',
      rarity: 'rare'
    },
    {
      id: 'diversified_portfolio',
      title: '🌍 Portfolio Diversifier',
      description: 'Invest in 3 different African countries',
      points: 750,
      gradient: ['#fa709a', '#fee140'],
      trigger: 'geographic_diversity',
      threshold: 3,
      rarity: 'epic'
    },
    {
      id: 'sector_explorer',
      title: '🏭 Sector Explorer',
      description: 'Invest in 5 different industry sectors',
      points: 600,
      gradient: ['#667eea', '#764ba2'],
      trigger: 'sector_diversity',
      threshold: 5,
      rarity: 'rare'
    },
    {
      id: 'high_roller',
      title: '💎 High Roller',
      description: 'Make a single investment of $50,000+',
      points: 1000,
      gradient: ['#ff6b6b', '#ffa726'],
      trigger: 'large_investment',
      threshold: 50000,
      rarity: 'legendary'
    },
    {
      id: 'impact_investor',
      title: '🌟 Impact Champion',
      description: 'Invest in 10 different African businesses',
      points: 1500,
      gradient: ['#a8edea', '#fed6e3'],
      trigger: 'business_count',
      threshold: 10,
      rarity: 'legendary'
    }
  ];

  useEffect(() => {
    initializeAchievements();
    loadUnlockedAchievements();
  }, [userType]);

  const initializeAchievements = () => {
    const achievementList = userType === 'investor' ? investorAchievements : businessAchievements;
    setAchievements(achievementList);
  };

  const loadUnlockedAchievements = async () => {
    try {
      const stored = await AsyncStorage.getItem(`achievements_${userType}`);
      if (stored) {
        setUnlockedAchievements(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const saveUnlockedAchievements = async (newUnlocked) => {
    try {
      await AsyncStorage.setItem(`achievements_${userType}`, JSON.stringify(newUnlocked));
    } catch (error) {
      console.error('Error saving achievements:', error);
    }
  };

  const checkAchievement = (trigger, data = {}) => {
    const eligibleAchievements = achievements.filter(achievement => 
      achievement.trigger === trigger && 
      !unlockedAchievements.some(unlocked => unlocked.id === achievement.id)
    );

    eligibleAchievements.forEach(achievement => {
      let shouldUnlock = false;

      switch (trigger) {
        case 'readiness_score':
          shouldUnlock = data.score >= achievement.threshold;
          break;
        case 'geographic_diversity':
        case 'sector_diversity':
        case 'business_count':
          shouldUnlock = data.count >= achievement.threshold;
          break;
        case 'large_investment':
          shouldUnlock = data.amount >= achievement.threshold;
          break;
        case 'consistent_tracking':
          shouldUnlock = data.days >= 30;
          break;
        default:
          shouldUnlock = true;
          break;
      }

      if (shouldUnlock) {
        unlockAchievement(achievement);
      }
    });
  };

  const unlockAchievement = (achievement) => {
    const newUnlocked = [...unlockedAchievements, {
      ...achievement,
      unlockedAt: new Date().toISOString()
    }];
    
    setUnlockedAchievements(newUnlocked);
    saveUnlockedAchievements(newUnlocked);
    showAchievementNotification(achievement);
  };

  const showAchievementNotification = (achievement) => {
    setCurrentAchievement(achievement);
    setShowAchievement(true);

    // Animate achievement notification
    Animated.sequence([
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 50,
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
      ]),
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after 5 seconds
    setTimeout(() => {
      hideAchievementNotification();
    }, 5000);
  };

  const hideAchievementNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowAchievement(false);
      setCurrentAchievement(null);
      slideAnim.setValue(-300);
      scaleAnim.setValue(0);
      glowAnim.setValue(0);
      confettiAnim.setValue(0);
    });
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#95a5a6';
      case 'uncommon': return '#27ae60';
      case 'rare': return '#3498db';
      case 'epic': return '#9b59b6';
      case 'legendary': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const getRarityEmoji = (rarity) => {
    switch (rarity) {
      case 'common': return '⚪';
      case 'uncommon': return '🟢';
      case 'rare': return '🔵';
      case 'epic': return '🟣';
      case 'legendary': return '🟡';
      default: return '⚪';
    }
  };

  // Expose the checkAchievement function to be called from other components
  React.useImperativeHandle(React.createRef(), () => ({
    checkAchievement
  }));

  if (!showAchievement || !currentAchievement) return null;

  return (
    <Modal visible={showAchievement} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[
          styles.achievementContainer,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}>
          <LinearGradient
            colors={currentAchievement.gradient}
            style={styles.achievementGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Glow effect */}
            <Animated.View style={[
              styles.glowEffect,
              {
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.8]
                })
              }
            ]} />

            {/* Confetti effect */}
            <Animated.View style={[
              styles.confettiContainer,
              {
                opacity: confettiAnim,
                transform: [{
                  translateY: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -100]
                  })
                }]
              }
            ]}>
              <Text style={styles.confetti}>🎉</Text>
              <Text style={styles.confetti}>✨</Text>
              <Text style={styles.confetti}>🎊</Text>
              <Text style={styles.confetti}>⭐</Text>
            </Animated.View>

            <View style={styles.achievementContent}>
              <View style={styles.headerRow}>
                <Text style={styles.rarityEmoji}>
                  {getRarityEmoji(currentAchievement.rarity)}
                </Text>
                <Text style={[styles.rarityText, { color: getRarityColor(currentAchievement.rarity) }]}>
                  {currentAchievement.rarity.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.achievementTitle}>
                🏆 Achievement Unlocked!
              </Text>
              
              <Text style={styles.achievementName}>
                {currentAchievement.title}
              </Text>
              
              <Text style={styles.achievementDescription}>
                {currentAchievement.description}
              </Text>

              <View style={styles.pointsContainer}>
                <Text style={styles.pointsText}>
                  +{currentAchievement.points} points
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={hideAchievementNotification}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Export the checkAchievement function to be used by other components
export const useAchievements = (userType) => {
  const achievementRef = useRef();

  const triggerAchievement = (trigger, data) => {
    if (achievementRef.current) {
      achievementRef.current.checkAchievement(trigger, data);
    }
  };

  return { triggerAchievement, achievementRef };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingTop: 100,
  },
  achievementContainer: {
    width: width - 40,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  achievementGradient: {
    padding: 25,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: '#fff',
    borderRadius: 25,
    zIndex: -1,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 20,
  },
  confetti: {
    fontSize: 30,
    position: 'absolute',
  },
  achievementContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  rarityEmoji: {
    fontSize: 20,
  },
  rarityText: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  achievementName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  achievementDescription: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  pointsContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});