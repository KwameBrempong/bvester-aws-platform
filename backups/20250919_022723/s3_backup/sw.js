/**
 * BVESTER SERVICE WORKER
 * Production-ready caching and offline functionality
 */

const CACHE_NAME = 'bvester-v1.0.0';
const STATIC_CACHE = 'bvester-static-v1.0.0';
const DYNAMIC_CACHE = 'bvester-dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/main.css',
    '/js/performance-optimized.js',
    '/js/api-client.js',
    '/js/auth-guard.js',
    '/logo-icon.png',
    '/manifest.json'
];

// Network-first resources (always try network first)
const NETWORK_FIRST = [
    '/api/',
    '/opportunities.html',
    '/login.html',
    '/signup.html'
];

// Cache-first resources (serve from cache if available)
const CACHE_FIRST = [
    '/css/',
    '/js/',
    '/images/',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.ico'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('📦 Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker: Installation complete');
                return self.skipWaiting(); // Activate immediately
            })
            .catch(error => {
                console.error('❌ Service Worker: Installation failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== CACHE_NAME) {
                            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Activation complete');
                return self.clients.claim(); // Take control immediately
            })
    );
});

// Fetch event - handle all requests with appropriate caching strategy
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    event.respondWith(
        handleRequest(request)
    );
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    try {
        // API requests - Network first with offline fallback
        if (isNetworkFirst(pathname)) {
            return await networkFirstStrategy(request);
        }
        
        // Static assets - Cache first
        if (isCacheFirst(pathname)) {
            return await cacheFirstStrategy(request);
        }
        
        // HTML pages - Network first with cache fallback
        if (pathname.endsWith('.html') || pathname === '/') {
            return await networkFirstStrategy(request);
        }
        
        // Default - Network first
        return await networkFirstStrategy(request);
        
    } catch (error) {
        console.error('Service Worker: Request handling failed', error);
        return await getOfflineFallback(request);
    }
}

// Network-first strategy (for API calls and dynamic content)
async function networkFirstStrategy(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        // Network failed, try cache
        console.log('📶 Service Worker: Network failed, trying cache for', request.url);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
    // Try cache first
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        // Update cache in background
        updateCacheInBackground(request);
        return cachedResponse;
    }
    
    // Not in cache, fetch from network
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('Service Worker: Failed to fetch from network', request.url);
        throw error;
    }
}

// Update cache in background (stale-while-revalidate)
function updateCacheInBackground(request) {
    fetch(request)
        .then(response => {
            if (response.ok) {
                caches.open(STATIC_CACHE)
                    .then(cache => cache.put(request, response));
            }
        })
        .catch(error => {
            console.log('Background cache update failed for', request.url);
        });
}

// Get offline fallback
async function getOfflineFallback(request) {
    const url = new URL(request.url);
    
    // For HTML pages, return offline page
    if (request.headers.get('accept').includes('text/html')) {
        const offlineResponse = await caches.match('/index.html');
        if (offlineResponse) {
            return offlineResponse;
        }
    }
    
    // For images, return placeholder
    if (request.headers.get('accept').includes('image')) {
        return new Response('', {
            status: 200,
            statusText: 'Offline placeholder'
        });
    }
    
    // Default offline response
    return new Response('Offline - Please check your connection', {
        status: 503,
        statusText: 'Service Unavailable'
    });
}

// Helper functions
function isNetworkFirst(pathname) {
    return NETWORK_FIRST.some(pattern => pathname.startsWith(pattern));
}

function isCacheFirst(pathname) {
    return CACHE_FIRST.some(pattern => 
        pathname.startsWith(pattern) || pathname.endsWith(pattern)
    );
}

// Background sync for offline actions
self.addEventListener('sync', event => {
    console.log('🔄 Service Worker: Background sync triggered', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Handle offline actions when connection is restored
    try {
        // Process any queued investment data
        const queuedActions = await getQueuedActions();
        
        for (const action of queuedActions) {
            await processQueuedAction(action);
        }
        
        await clearQueuedActions();
        console.log('✅ Service Worker: Background sync completed');
        
    } catch (error) {
        console.error('❌ Service Worker: Background sync failed', error);
    }
}

async function getQueuedActions() {
    try {
        const cache = await caches.open('bvester-offline-queue');
        const queuedRequests = await cache.keys();
        
        const actions = [];
        for (const request of queuedRequests) {
            const response = await cache.match(request);
            if (response) {
                const actionData = await response.json();
                actions.push(actionData);
            }
        }
        
        return actions;
    } catch (error) {
        return [];
    }
}

async function processQueuedAction(action) {
    // Process offline investment actions, user registrations, etc.
    try {
        const response = await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body
        });
        
        if (response.ok) {
            console.log('✅ Processed queued action:', action.type);
        }
    } catch (error) {
        console.error('❌ Failed to process queued action:', error);
        throw error;
    }
}

async function clearQueuedActions() {
    try {
        await caches.delete('bvester-offline-queue');
    } catch (error) {
        console.error('Failed to clear queued actions:', error);
    }
}

// Handle push notifications
self.addEventListener('push', event => {
    if (!event.data) {
        return;
    }
    
    try {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/logo-icon.png',
            badge: '/logo-icon.png',
            data: data.data || {},
            actions: [
                {
                    action: 'view',
                    title: 'View Details'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
        
    } catch (error) {
        console.error('Push notification error:', error);
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'view') {
        const url = event.notification.data.url || '/';
        event.waitUntil(
            clients.openWindow(url)
        );
    }
});

console.log('🚀 Bvester Service Worker loaded and ready');