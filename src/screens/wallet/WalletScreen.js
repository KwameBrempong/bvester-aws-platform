import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import SmartWallet from '../../components/SmartWallet/SmartWallet';
import { transactionService } from '../../services/firebase/FirebaseService';

export default function WalletScreen() {
  const { user, userProfile } = useContext(AuthContext);
  const [refreshing, setRefreshing] = useState(false);

  const handleTransactionAdd = async (transactionData) => {
    try {
      console.log('Adding wallet transaction:', transactionData);
      
      // Add transaction to Firestore
      if (user) {
        await transactionService.addTransaction(user.uid, {
          ...transactionData,
          category: 'wallet_operation',
          description: `Currency conversion: ${transactionData.fromCurrency} to ${transactionData.toCurrency}`,
          date: new Date()
        });
        
        console.log('Wallet transaction saved to Firestore');
      }
    } catch (error) {
      console.error('Error saving wallet transaction:', error);
      Alert.alert('Error', 'Failed to save transaction record');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Refreshed', 'Wallet data updated');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Wallet</Text>
        <Text style={styles.subtitle}>Multi-currency portfolio management</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          refreshing ? (
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          ) : undefined
        }
      >
        <SmartWallet onTransactionAdd={handleTransactionAdd} />
        
        {/* Additional wallet features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>🚀 Coming Soon</Text>
          
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🏦</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Bank Integration</Text>
              <Text style={styles.featureDescription}>
                Connect your African bank accounts for seamless transfers
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📱</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Mobile Money</Text>
              <Text style={styles.featureDescription}>
                M-Pesa, MTN Mobile Money, and Airtel Money integration
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>🔒</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Escrow Services</Text>
              <Text style={styles.featureDescription}>
                Secure investment transactions with automated escrow
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>📊</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Advanced Analytics</Text>
              <Text style={styles.featureDescription}>
                Portfolio performance tracking and currency exposure analysis
              </Text>
            </View>
          </View>
        </View>

        {/* Regional Payment Methods */}
        <View style={styles.paymentMethodsSection}>
          <Text style={styles.sectionTitle}>🌍 Regional Payment Methods</Text>
          
          <View style={styles.regionCard}>
            <Text style={styles.regionFlag}>🇳🇬</Text>
            <View style={styles.regionContent}>
              <Text style={styles.regionName}>Nigeria</Text>
              <Text style={styles.paymentMethods}>Paystack • Flutterwave • Bank Transfer • USSD</Text>
            </View>
          </View>

          <View style={styles.regionCard}>
            <Text style={styles.regionFlag}>🇰🇪</Text>
            <View style={styles.regionContent}>
              <Text style={styles.regionName}>Kenya</Text>
              <Text style={styles.paymentMethods}>M-Pesa • Airtel Money • Equity Bank • KCB</Text>
            </View>
          </View>

          <View style={styles.regionCard}>
            <Text style={styles.regionFlag}>🇿🇦</Text>
            <View style={styles.regionContent}>
              <Text style={styles.regionName}>South Africa</Text>
              <Text style={styles.paymentMethods}>PayFast • Ozow • EFT • SnapScan</Text>
            </View>
          </View>

          <View style={styles.regionCard}>
            <Text style={styles.regionFlag}>🇬🇭</Text>
            <View style={styles.regionContent}>
              <Text style={styles.regionName}>Ghana</Text>
              <Text style={styles.paymentMethods}>MTN Mobile Money • Vodafone Cash • AirtelTigo</Text>
            </View>
          </View>
        </View>

        {/* Educational Content */}
        <View style={styles.educationSection}>
          <Text style={styles.sectionTitle}>💡 Currency Tips</Text>
          
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>💰 Diversification Strategy</Text>
            <Text style={styles.tipText}>
              Keep 40-50% in stable currencies (USD, EUR) and diversify the rest across African currencies based on your business exposure.
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>📈 Timing Conversions</Text>
            <Text style={styles.tipText}>
              Monitor central bank announcements and commodity prices that affect African currencies. Set up alerts for favorable exchange rates.
            </Text>
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>🛡️ Risk Management</Text>
            <Text style={styles.tipText}>
              For amounts above $10,000, consider hedging instruments to protect against adverse currency movements.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D8F',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  featuresSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  paymentMethodsSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 16,
  },
  regionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  regionFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  regionContent: {
    flex: 1,
  },
  regionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paymentMethods: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  educationSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 16,
    marginBottom: 20,
  },
  tipCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D8F',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D8F',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});