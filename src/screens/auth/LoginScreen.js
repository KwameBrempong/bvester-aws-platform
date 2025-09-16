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
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { 
  Card, 
  Button, 
  Input, 
  getColor, 
  getEnhancedColor,
  getSpacing,
  getFontSize,
  getFont,
  getBorderRadius,
  useTheme,
  responsive 
} from '../../components/ui';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useContext(AuthContext);
  const { colors, isDark } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
    // Success is handled automatically by the AuthContext
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent 
      />
      
      <LinearGradient 
        colors={colors.gradients?.primary || getEnhancedColor('primary.500')}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView 
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header with Logo */}
              <View style={styles.header}>
                <Button
                  variant="ghost"
                  icon="arrow-back"
                  onPress={() => navigation.goBack()}
                  style={styles.backButton}
                />
                
                <View style={styles.logoSection}>
                  <View style={[styles.logoContainer, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <Text style={styles.logoEmoji}>💎</Text>
                  </View>
                  <Text style={[styles.brandName, { 
                    fontFamily: getFont('bold'),
                    fontSize: getFontSize('3xl')
                  }]}>Bvester</Text>
                  <Text style={[styles.tagline, {
                    fontFamily: getFont('medium'),
                    fontSize: getFontSize('base')
                  }]}>
                    African Innovation Meets Global Investment
                  </Text>
                </View>
              </View>

              {/* Form Section */}
              <View style={styles.formSection}>
                <Card 
                  variant="elevated" 
                  style={[styles.formCard, { 
                    backgroundColor: colors.surface,
                    borderRadius: getBorderRadius('xl')
                  }]}
                >
                  <View style={styles.formHeader}>
                    <Text style={[styles.welcomeTitle, {
                      color: colors.text,
                      fontFamily: getFont('bold'),
                      fontSize: getFontSize('2xl')
                    }]}>Welcome Back</Text>
                    <Text style={[styles.welcomeSubtitle, {
                      color: colors.textSecondary,
                      fontFamily: getFont('regular'),
                      fontSize: getFontSize('base')
                    }]}>
                      Sign in to continue your investment journey
                    </Text>
                  </View>

                  <Input
                    label="Email Address"
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    leftIcon="mail-outline"
                    style={styles.input}
                  />

                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    leftIcon="lock-closed-outline"
                    rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                    style={styles.input}
                  />

                  <Button
                    title="Sign In"
                    onPress={handleLogin}
                    loading={loading}
                    gradient="primary"
                    size="lg"
                    style={styles.loginButton}
                    hapticFeedback={true}
                  />

                  {/* Divider */}
                  <View style={styles.divider}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    <Text style={[styles.dividerText, {
                      color: colors.textSecondary,
                      fontFamily: getFont('medium')
                    }]}>or</Text>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  </View>

                  {/* Social Login Buttons */}
                  <View style={styles.socialButtons}>
                    <Button
                      title="Continue with Google"
                      variant="outline"
                      icon="logo-google"
                      style={styles.socialButton}
                      hapticFeedback={true}
                    />
                  </View>

                  {/* Register Link */}
                  <Button
                    title="Don't have an account? Sign Up"
                    variant="ghost"
                    onPress={() => navigation.navigate('Register')}
                    style={styles.registerButton}
                    textStyle={{ color: colors.primary[500] }}
                  />
                </Card>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  
  gradient: {
    flex: 1
  },
  
  safeArea: {
    flex: 1
  },
  
  keyboardAvoid: {
    flex: 1
  },
  
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: getSpacing('xl')
  },
  
  header: {
    alignItems: 'center',
    marginBottom: getSpacing('2xl')
  },
  
  backButton: {
    position: 'absolute',
    top: 0,
    left: getSpacing('md'),
    zIndex: 1
  },
  
  logoSection: {
    alignItems: 'center'
  },
  
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: getBorderRadius('full'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing('md'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  
  logoEmoji: {
    fontSize: 40
  },
  
  brandName: {
    color: 'white',
    marginBottom: getSpacing('xs'),
    textAlign: 'center',
    letterSpacing: -0.5
  },
  
  tagline: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: getFontSize('base') * 1.4
  },
  
  formSection: {
    paddingHorizontal: getSpacing('md')
  },
  
  formCard: {
    marginTop: getSpacing('lg'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12
  },
  
  formHeader: {
    alignItems: 'center',
    marginBottom: getSpacing('xl')
  },
  
  welcomeTitle: {
    marginBottom: getSpacing('xs'),
    letterSpacing: -0.3
  },
  
  welcomeSubtitle: {
    textAlign: 'center',
    lineHeight: getFontSize('base') * 1.4
  },
  
  input: {
    marginBottom: getSpacing('md')
  },
  
  loginButton: {
    marginTop: getSpacing('lg')
  },
  
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: getSpacing('xl')
  },
  
  dividerLine: {
    flex: 1,
    height: 1
  },
  
  dividerText: {
    marginHorizontal: getSpacing('md'),
    fontSize: getFontSize('sm')
  },
  
  socialButtons: {
    marginBottom: getSpacing('lg')
  },
  
  socialButton: {
    marginBottom: getSpacing('sm')
  },
  
  registerButton: {
    marginTop: getSpacing('md')
  }
});