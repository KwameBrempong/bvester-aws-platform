/**
 * BVESTER GAMIFICATION SYSTEM
 * Points, badges, levels, challenges, and rewards
 */

const { EventEmitter } = require('events');

class GamificationSystem extends EventEmitter {
  constructor() {
    super();
    
    // Data stores
    this.userProgress = new Map();
    this.achievements = new Map();
    this.challenges = new Map();
    this.streaks = new Map();
    this.leaderboards = new Map();
    
    // Initialize achievements
    this.initializeAchievements();
    
    // Initialize challenges
    this.initializeChallenges();
    
    // Point values for actions
    this.pointValues = {
      // Basic actions
      login: 5,
      completeProfile: 50,
      verifyEmail: 20,
      verifyKYC: 100,
      
      // SME actions
      createBusiness: 100,
      updateFinancials: 30,
      improveReadinessScore: 50,
      receiveFunding: 500,
      
      // Investor actions
      makeInvestment: 200,
      firstInvestment: 500,
      portfolioDiversification: 150,
      
      // Social actions
      sharePost: 10,
      referFriend: 100,
      writeReview: 25,
      helpOthers: 15,
      
      // Engagement
      dailyActive: 10,
      weeklyStreak: 50,
      monthlyStreak: 200
    };
    
    // Level thresholds
    this.levels = [
      { level: 1, name: 'Beginner', minPoints: 0, perks: [] },
      { level: 2, name: 'Explorer', minPoints: 100, perks: ['Profile badge'] },
      { level: 3, name: 'Contributor', minPoints: 300, perks: ['Priority support'] },
      { level: 4, name: 'Achiever', minPoints: 600, perks: ['Early access'] },
      { level: 5, name: 'Influencer', minPoints: 1000, perks: ['Reduced fees'] },
      { level: 6, name: 'Expert', minPoints: 2000, perks: ['VIP events'] },
      { level: 7, name: 'Master', minPoints: 4000, perks: ['Advisory board'] },
      { level: 8, name: 'Champion', minPoints: 7000, perks: ['Revenue share'] },
      { level: 9, name: 'Legend', minPoints: 10000, perks: ['Lifetime premium'] },
      { level: 10, name: 'Titan', minPoints: 20000, perks: ['Co-founder status'] }
    ];
  }

  /**
   * Initialize achievements/badges
   */
  initializeAchievements() {
    const achievements = [
      // Onboarding achievements
      {
        id: 'first_steps',
        name: 'First Steps',
        description: 'Complete your profile',
        icon: '👣',
        points: 50,
        criteria: { action: 'completeProfile' }
      },
      {
        id: 'verified',
        name: 'Verified Member',
        description: 'Complete KYC verification',
        icon: '✅',
        points: 100,
        criteria: { action: 'verifyKYC' }
      },
      
      // SME achievements
      {
        id: 'business_owner',
        name: 'Business Owner',
        description: 'Create your first business profile',
        icon: '🏢',
        points: 100,
        criteria: { action: 'createBusiness', count: 1 }
      },
      {
        id: 'investment_ready',
        name: 'Investment Ready',
        description: 'Achieve 80+ readiness score',
        icon: '🎯',
        points: 200,
        criteria: { readinessScore: 80 }
      },
      {
        id: 'funded',
        name: 'Successfully Funded',
        description: 'Raise your first funding',
        icon: '💰',
        points: 500,
        criteria: { action: 'receiveFunding' }
      },
      {
        id: 'unicorn',
        name: 'Unicorn Status',
        description: 'Raise over $1 million',
        icon: '🦄',
        points: 5000,
        criteria: { totalFunding: 1000000 }
      },
      
      // Investor achievements
      {
        id: 'first_investment',
        name: 'First Investment',
        description: 'Make your first investment',
        icon: '💎',
        points: 200,
        criteria: { action: 'makeInvestment', count: 1 }
      },
      {
        id: 'portfolio_builder',
        name: 'Portfolio Builder',
        description: 'Invest in 5 different businesses',
        icon: '📊',
        points: 500,
        criteria: { portfolioSize: 5 }
      },
      {
        id: 'whale',
        name: 'Whale Investor',
        description: 'Invest over $100,000',
        icon: '🐋',
        points: 2000,
        criteria: { totalInvested: 100000 }
      },
      
      // Social achievements
      {
        id: 'influencer',
        name: 'Influencer',
        description: 'Refer 10 friends',
        icon: '📣',
        points: 300,
        criteria: { referrals: 10 }
      },
      {
        id: 'community_hero',
        name: 'Community Hero',
        description: 'Help 50 community members',
        icon: '🦸',
        points: 500,
        criteria: { helpCount: 50 }
      },
      {
        id: 'viral',
        name: 'Gone Viral',
        description: 'Get 1000+ views on a post',
        icon: '🔥',
        points: 400,
        criteria: { postViews: 1000 }
      },
      
      // Streak achievements
      {
        id: 'week_warrior',
        name: 'Week Warrior',
        description: '7-day login streak',
        icon: '🗓️',
        points: 100,
        criteria: { loginStreak: 7 }
      },
      {
        id: 'monthly_master',
        name: 'Monthly Master',
        description: '30-day login streak',
        icon: '📅',
        points: 500,
        criteria: { loginStreak: 30 }
      },
      {
        id: 'centurion',
        name: 'Centurion',
        description: '100-day login streak',
        icon: '💯',
        points: 2000,
        criteria: { loginStreak: 100 }
      }
    ];
    
    achievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  /**
   * Initialize weekly/monthly challenges
   */
  initializeChallenges() {
    const challenges = [
      // Weekly challenges
      {
        id: 'weekly_investor',
        name: 'Investment Week',
        description: 'Make 3 investments this week',
        type: 'weekly',
        target: 3,
        metric: 'investments',
        reward: 200,
        icon: '🎯',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'weekly_social',
        name: 'Social Butterfly',
        description: 'Share 5 posts this week',
        type: 'weekly',
        target: 5,
        metric: 'shares',
        reward: 100,
        icon: '🦋',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      
      // Monthly challenges
      {
        id: 'monthly_growth',
        name: 'Growth Month',
        description: 'Improve readiness score by 20 points',
        type: 'monthly',
        target: 20,
        metric: 'scoreImprovement',
        reward: 500,
        icon: '📈',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'monthly_referral',
        name: 'Referral Champion',
        description: 'Refer 5 new users this month',
        type: 'monthly',
        target: 5,
        metric: 'referrals',
        reward: 300,
        icon: '🏆',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      
      // Special event challenges
      {
        id: 'africa_day',
        name: 'Africa Day Special',
        description: 'Invest in 3 African businesses',
        type: 'special',
        target: 3,
        metric: 'africanInvestments',
        reward: 1000,
        icon: '🌍',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      }
    ];
    
    challenges.forEach(challenge => {
      this.challenges.set(challenge.id, {
        ...challenge,
        participants: new Map(),
        completions: 0
      });
    });
  }

  /**
   * Award points to user
   */
  awardPoints(userId, action, amount = null) {
    const points = amount || this.pointValues[action] || 0;
    
    if (points === 0) return null;
    
    // Get or create user progress
    let userProg = this.userProgress.get(userId) || {
      userId,
      totalPoints: 0,
      level: 1,
      achievements: [],
      currentStreak: 0,
      longestStreak: 0,
      lastActive: null,
      joinedAt: new Date().toISOString()
    };
    
    // Award points
    userProg.totalPoints += points;
    
    // Check for level up
    const newLevel = this.calculateLevel(userProg.totalPoints);
    const leveledUp = newLevel > userProg.level;
    
    if (leveledUp) {
      userProg.level = newLevel;
      this.emit('levelUp', {
        userId,
        newLevel,
        perks: this.levels[newLevel - 1].perks
      });
    }
    
    // Update user progress
    this.userProgress.set(userId, userProg);
    
    // Update leaderboard
    this.updateLeaderboard(userId, userProg);
    
    // Emit event
    this.emit('pointsAwarded', {
      userId,
      action,
      points,
      totalPoints: userProg.totalPoints,
      level: userProg.level,
      leveledUp
    });
    
    return {
      pointsAwarded: points,
      totalPoints: userProg.totalPoints,
      level: userProg.level,
      leveledUp,
      nextLevelProgress: this.getProgressToNextLevel(userProg.totalPoints)
    };
  }

  /**
   * Check and unlock achievements
   */
  checkAchievements(userId, context = {}) {
    const userProg = this.userProgress.get(userId);
    if (!userProg) return [];
    
    const unlockedAchievements = [];
    
    this.achievements.forEach((achievement, id) => {
      // Skip if already unlocked
      if (userProg.achievements.includes(id)) return;
      
      // Check criteria
      let unlocked = false;
      
      if (achievement.criteria.action && context.action === achievement.criteria.action) {
        if (achievement.criteria.count) {
          const actionCount = context.actionCount || 1;
          unlocked = actionCount >= achievement.criteria.count;
        } else {
          unlocked = true;
        }
      }
      
      if (achievement.criteria.readinessScore && context.readinessScore >= achievement.criteria.readinessScore) {
        unlocked = true;
      }
      
      if (achievement.criteria.totalFunding && context.totalFunding >= achievement.criteria.totalFunding) {
        unlocked = true;
      }
      
      if (achievement.criteria.portfolioSize && context.portfolioSize >= achievement.criteria.portfolioSize) {
        unlocked = true;
      }
      
      if (achievement.criteria.referrals && context.referrals >= achievement.criteria.referrals) {
        unlocked = true;
      }
      
      if (achievement.criteria.loginStreak && userProg.currentStreak >= achievement.criteria.loginStreak) {
        unlocked = true;
      }
      
      if (unlocked) {
        userProg.achievements.push(id);
        unlockedAchievements.push(achievement);
        
        // Award achievement points
        this.awardPoints(userId, null, achievement.points);
        
        // Emit event
        this.emit('achievementUnlocked', {
          userId,
          achievement,
          totalAchievements: userProg.achievements.length
        });
      }
    });
    
    return unlockedAchievements;
  }

  /**
   * Join a challenge
   */
  joinChallenge(userId, challengeId) {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return { success: false, error: 'Challenge not found' };
    
    // Check if challenge is active
    const now = new Date();
    if (now < challenge.startDate || now > challenge.endDate) {
      return { success: false, error: 'Challenge not active' };
    }
    
    // Add participant
    challenge.participants.set(userId, {
      userId,
      joinedAt: now.toISOString(),
      progress: 0,
      completed: false
    });
    
    return {
      success: true,
      challenge: {
        ...challenge,
        participants: undefined // Don't send full participant list
      }
    };
  }

  /**
   * Update challenge progress
   */
  updateChallengeProgress(userId, metric, value = 1) {
    const activeChallenges = Array.from(this.challenges.values()).filter(
      c => c.participants.has(userId) && !c.participants.get(userId).completed
    );
    
    const completedChallenges = [];
    
    activeChallenges.forEach(challenge => {
      if (challenge.metric === metric) {
        const participant = challenge.participants.get(userId);
        participant.progress += value;
        
        // Check if completed
        if (participant.progress >= challenge.target) {
          participant.completed = true;
          participant.completedAt = new Date().toISOString();
          challenge.completions++;
          
          // Award reward
          this.awardPoints(userId, null, challenge.reward);
          
          completedChallenges.push(challenge);
          
          // Emit event
          this.emit('challengeCompleted', {
            userId,
            challenge: challenge.name,
            reward: challenge.reward
          });
        }
      }
    });
    
    return completedChallenges;
  }

  /**
   * Update daily streak
   */
  updateStreak(userId) {
    let userProg = this.userProgress.get(userId) || {
      userId,
      totalPoints: 0,
      level: 1,
      achievements: [],
      currentStreak: 0,
      longestStreak: 0,
      lastActive: null
    };
    
    const now = new Date();
    const lastActive = userProg.lastActive ? new Date(userProg.lastActive) : null;
    
    if (lastActive) {
      const daysSinceLastActive = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastActive === 1) {
        // Consecutive day - increase streak
        userProg.currentStreak++;
        
        // Award streak bonus
        if (userProg.currentStreak % 7 === 0) {
          this.awardPoints(userId, 'weeklyStreak');
        }
        if (userProg.currentStreak % 30 === 0) {
          this.awardPoints(userId, 'monthlyStreak');
        }
      } else if (daysSinceLastActive > 1) {
        // Streak broken
        userProg.currentStreak = 1;
      }
    } else {
      // First login
      userProg.currentStreak = 1;
    }
    
    // Update longest streak
    if (userProg.currentStreak > userProg.longestStreak) {
      userProg.longestStreak = userProg.currentStreak;
    }
    
    userProg.lastActive = now.toISOString();
    this.userProgress.set(userId, userProg);
    
    // Check streak achievements
    this.checkAchievements(userId, { loginStreak: userProg.currentStreak });
    
    return {
      currentStreak: userProg.currentStreak,
      longestStreak: userProg.longestStreak,
      streakBonus: userProg.currentStreak % 7 === 0 || userProg.currentStreak % 30 === 0
    };
  }

  /**
   * Calculate user level
   */
  calculateLevel(points) {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      if (points >= this.levels[i].minPoints) {
        return this.levels[i].level;
      }
    }
    return 1;
  }

  /**
   * Get progress to next level
   */
  getProgressToNextLevel(points) {
    const currentLevel = this.calculateLevel(points);
    
    if (currentLevel >= this.levels.length) {
      return { percentage: 100, pointsNeeded: 0 };
    }
    
    const currentLevelMin = this.levels[currentLevel - 1].minPoints;
    const nextLevelMin = this.levels[currentLevel].minPoints;
    const pointsInLevel = points - currentLevelMin;
    const pointsNeededForNext = nextLevelMin - currentLevelMin;
    
    return {
      percentage: Math.round((pointsInLevel / pointsNeededForNext) * 100),
      pointsNeeded: nextLevelMin - points,
      nextLevel: this.levels[currentLevel]
    };
  }

  /**
   * Update leaderboard
   */
  updateLeaderboard(userId, userProgress) {
    // Weekly leaderboard
    const weekKey = `week-${new Date().getWeek()}`;
    if (!this.leaderboards.has(weekKey)) {
      this.leaderboards.set(weekKey, new Map());
    }
    this.leaderboards.get(weekKey).set(userId, userProgress.totalPoints);
    
    // Monthly leaderboard
    const monthKey = `month-${new Date().getMonth()}-${new Date().getFullYear()}`;
    if (!this.leaderboards.has(monthKey)) {
      this.leaderboards.set(monthKey, new Map());
    }
    this.leaderboards.get(monthKey).set(userId, userProgress.totalPoints);
    
    // All-time leaderboard
    if (!this.leaderboards.has('all-time')) {
      this.leaderboards.set('all-time', new Map());
    }
    this.leaderboards.get('all-time').set(userId, userProgress.totalPoints);
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(type = 'all-time', limit = 10) {
    const board = this.leaderboards.get(type);
    if (!board) return [];
    
    const sorted = Array.from(board.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    
    return sorted.map(([userId, points], index) => {
      const userProg = this.userProgress.get(userId);
      return {
        rank: index + 1,
        userId,
        points,
        level: userProg?.level || 1,
        achievements: userProg?.achievements.length || 0,
        badge: this.getRankBadge(index + 1)
      };
    });
  }

  /**
   * Get rank badge
   */
  getRankBadge(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '⭐';
    return '';
  }

  /**
   * Get user gamification stats
   */
  getUserStats(userId) {
    const userProg = this.userProgress.get(userId);
    if (!userProg) return null;
    
    const achievements = userProg.achievements.map(id => 
      this.achievements.get(id)
    );
    
    const activeChallenges = Array.from(this.challenges.values()).filter(
      c => c.participants.has(userId)
    ).map(c => ({
      ...c,
      userProgress: c.participants.get(userId)
    }));
    
    return {
      totalPoints: userProg.totalPoints,
      level: userProg.level,
      levelName: this.levels[userProg.level - 1].name,
      currentStreak: userProg.currentStreak,
      longestStreak: userProg.longestStreak,
      achievements: achievements,
      totalAchievements: achievements.length,
      possibleAchievements: this.achievements.size,
      activeChallenges,
      progressToNextLevel: this.getProgressToNextLevel(userProg.totalPoints),
      perks: this.levels[userProg.level - 1].perks,
      nextPerks: userProg.level < this.levels.length ? this.levels[userProg.level].perks : []
    };
  }
}

// Add week number helper
Date.prototype.getWeek = function() {
  const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
};

module.exports = GamificationSystem;