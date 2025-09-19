/**
 * 🚀 BVESTER CMS ADMIN SCREEN
 * Easy Content Management System for Non-Technical Users
 * Upload and manage Business Tools and Growth Resources without coding
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../context/AuthContext';
import { cmsService, CONTENT_TYPES, CONTENT_CATEGORIES, CONTENT_STATUS } from '../../services/firebase/CMSService';
import { enhancedDesignSystem } from '../../styles/enhancedDesignSystem';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const { width, height } = Dimensions.get('window');

export default function CMSAdminScreen({ navigation }) {
  const { user, userProfile } = useContext(AuthContext);
  
  // State management
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [contentList, setContentList] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: CONTENT_TYPES.BUSINESS_TOOL,
    category: CONTENT_CATEGORIES.FINANCIAL_MANAGEMENT,
    tags: [],
    isFeatured: false,
    status: CONTENT_STATUS.DRAFT,
    fileUrls: [],
    imageUrls: [],
    metaKeywords: '',
    metaDescription: '',
    authorNotes: ''
  });
  const [newTag, setNewTag] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Permission check
  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'super_admin';

  useEffect(() => {
    if (isAdmin) {
      loadContent();
    }
  }, [isAdmin]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const content = await cmsService.getAllContent({ 
        limit: 100,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      });
      setContentList(content);
    } catch (error) {
      console.error('Error loading content:', error);
      Alert.alert('Error', 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContent = () => {
    setEditingContent(null);
    setFormData({
      title: '',
      description: '',
      content: '',
      type: CONTENT_TYPES.BUSINESS_TOOL,
      category: CONTENT_CATEGORIES.FINANCIAL_MANAGEMENT,
      tags: [],
      isFeatured: false,
      status: CONTENT_STATUS.DRAFT,
      fileUrls: [],
      imageUrls: [],
      metaKeywords: '',
      metaDescription: '',
      authorNotes: ''
    });
    setShowCreateModal(true);
  };

  const handleEditContent = (content) => {
    setEditingContent(content);
    setFormData({
      ...content,
      tags: content.tags || []
    });
    setShowCreateModal(true);
  };

  const handleDeleteContent = (contentId) => {
    Alert.alert(
      'Delete Content',
      'Are you sure you want to delete this content? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await cmsService.deleteContent(contentId);
              await loadContent();
              Alert.alert('Success', 'Content deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete content');
            }
          }
        }
      ]
    );
  };

  const handleFileUpload = async (type = 'file') => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      let result;
      if (type === 'image') {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          quality: 0.8,
          aspect: [4, 3],
          allowsEditing: false,
        });
      } else {
        result = await DocumentPicker.getDocumentAsync({
          multiple: true,
          type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
        });
      }

      if (!result.canceled && result.assets) {
        const uploadPromises = result.assets.map(async (asset, index) => {
          const progress = (index + 1) / result.assets.length * 100;
          setUploadProgress(progress);
          
          try {
            const uploadResult = await cmsService.uploadFile(asset, type);
            return uploadResult.downloadURL;
          } catch (error) {
            console.error(`Error uploading ${asset.name}:`, error);
            throw error;
          }
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        
        if (type === 'image') {
          setFormData(prev => ({
            ...prev,
            imageUrls: [...prev.imageUrls, ...uploadedUrls]
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            fileUrls: [...prev.fileUrls, ...uploadedUrls]
          }));
        }

        Alert.alert('Success', `${uploadedUrls.length} file(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = (url, type = 'file') => {
    if (type === 'image') {
      setFormData(prev => ({
        ...prev,
        imageUrls: prev.imageUrls.filter(u => u !== url)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        fileUrls: prev.fileUrls.filter(u => u !== url)
      }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSaveContent = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      Alert.alert('Validation Error', 'Title and description are required');
      return;
    }

    try {
      setLoading(true);
      
      const contentData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        content: formData.content.trim(),
        metaDescription: formData.metaDescription.trim() || formData.description.substring(0, 160),
        metaKeywords: formData.metaKeywords.trim(),
        authorId: user.uid,
        authorName: userProfile?.name || user.email,
        authorNotes: formData.authorNotes.trim()
      };

      if (editingContent) {
        await cmsService.updateContent(editingContent.id, contentData);
        Alert.alert('Success', 'Content updated successfully');
      } else {
        await cmsService.createContent(contentData);
        Alert.alert('Success', 'Content created successfully');
      }

      setShowCreateModal(false);
      await loadContent();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishContent = async (contentId, currentStatus) => {
    const newStatus = currentStatus === CONTENT_STATUS.PUBLISHED 
      ? CONTENT_STATUS.DRAFT 
      : CONTENT_STATUS.PUBLISHED;

    try {
      await cmsService.updateContent(contentId, { status: newStatus });
      await loadContent();
      Alert.alert('Success', `Content ${newStatus === CONTENT_STATUS.PUBLISHED ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update content status');
    }
  };

  const renderContentItem = ({ item: content }) => (
    <Card style={styles.contentCard}>
      <View style={styles.contentHeader}>
        <View style={styles.contentInfo}>
          <Text style={styles.contentTitle} numberOfLines={1}>
            {content.title}
          </Text>
          <Text style={styles.contentMeta}>
            {formatContentType(content.type)} • {formatCategory(content.category)}
          </Text>
          <Text style={styles.contentDate}>
            Updated: {new Date(content.updatedAt?.toDate?.() || content.updatedAt).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.contentStatus}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(content.status) }
          ]}>
            <Text style={styles.statusText}>
              {content.status.toUpperCase()}
            </Text>
          </View>
          {content.isFeatured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
            </View>
          )}
        </View>
      </View>

      <Text style={styles.contentDescription} numberOfLines={2}>
        {content.description}
      </Text>

      <View style={styles.contentStats}>
        <View style={styles.statItem}>
          <Ionicons name="eye" size={14} color={enhancedDesignSystem.colors.textSecondary} />
          <Text style={styles.statText}>{content.views || 0} views</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={14} color={enhancedDesignSystem.colors.error} />
          <Text style={styles.statText}>{content.likes || 0} likes</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="download" size={14} color={enhancedDesignSystem.colors.textSecondary} />
          <Text style={styles.statText}>{content.downloads || 0} downloads</Text>
        </View>
      </View>

      <View style={styles.contentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEditContent(content)}
        >
          <Ionicons name="create" size={18} color={enhancedDesignSystem.colors.primary} />
          <Text style={[styles.actionText, { color: enhancedDesignSystem.colors.primary }]}>
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handlePublishContent(content.id, content.status)}
        >
          <Ionicons 
            name={content.status === CONTENT_STATUS.PUBLISHED ? "eye-off" : "eye"} 
            size={18} 
            color={content.status === CONTENT_STATUS.PUBLISHED ? enhancedDesignSystem.colors.warning : enhancedDesignSystem.colors.success} 
          />
          <Text style={[
            styles.actionText,
            { color: content.status === CONTENT_STATUS.PUBLISHED ? enhancedDesignSystem.colors.warning : enhancedDesignSystem.colors.success }
          ]}>
            {content.status === CONTENT_STATUS.PUBLISHED ? 'Unpublish' : 'Publish'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteContent(content.id)}
        >
          <Ionicons name="trash" size={18} color={enhancedDesignSystem.colors.error} />
          <Text style={[styles.actionText, { color: enhancedDesignSystem.colors.error }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Ionicons name="close" size={24} color={enhancedDesignSystem.colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingContent ? 'Edit Content' : 'Create New Content'}
          </Text>
          <TouchableOpacity onPress={handleSaveContent} disabled={loading}>
            <Text style={[
              styles.saveButton,
              { opacity: loading ? 0.5 : 1 }
            ]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <Input
              label="Title"
              placeholder="Enter content title"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              required
            />

            <Input
              label="Description"
              placeholder="Brief description of the content"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
              required
            />

            <Input
              label="Full Content"
              placeholder="Detailed content (markdown supported)"
              value={formData.content}
              onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
              multiline
              numberOfLines={8}
              style={styles.contentInput}
            />
          </View>

          {/* Content Type & Category */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Classification</Text>
            
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Content Type</Text>
              <View style={styles.pickerOptions}>
                {Object.values(CONTENT_TYPES).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.pickerOption,
                      formData.type === type && styles.pickerOptionActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, type }))}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.type === type && styles.pickerOptionTextActive
                    ]}>
                      {formatContentType(type)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.pickerOptions}>
                  {Object.values(CONTENT_CATEGORIES).map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.pickerOption,
                        formData.category === category && styles.pickerOptionActive
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, category }))}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        formData.category === category && styles.pickerOptionTextActive
                      ]}>
                        {formatCategory(category)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="Add a tag"
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
                <Ionicons name="add" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.tagList}>
              {formData.tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.tag}
                  onPress={() => handleRemoveTag(tag)}
                >
                  <Text style={styles.tagText}>{tag}</Text>
                  <Ionicons name="close" size={14} color={enhancedDesignSystem.colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* File Uploads */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Files & Images</Text>
            
            {/* File Upload */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadLabel}>Documents & Files</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handleFileUpload('file')}
                disabled={isUploading}
              >
                <Ionicons name="document-attach" size={20} color={enhancedDesignSystem.colors.primary} />
                <Text style={styles.uploadButtonText}>Upload Files</Text>
              </TouchableOpacity>
              
              {formData.fileUrls.map((url, index) => (
                <View key={index} style={styles.fileItem}>
                  <Ionicons name="document" size={16} color={enhancedDesignSystem.colors.textSecondary} />
                  <Text style={styles.fileName}>File {index + 1}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFile(url, 'file')}>
                    <Ionicons name="trash" size={16} color={enhancedDesignSystem.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Image Upload */}
            <View style={styles.uploadSection}>
              <Text style={styles.uploadLabel}>Images</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => handleFileUpload('image')}
                disabled={isUploading}
              >
                <Ionicons name="image" size={20} color={enhancedDesignSystem.colors.primary} />
                <Text style={styles.uploadButtonText}>Upload Images</Text>
              </TouchableOpacity>
              
              {formData.imageUrls.map((url, index) => (
                <View key={index} style={styles.fileItem}>
                  <Ionicons name="image" size={16} color={enhancedDesignSystem.colors.textSecondary} />
                  <Text style={styles.fileName}>Image {index + 1}</Text>
                  <TouchableOpacity onPress={() => handleRemoveFile(url, 'image')}>
                    <Ionicons name="trash" size={16} color={enhancedDesignSystem.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {isUploading && (
              <View style={styles.uploadProgress}>
                <Text style={styles.uploadProgressText}>Uploading... {Math.round(uploadProgress)}%</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                </View>
              </View>
            )}
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Featured Content</Text>
              <Switch
                value={formData.isFeatured}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isFeatured: value }))}
                trackColor={{ false: '#767577', true: enhancedDesignSystem.colors.primary }}
                thumbColor={formData.isFeatured ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Status</Text>
              <View style={styles.pickerOptions}>
                {Object.values(CONTENT_STATUS).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.pickerOption,
                      formData.status === status && styles.pickerOptionActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, status }))}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      formData.status === status && styles.pickerOptionTextActive
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* SEO & Meta */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SEO & Metadata</Text>
            
            <Input
              label="Meta Description"
              placeholder="SEO description (160 characters max)"
              value={formData.metaDescription}
              onChangeText={(text) => setFormData(prev => ({ ...prev, metaDescription: text }))}
              maxLength={160}
              multiline
            />

            <Input
              label="Keywords"
              placeholder="SEO keywords (comma separated)"
              value={formData.metaKeywords}
              onChangeText={(text) => setFormData(prev => ({ ...prev, metaKeywords: text }))}
            />

            <Input
              label="Author Notes"
              placeholder="Internal notes (not visible to users)"
              value={formData.authorNotes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, authorNotes: text }))}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const formatContentType = (type) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatCategory = (category) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusColor = (status) => {
    switch (status) {
      case CONTENT_STATUS.PUBLISHED:
        return enhancedDesignSystem.colors.success;
      case CONTENT_STATUS.DRAFT:
        return enhancedDesignSystem.colors.warning;
      case CONTENT_STATUS.ARCHIVED:
        return enhancedDesignSystem.colors.textSecondary;
      default:
        return enhancedDesignSystem.colors.textSecondary;
    }
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noAccessContainer}>
          <Ionicons name="lock-closed" size={64} color={enhancedDesignSystem.colors.textSecondary} />
          <Text style={styles.noAccessTitle}>Access Denied</Text>
          <Text style={styles.noAccessMessage}>
            You need administrator privileges to access the Content Management System.
          </Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.goBackButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Content Management</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateContent}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'content' && styles.activeTab]}
          onPress={() => setActiveTab('content')}
        >
          <Text style={[styles.tabText, activeTab === 'content' && styles.activeTabText]}>
            Content ({contentList.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'content' && (
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={enhancedDesignSystem.colors.primary} />
              <Text style={styles.loadingText}>Loading content...</Text>
            </View>
          ) : contentList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={64} color={enhancedDesignSystem.colors.textSecondary} />
              <Text style={styles.emptyTitle}>No Content Yet</Text>
              <Text style={styles.emptyMessage}>
                Create your first piece of content to get started
              </Text>
              <Button
                title="Create Content"
                onPress={handleCreateContent}
                style={styles.createFirstButton}
              />
            </View>
          ) : (
            <FlatList
              data={contentList}
              keyExtractor={(item) => item.id}
              renderItem={renderContentItem}
              refreshing={loading}
              onRefresh={loadContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      )}

      {activeTab === 'analytics' && (
        <View style={styles.analyticsContainer}>
          <Text style={styles.analyticsTitle}>Content Analytics</Text>
          <Text style={styles.analyticsSubtitle}>Coming soon...</Text>
        </View>
      )}

      {renderCreateModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: enhancedDesignSystem.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: enhancedDesignSystem.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: enhancedDesignSystem.colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: enhancedDesignSystem.typography.fontFamilyBold,
    color: enhancedDesignSystem.colors.text,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: enhancedDesignSystem.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  createButtonText: {
    color: 'white',
    fontFamily: enhancedDesignSystem.typography.fontFamilySemiBold,
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: enhancedDesignSystem.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: enhancedDesignSystem.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: enhancedDesignSystem.colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.textSecondary,
  },
  activeTabText: {
    color: enhancedDesignSystem.colors.primary,
  },
  contentContainer: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  contentCard: {
    marginBottom: 16,
    padding: 16,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  contentInfo: {
    flex: 1,
    marginRight: 12,
  },
  contentTitle: {
    fontSize: 16,
    fontFamily: enhancedDesignSystem.typography.fontFamilySemiBold,
    color: enhancedDesignSystem.colors.text,
    marginBottom: 4,
  },
  contentMeta: {
    fontSize: 12,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.textSecondary,
    marginBottom: 2,
  },
  contentDate: {
    fontSize: 11,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.textSecondary,
  },
  contentStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: 'white',
  },
  featuredBadge: {
    backgroundColor: '#FFF3CD',
    borderRadius: 10,
    padding: 2,
  },
  contentDescription: {
    fontSize: 14,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  contentStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: enhancedDesignSystem.colors.border,
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
  contentActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: enhancedDesignSystem.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  actionText: {
    fontSize: 12,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
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
    marginBottom: 24,
  },
  createFirstButton: {
    paddingHorizontal: 32,
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noAccessTitle: {
    fontSize: 24,
    fontFamily: enhancedDesignSystem.typography.fontFamilyBold,
    color: enhancedDesignSystem.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  noAccessMessage: {
    fontSize: 16,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  goBackButton: {
    paddingHorizontal: 32,
  },
  analyticsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsTitle: {
    fontSize: 24,
    fontFamily: enhancedDesignSystem.typography.fontFamilyBold,
    color: enhancedDesignSystem.colors.text,
    marginBottom: 8,
  },
  analyticsSubtitle: {
    fontSize: 16,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.textSecondary,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: enhancedDesignSystem.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: enhancedDesignSystem.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: enhancedDesignSystem.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: enhancedDesignSystem.typography.fontFamilySemiBold,
    color: enhancedDesignSystem.colors.text,
  },
  saveButton: {
    fontSize: 16,
    fontFamily: enhancedDesignSystem.typography.fontFamilySemiBold,
    color: enhancedDesignSystem.colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: enhancedDesignSystem.typography.fontFamilySemiBold,
    color: enhancedDesignSystem.colors.text,
    marginBottom: 16,
  },
  contentInput: {
    minHeight: 120,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.text,
    marginBottom: 8,
  },
  pickerOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: enhancedDesignSystem.colors.surface,
    borderWidth: 1,
    borderColor: enhancedDesignSystem.colors.border,
  },
  pickerOptionActive: {
    backgroundColor: enhancedDesignSystem.colors.primary,
    borderColor: enhancedDesignSystem.colors.primary,
  },
  pickerOptionText: {
    fontSize: 12,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.text,
  },
  pickerOptionTextActive: {
    color: 'white',
  },
  tagInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: enhancedDesignSystem.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.text,
    backgroundColor: enhancedDesignSystem.colors.surface,
    marginRight: 8,
  },
  addTagButton: {
    backgroundColor: enhancedDesignSystem.colors.primary,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: enhancedDesignSystem.colors.primary + '20',
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.primary,
  },
  uploadSection: {
    marginBottom: 16,
  },
  uploadLabel: {
    fontSize: 14,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.text,
    marginBottom: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: enhancedDesignSystem.colors.primary,
    borderStyle: 'dashed',
    gap: 8,
    marginBottom: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.primary,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: enhancedDesignSystem.colors.surface,
    borderRadius: 8,
    marginBottom: 4,
    gap: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 12,
    fontFamily: enhancedDesignSystem.typography.fontFamilyRegular,
    color: enhancedDesignSystem.colors.text,
  },
  uploadProgress: {
    marginTop: 8,
  },
  uploadProgressText: {
    fontSize: 12,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.textSecondary,
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: enhancedDesignSystem.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: enhancedDesignSystem.colors.primary,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontFamily: enhancedDesignSystem.typography.fontFamilyMedium,
    color: enhancedDesignSystem.colors.text,
  },
});