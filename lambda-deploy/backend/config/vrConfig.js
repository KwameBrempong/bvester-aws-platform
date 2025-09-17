/**
 * VR Integration Configuration for Bvester Platform
 * Settings for WebXR, 360° video, Zoom integration, and VR compatibility
 * Week 10 Implementation - VR Integration Setup
 */

const vrConfig = {
    // WebXR Configuration
    webxr: {
        supportedModes: ['immersive-vr', 'immersive-ar', 'inline'],
        requiredFeatures: ['local'],
        optionalFeatures: [
            'hand-tracking',
            'layers',
            'bounded-floor',
            'unbounded',
            'local-floor',
            'viewer',
            'hit-test',
            'anchors'
        ],
        framerate: {
            target: 90,
            minimum: 60,
            fallback: 30
        },
        renderResolution: {
            desktop: { width: 1920, height: 1080 },
            mobile: { width: 1280, height: 720 },
            vr: { width: 2880, height: 1700 } // Per eye
        }
    },

    // 360° Video Configuration
    video360: {
        supportedFormats: ['mp4', 'webm', 'mov'],
        qualityLevels: {
            'SD': {
                resolution: '1280x720',
                bitrate: '2000k',
                fps: 30,
                codec: 'h264'
            },
            'HD': {
                resolution: '1920x1080',
                bitrate: '5000k',
                fps: 30,
                codec: 'h264'
            },
            '4K': {
                resolution: '3840x2160',
                bitrate: '15000k',
                fps: 30,
                codec: 'h265'
            },
            '8K': {
                resolution: '7680x4320',
                bitrate: '50000k',
                fps: 30,
                codec: 'h265'
            }
        },
        adaptiveStreaming: {
            enabled: true,
            segmentDuration: 6, // seconds
            bufferSize: 30, // seconds
            bandwidthTest: true
        },
        projection: {
            type: 'equirectangular',
            stereoFormat: 'mono', // mono, stereo-lr, stereo-tb
            fov: 360
        }
    },

    // Zoom Integration Configuration
    zoom: {
        api: {
            baseUrl: process.env.ZOOM_API_BASE_URL || 'https://api.zoom.us/v2',
            timeout: 30000,
            rateLimits: {
                createMeeting: { max: 100, window: 3600000 }, // 100 per hour
                updateMeeting: { max: 300, window: 3600000 }   // 300 per hour
            }
        },
        meeting: {
            defaultSettings: {
                type: 2, // Scheduled meeting
                duration: 60, // minutes
                timezone: 'UTC',
                settings: {
                    host_video: true,
                    participant_video: true,
                    cn_meeting: false,
                    in_meeting: false,
                    join_before_host: false,
                    mute_upon_entry: true,
                    watermark: false,
                    use_pmi: false,
                    approval_type: 2,
                    audio: 'both',
                    auto_recording: 'local',
                    enforce_login: false,
                    enforce_login_domains: '',
                    alternative_hosts: '',
                    close_registration: false,
                    show_share_button: true,
                    allow_multiple_devices: true,
                    registrants_confirmation_email: true,
                    waiting_room: true,
                    request_permission_to_unmute_participants: true,
                    global_dial_in_countries: ['US', 'NG', 'KE', 'GH', 'ZA'],
                    registrants_email_notification: true
                }
            },
            africaTimezones: [
                'Africa/Lagos',      // Nigeria
                'Africa/Nairobi',    // Kenya
                'Africa/Accra',      // Ghana  
                'Africa/Johannesburg', // South Africa
                'Africa/Kampala',    // Uganda
                'Africa/Dar_es_Salaam', // Tanzania
                'Africa/Cairo',      // Egypt
                'Africa/Casablanca'  // Morocco
            ]
        },
        webhooks: {
            endpoint: process.env.ZOOM_WEBHOOK_URL || '/api/webhooks/zoom',
            events: [
                'meeting.started',
                'meeting.ended',
                'meeting.participant_joined',
                'meeting.participant_left',
                'recording.completed'
            ],
            verificationToken: process.env.ZOOM_VERIFICATION_TOKEN
        }
    },

    // Device Compatibility Configuration
    deviceCompatibility: {
        supportedBrowsers: {
            chrome: { minimum: '79', recommended: '100+' },
            firefox: { minimum: '72', recommended: '98+' },
            safari: { minimum: '13', recommended: '15+' },
            edge: { minimum: '79', recommended: '100+' },
            samsung: { minimum: '12', recommended: '16+' }
        },
        vrHeadsets: {
            'oculus-quest': {
                supported: true,
                webxr: true,
                resolution: '2880x1700',
                refreshRate: [72, 90, 120],
                features: ['hand-tracking', 'spatial-audio', 'haptic-feedback']
            },
            'oculus-quest-2': {
                supported: true,
                webxr: true,
                resolution: '3664x1920',
                refreshRate: [72, 90, 120],
                features: ['hand-tracking', 'spatial-audio', 'haptic-feedback']
            },
            'htc-vive': {
                supported: true,
                webxr: true,
                resolution: '2880x1700',
                refreshRate: [90],
                features: ['controllers', 'room-scale', 'lighthouse-tracking']
            },
            'pico-4': {
                supported: true,
                webxr: true,
                resolution: '4320x2160',
                refreshRate: [72, 90],
                features: ['hand-tracking', 'eye-tracking', 'facial-tracking']
            },
            'cardboard': {
                supported: true,
                webxr: false,
                resolution: 'device-dependent',
                refreshRate: [60],
                features: ['basic-vr']
            }
        },
        mobileDevices: {
            ios: {
                minimumVersion: '13.0',
                webxrSupport: false,
                fallbackMode: 'device-orientation',
                optimizations: ['touch-controls', 'gyroscope']
            },
            android: {
                minimumVersion: '7.0',
                webxrSupport: true,
                fallbackMode: 'device-orientation',
                optimizations: ['touch-controls', 'gyroscope', 'arcore']
            }
        }
    },

    // Performance Configuration
    performance: {
        streaming: {
            adaptiveBitrate: true,
            bufferHealth: {
                target: 15, // seconds
                minimum: 5,
                maximum: 30
            },
            networkThresholds: {
                excellent: 50000000, // 50 Mbps
                good: 25000000,      // 25 Mbps  
                fair: 10000000,      // 10 Mbps
                poor: 5000000        // 5 Mbps
            },
            qualityLevels: [
                { name: 'auto', bitrate: 'adaptive' },
                { name: 'ultra', bitrate: '25000k' },
                { name: 'high', bitrate: '15000k' },
                { name: 'medium', bitrate: '5000k' },
                { name: 'low', bitrate: '2000k' }
            ]
        },
        rendering: {
            maxFPS: 90,
            targetFPS: 60,
            minFPS: 30,
            foveatedRendering: true,
            temporalResampling: true,
            spatialResampling: true
        },
        caching: {
            videoPrefetch: true,
            thumbnailPrefetch: true,
            assetCaching: {
                maxSize: '500MB',
                ttl: 86400000 // 24 hours
            }
        }
    },

    // Content Delivery Network Configuration
    cdn: {
        baseUrl: process.env.VR_CDN_BASE_URL || 'https://cdn.bvester.com/vr',
        regions: {
            'africa-west': 'https://vr-aw.bvester.com',
            'africa-east': 'https://vr-ae.bvester.com', 
            'africa-south': 'https://vr-as.bvester.com',
            'global': 'https://vr-global.bvester.com'
        },
        paths: {
            videos: '/videos',
            thumbnails: '/thumbnails', 
            assets: '/assets',
            streaming: '/stream'
        },
        optimization: {
            imageFormats: ['webp', 'avif', 'jpeg'],
            videoFormats: ['webm', 'mp4'],
            compression: {
                gzip: true,
                brotli: true
            }
        }
    },

    // Analytics Configuration
    analytics: {
        tracking: {
            viewTime: true,
            interactionEvents: true,
            performanceMetrics: true,
            errorTracking: true
        },
        events: [
            'tour-started',
            'tour-completed',
            'tour-abandoned',
            'hotspot-clicked',
            'scene-transition',
            'device-detected',
            'quality-changed',
            'error-occurred'
        ],
        retention: {
            rawEvents: 30,    // days
            aggregated: 365,  // days
            anonymized: 1095  // 3 years
        }
    },

    // Security Configuration
    security: {
        contentProtection: {
            drmEnabled: false, // For future implementation
            watermarking: true,
            domainRestriction: true,
            hotlinking: false
        },
        apiSecurity: {
            rateLimiting: {
                windowMs: 900000, // 15 minutes
                max: 100 // requests per window
            },
            cors: {
                origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://bvester.com'],
                credentials: true
            }
        }
    },

    // Regional Configuration for Africa
    africanMarkets: {
        connectivity: {
            'nigeria': {
                averageBandwidth: '15Mbps',
                recommendedQuality: 'HD',
                fallbackQuality: 'SD',
                preferredCDN: 'africa-west'
            },
            'kenya': {
                averageBandwidth: '12Mbps', 
                recommendedQuality: 'HD',
                fallbackQuality: 'SD',
                preferredCDN: 'africa-east'
            },
            'ghana': {
                averageBandwidth: '10Mbps',
                recommendedQuality: 'HD',
                fallbackQuality: 'SD', 
                preferredCDN: 'africa-west'
            },
            'south-africa': {
                averageBandwidth: '25Mbps',
                recommendedQuality: '4K',
                fallbackQuality: 'HD',
                preferredCDN: 'africa-south'
            }
        },
        localization: {
            languages: ['en', 'fr', 'sw', 'ar', 'pt'],
            currencies: ['USD', 'NGN', 'KES', 'GHS', 'ZAR'],
            dateFormats: {
                'nigeria': 'DD/MM/YYYY',
                'kenya': 'DD/MM/YYYY', 
                'ghana': 'DD/MM/YYYY',
                'south-africa': 'YYYY/MM/DD'
            }
        }
    }
};

module.exports = vrConfig;