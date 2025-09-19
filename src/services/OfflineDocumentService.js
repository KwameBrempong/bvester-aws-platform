import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

class OfflineDocumentService {
  constructor() {
    this.documentsDir = `${FileSystem.documentDirectory}offline_documents/`;
    this.metadataKey = 'offline_documents_metadata';
    this.initialized = false;
  }

  /**
   * Initialize the offline document service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Create documents directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(this.documentsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.documentsDir, { intermediates: true });
      }

      // Initialize metadata store
      const metadata = await this.getMetadata();
      if (!metadata) {
        await this.saveMetadata({
          documents: {},
          lastSync: null,
          totalSize: 0,
        });
      }

      this.initialized = true;
      console.log('✅ Offline document service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize offline document service:', error);
    }
  }

  /**
   * Download and cache document for offline viewing
   */
  async cacheDocument(documentData) {
    try {
      const { id, name, url, type, size, category } = documentData;
      
      // Generate unique filename
      const filename = await this.generateFilename(name, type);
      const localPath = `${this.documentsDir}${filename}`;

      // Download the document
      console.log('📥 Downloading document:', name);
      const downloadResult = await FileSystem.downloadAsync(url, localPath);

      if (downloadResult.status === 200) {
        // Update metadata
        const metadata = await this.getMetadata();
        metadata.documents[id] = {
          id,
          name,
          originalUrl: url,
          localPath: downloadResult.uri,
          type,
          size,
          category,
          filename,
          downloadDate: new Date().toISOString(),
          lastAccessed: new Date().toISOString(),
          accessCount: 0,
        };
        metadata.totalSize += size || 0;
        metadata.lastSync = new Date().toISOString();

        await this.saveMetadata(metadata);

        console.log('✅ Document cached successfully:', name);
        return {
          success: true,
          localPath: downloadResult.uri,
          metadata: metadata.documents[id],
        };
      } else {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to cache document:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get cached document path
   */
  async getCachedDocument(documentId) {
    try {
      const metadata = await this.getMetadata();
      const doc = metadata.documents[documentId];

      if (!doc) {
        return null;
      }

      // Check if file still exists
      const fileInfo = await FileSystem.getInfoAsync(doc.localPath);
      if (!fileInfo.exists) {
        // Remove from metadata if file is missing
        delete metadata.documents[documentId];
        await this.saveMetadata(metadata);
        return null;
      }

      // Update access info
      doc.lastAccessed = new Date().toISOString();
      doc.accessCount = (doc.accessCount || 0) + 1;
      metadata.documents[documentId] = doc;
      await this.saveMetadata(metadata);

      return doc;
    } catch (error) {
      console.error('❌ Failed to get cached document:', error);
      return null;
    }
  }

  /**
   * Check if document is cached
   */
  async isDocumentCached(documentId) {
    try {
      const metadata = await this.getMetadata();
      const doc = metadata.documents[documentId];

      if (!doc) return false;

      // Verify file exists
      const fileInfo = await FileSystem.getInfoAsync(doc.localPath);
      return fileInfo.exists;
    } catch (error) {
      console.error('❌ Failed to check document cache:', error);
      return false;
    }
  }

  /**
   * Get all cached documents
   */
  async getAllCachedDocuments() {
    try {
      const metadata = await this.getMetadata();
      const validDocuments = {};

      // Verify each document exists
      for (const [id, doc] of Object.entries(metadata.documents)) {
        const fileInfo = await FileSystem.getInfoAsync(doc.localPath);
        if (fileInfo.exists) {
          validDocuments[id] = doc;
        } else {
          // Remove missing files from metadata
          metadata.totalSize -= doc.size || 0;
        }
      }

      // Update metadata if any files were removed
      if (Object.keys(validDocuments).length !== Object.keys(metadata.documents).length) {
        metadata.documents = validDocuments;
        await this.saveMetadata(metadata);
      }

      return Object.values(validDocuments);
    } catch (error) {
      console.error('❌ Failed to get cached documents:', error);
      return [];
    }
  }

  /**
   * Remove document from cache
   */
  async removeCachedDocument(documentId) {
    try {
      const metadata = await this.getMetadata();
      const doc = metadata.documents[documentId];

      if (!doc) {
        return { success: true, message: 'Document not in cache' };
      }

      // Delete the file
      const fileInfo = await FileSystem.getInfoAsync(doc.localPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(doc.localPath);
      }

      // Update metadata
      metadata.totalSize -= doc.size || 0;
      delete metadata.documents[documentId];
      await this.saveMetadata(metadata);

      console.log('🗑️ Document removed from cache:', doc.name);
      return { success: true, message: 'Document removed from cache' };
    } catch (error) {
      console.error('❌ Failed to remove cached document:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear all cached documents
   */
  async clearAllCachedDocuments() {
    try {
      // Delete all files in the documents directory
      const dirInfo = await FileSystem.getInfoAsync(this.documentsDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(this.documentsDir);
        await FileSystem.makeDirectoryAsync(this.documentsDir, { intermediates: true });
      }

      // Reset metadata
      await this.saveMetadata({
        documents: {},
        lastSync: null,
        totalSize: 0,
      });

      console.log('🧹 All cached documents cleared');
      return { success: true, message: 'All cached documents cleared' };
    } catch (error) {
      console.error('❌ Failed to clear cached documents:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const metadata = await this.getMetadata();
      const documents = await this.getAllCachedDocuments();

      return {
        totalDocuments: documents.length,
        totalSize: metadata.totalSize,
        totalSizeFormatted: this.formatFileSize(metadata.totalSize),
        lastSync: metadata.lastSync,
        documents: documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          size: doc.size,
          sizeFormatted: this.formatFileSize(doc.size),
          category: doc.category,
          downloadDate: doc.downloadDate,
          lastAccessed: doc.lastAccessed,
          accessCount: doc.accessCount,
        })),
      };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return {
        totalDocuments: 0,
        totalSize: 0,
        totalSizeFormatted: '0 B',
        lastSync: null,
        documents: [],
      };
    }
  }

  /**
   * Clean up old/unused cached documents
   */
  async cleanupCache(options = {}) {
    try {
      const {
        maxAge = 30 * 24 * 60 * 60 * 1000, // 30 days
        maxSize = 100 * 1024 * 1024, // 100MB
        keepMostRecent = 10,
      } = options;

      const metadata = await this.getMetadata();
      const documents = Object.values(metadata.documents);
      const now = new Date().getTime();
      let removedCount = 0;
      let removedSize = 0;

      // Sort by last accessed (oldest first)
      documents.sort((a, b) => new Date(a.lastAccessed) - new Date(b.lastAccessed));

      // Remove old documents
      for (const doc of documents) {
        const lastAccessed = new Date(doc.lastAccessed).getTime();
        const age = now - lastAccessed;

        if (age > maxAge || metadata.totalSize > maxSize || removedCount < documents.length - keepMostRecent) {
          const result = await this.removeCachedDocument(doc.id);
          if (result.success) {
            removedCount++;
            removedSize += doc.size || 0;
          }
        }
      }

      console.log(`🧹 Cache cleanup completed: ${removedCount} documents removed, ${this.formatFileSize(removedSize)} freed`);
      return {
        success: true,
        removedCount,
        removedSize,
        removedSizeFormatted: this.formatFileSize(removedSize),
      };
    } catch (error) {
      console.error('❌ Failed to cleanup cache:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Bulk cache documents
   */
  async bulkCacheDocuments(documents, onProgress) {
    const results = [];
    let completed = 0;

    for (const doc of documents) {
      try {
        const result = await this.cacheDocument(doc);
        results.push(result);
        completed++;

        if (onProgress) {
          onProgress({
            completed,
            total: documents.length,
            currentDocument: doc.name,
            success: result.success,
          });
        }
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          documentId: doc.id,
        });
        completed++;

        if (onProgress) {
          onProgress({
            completed,
            total: documents.length,
            currentDocument: doc.name,
            success: false,
            error: error.message,
          });
        }
      }
    }

    return results;
  }

  /**
   * Export cached documents metadata
   */
  async exportMetadata() {
    try {
      const metadata = await this.getMetadata();
      const stats = await this.getCacheStats();
      
      return {
        metadata,
        stats,
        exportDate: new Date().toISOString(),
        platform: Platform.OS,
      };
    } catch (error) {
      console.error('❌ Failed to export metadata:', error);
      return null;
    }
  }

  // Helper methods

  async generateFilename(originalName, type) {
    const timestamp = Date.now();
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.MD5,
      `${originalName}_${timestamp}`
    );
    const extension = this.getFileExtension(type);
    return `${hash.substring(0, 8)}_${timestamp}${extension}`;
  }

  getFileExtension(type) {
    const extensions = {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'text/plain': '.txt',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'application/json': '.json',
    };
    return extensions[type] || '.bin';
  }

  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }

  async getMetadata() {
    try {
      const metadata = await AsyncStorage.getItem(this.metadataKey);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      console.error('❌ Failed to get metadata:', error);
      return null;
    }
  }

  async saveMetadata(metadata) {
    try {
      await AsyncStorage.setItem(this.metadataKey, JSON.stringify(metadata));
    } catch (error) {
      console.error('❌ Failed to save metadata:', error);
    }
  }
}

// Export singleton instance
const offlineDocumentService = new OfflineDocumentService();
export default offlineDocumentService;