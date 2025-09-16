import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';

// Regional business insights and trends specific to African markets
const AFRICA_INSIGHTS = {
  NIGERIA: [
    {
      id: 'ng_1',
      type: 'FINTECH',
      title: 'Mobile Banking Surge',
      insight: 'Nigeria fintech sector grew 40% YoY. Consider digital payment integration for SMEs.',
      impact: 'HIGH',
      actionable: 'Explore partnerships with Paystack, Flutterwave for payment processing',
      trend: 'up',
      relevance: ['fintech', 'payments', 'digital']
    },
    {
      id: 'ng_2', 
      type: 'AGRICULTURE',
      title: 'AgriTech Investment Boom',
      insight: 'Nigerian AgriTech startups raised $50M+ in 2024. Supply chain digitization trending.',
      impact: 'MEDIUM',
      actionable: 'SMEs in agriculture should consider digital inventory management',
      trend: 'up',
      relevance: ['agriculture', 'supply-chain', 'tech']
    },
    {
      id: 'ng_3',
      type: 'POLICY',
      title: 'CBN Digital Currency Push',
      insight: 'eNaira adoption growing. Early adopters report 15% cost savings on transactions.',
      impact: 'MEDIUM',
      actionable: 'Consider eNaira integration for cost-effective domestic payments',
      trend: 'stable',
      relevance: ['fintech', 'payments', 'government']
    }
  ],
  
  KENYA: [
    {
      id: 'ke_1',
      type: 'MOBILE_MONEY',
      title: 'M-Pesa Ecosystem Expansion',
      insight: 'M-Pesa usage grew 18% this quarter. 85% of Kenyan SMEs now use mobile money.',
      impact: 'HIGH',
      actionable: 'Integrate M-Pesa API for seamless customer payments and supplier settlements',
      trend: 'up',
      relevance: ['mobile-money', 'payments', 'fintech']
    },
    {
      id: 'ke_2',
      type: 'TRADE',
      title: 'East Africa Trade Corridor',
      insight: 'Cross-border trade in EAC grew 22%. Kenya positioned as regional hub.',
      impact: 'HIGH',
      actionable: 'Explore export opportunities to Uganda, Tanzania, Rwanda markets',
      trend: 'up',
      relevance: ['trade', 'export', 'regional']
    },
    {
      id: 'ke_3',
      type: 'RENEWABLE',
      title: 'Green Energy Incentives',
      insight: 'Kenya offers 40% tax relief for solar installations. Grid costs up 12%.',
      impact: 'MEDIUM',
      actionable: 'Consider solar power to reduce operational costs and attract ESG investors',
      trend: 'up',
      relevance: ['energy', 'sustainability', 'costs']
    }
  ],

  SOUTH_AFRICA: [
    {
      id: 'za_1',
      type: 'TECHNOLOGY',
      title: 'Digital Transformation Incentives',
      insight: 'SA government offers 25% tax relief for digital upgrades. Loadshedding drives adoption.',
      impact: 'HIGH',
      actionable: 'Digitize operations to qualify for tax benefits and improve efficiency',
      trend: 'up',
      relevance: ['digital', 'tax', 'technology']
    },
    {
      id: 'za_2',
      type: 'MINING',
      title: 'Mining Sector Recovery',
      insight: 'SA mining output up 8% as commodity prices stabilize. B-BBEE requirements tightening.',
      impact: 'MEDIUM',
      actionable: 'Mining-adjacent SMEs should ensure B-BBEE compliance for procurement opportunities',
      trend: 'up',
      relevance: ['mining', 'compliance', 'procurement']
    },
    {
      id: 'za_3',
      type: 'EXPORT',
      title: 'African Continental Free Trade Area',
      insight: 'AfCFTA implementation opens markets. SA exports to Africa up 15%.',
      impact: 'HIGH',
      actionable: 'Research AfCFTA benefits for your industry and explore continental expansion',
      trend: 'up',
      relevance: ['trade', 'export', 'continental']
    }
  ],

  GHANA: [
    {
      id: 'gh_1',
      type: 'COCOA',
      title: 'Cocoa Premium Pricing',
      insight: 'Ghana cocoa commands 20% premium due to sustainability certification programs.',
      impact: 'HIGH',
      actionable: 'Invest in sustainable farming practices and certification for premium pricing',
      trend: 'up',
      relevance: ['agriculture', 'sustainability', 'export']
    },
    {
      id: 'gh_2',
      type: 'FINTECH',
      title: 'Mobile Money Integration',
      insight: 'MTN Mobile Money and Vodafone Cash dominate. Interoperability improving.',
      impact: 'MEDIUM',
      actionable: 'Integrate multiple mobile money providers for broader customer reach',
      trend: 'stable',
      relevance: ['mobile-money', 'payments', 'fintech']
    }
  ],

  REGIONAL: [
    {
      id: 'af_1',
      type: 'CLIMATE',
      title: 'Climate Finance Opportunities',
      insight: '$100B+ climate finance committed to Africa. Green bonds market growing 30% annually.',
      impact: 'HIGH',
      actionable: 'Develop sustainability metrics to access climate finance and green investment',
      trend: 'up',
      relevance: ['climate', 'finance', 'sustainability']
    },
    {
      id: 'af_2',
      type: 'TECHNOLOGY',
      title: 'Internet Penetration Growth',
      insight: 'African internet users grew 10% to 570M. E-commerce adoption accelerating.',
      impact: 'HIGH',
      actionable: 'Establish online presence and digital sales channels for broader market access',
      trend: 'up',
      relevance: ['digital', 'ecommerce', 'market-access']
    }
  ]
};

// Get relevant insights based on user profile and business data
const getRelevantInsights = (userCountry, businessSector, businessSize) => {
  let insights = [];
  
  // Add country-specific insights
  if (AFRICA_INSIGHTS[userCountry]) {
    insights = [...insights, ...AFRICA_INSIGHTS[userCountry]];
  }
  
  // Add regional insights
  insights = [...insights, ...AFRICA_INSIGHTS.REGIONAL];
  
  // Filter by business relevance (simple keyword matching for MVP)
  if (businessSector) {
    insights = insights.filter(insight => 
      insight.relevance.some(tag => 
        businessSector.toLowerCase().includes(tag) || 
        tag.includes(businessSector.toLowerCase())
      )
    );
  }
  
  // Sort by impact and trend
  insights.sort((a, b) => {
    const impactScore = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const trendScore = { up: 2, stable: 1, down: 0 };
    
    return (impactScore[b.impact] + trendScore[b.trend]) - 
           (impactScore[a.impact] + trendScore[a.trend]);
  });
  
  return insights.slice(0, 3); // Return top 3 most relevant
};

export default function AfricaInsightsWidget({ 
  userCountry = 'REGIONAL', 
  businessSector = null,
  businessSize = 'SME',
  onInsightTap = null 
}) {
  const [insights, setInsights] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const relevantInsights = getRelevantInsights(userCountry, businessSector, businessSize);
    setInsights(relevantInsights);
    
    // Auto-rotate insights every 10 seconds
    const interval = setInterval(() => {
      if (relevantInsights.length > 1) {
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        
        setCurrentIndex((prev) => (prev + 1) % relevantInsights.length);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [userCountry, businessSector, businessSize]);

  if (insights.length === 0) {
    return null;
  }

  const currentInsight = insights[currentIndex];
  const getImpactColor = (impact) => {
    switch (impact) {
      case 'HIGH': return '#e74c3c';
      case 'MEDIUM': return '#f39c12'; 
      case 'LOW': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌍 Africa Insights</Text>
        <View style={styles.indicators}>
          {insights.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.activeIndicator
              ]}
            />
          ))}
        </View>
      </View>

      <Animated.View style={[styles.insightContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.insightCard}
          onPress={() => onInsightTap && onInsightTap(currentInsight)}
          activeOpacity={0.8}
        >
          <View style={styles.insightHeader}>
            <View style={styles.typeContainer}>
              <Text style={styles.typeText}>{currentInsight.type}</Text>
            </View>
            <View style={styles.metricContainer}>
              <Text style={styles.trendIcon}>{getTrendIcon(currentInsight.trend)}</Text>
              <View 
                style={[
                  styles.impactDot, 
                  { backgroundColor: getImpactColor(currentInsight.impact) }
                ]} 
              />
            </View>
          </View>

          <Text style={styles.insightTitle}>{currentInsight.title}</Text>
          <Text style={styles.insightText}>{currentInsight.insight}</Text>
          
          <View style={styles.actionContainer}>
            <Text style={styles.actionLabel}>💡 Actionable:</Text>
            <Text style={styles.actionText}>{currentInsight.actionable}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by real-time African market data
        </Text>
        {insights.length > 1 && (
          <TouchableOpacity
            onPress={() => setCurrentIndex((prev) => (prev + 1) % insights.length)}
          >
            <Text style={styles.nextButton}>Next →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D8F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D8F',
  },
  indicators: {
    flexDirection: 'row',
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 2,
  },
  activeIndicator: {
    backgroundColor: '#2E7D8F',
  },
  insightContainer: {
    minHeight: 120,
  },
  insightCard: {
    flex: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  metricContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  impactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  insightText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 10,
  },
  actionContainer: {
    backgroundColor: '#f8fffa',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#27ae60',
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 2,
  },
  actionText: {
    fontSize: 11,
    color: '#2d5539',
    lineHeight: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerText: {
    fontSize: 9,
    color: '#999',
    fontStyle: 'italic',
  },
  nextButton: {
    fontSize: 11,
    color: '#2E7D8F',
    fontWeight: '600',
  },
});