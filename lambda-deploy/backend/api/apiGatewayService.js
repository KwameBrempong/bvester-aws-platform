/**
 * BVESTER PLATFORM - API GATEWAY AND RATE LIMITING SERVICE
 * Centralized API management, authentication, rate limiting, and request routing
 * Generated: January 28, 2025
 */

const FirebaseService = require('./firebaseService');
const { FirebaseAdmin } = require('../config/firebase-admin');
const crypto = require('crypto');

class APIGatewayService {
  constructor() {
    // API endpoint configurations
    this.apiEndpoints = {
      // Authentication endpoints
      'auth/login': { 
        method: 'POST', 
        rateLimit: { requests: 10, window: 60 }, 
        auth: false, 
        roles: [], 
        validation: 'strict' 
      },
      'auth/register': { 
        method: 'POST', 
        rateLimit: { requests: 5, window: 300 }, 
        auth: false, 
        roles: [], 
        validation: 'strict' 
      },
      'auth/refresh': { 
        method: 'POST', 
        rateLimit: { requests: 20, window: 60 }, 
        auth: true, 
        roles: [], 
        validation: 'moderate' 
      },
      
      // User management endpoints
      'users/profile': { 
        method: ['GET', 'PUT'], 
        rateLimit: { requests: 100, window: 60 }, 
        auth: true, 
        roles: ['user'], 
        validation: 'moderate' 
      },
      'users/verification': { 
        method: 'POST', 
        rateLimit: { requests: 3, window: 3600 }, 
        auth: true, 
        roles: ['user'], 
        validation: 'strict' 
      },
      
      // Business endpoints
      'businesses': { 
        method: ['GET', 'POST'], 
        rateLimit: { requests: 50, window: 60 }, 
        auth: true, 
        roles: ['business_owner', 'admin'], 
        validation: 'moderate' 
      },
      'businesses/:id': { 
        method: ['GET', 'PUT', 'DELETE'], 
        rateLimit: { requests: 100, window: 60 }, 
        auth: true, 
        roles: ['business_owner', 'investor', 'admin'], 
        validation: 'moderate' 
      },
      'businesses/:id/analytics': { 
        method: 'GET', 
        rateLimit: { requests: 20, window: 60 }, 
        auth: true, 
        roles: ['business_owner', 'investor'], 
        validation: 'strict' 
      },
      
      // Investment endpoints
      'investments': { 
        method: ['GET', 'POST'], 
        rateLimit: { requests: 30, window: 60 }, 
        auth: true, 
        roles: ['investor', 'business_owner'], 
        validation: 'strict' 
      },
      'investments/:id/documents': { 
        method: ['GET', 'POST'], 
        rateLimit: { requests: 10, window: 60 }, 
        auth: true, 
        roles: ['investor', 'business_owner'], 
        validation: 'strict' 
      },
      
      // Payment endpoints
      'payments/process': { 
        method: 'POST', 
        rateLimit: { requests: 5, window: 300 }, 
        auth: true, 
        roles: ['investor'], 
        validation: 'strict' 
      },
      'payments/webhooks': { 
        method: 'POST', 
        rateLimit: { requests: 100, window: 60 }, 
        auth: false, 
        roles: [], 
        validation: 'webhook' 
      },
      
      // Algorithm endpoints
      'algorithms/matching': { 
        method: 'POST', 
        rateLimit: { requests: 20, window: 60 }, 
        auth: true, 
        roles: ['investor'], 
        validation: 'moderate' 
      },
      'algorithms/esg-score': { 
        method: 'POST', 
        rateLimit: { requests: 10, window: 300 }, 
        auth: true, 
        roles: ['business_owner', 'admin'], 
        validation: 'strict' 
      },
      'algorithms/financial-health': { 
        method: 'POST', 
        rateLimit: { requests: 5, window: 300 }, 
        auth: true, 
        roles: ['business_owner', 'investor'], 
        validation: 'strict' 
      },
      
      // VR and messaging endpoints
      'vr/experiences': { 
        method: ['GET', 'POST'], 
        rateLimit: { requests: 15, window: 60 }, 
        auth: true, 
        roles: ['business_owner'], 
        validation: 'moderate' 
      },
      'messaging/send': { 
        method: 'POST', 
        rateLimit: { requests: 50, window: 60 }, 
        auth: true, 
        roles: ['user'], 
        validation: 'moderate' 
      },
      
      // Admin endpoints
      'admin/users': { 
        method: ['GET', 'PUT', 'DELETE'], 
        rateLimit: { requests: 200, window: 60 }, 
        auth: true, 
        roles: ['admin'], 
        validation: 'strict' 
      },
      'admin/analytics': { 
        method: 'GET', 
        rateLimit: { requests: 100, window: 60 }, 
        auth: true, 
        roles: ['admin'], 
        validation: 'moderate' 
      }
    };
    
    // Rate limiting tiers based on subscription plans
    this.rateLimitTiers = {
      'free': {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        burstLimit: 10,
        priority: 'low',
        features: ['basic_auth', 'standard_validation']
      },
      'basic': {
        requestsPerMinute: 120,
        requestsPerHour: 5000,
        requestsPerDay: 50000,
        burstLimit: 20,
        priority: 'normal',
        features: ['basic_auth', 'standard_validation', 'analytics']
      },
      'professional': {
        requestsPerMinute: 300,
        requestsPerHour: 15000,
        requestsPerDay: 200000,
        burstLimit: 50,
        priority: 'high',
        features: ['enhanced_auth', 'advanced_validation', 'analytics', 'webhook_priority']
      },
      'enterprise': {
        requestsPerMinute: 1000,
        requestsPerHour: 50000,
        requestsPerDay: 1000000,
        burstLimit: 100,
        priority: 'critical',
        features: ['enterprise_auth', 'custom_validation', 'real_time_analytics', 'dedicated_support']
      }
    };
    
    // API key scopes and permissions
    this.apiKeyScopes = {
      'read_only': {
        permissions: ['GET'],
        endpoints: ['businesses', 'users/profile', 'investments'],
        description: 'Read-only access to public data'
      },
      'user_data': {
        permissions: ['GET', 'PUT'],
        endpoints: ['users/profile', 'users/preferences'],
        description: 'Access to user profile and preferences'
      },
      'business_management': {
        permissions: ['GET', 'POST', 'PUT'],
        endpoints: ['businesses', 'businesses/:id', 'businesses/:id/analytics'],
        description: 'Full business profile management'
      },
      'investment_operations': {
        permissions: ['GET', 'POST', 'PUT'],
        endpoints: ['investments', 'payments/process', 'algorithms/matching'],
        description: 'Investment and payment operations'
      },
      'full_access': {
        permissions: ['GET', 'POST', 'PUT', 'DELETE'],
        endpoints: ['*'],
        description: 'Full platform access (admin only)'
      }
    };
    
    // Request validation rules
    this.validationRules = {
      'strict': {
        requireHTTPS: true,
        validateHeaders: true,
        sanitizeInput: true,
        validateSchema: true,
        requireSignature: true,
        ipWhitelist: false
      },
      'moderate': {
        requireHTTPS: true,
        validateHeaders: true,
        sanitizeInput: true,
        validateSchema: true,
        requireSignature: false,
        ipWhitelist: false
      },
      'basic': {
        requireHTTPS: true,
        validateHeaders: false,
        sanitizeInput: true,
        validateSchema: false,
        requireSignature: false,
        ipWhitelist: false
      },
      'webhook': {
        requireHTTPS: true,
        validateHeaders: true,
        sanitizeInput: true,
        validateSchema: true,
        requireSignature: true,
        ipWhitelist: true
      }
    };
    
    // Request routing and load balancing
    this.routingConfig = {
      'load_balancing': {
        algorithm: 'round_robin', // round_robin, least_connections, weighted
        healthChecks: true,
        failoverEnabled: true,
        stickySession: false
      },
      'caching': {
        enabled: true,
        ttl: 300, // 5 minutes default
        varyByAuth: true,
        varyByQuery: true,
        excludeEndpoints: ['payments/*', 'auth/*']
      },
      'compression': {
        enabled: true,
        minSize: 1024, // 1KB
        algorithms: ['gzip', 'br'],
        level: 6
      }
    };
  }
  
  // ============================================================================
  // REQUEST PROCESSING AND ROUTING
  // ============================================================================
  
  /**
   * Process incoming API request
   */
  async processRequest(request, response) {
    try {
      const requestId = this.generateRequestId();
      const startTime = Date.now();
      
      console.log(`🌐 Processing API request: ${request.method} ${request.path} [${requestId}]`);
      
      // Extract request metadata
      const requestMeta = this.extractRequestMetadata(request);
      
      // Pre-processing validation
      const preValidation = await this.performPreValidation(request, requestMeta);
      if (!preValidation.valid) {
        return this.sendErrorResponse(response, 400, preValidation.error, requestId);
      }
      
      // Rate limiting check
      const rateLimitResult = await this.checkRateLimit(request, requestMeta);
      if (!rateLimitResult.allowed) {
        return this.sendErrorResponse(response, 429, 'Rate limit exceeded', requestId, {
          retryAfter: rateLimitResult.retryAfter,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining
        });
      }
      
      // Authentication and authorization
      const authResult = await this.authenticateRequest(request, requestMeta);
      if (!authResult.authenticated && this.requiresAuth(request.path, request.method)) {
        return this.sendErrorResponse(response, 401, 'Authentication required', requestId);
      }
      
      const authzResult = await this.authorizeRequest(request, authResult.user, requestMeta);
      if (!authzResult.authorized) {
        return this.sendErrorResponse(response, 403, 'Insufficient permissions', requestId);
      }
      
      // Request validation
      const validationResult = await this.validateRequest(request, requestMeta);
      if (!validationResult.valid) {
        return this.sendErrorResponse(response, 400, validationResult.errors, requestId);
      }
      
      // Check for cached response
      const cacheResult = await this.checkCache(request, requestMeta);
      if (cacheResult.hit) {
        return this.sendCachedResponse(response, cacheResult.data, requestId);
      }
      
      // Route request to appropriate service
      const routingResult = await this.routeRequest(request, authResult.user, requestMeta);
      if (!routingResult.success) {
        return this.sendErrorResponse(response, 500, 'Service routing failed', requestId);
      }
      
      // Process response
      const processedResponse = await this.processResponse(
        routingResult.response,
        request,
        requestMeta,
        authResult.user
      );
      
      // Cache response if appropriate
      if (this.shouldCache(request, processedResponse)) {
        await this.cacheResponse(request, processedResponse, requestMeta);
      }
      
      // Update rate limit counters
      await this.updateRateLimitCounters(request, requestMeta);
      
      // Log request
      await this.logRequest({
        requestId: requestId,
        path: request.path,
        method: request.method,
        userId: authResult.user?.userId || null,
        responseCode: processedResponse.statusCode,
        duration: Date.now() - startTime,
        metadata: requestMeta
      });
      
      // Send final response
      return this.sendResponse(response, processedResponse, requestId);
      
    } catch (error) {
      console.error('Error processing API request:', error);
      return this.sendErrorResponse(response, 500, 'Internal server error', this.generateRequestId());
    }
  }
  
  /**
   * Route request to appropriate service
   */
  async routeRequest(request, user, metadata) {
    try {
      const endpoint = this.normalizeEndpoint(request.path);
      const method = request.method.toLowerCase();
      
      // Service routing logic
      let serviceName;
      let serviceFunction;
      
      if (endpoint.startsWith('auth/')) {
        serviceName = 'AuthenticationService';
        serviceFunction = this.mapAuthEndpoint(endpoint, method);
      } else if (endpoint.startsWith('users/')) {
        serviceName = 'UserService';
        serviceFunction = this.mapUserEndpoint(endpoint, method);
      } else if (endpoint.startsWith('businesses/')) {
        serviceName = 'BusinessService';
        serviceFunction = this.mapBusinessEndpoint(endpoint, method);
      } else if (endpoint.startsWith('investments/')) {
        serviceName = 'InvestmentService';
        serviceFunction = this.mapInvestmentEndpoint(endpoint, method);
      } else if (endpoint.startsWith('payments/')) {
        serviceName = 'PaymentService';
        serviceFunction = this.mapPaymentEndpoint(endpoint, method);
      } else if (endpoint.startsWith('algorithms/')) {
        serviceName = 'AlgorithmService';
        serviceFunction = this.mapAlgorithmEndpoint(endpoint, method);
      } else if (endpoint.startsWith('messaging/')) {
        serviceName = 'MessagingService';
        serviceFunction = this.mapMessagingEndpoint(endpoint, method);
      } else if (endpoint.startsWith('vr/')) {
        serviceName = 'VRIntegrationService';
        serviceFunction = this.mapVREndpoint(endpoint, method);
      } else if (endpoint.startsWith('documents/')) {
        serviceName = 'DocumentManagementService';
        serviceFunction = this.mapDocumentEndpoint(endpoint, method);
      } else if (endpoint.startsWith('contracts/')) {
        serviceName = 'SmartContractService';
        serviceFunction = this.mapContractEndpoint(endpoint, method);
      } else if (endpoint.startsWith('security/')) {
        serviceName = 'AdvancedSecurityService';
        serviceFunction = this.mapSecurityEndpoint(endpoint, method);
      } else if (endpoint.startsWith('admin/')) {
        serviceName = 'AdminService';
        serviceFunction = this.mapAdminEndpoint(endpoint, method);
      } else {
        return { success: false, error: 'Unknown endpoint' };
      }
      
      // Load service and execute function
      const service = this.loadService(serviceName);
      if (!service || !service[serviceFunction]) {
        return { success: false, error: 'Service or function not found' };
      }
      
      // Prepare service parameters
      const serviceParams = this.prepareServiceParams(request, user, metadata);
      
      // Execute service function
      const serviceResponse = await service[serviceFunction](...serviceParams);
      
      return {
        success: true,
        response: serviceResponse,
        service: serviceName,
        function: serviceFunction
      };
      
    } catch (error) {
      console.error('Error routing request:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ============================================================================
  // RATE LIMITING AND THROTTLING
  // ============================================================================
  
  /**
   * Check rate limits for incoming request
   */
  async checkRateLimit(request, metadata) {
    try {
      const identifier = this.getRateLimitIdentifier(request, metadata);
      const endpoint = this.normalizeEndpoint(request.path);
      const method = request.method;
      
      // Get user's subscription tier
      const userTier = await this.getUserSubscriptionTier(metadata.userId);
      const tierLimits = this.rateLimitTiers[userTier] || this.rateLimitTiers.free;
      
      // Get endpoint-specific limits
      const endpointConfig = this.getEndpointConfig(endpoint, method);
      const endpointLimits = endpointConfig?.rateLimit || { requests: 60, window: 60 };
      
      // Check multiple rate limit windows
      const checks = [
        { key: `${identifier}:minute`, limit: tierLimits.requestsPerMinute, window: 60 },
        { key: `${identifier}:hour`, limit: tierLimits.requestsPerHour, window: 3600 },
        { key: `${identifier}:day`, limit: tierLimits.requestsPerDay, window: 86400 },
        { key: `${identifier}:endpoint:${endpoint}`, limit: endpointLimits.requests, window: endpointLimits.window }
      ];
      
      for (const check of checks) {
        const result = await this.checkRateLimitWindow(check.key, check.limit, check.window);
        if (!result.allowed) {
          return {
            allowed: false,
            limit: check.limit,
            remaining: Math.max(0, check.limit - result.current),
            retryAfter: result.retryAfter,
            window: check.window
          };
        }
      }
      
      // Check burst limits
      const burstResult = await this.checkBurstLimit(identifier, tierLimits.burstLimit);
      if (!burstResult.allowed) {
        return {
          allowed: false,
          limit: tierLimits.burstLimit,
          remaining: 0,
          retryAfter: burstResult.retryAfter,
          type: 'burst'
        };
      }
      
      return {
        allowed: true,
        limit: tierLimits.requestsPerMinute,
        remaining: Math.max(0, tierLimits.requestsPerMinute - (await this.getCurrentUsage(identifier, 60))),
        resetTime: Math.ceil(Date.now() / 1000) + 60
      };
      
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // On error, allow request but log the issue
      return { allowed: true, limit: 60, remaining: 60 };
    }
  }
  
  /**
   * Check rate limit for specific time window
   */
  async checkRateLimitWindow(key, limit, windowSeconds) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const windowStart = now - windowSeconds;
      
      // Get current usage from Firebase (simulated with counter)
      const usageRef = FirebaseAdmin.adminFirestore
        .collection('rateLimits')
        .doc(key);
      
      const usageDoc = await usageRef.get();
      const usage = usageDoc.exists ? usageDoc.data() : { count: 0, windowStart: now };
      
      // Reset if outside current window
      if (usage.windowStart < windowStart) {
        usage.count = 0;
        usage.windowStart = now;
      }
      
      // Check if limit exceeded
      if (usage.count >= limit) {
        return {
          allowed: false,
          current: usage.count,
          retryAfter: windowSeconds - (now - usage.windowStart)
        };
      }
      
      return {
        allowed: true,
        current: usage.count
      };
      
    } catch (error) {
      console.error('Error checking rate limit window:', error);
      return { allowed: true, current: 0 };
    }
  }
  
  /**
   * Update rate limit counters
   */
  async updateRateLimitCounters(request, metadata) {
    try {
      const identifier = this.getRateLimitIdentifier(request, metadata);
      const endpoint = this.normalizeEndpoint(request.path);
      const now = Math.floor(Date.now() / 1000);
      
      // Update counters for different windows
      const updates = [
        { key: `${identifier}:minute`, window: 60 },
        { key: `${identifier}:hour`, window: 3600 },
        { key: `${identifier}:day`, window: 86400 },
        { key: `${identifier}:endpoint:${endpoint}`, window: 60 }
      ];
      
      const batch = FirebaseAdmin.adminFirestore.batch();
      
      for (const update of updates) {
        const ref = FirebaseAdmin.adminFirestore.collection('rateLimits').doc(update.key);
        const windowStart = now - (now % update.window);
        
        batch.set(ref, {
          count: FirebaseService.increment(1),
          windowStart: windowStart,
          lastRequest: now
        }, { merge: true });
      }
      
      await batch.commit();
      
    } catch (error) {
      console.error('Error updating rate limit counters:', error);
    }
  }
  
  // ============================================================================
  // AUTHENTICATION AND AUTHORIZATION
  // ============================================================================
  
  /**
   * Authenticate incoming request
   */
  async authenticateRequest(request, metadata) {
    try {
      const authHeader = request.headers.authorization;
      const apiKey = request.headers['x-api-key'];
      
      // Try different authentication methods
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // JWT token authentication
        const token = authHeader.substring(7);
        return await this.authenticateJWT(token);
      } else if (apiKey) {
        // API key authentication
        return await this.authenticateAPIKey(apiKey, request);
      } else if (request.headers.cookie) {
        // Session cookie authentication
        return await this.authenticateSession(request.headers.cookie);
      }
      
      return { authenticated: false };
      
    } catch (error) {
      console.error('Error authenticating request:', error);
      return { authenticated: false, error: error.message };
    }
  }
  
  /**
   * Authorize request based on user roles and permissions
   */
  async authorizeRequest(request, user, metadata) {
    try {
      if (!user) {
        return { authorized: false, reason: 'No user context' };
      }
      
      const endpoint = this.normalizeEndpoint(request.path);
      const method = request.method;
      const endpointConfig = this.getEndpointConfig(endpoint, method);
      
      if (!endpointConfig) {
        return { authorized: false, reason: 'Unknown endpoint' };
      }
      
      // Check required roles
      if (endpointConfig.roles && endpointConfig.roles.length > 0) {
        const userRoles = user.roles || [user.userType];
        const hasRequiredRole = endpointConfig.roles.some(role => userRoles.includes(role));
        
        if (!hasRequiredRole) {
          return { authorized: false, reason: 'Insufficient role permissions' };
        }
      }
      
      // Check API key scopes (if using API key auth)
      if (user.apiKeyScopes) {
        const hasPermission = this.checkAPIKeyPermissions(user.apiKeyScopes, endpoint, method);
        if (!hasPermission) {
          return { authorized: false, reason: 'API key scope insufficient' };
        }
      }
      
      // Resource-level authorization (for specific resources)
      if (this.hasResourceId(request.path)) {
        const resourceAuth = await this.checkResourcePermissions(request, user);
        if (!resourceAuth.authorized) {
          return resourceAuth;
        }
      }
      
      // IP whitelist check (for sensitive endpoints)
      if (endpointConfig.validation === 'strict' && user.ipWhitelist) {
        const ipAllowed = this.checkIPWhitelist(metadata.clientIP, user.ipWhitelist);
        if (!ipAllowed) {
          return { authorized: false, reason: 'IP not whitelisted' };
        }
      }
      
      return { authorized: true };
      
    } catch (error) {
      console.error('Error authorizing request:', error);
      return { authorized: false, reason: 'Authorization check failed' };
    }
  }
  
  // ============================================================================
  // REQUEST VALIDATION AND SECURITY
  // ============================================================================
  
  /**
   * Validate incoming request
   */
  async validateRequest(request, metadata) {
    try {
      const endpoint = this.normalizeEndpoint(request.path);
      const method = request.method;
      const endpointConfig = this.getEndpointConfig(endpoint, method);
      
      if (!endpointConfig) {
        return { valid: false, errors: ['Unknown endpoint'] };
      }
      
      const validationLevel = endpointConfig.validation || 'basic';
      const validationRules = this.validationRules[validationLevel];
      const errors = [];
      
      // HTTPS requirement
      if (validationRules.requireHTTPS && !request.secure) {
        errors.push('HTTPS required');
      }
      
      // Header validation
      if (validationRules.validateHeaders) {
        const headerErrors = this.validateHeaders(request.headers);
        errors.push(...headerErrors);
      }
      
      // Input sanitization
      if (validationRules.sanitizeInput) {
        request.body = this.sanitizeInput(request.body);
        request.query = this.sanitizeInput(request.query);
      }
      
      // Schema validation
      if (validationRules.validateSchema && request.body) {
        const schemaErrors = await this.validateSchema(endpoint, method, request.body);
        errors.push(...schemaErrors);
      }
      
      // Signature validation (for webhooks and high-security endpoints)
      if (validationRules.requireSignature) {
        const signatureValid = await this.validateSignature(request);
        if (!signatureValid) {
          errors.push('Invalid signature');
        }
      }
      
      // IP whitelist validation
      if (validationRules.ipWhitelist) {
        const ipAllowed = await this.validateIPWhitelist(metadata.clientIP, endpoint);
        if (!ipAllowed) {
          errors.push('IP not allowed');
        }
      }
      
      // Content length validation
      if (request.body && this.getContentLength(request) > this.getMaxContentLength(endpoint)) {
        errors.push('Content too large');
      }
      
      // SQL injection and XSS prevention
      if (request.body || request.query) {
        const securityErrors = this.validateSecurity(request.body, request.query);
        errors.push(...securityErrors);
      }
      
      return {
        valid: errors.length === 0,
        errors: errors
      };
      
    } catch (error) {
      console.error('Error validating request:', error);
      return { valid: false, errors: ['Validation failed'] };
    }
  }
  
  // ============================================================================
  // CACHING AND RESPONSE OPTIMIZATION
  // ============================================================================
  
  /**
   * Check for cached response
   */
  async checkCache(request, metadata) {
    try {
      if (!this.routingConfig.caching.enabled) {
        return { hit: false };
      }
      
      const endpoint = this.normalizeEndpoint(request.path);
      
      // Skip caching for excluded endpoints
      const excludePattern = this.routingConfig.caching.excludeEndpoints;
      if (excludePattern.some(pattern => this.matchesPattern(endpoint, pattern))) {
        return { hit: false };
      }
      
      // Generate cache key
      const cacheKey = this.generateCacheKey(request, metadata);
      
      // Check cache
      const cacheRef = FirebaseAdmin.adminFirestore
        .collection('apiCache')
        .doc(cacheKey);
      
      const cacheDoc = await cacheRef.get();
      
      if (!cacheDoc.exists) {
        return { hit: false };
      }
      
      const cachedData = cacheDoc.data();
      const now = new Date();
      
      // Check if cache is expired
      if (cachedData.expiresAt && cachedData.expiresAt.toDate() < now) {
        // Clean up expired cache
        await cacheRef.delete();
        return { hit: false };
      }
      
      return {
        hit: true,
        data: cachedData.response,
        cachedAt: cachedData.cachedAt,
        expiresAt: cachedData.expiresAt
      };
      
    } catch (error) {
      console.error('Error checking cache:', error);
      return { hit: false };
    }
  }
  
  /**
   * Cache response
   */
  async cacheResponse(request, response, metadata) {
    try {
      if (!this.shouldCache(request, response)) {
        return;
      }
      
      const cacheKey = this.generateCacheKey(request, metadata);
      const ttl = this.getCacheTTL(request);
      const expiresAt = new Date(Date.now() + ttl * 1000);
      
      const cacheData = {
        response: response,
        cachedAt: new Date(),
        expiresAt: expiresAt,
        metadata: {
          endpoint: this.normalizeEndpoint(request.path),
          method: request.method,
          userId: metadata.userId || null
        }
      };
      
      await FirebaseAdmin.adminFirestore
        .collection('apiCache')
        .doc(cacheKey)
        .set(cacheData);
        
    } catch (error) {
      console.error('Error caching response:', error);
    }
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }
  
  /**
   * Extract request metadata
   */
  extractRequestMetadata(request) {
    return {
      clientIP: this.getClientIP(request),
      userAgent: request.headers['user-agent'] || 'unknown',
      referer: request.headers.referer || null,
      contentType: request.headers['content-type'] || null,
      contentLength: this.getContentLength(request),
      timestamp: new Date(),
      protocol: request.protocol,
      host: request.headers.host,
      userId: null // Will be set after authentication
    };
  }
  
  /**
   * Get client IP address
   */
  getClientIP(request) {
    return request.headers['x-forwarded-for'] || 
           request.headers['x-real-ip'] || 
           request.connection.remoteAddress || 
           request.socket.remoteAddress ||
           (request.connection.socket ? request.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
  }
  
  /**
   * Normalize endpoint path
   */
  normalizeEndpoint(path) {
    // Remove leading slash and query parameters
    return path.replace(/^\//, '').split('?')[0];
  }
  
  /**
   * Get endpoint configuration
   */
  getEndpointConfig(endpoint, method) {
    // Try exact match first
    if (this.apiEndpoints[endpoint]) {
      const config = this.apiEndpoints[endpoint];
      if (Array.isArray(config.method) ? 
          config.method.includes(method) : 
          config.method === method) {
        return config;
      }
    }
    
    // Try pattern matching for parameterized endpoints
    for (const [pattern, config] of Object.entries(this.apiEndpoints)) {
      if (this.matchesEndpointPattern(endpoint, pattern) &&
          (Array.isArray(config.method) ? 
           config.method.includes(method) : 
           config.method === method)) {
        return config;
      }
    }
    
    return null;
  }
  
  /**
   * Match endpoint against pattern
   */
  matchesEndpointPattern(endpoint, pattern) {
    const endpointParts = endpoint.split('/');
    const patternParts = pattern.split('/');
    
    if (endpointParts.length !== patternParts.length) {
      return false;
    }
    
    return patternParts.every((part, index) => {
      return part.startsWith(':') || part === endpointParts[index];
    });
  }
  
  /**
   * Generate cache key
   */
  generateCacheKey(request, metadata) {
    const endpoint = this.normalizeEndpoint(request.path);
    const method = request.method;
    const query = JSON.stringify(request.query || {});
    const userId = metadata.userId || 'anonymous';
    
    const keyData = `${method}:${endpoint}:${query}:${userId}`;
    return crypto.createHash('sha256').update(keyData).digest('hex');
  }
  
  /**
   * Send error response
   */
  sendErrorResponse(response, statusCode, error, requestId, headers = {}) {
    const errorResponse = {
      success: false,
      error: error,
      requestId: requestId,
      timestamp: new Date().toISOString()
    };
    
    response.status(statusCode);
    
    // Set additional headers
    Object.keys(headers).forEach(header => {
      response.set(header, headers[header]);
    });
    
    response.json(errorResponse);
  }
  
  /**
   * Send successful response
   */
  sendResponse(response, data, requestId) {
    const responseData = {
      success: true,
      data: data,
      requestId: requestId,
      timestamp: new Date().toISOString()
    };
    
    response.json(responseData);
  }
  
  /**
   * Log API request
   */
  async logRequest(logData) {
    try {
      await FirebaseAdmin.adminFirestore
        .collection('apiLogs')
        .add({
          ...logData,
          timestamp: new Date()
        });
    } catch (error) {
      console.error('Error logging request:', error);
    }
  }
  
  /**
   * Get API gateway analytics
   */
  async getGatewayAnalytics(timeRange = '24h') {
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '1h':
          startDate.setHours(endDate.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
      }
      
      const logsQuery = FirebaseAdmin.adminFirestore
        .collection('apiLogs')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate);
      
      const snapshot = await logsQuery.get();
      
      const analytics = {
        totalRequests: 0,
        successfulRequests: 0,
        errorRequests: 0,
        averageResponseTime: 0,
        popularEndpoints: {},
        errorRates: {},
        rateLimitHits: 0,
        topUsers: {},
        bandwidthUsage: 0
      };
      
      let totalDuration = 0;
      
      snapshot.forEach(doc => {
        const log = doc.data();
        analytics.totalRequests++;
        
        if (log.responseCode < 400) {
          analytics.successfulRequests++;
        } else {
          analytics.errorRequests++;
          analytics.errorRates[log.responseCode] = 
            (analytics.errorRates[log.responseCode] || 0) + 1;
        }
        
        if (log.responseCode === 429) {
          analytics.rateLimitHits++;
        }
        
        totalDuration += log.duration || 0;
        
        // Track popular endpoints
        analytics.popularEndpoints[log.path] = 
          (analytics.popularEndpoints[log.path] || 0) + 1;
        
        // Track top users
        if (log.userId) {
          analytics.topUsers[log.userId] = 
            (analytics.topUsers[log.userId] || 0) + 1;
        }
      });
      
      analytics.averageResponseTime = analytics.totalRequests > 0 ? 
        totalDuration / analytics.totalRequests : 0;
      
      return { success: true, analytics };
      
    } catch (error) {
      console.error('Error getting gateway analytics:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new APIGatewayService();