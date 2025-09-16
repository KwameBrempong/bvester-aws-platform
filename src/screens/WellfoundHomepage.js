import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Wellfound.com exact breakpoints
const BREAKPOINTS = {
  mobile: 520,
  tablet: 960,
  desktop: 1200,
  large: 2000
};

// Wellfound.com exact colors
const COLORS = {
  black: '#000000',
  white: '#ffffff',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827'
};

// Wellfound.com typography scale
const TYPOGRAPHY = {
  hero: { 
    fontSize: Platform.select({ web: 72, default: 48 }), 
    lineHeight: Platform.select({ web: 80, default: 56 }), 
    fontWeight: '800', 
    letterSpacing: -2 
  },
  h1: { fontSize: 48, lineHeight: 56, fontWeight: '700', letterSpacing: -1 },
  h2: { fontSize: 36, lineHeight: 44, fontWeight: '600', letterSpacing: -0.5 },
  h3: { fontSize: 24, lineHeight: 32, fontWeight: '600', letterSpacing: 0 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0 },
  bodyLarge: { fontSize: 18, lineHeight: 28, fontWeight: '400', letterSpacing: 0 },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: 0 }
};

// Animation durations matching Wellfound
const ANIMATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  stagger: 200
};

const WellfoundHomepage = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('investors');
  const [isHovered, setIsHovered] = useState({});
  const [showDropdown, setShowDropdown] = useState({});
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnims = useRef([...Array(6)].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([...Array(6)].map(() => new Animated.Value(30))).current;

  const isWeb = Platform.OS === 'web';
  const isMobile = screenWidth < BREAKPOINTS.tablet;
  const isTablet = screenWidth >= BREAKPOINTS.tablet && screenWidth < BREAKPOINTS.desktop;
  const styles = getStyles(isMobile, screenWidth);

  useEffect(() => {
    // Staggered animations like Wellfound
    const animations = fadeAnims.map((anim, index) => 
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: ANIMATIONS.slow,
          delay: index * ANIMATIONS.stagger,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnims[index], {
          toValue: 0,
          duration: ANIMATIONS.slow,
          delay: index * ANIMATIONS.stagger,
          useNativeDriver: true,
        })
      ])
    );
    
    Animated.parallel(animations).start();
  }, []);

  const handleHover = (key, isHovering) => {
    if (isWeb) {
      setIsHovered(prev => ({ ...prev, [key]: isHovering }));
    }
  };

  const handleDropdown = (key, show) => {
    if (isWeb) {
      setShowDropdown(prev => ({ ...prev, [key]: show }));
    }
  };

  // Navigation Header - Exact Wellfound styling
  const NavigationHeader = () => (
    <View style={styles.navContainer}>
      <View style={styles.navContent}>
        <TouchableOpacity style={styles.logoContainer}>
          <Text style={styles.logoText}>BizInvest</Text>
          <Text style={styles.logoAccent}>Hub</Text>
        </TouchableOpacity>
        
        {!isMobile && (
          <View style={styles.navMenu}>
            <View style={styles.navItemContainer}>
              <TouchableOpacity 
                style={styles.navItem}
                onPress={() => navigation.navigate('About')}
                onMouseEnter={() => handleHover('discover', true)}
                onMouseLeave={() => handleHover('discover', false)}
              >
                <Text style={[styles.navText, isHovered.discover && styles.navTextHover]}>
                  Discover
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.navItemContainer}>
              <TouchableOpacity 
                style={styles.navItem}
                onMouseEnter={() => {
                  handleHover('investors', true);
                  handleDropdown('investors', true);
                }}
                onMouseLeave={() => {
                  handleHover('investors', false);
                  handleDropdown('investors', false);
                }}
              >
                <Text style={[styles.navText, isHovered.investors && styles.navTextHover]}>
                  For investors
                </Text>
                <MaterialIcons 
                  name="keyboard-arrow-down" 
                  size={16} 
                  color={isHovered.investors ? COLORS.black : COLORS.gray600} 
                />
              </TouchableOpacity>
              
              {showDropdown.investors && (
                <View 
                  style={styles.dropdown}
                  onMouseEnter={() => {
                    handleHover('investors', true);
                    handleDropdown('investors', true);
                  }}
                  onMouseLeave={() => {
                    handleHover('investors', false);
                    handleDropdown('investors', false);
                  }}
                >
                  <TouchableOpacity style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemText}>Investment Opportunities</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemText}>Portfolio Management</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemText}>Market Research</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemText}>Due Diligence</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            <View style={styles.navItemContainer}>
              <TouchableOpacity 
                style={styles.navItem}
                onMouseEnter={() => {
                  handleHover('startups', true);
                  handleDropdown('startups', true);
                }}
                onMouseLeave={() => {
                  handleHover('startups', false);
                  handleDropdown('startups', false);
                }}
              >
                <Text style={[styles.navText, isHovered.startups && styles.navTextHover]}>
                  For startups
                </Text>
                <MaterialIcons 
                  name="keyboard-arrow-down" 
                  size={16} 
                  color={isHovered.startups ? COLORS.black : COLORS.gray600} 
                />
              </TouchableOpacity>
              
              {showDropdown.startups && (
                <View 
                  style={styles.dropdown}
                  onMouseEnter={() => {
                    handleHover('startups', true);
                    handleDropdown('startups', true);
                  }}
                  onMouseLeave={() => {
                    handleHover('startups', false);
                    handleDropdown('startups', false);
                  }}
                >
                  <TouchableOpacity style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemText}>Raise Funding</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemText}>Business Valuation</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemText}>Investor Relations</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dropdownItem}>
                    <Text style={styles.dropdownItemText}>Growth Analytics</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.navActions}>
          <TouchableOpacity 
            style={[styles.loginButton, isHovered.login && styles.loginButtonHover]}
            onPress={() => navigation.navigate('Login')}
            onMouseEnter={() => handleHover('login', true)}
            onMouseLeave={() => handleHover('login', false)}
          >
            <Text style={[styles.loginText, isHovered.login && styles.loginTextHover]}>
              Log in
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.signupButton, isHovered.signup && styles.signupButtonHover]}
            onPress={() => navigation.navigate('Register')}
            onMouseEnter={() => handleHover('signup', true)}
            onMouseLeave={() => handleHover('signup', false)}
          >
            <Text style={[styles.signupText, isHovered.signup && styles.signupTextHover]}>
              Sign up
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Hero Section - Exact Wellfound layout and animations
  const HeroSection = () => (
    <Animated.View 
      style={[
        styles.heroContainer,
        {
          opacity: fadeAnims[0],
          transform: [{ translateY: slideAnims[0] }]
        }
      ]}
    >
      <View style={styles.heroContent}>
        <View style={styles.heroTextContainer}>
          <Text style={styles.heroTitle}>
            Where African startups
          </Text>
          <Text style={styles.heroTitle}>
            and{' '}
            <Text style={styles.heroTitleAccent}>global investors</Text>{' '}
            connect
          </Text>
          
          <Text style={styles.heroSubtitle}>
            Discover high-growth investment opportunities in Africa's most promising SMEs. 
            Connect directly with entrepreneurs building the future of African commerce.
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
              style={[styles.heroPrimaryButton, isHovered.heroPrimary && styles.heroPrimaryButtonHover]}
              onPress={() => navigation.navigate('Register')}
              onMouseEnter={() => handleHover('heroPrimary', true)}
              onMouseLeave={() => handleHover('heroPrimary', false)}
            >
              <Text style={[styles.heroPrimaryButtonText, isHovered.heroPrimary && styles.heroPrimaryButtonTextHover]}>
                {activeTab === 'investors' ? 'Find Investment Opportunities' : 'Get Funded'}
              </Text>
              <Feather 
                name="arrow-right" 
                size={18} 
                color={isHovered.heroPrimary ? COLORS.black : COLORS.white} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.heroSecondaryButton, isHovered.heroSecondary && styles.heroSecondaryButtonHover]}
              onPress={() => navigation.navigate('Welcome')}
              onMouseEnter={() => handleHover('heroSecondary', true)}
              onMouseLeave={() => handleHover('heroSecondary', false)}
            >
              <Text style={[styles.heroSecondaryButtonText, isHovered.heroSecondary && styles.heroSecondaryButtonTextHover]}>
                Learn more
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  // Company Logos Section - Wellfound style
  const CompanyLogosSection = () => {
    const africanCompanies = [
      { name: 'Flutterwave', icon: '💳' },
      { name: 'Jumia', icon: '🛒' },
      { name: 'Andela', icon: '👨‍💻' },
      { name: 'Paystack', icon: '💰' },
      { name: 'Twiga Foods', icon: '🥬' },
      { name: 'Kobo360', icon: '🚛' },
      { name: 'Cellulant', icon: '📱' },
      { name: 'iROKOtv', icon: '📺' },
    ];

    return (
      <Animated.View 
        style={[
          styles.companiesContainer,
          {
            opacity: fadeAnims[1],
            transform: [{ translateY: slideAnims[1] }]
          }
        ]}
      >
        <Text style={styles.companiesTitle}>
          Trusted by Africa's leading startups
        </Text>
        
        <View style={styles.companiesGrid}>
          {africanCompanies.map((company, index) => (
            <Animated.View 
              key={index} 
              style={[
                styles.companyItem,
                {
                  opacity: fadeAnims[1],
                  transform: [{
                    translateY: slideAnims[1].interpolate({
                      inputRange: [0, 30],
                      outputRange: [0, 30 + (index * 5)]
                    })
                  }]
                }
              ]}
            >
              <Text style={styles.companyIcon}>{company.icon}</Text>
              <Text style={styles.companyName}>{company.name}</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    );
  };

  // Features Section - Wellfound grid layout
  const FeaturesSection = () => {
    const features = [
      {
        icon: 'trending-up',
        title: 'Smart Investment Matching',
        description: 'AI-powered algorithms connect investors with high-potential African SMEs based on risk tolerance and sector preferences.',
        iconLibrary: 'Feather'
      },
      {
        icon: 'shield-checkmark',
        title: 'Due Diligence Made Simple',
        description: 'Comprehensive business analysis, financial health scoring, and regulatory compliance checks.',
        iconLibrary: 'Ionicons'
      },
      {
        icon: 'users',
        title: 'Global Investor Network',
        description: 'Connect with diverse investors worldwide, all focused on African market opportunities.',
        iconLibrary: 'Feather'
      },
      {
        icon: 'bar-chart',
        title: 'Real-time Analytics',
        description: 'Track investments with detailed performance analytics and growth projections.',
        iconLibrary: 'Feather'
      },
      {
        icon: 'security',
        title: 'Bank-level Security',
        description: 'Secure transactions with escrow services and regulatory compliance.',
        iconLibrary: 'MaterialIcons'
      },
      {
        icon: 'smartphone',
        title: 'Mobile-First Platform',
        description: 'Manage investments on-the-go with our native mobile app.',
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
      <Animated.View 
        style={[
          styles.featuresContainer,
          {
            opacity: fadeAnims[2],
            transform: [{ translateY: slideAnims[2] }]
          }
        ]}
      >
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
                  opacity: fadeAnims[2],
                  transform: [{
                    translateY: slideAnims[2].interpolate({
                      inputRange: [0, 30],
                      outputRange: [0, 30 + (index * 8)]
                    })
                  }]
                }
              ]}
            >
              <View style={styles.featureIcon}>
                {renderIcon(feature.icon, feature.iconLibrary, 24, COLORS.black)}
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    );
  };

  // CTA Section - Wellfound black section style
  const CTASection = () => (
    <Animated.View 
      style={[
        styles.ctaContainer,
        {
          opacity: fadeAnims[3],
          transform: [{ translateY: slideAnims[3] }]
        }
      ]}
    >
      <View style={styles.ctaContent}>
        <Text style={styles.ctaTitle}>
          Ready to start investing in Africa?
        </Text>
        <Text style={styles.ctaSubtitle}>
          Join thousands of investors building wealth through African startup opportunities.
        </Text>
        <View style={styles.ctaActions}>
          <TouchableOpacity 
            style={[styles.ctaPrimaryButton, isHovered.ctaPrimary && styles.ctaPrimaryButtonHover]}
            onPress={() => navigation.navigate('Register')}
            onMouseEnter={() => handleHover('ctaPrimary', true)}
            onMouseLeave={() => handleHover('ctaPrimary', false)}
          >
            <Text style={[styles.ctaPrimaryButtonText, isHovered.ctaPrimary && styles.ctaPrimaryButtonTextHover]}>
              Get Started
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.ctaSecondaryButton, isHovered.ctaSecondary && styles.ctaSecondaryButtonHover]}
            onPress={() => navigation.navigate('Welcome')}
            onMouseEnter={() => handleHover('ctaSecondary', true)}
            onMouseLeave={() => handleHover('ctaSecondary', false)}
          >
            <Text style={[styles.ctaSecondaryButtonText, isHovered.ctaSecondary && styles.ctaSecondaryButtonTextHover]}>
              Learn More
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  // Footer - Wellfound style
  const Footer = () => (
    <Animated.View 
      style={[
        styles.footerContainer,
        {
          opacity: fadeAnims[4],
          transform: [{ translateY: slideAnims[4] }]
        }
      ]}
    >
      <View style={styles.footerContent}>
        <View style={styles.footerGrid}>
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
          </View>
        </View>

        <View style={styles.footerBottom}>
          <Text style={styles.footerCopyright}>
            © 2024 BizInvest Hub. All rights reserved.
          </Text>
          <View style={styles.footerSocial}>
            <TouchableOpacity style={styles.socialIcon}>
              <Feather name="twitter" size={20} color={COLORS.gray400} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Feather name="linkedin" size={20} color={COLORS.gray400} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <Feather name="facebook" size={20} color={COLORS.gray400} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
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

// Wellfound.com exact styles
const getStyles = (isMobile, screenWidth) => {
  return {
    container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContainer: {
    flex: 1,
  },

  // Navigation - Exact Wellfound styling
  navContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: isMobile ? 16 : 24,
    paddingVertical: isMobile ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    position: 'sticky',
    top: 0,
    zIndex: 50,
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
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.black,
    fontFamily: Platform.select({ ios: 'System', android: 'System', default: 'System' }),
  },
  logoAccent: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.gray600,
    marginLeft: 2,
    fontFamily: Platform.select({ ios: 'System', android: 'System', default: 'System' }),
  },
  navMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  navItemContainer: {
    position: 'relative',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 6,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 8,
    right: 8,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 4,
    minWidth: 200,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray700,
    transition: Platform.select({ web: 'color 150ms ease', default: undefined }),
  },
  navText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray700,
    marginRight: 4,
    transition: Platform.select({ web: 'color 150ms ease', default: undefined }),
  },
  navTextHover: {
    color: COLORS.black,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButton: {
    paddingHorizontal: isMobile ? 12 : 16,
    paddingVertical: isMobile ? 6 : 8,
    marginRight: isMobile ? 8 : 12,
    borderRadius: 6,
    transition: Platform.select({ web: 'all 150ms ease', default: undefined }),
  },
  loginButtonHover: {
    backgroundColor: COLORS.gray50,
  },
  loginText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray700,
    transition: Platform.select({ web: 'color 150ms ease', default: undefined }),
  },
  loginTextHover: {
    color: COLORS.black,
  },
  signupButton: {
    backgroundColor: COLORS.black,
    paddingHorizontal: isMobile ? 16 : 20,
    paddingVertical: isMobile ? 8 : 10,
    borderRadius: 6,
    transition: Platform.select({ web: 'all 150ms ease', default: undefined }),
  },
  signupButtonHover: {
    backgroundColor: COLORS.gray800,
  },
  signupText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.white,
  },
  signupTextHover: {
    color: COLORS.white,
  },

  // Hero Section - Exact Wellfound layout
  heroContainer: {
    paddingHorizontal: isMobile ? 16 : 24,
    paddingTop: isMobile ? 60 : Platform.select({ web: 120, default: 80 }),
    paddingBottom: isMobile ? 60 : Platform.select({ web: 120, default: 80 }),
    backgroundColor: COLORS.white,
  },
  heroContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  heroTextContainer: {
    maxWidth: 800,
    alignSelf: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: isMobile ? 32 : Platform.select({ web: TYPOGRAPHY.hero.fontSize, default: 42 }),
    lineHeight: isMobile ? 38 : Platform.select({ web: TYPOGRAPHY.hero.lineHeight, default: 50 }),
    fontWeight: TYPOGRAPHY.hero.fontWeight,
    letterSpacing: TYPOGRAPHY.hero.letterSpacing,
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 0,
    fontFamily: Platform.select({ ios: 'System', android: 'System', default: 'System' }),
  },
  heroTitleAccent: {
    color: COLORS.gray600,
  },
  heroSubtitle: {
    fontSize: isMobile ? 16 : TYPOGRAPHY.bodyLarge.fontSize,
    lineHeight: isMobile ? 24 : TYPOGRAPHY.bodyLarge.lineHeight,
    fontWeight: TYPOGRAPHY.bodyLarge.fontWeight,
    color: COLORS.gray600,
    textAlign: 'center',
    marginTop: isMobile ? 16 : 24,
    marginBottom: isMobile ? 32 : 48,
    maxWidth: 600,
    paddingHorizontal: isMobile ? 16 : 0,
  },
  heroTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: 4,
    marginBottom: 48,
    width: isMobile ? '100%' : 'auto',
    maxWidth: isMobile ? 350 : 'auto',
  },
  heroTab: {
    paddingHorizontal: isMobile ? 16 : 24,
    paddingVertical: 12,
    borderRadius: 6,
    flex: isMobile ? 1 : 0,
    alignItems: 'center',
    transition: Platform.select({ web: 'all 150ms ease', default: undefined }),
  },
  heroTabActive: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  heroTabText: {
    fontSize: isMobile ? 14 : 15,
    fontWeight: '500',
    color: COLORS.gray600,
    textAlign: 'center',
  },
  heroTabTextActive: {
    color: COLORS.black,
    fontWeight: '600',
  },
  heroActions: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center',
    width: '100%',
  },
  heroPrimaryButton: {
    backgroundColor: COLORS.black,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
    width: isMobile ? '100%' : 'auto',
    minWidth: isMobile ? 280 : 'auto',
    transition: Platform.select({ web: 'all 150ms ease', default: undefined }),
  },
  heroPrimaryButtonHover: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.black,
  },
  heroPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    transition: Platform.select({ web: 'color 150ms ease', default: undefined }),
  },
  heroPrimaryButtonTextHover: {
    color: COLORS.black,
  },
  heroSecondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
    width: isMobile ? '100%' : 'auto',
    minWidth: isMobile ? 280 : 'auto',
    transition: Platform.select({ web: 'all 150ms ease', default: undefined }),
  },
  heroSecondaryButtonHover: {
    backgroundColor: COLORS.gray50,
    borderColor: COLORS.gray400,
  },
  heroSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray700,
    transition: Platform.select({ web: 'color 150ms ease', default: undefined }),
  },
  heroSecondaryButtonTextHover: {
    color: COLORS.black,
  },

  // Companies Section
  companiesContainer: {
    paddingHorizontal: isMobile ? 16 : 24,
    paddingVertical: isMobile ? 60 : 80,
    backgroundColor: COLORS.gray50,
  },
  companiesTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray600,
    textAlign: 'center',
    marginBottom: 48,
  },
  companiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 1000,
    alignSelf: 'center',
  },
  companyItem: {
    alignItems: 'center',
    minWidth: 100,
  },
  companyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray700,
  },

  // Features Section
  featuresContainer: {
    paddingHorizontal: isMobile ? 16 : 24,
    paddingVertical: isMobile ? 80 : 120,
    backgroundColor: COLORS.white,
  },
  featuresHeader: {
    maxWidth: 800,
    alignSelf: 'center',
    alignItems: 'center',
    marginBottom: 80,
  },
  featuresTitle: {
    fontSize: isMobile ? 28 : Platform.select({ web: 48, default: 36 }),
    lineHeight: isMobile ? 34 : Platform.select({ web: 56, default: 44 }),
    fontWeight: '700',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
  },
  featuresSubtitle: {
    fontSize: 18,
    lineHeight: 28,
    color: COLORS.gray600,
    textAlign: 'center',
    maxWidth: 600,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: isMobile ? 'center' : 'space-between',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  featureCard: {
    width: isMobile ? '100%' : screenWidth > 1024 ? '30%' : '45%',
    minWidth: isMobile ? 'auto' : 280,
    padding: isMobile ? 24 : 32,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  featureIcon: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.gray50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.gray600,
  },

  // CTA Section
  ctaContainer: {
    backgroundColor: COLORS.black,
    paddingHorizontal: isMobile ? 16 : 24,
    paddingVertical: isMobile ? 80 : 120,
  },
  ctaContent: {
    maxWidth: 800,
    alignSelf: 'center',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: isMobile ? 28 : Platform.select({ web: 48, default: 36 }),
    lineHeight: isMobile ? 34 : Platform.select({ web: 56, default: 44 }),
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
  },
  ctaSubtitle: {
    fontSize: 18,
    lineHeight: 28,
    color: COLORS.gray300,
    textAlign: 'center',
    marginBottom: 48,
  },
  ctaActions: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center',
    width: '100%',
  },
  ctaPrimaryButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    width: isMobile ? '100%' : 'auto',
    minWidth: isMobile ? 280 : 'auto',
    transition: Platform.select({ web: 'all 150ms ease', default: undefined }),
  },
  ctaPrimaryButtonHover: {
    backgroundColor: COLORS.gray100,
  },
  ctaPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  ctaPrimaryButtonTextHover: {
    color: COLORS.black,
  },
  ctaSecondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.gray600,
    alignItems: 'center',
    justifyContent: 'center',
    width: isMobile ? '100%' : 'auto',
    minWidth: isMobile ? 280 : 'auto',
    transition: Platform.select({ web: 'all 150ms ease', default: undefined }),
  },
  ctaSecondaryButtonHover: {
    backgroundColor: COLORS.gray800,
    borderColor: COLORS.gray500,
  },
  ctaSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  ctaSecondaryButtonTextHover: {
    color: COLORS.white,
  },

  // Footer
  footerContainer: {
    backgroundColor: COLORS.gray900,
    paddingHorizontal: isMobile ? 16 : 24,
    paddingVertical: isMobile ? 60 : 80,
  },
  footerContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  footerGrid: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    marginBottom: isMobile ? 32 : 48,
  },
  footerSection: {
    flex: 1,
    minWidth: 200,
  },
  footerSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 16,
  },
  footerLink: {
    paddingVertical: 6,
  },
  footerLinkText: {
    fontSize: 15,
    color: COLORS.gray400,
    transition: Platform.select({ web: 'color 150ms ease', default: undefined }),
  },
  footerBottom: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: isMobile ? 24 : 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray800,
  },
  footerCopyright: {
    fontSize: 14,
    color: COLORS.gray500,
    textAlign: isMobile ? 'center' : 'left',
  },
  footerSocial: {
    flexDirection: 'row',
  },
  socialIcon: {
    padding: 8,
    borderRadius: 4,
    transition: Platform.select({ web: 'background-color 150ms ease', default: undefined }),
  },
  };
};

export default WellfoundHomepage;