/**
 * 🚀 ENHANCED REGISTRATION SCREEN
 * Comprehensive registration with validation, terms acceptance, and role selection
 */

import React, { useState, useContext, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const { width, height } = Dimensions.get('window');

const COUNTRIES = [
  'Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Egypt', 
  'Morocco', 'Tunisia', 'Ethiopia', 'Uganda', 'Rwanda',
  'Tanzania', 'Zambia', 'Botswana', 'Senegal', 'Ivory Coast'
];

export default function EnhancedRegisterScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: '', // 'INVESTOR' or 'SME_OWNER'
    businessName: '',
    country: 'Nigeria',
    phoneNumber: '',
    agreeToTerms: false,
    subscribeToNewsletter: true
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  const { register } = useContext(AuthContext);

  useEffect(() => {
    if (formData.password) {
      calculatePasswordStrength(formData.password);
    }
  }, [formData.password]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 25;
    
    // Character variety checks
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^A-Za-z0-9]/.test(password)) strength += 12.5;
    
    setPasswordStrength(Math.min(strength, 100));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return '#ef4444';
    if (passwordStrength < 50) return '#f59e0b';
    if (passwordStrength < 75) return '#eab308';
    return '#10b981';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const validateStep = (stepNumber) => {
    const errors = {};

    switch (stepNumber) {
      case 1:
        if (!formData.email.trim()) {
          errors.email = 'Email is required';
        } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
          errors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
          errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
          errors.password = 'Password must be at least 8 characters';
        } else if (passwordStrength < 50) {
          errors.password = 'Please choose a stronger password';
        }

        if (!formData.confirmPassword) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
        break;

      case 2:
        if (!formData.name.trim()) {
          errors.name = 'Full name is required';
        } else if (formData.name.trim().length < 2) {
          errors.name = 'Name must be at least 2 characters';
        }

        if (!formData.role) {
          errors.role = 'Please select your role';
        }

        if (formData.role === 'SME_OWNER' && !formData.businessName.trim()) {
          errors.businessName = 'Business name is required for SME owners';
        }

        if (!formData.phoneNumber.trim()) {
          errors.phoneNumber = 'Phone number is required';
        } else if (formData.phoneNumber.replace(/\D/g, '').length < 10) {
          errors.phoneNumber = 'Please enter a valid phone number';
        }
        break;

      case 3:
        if (!formData.agreeToTerms) {
          errors.agreeToTerms = 'You must agree to the terms and conditions';
        }
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (validateStep(step)) {
      if (step < 3) {
        setStep(step + 1);
      } else {
        await handleRegister();
      }
    }
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleRegister = async () => {
    if (!validateStep(3)) {
      return;
    }

    try {
      setLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const result = await register(
        formData.email.trim().toLowerCase(),
        formData.password,
        formData.name.trim(),
        formData.role,
        formData.businessName.trim() || null,
        formData.country
      );

      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        Alert.alert(
          'Registration Successful!',
          `Welcome to Bvester, ${formData.name}! Your account has been created successfully.`,
          [
            {
              text: 'Get Started',
              onPress: () => navigation.replace('Dashboard')
            }
          ]
        );
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        Alert.alert(
          'Registration Failed',
          result.message || 'An error occurred during registration. Please try again.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Registration Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = async (role) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData({ ...formData, role });
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((stepNumber) => (
        <View key={stepNumber} style={styles.stepContainer}>
          <View style={[
            styles.stepCircle,
            {
              backgroundColor: stepNumber <= step ? '#eab308' : 'rgba(255, 255, 255, 0.3)',
              borderColor: stepNumber <= step ? '#eab308' : 'rgba(255, 255, 255, 0.5)'
            }
          ]}>
            {stepNumber < step ? (
              <Ionicons name="checkmark" size={16} color="#fff" />
            ) : (
              <Text style={[styles.stepNumber, { color: stepNumber <= step ? '#fff' : '#9ca3af' }]}>
                {stepNumber}
              </Text>
            )}
          </View>
          {stepNumber < 3 && (
            <View style={[
              styles.stepLine,
              { backgroundColor: stepNumber < step ? '#eab308' : 'rgba(255, 255, 255, 0.3)' }
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <Card style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Create Your Account</Text>
        <Text style={styles.stepSubtitle}>
          Enter your email and create a secure password
        </Text>
      </View>

      <Input
        label="Email Address"
        placeholder="Enter your email"
        value={formData.email}
        onChangeText={(email) => setFormData({ ...formData, email })}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        leftIcon={<Ionicons name="mail-outline" size={20} color="#6b7280" />}
        error={validationErrors.email}
        style={styles.input}
      />

      <Input
        label="Password"
        placeholder="Create a strong password"
        value={formData.password}
        onChangeText={(password) => setFormData({ ...formData, password })}
        secureTextEntry={!showPassword}
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#6b7280" />}
        rightIcon={
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color="#6b7280" 
            />
          </TouchableOpacity>
        }
        error={validationErrors.password}
        style={styles.input}
      />

      {formData.password && (
        <View style={styles.passwordStrength}>
          <View style={styles.strengthBar}>
            <View
              style={[
                styles.strengthFill,
                {
                  width: `${passwordStrength}%`,
                  backgroundColor: getPasswordStrengthColor()
                }
              ]}
            />
          </View>
          <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
            Password Strength: {getPasswordStrengthText()}
          </Text>
        </View>
      )}

      <Input
        label="Confirm Password"
        placeholder="Confirm your password"
        value={formData.confirmPassword}
        onChangeText={(confirmPassword) => setFormData({ ...formData, confirmPassword })}
        secureTextEntry={!showConfirmPassword}
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#6b7280" />}
        rightIcon={
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
            <Ionicons 
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
              size={20} 
              color="#6b7280" 
            />
          </TouchableOpacity>
        }
        error={validationErrors.confirmPassword}
        style={styles.input}
      />
    </Card>
  );

  const renderStep2 = () => (
    <Card style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Personal Information</Text>
        <Text style={styles.stepSubtitle}>
          Tell us about yourself and your role
        </Text>
      </View>

      <Input
        label="Full Name"
        placeholder="Enter your full name"
        value={formData.name}
        onChangeText={(name) => setFormData({ ...formData, name })}
        leftIcon={<Ionicons name="person-outline" size={20} color="#6b7280" />}
        error={validationErrors.name}
        style={styles.input}
      />

      <View style={styles.roleSelection}>
        <Text style={styles.roleLabel}>I am a:</Text>
        {validationErrors.role && (
          <Text style={styles.errorText}>{validationErrors.role}</Text>
        )}
        
        <TouchableOpacity
          style={[
            styles.roleOption,
            formData.role === 'INVESTOR' && styles.roleOptionSelected
          ]}
          onPress={() => handleRoleSelection('INVESTOR')}
        >
          <View style={styles.roleContent}>
            <Ionicons 
              name="trending-up" 
              size={24} 
              color={formData.role === 'INVESTOR' ? '#eab308' : '#9ca3af'} 
            />
            <View style={styles.roleText}>
              <Text style={[
                styles.roleTitle,
                formData.role === 'INVESTOR' && styles.roleTitleSelected
              ]}>
                Investor
              </Text>
              <Text style={styles.roleDescription}>
                I want to invest in African SMEs
              </Text>
            </View>
          </View>
          {formData.role === 'INVESTOR' && (
            <Ionicons name="checkmark-circle" size={24} color="#eab308" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleOption,
            formData.role === 'SME_OWNER' && styles.roleOptionSelected
          ]}
          onPress={() => handleRoleSelection('SME_OWNER')}
        >
          <View style={styles.roleContent}>
            <Ionicons 
              name="business" 
              size={24} 
              color={formData.role === 'SME_OWNER' ? '#eab308' : '#9ca3af'} 
            />
            <View style={styles.roleText}>
              <Text style={[
                styles.roleTitle,
                formData.role === 'SME_OWNER' && styles.roleTitleSelected
              ]}>
                Business Owner (SME)
              </Text>
              <Text style={styles.roleDescription}>
                I own/manage a business seeking investment
              </Text>
            </View>
          </View>
          {formData.role === 'SME_OWNER' && (
            <Ionicons name="checkmark-circle" size={24} color="#eab308" />
          )}
        </TouchableOpacity>
      </View>

      {formData.role === 'SME_OWNER' && (
        <Input
          label="Business Name"
          placeholder="Enter your business name"
          value={formData.businessName}
          onChangeText={(businessName) => setFormData({ ...formData, businessName })}
          leftIcon={<Ionicons name="storefront-outline" size={20} color="#6b7280" />}
          error={validationErrors.businessName}
          style={styles.input}
        />
      )}

      <Input
        label="Phone Number"
        placeholder="Enter your phone number"
        value={formData.phoneNumber}
        onChangeText={(phoneNumber) => setFormData({ ...formData, phoneNumber })}
        keyboardType="phone-pad"
        leftIcon={<Ionicons name="call-outline" size={20} color="#6b7280" />}
        error={validationErrors.phoneNumber}
        style={styles.input}
      />

      <View style={styles.countrySelector}>
        <Text style={styles.inputLabel}>Country</Text>
        <TouchableOpacity style={styles.countryButton}>
          <Ionicons name="location-outline" size={20} color="#6b7280" />
          <Text style={styles.countryText}>{formData.country}</Text>
          <Ionicons name="chevron-down" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderStep3 = () => (
    <Card style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Terms & Preferences</Text>
        <Text style={styles.stepSubtitle}>
          Review and accept our terms to complete registration
        </Text>
      </View>

      <View style={styles.termsSection}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setFormData({ ...formData, agreeToTerms: !formData.agreeToTerms })}
        >
          <View style={[styles.checkbox, formData.agreeToTerms && styles.checkboxChecked]}>
            {formData.agreeToTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <View style={styles.checkboxText}>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
            {validationErrors.agreeToTerms && (
              <Text style={styles.errorText}>{validationErrors.agreeToTerms}</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setFormData({ ...formData, subscribeToNewsletter: !formData.subscribeToNewsletter })}
        >
          <View style={[styles.checkbox, formData.subscribeToNewsletter && styles.checkboxChecked]}>
            {formData.subscribeToNewsletter && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.termsText}>
            Subscribe to our newsletter for investment insights and updates
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Registration Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Email:</Text>
          <Text style={styles.summaryValue}>{formData.email}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Name:</Text>
          <Text style={styles.summaryValue}>{formData.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Role:</Text>
          <Text style={styles.summaryValue}>
            {formData.role === 'INVESTOR' ? 'Investor' : 'Business Owner'}
          </Text>
        </View>
        {formData.businessName && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Business:</Text>
            <Text style={styles.summaryValue}>{formData.businessName}</Text>
          </View>
        )}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Country:</Text>
          <Text style={styles.summaryValue}>{formData.country}</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <LinearGradient
        colors={['#000000', '#1a1a1a', '#2a1810']}
        style={styles.background}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <Text style={styles.logoIcon}>💎</Text>
                <Text style={styles.logoText}>Bvester</Text>
              </View>
              
              <Text style={styles.headerTitle}>Create Account</Text>
              <Text style={styles.headerSubtitle}>
                Join the future of African investment
              </Text>
            </View>

            {/* Step Indicator */}
            {renderStepIndicator()}

            {/* Form Content */}
            <View style={styles.formContainer}>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                title={step === 3 ? "Create Account" : "Continue"}
                onPress={handleNext}
                loading={loading}
                style={styles.continueButton}
                leftIcon={step === 3 ? <Ionicons name="checkmark-circle" size={20} color="#fff" /> : null}
              />
            </View>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 28,
    marginRight: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#eab308',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  formContainer: {
    marginBottom: 20,
  },
  stepCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    padding: 24,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  passwordStrength: {
    marginBottom: 16,
  },
  strengthBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: 8,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  roleSelection: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  roleOptionSelected: {
    borderColor: '#eab308',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
  },
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleText: {
    marginLeft: 12,
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d1d5db',
    marginBottom: 4,
  },
  roleTitleSelected: {
    color: '#fff',
  },
  roleDescription: {
    fontSize: 12,
    color: '#9ca3af',
  },
  countrySelector: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginBottom: 8,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  countryText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#fff',
  },
  termsSection: {
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#6b7280',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  checkboxText: {
    flex: 1,
  },
  termsText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  termsLink: {
    color: '#eab308',
    fontWeight: '500',
  },
  summarySection: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  summaryValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  continueButton: {
    marginTop: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  loginLink: {
    color: '#eab308',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
});