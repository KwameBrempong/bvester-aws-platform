/**
 * BVESTER PLATFORM - VR/AR INTEGRATION SERVICE
 * Immersive business presentations and virtual tours
 * Generated: January 28, 2025
 */

const FirebaseService = require('./firebaseService');
const { FirebaseAdmin } = require('../config/firebase-admin');
const crypto = require('crypto');

class VRIntegrationService {
  constructor() {
    // VR Experience types
    this.experienceTypes = {
      'business_tour': {
        name: 'Virtual Business Tour',
        description: 'Immersive 360° tour of business facilities',
        duration: '5-15 minutes',
        features: ['360_video', 'interactive_hotspots', 'audio_narration', 'data_overlays'],
        supportedDevices: ['vr_headset', 'mobile', 'desktop', 'tablet']
      },
      'product_showcase': {
        name: 'Product Showcase',
        description: '3D product demonstrations and interactions',
        duration: '3-10 minutes',
        features: ['3d_models', 'animations', 'technical_specs', 'comparison_tools'],
        supportedDevices: ['vr_headset', 'ar_mobile', 'desktop']
      },
      'facility_walkthrough': {
        name: 'Facility Walkthrough',
        description: 'Virtual walkthrough of manufacturing or office spaces',
        duration: '10-20 minutes',
        features: ['guided_tour', 'process_visualization', 'equipment_details', 'safety_highlights'],
        supportedDevices: ['vr_headset', 'mobile', 'desktop']
      },
      'impact_visualization': {
        name: 'Impact Visualization',
        description: 'Visual representation of social and environmental impact',
        duration: '5-12 minutes',
        features: ['data_visualization', 'before_after', 'community_stories', 'metrics_display'],
        supportedDevices: ['vr_headset', 'mobile', 'desktop', 'tablet']
      },
      'live_demo': {
        name: 'Live Demo Session',
        description: 'Real-time interactive business demonstrations',
        duration: '15-30 minutes',
        features: ['live_streaming', 'voice_chat', 'screen_sharing', 'collaborative_tools'],
        supportedDevices: ['vr_headset', 'desktop', 'mobile']
      },
      'ar_presentation': {
        name: 'AR Business Presentation',
        description: 'Augmented reality enhanced business presentations',
        duration: '8-20 minutes',
        features: ['ar_overlays', 'interactive_charts', 'holographic_models', 'gesture_control'],
        supportedDevices: ['ar_mobile', 'ar_headset', 'tablet']
      }
    };
    
    // VR Content quality tiers
    this.qualityTiers = {
      'basic': {
        resolution: '1080p',
        frameRate: 30,
        features: ['basic_360', 'simple_hotspots'],
        maxDuration: 10,
        storageLimit: '500MB'
      },
      'professional': {
        resolution: '4K',
        frameRate: 60,
        features: ['advanced_360', 'interactive_elements', 'spatial_audio', 'analytics'],
        maxDuration: 20,
        storageLimit: '2GB'
      },
      'enterprise': {
        resolution: '8K',
        frameRate: 90,
        features: ['photorealistic', 'real_time_data', 'ai_narration', 'custom_branding'],
        maxDuration: 30,
        storageLimit: '5GB'
      }
    };
    
    // Supported VR/AR platforms
    this.platforms = {
      'oculus': {
        name: 'Meta Quest',
        type: 'vr_headset',
        capabilities: ['6dof', 'hand_tracking', 'spatial_audio', 'passthrough'],
        maxResolution: '2160x2160',
        supportedFormats: ['mp4', 'webm', 'obj', 'gltf']
      },
      'webxr': {
        name: 'WebXR (Browser)',
        type: 'web_based',
        capabilities: ['cross_platform', 'no_install', 'progressive_loading'],
        maxResolution: '4K',
        supportedFormats: ['mp4', 'webm', 'gltf', 'usdz']
      },
      'arcore': {
        name: 'ARCore (Android)',
        type: 'ar_mobile',
        capabilities: ['plane_detection', 'light_estimation', 'occlusion'],
        maxResolution: '1080p',
        supportedFormats: ['gltf', 'usdz', 'obj']
      },
      'arkit': {
        name: 'ARKit (iOS)',
        type: 'ar_mobile',
        capabilities: ['lidar_scanning', 'people_occlusion', 'location_anchors'],
        maxResolution: '4K',
        supportedFormats: ['usdz', 'gltf', 'obj']
      },
      'hololens': {
        name: 'Microsoft HoloLens',
        type: 'ar_headset',
        capabilities: ['mixed_reality', 'spatial_mapping', 'gesture_control'],
        maxResolution: '2K',
        supportedFormats: ['gltf', 'obj', 'fbx']
      }
    };
    
    // Content creation tools and integrations
    this.contentTools = {
      'matterport': {
        name: 'Matterport 3D Capture',
        type: 'scanning',
        capabilities: ['3d_scanning', 'floor_plans', 'measurements'],
        costPerSpace: 150
      },
      'unity': {
        name: 'Unity 3D Engine',
        type: 'development',
        capabilities: ['custom_experiences', 'interactive_elements', 'cross_platform'],
        developmentTime: '2-8 weeks'
      },
      'unreal': {
        name: 'Unreal Engine',
        type: 'development',
        capabilities: ['photorealistic_rendering', 'real_time_ray_tracing'],
        developmentTime: '3-10 weeks'
      },
      'ready_player_me': {
        name: 'Ready Player Me',
        type: 'avatars',
        capabilities: ['custom_avatars', 'ai_generation', 'cross_platform'],
        costPerAvatar: 50
      }
    };
  }
  
  // ============================================================================
  // VR EXPERIENCE MANAGEMENT
  // ============================================================================
  
  /**
   * Create new VR experience for business
   */
  async createVRExperience(businessId, experienceData) {
    try {
      console.log(`🥽 Creating VR experience for business: ${businessId}`);
      
      // Validate business access and subscription
      const accessCheck = await this.validateVRAccess(businessId);
      if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.reason };
      }
      
      // Validate experience data
      const validationResult = this.validateExperienceData(experienceData);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error };
      }
      
      // Generate experience ID and metadata
      const experienceId = this.generateExperienceId();
      const qualityTier = this.determineQualityTier(businessId, experienceData);
      
      const vrExperience = {
        experienceId: experienceId,
        businessId: businessId,
        type: experienceData.type,
        title: experienceData.title,
        description: experienceData.description,
        
        // Experience configuration
        config: {
          qualityTier: qualityTier,
          duration: experienceData.duration || 10,
          supportedDevices: this.experienceTypes[experienceData.type].supportedDevices,
          features: experienceData.features || this.experienceTypes[experienceData.type].features,
          accessibility: {
            subtitles: experienceData.subtitles || false,
            audioDescriptions: experienceData.audioDescriptions || false,
            reducedMotion: experienceData.reducedMotion || false
          }
        },
        
        // Content assets
        assets: {
          videos: experienceData.videos || [],
          models: experienceData.models || [],
          images: experienceData.images || [],
          audio: experienceData.audio || [],
          documents: experienceData.documents || []
        },
        
        // Interactive elements
        interactivity: {
          hotspots: experienceData.hotspots || [],
          navigation: experienceData.navigation || 'guided',
          userControls: experienceData.userControls || ['look', 'point'],
          dataOverlays: experienceData.dataOverlays || []
        },
        
        // Analytics and tracking
        analytics: {
          enabled: true,
          trackingPoints: experienceData.trackingPoints || [],
          heatmapGeneration: qualityTier !== 'basic',
          userBehaviorAnalysis: qualityTier === 'enterprise'
        },
        
        // Publication and access
        publication: {
          status: 'draft',
          visibility: experienceData.visibility || 'private',
          accessCode: this.generateAccessCode(),
          expirationDate: experienceData.expirationDate || null,
          maxViewers: experienceData.maxViewers || 100
        },
        
        // Metadata
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: experienceData.createdBy,
          version: '1.0',
          tags: experienceData.tags || [],
          category: experienceData.category || 'general'
        },
        
        // Processing status
        processing: {
          status: 'pending',
          progress: 0,
          steps: this.getProcessingSteps(experienceData.type),
          startedAt: new Date(),
          estimatedCompletion: this.estimateProcessingTime(experienceData)
        }
      };
      
      // Store VR experience in database
      const docRef = await FirebaseAdmin.adminFirestore
        .collection('vrExperiences')
        .add(vrExperience);
      
      // Update business profile with VR capability
      await FirebaseService.updateBusinessProfile(businessId, {
        'features.vrEnabled': true,
        'features.vrExperienceCount': FirebaseService.increment(1),
        'metadata.lastVRUpdate': new Date()
      });
      
      // Start processing pipeline
      await this.initiateProcessingPipeline(experienceId, vrExperience);
      
      // Log VR experience creation
      await FirebaseService.logActivity(
        businessId,
        'vr_experience_created',
        'vr',
        experienceId,
        { 
          type: experienceData.type,
          qualityTier: qualityTier,
          assetCount: Object.values(vrExperience.assets).flat().length
        }
      );
      
      return {
        success: true,
        experienceId: experienceId,
        accessCode: vrExperience.publication.accessCode,
        processingEstimate: vrExperience.processing.estimatedCompletion,
        qualityTier: qualityTier
      };
      
    } catch (error) {
      console.error('Error creating VR experience:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get VR experience details
   */
  async getVRExperience(experienceId, userId = null) {
    try {
      const experienceQuery = FirebaseAdmin.adminFirestore
        .collection('vrExperiences')
        .where('experienceId', '==', experienceId);
      
      const snapshot = await experienceQuery.get();
      
      if (snapshot.empty) {
        return { success: false, error: 'VR experience not found' };
      }
      
      const experience = snapshot.docs[0].data();
      
      // Check access permissions
      if (userId) {
        const accessCheck = await this.checkExperienceAccess(experience, userId);
        if (!accessCheck.allowed) {
          return { success: false, error: 'Access denied to VR experience' };
        }
      }
      
      // Get additional context
      const businessInfo = await this.getBusinessInfo(experience.businessId);
      const viewingStats = await this.getExperienceStats(experienceId);
      
      return {
        success: true,
        experience: {
          ...experience,
          businessInfo: businessInfo,
          stats: viewingStats,
          accessUrl: this.generateAccessUrl(experienceId, experience.publication.accessCode),
          deviceCompatibility: this.checkDeviceCompatibility(experience.config.supportedDevices)
        }
      };
      
    } catch (error) {
      console.error('Error getting VR experience:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Schedule live VR session
   */
  async scheduleLiveVRSession(businessId, sessionData) {
    try {
      console.log(`📅 Scheduling live VR session for business: ${businessId}`);
      
      // Validate scheduling permissions
      const accessCheck = await this.validateVRAccess(businessId);
      if (!accessCheck.allowed) {
        return { success: false, error: accessCheck.reason };
      }
      
      const sessionId = this.generateSessionId();
      
      const liveSession = {
        sessionId: sessionId,
        businessId: businessId,
        type: 'live_demo',
        title: sessionData.title,
        description: sessionData.description,
        
        // Scheduling details
        schedule: {
          startTime: new Date(sessionData.startTime),
          endTime: new Date(sessionData.endTime),
          timezone: sessionData.timezone || 'UTC',
          duration: sessionData.duration || 30,
          maxParticipants: sessionData.maxParticipants || 10
        },
        
        // Session configuration
        config: {
          platform: sessionData.platform || 'webxr',
          recordSession: sessionData.recordSession || false,
          allowInteraction: sessionData.allowInteraction !== false,
          moderationEnabled: true,
          qualityTier: this.determineQualityTier(businessId, sessionData)
        },
        
        // Participants management
        participants: {
          registered: [],
          attended: [],
          inviteOnly: sessionData.inviteOnly || false,
          registrationRequired: sessionData.registrationRequired !== false
        },
        
        // Content and features
        content: {
          presentation: sessionData.presentation || null,
          vrEnvironment: sessionData.vrEnvironment || 'default',
          sharedAssets: sessionData.sharedAssets || [],
          interactiveElements: sessionData.interactiveElements || []
        },
        
        // Technical setup
        technical: {
          streamingQuality: sessionData.streamingQuality || 'HD',
          bandwidthOptimization: true,
          fallbackOptions: ['mobile_view', 'audio_only'],
          recordingFormat: sessionData.recordingFormat || 'mp4'
        },
        
        // Metadata
        metadata: {
          createdAt: new Date(),
          createdBy: sessionData.createdBy,
          category: sessionData.category || 'investor_demo',
          tags: sessionData.tags || [],
          language: sessionData.language || 'en'
        },
        
        status: 'scheduled'
      };
      
      // Store live session
      const docRef = await FirebaseAdmin.adminFirestore
        .collection('vrLiveSessions')
        .add(liveSession);
      
      // Create calendar event (integration with calendar services)
      const calendarEvent = await this.createCalendarEvent(liveSession);
      
      // Send session confirmation
      await this.sendSessionConfirmation(businessId, liveSession);
      
      // Log session creation
      await FirebaseService.logActivity(
        businessId,
        'vr_live_session_scheduled',
        'vr',
        sessionId,
        { 
          startTime: sessionData.startTime,
          duration: sessionData.duration,
          maxParticipants: sessionData.maxParticipants
        }
      );
      
      return {
        success: true,
        sessionId: sessionId,
        joinUrl: this.generateSessionUrl(sessionId),
        calendarEvent: calendarEvent,
        registrationUrl: this.generateRegistrationUrl(sessionId)
      };
      
    } catch (error) {
      console.error('Error scheduling live VR session:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Register for live VR session
   */
  async registerForSession(sessionId, userId, registrationData) {
    try {
      // Get session details
      const sessionQuery = FirebaseAdmin.adminFirestore
        .collection('vrLiveSessions')
        .where('sessionId', '==', sessionId);
      
      const snapshot = await sessionQuery.get();
      
      if (snapshot.empty) {
        return { success: false, error: 'VR session not found' };
      }
      
      const sessionDoc = snapshot.docs[0];
      const session = sessionDoc.data();
      
      // Check if registration is still open
      if (new Date() > new Date(session.schedule.startTime)) {
        return { success: false, error: 'Registration closed - session has started' };
      }
      
      // Check capacity
      if (session.participants.registered.length >= session.schedule.maxParticipants) {
        return { success: false, error: 'Session is full' };
      }
      
      // Check if user already registered
      if (session.participants.registered.some(p => p.userId === userId)) {
        return { success: false, error: 'Already registered for this session' };
      }
      
      // Get user information
      const userResult = await FirebaseService.getUserProfile(userId);
      if (!userResult.success) {
        return { success: false, error: 'User profile not found' };
      }
      
      const participant = {
        userId: userId,
        name: userResult.user.profile?.displayName || 'Anonymous',
        email: userResult.user.email,
        userType: userResult.user.userType,
        registeredAt: new Date(),
        devicePreference: registrationData.devicePreference || 'desktop',
        interests: registrationData.interests || [],
        questions: registrationData.questions || []
      };
      
      // Add participant to session
      await sessionDoc.ref.update({
        'participants.registered': FirebaseService.arrayUnion(participant)
      });
      
      // Send confirmation email
      await this.sendRegistrationConfirmation(userId, session);
      
      // Add calendar reminder
      await this.scheduleSessionReminders(userId, session);
      
      return {
        success: true,
        joinUrl: this.generateSessionUrl(sessionId, userId),
        sessionDetails: {
          title: session.title,
          startTime: session.schedule.startTime,
          duration: session.schedule.duration,
          platform: session.config.platform
        }
      };
      
    } catch (error) {
      console.error('Error registering for VR session:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // VR ANALYTICS AND INSIGHTS
  // ============================================================================
  
  /**
   * Track VR experience interaction
   */
  async trackVRInteraction(experienceId, userId, interactionData) {
    try {
      const interaction = {
        experienceId: experienceId,
        userId: userId,
        sessionId: interactionData.sessionId || this.generateSessionId(),
        
        // Interaction details
        type: interactionData.type, // 'view', 'hotspot_click', 'navigation', 'completion'
        timestamp: new Date(),
        duration: interactionData.duration || 0,
        
        // Spatial data
        position: interactionData.position || { x: 0, y: 0, z: 0 },
        orientation: interactionData.orientation || { x: 0, y: 0, z: 0 },
        gazeData: interactionData.gazeData || null,
        
        // Device information
        device: {
          type: interactionData.deviceType || 'unknown',
          model: interactionData.deviceModel || 'unknown',
          platform: interactionData.platform || 'webxr',
          resolution: interactionData.resolution || 'unknown',
          frameRate: interactionData.frameRate || 0
        },
        
        // Performance metrics
        performance: {
          loadTime: interactionData.loadTime || 0,
          frameDrops: interactionData.frameDrops || 0,
          memoryUsage: interactionData.memoryUsage || 0,
          networkLatency: interactionData.networkLatency || 0
        },
        
        // User engagement
        engagement: {
          attentionScore: interactionData.attentionScore || 0,
          interactionIntensity: interactionData.interactionIntensity || 0,
          emotionalResponse: interactionData.emotionalResponse || null,
          completionRate: interactionData.completionRate || 0
        },
        
        // Context data
        context: {
          sceneId: interactionData.sceneId || null,
          hotspotId: interactionData.hotspotId || null,
          userAgent: interactionData.userAgent || 'unknown',
          referrer: interactionData.referrer || null
        }
      };
      
      // Store interaction data
      await FirebaseAdmin.adminFirestore
        .collection('vrInteractions')
        .add(interaction);
      
      // Update real-time analytics
      await this.updateRealTimeAnalytics(experienceId, interaction);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error tracking VR interaction:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Generate VR analytics report
   */
  async generateVRAnalytics(experienceId, timeRange = '30d') {
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }
      
      // Get interaction data
      const interactionsQuery = FirebaseAdmin.adminFirestore
        .collection('vrInteractions')
        .where('experienceId', '==', experienceId)
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate);
      
      const snapshot = await interactionsQuery.get();
      
      const analytics = {
        overview: {
          totalViews: 0,
          uniqueViewers: new Set(),
          averageSessionDuration: 0,
          completionRate: 0,
          totalEngagementTime: 0
        },
        
        demographics: {
          deviceTypes: {},
          platforms: {},
          userTypes: {},
          geographicDistribution: {}
        },
        
        engagement: {
          hotspotInteractions: {},
          navigationPatterns: [],
          attentionHeatmap: [],
          dropOffPoints: []
        },
        
        performance: {
          averageLoadTime: 0,
          frameRateIssues: 0,
          technicalProblems: 0,
          deviceCompatibility: {}
        },
        
        insights: {
          peakUsageTimes: [],
          mostEngagingContent: [],
          improvementAreas: [],
          userFeedback: []
        }
      };
      
      let totalDuration = 0;
      let totalAttention = 0;
      let totalLoadTime = 0;
      let completedSessions = 0;
      
      snapshot.forEach(doc => {
        const interaction = doc.data();
        
        // Overview metrics
        analytics.overview.totalViews++;
        analytics.overview.uniqueViewers.add(interaction.userId);
        totalDuration += interaction.duration || 0;
        
        // Demographics
        analytics.demographics.deviceTypes[interaction.device.type] = 
          (analytics.demographics.deviceTypes[interaction.device.type] || 0) + 1;
        
        analytics.demographics.platforms[interaction.device.platform] = 
          (analytics.demographics.platforms[interaction.device.platform] || 0) + 1;
        
        // Engagement metrics
        if (interaction.type === 'hotspot_click' && interaction.context.hotspotId) {
          analytics.engagement.hotspotInteractions[interaction.context.hotspotId] = 
            (analytics.engagement.hotspotInteractions[interaction.context.hotspotId] || 0) + 1;
        }
        
        if (interaction.engagement?.attentionScore) {
          totalAttention += interaction.engagement.attentionScore;
        }
        
        if (interaction.type === 'completion') {
          completedSessions++;
        }
        
        // Performance metrics
        totalLoadTime += interaction.performance?.loadTime || 0;
        
        if (interaction.performance?.frameDrops > 0) {
          analytics.performance.frameRateIssues++;
        }
      });
      
      // Calculate averages and rates
      const totalInteractions = analytics.overview.totalViews;
      if (totalInteractions > 0) {
        analytics.overview.averageSessionDuration = Math.round(totalDuration / totalInteractions);
        analytics.overview.completionRate = Math.round((completedSessions / totalInteractions) * 100);
        analytics.performance.averageLoadTime = Math.round(totalLoadTime / totalInteractions);
      }
      
      analytics.overview.uniqueViewers = analytics.overview.uniqueViewers.size;
      analytics.overview.totalEngagementTime = totalDuration;
      
      // Generate insights
      analytics.insights = await this.generateVRInsights(analytics, experienceId);
      
      return { success: true, analytics };
      
    } catch (error) {
      console.error('Error generating VR analytics:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Validate VR access for business
   */
  async validateVRAccess(businessId) {
    try {
      const businessResult = await FirebaseService.getBusinessProfile(businessId);
      if (!businessResult.success) {
        return { allowed: false, reason: 'Business not found' };
      }
      
      const business = businessResult.business;
      
      // Check subscription level
      const subscription = business.subscription || {};
      if (subscription.plan === 'basic') {
        return { allowed: false, reason: 'VR features require Professional or Enterprise subscription' };
      }
      
      // Check VR quota
      const vrCount = business.features?.vrExperienceCount || 0;
      const maxVR = subscription.plan === 'professional' ? 5 : 20;
      
      if (vrCount >= maxVR) {
        return { allowed: false, reason: `VR experience limit reached (${maxVR})` };
      }
      
      return { allowed: true };
      
    } catch (error) {
      console.error('Error validating VR access:', error);
      return { allowed: false, reason: 'Access validation failed' };
    }
  }
  
  /**
   * Validate experience data
   */
  validateExperienceData(data) {
    if (!data.type || !this.experienceTypes[data.type]) {
      return { valid: false, error: 'Invalid or missing experience type' };
    }
    
    if (!data.title || data.title.length < 3) {
      return { valid: false, error: 'Title must be at least 3 characters' };
    }
    
    if (!data.description || data.description.length < 10) {
      return { valid: false, error: 'Description must be at least 10 characters' };
    }
    
    if (data.duration && (data.duration < 1 || data.duration > 60)) {
      return { valid: false, error: 'Duration must be between 1 and 60 minutes' };
    }
    
    return { valid: true };
  }
  
  /**
   * Determine quality tier based on subscription and requirements
   */
  determineQualityTier(businessId, data) {
    // This would check business subscription in real implementation
    // For now, return based on data complexity
    
    const assetCount = Object.values(data.assets || {}).flat().length;
    const hasAdvancedFeatures = data.features?.includes('real_time_data') || 
                               data.features?.includes('ai_narration');
    
    if (hasAdvancedFeatures || assetCount > 20) {
      return 'enterprise';
    } else if (assetCount > 5 || data.duration > 15) {
      return 'professional';
    } else {
      return 'basic';
    }
  }
  
  /**
   * Generate unique experience ID
   */
  generateExperienceId() {
    return `vr_exp_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }
  
  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `vr_session_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }
  
  /**
   * Generate access code
   */
  generateAccessCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }
  
  /**
   * Generate access URL
   */
  generateAccessUrl(experienceId, accessCode) {
    const baseUrl = process.env.VR_BASE_URL || 'https://vr.bvester.com';
    return `${baseUrl}/experience/${experienceId}?code=${accessCode}`;
  }
  
  /**
   * Generate session URL
   */
  generateSessionUrl(sessionId, userId = null) {
    const baseUrl = process.env.VR_BASE_URL || 'https://vr.bvester.com';
    const userParam = userId ? `&user=${userId}` : '';
    return `${baseUrl}/live/${sessionId}?${userParam}`;
  }
  
  /**
   * Get processing steps for experience type
   */
  getProcessingSteps(type) {
    const commonSteps = ['asset_validation', 'quality_optimization', 'platform_conversion'];
    
    const typeSpecificSteps = {
      'business_tour': [...commonSteps, 'hotspot_generation', 'navigation_setup'],
      'product_showcase': [...commonSteps, '3d_optimization', 'interaction_setup'],
      'facility_walkthrough': [...commonSteps, 'guided_tour_setup', 'safety_annotations'],
      'impact_visualization': [...commonSteps, 'data_integration', 'visualization_setup'],
      'live_demo': ['streaming_setup', 'interaction_testing', 'fallback_preparation'],
      'ar_presentation': [...commonSteps, 'ar_calibration', 'tracking_setup']
    };
    
    return typeSpecificSteps[type] || commonSteps;
  }
  
  /**
   * Estimate processing time
   */
  estimateProcessingTime(data) {
    const baseTime = 30; // 30 minutes base
    const assetCount = Object.values(data.assets || {}).flat().length;
    const complexityMultiplier = data.type === 'live_demo' ? 0.5 : 1;
    
    const estimatedMinutes = (baseTime + (assetCount * 5)) * complexityMultiplier;
    
    const completionTime = new Date();
    completionTime.setMinutes(completionTime.getMinutes() + estimatedMinutes);
    
    return completionTime;
  }
  
  /**
   * Check device compatibility
   */
  checkDeviceCompatibility(supportedDevices) {
    return {
      vrHeadset: supportedDevices.includes('vr_headset'),
      mobile: supportedDevices.includes('mobile'),
      desktop: supportedDevices.includes('desktop'),
      tablet: supportedDevices.includes('tablet'),
      arMobile: supportedDevices.includes('ar_mobile'),
      arHeadset: supportedDevices.includes('ar_headset')
    };
  }
  
  /**
   * Generate VR insights
   */
  async generateVRInsights(analytics, experienceId) {
    const insights = {
      peakUsageTimes: ['14:00-16:00 UTC', '20:00-22:00 UTC'], // Placeholder
      mostEngagingContent: [],
      improvementAreas: [],
      userFeedback: []
    };
    
    // Identify most engaging hotspots
    const sortedHotspots = Object.entries(analytics.engagement.hotspotInteractions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    insights.mostEngagingContent = sortedHotspots.map(([hotspotId, clicks]) => ({
      id: hotspotId,
      clicks: clicks,
      type: 'hotspot'
    }));
    
    // Suggest improvements based on data
    if (analytics.overview.completionRate < 50) {
      insights.improvementAreas.push({
        area: 'Completion Rate',
        issue: 'Low completion rate indicates content may be too long or not engaging enough',
        suggestion: 'Consider shorter experiences or more interactive elements'
      });
    }
    
    if (analytics.performance.averageLoadTime > 10) {
      insights.improvementAreas.push({
        area: 'Load Performance',
        issue: 'Slow loading times may deter users',
        suggestion: 'Optimize asset sizes and implement progressive loading'
      });
    }
    
    return insights;
  }
  
  /**
   * Get VR platform analytics
   */
  async getVRPlatformAnalytics(businessId, timeRange = '30d') {
    try {
      // Get all VR experiences for business
      const experiencesQuery = FirebaseAdmin.adminFirestore
        .collection('vrExperiences')
        .where('businessId', '==', businessId);
      
      const experiencesSnapshot = await experiencesQuery.get();
      
      const platformAnalytics = {
        totalExperiences: experiencesSnapshot.size,
        totalViews: 0,
        averageEngagement: 0,
        topPerformingExperiences: [],
        devicePreferences: {},
        conversionMetrics: {
          viewersToInquiries: 0,
          inquiriesToInvestments: 0
        }
      };
      
      // Aggregate analytics across all experiences
      for (const doc of experiencesSnapshot.docs) {
        const experience = doc.data();
        const experienceAnalytics = await this.generateVRAnalytics(experience.experienceId, timeRange);
        
        if (experienceAnalytics.success) {
          platformAnalytics.totalViews += experienceAnalytics.analytics.overview.totalViews;
          
          // Track top performing experiences
          platformAnalytics.topPerformingExperiences.push({
            id: experience.experienceId,
            title: experience.title,
            views: experienceAnalytics.analytics.overview.totalViews,
            completionRate: experienceAnalytics.analytics.overview.completionRate
          });
        }
      }
      
      // Sort top performing experiences
      platformAnalytics.topPerformingExperiences.sort((a, b) => b.views - a.views);
      platformAnalytics.topPerformingExperiences = platformAnalytics.topPerformingExperiences.slice(0, 5);
      
      return { success: true, analytics: platformAnalytics };
      
    } catch (error) {
      console.error('Error getting VR platform analytics:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new VRIntegrationService();