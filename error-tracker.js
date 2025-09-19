// Bvester Frontend Error Tracking and Monitoring System
// Captures, reports, and analyzes frontend errors in real-time

(function(window) {
    'use strict';

    const ErrorTracker = {
        // Configuration
        config: {
            apiEndpoint: 'https://y06kgtou3i.execute-api.eu-west-2.amazonaws.com/prod/api/errors',
            maxErrors: 100,
            throttleMs: 1000,
            enableConsoleCapture: true,
            enableNetworkCapture: true,
            enablePerformanceTracking: true,
            sessionId: generateSessionId(),
            userId: null
        },

        // Error queue
        errorQueue: [],
        lastErrorTime: 0,
        errorCounts: {},

        // Initialize the error tracker
        init: function(customConfig = {}) {
            Object.assign(this.config, customConfig);

            // Set user ID from localStorage if available
            const userData = localStorage.getItem('bvesterUser');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    this.config.userId = user.email || user.id;
                } catch (e) {}
            }

            // Setup error handlers
            this.setupErrorHandlers();
            this.setupConsoleCapture();
            this.setupNetworkCapture();
            this.setupPerformanceTracking();

            // Send queued errors every 10 seconds
            setInterval(() => this.flushErrors(), 10000);

            // Send errors on page unload
            window.addEventListener('beforeunload', () => this.flushErrors());

            console.log('Bvester Error Tracker initialized');
        },

        // Setup global error handlers
        setupErrorHandlers: function() {
            // Handle JavaScript errors
            window.addEventListener('error', (event) => {
                this.trackError({
                    type: 'javascript',
                    message: event.message,
                    source: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    stack: event.error ? event.error.stack : null,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                });
            });

            // Handle promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                this.trackError({
                    type: 'unhandled_promise',
                    message: event.reason?.message || String(event.reason),
                    stack: event.reason?.stack,
                    promise: String(event.promise),
                    timestamp: new Date().toISOString()
                });
            });
        },

        // Capture console errors and warnings
        setupConsoleCapture: function() {
            if (!this.config.enableConsoleCapture) return;

            const originalError = console.error;
            const originalWarn = console.warn;

            console.error = (...args) => {
                this.trackError({
                    type: 'console_error',
                    message: args.map(arg => String(arg)).join(' '),
                    timestamp: new Date().toISOString()
                });
                originalError.apply(console, args);
            };

            console.warn = (...args) => {
                this.trackError({
                    type: 'console_warning',
                    message: args.map(arg => String(arg)).join(' '),
                    severity: 'warning',
                    timestamp: new Date().toISOString()
                });
                originalWarn.apply(console, args);
            };
        },

        // Capture network errors
        setupNetworkCapture: function() {
            if (!this.config.enableNetworkCapture) return;

            // Intercept fetch
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                const startTime = performance.now();
                const [resource, config] = args;

                try {
                    const response = await originalFetch(...args);
                    const duration = performance.now() - startTime;

                    // Track slow requests
                    if (duration > 3000) {
                        this.trackError({
                            type: 'slow_request',
                            severity: 'warning',
                            url: String(resource),
                            duration: Math.round(duration),
                            method: config?.method || 'GET',
                            timestamp: new Date().toISOString()
                        });
                    }

                    // Track failed requests
                    if (!response.ok) {
                        this.trackError({
                            type: 'network_error',
                            url: String(resource),
                            status: response.status,
                            statusText: response.statusText,
                            method: config?.method || 'GET',
                            timestamp: new Date().toISOString()
                        });
                    }

                    return response;
                } catch (error) {
                    this.trackError({
                        type: 'network_failure',
                        url: String(resource),
                        message: error.message,
                        method: config?.method || 'GET',
                        timestamp: new Date().toISOString()
                    });
                    throw error;
                }
            };

            // Intercept XMLHttpRequest
            const originalXHROpen = XMLHttpRequest.prototype.open;
            const originalXHRSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function(method, url, ...args) {
                this._errorTracker = {
                    method: method,
                    url: url,
                    startTime: null
                };
                return originalXHROpen.apply(this, [method, url, ...args]);
            };

            XMLHttpRequest.prototype.send = function(...args) {
                if (this._errorTracker) {
                    this._errorTracker.startTime = performance.now();

                    this.addEventListener('load', () => {
                        const duration = performance.now() - this._errorTracker.startTime;

                        if (this.status >= 400) {
                            ErrorTracker.trackError({
                                type: 'xhr_error',
                                url: this._errorTracker.url,
                                status: this.status,
                                method: this._errorTracker.method,
                                duration: Math.round(duration),
                                timestamp: new Date().toISOString()
                            });
                        }
                    });

                    this.addEventListener('error', () => {
                        ErrorTracker.trackError({
                            type: 'xhr_failure',
                            url: this._errorTracker.url,
                            method: this._errorTracker.method,
                            timestamp: new Date().toISOString()
                        });
                    });
                }

                return originalXHRSend.apply(this, args);
            };
        },

        // Track performance metrics
        setupPerformanceTracking: function() {
            if (!this.config.enablePerformanceTracking) return;

            // Track page load performance
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        this.trackMetric({
                            type: 'page_load',
                            metrics: {
                                domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
                                loadComplete: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                                domInteractive: Math.round(perfData.domInteractive),
                                firstPaint: Math.round(perfData.responseEnd - perfData.fetchStart)
                            },
                            url: window.location.href,
                            timestamp: new Date().toISOString()
                        });
                    }
                }, 0);
            });

            // Track long tasks
            if ('PerformanceObserver' in window) {
                try {
                    const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.duration > 50) {
                                this.trackMetric({
                                    type: 'long_task',
                                    duration: Math.round(entry.duration),
                                    timestamp: new Date().toISOString()
                                });
                            }
                        }
                    });
                    observer.observe({ entryTypes: ['longtask'] });
                } catch (e) {}
            }
        },

        // Track an error
        trackError: function(errorData) {
            // Throttle errors
            const now = Date.now();
            if (now - this.lastErrorTime < this.config.throttleMs) {
                return;
            }
            this.lastErrorTime = now;

            // Add context
            const error = {
                ...errorData,
                sessionId: this.config.sessionId,
                userId: this.config.userId,
                url: window.location.href,
                referrer: document.referrer,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                screen: {
                    width: window.screen.width,
                    height: window.screen.height
                }
            };

            // Increment error count
            const errorKey = `${error.type}:${error.message || error.url}`;
            this.errorCounts[errorKey] = (this.errorCounts[errorKey] || 0) + 1;
            error.occurrences = this.errorCounts[errorKey];

            // Add to queue
            this.errorQueue.push(error);

            // Limit queue size
            if (this.errorQueue.length > this.config.maxErrors) {
                this.errorQueue.shift();
            }

            // Send immediately if critical error
            if (error.severity === 'critical' || error.type === 'unhandled_promise') {
                this.flushErrors();
            }

            // Log to console in development
            if (window.location.hostname === 'localhost') {
                console.log('[Error Tracked]', error);
            }
        },

        // Track a performance metric
        trackMetric: function(metricData) {
            const metric = {
                ...metricData,
                sessionId: this.config.sessionId,
                userId: this.config.userId
            };

            // Send metrics separately
            this.sendToBackend([metric], '/metrics');
        },

        // Custom error tracking
        trackCustomError: function(message, details = {}) {
            this.trackError({
                type: 'custom',
                message: message,
                details: details,
                timestamp: new Date().toISOString()
            });
        },

        // Send errors to backend
        flushErrors: function() {
            if (this.errorQueue.length === 0) return;

            const errors = [...this.errorQueue];
            this.errorQueue = [];

            this.sendToBackend(errors, '/errors');
        },

        // Send data to backend
        sendToBackend: function(data, endpoint = '') {
            const url = this.config.apiEndpoint + endpoint;

            // Use sendBeacon if available for reliability
            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(data)], {
                    type: 'application/json'
                });
                navigator.sendBeacon(url, blob);
            } else {
                // Fallback to fetch
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                }).catch(() => {
                    // Silently fail to avoid recursive errors
                });
            }
        }
    };

    // Helper function to generate session ID
    function generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Expose to global scope
    window.BvesterErrorTracker = ErrorTracker;

    // Auto-initialize if not in test environment
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ErrorTracker.init());
    } else {
        ErrorTracker.init();
    }

})(window);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.BvesterErrorTracker;
}