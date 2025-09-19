/**
 * Business Settings Screen
 * Comprehensive business profile settings with currency management
 */

import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { 
  ProfessionalHeader,
  Button,
  Input,
  Card,
  useTheme, 
  getEnhancedColor, 
  getSpacing, 
  getFontSize, 
  getFont,
  getBorderRadius 
} from '../../components/ui';
import { 
  SUPPORTED_CURRENCIES, 
  getGroupedCurrencies,
  getCurrencyByCountry,
  formatCurrencyDetailed 
} from '../../utils/currency';

export default function BusinessSettingsScreen({ navigation }) {
  const { user, userProfile, updateUserProfile } = useContext(AuthContext);
  const { currency, setCurrency, formatCurrency } = useApp();
  const { colors, isDark } = useTheme();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: userProfile?.businessName || '',
    businessType: userProfile?.businessType || 'Limited Company',
    industry: userProfile?.industry || 'Technology',
    country: userProfile?.country || 'Nigeria',
    currency: userProfile?.currency || currency,
    businessRegistrationNumber: userProfile?.businessRegistrationNumber || '',
    taxIdentificationNumber: userProfile?.taxIdentificationNumber || '',
    businessAddress: userProfile?.businessAddress || '',
    website: userProfile?.website || '',
    phoneNumber: userProfile?.phoneNumber || '',
    businessDescription: userProfile?.businessDescription || '',
    foundedYear: userProfile?.foundedYear || new Date().getFullYear().toString(),
    numberOfEmployees: userProfile?.numberOfEmployees || '1-5'
  });

  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const businessTypes = [
    'Sole Proprietorship',
    'Partnership', 
    'Limited Company',
    'Corporation',
    'Cooperative',
    'NGO/Non-Profit'
  ];

  const industries = [
    'Technology',
    'Agriculture',
    'Healthcare',
    'Manufacturing',
    'Retail & E-commerce',
    'Professional Services',
    'Education',
    'Financial Services',
    'Transportation',
    'Construction',
    'Energy',
    'Tourism & Hospitality',
    'Media & Entertainment',
    'Other'
  ];

  const employeeRanges = [
    '1-5',
    '6-10',
    '11-25',
    '26-50',
    '51-100',
    '100+'
  ];

  const countries = [
    'Nigeria', 'South Africa', 'Kenya', 'Ghana', 'Egypt',
    'Morocco', 'Tunisia', 'Ethiopia', 'Uganda', 'Rwanda',
    'Tanzania', 'Zambia', 'Botswana', 'Senegal', 'Ivory Coast',
    'United States', 'United Kingdom', 'Germany', 'France'
  ];

  const validateForm = () => {
    const errors = {};

    if (!formData.businessName.trim()) {
      errors.businessName = 'Business name is required';
    } else if (formData.businessName.trim().length < 2) {
      errors.businessName = 'Business name must be at least 2 characters';
    }

    if (!formData.businessType) {
      errors.businessType = 'Business type is required';
    }

    if (!formData.industry) {
      errors.industry = 'Industry is required';
    }

    if (!formData.country) {
      errors.country = 'Country is required';
    }

    if (!formData.currency) {
      errors.currency = 'Currency is required';
    }

    if (formData.website && !formData.website.includes('.')) {
      errors.website = 'Please enter a valid website URL';
    }

    if (formData.businessDescription.length > 500) {
      errors.businessDescription = 'Description cannot exceed 500 characters';
    }

    const currentYear = new Date().getFullYear();
    const foundedYear = parseInt(formData.foundedYear);
    if (foundedYear < 1900 || foundedYear > currentYear) {
      errors.foundedYear = `Founded year must be between 1900 and ${currentYear}`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors below and try again.');
      return;
    }

    try {
      setSaving(true);
      
      const updates = {
        ...formData,
        businessProfileCompleted: true,
        updatedAt: new Date()
      };

      console.log('Saving business settings:', updates);
      
      const result = await updateUserProfile(updates);
      
      if (result.success) {
        // Update global currency if changed
        if (formData.currency !== currency) {
          setCurrency(formData.currency);
        }

        Alert.alert(
          'Settings Saved',
          'Your business settings have been updated successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert(
          'Save Failed',
          result.error || 'Failed to save settings. Please try again.'
        );
      }
    } catch (error) {
      console.error('Error saving business settings:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred while saving. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCountryChange = (country) => {
    const suggestedCurrency = getCurrencyByCountry(country);
    setFormData({
      ...formData,
      country,
      currency: suggestedCurrency
    });
  };

  const renderCurrencySelector = () => {
    if (!showCurrencySelector) return null;

    const groupedCurrencies = getGroupedCurrencies();

    return (
      <Card style={styles.currencyModal}>
        <View style={styles.currencyHeader}>
          <Text style={[styles.currencyTitle, { color: colors.text }]}>
            Select Business Currency
          </Text>
          <TouchableOpacity
            onPress={() => setShowCurrencySelector(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
          <Text style={[styles.currencyGroupTitle, { color: colors.primary[500] }]}>
            International Currencies
          </Text>
          {groupedCurrencies.international.map((curr) => (
            <TouchableOpacity
              key={curr.code}
              style={[
                styles.currencyItem,
                { backgroundColor: colors.surface },
                formData.currency === curr.code && { 
                  backgroundColor: colors.primary[100],
                  borderColor: colors.primary[500],
                  borderWidth: 2
                }
              ]}
              onPress={() => {
                setFormData({ ...formData, currency: curr.code });
                setShowCurrencySelector(false);
              }}
            >
              <View style={styles.currencyInfo}>
                <Text style={styles.currencyFlag}>{curr.flag}</Text>
                <View style={styles.currencyDetails}>
                  <Text style={[
                    styles.currencyName,
                    { color: colors.text },
                    formData.currency === curr.code && { fontWeight: '600' }
                  ]}>
                    {curr.name} ({curr.code})
                  </Text>
                  <Text style={[styles.currencyRegion, { color: colors.textSecondary }]}>
                    {curr.region}
                  </Text>
                </View>
              </View>
              <Text style={[styles.currencySymbol, { color: colors.text }]}>
                {curr.symbol}
              </Text>
              {formData.currency === curr.code && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
              )}
            </TouchableOpacity>
          ))}

          <Text style={[styles.currencyGroupTitle, { color: colors.primary[500] }]}>
            African Currencies
          </Text>
          {groupedCurrencies.african.map((curr) => (
            <TouchableOpacity
              key={curr.code}
              style={[
                styles.currencyItem,
                { backgroundColor: colors.surface },
                formData.currency === curr.code && { 
                  backgroundColor: colors.primary[100],
                  borderColor: colors.primary[500],
                  borderWidth: 2
                }
              ]}
              onPress={() => {
                setFormData({ ...formData, currency: curr.code });
                setShowCurrencySelector(false);
              }}
            >
              <View style={styles.currencyInfo}>
                <Text style={styles.currencyFlag}>{curr.flag}</Text>
                <View style={styles.currencyDetails}>
                  <Text style={[
                    styles.currencyName,
                    { color: colors.text },
                    formData.currency === curr.code && { fontWeight: '600' }
                  ]}>
                    {curr.name} ({curr.code})
                  </Text>
                  <Text style={[styles.currencyRegion, { color: colors.textSecondary }]}>
                    {curr.region}
                  </Text>
                </View>
              </View>
              <Text style={[styles.currencySymbol, { color: colors.text }]}>
                {curr.symbol}
              </Text>
              {formData.currency === curr.code && (
                <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>
    );
  };

  const renderPickerModal = (title, items, selectedValue, onSelect, valueKey = null) => {
    return (
      <Card style={styles.pickerModal}>
        <View style={styles.pickerHeader}>
          <Text style={[styles.pickerTitle, { color: colors.text }]}>{title}</Text>
        </View>
        
        <ScrollView style={styles.pickerList}>
          {items.map((item) => {
            const value = valueKey ? item[valueKey] : item;
            const isSelected = selectedValue === value;
            
            return (
              <TouchableOpacity
                key={value}
                style={[
                  styles.pickerItem,
                  { backgroundColor: colors.surface },
                  isSelected && { 
                    backgroundColor: colors.primary[100],
                    borderColor: colors.primary[500],
                    borderWidth: 1
                  }
                ]}
                onPress={() => onSelect(value)}
              >
                <Text style={[
                  styles.pickerItemText,
                  { color: colors.text },
                  isSelected && { fontWeight: '600', color: colors.primary[700] }
                ]}>
                  {value}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={20} color={colors.primary[500]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ProfessionalHeader
        title="Business Settings"
        subtitle="Manage your business profile and preferences"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        variant="premium"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Basic Business Information */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Basic Information
            </Text>

            <Input
              label="Business Name *"
              placeholder="Enter your business name"
              value={formData.businessName}
              onChangeText={(value) => setFormData({ ...formData, businessName: value })}
              error={validationErrors.businessName}
              leftIcon={<Ionicons name="business-outline" size={20} color={colors.primary[500]} />}
              style={styles.input}
            />

            <TouchableOpacity
              style={[styles.selectInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => Alert.alert('Business Type', 'Select your business type', 
                businessTypes.map(type => ({
                  text: type,
                  onPress: () => setFormData({ ...formData, businessType: type })
                }))
              )}
            >
              <Ionicons name="briefcase-outline" size={20} color={colors.primary[500]} />
              <Text style={[styles.selectText, { color: colors.text }]}>
                {formData.businessType || 'Select business type'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
            {validationErrors.businessType && (
              <Text style={styles.errorText}>{validationErrors.businessType}</Text>
            )}

            <TouchableOpacity
              style={[styles.selectInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => Alert.alert('Industry', 'Select your industry',
                industries.map(industry => ({
                  text: industry,
                  onPress: () => setFormData({ ...formData, industry })
                }))
              )}
            >
              <Ionicons name="analytics-outline" size={20} color={colors.primary[500]} />
              <Text style={[styles.selectText, { color: colors.text }]}>
                {formData.industry || 'Select industry'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
            {validationErrors.industry && (
              <Text style={styles.errorText}>{validationErrors.industry}</Text>
            )}

            <Input
              label="Founded Year"
              placeholder="2020"
              value={formData.foundedYear}
              onChangeText={(value) => setFormData({ ...formData, foundedYear: value })}
              keyboardType="numeric"
              error={validationErrors.foundedYear}
              leftIcon={<Ionicons name="calendar-outline" size={20} color={colors.primary[500]} />}
              style={styles.input}
            />

            <TouchableOpacity
              style={[styles.selectInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => Alert.alert('Number of Employees', 'Select employee range',
                employeeRanges.map(range => ({
                  text: range,
                  onPress: () => setFormData({ ...formData, numberOfEmployees: range })
                }))
              )}
            >
              <Ionicons name="people-outline" size={20} color={colors.primary[500]} />
              <Text style={[styles.selectText, { color: colors.text }]}>
                {formData.numberOfEmployees} employees
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          </Card>

          {/* Location & Currency */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Location & Currency
            </Text>

            <TouchableOpacity
              style={[styles.selectInput, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => Alert.alert('Country', 'Select your country',
                countries.map(country => ({
                  text: country,
                  onPress: () => handleCountryChange(country)
                }))
              )}
            >
              <Ionicons name="location-outline" size={20} color={colors.primary[500]} />
              <Text style={[styles.selectText, { color: colors.text }]}>
                {formData.country || 'Select country'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
            {validationErrors.country && (
              <Text style={styles.errorText}>{validationErrors.country}</Text>
            )}

            <TouchableOpacity
              style={[styles.currencySelector, { 
                backgroundColor: colors.surface, 
                borderColor: formData.currency ? colors.primary[300] : colors.border 
              }]}
              onPress={() => setShowCurrencySelector(true)}
            >
              <View style={styles.currencyPreview}>
                <Ionicons name="card-outline" size={20} color={colors.primary[500]} />
                <View style={styles.currencyPreviewText}>
                  <Text style={[styles.currencyLabel, { color: colors.text }]}>Business Currency *</Text>
                  {formData.currency ? (
                    <View style={styles.selectedCurrency}>
                      <Text style={styles.currencyFlag}>
                        {SUPPORTED_CURRENCIES[formData.currency]?.flag}
                      </Text>
                      <Text style={[styles.currencyName, { color: colors.text }]}>
                        {SUPPORTED_CURRENCIES[formData.currency]?.name} ({formData.currency})
                      </Text>
                      <Text style={[styles.currencySymbol, { color: colors.primary[600] }]}>
                        {SUPPORTED_CURRENCIES[formData.currency]?.symbol}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                      Select your business currency
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-down" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
            {validationErrors.currency && (
              <Text style={styles.errorText}>{validationErrors.currency}</Text>
            )}

            {formData.currency && (
              <View style={[styles.currencyInfo, { backgroundColor: colors.primary[50] }]}>
                <Ionicons name="information-circle" size={16} color={colors.primary[600]} />
                <Text style={[styles.infoText, { color: colors.primary[700] }]}>
                  Sample: {formatCurrencyDetailed(1000, formData.currency)} • Used for all financial records
                </Text>
              </View>
            )}
          </Card>

          {/* Contact Information */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Contact Information
            </Text>

            <Input
              label="Business Address"
              placeholder="Enter your business address"
              value={formData.businessAddress}
              onChangeText={(value) => setFormData({ ...formData, businessAddress: value })}
              multiline
              numberOfLines={3}
              leftIcon={<Ionicons name="location-outline" size={20} color={colors.primary[500]} />}
              style={[styles.input, styles.textArea]}
            />

            <Input
              label="Phone Number"
              placeholder="Enter business phone number"
              value={formData.phoneNumber}
              onChangeText={(value) => setFormData({ ...formData, phoneNumber: value })}
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={20} color={colors.primary[500]} />}
              style={styles.input}
            />

            <Input
              label="Website"
              placeholder="https://yourbusiness.com"
              value={formData.website}
              onChangeText={(value) => setFormData({ ...formData, website: value })}
              keyboardType="url"
              autoCapitalize="none"
              error={validationErrors.website}
              leftIcon={<Ionicons name="globe-outline" size={20} color={colors.primary[500]} />}
              style={styles.input}
            />
          </Card>

          {/* Legal Information */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Legal Information
            </Text>

            <Input
              label="Business Registration Number"
              placeholder="Enter registration number"
              value={formData.businessRegistrationNumber}
              onChangeText={(value) => setFormData({ ...formData, businessRegistrationNumber: value })}
              leftIcon={<Ionicons name="document-text-outline" size={20} color={colors.primary[500]} />}
              style={styles.input}
            />

            <Input
              label="Tax Identification Number"
              placeholder="Enter tax ID number"
              value={formData.taxIdentificationNumber}
              onChangeText={(value) => setFormData({ ...formData, taxIdentificationNumber: value })}
              leftIcon={<Ionicons name="receipt-outline" size={20} color={colors.primary[500]} />}
              style={styles.input}
            />
          </Card>

          {/* Business Description */}
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              About Your Business
            </Text>

            <Input
              label={`Business Description (${formData.businessDescription.length}/500)`}
              placeholder="Describe your business, products, and services..."
              value={formData.businessDescription}
              onChangeText={(value) => setFormData({ ...formData, businessDescription: value })}
              multiline
              numberOfLines={4}
              maxLength={500}
              error={validationErrors.businessDescription}
              leftIcon={<Ionicons name="document-outline" size={20} color={colors.primary[500]} />}
              style={[styles.input, styles.textArea]}
            />
          </Card>

          {/* Save Button */}
          <Button
            title={saving ? "Saving..." : "Save Settings"}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
            leftIcon={<Ionicons name="save-outline" size={20} color="#fff" />}
          />

          <View style={{ height: getSpacing('2xl') }} />
        </ScrollView>

        {/* Currency Selector Modal */}
        {showCurrencySelector && renderCurrencySelector()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  keyboardView: {
    flex: 1
  },
  content: {
    flex: 1,
    paddingHorizontal: getSpacing('lg')
  },
  scrollContent: {
    paddingBottom: getSpacing('xl')
  },
  section: {
    marginBottom: getSpacing('lg'),
    padding: getSpacing('lg')
  },
  sectionTitle: {
    fontSize: getFontSize('lg'),
    fontFamily: getFont('semibold'),
    marginBottom: getSpacing('md'),
    letterSpacing: -0.3
  },
  input: {
    marginBottom: getSpacing('md')
  },
  textArea: {
    minHeight: 80
  },
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getSpacing('md'),
    borderRadius: getBorderRadius('lg'),
    borderWidth: 1,
    marginBottom: getSpacing('md'),
    gap: getSpacing('sm')
  },
  selectText: {
    flex: 1,
    fontSize: getFontSize('base'),
    fontFamily: getFont('medium')
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getSpacing('md'),
    borderRadius: getBorderRadius('lg'),
    borderWidth: 1,
    marginBottom: getSpacing('sm')
  },
  currencyPreview: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('sm')
  },
  currencyPreviewText: {
    flex: 1
  },
  currencyLabel: {
    fontSize: getFontSize('sm'),
    fontFamily: getFont('medium'),
    marginBottom: 4
  },
  selectedCurrency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('xs')
  },
  currencyFlag: {
    fontSize: 16
  },
  currencyName: {
    fontSize: getFontSize('base'),
    fontFamily: getFont('medium')
  },
  currencySymbol: {
    fontSize: getFontSize('base'),
    fontFamily: getFont('semibold')
  },
  placeholderText: {
    fontSize: getFontSize('base'),
    fontFamily: getFont('regular')
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getSpacing('sm'),
    borderRadius: getBorderRadius('md'),
    gap: getSpacing('xs'),
    marginBottom: getSpacing('md')
  },
  infoText: {
    fontSize: getFontSize('sm'),
    fontFamily: getFont('medium'),
    flex: 1
  },
  currencyModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    margin: getSpacing('md'),
    maxHeight: '80%',
    marginTop: 100
  },
  currencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getSpacing('lg'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  currencyTitle: {
    fontSize: getFontSize('lg'),
    fontFamily: getFont('semibold')
  },
  closeButton: {
    padding: getSpacing('xs')
  },
  currencyList: {
    flex: 1,
    padding: getSpacing('md')
  },
  currencyGroupTitle: {
    fontSize: getFontSize('md'),
    fontFamily: getFont('semibold'),
    marginVertical: getSpacing('md')
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getSpacing('md'),
    borderRadius: getBorderRadius('lg'),
    marginBottom: getSpacing('sm'),
    borderWidth: 1,
    borderColor: 'transparent'
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: getSpacing('sm')
  },
  currencyDetails: {
    flex: 1
  },
  currencyRegion: {
    fontSize: getFontSize('sm'),
    fontFamily: getFont('regular'),
    marginTop: 2
  },
  saveButton: {
    marginTop: getSpacing('lg'),
    marginHorizontal: getSpacing('sm')
  },
  errorText: {
    color: '#ef4444',
    fontSize: getFontSize('sm'),
    fontFamily: getFont('medium'),
    marginTop: -getSpacing('sm'),
    marginBottom: getSpacing('sm'),
    marginLeft: getSpacing('sm')
  },
  pickerModal: {
    position: 'absolute',
    top: 100,
    left: getSpacing('md'),
    right: getSpacing('md'),
    maxHeight: '70%',
    zIndex: 1000
  },
  pickerHeader: {
    padding: getSpacing('lg'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  pickerTitle: {
    fontSize: getFontSize('lg'),
    fontFamily: getFont('semibold'),
    textAlign: 'center'
  },
  pickerList: {
    flex: 1,
    padding: getSpacing('md')
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getSpacing('md'),
    borderRadius: getBorderRadius('lg'),
    marginBottom: getSpacing('sm'),
    borderWidth: 1,
    borderColor: 'transparent'
  },
  pickerItemText: {
    fontSize: getFontSize('base'),
    fontFamily: getFont('medium'),
    flex: 1
  }
});