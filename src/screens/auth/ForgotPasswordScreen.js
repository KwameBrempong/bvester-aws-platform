/**
 * 🔐 FORGOT PASSWORD SCREEN
 * Secure password reset with email verification and clear instructions
 */

import React, { useState, useContext, useRef } from 'react';
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
  Dimensions,
  Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen({ navigation, route }) {
  const [email, setEmail] = useState(route.params?.email || '');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [validationError, setValidationError] = useState('');

  const { resetPassword } = useContext(AuthContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    // Animation on mount
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
      })
    ]).start();
  }, []);

  React.useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    setValidationError('');

    if (!email.trim()) {
      setValidationError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await resetPassword(email.trim().toLowerCase());

      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setEmailSent(true);
        setCountdown(60); // 1 minute cooldown
        
        // Animate success state
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.5,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start();
        
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setValidationError(result.message || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setValidationError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0) return;
    
    await handleResetPassword();
  };

  const handleBackToLogin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Login', { email: email });
  };

  const renderInitialForm = () => (
    <Card style={styles.formCard}>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed" size={32} color="#eab308" />
        </View>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Forgot your password?</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a secure link to reset your password.
        </Text>
      </View>

      <Input
        label="Email Address"
        placeholder="Enter your email address"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setValidationError('');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        leftIcon={<Ionicons name="mail-outline" size={20} color="#6b7280" />}
        error={validationError}
        style={styles.input}
      />

      <Button
        title="Send Reset Link"
        onPress={handleResetPassword}
        loading={loading}
        disabled={loading}
        style={styles.resetButton}
        leftIcon={<Ionicons name="send" size={20} color="#fff" />}
      />

      <View style={styles.helpSection}>
        <View style={styles.helpItem}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.helpText}>
            Check your email (including spam folder)
          </Text>
        </View>
        <View style={styles.helpItem}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.helpText}>
            Link expires in 1 hour for security
          </Text>
        </View>
        <View style={styles.helpItem}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.helpText}>
            Create a strong new password
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderSuccessMessage = () => (
    <Card style={styles.successCard}>
      <Animated.View 
        style={[
          styles.successContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.successIconContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={40} color="#fff" />
          </View>
        </View>

        <Text style={styles.successTitle}>Check your email!</Text>
        <Text style={styles.successSubtitle}>
          We've sent a password reset link to:
        </Text>
        <Text style={styles.emailAddress}>{email}</Text>

        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>Next steps:</Text>
          
          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>1</Text>
            </View>
            <Text style={styles.instructionText}>
              Check your email inbox (and spam folder)
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <Text style={styles.instructionText}>
              Click the secure reset link in the email
            </Text>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>3</Text>
            </View>
            <Text style={styles.instructionText}>
              Create a new strong password
            </Text>
          </View>
        </View>

        <View style={styles.resendSection}>
          <Text style={styles.resendText}>Didn't receive the email?</Text>
          
          <Button
            title={countdown > 0 ? `Resend in ${countdown}s` : "Resend Email"}
            onPress={handleResendEmail}
            disabled={countdown > 0 || loading}
            variant="outline"
            style={styles.resendButton}
            leftIcon={countdown === 0 ? <Ionicons name="refresh" size={16} color="#eab308" /> : null}
          />
        </View>

        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={16} color="#6b7280" />
          <Text style={styles.securityText}>
            This link will expire in 1 hour for your security
          </Text>
        </View>
      </Animated.View>
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
            <View style={styles.screenHeader}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <Text style={styles.logoIcon}>💎</Text>
                <Text style={styles.logoText}>Bvester</Text>
              </View>
            </View>

            {/* Main Content */}
            <Animated.View
              style={[
                styles.mainContent,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              {emailSent ? renderSuccessMessage() : renderInitialForm()}
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.backToLoginButton}
                onPress={handleBackToLogin}
              >
                <Ionicons name="arrow-back" size={16} color="#eab308" />
                <Text style={styles.backToLoginText}>Back to Login</Text>
              </TouchableOpacity>

              {!emailSent && (
                <View style={styles.supportSection}>
                  <Text style={styles.supportText}>Need help? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Support')}>
                    <Text style={styles.supportLink}>Contact Support</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#eab308',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    padding: 32,
    marginBottom: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
  },
  input: {
    marginBottom: 24,
  },
  resetButton: {
    marginBottom: 32,
  },
  helpSection: {
    space: 12,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpText: {
    color: '#d1d5db',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  successCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 32,
    marginBottom: 20,
  },
  successContent: {
    alignItems: 'center',
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 8,
  },
  emailAddress: {
    fontSize: 16,
    color: '#eab308',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
  },
  instructionsSection: {
    width: '100%',
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eab308',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  instructionText: {
    color: '#d1d5db',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  resendText: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 16,
  },
  resendButton: {
    width: '100%',
    borderColor: '#eab308',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  securityText: {
    color: '#9ca3af',
    fontSize: 12,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
  },
  backToLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backToLoginText: {
    color: '#eab308',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  supportSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  supportText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  supportLink: {
    color: '#eab308',
    fontSize: 14,
    fontWeight: '500',
  },
});