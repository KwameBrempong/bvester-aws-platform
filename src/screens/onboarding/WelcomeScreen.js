import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const slides = [
    {
      id: 1,
      title: "🌍 Welcome to Bvester",
      subtitle: "Connecting African Innovation with Global Investment",
      description: "The premier platform where African SMEs meet international investors, creating opportunities that transform communities and build wealth.",
      bgGradient: ['#667eea', '#764ba2'],
      emoji: "🚀"
    },
    {
      id: 2,
      title: "💼 For Business Owners",
      subtitle: "Turn Your Vision into Investment-Ready Reality",
      description: "Get comprehensive business analysis, improve your investment readiness score, and connect with investors who believe in African potential.",
      bgGradient: ['#f093fb', '#f5576c'],
      emoji: "📈"
    },
    {
      id: 3,
      title: "💰 For Investors",
      subtitle: "Discover High-Potential African Opportunities",
      description: "Access vetted SMEs with transparent analytics, diversify your portfolio across African markets, and make investments that create real impact.",
      bgGradient: ['#4facfe', '#00f2fe'],
      emoji: "🎯"
    },
    {
      id: 4,
      title: "🤝 Ready to Begin?",
      subtitle: "Choose Your Journey",
      description: "Whether you're building the next big thing in Africa or seeking your next investment opportunity, your journey starts here.",
      bgGradient: ['#43e97b', '#38f9d7'],
      emoji: "✨"
    }
  ];

  useEffect(() => {
    // Initial fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Pulse animation for emoji
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulseAnimation());
    };

    pulseAnimation();
  }, []);

  useEffect(() => {
    // Auto advance slides
    const timer = setTimeout(() => {
      if (currentSlide < slides.length - 1) {
        nextSlide();
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [currentSlide]);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      Animated.timing(slideAnim, {
        toValue: -(currentSlide + 1) * width,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      Animated.timing(slideAnim, {
        toValue: -(currentSlide - 1) * width,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index) => {
    Animated.timing(slideAnim, {
      toValue: -index * width,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setCurrentSlide(index);
  };

  const handleGetStarted = () => {
    navigation.navigate('UserTypeSelection');
  };

  const renderSlide = (slide, index) => (
    <View key={slide.id} style={[styles.slide, { width }]}>
      <LinearGradient
        colors={slide.bgGradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.slideContent}>
            <Animated.View style={[styles.emojiContainer, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.slideEmoji}>{slide.emoji}</Text>
            </Animated.View>

            <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
              <Text style={styles.slideDescription}>{slide.description}</Text>
            </Animated.View>

            {index === slides.length - 1 && (
              <Animated.View style={[styles.actionContainer, { opacity: fadeAnim }]}>
                <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
                  <LinearGradient
                    colors={['#FF6B6B', '#FF8E53']}
                    style={styles.getStartedGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.getStartedText}>🚀 Get Started</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.skipButton}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.skipText}>Already have an account? Sign In</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {slides.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.paginationDot,
            { backgroundColor: index === currentSlide ? '#fff' : 'rgba(255,255,255,0.3)' }
          ]}
          onPress={() => goToSlide(index)}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Animated.View style={[styles.slideContainer, { transform: [{ translateX: slideAnim }] }]}>
        {slides.map(renderSlide)}
      </Animated.View>

      {renderPagination()}

      {/* Navigation arrows for manual control */}
      {currentSlide > 0 && (
        <TouchableOpacity style={styles.prevButton} onPress={prevSlide}>
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
      )}

      {currentSlide < slides.length - 1 && (
        <TouchableOpacity style={styles.nextButton} onPress={nextSlide}>
          <Text style={styles.navButtonText}>→</Text>
        </TouchableOpacity>
      )}

      {/* Skip button for early slides */}
      {currentSlide < slides.length - 1 && (
        <TouchableOpacity style={styles.skipTopButton} onPress={handleGetStarted}>
          <Text style={styles.skipTopText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Floating action hint */}
      <View style={styles.floatingHint}>
        <Text style={styles.hintText}>
          {currentSlide < slides.length - 1 ? '👆 Tap or swipe to explore' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  slideContainer: {
    flexDirection: 'row',
    height: height,
  },
  slide: {
    height: height,
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emojiContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
  },
  slideEmoji: {
    fontSize: 60,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  slideSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  slideDescription: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    maxWidth: 300,
  },
  actionContainer: {
    alignItems: 'center',
    width: '100%',
  },
  getStartedButton: {
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedGradient: {
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 25,
    alignItems: 'center',
  },
  getStartedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
  },
  pagination: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  prevButton: {
    position: 'absolute',
    left: 20,
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    position: 'absolute',
    right: 20,
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  skipTopButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  skipTopText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  floatingHint: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
});