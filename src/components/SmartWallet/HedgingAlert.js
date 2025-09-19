import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';

export default function HedgingAlert({ 
  visible, 
  onClose, 
  recommendations = [], 
  riskScore = 0 
}) {
  const getRiskLevel = (score) => {
    if (score < 30) return { level: 'LOW', color: '#27ae60', icon: '✅' };
    if (score < 60) return { level: 'MEDIUM', color: '#f39c12', icon: '⚠️' };
    return { level: 'HIGH', color: '#e74c3c', icon: '🚨' };
  };

  const risk = getRiskLevel(riskScore);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.alertIcon}>
              <Text style={styles.iconText}>{risk.icon}</Text>
            </View>
            <Text style={styles.title}>Currency Risk Alert</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Risk Score Display */}
          <View style={[styles.riskCard, { borderLeftColor: risk.color }]}>
            <View style={styles.riskHeader}>
              <Text style={styles.riskTitle}>Current Risk Level</Text>
              <View style={[styles.riskBadge, { backgroundColor: risk.color }]}>
                <Text style={styles.riskBadgeText}>{risk.level}</Text>
              </View>
            </View>
            <Text style={styles.riskScore}>{Math.round(riskScore)}/100</Text>
            <View style={styles.riskBar}>
              <View 
                style={[
                  styles.riskProgress, 
                  { width: `${riskScore}%`, backgroundColor: risk.color }
                ]} 
              />
            </View>
          </View>

          {/* Recommendations */}
          <ScrollView style={styles.recommendationsContainer}>
            <Text style={styles.sectionTitle}>🎯 Recommendations</Text>
            
            {recommendations.length > 0 ? (
              recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationCard}>
                  <View style={styles.recommendationHeader}>
                    <Text style={styles.recommendationType}>
                      {rec.type === 'HIGH_RISK' ? '🔴' : '🟡'} {rec.type.replace('_', ' ')}
                    </Text>
                  </View>
                  <Text style={styles.recommendationMessage}>{rec.message}</Text>
                  
                  {rec.action && (
                    <TouchableOpacity style={styles.actionButton}>
                      <Text style={styles.actionButtonText}>
                        {rec.action === 'hedge' ? '🛡️ Learn About Hedging' : 
                         rec.action === 'diversify' ? '📊 Diversify Portfolio' : 
                         '💡 Get Advice'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {rec.suggestion && (
                    <View style={styles.suggestionBox}>
                      <Text style={styles.suggestionLabel}>💡 Suggestion:</Text>
                      <Text style={styles.suggestionText}>
                        Consider increasing exposure to: {rec.suggestion.join(', ')}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.noRecommendations}>
                <Text style={styles.noRecommendationsText}>
                  ✅ Your currency exposure looks well balanced!
                </Text>
              </View>
            )}

            {/* Educational Content */}
            <View style={styles.educationCard}>
              <Text style={styles.educationTitle}>💡 About Currency Risk</Text>
              <Text style={styles.educationText}>
                Currency risk arises from holding assets in multiple currencies. 
                Exchange rate fluctuations can impact your portfolio value.
              </Text>
              
              <View style={styles.educationTips}>
                <Text style={styles.tipTitle}>Quick Tips:</Text>
                <Text style={styles.tip}>• Diversify across stable currencies</Text>
                <Text style={styles.tip}>• Monitor African currency trends</Text>
                <Text style={styles.tip}>• Consider hedging large exposures</Text>
                <Text style={styles.tip}>• Keep some USD as a stable base</Text>
              </View>
            </View>

            {/* African Market Specific Advice */}
            <View style={styles.africaCard}>
              <Text style={styles.africaTitle}>🌍 African Market Insights</Text>
              <Text style={styles.africaText}>
                African currencies can be volatile due to commodity prices, 
                political events, and global economic conditions.
              </Text>
              
              <View style={styles.marketTips}>
                <Text style={styles.marketTip}>
                  📈 NGN: Monitor oil prices and CBN policies
                </Text>
                <Text style={styles.marketTip}>
                  ⛏️ ZAR: Influenced by mining sector and global risk sentiment
                </Text>
                <Text style={styles.marketTip}>
                  ☕ KES: Stable due to diverse economy and strong institutions
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.learnButton]}
              onPress={() => {
                // TODO: Navigate to educational content
                console.log('Navigate to currency education');
              }}
            >
              <Text style={styles.learnButtonText}>📚 Learn More</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.dismissButton]}
              onPress={onClose}
            >
              <Text style={styles.dismissButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff2e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#666',
  },
  riskCard: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riskBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  riskScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  riskBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  riskProgress: {
    height: '100%',
    borderRadius: 3,
  },
  recommendationsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  recommendationCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#f39c12',
  },
  recommendationHeader: {
    marginBottom: 8,
  },
  recommendationType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  recommendationMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: '#2E7D8F',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionBox: {
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    padding: 12,
  },
  suggestionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D8F',
    marginBottom: 4,
  },
  suggestionText: {
    fontSize: 12,
    color: '#2E7D8F',
  },
  noRecommendations: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  noRecommendationsText: {
    fontSize: 14,
    color: '#27ae60',
    textAlign: 'center',
  },
  educationCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  educationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D8F',
    marginBottom: 8,
  },
  educationText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  educationTips: {
    marginTop: 8,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D8F',
    marginBottom: 6,
  },
  tip: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    marginBottom: 2,
  },
  africaCard: {
    backgroundColor: '#fff8e5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  africaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f39c12',
    marginBottom: 8,
  },
  africaText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  marketTips: {
    marginTop: 8,
  },
  marketTip: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    marginBottom: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  learnButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#2E7D8F',
  },
  dismissButton: {
    backgroundColor: '#2E7D8F',
  },
  learnButtonText: {
    color: '#2E7D8F',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});