/**
 * Enhancement Test Screen
 * Test screen to verify Phase 1 UI/UX enhancements
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  Alert
} from 'react-native';
import { 
  Button,
  EnhancedMetricCard,
  ProfessionalHeader,
  useTheme,
  getEnhancedColor,
  getSpacing,
  getFontSize,
  getFont
} from '../../components/ui';
import TypographyShowcase from '../../components/showcase/TypographyShowcase';

export default function EnhancementTestScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const [showTypography, setShowTypography] = useState(false);

  const testMetrics = [
    {
      title: 'Monthly Revenue',
      value: '$45,000',
      trend: 'up',
      trendValue: '+12%',
      icon: 'cash-outline',
      color: getEnhancedColor('primary.500'),
      sparklineData: [1.0, 1.2, 0.8, 1.5, 1.3, 1.8, 1.6]
    },
    {
      title: 'Growth Rate',
      value: '28%',
      trend: 'up',
      trendValue: '+5%',
      icon: 'trending-up-outline',
      color: getEnhancedColor('success.500'),
      sparklineData: [0.8, 1.0, 1.1, 1.3, 1.2, 1.4, 1.5]
    },
    {
      title: 'Investment Score',
      value: '85/100',
      trend: 'up',
      trendValue: '+8 pts',
      icon: 'star-outline',
      color: getEnhancedColor('warning.500'),
      sparklineData: [0.7, 0.8, 0.85, 0.82, 0.87, 0.85, 0.9]
    },
    {
      title: 'Active Investors',
      value: '23',
      trend: 'up',
      trendValue: '+3',
      icon: 'people-outline',
      color: getEnhancedColor('secondary.500'),
      sparklineData: [18, 19, 20, 22, 21, 23, 23]
    }
  ];

  if (showTypography) {
    return (
      <TypographyShowcase onClose={() => setShowTypography(false)} />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Professional Header Test */}
        <ProfessionalHeader
          userInfo={{
            name: 'John Doe',
            businessName: 'Tech Innovations Ltd',
            subtitle: 'Investment Portfolio Manager'
          }}
          notificationCount={5}
          variant="premium"
          onNotificationPress={() => Alert.alert('Notifications', 'Notifications pressed!')}
          onProfilePress={() => Alert.alert('Profile', 'Profile pressed!')}
        />

        {/* Test Content */}
        <View style={styles.content}>
          {/* Theme Toggle Section */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { 
              color: colors.text,
              fontFamily: getFont('semibold')
            }]}>
              Phase 1 Enhancement Test
            </Text>
            
            <Text style={[styles.sectionDescription, { 
              color: colors.textSecondary,
              fontFamily: getFont('regular')
            }]}>
              Testing enhanced design system, typography, and theme switching
            </Text>

            <View style={styles.buttonRow}>
              <Button
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                onPress={toggleTheme}
                variant="secondary"
                icon={isDark ? 'sunny' : 'moon'}
                size="md"
              />
              
              <Button
                title="View Typography"
                onPress={() => setShowTypography(true)}
                variant="outline"
                icon="text-outline"
                size="md"
              />
            </View>
          </View>

          {/* Enhanced Metric Cards Test */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { 
              color: colors.text,
              fontFamily: getFont('semibold')
            }]}>
              Enhanced Metric Cards
            </Text>

            <View style={styles.metricsGrid}>
              {testMetrics.map((metric, index) => (
                <EnhancedMetricCard
                  key={index}
                  {...metric}
                  variant="premium"
                  showSparkline={true}
                  animated={true}
                  onPress={() => Alert.alert('Metric', `${metric.title} pressed!`)}
                  style={styles.metricCard}
                />
              ))}
            </View>
          </View>

          {/* Button Variants Test */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { 
              color: colors.text,
              fontFamily: getFont('semibold')
            }]}>
              Enhanced Button Components
            </Text>

            <View style={styles.buttonGrid}>
              <Button
                title="Primary Button"
                variant="primary"
                size="md"
                icon="checkmark-circle-outline"
                onPress={() => Alert.alert('Primary', 'Primary button pressed!')}
              />
              
              <Button
                title="Gradient Button"
                gradient="primary"
                size="md"
                icon="rocket-outline"
                onPress={() => Alert.alert('Gradient', 'Gradient button pressed!')}
              />
              
              <Button
                title="Success Button"
                variant="success"
                size="md"
                icon="thumbs-up-outline"
                onPress={() => Alert.alert('Success', 'Success button pressed!')}
              />
              
              <Button
                title="Secondary Button"
                variant="secondary"
                size="md"
                icon="settings-outline"
                onPress={() => Alert.alert('Secondary', 'Secondary button pressed!')}
              />
            </View>
          </View>

          {/* Typography Test */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { 
              color: colors.text,
              fontFamily: getFont('semibold')
            }]}>
              Enhanced Typography
            </Text>

            <View style={styles.typographyTest}>
              <Text style={[styles.displayText, { 
                color: colors.text,
                fontFamily: getFont('bold')
              }]}>
                $2.4M
              </Text>
              
              <Text style={[styles.headingText, { 
                color: colors.text,
                fontFamily: getFont('semibold')
              }]}>
                Total Investment Value
              </Text>
              
              <Text style={[styles.bodyText, { 
                color: colors.textSecondary,
                fontFamily: getFont('regular')
              }]}>
                Your portfolio has grown significantly with consistent returns across all investment categories.
              </Text>
              
              <Text style={[styles.monoText, { 
                color: colors.text,
                fontFamily: getFont('mono')
              }]}>
                ROI: 24.8% | Profit: +$456,789
              </Text>
            </View>
          </View>

          {/* Status Section */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { 
              color: colors.text,
              fontFamily: getFont('semibold')
            }]}>
              Phase 1 Status
            </Text>

            <View style={styles.statusList}>
              {[
                { item: 'Enhanced Design System', status: '✅ Completed' },
                { item: 'Premium Typography', status: '✅ Completed' },
                { item: 'Theme Context', status: '✅ Completed' },
                { item: 'Enhanced Components', status: '✅ Completed' },
                { item: 'Font Loading System', status: '✅ Completed' }
              ].map((item, index) => (
                <View key={index} style={styles.statusItem}>
                  <Text style={[styles.statusText, { 
                    color: colors.text,
                    fontFamily: getFont('medium')
                  }]}>
                    {item.item}
                  </Text>
                  <Text style={[styles.statusIndicator, { 
                    color: getEnhancedColor('success.600'),
                    fontFamily: getFont('semibold')
                  }]}>
                    {item.status}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  
  content: {
    flex: 1
  },
  
  section: {
    padding: getSpacing('lg'),
    marginBottom: getSpacing('md')
  },
  
  sectionTitle: {
    fontSize: getFontSize('xl'),
    marginBottom: getSpacing('sm'),
    letterSpacing: -0.3
  },
  
  sectionDescription: {
    fontSize: getFontSize('base'),
    lineHeight: getFontSize('base') * 1.5,
    marginBottom: getSpacing('lg')
  },
  
  buttonRow: {
    flexDirection: 'row',
    gap: getSpacing('md'),
    flexWrap: 'wrap'
  },
  
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getSpacing('md')
  },
  
  metricCard: {
    flex: 1,
    minWidth: 150
  },
  
  buttonGrid: {
    gap: getSpacing('md')
  },
  
  typographyTest: {
    gap: getSpacing('md'),
    alignItems: 'center'
  },
  
  displayText: {
    fontSize: 48,
    letterSpacing: -1.5
  },
  
  headingText: {
    fontSize: getFontSize('2xl'),
    letterSpacing: -0.5
  },
  
  bodyText: {
    fontSize: getFontSize('base'),
    lineHeight: getFontSize('base') * 1.5,
    textAlign: 'center'
  },
  
  monoText: {
    fontSize: getFontSize('sm'),
    letterSpacing: 0.5
  },
  
  statusList: {
    gap: getSpacing('md')
  },
  
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getSpacing('sm')
  },
  
  statusText: {
    fontSize: getFontSize('base'),
    flex: 1
  },
  
  statusIndicator: {
    fontSize: getFontSize('sm'),
    letterSpacing: 0.3
  },
  
  bottomSpace: {
    height: getSpacing('2xl')
  }
});