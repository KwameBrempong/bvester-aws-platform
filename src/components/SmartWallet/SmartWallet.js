import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { 
  SUPPORTED_CURRENCIES, 
  convertCurrency, 
  formatCurrency,
  calculateCurrencyRisk,
  getHedgingRecommendations,
  mockRateUpdate 
} from '../../utils/currency';
import HedgingAlert from './HedgingAlert';

export default function SmartWallet({ onTransactionAdd = null }) {
  const { userProfile } = useContext(AuthContext);
  const { currency, setCurrency } = useApp();
  
  const [walletBalances, setWalletBalances] = useState({
    USD: 25000,
    NGN: 2500000,
    ZAR: 75000,
    KES: 150000,
    GHS: 8500,
    UGX: 250000
  });
  
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    fromCurrency: 'USD',
    toCurrency: 'NGN',
    amount: ''
  });
  
  const [currencyRisk, setCurrencyRisk] = useState(0);
  const [hedgingRecommendations, setHedgingRecommendations] = useState([]);
  const [showHedgingAlert, setShowHedgingAlert] = useState(false);

  useEffect(() => {
    // Calculate currency risk based on user's exposure
    const exposureCurrencies = Object.keys(walletBalances).filter(curr => 
      walletBalances[curr] > 0 && curr !== 'USD'
    );
    
    const risk = calculateCurrencyRisk(userProfile?.currency || 'USD', exposureCurrencies);
    setCurrencyRisk(risk);
    
    // Get hedging recommendations
    const totalUSDValue = getTotalValueInUSD();
    const recommendations = getHedgingRecommendations(userProfile?.currency || 'USD', totalUSDValue);
    setHedgingRecommendations(recommendations);
    
    // Show hedging alert if high risk
    if (risk > 60) {
      setShowHedgingAlert(true);
    }
  }, [walletBalances, userProfile]);

  const getTotalValueInUSD = () => {
    return Object.entries(walletBalances).reduce((total, [curr, amount]) => {
      return total + convertCurrency(amount, curr, 'USD');
    }, 0);
  };

  const getTotalValueInUserCurrency = () => {
    const userCurr = userProfile?.currency || currency;
    const totalUSD = getTotalValueInUSD();
    return convertCurrency(totalUSD, 'USD', userCurr);
  };

  const handleCurrencyConversion = () => {
    const { fromCurrency, toCurrency, amount } = transferData;
    const transferAmount = parseFloat(amount);
    
    if (!transferAmount || transferAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    if (walletBalances[fromCurrency] < transferAmount) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }
    
    const convertedAmount = convertCurrency(transferAmount, fromCurrency, toCurrency);
    
    // Update balances
    setWalletBalances(prev => ({
      ...prev,
      [fromCurrency]: prev[fromCurrency] - transferAmount,
      [toCurrency]: prev[toCurrency] + convertedAmount
    }));
    
    // Log transaction for external tracking
    if (onTransactionAdd) {
      onTransactionAdd({
        type: 'currency_conversion',
        fromCurrency,
        toCurrency,
        fromAmount: transferAmount,
        toAmount: convertedAmount,
        timestamp: new Date().toISOString()
      });
    }
    
    Alert.alert(
      'Conversion Successful',
      `Converted ${formatCurrency(transferAmount, fromCurrency)} to ${formatCurrency(convertedAmount, toCurrency)}`
    );
    
    setShowTransferModal(false);
    setTransferData({ fromCurrency: 'USD', toCurrency: 'NGN', amount: '' });
  };

  const simulateRateUpdate = () => {
    // Simulate real-time rate changes
    mockRateUpdate();
    Alert.alert('Rates Updated', 'Exchange rates have been refreshed');
  };

  const getCurrencyFlag = (currencyCode) => {
    const flags = {
      USD: '🇺🇸',
      NGN: '🇳🇬',
      ZAR: '🇿🇦',
      KES: '🇰🇪',
      GHS: '🇬🇭',
      UGX: '🇺🇬'
    };
    return flags[currencyCode] || '💰';
  };

  const getRiskColor = (risk) => {
    if (risk < 30) return '#27ae60';
    if (risk < 60) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💱 Smart Wallet</Text>
        <TouchableOpacity onPress={simulateRateUpdate} style={styles.refreshButton}>
          <Text style={styles.refreshText}>🔄 Refresh Rates</Text>
        </TouchableOpacity>
      </View>

      {/* Total Value */}
      <View style={styles.totalValueCard}>
        <Text style={styles.totalLabel}>Total Portfolio Value</Text>
        <Text style={styles.totalValue}>
          {formatCurrency(getTotalValueInUserCurrency(), userProfile?.currency || currency)}
        </Text>
        <Text style={styles.totalSubtext}>
          ≈ {formatCurrency(getTotalValueInUSD(), 'USD')}
        </Text>
      </View>

      {/* Currency Risk Indicator */}
      <View style={styles.riskCard}>
        <View style={styles.riskHeader}>
          <Text style={styles.riskLabel}>Currency Risk Score</Text>
          <View style={[styles.riskIndicator, { backgroundColor: getRiskColor(currencyRisk) }]}>
            <Text style={styles.riskScore}>{Math.round(currencyRisk)}</Text>
          </View>
        </View>
        <Text style={styles.riskDescription}>
          {currencyRisk < 30 ? 'Low risk - well diversified' :
           currencyRisk < 60 ? 'Medium risk - consider hedging' :
           'High risk - hedging recommended'}
        </Text>
      </View>

      {/* Currency Balances */}
      <ScrollView style={styles.balancesContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Currency Balances</Text>
        {Object.entries(walletBalances).map(([currencyCode, balance]) => {
          if (balance === 0) return null;
          
          const currencyInfo = SUPPORTED_CURRENCIES[currencyCode];
          const usdValue = convertCurrency(balance, currencyCode, 'USD');
          
          return (
            <TouchableOpacity
              key={currencyCode}
              style={styles.balanceCard}
              onPress={() => setCurrency(currencyCode)}
            >
              <View style={styles.balanceHeader}>
                <Text style={styles.currencyFlag}>{getCurrencyFlag(currencyCode)}</Text>
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencyCode}>{currencyCode}</Text>
                  <Text style={styles.currencyName}>{currencyInfo?.name}</Text>
                </View>
                <View style={styles.balanceAmount}>
                  <Text style={styles.primaryBalance}>
                    {formatCurrency(balance, currencyCode)}
                  </Text>
                  <Text style={styles.secondaryBalance}>
                    ≈ {formatCurrency(usdValue, 'USD')}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowTransferModal(true)}
        >
          <Text style={styles.actionButtonText}>💱 Convert Currency</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowCurrencyModal(true)}
        >
          <Text style={styles.actionButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Hedging Alert */}
      {showHedgingAlert && (
        <HedgingAlert
          visible={showHedgingAlert}
          onClose={() => setShowHedgingAlert(false)}
          recommendations={hedgingRecommendations}
          riskScore={currencyRisk}
        />
      )}

      {/* Currency Transfer Modal */}
      <Modal
        visible={showTransferModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTransferModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Currency Conversion</Text>
            
            <View style={styles.transferForm}>
              <Text style={styles.inputLabel}>From Currency</Text>
              <TouchableOpacity
                style={styles.currencySelector}
                onPress={() => {/* Add currency picker */}}
              >
                <Text>{transferData.fromCurrency}</Text>
              </TouchableOpacity>
              
              <Text style={styles.inputLabel}>To Currency</Text>
              <TouchableOpacity
                style={styles.currencySelector}
                onPress={() => {/* Add currency picker */}}
              >
                <Text>{transferData.toCurrency}</Text>
              </TouchableOpacity>
              
              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                style={styles.amountInput}
                value={transferData.amount}
                onChangeText={(value) => setTransferData(prev => ({ ...prev, amount: value }))}
                placeholder="Enter amount"
                keyboardType="numeric"
              />
              
              {transferData.amount && (
                <Text style={styles.conversionPreview}>
                  {formatCurrency(parseFloat(transferData.amount) || 0, transferData.fromCurrency)} ≈{' '}
                  {formatCurrency(
                    convertCurrency(parseFloat(transferData.amount) || 0, transferData.fromCurrency, transferData.toCurrency),
                    transferData.toCurrency
                  )}
                </Text>
              )}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowTransferModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCurrencyConversion}
              >
                <Text style={styles.confirmButtonText}>Convert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D8F',
  },
  refreshButton: {
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  refreshText: {
    fontSize: 12,
    color: '#2E7D8F',
  },
  totalValueCard: {
    backgroundColor: '#2E7D8F',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  totalValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  totalSubtext: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  riskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  riskIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskScore: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  riskDescription: {
    fontSize: 12,
    color: '#666',
  },
  balancesContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  currencyName: {
    fontSize: 12,
    color: '#666',
  },
  balanceAmount: {
    alignItems: 'flex-end',
  },
  primaryBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D8F',
  },
  secondaryBalance: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: '#2E7D8F',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 0.48,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  transferForm: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  currencySelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  conversionPreview: {
    fontSize: 14,
    color: '#2E7D8F',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 0.45,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#2E7D8F',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});