/**
 * VR Tour API Routes for Bvester Platform
 * RESTful endpoints for VR tours, WebXR integration, and live demos
 * Week 10 Implementation - VR Integration Setup
 */

const express = require('express');
const router = express.Router();
const VRTourService = require('../services/vrTourService');
const { authMiddleware, businessOwnerMiddleware, investorMiddleware } = require('../middleware/auth');
const { validateVRTourData, validateLiveDemoData } = require('../middleware/validation');

const vrTourService = new VRTourService();

/**
 * @route   POST /api/vr-tours/initialize
 * @desc    Initialize a new VR tour for a business
 * @access  Business Owner
 */
router.post('/initialize', authMiddleware, businessOwnerMiddleware, validateVRTourData, async (req, res) => {
    try {
        const { businessId, tourType, options } = req.body;
        
        // Verify business ownership
        if (req.user.businessId !== businessId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You can only create tours for your own business'
            });
        }

        const tour = await vrTourService.initializeTour(businessId, tourType, options);
        
        res.status(201).json({
            success: true,
            message: 'VR tour initialized successfully',
            data: {
                tourId: tour.id,
                businessId: tour.businessId,
                type: tour.type,
                status: tour.status,
                metadata: tour.metadata
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to initialize VR tour',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/vr-tours/detect-capabilities
 * @desc    Detect user device VR capabilities
 * @access  Public
 */
router.post('/detect-capabilities', async (req, res) => {
    try {
        const userAgent = req.get('User-Agent');
        const { deviceInfo } = req.body;

        const capabilities = await vrTourService.detectDeviceCapabilities(userAgent, deviceInfo);
        
        res.json({
            success: true,
            message: 'Device capabilities detected',
            data: capabilities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to detect device capabilities',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/vr-tours/:tourId/360-video
 * @desc    Create 360° video tour assets
 * @access  Business Owner
 */
router.post('/:tourId/360-video', authMiddleware, businessOwnerMiddleware, async (req, res) => {
    try {
        const { tourId } = req.params;
        const { businessId, videoAssets, metadata } = req.body;

        // Verify business ownership
        if (req.user.businessId !== businessId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You can only manage tours for your own business'
            });
        }

        const tour = await vrTourService.create360VideoTour(businessId, videoAssets, metadata);
        
        res.status(201).json({
            success: true,
            message: '360° video tour created successfully',
            data: {
                tourId: tour.id,
                scenes: tour.scenes.length,
                assets: tour.assets.length,
                interactive: tour.interactive
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create 360° video tour',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/vr-tours/:tourId/webxr-session
 * @desc    Setup WebXR session for immersive VR experience
 * @access  Authenticated Users
 */
router.post('/:tourId/webxr-session', authMiddleware, async (req, res) => {
    try {
        const { tourId } = req.params;
        const { deviceCapabilities } = req.body;

        const session = await vrTourService.setupWebXRSession(tourId, deviceCapabilities);
        
        res.status(201).json({
            success: true,
            message: 'WebXR session setup successfully',
            data: {
                sessionId: session.sessionId,
                sessionMode: session.sessionMode,
                features: session.optionalFeatures,
                status: session.status
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to setup WebXR session',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/vr-tours/live-demo
 * @desc    Setup live business demo with Zoom integration
 * @access  Business Owner
 */
router.post('/live-demo', authMiddleware, businessOwnerMiddleware, validateLiveDemoData, async (req, res) => {
    try {
        const { businessId, scheduledTime, participantEmails } = req.body;

        // Verify business ownership
        if (req.user.businessId !== businessId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You can only schedule demos for your own business'
            });
        }

        const demo = await vrTourService.setupLiveDemo(businessId, scheduledTime, participantEmails);
        
        res.status(201).json({
            success: true,
            message: 'Live demo scheduled successfully',
            data: {
                demoId: demo.id,
                scheduledTime: demo.scheduledTime,
                zoom: {
                    meetingId: demo.zoom.meetingId,
                    joinUrl: demo.zoom.joinUrl,
                    password: demo.zoom.password
                },
                participants: demo.participants.length,
                vrIntegration: demo.vrIntegration.enabled
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to setup live demo',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/vr-tours/:tourId/compatibility-test
 * @desc    Test cross-platform VR compatibility
 * @access  Business Owner
 */
router.get('/:tourId/compatibility-test', authMiddleware, businessOwnerMiddleware, async (req, res) => {
    try {
        const { tourId } = req.params;

        const testResults = await vrTourService.testCrossPlatformCompatibility(tourId);
        
        res.json({
            success: true,
            message: 'Compatibility test completed',
            data: testResults
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to run compatibility test',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/vr-tours/:tourId/analytics
 * @desc    Get VR tour analytics and performance metrics
 * @access  Business Owner
 */
router.get('/:tourId/analytics', authMiddleware, businessOwnerMiddleware, async (req, res) => {
    try {
        const { tourId } = req.params;

        const analytics = await vrTourService.getTourAnalytics(tourId);
        
        res.json({
            success: true,
            message: 'Tour analytics retrieved successfully',
            data: analytics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve tour analytics',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/vr-tours/business/:businessId
 * @desc    Get all VR tours for a business
 * @access  Authenticated Users
 */
router.get('/business/:businessId', authMiddleware, async (req, res) => {
    try {
        const { businessId } = req.params;
        const { tourType, status } = req.query;

        // Filter tours based on query parameters
        const tours = Array.from(vrTourService.activeTours.values())
            .filter(tour => {
                if (tour.businessId !== businessId) return false;
                if (tourType && tour.type !== tourType) return false;
                if (status && tour.status !== status) return false;
                return true;
            })
            .map(tour => ({
                id: tour.id,
                businessId: tour.businessId,
                type: tour.type,
                status: tour.status,
                createdAt: tour.createdAt,
                metadata: tour.metadata,
                viewerStats: tour.viewerStats
            }));

        res.json({
            success: true,
            message: 'Business VR tours retrieved successfully',
            data: {
                businessId,
                totalTours: tours.length,
                tours: tours
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve business VR tours',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/vr-tours/:tourId/status
 * @desc    Update VR tour status
 * @access  Business Owner
 */
router.put('/:tourId/status', authMiddleware, businessOwnerMiddleware, async (req, res) => {
    try {
        const { tourId } = req.params;
        const { status, metadata } = req.body;

        const tour = vrTourService.activeTours.get(tourId);
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: 'VR tour not found'
            });
        }

        // Verify business ownership
        if (req.user.businessId !== tour.businessId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You can only manage tours for your own business'
            });
        }

        // Update tour status
        tour.status = status;
        if (metadata) {
            tour.metadata = { ...tour.metadata, ...metadata };
        }
        tour.updatedAt = new Date();

        vrTourService.activeTours.set(tourId, tour);
        
        res.json({
            success: true,
            message: 'VR tour status updated successfully',
            data: {
                tourId: tour.id,
                status: tour.status,
                updatedAt: tour.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update VR tour status',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/vr-tours/:tourId
 * @desc    Delete VR tour
 * @access  Business Owner
 */
router.delete('/:tourId', authMiddleware, businessOwnerMiddleware, async (req, res) => {
    try {
        const { tourId } = req.params;

        const tour = vrTourService.activeTours.get(tourId);
        if (!tour) {
            return res.status(404).json({
                success: false,
                message: 'VR tour not found'
            });
        }

        // Verify business ownership
        if (req.user.businessId !== tour.businessId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You can only delete tours for your own business'
            });
        }

        vrTourService.activeTours.delete(tourId);
        
        res.json({
            success: true,
            message: 'VR tour deleted successfully',
            data: {
                tourId,
                deletedAt: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete VR tour',
            error: error.message
        });
    }
});

module.exports = router;