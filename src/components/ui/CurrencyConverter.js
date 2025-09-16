/**
 * Currency Converter Component
 * Real-time currency conversion with toggle functionality
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  formatCurrencyDetailed, 
  convertCurrency, 
  SUPPORTED_CURRENCIES,
  formatCurrencyWithConversion 
} from '../../utils/currency';
import { useApp } from '../../context/AppContext';
import { useTheme, getSpacing, getFontSize, getFont, getBorderRadius } from './index';

export const CurrencyConverter = ({ 
  amount, 
  fromCurrency, 
  toCurrency = 'USD',
  showToggle = true,
  showBoth = false,
  style = {},
  textStyle = {},
  onCurrencyChange 
}) => {
  const { colors } = useTheme();
  const [isConverted, setIsConverted] = useState(false);

  if (!amount || amount === 0) {
    return (
      <Text style={[styles.zeroAmount, { color: colors.textSecondary }, textStyle]}>
        {formatCurrencyDetailed(0, fromCurrency)}
      </Text>
    );
  }

  const displayCurrency = isConverted ? toCurrency : fromCurrency;
  const displayAmount = isConverted ? convertCurrency(amount, fromCurrency, toCurrency) : amount;

  const handleToggle = () => {
    setIsConverted(!isConverted);
    if (onCurrencyChange) {
      onCurrencyChange(isConverted ? fromCurrency : toCurrency);
    }
  };

  if (showBoth) {
    const conversion = formatCurrencyWithConversion(amount, fromCurrency, toCurrency, true);
    return (
      <View style={[styles.bothContainer, style]}>
        <Text style={[styles.originalAmount, { color: colors.text }, textStyle]}>
          {conversion.original}
        </Text>
        <Text style={[styles.convertedAmount, { color: colors.textSecondary }, textStyle]}>
          ≈ {conversion.converted}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.amount, { color: colors.text }, textStyle]}>
        {formatCurrencyDetailed(displayAmount, displayCurrency)}
      </Text>
      
      {showToggle && fromCurrency !== toCurrency && (
        <TouchableOpacity 
          style={[styles.toggleButton, { backgroundColor: colors.primary[100] }]}
          onPress={handleToggle}
        >
          <Text style={[styles.toggleText, { color: colors.primary[700] }]}>
            {isConverted ? fromCurrency : toCurrency}
          </Text>
          <Ionicons 
            name="swap-horizontal" 
            size={12} 
            color={colors.primary[700]} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export const CurrencyToggleButton = ({ 
  currentCurrency, 
  alternateCurrency = 'USD',
  onToggle,
  style = {} 
}) => {
  const { colors } = useTheme();
  const [isAlternate, setIsAlternate] = useState(false);

  const handlePress = () => {
    setIsAlternate(!isAlternate);
    if (onToggle) {
      onToggle(isAlternate ? currentCurrency : alternateCurrency);
    }
  };

  const displayCurrency = isAlternate ? alternateCurrency : currentCurrency;
  const currencyInfo = SUPPORTED_CURRENCIES[displayCurrency];

  return (
    <TouchableOpacity
      style={[styles.currencyToggle, { backgroundColor: colors.surface }, style]}
      onPress={handlePress}
    >
      <Text style={styles.currencyFlag}>{currencyInfo?.flag}</Text>
      <Text style={[styles.currencyCode, { color: colors.text }]}>
        {displayCurrency}
      </Text>
      <Ionicons 
        name="swap-horizontal" 
        size={16} 
        color={colors.primary[500]} 
      />
    </TouchableOpacity>
  );
};

export const CurrencySelector = ({ 
  selectedCurrency,
  onCurrencySelect,
  currencies = Object.keys(SUPPORTED_CURRENCIES),
  style = {},
  buttonStyle = {},
  showFlag = true,
  showName = false
}) => {
  const { colors } = useTheme();

  const selectedInfo = SUPPORTED_CURRENCIES[selectedCurrency];

  return (
    <TouchableOpacity
      style={[
        styles.currencySelector, 
        { backgroundColor: colors.surface, borderColor: colors.border },
        buttonStyle
      ]}
      onPress={() => {
        // This would typically open a modal or picker
        // For now, we'll cycle through currencies
        const currentIndex = currencies.indexOf(selectedCurrency);
        const nextIndex = (currentIndex + 1) % currencies.length;
        onCurrencySelect(currencies[nextIndex]);
      }}
    >
      <View style={styles.selectorContent}>
        {showFlag && (
          <Text style={styles.currencyFlag}>{selectedInfo?.flag}</Text>
        )}
        <Text style={[styles.currencyCode, { color: colors.text }]}>
          {selectedCurrency}
        </Text>
        {showName && (
          <Text style={[styles.currencyName, { color: colors.textSecondary }]}>
            {selectedInfo?.name}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-down" size={16} color={colors.gray[400]} />
    </TouchableOpacity>
  );
};

export const CurrencyDisplayWidget = ({ 
  amounts = [], // Array of { amount, currency, label }
  viewCurrency = 'USD',
  style = {}
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.widget, { backgroundColor: colors.surface }, style]}>
      <View style={[styles.widgetHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.widgetTitle, { color: colors.text }]}>
          Financial Summary
        </Text>
        <Text style={[styles.widgetCurrency, { color: colors.primary[600] }]}>
          in {viewCurrency}
        </Text>
      </View>
      
      <View style={styles.widgetContent}>
        {amounts.map((item, index) => {
          const convertedAmount = item.currency === viewCurrency 
            ? item.amount 
            : convertCurrency(item.amount, item.currency, viewCurrency);
            
          return (
            <View key={index} style={styles.widgetItem}>
              <Text style={[styles.widgetLabel, { color: colors.textSecondary }]}>
                {item.label}
              </Text>
              <Text style={[styles.widgetAmount, { color: colors.text }]}>
                {formatCurrencyDetailed(convertedAmount, viewCurrency)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('xs'),
  },
  amount: {
    fontSize: getFontSize('base'),
    fontFamily: getFont('semibold'),
  },
  zeroAmount: {
    fontSize: getFontSize('base'),
    fontFamily: getFont('regular'),
    fontStyle: 'italic',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getSpacing('xs'),
    paddingVertical: 2,
    borderRadius: getBorderRadius('sm'),
    gap: 2,
  },
  toggleText: {
    fontSize: getFontSize('xs'),
    fontFamily: getFont('medium'),
  },
  bothContainer: {
    gap: getSpacing('xs'),
  },
  originalAmount: {
    fontSize: getFontSize('base'),
    fontFamily: getFont('semibold'),
  },
  convertedAmount: {
    fontSize: getFontSize('sm'),
    fontFamily: getFont('regular'),
    fontStyle: 'italic',
  },
  currencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getSpacing('sm'),
    paddingVertical: getSpacing('xs'),
    borderRadius: getBorderRadius('md'),
    gap: getSpacing('xs'),
  },
  currencyFlag: {
    fontSize: 16,
  },
  currencyCode: {
    fontSize: getFontSize('sm'),
    fontFamily: getFont('semibold'),
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing('md'),
    paddingVertical: getSpacing('sm'),
    borderRadius: getBorderRadius('lg'),
    borderWidth: 1,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing('sm'),
    flex: 1,
  },
  currencyName: {
    fontSize: getFontSize('sm'),
    fontFamily: getFont('regular'),
    flex: 1,
  },
  widget: {
    borderRadius: getBorderRadius('lg'),
    padding: getSpacing('md'),
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: getSpacing('sm'),
    borderBottomWidth: 1,
    marginBottom: getSpacing('sm'),
  },
  widgetTitle: {
    fontSize: getFontSize('md'),
    fontFamily: getFont('semibold'),
  },
  widgetCurrency: {
    fontSize: getFontSize('sm'),
    fontFamily: getFont('medium'),
  },
  widgetContent: {
    gap: getSpacing('sm'),
  },
  widgetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  widgetLabel: {
    fontSize: getFontSize('sm'),
    fontFamily: getFont('regular'),
  },
  widgetAmount: {
    fontSize: getFontSize('base'),
    fontFamily: getFont('semibold'),
  },
});

export default CurrencyConverter;