// Offline-First Sync Service for Bvester Mobile
// Handles data synchronization, conflict resolution, and offline storage

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as SQLite from 'expo-sqlite';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import CryptoJS from 'crypto-js';

// Background sync task name
const BACKGROUND_SYNC_TASK = 'BVESTER_BACKGROUND_SYNC';

// Initialize SQLite database for complex queries
const db = SQLite.openDatabase('bvester.db');

class OfflineSyncService {
  constructor() {
    this.syncQueue = [];
    this.isSyncing = false;
    this.conflictResolutionStrategy = 'client-wins'; // or 'server-wins', 'merge'
    this.encryptionKey = null;
    this.lastSyncTime = null;
    this.syncListeners = new Set();
    this.initializeDatabase();
    this.setupBackgroundSync();
  }

  // Initialize SQLite database
  initializeDatabase() {
    db.transaction(tx => {
      // Portfolio table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS portfolio (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          data TEXT,
          last_modified INTEGER,
          sync_status TEXT,
          version INTEGER
        )`
      );

      // Transactions table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          type TEXT,
          amount REAL,
          timestamp INTEGER,
          data TEXT,
          sync_status TEXT,
          retry_count INTEGER DEFAULT 0
        )`
      );

      // Market data cache
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS market_cache (
          symbol TEXT PRIMARY KEY,
          data TEXT,
          timestamp INTEGER,
          expiry INTEGER
        )`
      );

      // Sync metadata
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS sync_meta (
          key TEXT PRIMARY KEY,
          value TEXT,
          timestamp INTEGER
        )`
      );

      // Conflict log
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS conflict_log (
          id TEXT PRIMARY KEY,
          entity_type TEXT,
          entity_id TEXT,
          local_data TEXT,
          server_data TEXT,
          resolution TEXT,
          timestamp INTEGER
        )`
      );
    });
  }

  // Setup background sync
  async setupBackgroundSync() {
    try {
      // Register background fetch task
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });

      // Define the task
      TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
        try {
          await this.performBackgroundSync();
          return BackgroundFetch.Result.NewData;
        } catch (error) {
          console.error('Background sync error:', error);
          return BackgroundFetch.Result.Failed;
        }
      });
    } catch (error) {
      console.error('Failed to setup background sync:', error);
    }
  }

  // Set encryption key for sensitive data
  setEncryptionKey(key) {
    this.encryptionKey = key;
  }

  // Encrypt data
  encryptData(data) {
    if (!this.encryptionKey) return JSON.stringify(data);
    return CryptoJS.AES.encrypt(JSON.stringify(data), this.encryptionKey).toString();
  }

  // Decrypt data
  decryptData(encryptedData) {
    if (!this.encryptionKey) return JSON.parse(encryptedData);
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  // Save data with offline support
  async saveData(key, data, options = {}) {
    const timestamp = Date.now();
    const record = {
      data,
      timestamp,
      version: options.version || 1,
      syncStatus: 'pending',
      localChanges: true,
    };

    try {
      // Save to AsyncStorage for quick access
      const encrypted = this.encryptData(record);
      await AsyncStorage.setItem(`@bvester_${key}`, encrypted);

      // Save to SQLite for complex queries
      if (options.table) {
        await this.saveToSQLite(options.table, key, record);
      }

      // Add to sync queue
      this.addToSyncQueue({
        action: 'save',
        key,
        data,
        timestamp,
        retryCount: 0,
      });

      // Attempt immediate sync if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        this.processSync();
      }

      return { success: true, timestamp };
    } catch (error) {
      console.error('Save data error:', error);
      return { success: false, error: error.message };
    }
  }

  // Load data with fallback to cache
  async loadData(key, options = {}) {
    try {
      // Try to get from AsyncStorage first (fastest)
      const cached = await AsyncStorage.getItem(`@bvester_${key}`);
      
      if (cached) {
        const record = this.decryptData(cached);
        
        // Check if cache is still valid
        if (options.maxAge) {
          const age = Date.now() - record.timestamp;
          if (age > options.maxAge) {
            // Cache expired, try to fetch fresh data
            return await this.fetchFreshData(key, record);
          }
        }

        return record.data;
      }

      // Fallback to SQLite if not in AsyncStorage
      if (options.table) {
        return await this.loadFromSQLite(options.table, key);
      }

      // If no local data, fetch from server
      return await this.fetchFreshData(key, null);
    } catch (error) {
      console.error('Load data error:', error);
      return null;
    }
  }

  // Save to SQLite
  saveToSQLite(table, id, record) {
    return new Promise((resolve, reject) => {
      db.transaction(
        tx => {
          tx.executeSql(
            `INSERT OR REPLACE INTO ${table} (id, data, last_modified, sync_status, version) 
             VALUES (?, ?, ?, ?, ?)`,
            [id, this.encryptData(record.data), record.timestamp, record.syncStatus, record.version],
            (_, result) => resolve(result),
            (_, error) => reject(error)
          );
        },
        reject,
        resolve
      );
    });
  }

  // Load from SQLite
  loadFromSQLite(table, id) {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT * FROM ${table} WHERE id = ?`,
          [id],
          (_, { rows }) => {
            if (rows.length > 0) {
              const record = rows.item(0);
              resolve(this.decryptData(record.data));
            } else {
              resolve(null);
            }
          },
          (_, error) => reject(error)
        );
      });
    });
  }

  // Fetch fresh data from server
  async fetchFreshData(key, fallback) {
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      // Offline - return fallback
      return fallback?.data || null;
    }

    try {
      const token = await AsyncStorage.getItem('@auth_token');
      const response = await fetch(`https://api.bvester.com/data/${key}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Cache the fresh data
        await this.saveData(key, data, { skipSync: true });
        
        return data;
      }

      return fallback?.data || null;
    } catch (error) {
      console.error('Fetch fresh data error:', error);
      return fallback?.data || null;
    }
  }

  // Add to sync queue
  addToSyncQueue(item) {
    // Check if item already exists in queue
    const existingIndex = this.syncQueue.findIndex(
      q => q.key === item.key && q.action === item.action
    );

    if (existingIndex >= 0) {
      // Update existing item
      this.syncQueue[existingIndex] = {
        ...this.syncQueue[existingIndex],
        ...item,
        timestamp: Date.now(),
      };
    } else {
      // Add new item
      this.syncQueue.push(item);
    }

    // Persist queue
    this.persistSyncQueue();
  }

  // Persist sync queue to storage
  async persistSyncQueue() {
    try {
      await AsyncStorage.setItem(
        '@sync_queue',
        JSON.stringify(this.syncQueue)
      );
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }

  // Load sync queue from storage
  async loadSyncQueue() {
    try {
      const queue = await AsyncStorage.getItem('@sync_queue');
      if (queue) {
        this.syncQueue = JSON.parse(queue);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  // Process sync queue
  async processSync() {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    this.notifyListeners('sync_started', { queueSize: this.syncQueue.length });

    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      this.isSyncing = false;
      this.notifyListeners('sync_offline', {});
      return;
    }

    const results = {
      success: [],
      failed: [],
      conflicts: [],
    };

    // Process queue in batches
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < this.syncQueue.length; i += batchSize) {
      batches.push(this.syncQueue.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(item => this.syncItem(item));
      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        const item = batch[index];
        
        if (result.status === 'fulfilled') {
          if (result.value.conflict) {
            results.conflicts.push({ item, conflict: result.value.conflict });
          } else {
            results.success.push(item);
          }
        } else {
          results.failed.push({ item, error: result.reason });
          
          // Increment retry count
          item.retryCount = (item.retryCount || 0) + 1;
          
          // Remove from queue if max retries exceeded
          if (item.retryCount >= 3) {
            this.logSyncFailure(item, result.reason);
          }
        }
      });
    }

    // Remove successful items from queue
    this.syncQueue = this.syncQueue.filter(
      item => !results.success.some(s => s.key === item.key && s.action === item.action)
    );

    // Handle conflicts
    if (results.conflicts.length > 0) {
      await this.resolveConflicts(results.conflicts);
    }

    // Update last sync time
    this.lastSyncTime = Date.now();
    await AsyncStorage.setItem('@last_sync', this.lastSyncTime.toString());

    // Persist updated queue
    await this.persistSyncQueue();

    this.isSyncing = false;
    this.notifyListeners('sync_completed', results);

    return results;
  }

  // Sync individual item
  async syncItem(item) {
    const token = await AsyncStorage.getItem('@auth_token');
    
    try {
      const response = await fetch('https://api.bvester.com/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: item.action,
          key: item.key,
          data: item.data,
          timestamp: item.timestamp,
          clientVersion: item.version,
        }),
      });

      const result = await response.json();

      if (response.status === 409) {
        // Conflict detected
        return { conflict: result };
      }

      if (!response.ok) {
        throw new Error(result.message || 'Sync failed');
      }

      // Update local version
      if (result.version) {
        await this.updateLocalVersion(item.key, result.version);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Resolve conflicts
  async resolveConflicts(conflicts) {
    for (const { item, conflict } of conflicts) {
      let resolution;

      switch (this.conflictResolutionStrategy) {
        case 'server-wins':
          resolution = conflict.serverData;
          break;
        
        case 'client-wins':
          resolution = item.data;
          break;
        
        case 'merge':
          resolution = await this.mergeConflict(item.data, conflict.serverData);
          break;
        
        default:
          // Ask user to resolve
          resolution = await this.promptUserForResolution(item, conflict);
      }

      // Log conflict resolution
      await this.logConflict(item, conflict, resolution);

      // Save resolved data
      await this.saveData(item.key, resolution, { 
        skipSync: false, 
        version: conflict.serverVersion + 1 
      });
    }
  }

  // Merge conflicting data
  async mergeConflict(localData, serverData) {
    // Implement intelligent merging based on data type
    if (typeof localData === 'object' && typeof serverData === 'object') {
      // Merge objects
      return {
        ...serverData,
        ...localData,
        _merged: true,
        _mergeTimestamp: Date.now(),
      };
    }

    // For other types, prefer newer data
    return localData._timestamp > serverData._timestamp ? localData : serverData;
  }

  // Log conflict for analysis
  logConflict(item, conflict, resolution) {
    return new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO conflict_log (id, entity_type, entity_id, local_data, server_data, resolution, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            `conflict_${Date.now()}`,
            item.action,
            item.key,
            JSON.stringify(item.data),
            JSON.stringify(conflict.serverData),
            JSON.stringify(resolution),
            Date.now(),
          ],
          (_, result) => resolve(result),
          (_, error) => reject(error)
        );
      });
    });
  }

  // Log sync failure
  logSyncFailure(item, error) {
    console.error(`Sync failed for ${item.key}:`, error);
    // Could also log to a remote error tracking service
  }

  // Update local version number
  async updateLocalVersion(key, version) {
    try {
      const data = await AsyncStorage.getItem(`@bvester_${key}`);
      if (data) {
        const record = this.decryptData(data);
        record.version = version;
        await AsyncStorage.setItem(`@bvester_${key}`, this.encryptData(record));
      }
    } catch (error) {
      console.error('Failed to update local version:', error);
    }
  }

  // Perform background sync
  async performBackgroundSync() {
    console.log('Performing background sync...');
    
    // Load sync queue
    await this.loadSyncQueue();
    
    // Process sync
    const results = await this.processSync();
    
    // Send notification if there were updates
    if (results && results.success.length > 0) {
      // Notification handled by main app
      return { synced: results.success.length };
    }

    return { synced: 0 };
  }

  // Clear all cached data
  async clearCache() {
    try {
      // Clear AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const bvesterKeys = keys.filter(k => k.startsWith('@bvester_'));
      await AsyncStorage.multiRemove(bvesterKeys);

      // Clear SQLite tables
      await new Promise((resolve, reject) => {
        db.transaction(
          tx => {
            tx.executeSql('DELETE FROM portfolio');
            tx.executeSql('DELETE FROM transactions');
            tx.executeSql('DELETE FROM market_cache');
            tx.executeSql('DELETE FROM sync_meta');
            tx.executeSql('DELETE FROM conflict_log');
          },
          reject,
          resolve
        );
      });

      // Clear sync queue
      this.syncQueue = [];
      await this.persistSyncQueue();

      return { success: true };
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return { success: false, error: error.message };
    }
  }

  // Get sync statistics
  async getSyncStats() {
    const stats = {
      queueSize: this.syncQueue.length,
      lastSync: this.lastSyncTime,
      pendingChanges: 0,
      conflicts: 0,
      cacheSize: 0,
    };

    try {
      // Count pending changes
      await new Promise((resolve, reject) => {
        db.transaction(tx => {
          tx.executeSql(
            'SELECT COUNT(*) as count FROM portfolio WHERE sync_status = ?',
            ['pending'],
            (_, { rows }) => {
              stats.pendingChanges += rows.item(0).count;
            }
          );
          tx.executeSql(
            'SELECT COUNT(*) as count FROM transactions WHERE sync_status = ?',
            ['pending'],
            (_, { rows }) => {
              stats.pendingChanges += rows.item(0).count;
            }
          );
          tx.executeSql(
            'SELECT COUNT(*) as count FROM conflict_log',
            [],
            (_, { rows }) => {
              stats.conflicts = rows.item(0).count;
              resolve();
            }
          );
        });
      });

      // Calculate cache size
      const keys = await AsyncStorage.getAllKeys();
      const bvesterKeys = keys.filter(k => k.startsWith('@bvester_'));
      
      for (const key of bvesterKeys) {
        const value = await AsyncStorage.getItem(key);
        stats.cacheSize += new Blob([value]).size;
      }

      return stats;
    } catch (error) {
      console.error('Failed to get sync stats:', error);
      return stats;
    }
  }

  // Add sync listener
  addSyncListener(callback) {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  // Notify sync listeners
  notifyListeners(event, data) {
    this.syncListeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }

  // Optimize database
  async optimizeDatabase() {
    try {
      await new Promise((resolve, reject) => {
        db.transaction(
          tx => {
            // Clean old market cache
            const expiry = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
            tx.executeSql(
              'DELETE FROM market_cache WHERE timestamp < ?',
              [expiry]
            );

            // Clean old conflict logs
            const oldConflicts = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
            tx.executeSql(
              'DELETE FROM conflict_log WHERE timestamp < ?',
              [oldConflicts]
            );

            // Vacuum database
            tx.executeSql('VACUUM');
          },
          reject,
          resolve
        );
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to optimize database:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new OfflineSyncService();