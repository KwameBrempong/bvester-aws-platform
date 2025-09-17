/**
 * BVESTER VIRAL REFERRAL SYSTEM
 * Advanced referral tracking with rewards and gamification
 */

const { v4: uuidv4 } = require('uuid');

class ReferralSystem {
  constructor(db) {
    this.db = db || {
      referrals: new Map(),
      referralCodes: new Map(),
      rewards: new Map(),
      leaderboard: new Map()
    };
    
    // Reward tiers
    this.rewardTiers = {
      bronze: { referrals: 3, bonus: 10, perks: ['1 month premium'] },
      silver: { referrals: 10, bonus: 50, perks: ['3 months premium', 'Early access'] },
      gold: { referrals: 25, bonus: 200, perks: ['1 year premium', 'VIP support', 'Investor badge'] },
      platinum: { referrals: 50, bonus: 500, perks: ['Lifetime premium', 'Advisory board seat', 'Revenue share'] }
    };
  }

  /**
   * Generate unique referral code for user
   */
  generateReferralCode(userId, userName) {
    // Create memorable code based on username
    const namePrefix = userName.split(' ')[0].toUpperCase().substring(0, 4);
    const uniqueId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${namePrefix}${uniqueId}`;
    
    this.db.referralCodes.set(code, {
      userId,
      code,
      createdAt: new Date().toISOString(),
      totalReferrals: 0,
      successfulReferrals: 0,
      pendingRewards: 0,
      claimedRewards: 0,
      tier: 'none'
    });
    
    return code;
  }

  /**
   * Track referral when new user signs up
   */
  trackReferral(referralCode, newUserId, newUserEmail) {
    const referralData = this.db.referralCodes.get(referralCode);
    
    if (!referralData) {
      return { success: false, error: 'Invalid referral code' };
    }
    
    // Create referral record
    const referralId = uuidv4();
    const referral = {
      referralId,
      referrerId: referralData.userId,
      referralCode,
      referredUserId: newUserId,
      referredUserEmail: newUserEmail,
      status: 'pending', // pending, verified, rewarded
      createdAt: new Date().toISOString(),
      verifiedAt: null,
      rewardedAt: null,
      rewardAmount: 0
    };
    
    this.db.referrals.set(referralId, referral);
    
    // Update referral code stats
    referralData.totalReferrals++;
    
    // Send notification to referrer
    this.sendReferralNotification(referralData.userId, newUserEmail);
    
    return {
      success: true,
      referralId,
      message: 'Referral tracked successfully'
    };
  }

  /**
   * Verify referral (e.g., after user completes profile or makes first action)
   */
  verifyReferral(referredUserId) {
    // Find referral by referred user
    const referral = Array.from(this.db.referrals.values()).find(
      r => r.referredUserId === referredUserId && r.status === 'pending'
    );
    
    if (!referral) {
      return { success: false, error: 'No pending referral found' };
    }
    
    // Update referral status
    referral.status = 'verified';
    referral.verifiedAt = new Date().toISOString();
    
    // Update referral code stats
    const referralData = this.db.referralCodes.get(referral.referralCode);
    referralData.successfulReferrals++;
    
    // Calculate rewards
    const reward = this.calculateReward(referralData);
    referral.rewardAmount = reward.amount;
    referralData.pendingRewards += reward.amount;
    
    // Check for tier upgrade
    this.checkTierUpgrade(referralData);
    
    // Update leaderboard
    this.updateLeaderboard(referral.referrerId, referralData);
    
    return {
      success: true,
      reward: reward.amount,
      newTier: referralData.tier,
      message: 'Referral verified and rewards calculated'
    };
  }

  /**
   * Calculate reward based on referral count and tier
   */
  calculateReward(referralData) {
    const baseReward = 5; // $5 base reward
    let multiplier = 1;
    
    // Tier multipliers
    if (referralData.tier === 'bronze') multiplier = 1.5;
    if (referralData.tier === 'silver') multiplier = 2;
    if (referralData.tier === 'gold') multiplier = 3;
    if (referralData.tier === 'platinum') multiplier = 5;
    
    // Streak bonus
    const streakBonus = this.calculateStreakBonus(referralData.userId);
    
    // Time bonus (double rewards for first 48 hours)
    const timeBonus = this.isWithinTimeBonus(referralData.createdAt) ? 2 : 1;
    
    const totalReward = baseReward * multiplier * streakBonus * timeBonus;
    
    return {
      amount: totalReward,
      breakdown: {
        base: baseReward,
        tierMultiplier: multiplier,
        streakBonus,
        timeBonus
      }
    };
  }

  /**
   * Check and upgrade tier based on referral count
   */
  checkTierUpgrade(referralData) {
    const referralCount = referralData.successfulReferrals;
    let newTier = 'none';
    let unlockedPerks = [];
    let bonusReward = 0;
    
    if (referralCount >= this.rewardTiers.platinum.referrals) {
      newTier = 'platinum';
      bonusReward = this.rewardTiers.platinum.bonus;
      unlockedPerks = this.rewardTiers.platinum.perks;
    } else if (referralCount >= this.rewardTiers.gold.referrals) {
      newTier = 'gold';
      bonusReward = this.rewardTiers.gold.bonus;
      unlockedPerks = this.rewardTiers.gold.perks;
    } else if (referralCount >= this.rewardTiers.silver.referrals) {
      newTier = 'silver';
      bonusReward = this.rewardTiers.silver.bonus;
      unlockedPerks = this.rewardTiers.silver.perks;
    } else if (referralCount >= this.rewardTiers.bronze.referrals) {
      newTier = 'bronze';
      bonusReward = this.rewardTiers.bronze.bonus;
      unlockedPerks = this.rewardTiers.bronze.perks;
    }
    
    if (newTier !== referralData.tier && newTier !== 'none') {
      referralData.tier = newTier;
      referralData.pendingRewards += bonusReward;
      
      // Send tier upgrade notification
      this.sendTierUpgradeNotification(referralData.userId, newTier, unlockedPerks);
    }
  }

  /**
   * Calculate streak bonus for consistent referrals
   */
  calculateStreakBonus(userId) {
    const userReferrals = Array.from(this.db.referrals.values())
      .filter(r => r.referrerId === userId && r.status === 'verified')
      .sort((a, b) => new Date(b.verifiedAt) - new Date(a.verifiedAt));
    
    if (userReferrals.length < 2) return 1;
    
    let streak = 1;
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < userReferrals.length - 1; i++) {
      const current = new Date(userReferrals[i].verifiedAt);
      const next = new Date(userReferrals[i + 1].verifiedAt);
      
      if (current - next <= oneDayMs * 7) { // Within 7 days
        streak++;
      } else {
        break;
      }
    }
    
    // Streak multipliers
    if (streak >= 10) return 2;
    if (streak >= 5) return 1.5;
    if (streak >= 3) return 1.2;
    return 1;
  }

  /**
   * Check if referral is within time bonus period
   */
  isWithinTimeBonus(createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursSince = (now - created) / (1000 * 60 * 60);
    return hoursSince <= 48;
  }

  /**
   * Update leaderboard
   */
  updateLeaderboard(userId, referralData) {
    this.db.leaderboard.set(userId, {
      userId,
      referrals: referralData.successfulReferrals,
      tier: referralData.tier,
      totalEarned: referralData.claimedRewards + referralData.pendingRewards,
      lastActive: new Date().toISOString()
    });
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(limit = 10) {
    const leaderboard = Array.from(this.db.leaderboard.values())
      .sort((a, b) => b.referrals - a.referrals)
      .slice(0, limit);
    
    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
      badge: this.getRankBadge(index + 1)
    }));
  }

  /**
   * Get rank badge
   */
  getRankBadge(rank) {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '⭐';
    return '';
  }

  /**
   * Claim rewards
   */
  claimRewards(userId, amount) {
    const referralData = Array.from(this.db.referralCodes.values()).find(
      r => r.userId === userId
    );
    
    if (!referralData) {
      return { success: false, error: 'User not found' };
    }
    
    if (referralData.pendingRewards < amount) {
      return { success: false, error: 'Insufficient rewards balance' };
    }
    
    referralData.pendingRewards -= amount;
    referralData.claimedRewards += amount;
    
    return {
      success: true,
      claimedAmount: amount,
      remainingBalance: referralData.pendingRewards
    };
  }

  /**
   * Get user referral stats
   */
  getUserReferralStats(userId) {
    const referralData = Array.from(this.db.referralCodes.values()).find(
      r => r.userId === userId
    );
    
    if (!referralData) {
      return null;
    }
    
    const referrals = Array.from(this.db.referrals.values()).filter(
      r => r.referrerId === userId
    );
    
    return {
      code: referralData.code,
      totalReferrals: referralData.totalReferrals,
      successfulReferrals: referralData.successfulReferrals,
      pendingRewards: referralData.pendingRewards,
      claimedRewards: referralData.claimedRewards,
      tier: referralData.tier,
      nextTier: this.getNextTier(referralData.tier),
      referralsToNextTier: this.getReferralsToNextTier(referralData.successfulReferrals),
      recentReferrals: referrals.slice(-5).reverse(),
      shareLink: `https://bvester.com/join?ref=${referralData.code}`,
      shareMessage: this.generateShareMessage(referralData.code)
    };
  }

  /**
   * Get next tier info
   */
  getNextTier(currentTier) {
    const tiers = ['none', 'bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(currentTier);
    
    if (currentIndex >= tiers.length - 1) {
      return null;
    }
    
    const nextTier = tiers[currentIndex + 1];
    return {
      name: nextTier,
      ...this.rewardTiers[nextTier]
    };
  }

  /**
   * Calculate referrals needed for next tier
   */
  getReferralsToNextTier(currentReferrals) {
    if (currentReferrals < this.rewardTiers.bronze.referrals) {
      return this.rewardTiers.bronze.referrals - currentReferrals;
    }
    if (currentReferrals < this.rewardTiers.silver.referrals) {
      return this.rewardTiers.silver.referrals - currentReferrals;
    }
    if (currentReferrals < this.rewardTiers.gold.referrals) {
      return this.rewardTiers.gold.referrals - currentReferrals;
    }
    if (currentReferrals < this.rewardTiers.platinum.referrals) {
      return this.rewardTiers.platinum.referrals - currentReferrals;
    }
    return 0;
  }

  /**
   * Generate viral share messages
   */
  generateShareMessage(code) {
    const messages = {
      whatsapp: `🚀 I'm using Bvester to grow my business! Join me and get $10 free credits. Use my code: ${code}\n\nhttps://bvester.com/join?ref=${code}`,
      twitter: `Just discovered @Bvester - the platform connecting African SMEs with global investors! 🌍💰\n\nJoin with my code ${code} for exclusive benefits!\n\n#AfricanBusiness #Investment #Bvester`,
      linkedin: `I'm excited to be part of Bvester, a revolutionary platform connecting African SMEs with diaspora investors.\n\nIf you're interested in African investment opportunities or need funding for your business, join using my referral code: ${code}\n\nLet's grow together! 🚀`,
      email: {
        subject: 'Join me on Bvester - Get $10 Free Credits!',
        body: `Hi there!\n\nI wanted to share an amazing platform I've been using - Bvester. It connects African SMEs with global investors and has already helped thousands of businesses get funded.\n\nJoin using my referral code ${code} and you'll get:\n- $10 free credits\n- Priority access to investment opportunities\n- Exclusive member benefits\n\nSign up here: https://bvester.com/join?ref=${code}\n\nLet's grow together!\n\nBest regards`
      },
      sms: `Join Bvester with my code ${code} and get $10 free! Connect with investors and grow your business: https://bvester.com/join?ref=${code}`
    };
    
    return messages;
  }

  /**
   * Send notifications (mock implementation)
   */
  sendReferralNotification(userId, referredEmail) {
    console.log(`📧 Notification: User ${userId} referred ${referredEmail}`);
  }

  sendTierUpgradeNotification(userId, tier, perks) {
    console.log(`🎉 Notification: User ${userId} upgraded to ${tier} tier!`);
    console.log(`   Unlocked perks: ${perks.join(', ')}`);
  }
}

module.exports = ReferralSystem;