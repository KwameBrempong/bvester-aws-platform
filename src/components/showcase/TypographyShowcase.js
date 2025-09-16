/**
 * Typography Showcase Component
 * Demonstrates the enhanced typography system for BizInvest Hub
 */

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getFont } from '../../config/fonts';
import { 
  getEnhancedColor, 
  getSpacing, 
  getFontSize 
} from '../../styles/enhancedDesignSystem';

export const TypographyShowcase = ({ onClose }) => {
  const { colors, isDark, toggleTheme } = useTheme();

  const financialSamples = [
    { label: 'Revenue', value: '$1,234,567.89', trend: '+12.5%' },
    { label: 'Profit Margin', value: '24.8%', trend: '+2.1%' },
    { label: 'Cash Flow', value: '$456,789.00', trend: '+8.7%' },
    { label: 'ROI', value: '32.4%', trend: '+5.3%' }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { 
          color: colors.text,
          fontFamily: getFont('bold')
        }]}>
          Typography Showcase
        </Text>
        
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.themeToggle, { backgroundColor: colors.surface }]}
            onPress={toggleTheme}
          >
            <Ionicons 
              name={isDark ? 'sunny' : 'moon'} 
              size={20} 
              color={colors.text} 
            />
          </Pressable>
          
          <Pressable
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Typography Hierarchy */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { 
          color: colors.text,
          fontFamily: getFont('semibold')
        }]}>
          Typography Hierarchy
        </Text>

        <View style={styles.typeScale}>
          <View style={styles.typeItem}>
            <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>
              Display (72px)
            </Text>
            <Text style={[styles.displayText, { 
              color: colors.text,
              fontFamily: getFont('bold')
            }]}>
              $2.4M
            </Text>
          </View>

          <View style={styles.typeItem}>
            <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>
              Heading 1 (36px)
            </Text>
            <Text style={[styles.h1Text, { 
              color: colors.text,
              fontFamily: getFont('bold')
            }]}>
              Investment Dashboard
            </Text>
          </View>

          <View style={styles.typeItem}>
            <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>
              Heading 2 (30px)
            </Text>
            <Text style={[styles.h2Text, { 
              color: colors.text,
              fontFamily: getFont('semibold')
            }]}>
              Business Analytics
            </Text>
          </View>

          <View style={styles.typeItem}>
            <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>
              Heading 3 (24px)
            </Text>
            <Text style={[styles.h3Text, { 
              color: colors.text,
              fontFamily: getFont('semibold')
            }]}>
              Financial Metrics
            </Text>
          </View>

          <View style={styles.typeItem}>
            <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>
              Body Large (18px)
            </Text>
            <Text style={[styles.bodyLargeText, { 
              color: colors.text,
              fontFamily: getFont('regular')
            }]}>
              Your business shows strong growth potential with consistent revenue streams.
            </Text>
          </View>

          <View style={styles.typeItem}>
            <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>
              Body (16px)
            </Text>
            <Text style={[styles.bodyText, { 
              color: colors.text,
              fontFamily: getFont('regular')
            }]}>
              Monitor your key performance indicators and make data-driven decisions.
            </Text>
          </View>

          <View style={styles.typeItem}>
            <Text style={[styles.typeLabel, { color: colors.textSecondary }]}>
              Caption (13px)
            </Text>
            <Text style={[styles.captionText, { 
              color: colors.textSecondary,
              fontFamily: getFont('medium')
            }]}>
              Last updated: 2 minutes ago
            </Text>
          </View>
        </View>
      </View>

      {/* Financial Data Typography */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { 
          color: colors.text,
          fontFamily: getFont('semibold')
        }]}>
          Financial Data Display
        </Text>

        <View style={styles.financialGrid}>
          {financialSamples.map((item, index) => (
            <View 
              key={index} 
              style={[styles.financialCard, { 
                backgroundColor: colors.surface,
                borderColor: colors.border
              }]}
            >
              <Text style={[styles.financialLabel, { 
                color: colors.textSecondary,
                fontFamily: getFont('medium')
              }]}>
                {item.label}
              </Text>
              
              <Text style={[styles.financialValue, { 
                color: colors.text,
                fontFamily: getFont('mono')
              }]}>
                {item.value}
              </Text>
              
              <Text style={[styles.financialTrend, { 
                color: getEnhancedColor('success.500'),
                fontFamily: getFont('semibold')
              }]}>
                {item.trend}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Font Weights */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { 
          color: colors.text,
          fontFamily: getFont('semibold')
        }]}>
          Font Weights
        </Text>

        <View style={styles.weightGrid}>
          {[
            { weight: 'regular', label: 'Regular (400)' },
            { weight: 'medium', label: 'Medium (500)' },
            { weight: 'semibold', label: 'Semibold (600)' },
            { weight: 'bold', label: 'Bold (700)' }
          ].map((item, index) => (
            <View key={index} style={styles.weightItem}>
              <Text style={[styles.weightLabel, { color: colors.textSecondary }]}>
                {item.label}
              </Text>
              <Text style={[styles.weightSample, { 
                color: colors.text,
                fontFamily: getFont(item.weight)
              }]}>
                The quick brown fox jumps over the lazy dog
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Monospace Typography */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { 
          color: colors.text,
          fontFamily: getFont('semibold')
        }]}>
          Monospace (Financial Data)
        </Text>

        <View style={[styles.monoContainer, { 
          backgroundColor: colors.surface,
          borderColor: colors.border
        }]}>
          <Text style={[styles.monoSample, { 
            color: colors.text,
            fontFamily: getFont('mono')
          }]}>
            {`Revenue:     $1,234,567.89
Expenses:    $  987,654.32
Profit:      $  246,913.57
Margin:           20.00%`}
          </Text>
        </View>
      </View>

      {/* Color Combinations */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { 
          color: colors.text,
          fontFamily: getFont('semibold')
        }]}>
          Color Combinations
        </Text>

        <View style={styles.colorGrid}>
          <View style={[styles.colorCard, { backgroundColor: getEnhancedColor('primary.50') }]}>
            <Text style={[styles.colorTitle, { 
              color: getEnhancedColor('primary.700'),
              fontFamily: getFont('semibold')
            }]}>
              Primary Text
            </Text>
            <Text style={[styles.colorBody, { 
              color: getEnhancedColor('primary.600'),
              fontFamily: getFont('regular')
            }]}>
              Investment opportunities and portfolio growth metrics.
            </Text>
          </View>

          <View style={[styles.colorCard, { backgroundColor: getEnhancedColor('success.50') }]}>
            <Text style={[styles.colorTitle, { 
              color: getEnhancedColor('success.700'),
              fontFamily: getFont('semibold')
            }]}>
              Success Text
            </Text>
            <Text style={[styles.colorBody, { 
              color: getEnhancedColor('success.600'),
              fontFamily: getFont('regular')
            }]}>
              Positive returns and profitable investment outcomes.
            </Text>
          </View>

          <View style={[styles.colorCard, { backgroundColor: getEnhancedColor('warning.50') }]}>
            <Text style={[styles.colorTitle, { 
              color: getEnhancedColor('warning.700'),
              fontFamily: getFont('semibold')
            }]}>
              Warning Text
            </Text>
            <Text style={[styles.colorBody, { 
              color: getEnhancedColor('warning.600'),
              fontFamily: getFont('regular')
            }]}>
              Risk assessment and cautionary investment advice.
            </Text>
          </View>
        </View>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getSpacing('lg'),
    borderBottomWidth: 1
  },
  
  headerTitle: {
    fontSize: getFontSize('2xl'),
    letterSpacing: -0.5
  },
  
  headerActions: {
    flexDirection: 'row',
    gap: getSpacing('sm')
  },
  
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  section: {
    padding: getSpacing('lg')
  },
  
  sectionTitle: {
    fontSize: getFontSize('xl'),
    marginBottom: getSpacing('lg'),
    letterSpacing: -0.3
  },
  
  typeScale: {
    gap: getSpacing('lg')
  },
  
  typeItem: {
    gap: getSpacing('sm')
  },
  
  typeLabel: {
    fontSize: getFontSize('xs'),
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  
  displayText: {
    fontSize: 72,
    letterSpacing: -2
  },
  
  h1Text: {
    fontSize: getFontSize('4xl'),
    letterSpacing: -0.8
  },
  
  h2Text: {
    fontSize: getFontSize('3xl'),
    letterSpacing: -0.6
  },
  
  h3Text: {
    fontSize: getFontSize('2xl'),
    letterSpacing: -0.4
  },
  
  bodyLargeText: {
    fontSize: getFontSize('lg'),
    lineHeight: getFontSize('lg') * 1.5
  },
  
  bodyText: {
    fontSize: getFontSize('base'),
    lineHeight: getFontSize('base') * 1.5
  },
  
  captionText: {
    fontSize: getFontSize('sm'),
    letterSpacing: 0.3
  },
  
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing('md')
  },
  
  financialCard: {
    flex: 1,
    minWidth: 150,
    padding: getSpacing('md'),
    borderRadius: 12,
    borderWidth: 1,
    gap: getSpacing('xs')
  },
  
  financialLabel: {
    fontSize: getFontSize('sm'),
    letterSpacing: 0.2
  },
  
  financialValue: {
    fontSize: getFontSize('xl'),
    letterSpacing: -0.3
  },
  
  financialTrend: {
    fontSize: getFontSize('sm'),
    letterSpacing: 0.3
  },
  
  weightGrid: {
    gap: getSpacing('md')
  },
  
  weightItem: {
    gap: getSpacing('xs')
  },
  
  weightLabel: {
    fontSize: getFontSize('xs'),
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  
  weightSample: {
    fontSize: getFontSize('base')
  },
  
  monoContainer: {
    padding: getSpacing('md'),
    borderRadius: 8,
    borderWidth: 1
  },
  
  monoSample: {
    fontSize: getFontSize('sm'),
    lineHeight: getFontSize('sm') * 1.4
  },
  
  colorGrid: {
    gap: getSpacing('md')
  },
  
  colorCard: {
    padding: getSpacing('md'),
    borderRadius: 12,
    gap: getSpacing('sm')
  },
  
  colorTitle: {
    fontSize: getFontSize('base'),
    letterSpacing: -0.2
  },
  
  colorBody: {
    fontSize: getFontSize('sm'),
    lineHeight: getFontSize('sm') * 1.4
  }
});

export default TypographyShowcase;