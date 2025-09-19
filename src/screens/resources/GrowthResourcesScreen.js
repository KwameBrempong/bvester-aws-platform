/**
 * 🚀 BVESTER GROWTH RESOURCES SCREEN
 * Display Growth Resources from CMS with real user data integration
 * Educational content to help businesses grow and prepare for investment
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
  ActivityIndicator,
  Linking,
  Image,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { cmsService, CONTENT_TYPES, CONTENT_CATEGORIES, CONTENT_STATUS } from '../../services/firebase/CMSService';
import { enhancedDesignSystem } from '../../styles/enhancedDesignSystem';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function GrowthResourcesScreen({ navigation }) {
  const { user, userProfile } = useContext(AuthContext);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [growthResources, setGrowthResources] = useState([]);
  const [featuredResources, setFeaturedResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResources, setFilteredResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadGrowthResources();
  }, []);

  useEffect(() => {
    filterResources();
  }, [growthResources, selectedCategory, searchQuery]);

  const loadGrowthResources = async () => {
    try {
      setLoading(true);
      
      // Load growth resources from CMS
      const [resources, featured] = await Promise.all([
        cmsService.getAllContent({
          type: CONTENT_TYPES.GROWTH_RESOURCE,
          status: CONTENT_STATUS.PUBLISHED,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          limit: 50
        }),
        cmsService.getFeaturedContent(CONTENT_TYPES.GROWTH_RESOURCE)
      ]);
      
      setGrowthResources(resources);
      setFeaturedResources(featured);
      
      // Extract unique categories relevant to growth resources
      const growthCategories = [
        CONTENT_CATEGORIES.FUNDRAISING,
        CONTENT_CATEGORIES.SCALING_STRATEGIES,
        CONTENT_CATEGORIES.MARKET_EXPANSION,
        CONTENT_CATEGORIES.INVESTMENT_READINESS,
        CONTENT_CATEGORIES.BUSINESS_PLANNING,
        CONTENT_CATEGORIES.MENTORSHIP
      ];
      
      const availableCategories = growthCategories.filter(category =>
        resources.some(resource => resource.category === category)
      );
      
      setCategories(availableCategories);
      
      console.log(`Loaded ${resources.length} growth resources`);
    } catch (error) {
      console.error('Error loading growth resources:', error);
      Alert.alert('Error', 'Failed to load growth resources. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterResources = () => {
    let filtered = growthResources;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => resource.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(query) ||
        resource.description.toLowerCase().includes(query) ||
        resource.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredResources(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGrowthResources();
  };

  const handleResourcePress = async (resource) => {
    try {
      // Track view
      await cmsService.incrementViews(resource.id);
      
      // Update local state to reflect view count
      setGrowthResources(prev => prev.map(r => 
        r.id === resource.id 
          ? { ...r, views: (r.views || 0) + 1 }
          : r
      ));
      
      setSelectedResource(resource);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error tracking resource view:', error);
      setSelectedResource(resource);
      setShowDetailModal(true);
    }
  };

  const handleLikeResource = async (resource) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to like resources');
      return;
    }
    
    try {
      const isLiked = await cmsService.toggleLike(resource.id, user.uid);
      
      // Update local state
      const updateResource = (prev) => prev.map(r => 
        r.id === resource.id 
          ? { 
              ...r, 
              likes: isLiked ? (r.likes || 0) + 1 : Math.max(0, (r.likes || 0) - 1),
              likedBy: isLiked 
                ? [...(r.likedBy || []), user.uid]
                : (r.likedBy || []).filter(id => id !== user.uid)
            }
          : r
      );
      
      setGrowthResources(updateResource);
      setFeaturedResources(updateResource);
      
      if (selectedResource?.id === resource.id) {
        setSelectedResource(prev => ({
          ...prev,
          likes: isLiked ? (prev.likes || 0) + 1 : Math.max(0, (prev.likes || 0) - 1),
          likedBy: isLiked 
            ? [...(prev.likedBy || []), user.uid]
            : (prev.likedBy || []).filter(id => id !== user.uid)
        }));
      }
    } catch (error) {
      console.error('Error liking resource:', error);
      Alert.alert('Error', 'Failed to like resource');
    }
  };

  const handleDownloadResource = async (resource) => {
    try {
      // Track download
      if (user) {
        await cmsService.trackDownload(resource.id, user.uid);
      }
      
      if (resource.fileUrls && resource.fileUrls.length > 0) {
        // Open first file URL
        const supported = await Linking.canOpenURL(resource.fileUrls[0]);
        if (supported) {
          await Linking.openURL(resource.fileUrls[0]);
        } else {
          Alert.alert('Error', 'Cannot open this file type');
        }
      } else {
        Alert.alert('Info', 'This resource has no downloadable files');
      }
    } catch (error) {
      console.error('Error downloading resource:', error);
      Alert.alert('Error', 'Failed to download resource');
    }
  };

  const renderFeaturedResources = () => {
    if (featuredResources.length === 0) return null;
    
    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Featured Resources</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredContainer}
        >
          {featuredResources.map(resource => (
            <TouchableOpacity
              key={resource.id}
              style={styles.featuredCard}
              onPress={() => handleResourcePress(resource)}
            >
              <View style={styles.featuredHeader}>
                <View style={styles.featuredIcon}>
                  <Ionicons name={getResourceIcon(resource.category)} size={24} color="white" />
                </View>
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>FEATURED</Text>
                </View>
              </View>
              
              <Text style={styles.featuredTitle} numberOfLines={2}>
                {resource.title}
              </Text>
              
              <Text style={styles.featuredCategory}>
                {formatCategory(resource.category)}
              </Text>
              
              <View style={styles.featuredStats}>
                <View style={styles.statItem}>
                  <Ionicons name="eye" size={12} color={enhancedDesignSystem.colors.textSecondary} />
                  <Text style={styles.statText}>{resource.views || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="heart" size={12} color={enhancedDesignSystem.colors.error} />
                  <Text style={styles.statText}>{resource.likes || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.statText}>
                    {resource.rating ? resource.rating.toFixed(1) : 'New'}
                  </Text>
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
            All Resources
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
              name={getResourceIcon(category)} 
              size={16} 
              color={selectedCategory === category ? 'white' : enhancedDesignSystem.colors.success}
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

  const renderResourceItem = ({ item: resource }) => (
    <Card style={styles.resourceCard}>
      <TouchableOpacity onPress={() => handleResourcePress(resource)}>
        <View style={styles.resourceHeader}>
          <View style={[styles.resourceIcon, { backgroundColor: getCategoryColor(resource.category) + '20' }]}>
            <Ionicons 
              name={getResourceIcon(resource.category)} 
              size={20} 
              color={getCategoryColor(resource.category)} 
            />
          </View>
          
          <View style={styles.resourceInfo}>
            <Text style={styles.resourceTitle} numberOfLines={1}>
              {resource.title}
            </Text>
            <Text style={styles.resourceCategory}>
              {formatCategory(resource.category)}
            </Text>
            {resource.rating > 0 && (
              <View style={styles.resourceRating}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {resource.rating.toFixed(1)} ({resource.ratingCount || 0})
                </Text>
              </View>
            )}
          </View>
          
          {resource.featured && (
            <View style={styles.featuredBadgeSmall}>
              <Ionicons name="star" size={12} color="white" />
            </View>
          )}
        </View>

        <Text style={styles.resourceDescription} numberOfLines={3}>
          {resource.description}
        </Text>

        {resource.tags && resource.tags.length > 0 && (
          <View style={styles.tagContainer}>
            {resource.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {resource.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{resource.tags.length - 3} more</Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.resourceActions}>
        <View style={styles.resourceStats}>
          <View style={styles.statItem}>
            <Ionicons name="eye" size={14} color={enhancedDesignSystem.colors.textSecondary} />
            <Text style={styles.statText}>{resource.views || 0} views</Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="download" size={14} color={enhancedDesignSystem.colors.textSecondary} />
            <Text style={styles.statText}>{resource.downloads || 0} downloads</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLikeResource(resource)}
          >
            <Ionicons 
              name={resource.likedBy?.includes(user?.uid) ? "heart" : "heart-outline"} 
              size={18} 
              color={resource.likedBy?.includes(user?.uid) ? enhancedDesignSystem.colors.error : enhancedDesignSystem.colors.textSecondary} 
            />
            <Text style={styles.actionButtonText}>{resource.likes || 0}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleResourcePress(resource)}
          >
            <Ionicons name="eye" size={18} color={enhancedDesignSystem.colors.success} />
            <Text style={[styles.actionButtonText, { color: enhancedDesignSystem.colors.success }]}>
              Read
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const renderDetailModal = () => {
    if (!selectedResource) return null;
    
    return (
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetailModal(false)}
            >
              <Ionicons name="close" size={24} color={enhancedDesignSystem.colors.text} />
            </TouchableOpacity>
            
            <View style={styles.modalHeaderContent}>
              <View style={[styles.modalIcon, { backgroundColor: getCategoryColor(selectedResource.category) + '20' }]}>
                <Ionicons 
                  name={getResourceIcon(selectedResource.category)} 
                  size={24} 
                  color={getCategoryColor(selectedResource.category)} 
                />
              </View>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => handleLikeResource(selectedResource)}
              >
                <Ionicons 
                  name={selectedResource.likedBy?.includes(user?.uid) ? "heart" : "heart-outline"} 
                  size={20} 
                  color={selectedResource.likedBy?.includes(user?.uid) ? enhancedDesignSystem.colors.error : enhancedDesignSystem.colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{selectedResource.title}</Text>
            
            <View style={styles.modalMeta}>
              <Text style={styles.modalCategory}>
                {formatCategory(selectedResource.category)}
              </Text>
              
              {selectedResource.rating > 0 && (
                <View style={styles.modalRating}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.modalRatingText}>
                    {selectedResource.rating.toFixed(1)} ({selectedResource.ratingCount || 0} reviews)
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalStats}>
              <View style={styles.modalStatItem}>
                <Ionicons name="eye" size={16} color={enhancedDesignSystem.colors.textSecondary} />
                <Text style={styles.modalStatText}>{selectedResource.views || 0} views</Text>
              </View>
              
              <View style={styles.modalStatItem}>
                <Ionicons name="heart" size={16} color={enhancedDesignSystem.colors.error} />
                <Text style={styles.modalStatText}>{selectedResource.likes || 0} likes</Text>
              </View>
              
              <View style={styles.modalStatItem}>
                <Ionicons name="download" size={16} color={enhancedDesignSystem.colors.textSecondary} />
                <Text style={styles.modalStatText}>{selectedResource.downloads || 0} downloads</Text>
              </View>
            </View>

            <Text style={styles.modalDescription}>{selectedResource.description}</Text>
            
            {selectedResource.content && (
              <View style={styles.modalContentSection}>
                <Text style={styles.modalContentTitle}>Content</Text>
                <Text style={styles.modalContentText}>{selectedResource.content}</Text>
              </View>
            )}

            {selectedResource.tags && selectedResource.tags.length > 0 && (
              <View style={styles.modalTagSection}>
                <Text style={styles.modalTagTitle}>Tags</Text>
                <View style={styles.modalTagContainer}>
                  {selectedResource.tags.map((tag, index) => (
                    <View key={index} style={styles.modalTag}>
                      <Text style={styles.modalTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {selectedResource.fileUrls && selectedResource.fileUrls.length > 0 && (
              <View style={styles.modalFileSection}>
                <Text style={styles.modalFileTitle}>Downloads</Text>
                {selectedResource.fileUrls.map((url, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.fileDownloadButton}
                    onPress={() => handleDownloadResource(selectedResource)}
                  >
                    <Ionicons name="document" size={20} color={enhancedDesignSystem.colors.primary} />
                    <Text style={styles.fileDownloadText}>Download Resource {index + 1}</Text>
                    <Ionicons name="download" size={16} color={enhancedDesignSystem.colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="library-outline" size={64} color={enhancedDesignSystem.colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Growth Resources Available</Text>
      <Text style={styles.emptyMessage}>
        {searchQuery || selectedCategory !== 'all' 
          ? 'Try adjusting your search or category filter'
          : 'Growth resources will appear here once they are added by administrators'
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

  const getResourceIcon = (category) => {
    switch (category) {
      case CONTENT_CATEGORIES.FUNDRAISING:
        return 'cash';
      case CONTENT_CATEGORIES.SCALING_STRATEGIES:
        return 'trending-up';
      case CONTENT_CATEGORIES.MARKET_EXPANSION:
        return 'globe';
      case CONTENT_CATEGORIES.INVESTMENT_READINESS:
        return 'shield-checkmark';
      case CONTENT_CATEGORIES.BUSINESS_PLANNING:
        return 'document-text';
      case CONTENT_CATEGORIES.MENTORSHIP:
        return 'school';
      default:
        return 'library';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case CONTENT_CATEGORIES.FUNDRAISING:
        return '#10B981';
      case CONTENT_CATEGORIES.SCALING_STRATEGIES:
        return '#3B82F6';
      case CONTENT_CATEGORIES.MARKET_EXPANSION:
        return '#8B5CF6';
      case CONTENT_CATEGORIES.INVESTMENT_READINESS:
        return '#F59E0B';
      case CONTENT_CATEGORIES.BUSINESS_PLANNING:
        return '#EF4444';
      case CONTENT_CATEGORIES.MENTORSHIP:
        return '#06B6D4';
      default:
        return enhancedDesignSystem.colors.success;
    }
  };

  const formatCategory = (category) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading && growthResources.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={enhancedDesignSystem.colors.success} />
        <Text style={styles.loadingText}>Loading Growth Resources...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Growth Resources</Text>
        <Text style={styles.headerSubtitle}>
          Learn, grow, and prepare your business for investment
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search growth resources..."
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
        {/* Featured Resources */}
        {renderFeaturedResources()}
        
        {/* Category Filter */}
        {renderCategoryFilter()}

        {/* Resources List */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? 'All Resources' : formatCategory(selectedCategory)}
            </Text>
            <Text style={styles.resultsCount}>
              {filteredResources.length} {filteredResources.length === 1 ? 'resource' : 'resources'}
            </Text>
          </View>

          {filteredResources.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={filteredResources}
              keyExtractor={(item) => item.id}
              renderItem={renderResourceItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      {renderDetailModal()}
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
    width: 240,
    height: 180,
    marginRight: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: enhancedDesignSystem.colors.success,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featuredIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  featuredBadgeText: {
    fontSize: 8,
    fontFamily: enhancedDesignSystem.typography.fontFamilyBold,
    color: 'white',
    letterSpacing: 0.5,
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
    marginBottom: 16,
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
    borderColor: enhancedDesignSystem.colors.success,
  },
  categoryChipActive: {
    backgroundColor: enhancedDesignSystem.colors.success,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.success,
  },
  categoryChipTextActive: {
    color: 'white',
  },
  resourceCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontFamily: enhancedDesignSystem.typography.fontFamilySemiBold,
    color: enhancedDesignSystem.colors.text,
    marginBottom: 4,
  },
  resourceCategory: {
    fontSize: 12,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.textSecondary,
    marginBottom: 4,
  },
  resourceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.text,
  },
  featuredBadgeSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: enhancedDesignSystem.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceDescription: {
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
  resourceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: enhancedDesignSystem.colors.border,
  },
  resourceStats: {
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: enhancedDesignSystem.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: enhancedDesignSystem.colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: enhancedDesignSystem.colors.neutral100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderContent: {
    flex: 1,
    alignItems: 'center',
  },
  modalIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: enhancedDesignSystem.colors.neutral100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: enhancedDesignSystem.typography.fontFamilyBold,
    color: enhancedDesignSystem.colors.text,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  modalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalCategory: {
    fontSize: 16,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.success,
  },
  modalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalRatingText: {
    fontSize: 14,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.text,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: enhancedDesignSystem.colors.border,
  },
  modalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalStatText: {
    fontSize: 14,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.textSecondary,
  },
  modalDescription: {
    fontSize: 16,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  modalContentSection: {
    marginBottom: 24,
  },
  modalContentTitle: {
    fontSize: 18,
    fontFamily: enhancedDesignSystem.typography.fontFamilySemiBold,
    color: enhancedDesignSystem.colors.text,
    marginBottom: 12,
  },
  modalContentText: {
    fontSize: 14,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.textSecondary,
    lineHeight: 22,
  },
  modalTagSection: {
    marginBottom: 24,
  },
  modalTagTitle: {
    fontSize: 16,
    fontFamily: enhancedDesignSystem.typography.fontFamilySemiBold,
    color: enhancedDesignSystem.colors.text,
    marginBottom: 12,
  },
  modalTagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: enhancedDesignSystem.colors.success + '20',
    borderWidth: 1,
    borderColor: enhancedDesignSystem.colors.success + '40',
  },
  modalTagText: {
    fontSize: 12,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.success,
  },
  modalFileSection: {
    marginBottom: 24,
  },
  modalFileTitle: {
    fontSize: 16,
    fontFamily: enhancedDesignSystem.typography.fontFamilySemiBold,
    color: enhancedDesignSystem.colors.text,
    marginBottom: 12,
  },
  fileDownloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: enhancedDesignSystem.colors.primary + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: enhancedDesignSystem.colors.primary + '20',
    marginBottom: 8,
  },
  fileDownloadText: {
    flex: 1,
    fontSize: 14,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.primary,
    marginLeft: 12,
  },
});