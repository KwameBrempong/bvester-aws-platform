/**
 * Bvester Production API Client
 * Handles all backend API communications with real functionality
 */

class BvesterAPI {
    constructor() {
        // Use production backend URL - update this when deployed
        this.baseURL = 'https://bvester-backend.vercel.app/api';
        this.localURL = 'http://localhost:3000/api';
        
        // Auto-detect if running locally or in production
        this.apiURL = window.location.hostname === 'localhost' ? this.localURL : this.baseURL;
        
        this.auth = null;
        this.currentUser = null;
        this.backendAvailable = false;
        this.useFirestoreOnly = true; // Default to Firestore-only mode for reliability
        this.isAuthInitialized = false;
        this.authInitializationPromise = null;
        
        // Performance optimizations
        this.requestCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.requestQueue = [];
        this.isProcessingQueue = false;
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000
        };
    }

    // =====================
    // PERFORMANCE OPTIMIZATION METHODS
    // =====================

    /**
     * Fetch with retry logic and exponential backoff
     */
    async fetchWithRetry(url, config, attempt = 1) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
            
            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
            
        } catch (error) {
            if (attempt < this.retryConfig.maxRetries && !error.name === 'AbortError') {
                const delay = Math.min(
                    this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
                    this.retryConfig.maxDelay
                );
                
                console.log(`🔄 Retry attempt ${attempt} for ${url} in ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithRetry(url, config, attempt + 1);
            }
            throw error;
        }
    }

    /**
     * Cache management for API responses
     */
    getFromCache(key) {
        const cached = this.requestCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        if (cached) {
            this.requestCache.delete(key);
        }
        return null;
    }

    setCache(key, data) {
        this.requestCache.set(key, {
            data: data,
            timestamp: Date.now()
        });
        
        // Clean old cache entries
        if (this.requestCache.size > 100) {
            const oldestKey = this.requestCache.keys().next().value;
            this.requestCache.delete(oldestKey);
        }
    }

    /**
     * Batch multiple requests for better performance
     */
    async batchRequests(requests) {
        if (!Array.isArray(requests)) {
            throw new Error('Requests must be an array');
        }
        
        const batchPromises = requests.map(({ endpoint, options }) => 
            this.makeRequest(endpoint, options).catch(error => ({ error }))
        );
        
        return Promise.all(batchPromises);
    }

    /**
     * Queue requests during high load
     */
    async queueRequest(endpoint, options) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ endpoint, options, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessingQueue || this.requestQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        
        while (this.requestQueue.length > 0) {
            const batch = this.requestQueue.splice(0, 5); // Process 5 at a time
            
            const promises = batch.map(async ({ endpoint, options, resolve, reject }) => {
                try {
                    const result = await this.makeRequest(endpoint, options);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
            
            await Promise.allSettled(promises);
            
            // Small delay between batches to prevent overwhelming
            if (this.requestQueue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        this.isProcessingQueue = false;
    }

    // =====================
    // UTILITY METHODS
    // =====================

    async makeRequest(endpoint, options = {}) {
        // Skip backend calls if using Firestore-only mode
        if (this.useFirestoreOnly) {
            console.warn(`⚠️ Backend unavailable, skipping API call to: ${endpoint}`);
            
            // For critical endpoints, try to provide Firestore fallbacks
            if (endpoint.includes('/businesses/') && endpoint.includes('/analytics')) {
                console.log('🛠️ Attempting Firestore fallback for business analytics...');
                const businessId = endpoint.split('/')[2];
                return await this.getBusinessAnalytics(businessId);
            }
            
            if (endpoint.includes('/businesses/') && endpoint.includes('/investors')) {
                console.log('🛠️ Attempting Firestore fallback for matched investors...');
                const businessId = endpoint.split('/')[2];
                return await this.getMatchedInvestors(businessId);
            }
            
            throw new Error('Backend service temporarily unavailable. Using offline mode.');
        }
        
        // Check cache for GET requests
        const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
        if (options.method === 'GET' || !options.method) {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log('📦 Serving from cache:', endpoint);
                return cached;
            }
        }

        const url = `${this.apiURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        if (this.auth?.currentUser) {
            try {
                const token = await this.auth.currentUser.getIdToken();
                config.headers['Authorization'] = `Bearer ${token}`;
            } catch (tokenError) {
                console.error('Failed to get auth token:', tokenError);
                // Continue without auth token for public endpoints
            }
        }

        // Enhanced mobile error handling
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        try {
            console.log(`🌐 Making API request to: ${url}`);
            console.log('📱 Request config:', {
                method: config.method || 'GET',
                headers: Object.keys(config.headers),
                isMobile: isMobile,
                hasAuth: !!config.headers['Authorization']
            });

            const response = await this.fetchWithRetry(url, config);
            
            console.log(`📡 Response status: ${response.status} ${response.statusText}`);
            
            // Handle different response types
            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.warn('Non-JSON response received:', text);
                data = { message: text };
            }

            if (!response.ok) {
                // Mark backend as unavailable on 404/500 errors
                if (response.status === 404 || response.status >= 500) {
                    this.backendAvailable = false;
                    console.warn('⚠️ Backend appears to be unavailable, switching to Firestore-only mode');
                }
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ API request successful');
            this.backendAvailable = true;
            
            // Cache successful GET responses
            if ((options.method === 'GET' || !options.method) && response.ok) {
                this.setCache(cacheKey, data);
            }
            
            return data;
        } catch (error) {
            console.error('❌ API Request Error:', {
                url: url,
                error: error.message,
                stack: error.stack,
                isMobile: isMobile,
                networkStatus: navigator.onLine ? 'online' : 'offline'
            });

            // Mark backend as unavailable on network errors
            this.backendAvailable = false;

            // Provide more specific error messages for mobile users
            if (!navigator.onLine) {
                throw new Error('No internet connection. Please check your network and try again.');
            }
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Backend service unavailable. Using offline mode.');
            }
            
            throw error;
        }
    }

    showLoading(element) {
        if (element) {
            element.disabled = true;
            element.innerHTML = '<span class="spinner"></span> Processing...';
        }
    }

    hideLoading(element, originalText) {
        if (element) {
            element.disabled = false;
            element.innerHTML = originalText;
        }
    }

    showError(message, containerId = 'error-container') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="icon-error">⚠️</i>
                    <span>${message}</span>
                </div>
            `;
            container.style.display = 'block';
        } else {
            alert(`Error: ${message}`);
        }
    }

    showSuccess(message, containerId = 'success-container') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="success-message">
                    <i class="icon-success">✅</i>
                    <span>${message}</span>
                </div>
            `;
            container.style.display = 'block';
        }
    }

    // =====================
    // AUTHENTICATION
    // =====================

    /**
     * Wait for Firebase SDK to be fully loaded
     */
    async waitForFirebaseLoaded() {
        const maxWaitTime = 10000; // 10 seconds
        const checkInterval = 100; // 100ms
        let elapsed = 0;

        return new Promise((resolve, reject) => {
            const checkFirebase = () => {
                // Check if Firebase is loaded and auth is available
                if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
                    console.log('✅ Firebase SDK fully loaded');
                    resolve();
                    return;
                }
                
                elapsed += checkInterval;
                if (elapsed >= maxWaitTime) {
                    reject(new Error('Firebase SDK failed to load within timeout'));
                    return;
                }
                
                setTimeout(checkFirebase, checkInterval);
            };
            
            checkFirebase();
        });
    }

    async initializeAuth() {
        try {
            console.log('🔐 Initializing Firebase Auth...');
            
            // Check if already initialized
            if (this.auth && this.isAuthInitialized) {
                console.log('✅ Auth already initialized, returning current state');
                return this.currentUser;
            }
            
            // Check if initialization is already in progress
            if (this.authInitializationPromise) {
                console.log('⏳ Auth initialization already in progress, waiting...');
                return await this.authInitializationPromise;
            }
            
            // Create initialization promise to prevent race conditions
            this.authInitializationPromise = this._performAuthInitialization();
            
            try {
                const result = await this.authInitializationPromise;
                return result;
            } finally {
                this.authInitializationPromise = null;
            }
        } catch (error) {
            console.error('❌ Firebase Auth initialization failed:', error);
            this.authInitializationPromise = null;
            throw new Error('Failed to initialize authentication service');
        }
    }

    async _performAuthInitialization() {
        try {
            // Wait for Firebase to be fully loaded
            await this.waitForFirebaseLoaded();
            
            // Initialize Firebase Auth with enhanced mobile support
            const auth = firebase.auth();
            this.auth = auth;

            // Configure auth settings for better mobile experience
            auth.settings.appVerificationDisabledForTesting = false;
            
            // Enhanced persistence settings for session management
            try {
                // Set persistence to LOCAL for long-term session management
                await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                console.log('✅ Auth persistence set to LOCAL');
                
                // Add custom session validation
                this.validateSession();
                
                // Set up session refresh timer
                this.setupSessionRefresh();
                
            } catch (persistenceError) {
                console.warn('⚠️ Could not set auth persistence:', persistenceError);
                // Fallback to session persistence if local fails
                try {
                    await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
                    console.log('✅ Auth persistence fallback to SESSION');
                } catch (fallbackError) {
                    console.error('❌ All persistence options failed:', fallbackError);
                }
            }

            return new Promise((resolve, reject) => {
                const unsubscribe = auth.onAuthStateChanged(async (user) => {
                    try {
                        console.log('👤 Auth state changed:', user ? 'LOGGED_IN' : 'LOGGED_OUT');
                        this.currentUser = user;
                        
                        if (user) {
                            console.log('🔍 Fetching user data from Firestore...');
                            try {
                                // Get user data from Firestore
                                const db = firebase.firestore();
                                const userDoc = await db.collection('users').doc(user.uid).get();
                                
                                if (userDoc.exists) {
                                    this.currentUser.bvesterData = userDoc.data();
                                    console.log('✅ User data loaded from Firestore');
                                } else {
                                    console.warn('⚠️ User document not found in Firestore');
                                    // Create basic user profile if missing
                                    const basicProfile = {
                                        uid: user.uid,
                                        email: user.email,
                                        userType: 'investor', // default
                                        status: 'active',
                                        createdAt: new Date().toISOString(),
                                        profileComplete: false
                                    };
                                    await db.collection('users').doc(user.uid).set(basicProfile);
                                    this.currentUser.bvesterData = basicProfile;
                                    console.log('✅ Created basic user profile');
                                }
                                
                                // Store session data after successful authentication
                                this.storeSessionData(this.currentUser);
                                
                            } catch (error) {
                                console.error('❌ Error fetching user data from Firestore:', error);
                                // Basic fallback data
                                this.currentUser.bvesterData = {
                                    uid: user.uid,
                                    email: user.email,
                                    userType: 'investor',
                                    status: 'active'
                                };
                                
                                // Store session data even with fallback
                                this.storeSessionData(this.currentUser);
                            }
                        }
                        
                        // Mark as initialized
                        this.isAuthInitialized = true;
                        
                        resolve(user);
                        unsubscribe(); // Clean up the listener after first auth state change
                    } catch (error) {
                        console.error('❌ Error in auth state change handler:', error);
                        this.isAuthInitialized = false;
                        reject(error);
                    }
                });

                // Add timeout for mobile networks
                setTimeout(() => {
                    console.warn('⚠️ Auth initialization timeout after 10 seconds');
                    this.isAuthInitialized = true; // Mark as initialized even on timeout
                    resolve(null); // Resolve with null user instead of rejecting
                    unsubscribe();
                }, 10000);
            });
        } catch (error) {
            this.isAuthInitialized = false;
            console.error('❌ Firebase Auth initialization failed:', error);
            throw new Error('Failed to initialize authentication service');
        }
    }

    async register(userData) {
        try {
            console.log('🔥 Starting real user registration...');
            
            // Ensure Firebase Auth is available
            if (!this.auth) {
                await this.initializeAuth();
            }
            
            // First, attempt to create the Firebase user directly
            // This will throw an error if the email already exists
            let userCredential;
            let user;
            
            try {
                userCredential = await this.auth.createUserWithEmailAndPassword(
                    userData.email, 
                    userData.password
                );
                user = userCredential.user;
                console.log('✅ Firebase user created:', user.uid);
            } catch (firebaseError) {
                console.log('❌ Firebase user creation failed:', firebaseError.code);
                
                // Handle Firebase Auth errors specifically
                if (firebaseError.code === 'auth/email-already-in-use') {
                    // Check if this is an existing user who should be redirected to login
                    console.log('🔍 Email already in use, checking if user should login...');
                    
                    try {
                        // Try to sign in with provided credentials to see if it's a valid account
                        const loginAttempt = await this.auth.signInWithEmailAndPassword(userData.email, userData.password);
                        
                        // If login succeeds, this user exists and has the right password
                        if (loginAttempt.user) {
                            console.log('✅ User exists and password is correct, redirecting to dashboard');
                            this.currentUser = loginAttempt.user;
                            
                            // Get user data from Firestore
                            const db = firebase.firestore();
                            const userDoc = await db.collection('users').doc(loginAttempt.user.uid).get();
                            
                            if (userDoc.exists) {
                                this.currentUser.bvesterData = userDoc.data();
                                this.storeSessionData(this.currentUser);
                                
                                return {
                                    success: true,
                                    data: userDoc.data(),
                                    message: 'Welcome back! Redirecting to your dashboard...',
                                    isExistingUser: true
                                };
                            }
                        }
                    } catch (loginError) {
                        console.log('❌ Login attempt failed:', loginError.code);
                        
                        // If login fails, the email exists but password is wrong
                        if (loginError.code === 'auth/wrong-password' || loginError.code === 'auth/invalid-credential') {
                            throw new Error('An account with this email already exists. Please sign in with your existing password, or use "Forgot Password" if you don\'t remember it.');
                        } else if (loginError.code === 'auth/user-not-found') {
                            // This is a rare case - Firebase Auth says email exists but user not found
                            throw new Error('There was an issue with your account. Please try signing in or contact support.');
                        } else {
                            // Other login errors
                            throw new Error('An account with this email already exists. Please sign in instead or use password reset if you forgot your password.');
                        }
                    }
                } else if (firebaseError.code === 'auth/weak-password') {
                    throw new Error('Password is too weak. Please choose a stronger password with at least 8 characters.');
                } else if (firebaseError.code === 'auth/invalid-email') {
                    throw new Error('Please enter a valid email address.');
                } else {
                    // Other Firebase errors
                    throw new Error(`Registration failed: ${firebaseError.message}`);
                }
            }

            // Update current user reference
            this.currentUser = user;

            // Create user profile in Firestore
            const userProfile = {
                uid: user.uid,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                userType: userData.userType,
                country: userData.country,
                phone: userData.phone,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'active',
                emailVerified: user.emailVerified,
                kycStatus: 'pending',
                profileComplete: true // Set to true since we have all required info
            };

            // Add type-specific fields
            if (userData.userType === 'startup') {
                userProfile.companyName = userData.companyName;
                userProfile.industry = userData.industry;
            } else if (userData.userType === 'investor') {
                userProfile.investorType = userData.investorType;
                userProfile.investmentRange = userData.investmentRange;
            }

            if (userData.newsletter) {
                userProfile.newsletterOptIn = true;
            }

            // Save to Firestore
            const db = firebase.firestore();
            await db.collection('users').doc(user.uid).set(userProfile);
            console.log('✅ User profile saved to Firestore');

            // Create type-specific profile
            if (userData.userType === 'investor') {
                const investorProfile = {
                    userId: user.uid,
                    investorType: userData.investorType || 'individual',
                    investmentRange: userData.investmentRange || '1k-10k',
                    portfolioValue: 0,
                    totalInvested: 0,
                    activeInvestments: 0,
                    riskTolerance: 'medium',
                    preferredIndustries: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                await db.collection('investors').doc(user.uid).set(investorProfile);
                console.log('✅ Investor profile created');

                // Create portfolio
                const portfolio = {
                    investorId: user.uid,
                    totalValue: 0,
                    totalInvested: 0,
                    totalReturns: 0,
                    returnPercentage: 0,
                    investments: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                await db.collection('portfolios').doc(user.uid).set(portfolio);
                console.log('✅ Portfolio created');

            } else if (userData.userType === 'startup') {
                const businessProfile = {
                    ownerId: user.uid,
                    businessName: userData.companyName || `${userData.firstName}'s Business`,
                    industry: userData.industry || 'other',
                    description: '',
                    fundingGoal: 0,
                    amountRaised: 0,
                    investorCount: 0,
                    status: {
                        isPublished: false,
                        isActive: true,
                        fundingStatus: 'planning'
                    },
                    metrics: {
                        monthlyRevenue: 0,
                        customerCount: 0,
                        employeeCount: 1,
                        monthlyGrowth: 0
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                await db.collection('businesses').doc(user.uid).set(businessProfile);
                console.log('✅ Business profile created');
            }

            // Store user data in current user for immediate access
            this.currentUser.bvesterData = userProfile;
            
            // Store session data for persistence
            this.storeSessionData(this.currentUser);

            // Log activity
            await this.logActivity('user_registered', {
                userType: userData.userType,
                email: userData.email,
                country: userData.country
            });

            return {
                success: true,
                data: userProfile,
                message: 'Account created successfully! Welcome to Bvester.',
                isExistingUser: false
            };

        } catch (error) {
            console.error('❌ Registration error:', error);
            throw error; // Re-throw the original error to preserve Firebase error codes
        }
    }

    async login(email, password) {
        try {
            console.log('🔐 Starting login process for:', email);
            
            // Ensure Firebase Auth is available
            if (!this.auth) {
                await this.initializeAuth();
            }
            
            // Attempt Firebase authentication
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('✅ Firebase authentication successful for user:', user.uid);
            
            // Update current user reference
            this.currentUser = user;
            
            // Fetch user data from Firestore
            const db = firebase.firestore();
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.currentUser.bvesterData = userData;
                console.log('✅ User data loaded from Firestore');
                
                // Store session data for persistence
                this.storeSessionData(this.currentUser);
                
                // Log successful login activity
                await this.logActivity('user_login', {
                    method: 'email_password',
                    timestamp: new Date().toISOString()
                });
                
                return {
                    success: true,
                    data: userData,
                    message: 'Login successful'
                };
            } else {
                console.warn('⚠️ User document not found in Firestore, creating basic profile');
                // Create basic user profile if missing
                const basicProfile = {
                    uid: user.uid,
                    email: user.email,
                    userType: 'investor', // default
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    profileComplete: false,
                    emailVerified: user.emailVerified
                };
                
                await db.collection('users').doc(user.uid).set(basicProfile);
                this.currentUser.bvesterData = basicProfile;
                
                // Store session data for persistence
                this.storeSessionData(this.currentUser);
                
                // Log successful login activity
                await this.logActivity('user_login', {
                    method: 'email_password',
                    newUser: true,
                    timestamp: new Date().toISOString()
                });
                
                return {
                    success: true,
                    data: basicProfile,
                    message: 'Login successful - Profile created'
                };
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            
            // Log failed login attempt
            try {
                await this.logActivity('login_failed', {
                    email: email,
                    error: error.code || error.message,
                    timestamp: new Date().toISOString()
                });
            } catch (logError) {
                console.warn('Failed to log login attempt:', logError);
            }
            
            // Re-throw with proper error handling
            throw error;
        }
    }

    async logout() {
        try {
            // Clear session timers
            if (this.sessionRefreshTimer) {
                clearInterval(this.sessionRefreshTimer);
            }
            
            // Clear stored session data
            this.clearSessionData();
            
            await this.auth.signOut();
            this.currentUser = null;
            return true;
        } catch (error) {
            throw new Error('Logout failed');
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email) {
        try {
            console.log('🔄 Sending password reset email to:', email);
            
            // Ensure Firebase Auth is available
            if (!this.auth) {
                await this.initializeAuth();
            }
            
            // First check if user exists in our system
            try {
                const userExists = await this.checkUserExists(email);
                if (!userExists) {
                    throw new Error('No account found with this email address. Please check your email or sign up for a new account.');
                }
            } catch (checkError) {
                console.warn('⚠️ Could not verify user existence, proceeding with reset request:', checkError.message);
                // Continue with password reset even if we can't check user existence
            }
            
            // Send reset email with custom action URL
            const actionCodeSettings = {
                url: window.location.origin + '/login.html?reset_success=true',
                handleCodeInApp: false
            };
            
            await this.auth.sendPasswordResetEmail(email, actionCodeSettings);
            
            console.log('✅ Password reset email sent successfully');
            
            // Log password reset request
            try {
                await this.logActivity('password_reset_requested', {
                    email: email,
                    timestamp: new Date().toISOString()
                });
            } catch (logError) {
                console.warn('Failed to log password reset request:', logError);
            }
            
            return {
                success: true,
                message: 'Password reset instructions sent to your email'
            };
            
        } catch (error) {
            console.error('❌ Password reset error:', error);
            
            if (error.message.includes('No account found')) {
                throw error; // Re-throw our custom error
            }
            
            // Handle Firebase errors
            let errorMessage = 'Failed to send reset instructions';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email address';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many reset attempts. Please wait before trying again';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your connection';
                    break;
            }
            
            throw new Error(errorMessage);
        }
    }

    // =====================
    // USER EXISTENCE CHECKS
    // =====================

    /**
     * Check if a user with the given email already exists
     * (Keep this method for password reset functionality)
     */
    async checkUserExists(email) {
        try {
            const db = firebase.firestore();
            
            // Check in users collection
            const usersQuery = await db.collection('users')
                .where('email', '==', email.toLowerCase())
                .limit(1)
                .get();
            
            if (!usersQuery.empty) {
                const userData = usersQuery.docs[0].data();
                console.log('👤 Found existing user in Firestore:', userData.uid);
                return userData;
            }
            
            return null;
        } catch (error) {
            console.error('❌ Error checking user existence:', error);
            throw error;
        }
    }

    // =====================
    // SESSION MANAGEMENT
    // =====================

    /**
     * Validate current session and user state
     */
    validateSession() {
        try {
            // Check if session data exists in localStorage
            const sessionData = localStorage.getItem('bvester_session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                const now = Date.now();
                
                // Check if session has expired (24 hours)
                if (now - session.timestamp > 24 * 60 * 60 * 1000) {
                    console.log('🕒 Session expired, clearing stored data');
                    this.clearSessionData();
                    return false;
                }
                
                console.log('✅ Session validated successfully');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Session validation failed:', error);
            this.clearSessionData();
        }
        return false;
    }

    /**
     * Store session data locally
     */
    storeSessionData(user) {
        try {
            const sessionData = {
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                userType: user.bvesterData?.userType,
                timestamp: Date.now()
            };
            
            localStorage.setItem('bvester_session', JSON.stringify(sessionData));
            console.log('💾 Session data stored successfully');
        } catch (error) {
            console.warn('⚠️ Could not store session data:', error);
        }
    }

    /**
     * Clear all session data
     */
    clearSessionData() {
        try {
            localStorage.removeItem('bvester_session');
            localStorage.removeItem('bvester_user_preferences');
            sessionStorage.clear();
            console.log('🧹 Session data cleared');
        } catch (error) {
            console.warn('⚠️ Could not clear session data:', error);
        }
    }

    /**
     * Set up automatic session refresh
     */
    setupSessionRefresh() {
        // Refresh every 30 minutes
        this.sessionRefreshTimer = setInterval(async () => {
            if (this.currentUser) {
                try {
                    // Force token refresh
                    await this.currentUser.getIdToken(true);
                    
                    // Update session timestamp
                    this.storeSessionData(this.currentUser);
                    
                    console.log('🔄 Session refreshed successfully');
                } catch (error) {
                    console.error('❌ Session refresh failed:', error);
                    // Session refresh failed, user might need to re-login
                    if (error.code === 'auth/network-request-failed') {
                        console.log('📶 Network issue, will retry session refresh later');
                    } else {
                        console.log('🚨 Authentication issue, user may need to re-login');
                        this.handleSessionExpired();
                    }
                }
            }
        }, 30 * 60 * 1000); // 30 minutes
    }

    /**
     * Handle expired session
     */
    handleSessionExpired() {
        this.clearSessionData();
        this.currentUser = null;
        
        // Redirect to login if on a protected page
        const currentPage = window.location.pathname.split('/').pop();
        const protectedPages = [
            'investor-dashboard.html',
            'startup-dashboard.html',
            'portfolio-management.html',
            'business-analytics.html',
            'investment-opportunities.html'
        ];
        
        if (protectedPages.includes(currentPage)) {
            console.log('🔄 Session expired on protected page, redirecting to login');
            window.location.href = 'login.html?session_expired=true';
        }
    }

    // =====================
    // KYC VERIFICATION
    // =====================

    async initiateKYC() {
        return await this.makeRequest('/kyc/initiate', {
            method: 'POST'
        });
    }

    async uploadKYCDocument(file, documentType) {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', documentType);

        return await this.makeRequest('/kyc/upload-document', {
            method: 'POST',
            headers: {}, // Remove Content-Type to let browser set boundary
            body: formData
        });
    }

    async getKYCStatus() {
        return await this.makeRequest('/kyc/status');
    }

    // =====================
    // INVESTMENT OPPORTUNITIES
    // =====================

    async getInvestmentOpportunities(filters = {}) {
        try {
            console.log('🌟 Loading investment opportunities from Firestore...');
            const db = firebase.firestore();
            
            // Build query based on filters
            let query = db.collection('opportunities')
                .where('timeline.status', '==', 'active');
            
            if (filters.featured) {
                query = query.where('featured', '==', true);
            }
            
            if (filters.industry) {
                query = query.where('industry', '==', filters.industry);
            }
            
            if (filters.limit) {
                query = query.limit(parseInt(filters.limit));
            }
            
            const snapshot = await query.get();
            const opportunities = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                opportunities.push({
                    id: doc.id,
                    businessName: data.businessName,
                    industry: data.industry,
                    description: data.description,
                    fundingGoal: data.funding.goalAmount,
                    amountRaised: data.funding.raisedAmount || 0,
                    investorsCount: data.funding.investorCount || 0,
                    minimumInvestment: data.funding.minimumInvestment,
                    expectedReturn: data.returns.expectedReturn,
                    riskLevel: data.risk.level,
                    location: data.location.city + ', ' + data.location.country,
                    featured: data.featured || false,
                    timeline: data.timeline,
                    createdAt: data.createdAt
                });
            });
            
            console.log(`✅ Loaded ${opportunities.length} opportunities from Firestore`);
            return {
                success: true,
                data: opportunities
            };
            
        } catch (error) {
            console.error('❌ Error loading opportunities:', error);
            throw error;
        }
    }

    async getOpportunityDetails(opportunityId) {
        try {
            // Try backend first if available
            if (this.backendAvailable && !this.useFirestoreOnly) {
                return await this.makeRequest(`/opportunities/${opportunityId}`);
            }
            
            // Fallback to Firestore
            console.log('🌟 Loading opportunity details from Firestore...');
            const db = firebase.firestore();
            const opportunityDoc = await db.collection('opportunities').doc(opportunityId).get();
            
            if (opportunityDoc.exists) {
                const data = opportunityDoc.data();
                return {
                    success: true,
                    data: {
                        id: opportunityDoc.id,
                        ...data
                    }
                };
            } else {
                throw new Error('Opportunity not found');
            }
        } catch (error) {
            console.error('❌ Error loading opportunity details:', error);
            throw error;
        }
    }

    async makeInvestment(investmentData) {
        try {
            // Try backend first if available
            if (this.backendAvailable && !this.useFirestoreOnly) {
                return await this.makeRequest('/investments/create', {
                    method: 'POST',
                    body: JSON.stringify(investmentData)
                });
            }
            
            // Fallback to Firestore implementation
            console.log('💰 Creating investment record in Firestore...');
            const db = firebase.firestore();
            
            const investment = {
                investorId: this.currentUser.uid,
                opportunityId: investmentData.opportunityId,
                amount: investmentData.amount,
                investmentType: investmentData.investmentType || 'equity',
                transaction: {
                    status: 'pending',
                    transactionId: 'TXN_' + Date.now(),
                    paymentMethod: investmentData.paymentMethod || 'pending',
                    currency: investmentData.currency || 'USD'
                },
                terms: {
                    expectedReturn: investmentData.expectedReturn || 0,
                    duration: investmentData.duration || 12,
                    minimumAmount: investmentData.minimumAmount || 0
                },
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const investmentRef = await db.collection('investments').add(investment);
            console.log('✅ Investment record created:', investmentRef.id);
            
            return {
                success: true,
                data: {
                    id: investmentRef.id,
                    ...investment
                },
                message: 'Investment created successfully. Payment processing required.'
            };
            
        } catch (error) {
            console.error('❌ Error creating investment:', error);
            throw error;
        }
    }

    // =====================
    // PORTFOLIO MANAGEMENT
    // =====================

    async getPortfolio() {
        try {
            console.log('📊 Loading portfolio from Firestore...');
            const db = firebase.firestore();
            
            // Get portfolio document
            const portfolioDoc = await db.collection('portfolios').doc(this.currentUser.uid).get();
            
            if (portfolioDoc.exists) {
                const portfolioData = portfolioDoc.data();
                
                // Get active investments
                const investmentsQuery = await db.collection('investments')
                    .where('investorId', '==', this.currentUser.uid)
                    .where('transaction.status', '==', 'completed')
                    .get();
                
                const investments = [];
                investmentsQuery.forEach(doc => {
                    investments.push({ id: doc.id, ...doc.data() });
                });
                
                portfolioData.investments = investments;
                portfolioData.activeInvestments = investments.length;
                
                // Calculate portfolio overview metrics
                portfolioData.overview = portfolioData.overview || {};
                portfolioData.overview.currentValue = portfolioData.totalValue || 0;
                portfolioData.overview.returnPercentage = portfolioData.returnPercentage || 0;
                portfolioData.overview.activeInvestments = investments.length;
                
                // Create recent investments array for dashboard display
                portfolioData.recentInvestments = investments.slice(0, 5).map(investment => ({
                    ...investment,
                    businessInfo: {
                        name: investment.businessName || `Investment ${investment.id.substring(0, 8)}`
                    },
                    performance: {
                        totalReturn: Math.random() * 20 - 5, // Mock return between -5% and 15%
                        currentValue: investment.amount * (1 + (Math.random() * 0.2 - 0.05)) // Mock current value
                    }
                }));
                
                console.log('✅ Portfolio loaded from Firestore');
                return {
                    success: true,
                    data: portfolioData
                };
            } else {
                // Create new portfolio if doesn't exist
                const newPortfolio = {
                    investorId: this.currentUser.uid,
                    totalValue: 0,
                    totalInvested: 0,
                    totalReturns: 0,
                    returnPercentage: 0,
                    investments: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                await db.collection('portfolios').doc(this.currentUser.uid).set(newPortfolio);
                console.log('✅ New portfolio created');
                
                return {
                    success: true,
                    data: newPortfolio
                };
            }
        } catch (error) {
            console.error('❌ Error loading portfolio:', error);
            throw error;
        }
    }

    async getPortfolioAnalytics() {
        return await this.makeRequest('/portfolio/analytics');
    }

    async getInvestmentHistory() {
        return await this.makeRequest('/investments/history');
    }

    // =====================
    // BUSINESS MANAGEMENT
    // =====================

    async createBusinessProfile(businessData) {
        return await this.makeRequest('/businesses/create', {
            method: 'POST',
            body: JSON.stringify(businessData)
        });
    }

    async updateBusinessProfile(businessId, updateData) {
        return await this.makeRequest(`/businesses/${businessId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }

    async getBusinessAnalytics(businessId) {
        try {
            console.log('🏢 Loading business analytics from Firestore...');
            const db = firebase.firestore();
            
            // Get business profile
            const businessDoc = await db.collection('businesses').doc(businessId).get();
            
            if (businessDoc.exists) {
                const businessData = businessDoc.data();
                
                // Get funding progress
                const fundingGoal = businessData.fundingGoal || businessData.investment?.currentRound?.targetAmount || 0;
                const amountRaised = businessData.amountRaised || businessData.investment?.currentRound?.raisedAmount || 0;
                const fundingProgress = fundingGoal > 0 ? (amountRaised / fundingGoal) * 100 : 0;
                
                const analytics = {
                    basicInfo: {
                        businessName: businessData.businessName || businessData.basicInfo?.businessName || 'Your Business',
                        industry: businessData.industry || businessData.basicInfo?.industry || 'Technology'
                    },
                    investment: {
                        currentRound: {
                            raisedAmount: amountRaised,
                            targetAmount: fundingGoal,
                            fundingStage: businessData.investment?.currentRound?.fundingStage || 'Seed',
                            investorCount: businessData.investorCount || businessData.investment?.currentRound?.investorCount || 0,
                            endDate: businessData.investment?.currentRound?.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
                        }
                    },
                    analytics: {
                        profileViews: businessData.analytics?.profileViews || 0,
                        investorInquiries: businessData.analytics?.investorInquiries || 0,
                        investmentScore: businessData.analytics?.investmentScore || 7.5,
                        followers: businessData.analytics?.followers || 0,
                        customerCount: businessData.analytics?.customerCount || businessData.metrics?.customerCount || 0,
                        customerGrowth: businessData.analytics?.customerGrowth || businessData.metrics?.monthlyGrowth || 0
                    },
                    financials: {
                        monthlyRevenue: businessData.financials?.monthlyRevenue || businessData.metrics?.monthlyRevenue || 0,
                        revenueGrowth: businessData.financials?.revenueGrowth || businessData.metrics?.monthlyGrowth || 0,
                        burnRate: businessData.financials?.burnRate || 0,
                        burnRateChange: businessData.financials?.burnRateChange || 0,
                        runway: businessData.financials?.runway || 12,
                        valuation: businessData.financials?.valuation || 0
                    },
                    status: businessData.status || {
                        isPublished: false,
                        isActive: true,
                        fundingStatus: 'planning'
                    },
                    createdAt: businessData.createdAt,
                    updatedAt: businessData.updatedAt
                };
                
                console.log('✅ Business analytics loaded from Firestore');
                return {
                    success: true,
                    data: analytics
                };
            } else {
                console.warn('⚠️ Business profile not found, will need to create default');
                return {
                    success: false,
                    error: 'Business profile not found',
                    data: null
                };
            }
            
        } catch (error) {
            console.error('❌ Error loading business analytics:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    async uploadFinancialRecords(businessId, file) {
        const formData = new FormData();
        formData.append('financials', file);

        return await this.makeRequest(`/businesses/${businessId}/financials`, {
            method: 'POST',
            headers: {},
            body: formData
        });
    }

    async getMatchedInvestors(businessId) {
        try {
            console.log('🤝 Loading matched investors from Firestore...');
            const db = firebase.firestore();
            
            // Get investment interests for this business
            const interestsQuery = await db.collection('investmentInterests')
                .where('businessOwnerId', '==', businessId)
                .orderBy('createdAt', 'desc')
                .limit(10) // Limit to prevent performance issues
                .get();
            
            const matchedInvestors = [];
            
            for (const doc of interestsQuery.docs) {
                const interestData = doc.data();
                
                try {
                    // Get investor details
                    const investorDoc = await db.collection('users').doc(interestData.investorId).get();
                    
                    if (investorDoc.exists) {
                        const investorData = investorDoc.data();
                        
                        matchedInvestors.push({
                            id: doc.id,
                            investorId: interestData.investorId,
                            investorInfo: {
                                name: `${investorData.firstName || 'Anonymous'} ${investorData.lastName || 'Investor'}`,
                                title: investorData.investorType || 'Individual Investor',
                                type: investorData.investorType || 'Individual'
                            },
                            potentialAmount: interestData.interestedAmount || 0,
                            interestLevel: interestData.status || 'Interested',
                            focusArea: interestData.focusArea || investorData.preferredIndustries?.[0] || 'General',
                            location: investorData.country || 'Location not specified',
                            experience: interestData.experience || 'Investment experience not specified',
                            status: interestData.status || 'interested',
                            contactDate: interestData.createdAt,
                            email: investorData.email
                        });
                    }
                } catch (investorError) {
                    console.warn('⚠️ Failed to load investor details for:', interestData.investorId, investorError);
                    // Continue with other investors
                }
            }
            
            console.log(`✅ Loaded ${matchedInvestors.length} matched investors`);
            return {
                success: true,
                data: matchedInvestors
            };
            
        } catch (error) {
            console.error('❌ Error loading matched investors:', error);
            // Return empty array instead of throwing to prevent dashboard crashes
            return {
                success: true,
                data: [],
                warning: 'Could not load investor interests: ' + error.message
            };
        }
    }

    // =====================
    // PAYMENT PROCESSING
    // =====================

    async getWallet() {
        return await this.makeRequest('/payments/wallet');
    }

    async createPaymentIntent(amount, currency = 'USD') {
        return await this.makeRequest('/payments/create-payment-intent', {
            method: 'POST',
            body: JSON.stringify({ amount, currency })
        });
    }

    async processWithdrawal(withdrawalData) {
        return await this.makeRequest('/payments/withdraw', {
            method: 'POST',
            body: JSON.stringify(withdrawalData)
        });
    }

    async getPaymentHistory() {
        return await this.makeRequest('/payments/history');
    }

    // =====================
    // MESSAGING SYSTEM
    // =====================

    async sendMessage(recipientId, message, attachments = []) {
        return await this.makeRequest('/messages/send', {
            method: 'POST',
            body: JSON.stringify({
                recipientId,
                message,
                attachments
            })
        });
    }

    async getConversations() {
        return await this.makeRequest('/messages/conversations');
    }

    async getMessages(conversationId) {
        return await this.makeRequest(`/messages/conversations/${conversationId}`);
    }

    // =====================
    // ANALYTICS & REPORTING
    // =====================

    async getDashboardAnalytics() {
        return await this.makeRequest('/analytics/dashboard');
    }

    async getMarketInsights() {
        return await this.makeRequest('/analytics/market-insights');
    }


    // =====================
    // UTILITY FUNCTIONS
    // =====================

    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    calculateROI(initialInvestment, currentValue) {
        return ((currentValue - initialInvestment) / initialInvestment * 100).toFixed(2);
    }

    // =====================
    // ACTIVITY LOGGING
    // =====================

    async logActivity(action, details = {}) {
        try {
            if (!this.currentUser) {
                console.warn('⚠️ No user logged in, cannot log activity');
                return;
            }

            const db = firebase.firestore();
            const activityLog = {
                userId: this.currentUser.uid,
                action: action,
                details: details,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                platform: 'web'
            };

            await db.collection('activityLogs').add(activityLog);
            console.log(`📊 Activity logged: ${action}`);
        } catch (error) {
            console.warn('⚠️ Failed to log activity:', error);
            // Don't throw error as this shouldn't break the main flow
        }
    }
}

// =====================
// SAMPLE DATA SEEDING
// =====================

async function seedSampleData() {
    try {
        console.log('🌱 Seeding sample data to Firestore...');
        const db = firebase.firestore();
        
        // Check if opportunities already exist
        const opportunitiesSnapshot = await db.collection('opportunities').limit(1).get();
        if (!opportunitiesSnapshot.empty) {
            console.log('✅ Sample data already exists, skipping seeding');
            return;
        }
        
        // Sample investment opportunities
        const sampleOpportunities = [
            {
                businessName: "EcoAfrica Solar",
                industry: "renewable-energy",
                description: "Solar energy solutions for rural African communities",
                funding: {
                    goalAmount: 500000,
                    raisedAmount: 150000,
                    minimumInvestment: 1000,
                    investorCount: 25
                },
                returns: {
                    expectedReturn: 15,
                    projectedROI: 18,
                    paybackPeriod: 36
                },
                risk: {
                    level: "medium",
                    score: 6.5
                },
                location: {
                    city: "Lagos",
                    country: "Nigeria",
                    region: "West Africa"
                },
                timeline: {
                    status: "active",
                    fundingDeadline: "2025-12-31",
                    expectedLaunch: "2026-03-01"
                },
                featured: true,
                createdAt: new Date().toISOString()
            },
            {
                businessName: "AgriTech Kenya",
                industry: "agriculture",
                description: "Digital farming solutions for smallholder farmers",
                funding: {
                    goalAmount: 250000,
                    raisedAmount: 75000,
                    minimumInvestment: 500,
                    investorCount: 15
                },
                returns: {
                    expectedReturn: 22,
                    projectedROI: 25,
                    paybackPeriod: 24
                },
                risk: {
                    level: "medium-high",
                    score: 7.2
                },
                location: {
                    city: "Nairobi",
                    country: "Kenya",
                    region: "East Africa"
                },
                timeline: {
                    status: "active",
                    fundingDeadline: "2025-10-31",
                    expectedLaunch: "2026-01-15"
                },
                featured: true,
                createdAt: new Date().toISOString()
            },
            {
                businessName: "HealthTech Ghana",
                industry: "healthcare",
                description: "Telemedicine platform for rural healthcare access",
                funding: {
                    goalAmount: 300000,
                    raisedAmount: 120000,
                    minimumInvestment: 750,
                    investorCount: 32
                },
                returns: {
                    expectedReturn: 18,
                    projectedROI: 20,
                    paybackPeriod: 30
                },
                risk: {
                    level: "medium",
                    score: 6.8
                },
                location: {
                    city: "Accra",
                    country: "Ghana",
                    region: "West Africa"
                },
                timeline: {
                    status: "active",
                    fundingDeadline: "2025-11-30",
                    expectedLaunch: "2026-02-01"
                },
                featured: false,
                createdAt: new Date().toISOString()
            }
        ];
        
        // Add opportunities to Firestore
        for (const opportunity of sampleOpportunities) {
            await db.collection('opportunities').add(opportunity);
        }
        
        console.log('✅ Sample opportunities seeded successfully');
        
    } catch (error) {
        console.error('❌ Error seeding sample data:', error);
    }
}

// Add learning resources methods to BvesterAPI prototype
BvesterAPI.prototype.getLearningResources = async function(targetAudience = null) {
    try {
        const user = await this.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated');
        }

        const userType = user.bvesterData?.userType || 'investor';
        const audience = targetAudience || userType;
        
        // Try backend first
        if (this.backendAvailable) {
            try {
                const response = await this.apiRequest('/learning/resources', {
                    method: 'GET',
                    headers: {
                        'X-Target-Audience': audience
                    }
                });
                
                if (response.success) {
                    return response;
                }
            } catch (error) {
                console.warn('Backend learning resources failed, falling back to Firestore');
            }
        }

        // Fallback to Firestore
        const db = firebase.firestore();
        let query = db.collection('learningResources')
            .where('published', '==', true);
            
        // Filter by target audience
        query = query.where('targetAudience', 'in', [audience, 'both']);
        
        query = query.orderBy('createdAt', 'desc').limit(20);
        
        const snapshot = await query.get();
        const resources = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            resources.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || data.createdAt
            });
        });

        return {
            success: true,
            data: resources,
            count: resources.length
        };

    } catch (error) {
        console.error('Error fetching learning resources:', error);
        return {
            success: false,
            error: error.message,
            data: []
        };
    }
};

BvesterAPI.prototype.getLearningCategories = async function() {
    try {
        const user = await this.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated');
        }

        const userType = user.bvesterData?.userType || 'investor';
        
        // Define categories based on user type
        const investorCategories = [
            { id: 'fundamentals', name: 'Investment Fundamentals', description: 'Learn the basics of investing' },
            { id: 'african-markets', name: 'African Markets', description: 'Understanding African economies and markets' },
            { id: 'startup-evaluation', name: 'Startup Evaluation', description: 'How to evaluate startups and business models' },
            { id: 'legal-compliance', name: 'Legal & Compliance', description: 'Investment regulations and legal frameworks' },
            { id: 'investment-strategies', name: 'Investment Strategies', description: 'Advanced investment approaches' },
            { id: 'esg-impact', name: 'ESG & Impact Investing', description: 'Sustainable and impact investing' }
        ];

        const businessCategories = [
            { id: 'fundraising', name: 'Fundraising', description: 'Raise capital for your business' },
            { id: 'business-planning', name: 'Business Planning', description: 'Strategic planning and business models' },
            { id: 'financial-management', name: 'Financial Management', description: 'Managing business finances' },
            { id: 'marketing-sales', name: 'Marketing & Sales', description: 'Growing your customer base' },
            { id: 'operations', name: 'Operations', description: 'Operational excellence and efficiency' },
            { id: 'leadership', name: 'Leadership', description: 'Leadership and team management' }
        ];

        const categories = userType === 'investor' ? investorCategories : businessCategories;

        return {
            success: true,
            data: categories
        };

    } catch (error) {
        console.error('Error fetching learning categories:', error);
        return {
            success: false,
            error: error.message,
            data: []
        };
    }
};

BvesterAPI.prototype.trackResourceView = async function(resourceId) {
    try {
        const user = await this.getCurrentUser();
        if (!user) return;

        const db = firebase.firestore();
        
        // Increment view count
        await db.collection('learningResources').doc(resourceId).update({
            viewCount: firebase.firestore.FieldValue.increment(1)
        });

        // Track user view for analytics
        await db.collection('resourceViews').add({
            resourceId: resourceId,
            userId: user.uid,
            viewedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };

    } catch (error) {
        console.error('Error tracking resource view:', error);
        return { success: false, error: error.message };
    }
};

BvesterAPI.prototype.getUserSettings = async function() {
    try {
        const user = await this.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated');
        }

        const db = firebase.firestore();
        const settingsDoc = await db.collection('userSettings').doc(user.uid).get();
        
        if (settingsDoc.exists) {
            return {
                success: true,
                data: settingsDoc.data()
            };
        } else {
            // Return default settings
            const defaultSettings = {
                notifications: {
                    email: true,
                    push: true,
                    investments: true,
                    opportunities: true
                },
                privacy: {
                    profileVisible: false,
                    activityVisible: false,
                    twoFactor: false
                },
                preferences: {
                    language: 'en',
                    currency: 'USD',
                    timezone: 'UTC',
                    darkMode: true
                },
                data: {
                    sync: true,
                    analytics: true
                }
            };
            
            return {
                success: true,
                data: defaultSettings
            };
        }

    } catch (error) {
        console.error('Error fetching user settings:', error);
        return {
            success: false,
            error: error.message,
            data: null
        };
    }
};

BvesterAPI.prototype.updateUserSettings = async function(settings) {
    try {
        const user = await this.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated');
        }

        const db = firebase.firestore();
        await db.collection('userSettings').doc(user.uid).set({
            ...settings,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return {
            success: true,
            message: 'Settings updated successfully'
        };

    } catch (error) {
        console.error('Error updating user settings:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

BvesterAPI.prototype.getMessages = async function() {
    try {
        const user = await this.getCurrentUser();
        if (!user) {
            throw new Error('User must be authenticated');
        }

        const db = firebase.firestore();
        const messagesQuery = await db.collection('messages')
            .where('participants', 'array-contains', user.uid)
            .orderBy('updatedAt', 'desc')
            .limit(20)
            .get();

        const messages = [];
        messagesQuery.forEach(doc => {
            const data = doc.data();
            messages.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
            });
        });

        return {
            success: true,
            data: messages,
            count: messages.length
        };

    } catch (error) {
        console.error('Error fetching messages:', error);
        return {
            success: false,
            error: error.message,
            data: []
        };
    }
};

// Initialize global API client
const bvesterAPI = new BvesterAPI();

// Auto-initialize Firebase Auth when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await bvesterAPI.initializeAuth();
        console.log('Bvester API client initialized successfully');
        
        // Seed sample data if needed
        await seedSampleData();
    } catch (error) {
        console.error('Failed to initialize Bvester API:', error);
    }
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BvesterAPI;
}