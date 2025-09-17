/**
 * Rate Limiting Middleware for Bvester Platform
 * Advanced rate limiting with Redis, IP blocking, and adaptive limits
 * Week 13 Implementation - Security & Compliance System
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');

class RateLimitingService {
    constructor() {
        // Redis client for distributed rate limiting
        this.redisClient = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD,
            db: process.env.REDIS_DB || 0
        });

        // Rate limiting configurations
        this.rateLimitConfigs = {
            general: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100, // requests per window
                message: 'Too many requests, please try again later.',
                standardHeaders: true,
                legacyHeaders: false
            },
            auth: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 5, // login attempts per window
                message: 'Too many login attempts, please try again in 15 minutes.',
                skipSuccessfulRequests: true,
                standardHeaders: true,
                legacyHeaders: false
            },
            api: {
                windowMs: 60 * 60 * 1000, // 1 hour
                max: 1000, // API calls per hour
                message: 'API rate limit exceeded, please try again later.',
                standardHeaders: true,
                legacyHeaders: false
            },
            fileUpload: {
                windowMs: 60 * 1000, // 1 minute
                max: 10, // uploads per minute
                message: 'File upload rate limit exceeded.',
                standardHeaders: true,
                legacyHeaders: false
            },
            kyc: {
                windowMs: 24 * 60 * 60 * 1000, // 24 hours
                max: 3, // KYC attempts per day
                message: 'Daily KYC verification limit reached.',
                standardHeaders: true,
                legacyHeaders: false
            },
            investment: {
                windowMs: 60 * 60 * 1000, // 1 hour
                max: 50, // investment operations per hour
                message: 'Investment operation rate limit exceeded.',
                standardHeaders: true,
                legacyHeaders: false
            },
            analytics: {
                windowMs: 60 * 60 * 1000, // 1 hour
                max: 500, // analytics requests per hour
                message: 'Analytics rate limit exceeded.',
                standardHeaders: true,
                legacyHeaders: false
            }
        };

        // Suspicious activity tracking
        this.suspiciousIPs = new Set();
        this.blockedIPs = new Set();
        this.rateLimitViolations = new Map();
        this.adaptiveLimits = new Map();

        // Initialize Redis connection
        this.initializeRedis();
    }

    /**
     * Initialize Redis connection
     */
    async initializeRedis() {
        try {
            await this.redisClient.connect();
            console.log('Redis connected for rate limiting');
        } catch (error) {
            console.error('Redis connection failed:', error);
            // Fallback to memory store if Redis unavailable
        }
    }

    /**
     * Create rate limiter with Redis store
     */
    createRateLimiter(config, keyGenerator = null) {
        const limiterConfig = {
            ...config,
            store: new RedisStore({
                sendCommand: (...args) => this.redisClient.sendCommand(args)
            }),
            keyGenerator: keyGenerator || this.defaultKeyGenerator,
            handler: this.rateLimitHandler.bind(this),
            onLimitReached: this.onLimitReached.bind(this),
            skip: this.skipRequest.bind(this)
        };

        return rateLimit(limiterConfig);
    }

    /**
     * Default key generator for rate limiting
     */
    defaultKeyGenerator(req) {
        // Use user ID if authenticated, otherwise use IP
        if (req.user && req.user.id) {
            return `user:${req.user.id}`;
        }
        return `ip:${req.ip}`;
    }

    /**
     * Enhanced key generator for specific endpoints
     */
    authKeyGenerator(req) {
        const email = req.body.email || req.body.username || 'unknown';
        return `auth:${req.ip}:${email}`;
    }

    /**
     * KYC-specific key generator
     */
    kycKeyGenerator(req) {
        if (req.user && req.user.id) {
            return `kyc:${req.user.id}`;
        }
        return `kyc:${req.ip}`;
    }

    /**
     * Rate limit handler with logging
     */
    async rateLimitHandler(req, res, next, options) {
        const key = options.keyGenerator(req);
        
        // Log rate limit violation
        await this.logRateLimitViolation(req, key, options);
        
        // Check if this is a pattern of abuse
        await this.analyzeAbusivePattern(req.ip, key);
        
        // Send rate limit response
        res.status(options.statusCode || 429).json({
            success: false,
            error: 'rate_limit_exceeded',
            message: options.message,
            retryAfter: Math.round(options.windowMs / 1000),
            limit: options.max,
            remaining: 0,
            resetTime: new Date(Date.now() + options.windowMs).toISOString()
        });
    }

    /**
     * Called when rate limit is reached
     */
    async onLimitReached(req, res, options) {
        const key = options.keyGenerator(req);
        
        // Increment violation counter
        const violations = this.rateLimitViolations.get(key) || 0;
        this.rateLimitViolations.set(key, violations + 1);
        
        // Adaptive limiting - reduce limits for repeat offenders
        if (violations >= 3) {
            await this.applyAdaptiveLimiting(key, req.ip);
        }
        
        // Security event logging
        await this.logSecurityEvent('rate_limit_exceeded', req, {
            key: key,
            violations: violations + 1,
            endpoint: req.path,
            method: req.method
        });
    }

    /**
     * Skip request check for whitelisted IPs or special cases
     */
    skipRequest(req, res) {
        // Skip for health checks
        if (req.path === '/health' || req.path === '/ping') {
            return true;
        }
        
        // Skip for whitelisted IPs
        const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || [];
        if (whitelistedIPs.includes(req.ip)) {
            return true;
        }
        
        // Skip if IP is blocked (will be handled by IP blocking middleware)
        if (this.blockedIPs.has(req.ip)) {
            return true;
        }
        
        return false;
    }

    /**
     * Log rate limit violations
     */
    async logRateLimitViolation(req, key, options) {
        const violation = {
            id: uuidv4(),
            timestamp: new Date(),
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            key: key,
            endpoint: req.path,
            method: req.method,
            limit: options.max,
            window: options.windowMs,
            userId: req.user?.id || null
        };

        // Store in Redis with TTL
        if (this.redisClient.isOpen) {
            await this.redisClient.setEx(
                `violation:${violation.id}`,
                24 * 60 * 60, // 24 hours TTL
                JSON.stringify(violation)
            );
        }
    }

    /**
     * Analyze patterns for abusive behavior
     */
    async analyzeAbusivePattern(ip, key) {
        const recentViolations = this.rateLimitViolations.get(key) || 0;
        
        // Mark IP as suspicious after multiple violations
        if (recentViolations >= 5) {
            this.suspiciousIPs.add(ip);
            
            // Temporarily block IP after excessive violations
            if (recentViolations >= 10) {
                await this.blockIP(ip, 'rate_limit_abuse', 60 * 60 * 1000); // 1 hour block
            }
        }
    }

    /**
     * Apply adaptive rate limiting for repeat offenders
     */
    async applyAdaptiveLimiting(key, ip) {
        const currentLimit = this.adaptiveLimits.get(key) || {};
        
        // Reduce limits progressively
        const newLimit = {
            max: Math.max(1, Math.floor((currentLimit.max || 100) * 0.5)),
            windowMs: Math.min(24 * 60 * 60 * 1000, (currentLimit.windowMs || 15 * 60 * 1000) * 2),
            appliedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
        
        this.adaptiveLimits.set(key, newLimit);
        
        // Log adaptive limiting
        await this.logSecurityEvent('adaptive_limit_applied', null, {
            key: key,
            ip: ip,
            newLimit: newLimit
        });
    }

    /**
     * Block IP address
     */
    async blockIP(ip, reason, duration = 24 * 60 * 60 * 1000) {
        this.blockedIPs.add(ip);
        
        const blockRecord = {
            ip: ip,
            reason: reason,
            blockedAt: new Date(),
            expiresAt: new Date(Date.now() + duration),
            active: true
        };
        
        // Store in Redis
        if (this.redisClient.isOpen) {
            await this.redisClient.setEx(
                `blocked:${ip}`,
                Math.floor(duration / 1000),
                JSON.stringify(blockRecord)
            );
        }
        
        // Auto-unblock after duration
        setTimeout(() => {
            this.blockedIPs.delete(ip);
        }, duration);
        
        await this.logSecurityEvent('ip_blocked', null, blockRecord);
    }

    /**
     * IP blocking middleware
     */
    ipBlockingMiddleware() {
        return async (req, res, next) => {
            const ip = req.ip;
            
            // Check if IP is blocked
            if (this.blockedIPs.has(ip)) {
                return res.status(403).json({
                    success: false,
                    error: 'ip_blocked',
                    message: 'Your IP address has been temporarily blocked due to suspicious activity.',
                    contact: 'security@bvester.com'
                });
            }
            
            // Check Redis for blocked IPs
            if (this.redisClient.isOpen) {
                const blockRecord = await this.redisClient.get(`blocked:${ip}`);
                if (blockRecord) {
                    const block = JSON.parse(blockRecord);
                    if (new Date() < new Date(block.expiresAt)) {
                        return res.status(403).json({
                            success: false,
                            error: 'ip_blocked',
                            message: 'Your IP address has been temporarily blocked.',
                            expiresAt: block.expiresAt,
                            reason: block.reason
                        });
                    }
                }
            }
            
            next();
        };
    }

    /**
     * Create middleware for specific rate limiting scenarios
     */
    
    // General API rate limiting
    generalRateLimit() {
        return this.createRateLimiter(this.rateLimitConfigs.general);
    }

    // Authentication rate limiting
    authRateLimit() {
        return this.createRateLimiter(
            this.rateLimitConfigs.auth,
            this.authKeyGenerator.bind(this)
        );
    }

    // API endpoint rate limiting
    apiRateLimit() {
        return this.createRateLimiter(this.rateLimitConfigs.api);
    }

    // File upload rate limiting
    fileUploadRateLimit() {
        return this.createRateLimiter(this.rateLimitConfigs.fileUpload);
    }

    // KYC verification rate limiting
    kycRateLimit() {
        return this.createRateLimiter(
            this.rateLimitConfigs.kyc,
            this.kycKeyGenerator.bind(this)
        );
    }

    // Investment operations rate limiting
    investmentRateLimit() {
        return this.createRateLimiter(this.rateLimitConfigs.investment);
    }

    // Analytics rate limiting
    analyticsRateLimit() {
        return this.createRateLimiter(this.rateLimitConfigs.analytics);
    }

    /**
     * Advanced rate limiting with custom logic
     */
    createAdvancedRateLimit(options) {
        return async (req, res, next) => {
            const key = options.keyGenerator ? options.keyGenerator(req) : this.defaultKeyGenerator(req);
            
            try {
                // Check adaptive limits first
                const adaptiveLimit = this.adaptiveLimits.get(key);
                if (adaptiveLimit && new Date() < adaptiveLimit.expiresAt) {
                    options.max = adaptiveLimit.max;
                    options.windowMs = adaptiveLimit.windowMs;
                }
                
                // Get current count from Redis
                const current = await this.getCurrentCount(key, options.windowMs);
                
                // Check if limit exceeded
                if (current >= options.max) {
                    await this.rateLimitHandler(req, res, next, { ...options, keyGenerator: () => key });
                    return;
                }
                
                // Increment counter
                await this.incrementCounter(key, options.windowMs);
                
                // Add rate limit headers
                res.set({
                    'X-RateLimit-Limit': options.max,
                    'X-RateLimit-Remaining': Math.max(0, options.max - current - 1),
                    'X-RateLimit-Reset': new Date(Date.now() + options.windowMs).toISOString()
                });
                
                next();
                
            } catch (error) {
                console.error('Rate limiting error:', error);
                next(); // Fail open for availability
            }
        };
    }

    /**
     * Get current request count
     */
    async getCurrentCount(key, windowMs) {
        if (!this.redisClient.isOpen) {
            return 0;
        }
        
        const current = await this.redisClient.get(`rl:${key}`);
        return parseInt(current) || 0;
    }

    /**
     * Increment request counter
     */
    async incrementCounter(key, windowMs) {
        if (!this.redisClient.isOpen) {
            return;
        }
        
        const redisKey = `rl:${key}`;
        const multi = this.redisClient.multi();
        
        multi.incr(redisKey);
        multi.expire(redisKey, Math.ceil(windowMs / 1000));
        
        await multi.exec();
    }

    /**
     * Log security events
     */
    async logSecurityEvent(eventType, req, details) {
        const event = {
            id: uuidv4(),
            eventType: eventType,
            timestamp: new Date(),
            ip: req?.ip || null,
            userAgent: req?.get('User-Agent') || null,
            userId: req?.user?.id || null,
            details: details
        };
        
        // Store in Redis with TTL
        if (this.redisClient.isOpen) {
            await this.redisClient.setEx(
                `security_event:${event.id}`,
                7 * 24 * 60 * 60, // 7 days TTL
                JSON.stringify(event)
            );
        }
        
        console.log(`Security Event: ${eventType}`, event);
    }

    /**
     * Get rate limiting statistics
     */
    async getRateLimitStats(timeframe = '1h') {
        const stats = {
            timeframe: timeframe,
            totalViolations: 0,
            topViolators: [],
            blockedIPs: Array.from(this.blockedIPs),
            suspiciousIPs: Array.from(this.suspiciousIPs),
            adaptiveLimits: Object.fromEntries(this.adaptiveLimits),
            violationsByEndpoint: {}
        };
        
        // Get violations from Redis if available
        if (this.redisClient.isOpen) {
            // Implementation would scan Redis for violations in timeframe
            // This is a simplified version
            stats.totalViolations = this.rateLimitViolations.size;
        }
        
        return stats;
    }

    /**
     * Reset rate limits for specific key
     */
    async resetRateLimit(key) {
        if (this.redisClient.isOpen) {
            await this.redisClient.del(`rl:${key}`);
        }
        
        this.rateLimitViolations.delete(key);
        this.adaptiveLimits.delete(key);
        
        return { success: true, message: `Rate limit reset for key: ${key}` };
    }

    /**
     * Unblock IP address
     */
    async unblockIP(ip) {
        this.blockedIPs.delete(ip);
        
        if (this.redisClient.isOpen) {
            await this.redisClient.del(`blocked:${ip}`);
        }
        
        await this.logSecurityEvent('ip_unblocked', null, { ip: ip });
        
        return { success: true, message: `IP ${ip} has been unblocked` };
    }

    /**
     * Cleanup expired records
     */
    async cleanup() {
        const now = new Date();
        
        // Clean up expired adaptive limits
        for (const [key, limit] of this.adaptiveLimits.entries()) {
            if (now > limit.expiresAt) {
                this.adaptiveLimits.delete(key);
            }
        }
        
        // Clean up old violations (keep only last 24 hours)
        const oneDayAgo = now.getTime() - (24 * 60 * 60 * 1000);
        for (const [key, violations] of this.rateLimitViolations.entries()) {
            if (violations < oneDayAgo) {
                this.rateLimitViolations.delete(key);
            }
        }
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        if (this.redisClient.isOpen) {
            await this.redisClient.quit();
        }
    }
}

// Export middleware factory
const rateLimitingService = new RateLimitingService();

module.exports = {
    RateLimitingService,
    rateLimitingService,
    
    // Middleware exports
    generalRateLimit: () => rateLimitingService.generalRateLimit(),
    authRateLimit: () => rateLimitingService.authRateLimit(),
    apiRateLimit: () => rateLimitingService.apiRateLimit(),
    fileUploadRateLimit: () => rateLimitingService.fileUploadRateLimit(),
    kycRateLimit: () => rateLimitingService.kycRateLimit(),
    investmentRateLimit: () => rateLimitingService.investmentRateLimit(),
    analyticsRateLimit: () => rateLimitingService.analyticsRateLimit(),
    ipBlockingMiddleware: () => rateLimitingService.ipBlockingMiddleware()
};