import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Platform,
  Dimensions,
  ScrollView
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const SimpleHomepage = ({ navigation }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = screenWidth < 768;
  const styles = getStyles(isMobile);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      
      {/* Navigation Header */}
      <View style={styles.navContainer}>
        <View style={styles.navContent}>
          <TouchableOpacity style={styles.logo}>
            <Text style={styles.logoIcon}>💎</Text>
            <Text style={styles.logoText}>Bvester</Text>
          </TouchableOpacity>
          
          {!isMobile && (
            <View style={styles.navMenu}>
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => {
                  console.log('Discover pressed - navigating to About');
                  navigation.navigate('About');
                }}
              >
                <Text style={styles.navText}>Discover</Text>
              </TouchableOpacity>

              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={styles.navItem}
                  onPress={() => setShowDropdown(!showDropdown)}
                >
                  <Text style={styles.navText}>For Investors ▼</Text>
                </TouchableOpacity>

                {showDropdown && (
                  <View style={styles.dropdown}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        console.log('Investment Opportunities pressed');
                        setShowDropdown(false);
                        navigation.navigate('About'); // Navigate to existing screen for now
                      }}
                    >
                      <Text style={styles.dropdownText}>Investment Opportunities</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        console.log('Portfolio Management pressed');
                        setShowDropdown(false);
                        navigation.navigate('About'); // Navigate to existing screen for now
                      }}
                    >
                      <Text style={styles.dropdownText}>Portfolio Management</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

          {isMobile && (
            <TouchableOpacity
              style={styles.mobileMenuButton}
              onPress={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Text style={styles.hamburgerIcon}>☰</Text>
            </TouchableOpacity>
          )}

          <View style={styles.navActions}>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => {
                console.log('Login pressed');
                navigation.navigate('Login');
              }}
            >
              <Text style={styles.loginText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.signupButton}
              onPress={() => {
                console.log('Sign up pressed');
                navigation.navigate('Register');
              }}
            >
              <Text style={styles.signupText}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Mobile Menu Overlay */}
      {isMobile && showMobileMenu && (
        <View style={styles.mobileMenuOverlay}>
          <View style={styles.mobileMenuContent}>
            <TouchableOpacity
              style={styles.mobileMenuItem}
              onPress={() => {
                console.log('Mobile: Discover pressed - navigating to About');
                setShowMobileMenu(false);
                navigation.navigate('About');
              }}
            >
              <Text style={styles.mobileMenuText}>Discover</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mobileMenuItem}
              onPress={() => {
                console.log('Mobile: Investment Opportunities pressed');
                setShowMobileMenu(false);
                navigation.navigate('About');
              }}
            >
              <Text style={styles.mobileMenuText}>Investment Opportunities</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mobileMenuItem}
              onPress={() => {
                console.log('Mobile: Portfolio Management pressed');
                setShowMobileMenu(false);
                navigation.navigate('About');
              }}
            >
              <Text style={styles.mobileMenuText}>Portfolio Management</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mobileMenuItem}
              onPress={() => {
                console.log('Mobile: Sign In pressed');
                setShowMobileMenu(false);
                navigation.navigate('Login');
              }}
            >
              <Text style={styles.mobileMenuText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mobileMenuItem, styles.mobileSignupButton]}
              onPress={() => {
                console.log('Mobile: Sign up pressed');
                setShowMobileMenu(false);
                navigation.navigate('Register');
              }}
            >
              <Text style={styles.mobileSignupText}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>
          Where African Innovation Meets Global Investment
        </Text>
        <Text style={styles.heroSubtitle}>
          Connect with opportunities, grow your business, and invest in Africa's future.
        </Text>
        
        <View style={styles.heroButtons}>
          <TouchableOpacity 
            style={[styles.heroButton, styles.investorButton]}
            onPress={() => {
              console.log('I Want to Invest in Africa pressed');
              navigation.navigate('Register'); // Navigate to investor registration
            }}
          >
            <Text style={styles.heroButtonText}>I Want to Invest in Africa</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.heroButton, styles.fundingButton]}
            onPress={() => {
              console.log('I Need Funding for My Business pressed');
              navigation.navigate('Register'); // Navigate to SME registration
            }}
          >
            <Text style={styles.heroButtonTextSecondary}>I Need Funding for My Business</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer Section */}
      <View style={styles.footerContainer}>
        <View style={styles.footerContent}>
          <View style={styles.footerGrid}>
            <View style={styles.footerSection}>
              <Text style={styles.footerSectionTitle}>For Investors</Text>
              <TouchableOpacity 
                style={styles.footerLink}
                onPress={() => {
                  console.log('Footer: Investment Opportunities pressed');
                  navigation.navigate('Register'); // Navigate to register for investors
                }}
              >
                <Text style={styles.footerLinkText}>Investment Opportunities</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.footerLink}
                onPress={() => {
                  console.log('Footer: Portfolio Management pressed');
                  navigation.navigate('Login'); // Navigate to login for existing users
                }}
              >
                <Text style={styles.footerLinkText}>Portfolio Management</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerSection}>
              <Text style={styles.footerSectionTitle}>For Startups</Text>
              <TouchableOpacity 
                style={styles.footerLink}
                onPress={() => {
                  console.log('Footer: Raise Funding pressed');
                  navigation.navigate('Register'); // Navigate to register for SMEs
                }}
              >
                <Text style={styles.footerLinkText}>Raise Funding</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.footerLink}
                onPress={() => {
                  console.log('Footer: Business Valuation pressed');
                  navigation.navigate('About'); // Navigate to about page with more info
                }}
              >
                <Text style={styles.footerLinkText}>Business Valuation</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerBottom}>
            <Text style={styles.footerCopyright}>
              © 2024 Bvester. All rights reserved.
            </Text>
          </View>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (isMobile) => StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  navContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: isMobile ? 16 : 24,
    paddingVertical: isMobile ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  logo: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  navMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    display: isMobile ? 'none' : 'flex',
  },
  navItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  navText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownText: {
    fontSize: 14,
    color: '#374151',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButton: {
    paddingHorizontal: isMobile ? 12 : 16,
    paddingVertical: isMobile ? 6 : 8,
    marginRight: isMobile ? 8 : 12,
  },
  loginText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  signupButton: {
    backgroundColor: '#000000',
    paddingHorizontal: isMobile ? 16 : 20,
    paddingVertical: isMobile ? 8 : 10,
    borderRadius: 6,
  },
  signupText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    minHeight: 500,
  },
  heroButtons: {
    flexDirection: isMobile ? 'column' : 'row',
    gap: 16,
    alignItems: 'center',
    width: '100%',
    maxWidth: 600,
  },
  heroButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: isMobile ? '100%' : 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  investorButton: {
    backgroundColor: '#2E7D8F',
  },
  fundingButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2E7D8F',
  },
  heroButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  heroButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D8F',
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: isMobile ? 32 : 48,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: isMobile ? 16 : 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: isMobile ? 16 : 0,
  },
  
  // Footer Styles
  footerContainer: {
    backgroundColor: '#111827',
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
    marginBottom: isMobile ? 24 : 0,
    marginRight: isMobile ? 0 : 32,
  },
  footerSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  footerLink: {
    paddingVertical: 6,
  },
  footerLinkText: {
    fontSize: 15,
    color: '#9ca3af',
  },
  footerBottom: {
    paddingTop: isMobile ? 24 : 32,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    alignItems: 'center',
  },
  footerCopyright: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Mobile Menu Styles
  mobileMenuButton: {
    padding: 8,
  },
  hamburgerIcon: {
    fontSize: 24,
    color: '#374151',
  },
  mobileMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  mobileMenuContent: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginTop: 60,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  mobileMenuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  mobileMenuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  mobileSignupButton: {
    backgroundColor: '#000000',
    borderRadius: 6,
    marginTop: 8,
    borderBottomWidth: 0,
  },
  mobileSignupText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default SimpleHomepage;