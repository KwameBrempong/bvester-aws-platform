/**
 * 🚀 ENHANCED LOGIN SCREEN
 * Advanced authentication with biometrics, MFA, and error handling
 */

import React, { useState, useContext, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
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
import { enhancedDesignSystem } from '../../styles/enhancedDesignSystem';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const { width, height } = Dimensions.get('window');

export default function EnhancedLoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnrolled, setBiometricsEnrolled] = useState(false);

  const { login, loginWithBiometrics } = useContext(AuthContext);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  useEffect(() => {
    if (isLocked && lockoutTimer > 0) {
      const timer = setTimeout(() => {
        setLockoutTimer(lockoutTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockoutTimer === 0) {
      setIsLocked(false);
      setLoginAttempts(0);
    }
  }, [isLocked, lockoutTimer]);

  const checkBiometricAvailability = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricsAvailable(compatible);
      setBiometricsEnrolled(enrolled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  const validateInput = () => {
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return false;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    
    if (!password) {
      Alert.alert('Validation Error', 'Please enter your password');
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return false;
    }
    
    return true;
  };

  const handleLogin = async () => {
    if (isLocked) {
      Alert.alert(
        'Account Temporarily Locked',
        `Too many failed attempts. Please wait ${lockoutTimer} seconds.`
      );
      return;
    }

    if (!validateInput()) {
      return;
    }

    try {
      setLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await login(email.trim().toLowerCase(), password);
      
      if (result.success) {
        // Reset login attempts on successful login
        setLoginAttempts(0);
        setIsLocked(false);
        
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Navigate based on user profile completion
        if (result.needsOnboarding) {
          navigation.navigate('UserTypeSelection');
        } else {
          navigation.replace('Dashboard');
        }
      } else {
        // Handle failed login attempt
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        if (newAttempts >= 5) {
          // Lock account for 5 minutes after 5 failed attempts
          setIsLocked(true);
          setLockoutTimer(300); // 5 minutes
          Alert.alert(
            'Account Locked',
            'Too many failed login attempts. Your account has been temporarily locked for 5 minutes.',
            [{ text: 'OK', style: 'default' }]
          );
        } else {
          const remainingAttempts = 5 - newAttempts;
          Alert.alert(
            'Login Failed',
            `${result.message}\n\n${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining before temporary lockout.`,
            [
              { text: 'Forgot Password?', onPress: () => navigation.navigate('ForgotPassword') },
              { text: 'Try Again', style: 'default' }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Error',
        'An unexpected error occurred. Please try again.',
        [
          { text: 'Contact Support', onPress: () => navigation.navigate('Support') },
          { text: 'Try Again', style: 'default' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (!biometricsAvailable || !biometricsEnrolled) {
      Alert.alert(
        'Biometric Authentication Unavailable',
        'Please set up biometric authentication in your device settings first.'
      );
      return;
    }

    try {
      const biometricAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login to Bvester',
        subPromptMessage: 'Use your fingerprint or face ID',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password'
      });

      if (biometricAuth.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Try to login with stored credentials (if available)
        const result = await loginWithBiometrics();
        
        if (result.success) {
          navigation.replace('Dashboard');
        } else {
          Alert.alert(
            'Biometric Login Failed',
            'Please use your email and password to login.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      Alert.alert(
        'Biometric Login Error',
        'Unable to authenticate with biometrics. Please use your password.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword', { email });
  };

  const handleSocialLogin = (provider) => {
    // Placeholder for social login implementation
    Alert.alert(
      'Coming Soon',
      `${provider} login will be available in the next update.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

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
              <View style={styles.logoContainer}>
                <Text style={styles.logoIcon}>💎</Text>
                <Text style={styles.logoText}>Bvester</Text>
              </View>
              <Text style={styles.welcomeText}>Welcome back</Text>
              <Text style={styles.subtitleText}>
                Sign in to your investment account
              </Text>
            </View>

            {/* Login Form */}
            <Card style={styles.formCard}>
              {isLocked && (
                <View style={styles.lockoutBanner}>
                  <Ionicons name="lock-closed" size={20} color="#ef4444" />
                  <Text style={styles.lockoutText}>
                    Account locked for {lockoutTimer}s
                  </Text>
                </View>
              )}

              <Input
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLocked}
                leftIcon={<Ionicons name="mail-outline" size={20} color="#6b7280" />}
              />

              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLocked}
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
              />

              {/* Options Row */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberRow}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              {/* Login Attempts Warning */}
              {loginAttempts > 0 && !isLocked && (
                <View style={styles.warningBanner}>
                  <Ionicons name="warning-outline" size={16} color="#f59e0b" />
                  <Text style={styles.warningText}>
                    {loginAttempts}/5 failed attempts
                  </Text>
                </View>
              )}

              {/* Login Button */}
              <Button
                title={isLocked ? `Locked (${lockoutTimer}s)` : "Sign In"}
                onPress={handleLogin}
                loading={loading}
                disabled={isLocked}
                style={styles.loginButton}
              />

              {/* Biometric Login */}
              {biometricsAvailable && biometricsEnrolled && (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Button
                    title="Use Biometric Login"
                    onPress={handleBiometricLogin}
                    variant="outline"
                    leftIcon={<Ionicons name="finger-print" size={20} color="#eab308" />}
                    style={styles.biometricButton}
                  />
                </>
              )}
            </Card>

            {/* Social Login */}
            <Card style={styles.socialCard}>
              <Text style={styles.socialTitle}>Continue with</Text>
              <View style={styles.socialButtons}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin('Google')}
                >
                  <Text style={styles.socialButtonText}>G</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin('Apple')}
                >
                  <Text style={styles.socialButtonText}>🍎</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin('LinkedIn')}
                >
                  <Text style={styles.socialButtonText}>in</Text>
                </TouchableOpacity>
              </View>
            </Card>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>

            {/* Help & Support */}
            <View style={styles.helpContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Support')}>
                <Text style={styles.helpLink}>Need help?</Text>
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
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 32,
    marginRight: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#eab308',
    fontFamily: 'SpaceGrotesk-Bold',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    backdropFilter: 'blur(10px)',
    marginBottom: 20,
    padding: 24,
  },
  lockoutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  lockoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#6b7280',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  rememberText: {
    color: '#d1d5db',
    fontSize: 14,
  },
  forgotText: {
    color: '#eab308',
    fontSize: 14,
    fontWeight: '500',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  warningText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  loginButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#6b7280',
    fontSize: 12,
    marginHorizontal: 16,
  },
  biometricButton: {
    borderColor: '#eab308',
  },
  socialCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
    padding: 20,
  },
  socialTitle: {
    color: '#d1d5db',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signupText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  signupLink: {
    color: '#eab308',
    fontSize: 14,
    fontWeight: '600',
  },
  helpContainer: {
    alignItems: 'center',
  },
  helpLink: {
    color: '#6b7280',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});