import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { enhancedDesignSystem, getEnhancedColor, getSpacing, getShadow } from '../styles/enhancedDesignSystem';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Homepage = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('investors');
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Navigation Header Component
  const NavigationHeader = () => (
    <View style={styles.navContainer}>
      <View style={styles.navContent}>
        <TouchableOpacity style={styles.logoContainer}>
          <Text style={styles.logoText}>BizInvest</Text>
          <Text style={styles.logoSubtext}>Hub</Text>
        </TouchableOpacity>
        
        <View style={styles.navMenu}>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navText}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navText}>For Investors</Text>
            <MaterialIcons name="keyboard-arrow-down" size={16} color={getEnhancedColor('gray.600')} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Text style={styles.navText}>For Startups</Text>
            <MaterialIcons name="keyboard-arrow-down" size={16} color={getEnhancedColor('gray.600')} />
          </TouchableOpacity>
        </View>

        <View style={styles.navActions}>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>Log in</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.signupButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.signupText}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Hero Section Component
  const HeroSection = () => (
    <Animated.View 
      style={[
        styles.heroContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.heroGradient}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>
              Where African startups and
            </Text>
            <Text style={[styles.heroTitle, { color: getEnhancedColor('primary.600') }]}>
              global investors connect
            </Text>
            
            <Text style={styles.heroSubtitle}>
              Discover investment opportunities in Africa's fastest-growing SMEs. 
              Connect with entrepreneurs building the future of African commerce.
            </Text>

            <View style={styles.heroTabs}>
              <TouchableOpacity
                style={[
                  styles.heroTab,
                  activeTab === 'investors' && styles.heroTabActive
                ]}
                onPress={() => setActiveTab('investors')}
              >
                <Text style={[
                  styles.heroTabText,
                  activeTab === 'investors' && styles.heroTabTextActive
                ]}>
                  I want to invest
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.heroTab,
                  activeTab === 'startups' && styles.heroTabActive
                ]}
                onPress={() => setActiveTab('startups')}
              >
                <Text style={[
                  styles.heroTabText,
                  activeTab === 'startups' && styles.heroTabTextActive
                ]}>
                  I need funding
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.heroActions}>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.primaryButtonText}>
                  {activeTab === 'investors' ? 'Find Investment Opportunities' : 'Get Funded'}
                </Text>
                <Feather name="arrow-right" size={20} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Welcome')}
              >
                <Text style={styles.secondaryButtonText}>Learn more</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  // Company Logos Section
  const CompanyLogosSection = () => {
    const africanCompanies = [
      { name: 'Flutterwave', logo: '🦋' },
      { name: 'Jumia', logo: '🛒' },
      { name: 'Andela', logo: '👨‍💻' },
      { name: 'Paystack', logo: '💳' },
      { name: 'Twiga Foods', logo: '🥬' },
      { name: 'Kobo360', logo: '🚛' },
      { name: 'Cellulant', logo: '📱' },
      { name: 'iROKOtv', logo: '📺' },
    ];

    return (
      <View style={styles.companiesContainer}>
        <Text style={styles.companiesTitle}>
          Trusted by Africa's leading startups
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.companiesScroll}
        >
          {africanCompanies.map((company, index) => (
            <View key={index} style={styles.companyItem}>
              <Text style={styles.companyLogo}>{company.logo}</Text>
              <Text style={styles.companyName}>{company.name}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Features Section
  const FeaturesSection = () => {
    const features = [
      {
        icon: 'trending-up',
        title: 'Smart Investment Matching',
        description: 'AI-powered algorithms match investors with high-potential African SMEs based on risk tolerance and sector preferences.',
        iconLibrary: 'Feather'
      },
      {
        icon: 'shield-checkmark',
        title: 'Due Diligence Made Simple',
        description: 'Comprehensive business analysis, financial health scoring, and regulatory compliance checks for every opportunity.',
        iconLibrary: 'Ionicons'
      },
      {
        icon: 'users',
        title: 'Global Investor Network',
        description: 'Connect with a diverse community of investors from around the world, all focused on African market opportunities.',
        iconLibrary: 'Feather'
      },
      {
        icon: 'bar-chart',
        title: 'Real-time Analytics',
        description: 'Track your investments with detailed performance analytics, market insights, and growth projections.',
        iconLibrary: 'Feather'
      },
      {
        icon: 'handshake',
        title: 'Secure Transactions',
        description: 'Bank-level security with escrow services, smart contracts, and regulatory compliance across African markets.',
        iconLibrary: 'MaterialIcons'
      },
      {
        icon: 'phone',
        title: 'Mobile-First Experience',
        description: 'Manage your investments on-the-go with our native mobile app, optimized for African connectivity.',
        iconLibrary: 'Feather'
      }
    ];

    const renderIcon = (iconName, iconLibrary, size = 24, color) => {
      switch (iconLibrary) {
        case 'Feather':
          return <Feather name={iconName} size={size} color={color} />;
        case 'Ionicons':
          return <Ionicons name={iconName} size={size} color={color} />;
        case 'MaterialIcons':
          return <MaterialIcons name={iconName} size={size} color={color} />;
        default:
          return <Feather name="circle" size={size} color={color} />;
      }
    };

    return (
      <View style={styles.featuresContainer}>
        <View style={styles.featuresHeader}>
          <Text style={styles.featuresTitle}>
            Everything you need to invest in Africa
          </Text>
          <Text style={styles.featuresSubtitle}>
            From discovery to investment management, we provide the tools and insights 
            to make informed decisions in African markets.
          </Text>
        </View>
        
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <Animated.View 
              key={index} 
              style={[
                styles.featureCard,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0]
                    })
                  }]
                }
              ]}
            >
              <View style={styles.featureIcon}>
                {renderIcon(feature.icon, feature.iconLibrary, 28, getEnhancedColor('primary.600'))}
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    );
  };

  // CTA Section
  const CTASection = () => (
    <LinearGradient
      colors={[getEnhancedColor('primary.600'), getEnhancedColor('primary.700')]}
      style={styles.ctaContainer}
    >
      <View style={styles.ctaContent}>
        <Text style={styles.ctaTitle}>
          Ready to start investing in Africa?
        </Text>
        <Text style={styles.ctaSubtitle}>
          Join thousands of investors who are already building wealth 
          through African startup opportunities.
        </Text>
        <View style={styles.ctaActions}>
          <TouchableOpacity 
            style={styles.ctaPrimaryButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.ctaPrimaryButtonText}>Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.ctaSecondaryButton}
            onPress={() => navigation.navigate('Welcome')}
          >
            <Text style={styles.ctaSecondaryButtonText}>Learn More</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );

  // Footer Component
  const Footer = () => (
    <View style={styles.footerContainer}>
      <View style={styles.footerContent}>
        <View style={styles.footerSection}>
          <Text style={styles.footerSectionTitle}>For Investors</Text>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Investment Opportunities</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Portfolio Management</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Market Research</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Due Diligence</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerSectionTitle}>For Startups</Text>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Raise Funding</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Business Valuation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Investor Relations</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Growth Analytics</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerSectionTitle}>Resources</Text>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Market Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Investment Guide</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Blog</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Help Center</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerSectionTitle}>Company</Text>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>About Us</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Careers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerLink}>
            <Text style={styles.footerLinkText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footerBottom}>
        <Text style={styles.footerCopyright}>
          © 2024 BizInvest Hub. All rights reserved.
        </Text>
        <View style={styles.footerSocial}>
          <TouchableOpacity style={styles.socialIcon}>
            <Feather name="twitter" size={20} color={getEnhancedColor('gray.500')} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}>
            <Feather name="linkedin" size={20} color={getEnhancedColor('gray.500')} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}>
            <Feather name="facebook" size={20} color={getEnhancedColor('gray.500')} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Animated.ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <NavigationHeader />
        <HeroSection />
        <CompanyLogosSection />
        <FeaturesSection />
        <CTASection />
        <Footer />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flex: 1,
  },

  // Navigation Styles
  navContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: getSpacing(6),
    paddingVertical: getSpacing(4),
    borderBottomWidth: 1,
    borderBottomColor: getEnhancedColor('gray.100'),
    ...getShadow('xs'),
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontSize: enhancedDesignSystem.typography.sizes['2xl'],
    fontWeight: enhancedDesignSystem.typography.weights.bold,
    color: getEnhancedColor('gray.900'),
  },
  logoSubtext: {
    fontSize: enhancedDesignSystem.typography.sizes.base,
    fontWeight: enhancedDesignSystem.typography.weights.medium,
    color: getEnhancedColor('primary.600'),
    marginLeft: getSpacing(1),
  },
  navMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    display: screenWidth > 768 ? 'flex' : 'none',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getSpacing(4),
    paddingVertical: getSpacing(2),
    marginHorizontal: getSpacing(2),
  },
  navText: {
    fontSize: enhancedDesignSystem.typography.sizes.base,
    fontWeight: enhancedDesignSystem.typography.weights.medium,
    color: getEnhancedColor('gray.700'),
    marginRight: getSpacing(1),
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButton: {
    paddingHorizontal: getSpacing(4),
    paddingVertical: getSpacing(2),
    marginRight: getSpacing(3),
  },
  loginText: {
    fontSize: enhancedDesignSystem.typography.sizes.base,
    fontWeight: enhancedDesignSystem.typography.weights.medium,
    color: getEnhancedColor('gray.700'),
  },
  signupButton: {
    backgroundColor: getEnhancedColor('gray.900'),
    paddingHorizontal: getSpacing(6),
    paddingVertical: getSpacing(3),
    borderRadius: enhancedDesignSystem.borderRadius.button,
  },
  signupText: {
    fontSize: enhancedDesignSystem.typography.sizes.base,
    fontWeight: enhancedDesignSystem.typography.weights.medium,
    color: '#ffffff',
  },

  // Hero Section Styles
  heroContainer: {
    minHeight: screenWidth > 768 ? screenHeight * 0.7 : screenHeight * 0.6,
  },
  heroGradient: {
    flex: 1,
    paddingHorizontal: screenWidth > 768 ? getSpacing(6) : getSpacing(4),
    paddingVertical: screenWidth > 768 ? getSpacing(16) : getSpacing(8),
    justifyContent: 'center',
  },
  heroContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  heroText: {
    alignItems: 'center',
    maxWidth: 800,
  },
  heroTitle: {
    fontSize: screenWidth > 768 ? 56 : enhancedDesignSystem.typography.sizes['4xl'],
    fontWeight: enhancedDesignSystem.typography.weights.extrabold,
    color: getEnhancedColor('gray.900'),
    textAlign: 'center',
    lineHeight: screenWidth > 768 ? 64 : enhancedDesignSystem.typography.sizes['4xl'] * 1.2,
    marginBottom: getSpacing(6),
  },
  heroSubtitle: {
    fontSize: screenWidth > 768 ? enhancedDesignSystem.typography.sizes.xl : enhancedDesignSystem.typography.sizes.lg,
    color: getEnhancedColor('gray.600'),
    textAlign: 'center',
    lineHeight: enhancedDesignSystem.typography.lineHeights.relaxed * (screenWidth > 768 ? enhancedDesignSystem.typography.sizes.xl : enhancedDesignSystem.typography.sizes.lg),
    marginBottom: screenWidth > 768 ? getSpacing(10) : getSpacing(8),
    paddingHorizontal: screenWidth <= 768 ? getSpacing(2) : 0,
  },
  heroTabs: {
    flexDirection: 'row',
    backgroundColor: getEnhancedColor('gray.100'),
    borderRadius: enhancedDesignSystem.borderRadius.button,
    padding: getSpacing(1),
    marginBottom: getSpacing(8),
    width: screenWidth <= 768 ? '100%' : 'auto',
    maxWidth: screenWidth <= 768 ? 350 : 'auto',
  },
  heroTab: {
    paddingHorizontal: screenWidth <= 768 ? getSpacing(4) : getSpacing(6),
    paddingVertical: getSpacing(3),
    borderRadius: enhancedDesignSystem.borderRadius.md,
    flex: screenWidth <= 768 ? 1 : 0,
    alignItems: 'center',
  },
  heroTabActive: {
    backgroundColor: '#ffffff',
    ...getShadow('sm'),
  },
  heroTabText: {
    fontSize: screenWidth <= 768 ? enhancedDesignSystem.typography.sizes.sm : enhancedDesignSystem.typography.sizes.base,
    fontWeight: enhancedDesignSystem.typography.weights.medium,
    color: getEnhancedColor('gray.600'),
    textAlign: 'center',
  },
  heroTabTextActive: {
    color: getEnhancedColor('gray.900'),
    fontWeight: enhancedDesignSystem.typography.weights.semibold,
  },
  heroActions: {
    flexDirection: screenWidth > 768 ? 'row' : 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
  },
  primaryButton: {
    backgroundColor: getEnhancedColor('gray.900'),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getSpacing(8),
    paddingVertical: getSpacing(4),
    borderRadius: enhancedDesignSystem.borderRadius.button,
    marginBottom: screenWidth > 768 ? 0 : getSpacing(4),
    marginRight: screenWidth > 768 ? getSpacing(4) : 0,
    width: screenWidth <= 768 ? '100%' : 'auto',
    justifyContent: 'center',
    ...getShadow('md'),
  },
  primaryButtonText: {
    fontSize: enhancedDesignSystem.typography.sizes.lg,
    fontWeight: enhancedDesignSystem.typography.weights.semibold,
    color: '#ffffff',
    marginRight: getSpacing(2),
  },
  secondaryButton: {
    paddingHorizontal: getSpacing(8),
    paddingVertical: getSpacing(4),
    borderRadius: enhancedDesignSystem.borderRadius.button,
    borderWidth: 1,
    borderColor: getEnhancedColor('gray.300'),
    width: screenWidth <= 768 ? '100%' : 'auto',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: enhancedDesignSystem.typography.sizes.lg,
    fontWeight: enhancedDesignSystem.typography.weights.semibold,
    color: getEnhancedColor('gray.700'),
  },

  // Companies Section Styles
  companiesContainer: {
    paddingHorizontal: screenWidth > 768 ? getSpacing(6) : getSpacing(4),
    paddingVertical: screenWidth > 768 ? getSpacing(16) : getSpacing(12),
    backgroundColor: getEnhancedColor('gray.50'),
  },
  companiesTitle: {
    fontSize: enhancedDesignSystem.typography.sizes.lg,
    fontWeight: enhancedDesignSystem.typography.weights.medium,
    color: getEnhancedColor('gray.600'),
    textAlign: 'center',
    marginBottom: getSpacing(8),
  },
  companiesScroll: {
    flexGrow: 0,
  },
  companyItem: {
    alignItems: 'center',
    marginHorizontal: getSpacing(6),
    paddingVertical: getSpacing(4),
  },
  companyLogo: {
    fontSize: 32,
    marginBottom: getSpacing(2),
  },
  companyName: {
    fontSize: enhancedDesignSystem.typography.sizes.sm,
    fontWeight: enhancedDesignSystem.typography.weights.medium,
    color: getEnhancedColor('gray.700'),
  },

  // Features Section Styles
  featuresContainer: {
    paddingHorizontal: screenWidth > 768 ? getSpacing(6) : getSpacing(4),
    paddingVertical: screenWidth > 768 ? getSpacing(20) : getSpacing(16),
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  featuresHeader: {
    alignItems: 'center',
    marginBottom: getSpacing(16),
  },
  featuresTitle: {
    fontSize: screenWidth > 768 ? enhancedDesignSystem.typography.sizes['4xl'] : enhancedDesignSystem.typography.sizes['3xl'],
    fontWeight: enhancedDesignSystem.typography.weights.bold,
    color: getEnhancedColor('gray.900'),
    textAlign: 'center',
    marginBottom: getSpacing(4),
  },
  featuresSubtitle: {
    fontSize: enhancedDesignSystem.typography.sizes.lg,
    color: getEnhancedColor('gray.600'),
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: enhancedDesignSystem.typography.lineHeights.relaxed * enhancedDesignSystem.typography.sizes.lg,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: screenWidth > 1024 ? 'space-between' : 'center',
    gap: screenWidth <= 768 ? getSpacing(4) : getSpacing(6),
  },
  featureCard: {
    width: screenWidth > 1024 ? '30%' : screenWidth > 768 ? '45%' : '100%',
    backgroundColor: '#ffffff',
    padding: getSpacing(6),
    borderRadius: enhancedDesignSystem.borderRadius.card,
    marginBottom: getSpacing(6),
    ...getShadow('sm'),
    borderWidth: 1,
    borderColor: getEnhancedColor('gray.100'),
  },
  featureIcon: {
    width: 56,
    height: 56,
    backgroundColor: getEnhancedColor('primary.50'),
    borderRadius: enhancedDesignSystem.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing(6),
  },
  featureTitle: {
    fontSize: enhancedDesignSystem.typography.sizes.xl,
    fontWeight: enhancedDesignSystem.typography.weights.semibold,
    color: getEnhancedColor('gray.900'),
    marginBottom: getSpacing(3),
  },
  featureDescription: {
    fontSize: enhancedDesignSystem.typography.sizes.base,
    color: getEnhancedColor('gray.600'),
    lineHeight: enhancedDesignSystem.typography.lineHeights.relaxed * enhancedDesignSystem.typography.sizes.base,
  },

  // CTA Section Styles
  ctaContainer: {
    paddingHorizontal: screenWidth > 768 ? getSpacing(6) : getSpacing(4),
    paddingVertical: screenWidth > 768 ? getSpacing(20) : getSpacing(16),
  },
  ctaContent: {
    maxWidth: 800,
    alignSelf: 'center',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: screenWidth > 768 ? enhancedDesignSystem.typography.sizes['4xl'] : enhancedDesignSystem.typography.sizes['3xl'],
    fontWeight: enhancedDesignSystem.typography.weights.bold,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: getSpacing(4),
  },
  ctaSubtitle: {
    fontSize: enhancedDesignSystem.typography.sizes.lg,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: getSpacing(10),
    lineHeight: enhancedDesignSystem.typography.lineHeights.relaxed * enhancedDesignSystem.typography.sizes.lg,
  },
  ctaActions: {
    flexDirection: screenWidth > 768 ? 'row' : 'column',
    alignItems: 'center',
    width: '100%',
  },
  ctaPrimaryButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: getSpacing(8),
    paddingVertical: getSpacing(4),
    borderRadius: enhancedDesignSystem.borderRadius.button,
    marginBottom: screenWidth > 768 ? 0 : getSpacing(4),
    marginRight: screenWidth > 768 ? getSpacing(4) : 0,
    width: screenWidth <= 768 ? '100%' : 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    ...getShadow('md'),
  },
  ctaPrimaryButtonText: {
    fontSize: enhancedDesignSystem.typography.sizes.lg,
    fontWeight: enhancedDesignSystem.typography.weights.semibold,
    color: getEnhancedColor('primary.600'),
  },
  ctaSecondaryButton: {
    paddingHorizontal: getSpacing(8),
    paddingVertical: getSpacing(4),
    borderRadius: enhancedDesignSystem.borderRadius.button,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    width: screenWidth <= 768 ? '100%' : 'auto',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaSecondaryButtonText: {
    fontSize: enhancedDesignSystem.typography.sizes.lg,
    fontWeight: enhancedDesignSystem.typography.weights.semibold,
    color: '#ffffff',
  },

  // Footer Styles
  footerContainer: {
    backgroundColor: getEnhancedColor('gray.900'),
    paddingHorizontal: screenWidth > 768 ? getSpacing(6) : getSpacing(4),
    paddingVertical: screenWidth > 768 ? getSpacing(16) : getSpacing(12),
  },
  footerContent: {
    flexDirection: screenWidth > 768 ? 'row' : 'column',
    justifyContent: 'space-between',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  footerSection: {
    marginBottom: getSpacing(8),
    flex: screenWidth > 768 ? 1 : undefined,
    marginRight: screenWidth > 768 ? getSpacing(8) : 0,
  },
  footerSectionTitle: {
    fontSize: enhancedDesignSystem.typography.sizes.lg,
    fontWeight: enhancedDesignSystem.typography.weights.semibold,
    color: '#ffffff',
    marginBottom: getSpacing(4),
  },
  footerLink: {
    paddingVertical: getSpacing(2),
  },
  footerLinkText: {
    fontSize: enhancedDesignSystem.typography.sizes.base,
    color: getEnhancedColor('gray.400'),
  },
  footerBottom: {
    flexDirection: screenWidth > 768 ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: getSpacing(8),
    borderTopWidth: 1,
    borderTopColor: getEnhancedColor('gray.800'),
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  footerCopyright: {
    fontSize: enhancedDesignSystem.typography.sizes.sm,
    color: getEnhancedColor('gray.500'),
    marginBottom: screenWidth > 768 ? 0 : getSpacing(4),
    textAlign: 'center',
  },
  footerSocial: {
    flexDirection: 'row',
  },
  socialIcon: {
    padding: getSpacing(2),
    marginHorizontal: getSpacing(2),
  },
};

export default Homepage;