import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { loadFonts } from './src/config/fonts';
import pushNotificationService from './src/services/PushNotificationService';
import offlineDocumentService from './src/services/OfflineDocumentService';
import backendAPI from './src/services/BackendAPIService';
import { getColor } from './src/styles/designSystem';
// Testing automatic deployment workflow

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [backendStatus, setBackendStatus] = useState('connecting');

  useEffect(() => {
    // Initialize app with fonts and services
    const initializeApp = async () => {
      console.log('🚀 Initializing Bvester...');
      
      try {
        // Load custom fonts (optional for web)
        console.log('📝 Loading fonts...');
        try {
          const fontsSuccess = await loadFonts();
          setFontsLoaded(fontsSuccess);
        } catch (error) {
          console.warn('Font loading failed, continuing without custom fonts:', error);
          setFontsLoaded(true);
        }
        
        // Test backend connection
        console.log('🌐 Testing backend connection...');
        try {
          const connectionTest = await backendAPI.testConnection();
          if (connectionTest.connected) {
            console.log('✅ Backend connected successfully');
            setBackendStatus('connected');
          } else {
            console.warn('⚠️ Backend connection failed, using demo mode');
            setBackendStatus('demo');
          }
        } catch (error) {
          console.warn('❌ Backend connection error:', error);
          setBackendStatus('offline');
        }

        // Initialize services (skip on web if they fail)
        try {
          console.log('🔔 Initializing services...');
          await pushNotificationService.initialize();
          await offlineDocumentService.initialize();
        } catch (error) {
          console.warn('Service initialization failed, continuing:', error);
        }
        
        console.log('✅ App initialized successfully');
        setAppReady(true);
      } catch (error) {
        console.error('❌ App initialization error:', error);
        // Always continue with app startup
        setFontsLoaded(true);
        setAppReady(true);
      }
    };

    initializeApp();

    // Cleanup function
    return () => {
      try {
        pushNotificationService.cleanup();
      } catch (error) {
        console.warn('Service cleanup failed:', error);
      }
    };
  }, []);

  // Show loading screen while app initializes
  if (!appReady) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: getColor('primary.50'),
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <ActivityIndicator 
          size="large" 
          color={getColor('primary.500')} 
        />
        <Text style={{
          marginTop: 20,
          fontSize: 16,
          color: getColor('gray.600'),
          fontWeight: '600'
        }}>
          Loading Bvester...
        </Text>
        <Text style={{
          marginTop: 8,
          fontSize: 14,
          color: getColor('gray.500'),
          textAlign: 'center'
        }}>
          {fontsLoaded ? '✅ Premium fonts loaded' : '⏳ Loading fonts...'}
        </Text>
        <Text style={{
          marginTop: 4,
          fontSize: 14,
          color: getColor('gray.500'),
          textAlign: 'center'
        }}>
          {backendStatus === 'connecting' && '🌐 Connecting to backend...'}
          {backendStatus === 'connected' && '✅ Backend connected'}
          {backendStatus === 'demo' && '⚠️ Demo mode active'}
          {backendStatus === 'offline' && '❌ Backend offline'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <NavigationContainer>
              <AppNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}