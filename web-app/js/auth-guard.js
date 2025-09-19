/**
 * Bvester Authentication Guard System
 * Protects routes and manages authentication state across the application
 */

class AuthGuard {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.redirectUrl = null;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    /**
     * Initialize the auth guard with comprehensive checks
     */
    async initialize() {
        if (this.isInitialized) {
            return this.currentUser;
        }

        try {
            console.log('🔐 AuthGuard: Initializing authentication system...');
            
            // Wait for Firebase and bvesterAPI to be available
            await this.waitForDependencies();
            
            // Initialize Firebase Auth if not already done
            if (typeof bvesterAPI !== 'undefined') {
                await bvesterAPI.initializeAuth();
                this.currentUser = bvesterAPI.currentUser;
            } else {
                throw new Error('BvesterAPI not available');
            }
            
            this.isInitialized = true;
            console.log('✅ AuthGuard: Authentication system initialized');
            
            return this.currentUser;
            
        } catch (error) {
            console.error('❌ AuthGuard: Initialization failed:', error);
            this.retryCount++;
            
            if (this.retryCount < this.maxRetries) {
                console.log(`🔄 AuthGuard: Retrying initialization (${this.retryCount}/${this.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.initialize();
            }
            
            throw new Error('Authentication system failed to initialize after multiple attempts');
        }
    }

    /**
     * Wait for required dependencies to load
     */
    async waitForDependencies() {
        const maxWaitTime = 15000; // 15 seconds
        const checkInterval = 500; // 500ms
        let elapsed = 0;

        return new Promise((resolve, reject) => {
            const checkDependencies = () => {
                // Check if Firebase is loaded
                const firebaseLoaded = typeof firebase !== 'undefined' && firebase.auth;
                
                // Check if bvesterAPI is loaded
                const apiLoaded = typeof bvesterAPI !== 'undefined';
                
                console.log(`🔍 AuthGuard: Dependency check - Firebase: ${firebaseLoaded}, API: ${apiLoaded}`);
                
                if (firebaseLoaded && apiLoaded) {
                    resolve();
                    return;
                }
                
                elapsed += checkInterval;
                if (elapsed >= maxWaitTime) {
                    reject(new Error('Dependencies failed to load within timeout period'));
                    return;
                }
                
                setTimeout(checkDependencies, checkInterval);
            };
            
            checkDependencies();
        });
    }

    /**
     * Check if user is authenticated and has required permissions
     */
    async requireAuth(requiredUserType = null, requireEmailVerification = false) {
        try {
            console.log('🔒 AuthGuard: Checking authentication requirements...');
            
            // Initialize if not already done
            if (!this.isInitialized) {
                await this.initialize();
            }
            
            // Check if user is logged in
            if (!this.currentUser) {
                console.log('❌ AuthGuard: User not authenticated, redirecting to login');
                this.redirectToLogin();
                return false;
            }
            
            console.log('👤 AuthGuard: User authenticated:', this.currentUser.uid);
            
            // Check email verification if required
            if (requireEmailVerification && !this.currentUser.emailVerified) {
                console.log('⚠️ AuthGuard: Email verification required');
                this.redirectToEmailVerification();
                return false;
            }
            
            // Check user type if specified
            if (requiredUserType) {
                const userType = this.currentUser.bvesterData?.userType;
                let hasValidUserType = false;
                
                if (Array.isArray(requiredUserType)) {
                    hasValidUserType = requiredUserType.includes(userType);
                } else {
                    hasValidUserType = userType === requiredUserType;
                }
                
                if (!hasValidUserType) {
                    console.log(`❌ AuthGuard: Wrong user type. Required: ${requiredUserType}, Got: ${userType}`);
                    this.redirectToCorrectDashboard(userType);
                    return false;
                }
            }
            
            // Check if profile is complete (disabled for now during development)
            // const profileComplete = this.currentUser.bvesterData?.profileComplete;
            // if (!profileComplete) {
            //     console.log('⚠️ AuthGuard: Profile incomplete, redirecting to onboarding');
            //     this.redirectToOnboarding();
            //     return false;
            // }
            
            console.log('✅ AuthGuard: All authentication checks passed');
            return true;
            
        } catch (error) {
            console.error('❌ AuthGuard: Authentication check failed:', error);
            this.showAuthError('Authentication system error. Please refresh the page.');
            return false;
        }
    }

    /**
     * Redirect user to login page
     */
    redirectToLogin() {
        this.storeCurrentUrl();
        const loginUrl = 'login.html';
        console.log('🔄 AuthGuard: Redirecting to login:', loginUrl);
        window.location.href = loginUrl;
    }

    /**
     * Redirect to email verification page
     */
    redirectToEmailVerification() {
        console.log('🔄 AuthGuard: Redirecting to email verification');
        // Create a simple email verification page
        this.showAuthError('Please verify your email address before accessing the dashboard. Check your inbox for a verification link.');
        
        // Send verification email if not already sent
        if (this.currentUser && !this.currentUser.emailVerified) {
            this.currentUser.sendEmailVerification().then(() => {
                console.log('📧 Verification email sent');
            }).catch(error => {
                console.error('❌ Failed to send verification email:', error);
            });
        }
    }

    /**
     * Redirect to onboarding flow
     */
    redirectToOnboarding() {
        const userType = this.currentUser.bvesterData?.userType;
        let onboardingUrl = 'signup.html';
        
        if (userType === 'investor') {
            onboardingUrl = 'investor-onboarding.html';
        } else if (userType === 'business' || userType === 'startup') {
            onboardingUrl = 'business-onboarding.html';
        }
        
        console.log('🔄 AuthGuard: Redirecting to onboarding:', onboardingUrl);
        window.location.href = onboardingUrl;
    }

    /**
     * Redirect to correct dashboard based on user type
     */
    redirectToCorrectDashboard(userType) {
        let dashboardUrl = 'index.html';
        
        if (userType === 'investor') {
            dashboardUrl = 'investor-dashboard.html';
        } else if (userType === 'business' || userType === 'startup') {
            dashboardUrl = 'startup-dashboard.html';
        }
        
        console.log(`🔄 AuthGuard: Redirecting to correct dashboard (${userType}):`, dashboardUrl);
        window.location.href = dashboardUrl;
    }

    /**
     * Store current URL for redirect after login
     */
    storeCurrentUrl() {
        try {
            sessionStorage.setItem('bvester_redirect_url', window.location.href);
        } catch (error) {
            console.warn('⚠️ Could not store redirect URL:', error);
        }
    }

    /**
     * Get stored redirect URL and clear it
     */
    getAndClearRedirectUrl() {
        try {
            const url = sessionStorage.getItem('bvester_redirect_url');
            if (url) {
                sessionStorage.removeItem('bvester_redirect_url');
                return url;
            }
        } catch (error) {
            console.warn('⚠️ Could not retrieve redirect URL:', error);
        }
        return null;
    }

    /**
     * Show authentication error to user
     */
    showAuthError(message) {
        // Check if there's an error container on the page
        const errorContainer = document.getElementById('auth-error-container');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div style="
                    background: #ff4444;
                    color: white;
                    padding: 16px;
                    border-radius: 8px;
                    margin: 16px;
                    text-align: center;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                ">
                    <strong>Authentication Error:</strong> ${message}
                    <br><br>
                    <button onclick="window.location.reload()" style="
                        background: white;
                        color: #ff4444;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Refresh Page</button>
                </div>
            `;
            errorContainer.style.display = 'block';
        } else {
            alert(message);
        }
    }

    /**
     * Logout user and redirect to home page
     */
    async logout() {
        try {
            console.log('🚪 AuthGuard: Logging out user...');
            
            if (typeof bvesterAPI !== 'undefined') {
                await bvesterAPI.logout();
            } else if (typeof firebase !== 'undefined' && firebase.auth) {
                await firebase.auth().signOut();
            }
            
            // Clear stored data
            this.currentUser = null;
            this.isInitialized = false;
            
            // Clear session storage
            try {
                sessionStorage.clear();
                localStorage.removeItem('bvester_user_data');
            } catch (error) {
                console.warn('⚠️ Could not clear storage:', error);
            }
            
            console.log('✅ AuthGuard: User logged out successfully');
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('❌ AuthGuard: Logout failed:', error);
            // Force redirect even if logout fails
            window.location.href = 'index.html';
        }
    }

    /**
     * Get current user information
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(permission) {
        if (!this.currentUser || !this.currentUser.bvesterData) {
            return false;
        }
        
        const userType = this.currentUser.bvesterData.userType;
        const kycStatus = this.currentUser.bvesterData.kycStatus;
        
        switch (permission) {
            case 'make_investment':
                return userType === 'investor' && kycStatus === 'verified';
            case 'create_campaign':
                return (userType === 'business' || userType === 'startup') && kycStatus === 'verified';
            case 'view_financials':
                return userType === 'investor' || userType === 'business';
            case 'admin_access':
                return userType === 'admin';
            default:
                return false;
        }
    }

    /**
     * Initialize on page load for protected routes
     */
    static async initForProtectedRoute(requiredUserType = null, requireEmailVerification = false) {
        // Create global auth guard instance
        if (!window.authGuard) {
            window.authGuard = new AuthGuard();
        }
        
        // Add auth error container to page if not present
        if (!document.getElementById('auth-error-container')) {
            const container = document.createElement('div');
            container.id = 'auth-error-container';
            container.style.display = 'none';
            document.body.insertBefore(container, document.body.firstChild);
        }
        
        // Check authentication
        const isAuthorized = await window.authGuard.requireAuth(requiredUserType, requireEmailVerification);
        
        return isAuthorized;
    }
}

// Global auth guard instance
window.AuthGuard = AuthGuard;

// Auto-initialize for protected pages
document.addEventListener('DOMContentLoaded', async () => {
    // Check if this is a protected route based on page name
    const currentPage = window.location.pathname.split('/').pop();
    const protectedRoutes = {
        'investor-dashboard.html': { userType: 'investor', requireEmailVerification: false },
        'startup-dashboard.html': { userType: ['business', 'startup'], requireEmailVerification: false },
        'portfolio-management.html': { userType: 'investor', requireEmailVerification: false },
        'business-analytics.html': { userType: ['business', 'startup'], requireEmailVerification: false },
        'investment-opportunities.html': { userType: null, requireEmailVerification: false },
        'financial-records.html': { userType: ['business', 'startup'], requireEmailVerification: false },
        'message-investors.html': { userType: ['business', 'startup'], requireEmailVerification: false }
    };
    
    if (protectedRoutes[currentPage]) {
        const route = protectedRoutes[currentPage];
        console.log(`🔒 Protected route detected: ${currentPage}`);
        
        try {
            const isAuthorized = await AuthGuard.initForProtectedRoute(
                route.userType, 
                route.requireEmailVerification
            );
            
            if (isAuthorized) {
                console.log('✅ User authorized for protected route');
                // Show page content
                document.body.style.visibility = 'visible';
            }
        } catch (error) {
            console.error('❌ Auth guard failed:', error);
            document.body.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: #000;
                    color: white;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    text-align: center;
                    padding: 20px;
                ">
                    <div>
                        <h1 style="color: #ffd700; margin-bottom: 16px;">Authentication Error</h1>
                        <p style="margin-bottom: 24px;">Unable to verify your access. Please try again.</p>
                        <button onclick="window.location.href='login.html'" style="
                            background: #ffd700;
                            color: #000;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            margin-right: 12px;
                        ">Login</button>
                        <button onclick="window.location.reload()" style="
                            background: transparent;
                            color: #ffd700;
                            border: 2px solid #ffd700;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                        ">Retry</button>
                    </div>
                </div>
            `;
        }
    } else {
        // Non-protected route, show content immediately
        document.body.style.visibility = 'visible';
    }
});