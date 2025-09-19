/**
 * 🚀 BACKEND TEST SCREEN
 * Test interface for validating backend integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import backendAPI from '../../services/BackendAPIService';
import { getColor } from '../../styles/designSystem';

const BackendTestScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [backendInfo, setBackendInfo] = useState(null);

  useEffect(() => {
    runInitialTests();
  }, []);

  const runInitialTests = async () => {
    console.log('🧪 Running initial backend tests...');
    await testBackendHealth();
    await testBackendInfo();
  };

  const testBackendHealth = async () => {
    setIsLoading(true);
    try {
      const result = await backendAPI.getHealth();
      setTestResults(prev => ({
        ...prev,
        health: result
      }));
      console.log('Health test result:', result);
    } catch (error) {
      console.error('Health test failed:', error);
    }
    setIsLoading(false);
  };

  const testBackendInfo = async () => {
    try {
      const result = await backendAPI.getInfo();
      setTestResults(prev => ({
        ...prev,
        info: result
      }));
      if (result.success) {
        setBackendInfo(result.data);
      }
      console.log('Info test result:', result);
    } catch (error) {
      console.error('Info test failed:', error);
    }
  };

  const testAuthentication = async () => {
    setIsLoading(true);
    try {
      console.log('🔐 Testing authentication...');
      
      // Test demo login
      const loginResult = await backendAPI.loginDemo();
      setTestResults(prev => ({
        ...prev,
        auth: loginResult
      }));
      
      if (loginResult.success) {
        Alert.alert('Success', 'Demo login successful!');
      } else {
        Alert.alert('Error', loginResult.error || 'Login failed');
      }
      
      console.log('Auth test result:', loginResult);
    } catch (error) {
      console.error('Auth test failed:', error);
      Alert.alert('Error', 'Authentication test failed');
    }
    setIsLoading(false);
  };

  const testBusinessListings = async () => {
    setIsLoading(true);
    try {
      console.log('🏢 Testing business listings...');
      
      const result = await backendAPI.getBusinesses();
      setTestResults(prev => ({
        ...prev,
        businesses: result
      }));
      
      if (result.success) {
        Alert.alert(
          'Success', 
          `Found ${result.data.businesses?.length || 0} businesses`
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to load businesses');
      }
      
      console.log('Business test result:', result);
    } catch (error) {
      console.error('Business test failed:', error);
      Alert.alert('Error', 'Business listings test failed');
    }
    setIsLoading(false);
  };

  const testPaymentMethods = async () => {
    setIsLoading(true);
    try {
      console.log('💳 Testing payment methods...');
      
      const result = await backendAPI.getSupportedPaymentMethods();
      setTestResults(prev => ({
        ...prev,
        payments: result
      }));
      
      if (result.success) {
        const methods = result.data.methods;
        const stripe = methods?.stripe?.available ? '✅' : '❌';
        const flutterwave = methods?.flutterwave?.available ? '✅' : '❌';
        Alert.alert(
          'Payment Methods', 
          `Stripe: ${stripe}\nFlutterwave: ${flutterwave}`
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to load payment methods');
      }
      
      console.log('Payment test result:', result);
    } catch (error) {
      console.error('Payment test failed:', error);
      Alert.alert('Error', 'Payment methods test failed');
    }
    setIsLoading(false);
  };

  const testAIRecommendations = async () => {
    setIsLoading(true);
    try {
      console.log('🤖 Testing AI recommendations...');
      
      const result = await backendAPI.getBusinessRecommendations('demo_user_123');
      setTestResults(prev => ({
        ...prev,
        ai: result
      }));
      
      if (result.success) {
        Alert.alert(
          'AI Recommendations', 
          `Found ${result.data.recommendations?.length || 0} recommendations`
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to get recommendations');
      }
      
      console.log('AI test result:', result);
    } catch (error) {
      console.error('AI test failed:', error);
      Alert.alert('Error', 'AI recommendations test failed');
    }
    setIsLoading(false);
  };

  const testESGScoring = async () => {
    setIsLoading(true);
    try {
      console.log('🌱 Testing ESG scoring...');
      
      const result = await backendAPI.getESGScore('biz_001');
      setTestResults(prev => ({
        ...prev,
        esg: result
      }));
      
      if (result.success) {
        const score = result.data.esgScore?.overall || 'N/A';
        Alert.alert('ESG Score', `Overall Score: ${score}/10`);
      } else {
        Alert.alert('Error', result.error || 'Failed to get ESG score');
      }
      
      console.log('ESG test result:', result);
    } catch (error) {
      console.error('ESG test failed:', error);
      Alert.alert('Error', 'ESG scoring test failed');
    }
    setIsLoading(false);
  };

  const TestButton = ({ title, onPress, emoji }) => (
    <TouchableOpacity 
      style={styles.testButton} 
      onPress={onPress}
      disabled={isLoading}
    >
      <Text style={styles.testButtonText}>
        {emoji} {title}
      </Text>
    </TouchableOpacity>
  );

  const ResultItem = ({ title, result, emoji }) => (
    <View style={styles.resultItem}>
      <Text style={styles.resultTitle}>
        {emoji} {title}
      </Text>
      <Text style={[
        styles.resultStatus,
        { color: result?.success ? getColor('green.600') : getColor('red.600') }
      ]}>
        {result?.success ? '✅ Success' : '❌ Failed'}
      </Text>
      {result?.data && (
        <Text style={styles.resultData} numberOfLines={3}>
          {JSON.stringify(result.data, null, 2).substring(0, 200)}...
        </Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚀 Backend API Tests</Text>
        <Text style={styles.subtitle}>
          Test all Bvester backend endpoints
        </Text>
        
        {backendInfo && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Backend Info</Text>
            <Text style={styles.infoText}>
              📱 {backendInfo.name} v{backendInfo.version}
            </Text>
            <Text style={styles.infoText}>
              🔌 {backendInfo.endpoints} endpoints available
            </Text>
            <Text style={styles.infoText}>
              🌍 Markets: {backendInfo.markets_supported?.join(', ')}
            </Text>
            {backendInfo.demo_mode && (
              <Text style={styles.demoMode}>⚠️ Demo Mode Active</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Tests</Text>
        
        <TestButton
          title="Health Check"
          emoji="🏥"
          onPress={testBackendHealth}
        />
        
        <TestButton
          title="Authentication"
          emoji="🔐"
          onPress={testAuthentication}
        />
        
        <TestButton
          title="Business Listings"
          emoji="🏢"
          onPress={testBusinessListings}
        />
        
        <TestButton
          title="Payment Methods"
          emoji="💳"
          onPress={testPaymentMethods}
        />
        
        <TestButton
          title="AI Recommendations"
          emoji="🤖"
          onPress={testAIRecommendations}
        />
        
        <TestButton
          title="ESG Scoring"
          emoji="🌱"
          onPress={testESGScoring}
        />
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={getColor('primary.500')} />
          <Text style={styles.loadingText}>Testing...</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        
        <ResultItem
          title="Health Check"
          result={testResults.health}
          emoji="🏥"
        />
        
        <ResultItem
          title="Backend Info"
          result={testResults.info}
          emoji="ℹ️"
        />
        
        <ResultItem
          title="Authentication"
          result={testResults.auth}
          emoji="🔐"
        />
        
        <ResultItem
          title="Business Listings"
          result={testResults.businesses}
          emoji="🏢"
        />
        
        <ResultItem
          title="Payment Methods"
          result={testResults.payments}
          emoji="💳"
        />
        
        <ResultItem
          title="AI Recommendations"
          result={testResults.ai}
          emoji="🤖"
        />
        
        <ResultItem
          title="ESG Scoring"
          result={testResults.esg}
          emoji="🌱"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: getColor('gray.50'),
  },
  header: {
    padding: 20,
    backgroundColor: getColor('white'),
    borderBottomWidth: 1,
    borderBottomColor: getColor('gray.200'),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: getColor('gray.900'),
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: getColor('gray.600'),
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: getColor('blue.50'),
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: getColor('blue.200'),
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: getColor('blue.900'),
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: getColor('blue.800'),
    marginBottom: 4,
  },
  demoMode: {
    fontSize: 14,
    fontWeight: '600',
    color: getColor('orange.600'),
    marginTop: 8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: getColor('gray.900'),
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: getColor('primary.500'),
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: getColor('white'),
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: getColor('gray.600'),
  },
  resultItem: {
    backgroundColor: getColor('white'),
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: getColor('gray.200'),
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: getColor('gray.900'),
    marginBottom: 8,
  },
  resultStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultData: {
    fontSize: 12,
    color: getColor('gray.600'),
    fontFamily: 'monospace',
    backgroundColor: getColor('gray.100'),
    padding: 8,
    borderRadius: 6,
  },
});

export default BackendTestScreen;