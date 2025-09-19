/**
 * Bvester Social Features System
 * Comprehensive social networking functionality for investment platform
 */

const EventEmitter = require('events');

class BvesterSocialSystem extends EventEmitter {
    constructor() {
        super();
        
        // Data stores (in production, these would be database collections)
        this.users = new Map();
        this.businesses = new Map();
        this.posts = new Map();
        this.interactions = new Map();
        this.notifications = new Map();
        this.groups = new Map();
        this.discussions = new Map();
        this.directMessages = new Map();
        this.engagementScores = new Map();
        this.achievements = new Map();
        this.viralMoments = new Map();
        this.mentorships = new Map();
        this.qaSessions = new Map();
        
        // Initialize with mock data
        this.initializeMockData();
        
        // Set up event listeners for viral mechanics
        this.setupViralMechanics();
    }

    // ==================== ACTIVITY FEED SYSTEM ====================

    /**
     * Create a new activity post
     */
    createPost(authorId, type, content, metadata = {}) {
        const postId = this.generateId();
        const timestamp = new Date().toISOString();
        
        const post = {
            id: postId,
            authorId,
            type, // 'investment', 'milestone', 'achievement', 'business_update', 'community'
            content,
            metadata,
            timestamp,
            likes: 0,
            comments: [],
            shares: 0,
            visibility: metadata.visibility || 'public',
            viralScore: 0
        };
        
        this.posts.set(postId, post);
        
        // Update engagement scores
        this.updateEngagementScore(authorId, 'post_created', 10);
        
        // Check for viral potential
        this.checkViralPotential(post);
        
        // Emit event for notifications
        this.emit('postCreated', post);
        
        return post;
    }

    /**
     * Get activity feed for a user
     */
    getActivityFeed(userId, page = 1, limit = 20) {
        const user = this.users.get(userId);
        if (!user) throw new Error('User not found');
        
        // Get posts from followed users and businesses
        const followingIds = [...user.following, ...user.followingBusinesses];
        const relevantPosts = Array.from(this.posts.values())
            .filter(post => {
                return followingIds.includes(post.authorId) || 
                       post.visibility === 'public' ||
                       post.authorId === userId;
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Apply pagination
        const startIndex = (page - 1) * limit;
        const paginatedPosts = relevantPosts.slice(startIndex, startIndex + limit);
        
        return {
            posts: paginatedPosts,
            totalCount: relevantPosts.length,
            hasMore: relevantPosts.length > startIndex + limit
        };
    }

    /**
     * Create specific activity types
     */
    createInvestmentActivity(userId, businessId, amount, metadata = {}) {
        const business = this.businesses.get(businessId);
        return this.createPost(userId, 'investment', 
            `Invested $${amount.toLocaleString()} in ${business?.name || 'a business'}`, {
                businessId,
                amount,
                investmentType: metadata.investmentType || 'equity',
                ...metadata
            });
    }

    createMilestoneActivity(entityId, milestone, description, metadata = {}) {
        return this.createPost(entityId, 'milestone', description, {
            milestone,
            value: metadata.value,
            ...metadata
        });
    }

    createBusinessUpdate(businessId, title, content, metadata = {}) {
        return this.createPost(businessId, 'business_update', content, {
            title,
            updateType: metadata.updateType || 'general',
            ...metadata
        });
    }

    // ==================== SOCIAL INTERACTIONS ====================

    /**
     * Like/celebrate a post
     */
    likePost(postId, userId, reactionType = 'like') {
        const post = this.posts.get(postId);
        if (!post) throw new Error('Post not found');
        
        const interactionId = `${postId}_${userId}_like`;
        
        if (this.interactions.has(interactionId)) {
            // Unlike
            this.interactions.delete(interactionId);
            post.likes = Math.max(0, post.likes - 1);
        } else {
            // Like
            this.interactions.set(interactionId, {
                id: interactionId,
                postId,
                userId,
                type: reactionType,
                timestamp: new Date().toISOString()
            });
            post.likes += 1;
            
            // Update engagement scores
            this.updateEngagementScore(userId, 'post_liked', 2);
            this.updateEngagementScore(post.authorId, 'post_received_like', 5);
            
            // Create notification
            this.createNotification(post.authorId, 'like', 
                `${this.getUserName(userId)} liked your post`, {
                    postId,
                    userId,
                    reactionType
                });
        }
        
        this.posts.set(postId, post);
        return post;
    }

    /**
     * Comment on a post
     */
    commentOnPost(postId, userId, content, parentCommentId = null) {
        const post = this.posts.get(postId);
        if (!post) throw new Error('Post not found');
        
        const commentId = this.generateId();
        const comment = {
            id: commentId,
            userId,
            content,
            timestamp: new Date().toISOString(),
            parentCommentId,
            likes: 0,
            replies: []
        };
        
        if (parentCommentId) {
            const parentComment = post.comments.find(c => c.id === parentCommentId);
            if (parentComment) {
                parentComment.replies.push(comment);
            }
        } else {
            post.comments.push(comment);
        }
        
        // Update engagement scores
        this.updateEngagementScore(userId, 'comment_created', 5);
        this.updateEngagementScore(post.authorId, 'post_received_comment', 8);
        
        // Create notification
        this.createNotification(post.authorId, 'comment', 
            `${this.getUserName(userId)} commented on your post`, {
                postId,
                userId,
                commentId
            });
        
        this.posts.set(postId, post);
        return comment;
    }

    /**
     * Share a post
     */
    sharePost(postId, userId, message = '') {
        const originalPost = this.posts.get(postId);
        if (!originalPost) throw new Error('Post not found');
        
        const sharePost = this.createPost(userId, 'share', message, {
            originalPostId: postId,
            originalAuthorId: originalPost.authorId
        });
        
        originalPost.shares += 1;
        this.posts.set(postId, originalPost);
        
        // Update engagement scores
        this.updateEngagementScore(userId, 'post_shared', 8);
        this.updateEngagementScore(originalPost.authorId, 'post_received_share', 15);
        
        // Create notification
        this.createNotification(originalPost.authorId, 'share', 
            `${this.getUserName(userId)} shared your post`, {
                postId,
                userId,
                sharePostId: sharePost.id
            });
        
        return sharePost;
    }

    /**
     * Follow a user or business
     */
    follow(followerId, targetId, targetType = 'user') {
        const follower = this.users.get(followerId);
        if (!follower) throw new Error('Follower not found');
        
        if (targetType === 'user') {
            if (!follower.following.includes(targetId)) {
                follower.following.push(targetId);
                
                const target = this.users.get(targetId);
                if (target) {
                    target.followers.push(followerId);
                    this.users.set(targetId, target);
                }
            }
        } else if (targetType === 'business') {
            if (!follower.followingBusinesses.includes(targetId)) {
                follower.followingBusinesses.push(targetId);
                
                const business = this.businesses.get(targetId);
                if (business) {
                    business.followers.push(followerId);
                    this.businesses.set(targetId, business);
                }
            }
        }
        
        this.users.set(followerId, follower);
        
        // Update engagement scores
        this.updateEngagementScore(followerId, 'followed_someone', 3);
        this.updateEngagementScore(targetId, 'gained_follower', 10);
        
        // Create notification
        this.createNotification(targetId, 'follow', 
            `${this.getUserName(followerId)} started following you`, {
                followerId
            });
        
        return true;
    }

    // ==================== DIRECT MESSAGING ====================

    /**
     * Send a direct message
     */
    sendDirectMessage(senderId, recipientId, content, metadata = {}) {
        const messageId = this.generateId();
        const conversationId = this.getConversationId(senderId, recipientId);
        
        const message = {
            id: messageId,
            conversationId,
            senderId,
            recipientId,
            content,
            timestamp: new Date().toISOString(),
            read: false,
            metadata
        };
        
        if (!this.directMessages.has(conversationId)) {
            this.directMessages.set(conversationId, []);
        }
        
        this.directMessages.get(conversationId).push(message);
        
        // Create notification
        this.createNotification(recipientId, 'message', 
            `${this.getUserName(senderId)} sent you a message`, {
                senderId,
                messageId
            });
        
        return message;
    }

    /**
     * Get conversation messages
     */
    getConversation(userId, otherId, limit = 50) {
        const conversationId = this.getConversationId(userId, otherId);
        const messages = this.directMessages.get(conversationId) || [];
        
        return messages
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    // ==================== COMMUNITY FEATURES ====================

    /**
     * Create an investment club/group
     */
    createGroup(creatorId, name, description, type = 'investment_club', settings = {}) {
        const groupId = this.generateId();
        
        const group = {
            id: groupId,
            name,
            description,
            type, // 'investment_club', 'discussion_forum', 'mentorship'
            creatorId,
            members: [creatorId],
            admins: [creatorId],
            settings: {
                privacy: 'public', // 'public', 'private', 'invite_only'
                allowInvites: true,
                requireApproval: false,
                ...settings
            },
            createdAt: new Date().toISOString(),
            stats: {
                totalInvestments: 0,
                totalMembers: 1,
                totalDiscussions: 0
            }
        };
        
        this.groups.set(groupId, group);
        
        // Update user's groups
        const user = this.users.get(creatorId);
        if (user) {
            user.groups.push(groupId);
            this.users.set(creatorId, user);
        }
        
        return group;
    }

    /**
     * Join a group
     */
    joinGroup(userId, groupId) {
        const group = this.groups.get(groupId);
        const user = this.users.get(userId);
        
        if (!group || !user) throw new Error('Group or user not found');
        
        if (!group.members.includes(userId)) {
            group.members.push(userId);
            group.stats.totalMembers += 1;
            this.groups.set(groupId, group);
            
            user.groups.push(groupId);
            this.users.set(userId, user);
            
            // Update engagement score
            this.updateEngagementScore(userId, 'joined_group', 15);
        }
        
        return group;
    }

    /**
     * Create a discussion in a group
     */
    createDiscussion(groupId, userId, title, content, tags = []) {
        const discussionId = this.generateId();
        const group = this.groups.get(groupId);
        
        if (!group) throw new Error('Group not found');
        if (!group.members.includes(userId)) throw new Error('User not a member');
        
        const discussion = {
            id: discussionId,
            groupId,
            userId,
            title,
            content,
            tags,
            timestamp: new Date().toISOString(),
            replies: [],
            upvotes: 0,
            downvotes: 0,
            views: 0,
            pinned: false
        };
        
        this.discussions.set(discussionId, discussion);
        
        // Update group stats
        group.stats.totalDiscussions += 1;
        this.groups.set(groupId, group);
        
        // Update engagement score
        this.updateEngagementScore(userId, 'created_discussion', 20);
        
        return discussion;
    }

    /**
     * Share a success story
     */
    shareSuccessStory(userId, title, story, metrics = {}, businessId = null) {
        return this.createPost(userId, 'success_story', story, {
            title,
            metrics, // e.g., { roi: 150, timeframe: '18 months', initialInvestment: 50000 }
            businessId,
            verified: false // Would be verified by admins
        });
    }

    /**
     * Create mentorship matching
     */
    createMentorshipOffer(mentorId, expertise, availability, requirements = {}) {
        const offerID = this.generateId();
        
        const offer = {
            id: offerID,
            mentorId,
            expertise, // Array of skills/areas
            availability,
            requirements,
            status: 'active',
            matches: [],
            createdAt: new Date().toISOString()
        };
        
        this.mentorships.set(offerID, offer);
        
        return offer;
    }

    /**
     * Request mentorship
     */
    requestMentorship(menteeId, mentorOfferId, message, goals = []) {
        const offer = this.mentorships.get(mentorOfferId);
        if (!offer) throw new Error('Mentorship offer not found');
        
        const requestId = this.generateId();
        const request = {
            id: requestId,
            menteeId,
            mentorOfferId,
            message,
            goals,
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        
        offer.matches.push(request);
        this.mentorships.set(mentorOfferId, offer);
        
        // Create notification for mentor
        this.createNotification(offer.mentorId, 'mentorship_request', 
            `${this.getUserName(menteeId)} requested mentorship`, {
                menteeId,
                requestId
            });
        
        return request;
    }

    /**
     * Create Q&A session
     */
    createQASession(hostId, title, description, scheduledTime, topics = []) {
        const sessionId = this.generateId();
        
        const session = {
            id: sessionId,
            hostId,
            title,
            description,
            scheduledTime,
            topics,
            status: 'scheduled', // 'scheduled', 'live', 'ended'
            participants: [],
            questions: [],
            createdAt: new Date().toISOString()
        };
        
        this.qaSession.set(sessionId, session);
        
        return session;
    }

    // ==================== VIRAL MECHANICS ====================

    /**
     * Check if content has viral potential
     */
    checkViralPotential(post) {
        const viralThresholds = {
            likes: 50,
            shares: 10,
            comments: 20,
            timeframe: 3600000 // 1 hour in milliseconds
        };
        
        const postAge = Date.now() - new Date(post.timestamp).getTime();
        
        if (postAge <= viralThresholds.timeframe) {
            const viralScore = (post.likes * 1) + (post.shares * 5) + (post.comments.length * 3);
            post.viralScore = viralScore;
            
            if (viralScore >= 100) {
                this.createViralMoment(post);
            }
        }
    }

    /**
     * Create a viral moment
     */
    createViralMoment(post) {
        const momentId = this.generateId();
        
        const viralMoment = {
            id: momentId,
            postId: post.id,
            authorId: post.authorId,
            type: this.detectViralType(post),
            metrics: {
                likes: post.likes,
                shares: post.shares,
                comments: post.comments.length,
                viralScore: post.viralScore
            },
            timestamp: new Date().toISOString(),
            broadcasted: false
        };
        
        this.viralMoments.set(momentId, viralMoment);
        
        // Broadcast to all users
        this.broadcastViralMoment(viralMoment);
        
        // Reward the author
        this.updateEngagementScore(post.authorId, 'viral_moment', 500);
        
        return viralMoment;
    }

    /**
     * Detect type of viral content
     */
    detectViralType(post) {
        if (post.type === 'milestone' && post.metadata?.value >= 1000000) {
            return 'first_million';
        }
        if (post.type === 'investment' && post.metadata?.amount >= 100000) {
            return 'major_investment';
        }
        if (post.type === 'business_update' && post.metadata?.updateType === 'funding_complete') {
            return 'funding_success';
        }
        return 'community_highlight';
    }

    /**
     * Broadcast viral moment to community
     */
    broadcastViralMoment(viralMoment) {
        const broadcastMessage = this.generateViralMessage(viralMoment);
        
        // Create notification for all users
        Array.from(this.users.keys()).forEach(userId => {
            if (userId !== viralMoment.authorId) {
                this.createNotification(userId, 'viral_moment', broadcastMessage, {
                    viralMomentId: viralMoment.id,
                    postId: viralMoment.postId
                });
            }
        });
        
        viralMoment.broadcasted = true;
        this.viralMoments.set(viralMoment.id, viralMoment);
    }

    /**
     * Generate viral moment message
     */
    generateViralMessage(viralMoment) {
        const authorName = this.getUserName(viralMoment.authorId);
        
        switch (viralMoment.type) {
            case 'first_million':
                return `${authorName} just hit their first million! Join the celebration!`;
            case 'major_investment':
                return `${authorName} made a game-changing investment! See what caught their attention.`;
            case 'funding_success':
                return `Another success story! ${authorName}'s business just completed funding.`;
            default:
                return `${authorName} is trending in the community! Check out what everyone's talking about.`;
        }
    }

    /**
     * Implement share-to-unlock features
     */
    shareToUnlock(userId, postId, feature) {
        const post = this.posts.get(postId);
        if (!post) throw new Error('Post not found');
        
        const user = this.users.get(userId);
        if (!user) throw new Error('User not found');
        
        // Check if already shared
        const shareKey = `${postId}_${userId}_unlock`;
        if (this.interactions.has(shareKey)) {
            return { unlocked: true, feature };
        }
        
        // Record the share-to-unlock action
        this.interactions.set(shareKey, {
            type: 'share_to_unlock',
            userId,
            postId,
            feature,
            timestamp: new Date().toISOString()
        });
        
        // Actually share the post
        this.sharePost(postId, userId, `Shared to unlock: ${feature}`);
        
        return { unlocked: true, feature };
    }

    /**
     * Create FOMO triggers
     */
    createFOMOTrigger(type, data) {
        const fomoTypes = {
            'limited_spots': (data) => `Only ${data.spotsLeft} spots left in ${data.opportunityName}!`,
            'trending_investment': (data) => `${data.businessName} is trending! ${data.investorCount} investors joined today.`,
            'time_sensitive': (data) => `${data.offerName} ends in ${data.timeLeft}!`,
            'social_proof': (data) => `${data.count} community members are interested in this opportunity.`
        };
        
        const message = fomoTypes[type](data);
        
        // Send to relevant users
        this.broadcastFOMO(message, data.targetUsers || []);
        
        return { type, message, data };
    }

    // ==================== ENGAGEMENT SCORING ====================

    /**
     * Update user engagement score
     */
    updateEngagementScore(userId, action, points) {
        if (!this.engagementScores.has(userId)) {
            this.engagementScores.set(userId, {
                totalScore: 0,
                level: 1,
                actions: {},
                achievements: [],
                weeklyScore: 0,
                monthlyScore: 0,
                lastActivity: new Date().toISOString()
            });
        }
        
        const score = this.engagementScores.get(userId);
        score.totalScore += points;
        score.actions[action] = (score.actions[action] || 0) + 1;
        score.lastActivity = new Date().toISOString();
        
        // Update weekly/monthly scores (simplified)
        score.weeklyScore += points;
        score.monthlyScore += points;
        
        // Check for level up
        const newLevel = Math.floor(score.totalScore / 1000) + 1;
        if (newLevel > score.level) {
            score.level = newLevel;
            this.createAchievementNotification(userId, `Level ${newLevel} Reached!`, 
                `You've reached level ${newLevel} in the community!`);
        }
        
        this.engagementScores.set(userId, score);
        
        // Check for achievements
        this.checkAchievements(userId, action);
    }

    /**
     * Get engagement leaderboard
     */
    getEngagementLeaderboard(type = 'total', limit = 50) {
        const scores = Array.from(this.engagementScores.entries())
            .map(([userId, score]) => ({
                userId,
                userName: this.getUserName(userId),
                score: type === 'weekly' ? score.weeklyScore : 
                       type === 'monthly' ? score.monthlyScore : 
                       score.totalScore,
                level: score.level
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        
        return scores;
    }

    /**
     * Calculate influence score
     */
    calculateInfluenceScore(userId) {
        const user = this.users.get(userId);
        const engagement = this.engagementScores.get(userId);
        
        if (!user || !engagement) return 0;
        
        const followerCount = user.followers.length;
        const engagementScore = engagement.totalScore;
        const postCount = Array.from(this.posts.values())
            .filter(post => post.authorId === userId).length;
        
        const avgLikes = Array.from(this.posts.values())
            .filter(post => post.authorId === userId)
            .reduce((sum, post) => sum + post.likes, 0) / Math.max(postCount, 1);
        
        return Math.round(
            (followerCount * 10) + 
            (engagementScore * 0.5) + 
            (avgLikes * 20) + 
            (postCount * 5)
        );
    }

    /**
     * Check and award achievements
     */
    checkAchievements(userId, action) {
        const achievements = [
            {
                id: 'first_investment',
                name: 'First Investment',
                description: 'Made your first investment',
                condition: (userId, action) => action === 'post_created' && 
                    Array.from(this.posts.values()).some(p => 
                        p.authorId === userId && p.type === 'investment'),
                reward: 100
            },
            {
                id: 'social_butterfly',
                name: 'Social Butterfly',
                description: 'Liked 50 posts',
                condition: (userId, action) => {
                    const score = this.engagementScores.get(userId);
                    return score?.actions['post_liked'] >= 50;
                },
                reward: 200
            },
            {
                id: 'mentor',
                name: 'Mentor',
                description: 'Helped 5 community members',
                condition: (userId, action) => {
                    return Array.from(this.mentorships.values())
                        .filter(m => m.mentorId === userId).length >= 5;
                },
                reward: 500
            }
        ];
        
        achievements.forEach(achievement => {
            if (achievement.condition(userId, action)) {
                this.awardAchievement(userId, achievement);
            }
        });
    }

    /**
     * Award achievement to user
     */
    awardAchievement(userId, achievement) {
        const userAchievements = this.achievements.get(userId) || [];
        
        if (!userAchievements.some(a => a.id === achievement.id)) {
            const awardedAchievement = {
                ...achievement,
                awardedAt: new Date().toISOString()
            };
            
            userAchievements.push(awardedAchievement);
            this.achievements.set(userId, userAchievements);
            
            // Update engagement score
            this.updateEngagementScore(userId, 'achievement_earned', achievement.reward);
            
            // Create notification
            this.createAchievementNotification(userId, achievement.name, achievement.description);
        }
    }

    // ==================== NOTIFICATIONS ====================

    /**
     * Create a notification
     */
    createNotification(userId, type, message, metadata = {}) {
        const notificationId = this.generateId();
        
        const notification = {
            id: notificationId,
            userId,
            type,
            message,
            metadata,
            timestamp: new Date().toISOString(),
            read: false,
            priority: metadata.priority || 'normal'
        };
        
        if (!this.notifications.has(userId)) {
            this.notifications.set(userId, []);
        }
        
        this.notifications.get(userId).push(notification);
        
        // Emit for real-time updates
        this.emit('notification', notification);
        
        return notification;
    }

    /**
     * Create achievement notification
     */
    createAchievementNotification(userId, title, description) {
        return this.createNotification(userId, 'achievement', 
            `Achievement Unlocked: ${title}`, {
                title,
                description,
                priority: 'high'
            });
    }

    /**
     * Get user notifications
     */
    getNotifications(userId, unreadOnly = false, limit = 50) {
        const userNotifications = this.notifications.get(userId) || [];
        
        let filtered = unreadOnly ? 
            userNotifications.filter(n => !n.read) : 
            userNotifications;
        
        return filtered
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    /**
     * Mark notification as read
     */
    markNotificationRead(userId, notificationId) {
        const userNotifications = this.notifications.get(userId) || [];
        const notification = userNotifications.find(n => n.id === notificationId);
        
        if (notification) {
            notification.read = true;
            this.notifications.set(userId, userNotifications);
        }
        
        return notification;
    }

    // ==================== HELPER FUNCTIONS ====================

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getUserName(userId) {
        const user = this.users.get(userId);
        return user ? user.name : `User ${userId}`;
    }

    getConversationId(userId1, userId2) {
        return [userId1, userId2].sort().join('_');
    }

    setupViralMechanics() {
        // Listen for post interactions and check viral potential
        this.on('postCreated', (post) => {
            setTimeout(() => this.checkViralPotential(post), 60000); // Check after 1 minute
        });
    }

    broadcastFOMO(message, targetUsers) {
        targetUsers.forEach(userId => {
            this.createNotification(userId, 'fomo', message, {
                priority: 'high',
                category: 'opportunity'
            });
        });
    }

    // ==================== MOCK DATA INITIALIZATION ====================

    initializeMockData() {
        // Create mock users
        const mockUsers = [
            {
                id: 'user1',
                name: 'Alex Johnson',
                email: 'alex@example.com',
                type: 'investor',
                followers: [],
                following: [],
                followingBusinesses: [],
                groups: [],
                investmentHistory: []
            },
            {
                id: 'user2',
                name: 'Sarah Chen',
                email: 'sarah@example.com',
                type: 'entrepreneur',
                followers: [],
                following: [],
                followingBusinesses: [],
                groups: [],
                investmentHistory: []
            },
            {
                id: 'user3',
                name: 'Michael Brown',
                email: 'michael@example.com',
                type: 'investor',
                followers: [],
                following: [],
                followingBusinesses: [],
                groups: [],
                investmentHistory: []
            }
        ];

        mockUsers.forEach(user => {
            this.users.set(user.id, user);
            this.engagementScores.set(user.id, {
                totalScore: Math.floor(Math.random() * 1000),
                level: 1,
                actions: {},
                achievements: [],
                weeklyScore: 0,
                monthlyScore: 0,
                lastActivity: new Date().toISOString()
            });
        });

        // Create mock businesses
        const mockBusinesses = [
            {
                id: 'biz1',
                name: 'TechStart Inc.',
                description: 'Innovative AI solutions for small businesses',
                industry: 'Technology',
                founderId: 'user2',
                followers: [],
                fundingGoal: 500000,
                currentFunding: 250000
            },
            {
                id: 'biz2',
                name: 'GreenEnergy Co.',
                description: 'Sustainable energy solutions',
                industry: 'Energy',
                founderId: 'user3',
                followers: [],
                fundingGoal: 1000000,
                currentFunding: 750000
            }
        ];

        mockBusinesses.forEach(business => {
            this.businesses.set(business.id, business);
        });

        // Create mock posts
        this.createInvestmentActivity('user1', 'biz1', 50000);
        this.createBusinessUpdate('biz1', 'Milestone Reached', 
            'We just reached 50% of our funding goal!', {
                updateType: 'funding_progress'
            });
        this.createMilestoneActivity('biz2', '1M_funding', 
            'Reached $1M in funding!', { value: 1000000 });

        // Create mock investment club
        this.createGroup('user1', 'Tech Investors Club', 
            'For investors interested in technology startups', 'investment_club');

        console.log('Mock data initialized successfully');
    }

    // ==================== API METHODS ====================

    /**
     * Get comprehensive user stats
     */
    getUserStats(userId) {
        const user = this.users.get(userId);
        const engagement = this.engagementScores.get(userId);
        const achievements = this.achievements.get(userId) || [];
        
        if (!user) throw new Error('User not found');
        
        const userPosts = Array.from(this.posts.values())
            .filter(post => post.authorId === userId);
        
        return {
            profile: {
                id: user.id,
                name: user.name,
                type: user.type,
                followersCount: user.followers.length,
                followingCount: user.following.length + user.followingBusinesses.length
            },
            engagement: {
                level: engagement?.level || 1,
                totalScore: engagement?.totalScore || 0,
                influenceScore: this.calculateInfluenceScore(userId)
            },
            activity: {
                postsCount: userPosts.length,
                totalLikes: userPosts.reduce((sum, post) => sum + post.likes, 0),
                totalShares: userPosts.reduce((sum, post) => sum + post.shares, 0),
                totalComments: userPosts.reduce((sum, post) => sum + post.comments.length, 0)
            },
            achievements: achievements.length,
            groups: user.groups.length
        };
    }

    /**
     * Get trending content
     */
    getTrendingContent(timeframe = '24h', limit = 20) {
        const timeframMs = {
            '1h': 3600000,
            '24h': 86400000,
            '7d': 604800000
        };
        
        const cutoffTime = new Date(Date.now() - timeframMs[timeframe]);
        
        return Array.from(this.posts.values())
            .filter(post => new Date(post.timestamp) > cutoffTime)
            .sort((a, b) => (b.likes + b.shares * 2 + b.comments.length) - 
                           (a.likes + a.shares * 2 + a.comments.length))
            .slice(0, limit);
    }

    /**
     * Get platform analytics
     */
    getPlatformAnalytics() {
        const totalUsers = this.users.size;
        const totalBusinesses = this.businesses.size;
        const totalPosts = this.posts.size;
        const totalEngagement = Array.from(this.posts.values())
            .reduce((sum, post) => sum + post.likes + post.shares + post.comments.length, 0);
        
        return {
            users: {
                total: totalUsers,
                active: Array.from(this.engagementScores.values())
                    .filter(score => 
                        new Date() - new Date(score.lastActivity) < 86400000).length
            },
            businesses: {
                total: totalBusinesses
            },
            content: {
                totalPosts,
                totalEngagement,
                avgEngagementPerPost: totalEngagement / Math.max(totalPosts, 1)
            },
            viralMoments: this.viralMoments.size,
            groups: this.groups.size
        };
    }
}

// Export the class for use
module.exports = BvesterSocialSystem;

// Example usage
if (require.main === module) {
    const socialSystem = new BvesterSocialSystem();
    
    console.log('Bvester Social Features System initialized!');
    console.log('Example usage:');
    
    // Get user stats
    const userStats = socialSystem.getUserStats('user1');
    console.log('User 1 Stats:', JSON.stringify(userStats, null, 2));
    
    // Get activity feed
    const feed = socialSystem.getActivityFeed('user1');
    console.log('\nActivity Feed:', feed.posts.length, 'posts');
    
    // Get trending content
    const trending = socialSystem.getTrendingContent();
    console.log('\nTrending Content:', trending.length, 'posts');
    
    // Get platform analytics
    const analytics = socialSystem.getPlatformAnalytics();
    console.log('\nPlatform Analytics:', JSON.stringify(analytics, null, 2));
    
    // Demonstrate social interactions
    socialSystem.likePost(Array.from(socialSystem.posts.keys())[0], 'user2');
    socialSystem.commentOnPost(Array.from(socialSystem.posts.keys())[0], 'user2', 'Great achievement!');
    
    console.log('\nSocial features demonstration completed!');
}