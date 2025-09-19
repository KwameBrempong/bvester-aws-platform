import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { WELLFOUND_COLORS, getTextStyle, getContainerStyle } from '../styles/wellfoundStyles';

const AboutScreen = ({ navigation }) => {
  const isWeb = Platform.OS === 'web';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={WELLFOUND_COLORS.white} />
      
      {/* Navigation Header */}
      <View style={styles.navContainer}>
        <View style={styles.navContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={20} color={WELLFOUND_COLORS.black} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoContainer}>
            <Text style={styles.logoText}>BizInvest</Text>
            <Text style={styles.logoAccent}>Hub</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              About BizInvest Hub
            </Text>
            <Text style={styles.heroSubtitle}>
              Connecting global investors with Africa's most promising SMEs. 
              We're building the future of African entrepreneurship.
            </Text>
          </View>
        </View>

        {/* Mission Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Our Mission</Text>
            <Text style={styles.sectionText}>
              To democratize access to investment opportunities in Africa by connecting global investors 
              with high-potential small and medium enterprises across the continent. We believe that 
              African entrepreneurs have the vision and drive to build world-class businesses, 
              and we're here to provide the platform and tools to make that happen.
            </Text>
          </View>
        </View>

        {/* Vision Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Our Vision</Text>
            <Text style={styles.sectionText}>
              To become Africa's leading investment platform, facilitating billions in funding 
              for SMEs across the continent. We envision a future where African businesses 
              have seamless access to global capital, driving economic growth and job creation 
              throughout the region.
            </Text>
          </View>
        </View>

        {/* Values Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Our Values</Text>
            
            <View style={styles.valuesList}>
              <View style={styles.valueItem}>
                <View style={styles.valueIcon}>
                  <Feather name="shield" size={24} color={WELLFOUND_COLORS.black} />
                </View>
                <View style={styles.valueContent}>
                  <Text style={styles.valueTitle}>Trust & Transparency</Text>
                  <Text style={styles.valueDescription}>
                    We maintain the highest standards of due diligence and provide 
                    complete transparency in all our investment processes.
                  </Text>
                </View>
              </View>

              <View style={styles.valueItem}>
                <View style={styles.valueIcon}>
                  <Feather name="globe" size={24} color={WELLFOUND_COLORS.black} />
                </View>
                <View style={styles.valueContent}>
                  <Text style={styles.valueTitle}>Global Impact</Text>
                  <Text style={styles.valueDescription}>
                    We're committed to creating positive economic impact across Africa 
                    by facilitating responsible investments.
                  </Text>
                </View>
              </View>

              <View style={styles.valueItem}>
                <View style={styles.valueIcon}>
                  <Feather name="users" size={24} color={WELLFOUND_COLORS.black} />
                </View>
                <View style={styles.valueContent}>
                  <Text style={styles.valueTitle}>Community First</Text>
                  <Text style={styles.valueDescription}>
                    We prioritize the needs of our community - both investors and entrepreneurs - 
                    in everything we do.
                  </Text>
                </View>
              </View>

              <View style={styles.valueItem}>
                <View style={styles.valueIcon}>
                  <Feather name="trending-up" size={24} color={WELLFOUND_COLORS.black} />
                </View>
                <View style={styles.valueContent}>
                  <Text style={styles.valueTitle}>Innovation</Text>
                  <Text style={styles.valueDescription}>
                    We leverage cutting-edge technology to provide the best investment 
                    experience and insights.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Team Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Our Team</Text>
            <Text style={styles.sectionText}>
              Our team combines decades of experience in African markets, fintech, 
              and investment management. We're passionate about African entrepreneurship 
              and committed to building the infrastructure needed for sustainable economic growth.
            </Text>
            
            <View style={styles.teamGrid}>
              <View style={styles.teamMember}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>CEO</Text>
                </View>
                <Text style={styles.memberName}>Chief Executive Officer</Text>
                <Text style={styles.memberRole}>Strategic Leadership & Vision</Text>
              </View>

              <View style={styles.teamMember}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>CTO</Text>
                </View>
                <Text style={styles.memberName}>Chief Technology Officer</Text>
                <Text style={styles.memberRole}>Platform Development & Security</Text>
              </View>

              <View style={styles.teamMember}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>CFO</Text>
                </View>
                <Text style={styles.memberName}>Chief Financial Officer</Text>
                <Text style={styles.memberRole}>Investment Strategy & Risk Management</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.ctaContainer}>
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Ready to get started?</Text>
            <Text style={styles.ctaSubtitle}>
              Join thousands of investors and entrepreneurs building the future of African business.
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
                onPress={() => navigation.navigate('Homepage')}
              >
                <Text style={styles.ctaSecondaryButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: WELLFOUND_COLORS.white,
  },
  scrollContainer: {
    flex: 1,
  },

  // Navigation
  navContainer: {
    backgroundColor: WELLFOUND_COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: WELLFOUND_COLORS.gray100,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  backText: {
    fontSize: 15,
    fontWeight: '500',
    color: WELLFOUND_COLORS.black,
    marginLeft: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: WELLFOUND_COLORS.black,
  },
  logoAccent: {
    fontSize: 24,
    fontWeight: '800',
    color: WELLFOUND_COLORS.gray600,
    marginLeft: 2,
  },

  // Hero Section
  heroContainer: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 80,
    backgroundColor: WELLFOUND_COLORS.white,
  },
  heroContent: {
    maxWidth: 800,
    alignSelf: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: Platform.select({ web: 48, default: 36 }),
    lineHeight: Platform.select({ web: 56, default: 44 }),
    fontWeight: '700',
    letterSpacing: -1,
    color: WELLFOUND_COLORS.black,
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 18,
    lineHeight: 28,
    color: WELLFOUND_COLORS.gray600,
    textAlign: 'center',
    maxWidth: 600,
  },

  // Section Styles
  sectionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 60,
    backgroundColor: WELLFOUND_COLORS.white,
  },
  sectionContent: {
    maxWidth: 800,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700',
    color: WELLFOUND_COLORS.black,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  sectionText: {
    fontSize: 18,
    lineHeight: 28,
    color: WELLFOUND_COLORS.gray600,
  },

  // Values Section
  valuesList: {
    marginTop: 32,
  },
  valueItem: {
    flexDirection: 'row',
    marginBottom: 32,
    alignItems: 'flex-start',
  },
  valueIcon: {
    width: 48,
    height: 48,
    backgroundColor: WELLFOUND_COLORS.gray50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: WELLFOUND_COLORS.black,
    marginBottom: 8,
  },
  valueDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: WELLFOUND_COLORS.gray600,
  },

  // Team Section
  teamGrid: {
    flexDirection: Platform.select({ web: 'row', default: 'column' }),
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 24,
  },
  teamMember: {
    alignItems: 'center',
    flex: Platform.select({ web: 1, default: undefined }),
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: WELLFOUND_COLORS.gray900,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: WELLFOUND_COLORS.white,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: WELLFOUND_COLORS.black,
    textAlign: 'center',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 14,
    color: WELLFOUND_COLORS.gray600,
    textAlign: 'center',
  },

  // CTA Section
  ctaContainer: {
    backgroundColor: WELLFOUND_COLORS.gray900,
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  ctaContent: {
    maxWidth: 600,
    alignSelf: 'center',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: Platform.select({ web: 36, default: 28 }),
    lineHeight: Platform.select({ web: 44, default: 36 }),
    fontWeight: '700',
    color: WELLFOUND_COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  ctaSubtitle: {
    fontSize: 18,
    lineHeight: 28,
    color: WELLFOUND_COLORS.gray300,
    textAlign: 'center',
    marginBottom: 32,
  },
  ctaActions: {
    flexDirection: Platform.select({ web: 'row', default: 'column' }),
    gap: 16,
  },
  ctaPrimaryButton: {
    backgroundColor: WELLFOUND_COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
  },
  ctaPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: WELLFOUND_COLORS.black,
    textAlign: 'center',
  },
  ctaSecondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: WELLFOUND_COLORS.gray600,
  },
  ctaSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: WELLFOUND_COLORS.white,
    textAlign: 'center',
  },
};

export default AboutScreen;