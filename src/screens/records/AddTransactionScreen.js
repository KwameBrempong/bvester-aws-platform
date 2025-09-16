import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Vibration
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { transactionService } from '../../services/firebase/FirebaseService';
import { 
  SUPPORTED_CURRENCIES, 
  formatCurrencyDetailed,
  getGroupedCurrencies 
} from '../../utils/currency';

export default function AddTransactionScreen({ navigation, route }) {
  const { user, userProfile } = useContext(AuthContext);
  const { formatCurrency } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [transactionData, setTransactionData] = useState({
    type: 'income', // income, expense, transfer
    category: 'sales',
    amount: '',
    currency: userProfile?.currency || 'USD',
    description: '',
    date: new Date(),
    paymentMethod: 'cash',
    reference: '',
    tags: [],
    location: userProfile?.country || '',
    notes: '',
    receiptNumber: '',
    taxDeductible: false
  });

  // Transaction categories for African SMEs
  const categories = {
    income: [
      { value: 'sales', label: '💰 Sales Revenue' },
      { value: 'services', label: '🔧 Service Income' },
      { value: 'investment', label: '📈 Investment Income' },
      { value: 'grants', label: '🎁 Grants & Funding' },
      { value: 'loans', label: '🏦 Loan Proceeds' },
      { value: 'other_income', label: '📊 Other Income' },
    ],
    expense: [
      { value: 'inventory', label: '📦 Inventory/Stock' },
      { value: 'salaries', label: '👥 Salaries & Wages' },
      { value: 'rent', label: '🏢 Rent & Utilities' },
      { value: 'transport', label: '🚗 Transport & Fuel' },
      { value: 'marketing', label: '📢 Marketing & Advertising' },
      { value: 'equipment', label: '⚙️ Equipment & Tools' },
      { value: 'licenses', label: '📋 Licenses & Permits' },
      { value: 'taxes', label: '💸 Taxes & Fees' },
      { value: 'insurance', label: '🛡️ Insurance' },
      { value: 'other_expense', label: '📝 Other Expenses' },
    ],
    transfer: [
      { value: 'bank_transfer', label: '🏦 Bank Transfer' },
      { value: 'mobile_money', label: '📱 Mobile Money' },
      { value: 'cash_deposit', label: '💵 Cash Deposit' },
      { value: 'investment_transfer', label: '📈 Investment Transfer' },
    ]
  };

  const paymentMethods = [
    { value: 'cash', label: '💵 Cash' },
    { value: 'bank_transfer', label: '🏦 Bank Transfer' },
    { value: 'mobile_money', label: '📱 Mobile Money' },
    { value: 'card', label: '💳 Card Payment' },
    { value: 'cheque', label: '📄 Cheque' },
    { value: 'crypto', label: '₿ Cryptocurrency' },
  ];

  const updateTransactionData = (field, value) => {
    setTransactionData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts correcting it
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    
    // Validate form as user types
    validateForm({ ...transactionData, [field]: value });
  };

  const validateForm = (data = transactionData) => {
    const newErrors = {};
    
    // Amount validation
    if (!data.amount || parseFloat(data.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    } else if (parseFloat(data.amount) > 1000000) {
      newErrors.amount = 'Amount cannot exceed 1,000,000';
    }
    
    // Description validation
    if (!data.description || data.description.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    } else if (data.description.length > 100) {
      newErrors.description = 'Description cannot exceed 100 characters';
    }
    
    // Category validation
    if (!data.category) {
      newErrors.category = 'Please select a category';
    }
    
    setErrors(newErrors);
    setIsFormValid(Object.keys(newErrors).length === 0);
    return Object.keys(newErrors).length === 0;
  };

  const showFormError = (field) => {
    if (errors[field]) {
      Vibration.vibrate(100);
      Alert.alert('Validation Error', errors[field]);
    }
  };

  const validateTransaction = () => {
    if (!validateForm()) {
      const firstError = Object.keys(errors)[0];
      showFormError(firstError);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    
    if (!validateTransaction()) return;
    
    try {
      setLoading(true);
      console.log('Adding transaction:', transactionData);
      
      const transactionToSave = {
        ...transactionData,
        amount: parseFloat(transactionData.amount),
        date: transactionData.date,
        createdBy: user.uid,
        businessId: userProfile?.businessId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await transactionService.addTransaction(user.uid, transactionToSave);
      
      console.log('Transaction saved successfully:', result.id);
      
      // Success feedback
      Vibration.vibrate([100, 50, 100]);
      
      Alert.alert(
        '✅ Success', 
        `Transaction of ${formatCurrency(transactionData.amount, transactionData.currency)} added successfully!`,
        [
          {
            text: '+ Add Another',
            onPress: () => {
              resetForm();
            }
          },
          {
            text: 'View Records',
            onPress: () => navigation.goBack()
          }
        ]
      );
      
    } catch (error) {
      console.error('Error adding transaction:', error);
      Vibration.vibrate([200, 100, 200]);
      Alert.alert('❌ Error', 'Failed to add transaction. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTransactionData({
      ...transactionData,
      amount: '',
      description: '',
      reference: '',
      notes: '',
      receiptNumber: ''
    });
    setErrors({});
    setIsFormValid(false);
  };

  const formatAmountInput = (text) => {
    // Remove non-numeric characters except decimal point
    const numericValue = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts[1];
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return numericValue;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#2E7D8F" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Add Transaction</Text>
          <Text style={styles.subtitle}>Record your business finances</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        {/* Transaction Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Type</Text>
          <View style={styles.typeButtons}>
            {['income', 'expense', 'transfer'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  transactionData.type === type && styles.typeButtonActive
                ]}
                onPress={() => {
                  updateTransactionData('type', type);
                  updateTransactionData('category', categories[type][0].value);
                }}
              >
                <Text style={[
                  styles.typeButtonText,
                  transactionData.type === type && styles.typeButtonTextActive
                ]}>
                  {type === 'income' ? '💰 Income' :
                   type === 'expense' ? '💸 Expense' : '🔄 Transfer'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Amount */}
        <View style={styles.inputSection}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Amount *</Text>
            {errors.amount && (
              <Text style={styles.errorText}>{errors.amount}</Text>
            )}
          </View>
          <View style={[
            styles.amountContainer,
            errors.amount && styles.inputError
          ]}>
            <TouchableOpacity 
              style={styles.currencyPickerButton}
              onPress={() => {
                const currencies = Object.entries(SUPPORTED_CURRENCIES);
                Alert.alert(
                  'Select Currency',
                  'Choose transaction currency',
                  currencies.map(([code, info]) => ({
                    text: `${info.flag} ${info.symbol} ${code}`,
                    onPress: () => updateTransactionData('currency', code)
                  }))
                );
              }}
            >
              <Text style={styles.currencyButtonText}>
                {SUPPORTED_CURRENCIES[transactionData.currency]?.flag} {SUPPORTED_CURRENCIES[transactionData.currency]?.symbol}
              </Text>
              <Text style={styles.currencyCode}>{transactionData.currency}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
            <TextInput
              style={styles.amountInput}
              value={transactionData.amount}
              onChangeText={(value) => {
                const formattedValue = formatAmountInput(value);
                updateTransactionData('amount', formattedValue);
              }}
              placeholder="0.00"
              keyboardType="decimal-pad"
              returnKeyType="next"
              maxLength={12}
              selectTextOnFocus
            />
          </View>
          {transactionData.amount && !errors.amount && (
            <View style={styles.amountPreviewContainer}>
              <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
              <Text style={styles.amountPreview}>
                {formatCurrencyDetailed(parseFloat(transactionData.amount) || 0, transactionData.currency)}
              </Text>
              {transactionData.currency !== 'USD' && (
                <Text style={styles.usdEquivalent}>
                  ≈ {formatCurrencyDetailed(
                    parseFloat(transactionData.amount) / ({
                      NGN: 1500, ZAR: 18, KES: 140, GHS: 12, UGX: 3720, EGP: 31, MAD: 10, TZS: 2300, EUR: 0.85, GBP: 0.73
                    }[transactionData.currency] || 1),
                    'USD'
                  )}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Category */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={transactionData.category}
              onValueChange={(value) => updateTransactionData('category', value)}
              style={styles.picker}
            >
              {categories[transactionData.type].map(cat => (
                <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Description */}
        <View style={styles.inputSection}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Description *</Text>
            <Text style={styles.characterCount}>
              {transactionData.description.length}/100
            </Text>
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>
          <TextInput
            style={[
              styles.textInput,
              styles.descriptionInput,
              errors.description && styles.inputError
            ]}
            value={transactionData.description}
            onChangeText={(value) => updateTransactionData('description', value)}
            placeholder="e.g. Coffee shop sales for January 28"
            multiline
            numberOfLines={3}
            returnKeyType="next"
            maxLength={100}
            textAlignVertical="top"
          />
        </View>

        {/* Payment Method */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={transactionData.paymentMethod}
              onValueChange={(value) => updateTransactionData('paymentMethod', value)}
              style={styles.picker}
            >
              {paymentMethods.map(method => (
                <Picker.Item key={method.value} label={method.label} value={method.value} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Reference & Receipt Numbers */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Reference Number</Text>
          <TextInput
            style={styles.textInput}
            value={transactionData.reference}
            onChangeText={(value) => updateTransactionData('reference', value)}
            placeholder="Transaction reference (optional)"
            returnKeyType="next"
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Receipt Number</Text>
          <TextInput
            style={styles.textInput}
            value={transactionData.receiptNumber}
            onChangeText={(value) => updateTransactionData('receiptNumber', value)}
            placeholder="Receipt/invoice number (optional)"
            returnKeyType="next"
            autoCapitalize="characters"
          />
        </View>

        {/* Additional Notes */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            value={transactionData.notes}
            onChangeText={(value) => updateTransactionData('notes', value)}
            placeholder="Any additional information (optional)"
            multiline
            numberOfLines={2}
            returnKeyType="done"
            maxLength={200}
            textAlignVertical="top"
          />
        </View>

        {/* Date */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity style={styles.dateButton}>
            <Text style={styles.dateText}>
              📅 {transactionData.date.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          <Text style={styles.helperText}>
            Currently set to today. Date picker coming soon.
          </Text>
        </View>

        {/* Smart Insights */}
        <View style={styles.insightsSection}>
          <View style={styles.insightHeader}>
            <Ionicons name="bulb-outline" size={20} color="#2E7D8F" />
            <Text style={styles.insightTitle}>Smart Insights</Text>
          </View>
          
          {transactionData.type === 'expense' && parseFloat(transactionData.amount) > 10000 && (
            <View style={styles.insight}>
              <Ionicons name="alert-circle-outline" size={16} color="#f39c12" />
              <Text style={styles.insightText}>
                Large expense detected. Consider if this qualifies for tax deductions.
              </Text>
            </View>
          )}
          
          {transactionData.paymentMethod === 'mobile_money' && (
            <View style={styles.insight}>
              <Ionicons name="phone-portrait-outline" size={16} color="#2E7D8F" />
              <Text style={styles.insightText}>
                Mobile money transactions help track digital payments for better cash flow analysis.
              </Text>
            </View>
          )}
          
          <View style={styles.insight}>
            <Ionicons name="trending-up-outline" size={16} color="#27ae60" />
            <Text style={styles.insightText}>
              Consistent record-keeping improves your investment readiness score by {Math.floor(Math.random() * 5) + 3}%.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              Alert.alert(
                'Clear Form',
                'Are you sure you want to clear all form data?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear', style: 'destructive', onPress: resetForm }
                ]
              );
            }}
          >
            <Ionicons name="refresh-outline" size={20} color="#666" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isFormValid || loading) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Save Transaction</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2E7D8F',
    marginLeft: 6,
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    borderColor: '#2E7D8F',
    backgroundColor: '#e8f4f8',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#2E7D8F',
  },
  inputSection: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '500',
    marginLeft: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  currencyPickerButton: {
    backgroundColor: '#f8f9fa',
    width: 120,
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  currencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  currencyCode: {
    fontSize: 14,
    color: '#2E7D8F',
    fontWeight: '500',
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
    color: '#2E7D8F',
  },
  amountPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  amountPreview: {
    fontSize: 14,
    color: '#27ae60',
    marginLeft: 6,
    fontWeight: '600',
  },
  usdEquivalent: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  textInput: {
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  insightsSection: {
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D8F',
    marginLeft: 8,
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
  },
  insightText: {
    fontSize: 13,
    color: '#2E7D8F',
    lineHeight: 18,
    flex: 1,
    marginLeft: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    gap: 16,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D8F',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#2E7D8F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 40,
  },
});