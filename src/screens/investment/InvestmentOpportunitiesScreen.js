/**
 * 💎 INVESTMENT OPPORTUNITIES SCREEN
 * Browse and filter investment opportunities in African SMEs
 */

import React, { useState, useEffect, useContext } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const { width } = Dimensions.get('window');

// Sample opportunities data - commented out for production empty state
const MOCK_OPPORTUNITIES = [
  // {
  //   id: 'opp_001',
  //   title: 'GreenTech Solar Solutions',
  //   description: 'Affordable solar energy systems for rural communities across East Africa',
  //   sector: 'Clean Energy',
  //   country: 'Kenya',
  //   fundingGoal: 500000,
  //   currentFunding: 325000,
  //   minimumInvestment: 1000,
  //   expectedROI: 15.5,
  //   investorCount: 124,
  //   daysLeft: 45,
  //   riskLevel: 'Medium',
  //   esgScore: 9.2,
  //   image: '🌱',
  //   highlights: [
  //     'Government partnerships secured',
  //     '2,000+ households already served',
  //     'Patent-pending battery technology'
  //   ],
  //   businessStage: 'Series A',
  //   revenue: 240000,
  //   revenueGrowth: 180
  // }
];

const SECTORS = ['All', 'Clean Energy', 'Agriculture', 'Healthcare', 'Education', 'Fintech'];
const COUNTRIES = ['All', 'Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Rwanda'];
const RISK_LEVELS = ['All', 'Low', 'Medium', 'High'];

export default function InvestmentOpportunitiesScreen({ navigation }) {
  const [opportunities, setOpportunities] = useState(MOCK_OPPORTUNITIES);
  const [filteredOpportunities, setFilteredOpportunities] = useState(MOCK_OPPORTUNITIES);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('featured'); // featured, funding, roi, deadline

  const { userProfile } = useContext(AuthContext);

  useEffect(() => {
    filterOpportunities();
  }, [searchQuery, selectedSector, selectedCountry, selectedRiskLevel, sortBy, opportunities]);

  const filterOpportunities = () => {
    let filtered = [...opportunities];

    // Text search
    if (searchQuery) {
      filtered = filtered.filter(opp => 
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.sector.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sector filter
    if (selectedSector !== 'All') {
      filtered = filtered.filter(opp => opp.sector === selectedSector);
    }

    // Country filter
    if (selectedCountry !== 'All') {
      filtered = filtered.filter(opp => opp.country === selectedCountry);
    }

    // Risk level filter
    if (selectedRiskLevel !== 'All') {
      filtered = filtered.filter(opp => opp.riskLevel === selectedRiskLevel);
    }

    // Sorting
    switch (sortBy) {
      case 'funding':
        filtered.sort((a, b) => (b.currentFunding / b.fundingGoal) - (a.currentFunding / a.fundingGoal));
        break;
      case 'roi':
        filtered.sort((a, b) => b.expectedROI - a.expectedROI);
        break;
      case 'deadline':
        filtered.sort((a, b) => a.daysLeft - b.daysLeft);
        break;
      default:
        // Keep original order for featured
        break;
    }

    setFilteredOpportunities(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleInvestPress = async (opportunity) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    navigation.navigate('InvestmentDetail', { 
      opportunityId: opportunity.id,
      opportunity 
    });
  };

  const handleFilterToggle = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFilters(!showFilters);
  };

  const clearFilters = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
    setSelectedSector('All');
    setSelectedCountry('All');
    setSelectedRiskLevel('All');
    setSortBy('featured');
  };

  const getFundingProgress = (opportunity) => {
    return (opportunity.currentFunding / opportunity.fundingGoal) * 100;
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount}`;
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'High': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderOpportunityCard = (opportunity) => (
    <Card key={opportunity.id} style={styles.opportunityCard}>
      <View style={styles.cardHeader}>
        <View style={styles.companyInfo}>
          <View style={styles.companyIcon}>
            <Text style={styles.companyEmoji}>{opportunity.image}</Text>
          </View>
          <View style={styles.companyDetails}>
            <Text style={styles.companyName}>{opportunity.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="#9ca3af" />
              <Text style={styles.location}>{opportunity.country}</Text>
              <View style={styles.sectorBadge}>
                <Text style={styles.sectorText}>{opportunity.sector}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.riskIndicator}>
          <View style={[
            styles.riskBadge, 
            { backgroundColor: getRiskColor(opportunity.riskLevel) + '20' }
          ]}>
            <Text style={[
              styles.riskText, 
              { color: getRiskColor(opportunity.riskLevel) }
            ]}>
              {opportunity.riskLevel}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {opportunity.description}
      </Text>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{opportunity.expectedROI}%</Text>
          <Text style={styles.metricLabel}>Expected ROI</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{formatCurrency(opportunity.minimumInvestment)}</Text>
          <Text style={styles.metricLabel}>Min. Investment</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{opportunity.investorCount}</Text>
          <Text style={styles.metricLabel}>Investors</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{opportunity.daysLeft}d</Text>
          <Text style={styles.metricLabel}>Remaining</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {formatCurrency(opportunity.currentFunding)} of {formatCurrency(opportunity.fundingGoal)}
          </Text>
          <Text style={styles.progressPercentage}>
            {getFundingProgress(opportunity).toFixed(0)}%
          </Text>
        </View>
        
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(getFundingProgress(opportunity), 100)}%` }
            ]}
          />
        </View>
      </View>

      <View style={styles.highlightsSection}>
        {opportunity.highlights.slice(0, 2).map((highlight, index) => (
          <View key={index} style={styles.highlight}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={styles.highlightText}>{highlight}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.esgScore}>
          <Ionicons name="leaf" size={16} color="#10b981" />
          <Text style={styles.esgText}>ESG Score: {opportunity.esgScore}/10</Text>
        </View>
        
        <Button
          title="Invest Now"
          onPress={() => handleInvestPress(opportunity)}
          size="sm"
          style={styles.investButton}
          leftIcon={<Ionicons name="trending-up" size={16} color="#fff" />}
        />
      </View>
    </Card>
  );

  const renderFilterSection = () => {
    if (!showFilters) return null;

    return (
      <Card style={styles.filterCard}>
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>Filters</Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFilters}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Sector</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {SECTORS.map((sector) => (
              <TouchableOpacity
                key={sector}
                style={[
                  styles.filterChip,
                  selectedSector === sector && styles.filterChipSelected
                ]}
                onPress={() => setSelectedSector(sector)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedSector === sector && styles.filterChipTextSelected
                ]}>
                  {sector}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Country</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {COUNTRIES.map((country) => (
              <TouchableOpacity
                key={country}
                style={[
                  styles.filterChip,
                  selectedCountry === country && styles.filterChipSelected
                ]}
                onPress={() => setSelectedCountry(country)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedCountry === country && styles.filterChipTextSelected
                ]}>
                  {country}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Risk Level</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {RISK_LEVELS.map((risk) => (
              <TouchableOpacity
                key={risk}
                style={[
                  styles.filterChip,
                  selectedRiskLevel === risk && styles.filterChipSelected
                ]}
                onPress={() => setSelectedRiskLevel(risk)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedRiskLevel === risk && styles.filterChipTextSelected
                ]}>
                  {risk}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1a1a1a']}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Investment Opportunities</Text>
            <TouchableOpacity onPress={handleFilterToggle}>
              <Ionicons 
                name={showFilters ? "close" : "options"} 
                size={24} 
                color="#eab308" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.searchSection}>
            <Input
              placeholder="Search opportunities..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon={<Ionicons name="search" size={20} color="#6b7280" />}
              style={styles.searchInput}
            />
          </View>

          <View style={styles.sortSection}>
            <Text style={styles.resultCount}>
              {filteredOpportunities.length} opportunities found
            </Text>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => {
                // Show sort options
                Alert.alert(
                  'Sort By',
                  'Choose sorting option',
                  [
                    { text: 'Featured', onPress: () => setSortBy('featured') },
                    { text: 'Funding Progress', onPress: () => setSortBy('funding') },
                    { text: 'Expected ROI', onPress: () => setSortBy('roi') },
                    { text: 'Deadline', onPress: () => setSortBy('deadline') },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <Ionicons name="swap-vertical" size={16} color="#eab308" />
              <Text style={styles.sortText}>Sort</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#eab308"
            />
          }
        >
          {renderFilterSection()}

          <View style={styles.opportunitiesList}>
            {filteredOpportunities.map(renderOpportunityCard)}
          </View>

          {filteredOpportunities.length === 0 && (
            <Card style={styles.emptyState}>
              <Ionicons name="globe-outline" size={64} color="#6b7280" />
              <Text style={styles.emptyTitle}>
                {searchQuery || selectedSector !== 'All' || selectedCountry !== 'All' || selectedRiskLevel !== 'All'
                  ? 'No opportunities match your criteria' 
                  : 'Exciting opportunities are coming soon'
                }
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery || selectedSector !== 'All' || selectedCountry !== 'All' || selectedRiskLevel !== 'All'
                  ? 'Try adjusting your search criteria or filters to discover more investment opportunities in African SMEs.'
                  : 'We are onboarding promising African SMEs to our platform. Check back soon for investment opportunities that create real impact across the continent.'
                }
              </Text>
              {(searchQuery || selectedSector !== 'All' || selectedCountry !== 'All' || selectedRiskLevel !== 'All') ? (
                <Button
                  title="Clear Filters"
                  onPress={clearFilters}
                  variant="outline"
                  style={styles.clearButton}
                  leftIcon={<Ionicons name="refresh" size={16} color="#eab308" />}
                />
              ) : (
                <View style={styles.comingSoonFeatures}>
                  <View style={styles.comingSoonFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.comingSoonFeatureText}>Vetted African SMEs</Text>
                  </View>
                  <View style={styles.comingSoonFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.comingSoonFeatureText}>Impact-driven investments</Text>
                  </View>
                  <View style={styles.comingSoonFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={styles.comingSoonFeatureText}>Transparent reporting</Text>
                  </View>
                </View>
              )}
            </Card>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  searchSection: {
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 0,
  },
  sortSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultCount: {
    color: '#9ca3af',
    fontSize: 14,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderRadius: 16,
  },
  sortText: {
    color: '#eab308',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
  },
  filterCard: {
    margin: 20,
    marginBottom: 16,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  clearFilters: {
    color: '#eab308',
    fontSize: 14,
    fontWeight: '500',
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterChipSelected: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  filterChipText: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: '#000',
  },
  opportunitiesList: {
    padding: 20,
    paddingTop: showFilters ? 4 : 20,
  },
  opportunityCard: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(234, 179, 8, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  companyInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  companyEmoji: {
    fontSize: 24,
  },
  companyDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    color: '#9ca3af',
    fontSize: 14,
    marginLeft: 4,
    marginRight: 12,
  },
  sectorBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectorText: {
    color: '#eab308',
    fontSize: 12,
    fontWeight: '500',
  },
  riskIndicator: {
    alignItems: 'flex-end',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercentage: {
    color: '#eab308',
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#eab308',
  },
  highlightsSection: {
    marginBottom: 16,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  highlightText: {
    color: '#d1d5db',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  esgScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  esgText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  investButton: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    margin: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  clearButton: {
    borderColor: '#eab308',
  },
  comingSoonFeatures: {
    alignSelf: 'stretch',
    marginTop: 24,
  },
  comingSoonFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  comingSoonFeatureText: {
    fontSize: 14,
    color: '#d1d5db',
    marginLeft: 12,
  },
});