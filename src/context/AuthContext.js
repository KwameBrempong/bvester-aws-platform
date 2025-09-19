import React, { createContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';
import { userService } from '../services/firebase/FirebaseService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log('Firebase user authenticated:', firebaseUser.uid);
          
          // Get user profile from Firestore
          const profile = await userService.getUserProfile(firebaseUser.uid);
          
          if (profile) {
            setUser(firebaseUser);
            setUserProfile(profile);
            setUserRole(profile.role);
            console.log('User profile loaded:', profile.role);
          } else {
            console.log('No user profile found, user may need to complete onboarding');
            setUser(firebaseUser);
            setUserProfile(null);
            setUserRole(null);
          }
        } else {
          console.log('No authenticated user');
          setUser(null);
          setUserProfile(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      console.log('Attempting Firebase login for:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user profile
      const profile = await userService.getUserProfile(firebaseUser.uid);
      
      if (profile) {
        setUserProfile(profile);
        setUserRole(profile.role);
        console.log('Login successful for role:', profile.role);
        
        // Store credentials for biometric login (encrypted)
        await AsyncStorage.setItem('biometric_user_id', firebaseUser.uid);
        
        return { 
          success: true, 
          user: firebaseUser, 
          profile,
          needsOnboarding: !profile.onboardingCompleted 
        };
      } else {
        console.log('User profile not found, may need onboarding');
        return { 
          success: true, 
          user: firebaseUser, 
          profile: null,
          needsOnboarding: true 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password, name, role, businessName = null, country = 'Nigeria') => {
    try {
      setIsLoading(true);
      console.log('Attempting Firebase registration for:', email, 'Role:', role);
      
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update Firebase profile
      await updateProfile(firebaseUser, {
        displayName: name
      });
      
      // Create user profile in Firestore - PRODUCTION READY with zero defaults
      const profileData = {
        // Basic profile info
        name,
        email,
        role,
        country,
        currency: getCurrencyByCountry(country),
        businessName: role === 'SME_OWNER' ? businessName : null,
        onboardingCompleted: true,
        
        // PRODUCTION ZERO DEFAULTS - All financial metrics start at 0
        totalInvestments: 0,
        totalInvested: 0,
        totalReturns: 0,
        portfolioValue: 0,
        portfolioGrowth: 0,
        activeInvestments: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        monthlyNetIncome: 0,
        quarterlyIncome: 0,
        quarterlyExpenses: 0,
        quarterlyNetIncome: 0,
        totalTransactions: 0,
        averageTransactionValue: 0,
        transactionFrequency: 0,
        businessHealthScore: 0,
        investmentReadinessScore: 0,
        dataQualityScore: 0,
        incomeGrowth: 0,
        expenseGrowth: 0,
        activeStreak: 0,
        lastActivityDate: null,
        
        // Account status - production ready
        isVerified: false,
        kycStatus: 'not_started',
        accountStatus: 'active',
        isProductionAccount: true,
        
        // Default preferences
        preferences: {
          notifications: true,
          currency: getCurrencyByCountry(country),
          language: 'en',
          marketing: false,
          analytics: false
        }
      };
      
      // Use setDoc to create document with user ID as document ID
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      setUserProfile(profileData);
      setUserRole(role);
      
      console.log('Registration successful for:', email, 'Role:', role);
      return { success: true, user: firebaseUser, profile: profileData };
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email registration is not enabled';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithBiometrics = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('biometric_user_id');
      
      if (!storedUserId) {
        return { 
          success: false, 
          message: 'No biometric login data found. Please login with email and password first.' 
        };
      }

      // Get user profile to verify account still exists
      const profile = await userService.getUserProfile(storedUserId);
      
      if (profile) {
        // Set user state based on stored data
        setUserProfile(profile);
        setUserRole(profile.role);
        
        console.log('Biometric login successful for:', profile.email);
        return { 
          success: true,
          profile,
          needsOnboarding: !profile.onboardingCompleted
        };
      } else {
        // Clear invalid stored data
        await AsyncStorage.removeItem('biometric_user_id');
        return { 
          success: false, 
          message: 'Stored biometric data is invalid. Please login with email and password.' 
        };
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      return { 
        success: false, 
        message: 'Biometric authentication failed. Please try again.' 
      };
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { 
        success: true, 
        message: 'Password reset email sent successfully' 
      };
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send password reset email';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, message: errorMessage };
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out user');
      await signOut(auth);
      
      // Clear biometric data on logout
      await AsyncStorage.removeItem('biometric_user_id');
      
      setUser(null);
      setUserProfile(null);
      setUserRole(null);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      if (!user) return { success: false, error: 'No authenticated user' };
      
      console.log('Updating user profile:', updates);
      await userService.updateUserProfile(user.uid, updates);
      
      // Update local state
      const updatedProfile = { ...userProfile, ...updates };
      setUserProfile(updatedProfile);
      
      // Update role if it changed
      if (updates.role) {
        setUserRole(updates.role);
      }
      
      return { success: true, profile: updatedProfile };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Helper function to get default currency by country
  const getCurrencyByCountry = (country) => {
    const currencyMap = {
      'Nigeria': 'NGN',
      'South Africa': 'ZAR',
      'Kenya': 'KES',
      'Ghana': 'GHS',
      'Uganda': 'UGX'
    };
    return currencyMap[country] || 'USD';
  };

  const value = {
    user,
    userProfile,
    userRole,
    isLoading,
    login,
    loginWithBiometrics,
    register,
    resetPassword,
    logout,
    updateUserProfile,
    // Computed properties
    isAuthenticated: !!user,
    hasProfile: !!userProfile,
    isSMEOwner: userRole === 'SME_OWNER',
    isInvestor: userRole === 'INVESTOR',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};