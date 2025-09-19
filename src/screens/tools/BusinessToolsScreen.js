/**
 * 🚀 BVESTER BUSINESS TOOLS SCREEN
 * Display Business Tools from CMS with real user data integration
 * No more placeholder data - everything is live and functional
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Alert,
  Dimensions,
  ActivityIndicator,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { cmsService, CONTENT_TYPES, CONTENT_CATEGORIES, CONTENT_STATUS } from '../../services/firebase/CMSService';
import { enhancedDesignSystem } from '../../styles/enhancedDesignSystem';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const { width } = Dimensions.get('window');

export default function BusinessToolsScreen({ navigation }) {
  const { user, userProfile } = useContext(AuthContext);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [businessTools, setBusinessTools] = useState([]);
  const [featuredTools, setFeaturedTools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTools, setFilteredTools] = useState([]);

  useEffect(() => {
    loadBusinessTools();
  }, []);

  useEffect(() => {
    filterTools();
  }, [businessTools, selectedCategory, searchQuery]);

  const loadBusinessTools = async () => {
    try {
      setLoading(true);
      
      // Load business tools from CMS
      const [tools, featured] = await Promise.all([
        cmsService.getAllContent({
          type: CONTENT_TYPES.BUSINESS_TOOL,
          status: CONTENT_STATUS.PUBLISHED,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          limit: 50
        }),
        cmsService.getFeaturedContent(CONTENT_TYPES.BUSINESS_TOOL)
      ]);
      
      setBusinessTools(tools);
      setFeaturedTools(featured);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(tools.map(tool => tool.category))];
      setCategories(uniqueCategories);
      
      console.log(`Loaded ${tools.length} business tools`);
    } catch (error) {
      console.error('Error loading business tools:', error);
      Alert.alert('Error', 'Failed to load business tools. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterTools = () => {
    let filtered = businessTools;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tool => tool.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tool =>
        tool.title.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredTools(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBusinessTools();
  };

  const handleToolPress = (tool) => {
    // Track view
    cmsService.incrementViews(tool.id);
    
    // Navigate to tool detail screen
    navigation.navigate('BusinessToolDetail', { tool });
  };

  const handleDownloadTool = async (tool) => {
    try {
      // Track download
      await cmsService.trackDownload(tool.id, user?.uid);
      
      if (tool.fileUrls && tool.fileUrls.length > 0) {
        // Open first file URL
        const supported = await Linking.canOpenURL(tool.fileUrls[0]);
        if (supported) {
          await Linking.openURL(tool.fileUrls[0]);
        } else {
          Alert.alert('Error', 'Cannot open this file type');
        }
      } else {
        Alert.alert('Info', 'This tool has no downloadable files');
      }
    } catch (error) {
      console.error('Error downloading tool:', error);
      Alert.alert('Error', 'Failed to download tool');
    }
  };

  const handleLikeTool = async (tool) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to like tools');
      return;
    }
    
    try {
      const isLiked = await cmsService.toggleLike(tool.id, user.uid);
      
      // Update local state
      setBusinessTools(prev => prev.map(t => 
        t.id === tool.id 
          ? { 
              ...t, 
              likes: isLiked ? (t.likes || 0) + 1 : Math.max(0, (t.likes || 0) - 1),
              likedBy: isLiked 
                ? [...(t.likedBy || []), user.uid]
                : (t.likedBy || []).filter(id => id !== user.uid)
            }
          : t
      ));
    } catch (error) {
      console.error('Error liking tool:', error);
      Alert.alert('Error', 'Failed to like tool');
    }
  };

  const renderFeaturedTools = () => {
    if (featuredTools.length === 0) return null;
    
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Featured Business Tools</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredContainer}
        >
          {featuredTools.map(tool => (
            <TouchableOpacity
              key={tool.id}
              style={styles.featuredCard}
              onPress={() => handleToolPress(tool)}
            >
              <View style={styles.featuredIcon}>
                <Ionicons name={getToolIcon(tool.category)} size={24} color="white" />
              </View>
              
              <Text style={styles.featuredTitle} numberOfLines={2}>
                {tool.title}
              </Text>
              
              <Text style={styles.featuredCategory}>
                {formatCategory(tool.category)}
              </Text>
              
              <View style={styles.featuredStats}>
                <View style={styles.statItem}>
                  <Ionicons name="eye" size={12} color={enhancedDesignSystem.colors.textSecondary} />
                  <Text style={styles.statText}>{tool.views || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="heart" size={12} color={enhancedDesignSystem.colors.error} />
                  <Text style={styles.statText}>{tool.likes || 0}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCategoryFilter = () => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>Categories</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === 'all' && styles.categoryChipActive
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.categoryChipText,
            selectedCategory === 'all' && styles.categoryChipTextActive
          ]}>
            All Tools
          </Text>
        </TouchableOpacity>
        
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Ionicons 
              name={getToolIcon(category)} 
              size={16} 
              color={selectedCategory === category ? 'white' : enhancedDesignSystem.colors.primary}
              style={styles.categoryIcon} 
            />
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category && styles.categoryChipTextActive
            ]}>
              {formatCategory(category)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderToolItem = ({ item: tool }) => (
    <Card style={styles.toolCard}>
      <TouchableOpacity onPress={() => handleToolPress(tool)}>
        <View style={styles.toolHeader}>
          <View style={styles.toolIcon}>
            <Ionicons 
              name={getToolIcon(tool.category)} 
              size={20} 
              color={enhancedDesignSystem.colors.primary} 
            />
          </View>
          
          <View style={styles.toolInfo}>
            <Text style={styles.toolTitle} numberOfLines={1}>
              {tool.title}
            </Text>
            <Text style={styles.toolCategory}>
              {formatCategory(tool.category)}
            </Text>
          </View>
          
          <View style={styles.toolRating}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>
              {tool.rating ? tool.rating.toFixed(1) : 'New'}
            </Text>
          </View>
        </View>

        <Text style={styles.toolDescription} numberOfLines={2}>
          {tool.description}
        </Text>

        {tool.tags && tool.tags.length > 0 && (
          <View style={styles.tagContainer}>
            {tool.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {tool.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{tool.tags.length - 3} more</Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.toolActions}>
        <View style={styles.toolStats}>
          <View style={styles.statItem}>
            <Ionicons name="eye" size={14} color={enhancedDesignSystem.colors.textSecondary} />
            <Text style={styles.statText}>{tool.views || 0} views</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="download" size={14} color={enhancedDesignSystem.colors.textSecondary} />
            <Text style={styles.statText}>{tool.downloads || 0} downloads</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLikeTool(tool)}
          >
            <Ionicons 
              name={tool.likedBy?.includes(user?.uid) ? "heart" : "heart-outline"} 
              size={18} 
              color={tool.likedBy?.includes(user?.uid) ? enhancedDesignSystem.colors.error : enhancedDesignSystem.colors.textSecondary} 
            />
            <Text style={styles.actionButtonText}>{tool.likes || 0}</Text>
          </TouchableOpacity>
          
          {tool.fileUrls && tool.fileUrls.length > 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDownloadTool(tool)}
            >
              <Ionicons name="download" size={18} color={enhancedDesignSystem.colors.primary} />
              <Text style={[styles.actionButtonText, { color: enhancedDesignSystem.colors.primary }]}>
                Download
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="hammer-outline" size={64} color={enhancedDesignSystem.colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Business Tools Available</Text>
      <Text style={styles.emptyMessage}>
        {searchQuery || selectedCategory !== 'all' 
          ? 'Try adjusting your search or category filter'
          : 'Business tools will appear here once they are added by administrators'
        }
      </Text>
      
      {(searchQuery || selectedCategory !== 'all') && (
        <Button
          title="Clear Filters"
          onPress={() => {
            setSearchQuery('');
            setSelectedCategory('all');
          }}
          style={styles.clearButton}
        />
      )}
    </View>
  );

  const getToolIcon = (category) => {
    switch (category) {
      case CONTENT_CATEGORIES.FINANCIAL_MANAGEMENT:
        return 'calculator';
      case CONTENT_CATEGORIES.MARKETING:
        return 'megaphone';
      case CONTENT_CATEGORIES.OPERATIONS:
        return 'settings';
      case CONTENT_CATEGORIES.HR_MANAGEMENT:
        return 'people';
      case CONTENT_CATEGORIES.LEGAL_COMPLIANCE:
        return 'document-text';
      case CONTENT_CATEGORIES.TECHNOLOGY:
        return 'laptop';
      default:
        return 'hammer';
    }
  };

  const formatCategory = (category) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading && businessTools.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={enhancedDesignSystem.colors.primary} />
        <Text style={styles.loadingText}>Loading Business Tools...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Business Tools</Text>
        <Text style={styles.headerSubtitle}>
          Powerful tools to grow your business
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search business tools..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search"
          style={styles.searchInput}
        />
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Featured Tools */}
        {renderFeaturedTools()}
        
        {/* Category Filter */}
        {renderCategoryFilter()}

        {/* Tools List */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? 'All Tools' : formatCategory(selectedCategory)}
            </Text>
            <Text style={styles.resultsCount}>
              {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'}
            </Text>
          </View>

          {filteredTools.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={filteredTools}
              keyExtractor={(item) => item.id}
              renderItem={renderToolItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: enhancedDesignSystem.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: enhancedDesignSystem.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: enhancedDesignSystem.colors.textSecondary,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
  },
  header: {
    padding: 20,
    backgroundColor: enhancedDesignSystem.colors.surface,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: enhancedDesignSystem.typography.fontFamilyBold,
    color: enhancedDesignSystem.colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: enhancedDesignSystem.colors.surface,
  },
  searchInput: {
    marginBottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: enhancedDesignSystem.typography.fontFamilySemiBold,
    color: enhancedDesignSystem.colors.text,
  },
  resultsCount: {
    fontSize: 14,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.textSecondary,
  },
  featuredContainer: {
    paddingHorizontal: 20,
  },
  featuredCard: {
    width: 200,
    height: 160,
    marginRight: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: enhancedDesignSystem.colors.primary,
  },
  featuredIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredTitle: {
    fontSize: 16,
    fontFamily: enhancedDesignSystem.typography.fontFamilySemiBold,
    color: 'white',
    marginBottom: 4,
    lineHeight: 22,
  },
  featuredCategory: {
    fontSize: 12,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  featuredStats: {
    flexDirection: 'row',
    gap: 16,
  },
  categoryContainer: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: enhancedDesignSystem.colors.surface,
    borderWidth: 1,
    borderColor: enhancedDesignSystem.colors.primary,
  },
  categoryChipActive: {
    backgroundColor: enhancedDesignSystem.colors.primary,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.primary,
  },
  categoryChipTextActive: {
    color: 'white',
  },
  toolCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  toolIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: enhancedDesignSystem.colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 16,
    fontFamily: enhancedDesignSystem.typography.fontFamilySemiBold,
    color: enhancedDesignSystem.colors.text,
    marginBottom: 4,
  },
  toolCategory: {
    fontSize: 12,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.textSecondary,
  },
  toolRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.text,
  },
  toolDescription: {
    fontSize: 14,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: enhancedDesignSystem.colors.neutral100,
  },
  tagText: {
    fontSize: 10,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.textSecondary,
  },
  moreTagsText: {
    fontSize: 10,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.textSecondary,
    fontStyle: 'italic',
  },
  toolActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: enhancedDesignSystem.colors.border,
  },
  toolStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: enhancedDesignSystem.typography.fontFamilySemiBold,
    color: enhancedDesignSystem.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  clearButton: {
    paddingHorizontal: 24,
  },
});