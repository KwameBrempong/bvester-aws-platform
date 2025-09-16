/**
 * BVESTER WEB-ONLY CONFIGURATION
 * This file ensures web-only operation without Expo interference
 */

// Override any global variables that might trigger Expo redirects
if (typeof window !== 'undefined') {
    // Prevent Expo SDK from loading
    window.__EXPO_DISABLE_ROUTING = true;
    window.__BVESTER_WEB_ONLY = true;
    
    // Override any Expo-related global objects
    window.ExpoConstants = undefined;
    window.ExpoRouter = undefined;
    window.ExpoLinking = undefined;
    
    // Ensure proper web navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(state, title, url) {
        // Block any Expo URL attempts
        if (typeof url === 'string' && (url.includes('exp://') || url.includes('exp.host'))) {
            console.warn('Blocked Expo URL navigation attempt:', url);
            return;
        }
        return originalPushState.call(this, state, title, url);
    };
    
    history.replaceState = function(state, title, url) {
        // Block any Expo URL attempts  
        if (typeof url === 'string' && (url.includes('exp://') || url.includes('exp.host'))) {
            console.warn('Blocked Expo URL navigation attempt:', url);
            return;
        }
        return originalReplaceState.call(this, state, title, url);
    };
    
    // Override window.open to prevent Expo redirects
    const originalWindowOpen = window.open;
    window.open = function(url, name, specs) {
        if (typeof url === 'string' && (url.includes('exp://') || url.includes('exp.host'))) {
            console.warn('Blocked Expo URL window.open attempt:', url);
            return null;
        }
        return originalWindowOpen.call(this, url, name, specs);
    };
    
    // Add web-only identifier
    document.documentElement.setAttribute('data-bvester-platform', 'web');
    
    console.log('🌐 Bvester Web-Only Configuration Loaded');
    console.log('✅ Expo redirect protection activated');
}

// Export web-only configuration
export const BVESTER_WEB_CONFIG = {
    platform: 'web',
    disableExpo: true,
    enableWebOnlyFeatures: true,
    baseUrl: window?.location?.origin || 'https://bvester.com',
    version: '1.0.0-web'
};

export default BVESTER_WEB_CONFIG;