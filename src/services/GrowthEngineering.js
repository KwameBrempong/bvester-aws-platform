/**
 * Growth Engineering Service for Bvester Investor Acquisition
 * Implements viral loops, referral tracking, and growth analytics
 */

import { FirebaseService } from './firebase/FirebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

export class GrowthEngineering {
  constructor() {
    this.analyticsQueue = [];
    this.viralCoefficient = 0;
    this.conversionMetrics = {};
  }

  // ============================================
  // REFERRAL SYSTEM IMPLEMENTATION
  // ============================================

  /**
   * Generate unique referral code for investor
   */
  async generateReferralCode(investorId, investorProfile) {
    const timestamp = Date.now();
    const randomString = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${investorId}-${timestamp}-${Math.random()}`
    );
    
    const code = `INV-${randomString.substring(0, 8).toUpperCase()}`;
    
    const referralData = {
      code,
      investorId,
      investorName: investorProfile.name,
      investorTier: this.calculateInvestorTier(investorProfile),
      createdAt: new Date().toISOString(),
      totalReferred: 0,
      totalEarned: 0,
      isActive: true
    };

    await FirebaseService.db.collection('referrals').doc(code).set(referralData);
    
    // Track referral code generation
    this.trackGrowthEvent('referral_code_generated', {
      investorId,
      tier: referralData.investorTier,
      timestamp
    });

    return code;
  }

  /**
   * Track referral conversion when new investor signs up
   */
  async trackReferralConversion(referralCode, newInvestorData) {
    try {
      const referralDoc = await FirebaseService.db.collection('referrals').doc(referralCode).get();
      
      if (!referralDoc.exists) {
        console.log('Invalid referral code:', referralCode);
        return null;
      }

      const referralData = referralDoc.data();
      const conversion = {
        id: await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, 
          `${referralCode}-${newInvestorData.id}-${Date.now()}`),
        referralCode,
        referrerId: referralData.investorId,
        newInvestorId: newInvestorData.id,
        conversionType: 'signup',
        timestamp: new Date().toISOString(),
        rewardEarned: 0,
        status: 'pending'
      };

      // Store conversion record
      await FirebaseService.db.collection('referral_conversions').doc(conversion.id).set(conversion);

      // Update referral stats
      await FirebaseService.db.collection('referrals').doc(referralCode).update({
        totalReferred: referralData.totalReferred + 1,
        lastConversion: new Date().toISOString()
      });

      // Track viral coefficient
      this.updateViralCoefficient(referralData.investorId, 'signup');

      // Send notification to referrer
      await this.notifyReferralSuccess(referralData.investorId, newInvestorData.name, 'signup');

      return conversion;
    } catch (error) {
      console.error('Error tracking referral conversion:', error);
      return null;
    }
  }

  /**
   * Calculate and distribute referral rewards
   */
  async calculateReferralRewards(conversionId, investmentAmount = null) {
    try {
      const conversionDoc = await FirebaseService.db.collection('referral_conversions').doc(conversionId).get();
      
      if (!conversionDoc.exists) return null;

      const conversion = conversionDoc.data();
      const referralDoc = await FirebaseService.db.collection('referrals').doc(conversion.referralCode).get();
      const referralData = referralDoc.data();

      let baseReward = 0;
      let conversionType = 'signup';

      if (investmentAmount) {
        // Investment-based reward: 0.25% of investment amount
        baseReward = Math.min(investmentAmount * 0.0025, 1000); // Cap at $1000
        conversionType = 'investment';
      } else {
        // Signup reward: $100
        baseReward = 100;
      }

      // Apply tier multiplier
      const tierMultiplier = this.getTierMultiplier(referralData.investorTier);
      const finalReward = baseReward * tierMultiplier;

      // Update conversion record
      await FirebaseService.db.collection('referral_conversions').doc(conversionId).update({
        rewardEarned: finalReward,
        conversionType,
        status: 'completed',
        paidAt: new Date().toISOString()
      });

      // Update referral totals
      await FirebaseService.db.collection('referrals').doc(conversion.referralCode).update({
        totalEarned: referralData.totalEarned + finalReward
      });

      // Add reward to investor's wallet
      await this.addReferralRewardToWallet(conversion.referrerId, finalReward, conversionType);

      // Track reward distribution
      this.trackGrowthEvent('referral_reward_paid', {
        referrerId: conversion.referrerId,
        amount: finalReward,
        conversionType,
        timestamp: Date.now()
      });

      return { rewardAmount: finalReward, conversionType };
    } catch (error) {
      console.error('Error calculating referral rewards:', error);
      return null;
    }
  }

  // ============================================
  // VIRAL LOOP MECHANISMS
  // ============================================

  /**
   * Generate social sharing content for investment success
   */
  generateInvestmentShareContent(investorProfile, investmentData) {
    const shareContent = {
      title: `🎯 Just invested $${investmentData.amount.toLocaleString()} in ${investmentData.businessName}!`,
      description: `Excited to support African entrepreneurship through @Bvester. This ${investmentData.industry} business in ${investmentData.country} has huge potential! 🚀`,
      hashtags: ['#AfricaInvesting', '#ImpactInvesting', '#BvesterSuccess', `#${investmentData.country}Business`],
      image: investmentData.businessLogo || 'https://bvester.com/default-success.png',
      link: `https://bvester.com/invest/${investmentData.businessId}?ref=${investorProfile.referralCode}`,
      platforms: {
        linkedin: {
          text: `Proud to announce my latest investment in ${investmentData.businessName}, a promising ${investmentData.industry} business in ${investmentData.country}. \n\nThrough @Bvester, I'm supporting African entrepreneurship while diversifying my portfolio. The platform makes it easy to discover vetted investment opportunities across the continent. \n\n#AfricaInvesting #ImpactInvesting #Investment`,
          link: `https://bvester.com/invest/${investmentData.businessId}?ref=${investorProfile.referralCode}&utm_source=linkedin`
        },
        twitter: {
          text: `🎯 Just backed ${investmentData.businessName} via @Bvester! Supporting African innovation in ${investmentData.industry}. Check out this opportunity: `,
          link: `https://bvester.com/invest/${investmentData.businessId}?ref=${investorProfile.referralCode}&utm_source=twitter`
        },
        whatsapp: {
          text: `Hey! I just invested in an African business through Bvester and thought you might be interested. ${investmentData.businessName} is a ${investmentData.industry} company in ${investmentData.country} with great potential. Check it out: https://bvester.com/invest/${investmentData.businessId}?ref=${investorProfile.referralCode}&utm_source=whatsapp`
        }
      },
      analytics: {
        investorId: investorProfile.id,
        investmentId: investmentData.id,
        shareType: 'investment_success',
        createdAt: new Date().toISOString()
      }
    };

    // Track share content generation
    this.trackGrowthEvent('share_content_generated', {
      investorId: investorProfile.id,
      shareType: 'investment_success',
      platforms: Object.keys(shareContent.platforms)
    });

    return shareContent;
  }

  /**
   * Track social sharing and measure viral coefficient
   */
  async trackSocialShare(shareData) {
    const shareRecord = {
      id: await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, 
        `${shareData.investorId}-${shareData.platform}-${Date.now()}`),
      ...shareData,
      timestamp: new Date().toISOString(),
      clicks: 0,
      conversions: 0
    };

    await FirebaseService.db.collection('social_shares').doc(shareRecord.id).set(shareRecord);

    // Update viral coefficient
    this.updateViralCoefficient(shareData.investorId, 'share');

    return shareRecord.id;
  }

  /**
   * Track clicks from shared content
   */
  async trackShareClick(shareId, clickData) {
    try {
      const shareDoc = await FirebaseService.db.collection('social_shares').doc(shareId).get();
      
      if (shareDoc.exists) {
        const currentClicks = shareDoc.data().clicks || 0;
        await FirebaseService.db.collection('social_shares').doc(shareId).update({
          clicks: currentClicks + 1,
          lastClick: new Date().toISOString()
        });

        // Track click event
        this.trackGrowthEvent('share_click', {
          shareId,
          platform: shareDoc.data().platform,
          clickSource: clickData.source,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error tracking share click:', error);
    }
  }

  // ============================================
  // GAMIFICATION SYSTEM
  // ============================================

  /**
   * Calculate investor level based on activity
   */
  calculateInvestorLevel(investorProfile) {
    const totalInvested = investorProfile.totalInvested || 0;
    const totalReferred = investorProfile.totalReferred || 0;
    const accountAge = this.getAccountAgeMonths(investorProfile.createdAt);

    let points = 0;
    points += Math.floor(totalInvested / 1000) * 10; // 10 points per $1000 invested
    points += totalReferred * 50; // 50 points per referral
    points += Math.min(accountAge * 5, 100); // 5 points per month, max 100

    if (points >= 1000) return { level: 'Platinum', multiplier: 2.0, minInvestment: 100000 };
    if (points >= 500) return { level: 'Gold', multiplier: 1.5, minInvestment: 50000 };
    if (points >= 200) return { level: 'Silver', multiplier: 1.25, minInvestment: 10000 };
    return { level: 'Bronze', multiplier: 1.0, minInvestment: 1000 };
  }

  /**
   * Award achievement badges
   */
  async awardBadge(investorId, badgeType, badgeData) {
    const badge = {
      id: await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, 
        `${investorId}-${badgeType}-${Date.now()}`),
      investorId,
      type: badgeType,
      title: this.getBadgeTitle(badgeType),
      description: this.getBadgeDescription(badgeType, badgeData),
      icon: this.getBadgeIcon(badgeType),
      earnedAt: new Date().toISOString(),
      isVisible: true
    };

    await FirebaseService.db.collection('investor_badges').doc(badge.id).set(badge);

    // Send notification
    await this.notifyBadgeEarned(investorId, badge);

    return badge;
  }

  /**
   * Create investment milestone celebrations
   */
  async celebrateInvestmentMilestone(investorId, investmentData) {
    const milestones = [
      { threshold: 1, title: 'First Investment', reward: 50 },
      { threshold: 5, title: 'Portfolio Builder', reward: 100 },
      { threshold: 10, title: 'Active Investor', reward: 200 },
      { threshold: 25, title: 'Investment Expert', reward: 500 }
    ];

    const investorStats = await this.getInvestorStats(investorId);
    const currentCount = investorStats.totalInvestments;

    const milestone = milestones.find(m => m.threshold === currentCount);
    
    if (milestone) {
      // Award badge
      await this.awardBadge(investorId, 'milestone', {
        milestone: milestone.title,
        count: currentCount
      });

      // Add bonus reward
      await this.addBonusReward(investorId, milestone.reward, `${milestone.title} Achievement`);

      // Generate celebration content
      const celebrationContent = this.generateCelebrationContent(investorId, milestone, investmentData);

      return { milestone, celebrationContent };
    }

    return null;
  }

  // ============================================
  // ANALYTICS & OPTIMIZATION
  // ============================================

  /**
   * Track growth events for analysis
   */
  trackGrowthEvent(eventType, eventData) {
    const event = {
      type: eventType,
      data: eventData,
      timestamp: Date.now(),
      session: this.getSessionId()
    };

    this.analyticsQueue.push(event);

    // Batch send events every 10 events or 30 seconds
    if (this.analyticsQueue.length >= 10) {
      this.flushAnalytics();
    }
  }

  /**
   * Calculate and update viral coefficient
   */
  updateViralCoefficient(investorId, actionType) {
    const k_factor = this.calculateKFactor(investorId, actionType);
    
    // Store for analysis
    this.conversionMetrics[investorId] = {
      ...this.conversionMetrics[investorId],
      lastAction: actionType,
      kFactor: k_factor,
      timestamp: Date.now()
    };

    // Update global viral coefficient
    const allKFactors = Object.values(this.conversionMetrics).map(m => m.kFactor || 0);
    this.viralCoefficient = allKFactors.reduce((a, b) => a + b, 0) / allKFactors.length;
  }

  /**
   * A/B test different growth mechanics
   */
  async runGrowthExperiment(experimentName, userId, variants) {
    const experiment = {
      name: experimentName,
      userId,
      variant: this.selectExperimentVariant(userId, variants),
      startedAt: new Date().toISOString(),
      conversions: 0,
      revenue: 0
    };

    await FirebaseService.db.collection('growth_experiments').doc(`${experimentName}_${userId}`).set(experiment);

    return experiment.variant;
  }

  /**
   * Generate investor acquisition funnel report
   */
  async generateAcquisitionReport(dateRange) {
    const report = {
      period: dateRange,
      metrics: {
        totalSignups: 0,
        qualifiedInvestors: 0,
        firstTimeInvestors: 0,
        totalInvestmentVolume: 0,
        averageInvestmentSize: 0,
        conversionRates: {},
        channelPerformance: {},
        viralCoefficient: this.viralCoefficient,
        referralStats: {}
      }
    };

    // Calculate metrics from Firebase data
    const signups = await this.getSignupData(dateRange);
    const investments = await this.getInvestmentData(dateRange);
    const referrals = await this.getReferralData(dateRange);

    report.metrics.totalSignups = signups.length;
    report.metrics.qualifiedInvestors = signups.filter(s => s.qualificationScore >= 60).length;
    report.metrics.firstTimeInvestors = investments.filter(i => i.isFirstInvestment).length;
    report.metrics.totalInvestmentVolume = investments.reduce((sum, i) => sum + i.amount, 0);
    report.metrics.averageInvestmentSize = report.metrics.totalInvestmentVolume / investments.length || 0;

    // Calculate conversion rates
    report.metrics.conversionRates = {
      signupToQualified: (report.metrics.qualifiedInvestors / report.metrics.totalSignups) * 100,
      qualifiedToInvestor: (report.metrics.firstTimeInvestors / report.metrics.qualifiedInvestors) * 100,
      overallConversion: (report.metrics.firstTimeInvestors / report.metrics.totalSignups) * 100
    };

    return report;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  calculateInvestorTier(investorProfile) {
    const capacity = investorProfile.investmentCapacity || 0;
    if (capacity >= 250000) return 'platinum';
    if (capacity >= 50000) return 'gold';
    if (capacity >= 10000) return 'silver';
    return 'bronze';
  }

  getTierMultiplier(tier) {
    const multipliers = {
      platinum: 2.0,
      gold: 1.5,
      silver: 1.25,
      bronze: 1.0
    };
    return multipliers[tier] || 1.0;
  }

  getAccountAgeMonths(createdAt) {
    const accountDate = new Date(createdAt);
    const now = new Date();
    return Math.floor((now - accountDate) / (1000 * 60 * 60 * 24 * 30));
  }

  getBadgeTitle(badgeType) {
    const titles = {
      first_investment: '🎯 First Investment',
      portfolio_builder: '📊 Portfolio Builder',
      active_investor: '🚀 Active Investor',
      referral_champion: '🏆 Referral Champion',
      impact_leader: '🌍 Impact Leader',
      milestone: '🎉 Investment Milestone'
    };
    return titles[badgeType] || 'Achievement Unlocked';
  }

  getBadgeDescription(badgeType, data) {
    const descriptions = {
      first_investment: 'Completed your first investment on Bvester',
      portfolio_builder: `Built a portfolio of ${data.count} investments`,
      active_investor: 'Consistently active investor',
      referral_champion: `Referred ${data.referralCount} successful investors`,
      impact_leader: `Created $${data.impact.toLocaleString()} in economic impact`,
      milestone: `Reached ${data.milestone} milestone`
    };
    return descriptions[badgeType] || 'Special achievement earned';
  }

  getBadgeIcon(badgeType) {
    const icons = {
      first_investment: '🎯',
      portfolio_builder: '📊',
      active_investor: '🚀',
      referral_champion: '🏆',
      impact_leader: '🌍',
      milestone: '🎉'
    };
    return icons[badgeType] || '🏅';
  }

  async notifyReferralSuccess(referrerId, newInvestorName, conversionType) {
    // Implementation depends on notification system
    console.log(`Referral success: ${referrerId} referred ${newInvestorName} (${conversionType})`);
  }

  async notifyBadgeEarned(investorId, badge) {
    // Implementation depends on notification system
    console.log(`Badge earned: ${investorId} earned ${badge.title}`);
  }

  async addReferralRewardToWallet(investorId, amount, type) {
    // Implementation depends on wallet system
    console.log(`Reward added: $${amount} to ${investorId} for ${type}`);
  }

  async addBonusReward(investorId, amount, reason) {
    // Implementation depends on wallet system
    console.log(`Bonus reward: $${amount} to ${investorId} for ${reason}`);
  }

  calculateKFactor(investorId, actionType) {
    // Simplified K-factor calculation
    // K = (number of invitations sent by existing users) × (conversion rate of invitations)
    const invitations = this.conversionMetrics[investorId]?.invitations || 0;
    const conversions = this.conversionMetrics[investorId]?.conversions || 0;
    
    return invitations > 0 ? conversions / invitations : 0;
  }

  selectExperimentVariant(userId, variants) {
    // Simple hash-based variant selection
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return variants[Math.abs(hash) % variants.length];
  }

  getSessionId() {
    return Math.random().toString(36).substr(2, 9);
  }

  async flushAnalytics() {
    try {
      if (this.analyticsQueue.length > 0) {
        await FirebaseService.db.collection('growth_analytics').add({
          events: this.analyticsQueue,
          flushedAt: new Date().toISOString()
        });
        this.analyticsQueue = [];
      }
    } catch (error) {
      console.error('Error flushing analytics:', error);
    }
  }

  // Placeholder methods for data retrieval
  async getSignupData(dateRange) { return []; }
  async getInvestmentData(dateRange) { return []; }
  async getReferralData(dateRange) { return []; }
  async getInvestorStats(investorId) { return { totalInvestments: 0 }; }

  generateCelebrationContent(investorId, milestone, investmentData) {
    return {
      title: `🎉 Congratulations on your ${milestone.title}!`,
      message: `You've just completed your ${milestone.count} investment on Bvester. Keep building that diverse portfolio!`,
      sharePrompt: `Share your investment journey and inspire others to invest in African businesses.`,
      rewards: [`$${milestone.reward} bonus credit`, `${milestone.title} achievement badge`]
    };
  }
}

// Export singleton instance
export const growthEngine = new GrowthEngineering();