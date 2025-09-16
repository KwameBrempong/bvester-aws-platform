/**
 * Email Marketing Automation Service for Investor Nurturing
 * Handles lead nurturing, behavioral triggers, and conversion optimization
 */

import { FirebaseService } from './firebase/FirebaseService';
import { growthEngine } from './GrowthEngineering';

export class EmailMarketingAutomation {
  constructor() {
    this.templates = {};
    this.sequences = {};
    this.segments = {};
    this.loadEmailTemplates();
  }

  // ============================================
  // EMAIL SEQUENCE MANAGEMENT
  // ============================================

  /**
   * Initialize 12-week investor nurture sequence
   */
  async initializeNurtureSequence(leadId, leadData) {
    const sequence = this.createInvestorNurtureSequence(leadData);
    
    const sequenceRecord = {
      leadId,
      sequenceName: 'investor_nurture_12_week',
      currentStep: 0,
      totalSteps: sequence.length,
      status: 'active',
      createdAt: new Date().toISOString(),
      leadSegment: this.segmentLead(leadData),
      personalizations: this.generatePersonalizations(leadData)
    };

    await FirebaseService.db.collection('email_sequences').doc(leadId).set(sequenceRecord);

    // Schedule first email
    await this.scheduleEmail(leadId, sequence[0], 0);

    return sequenceRecord;
  }

  /**
   * Create 12-week investor nurture sequence
   */
  createInvestorNurtureSequence(leadData) {
    const segment = this.segmentLead(leadData);
    
    return [
      // Week 1-2: Education & Trust Building
      {
        day: 0,
        template: 'welcome_african_investment_guide',
        subject: `Welcome ${leadData.fullName}! Your African Investment Guide Inside`,
        tags: ['welcome', 'education'],
        attachments: ['African_Investment_Opportunity_Report.pdf']
      },
      {
        day: 3,
        template: 'success_story_sarah_18_roi',
        subject: 'How Sarah Earned 18% ROI Investing in Nigerian Tech',
        tags: ['success_story', 'social_proof']
      },
      {
        day: 7,
        template: 'risk_management_guide',
        subject: 'Managing Risk in Emerging Markets: 7 Essential Strategies',
        tags: ['education', 'risk_management']
      },
      {
        day: 10,
        template: 'platform_security_trust',
        subject: 'How We Keep Your Investments Safe: Security & Protection',
        tags: ['trust', 'security']
      },

      // Week 3-4: Value Demonstration
      {
        day: 14,
        template: 'sme_evaluation_process',
        subject: 'Behind the Scenes: How We Evaluate SME Investment Readiness',
        tags: ['education', 'process']
      },
      {
        day: 18,
        template: 'market_analysis_nigeria_fintech',
        subject: 'Market Alert: Nigeria\'s Fintech Boom Creates New Opportunities',
        tags: ['market_analysis', 'opportunity']
      },
      {
        day: 21,
        template: 'investor_spotlight_interview',
        subject: 'Investor Spotlight: Meet David Who Earned 22% Returns from London',
        tags: ['social_proof', 'interview']
      },
      {
        day: 25,
        template: 'platform_tour_features',
        subject: 'Your Personal Investment Dashboard: Key Features Tour',
        tags: ['features', 'onboarding']
      },

      // Week 5-6: Social Proof & FOMO
      {
        day: 28,
        template: 'recent_funding_success',
        subject: 'Breaking: 3 SMEs Just Reached Funding Goals This Week',
        tags: ['success', 'fomo']
      },
      {
        day: 32,
        template: 'limited_opportunity_alert',
        subject: '⚡ Limited Spots: High-Potential AgriTech Investment Closing Soon',
        tags: ['urgency', 'opportunity']
      },
      {
        day: 35,
        template: 'testimonials_compilation',
        subject: 'What Our Investors Are Saying: Recent Success Stories',
        tags: ['testimonials', 'social_proof']
      },
      {
        day: 39,
        template: 'community_highlights',
        subject: 'Community Update: Network Growth & Investment Milestones',
        tags: ['community', 'updates']
      },

      // Week 7-8: Conversion Push
      {
        day: 42,
        template: segment === 'high_capacity' ? 'first_investment_vip_guide' : 'first_investment_starter_guide',
        subject: 'Ready to Start? Your First Investment Step-by-Step Guide',
        tags: ['conversion', 'guide'],
        cta: 'Start Your First Investment',
        incentive: segment === 'high_capacity' ? '$500 investment bonus' : '$100 investment bonus'
      },
      {
        day: 46,
        template: 'personal_consultant_offer',
        subject: 'Personal Invitation: Free 30-Min Investment Strategy Call',
        tags: ['personal', 'consultation']
      },
      {
        day: 49,
        template: 'investment_matching_bonus',
        subject: '🎁 Limited Time: We\'ll Match Your First Investment Up to $1,000',
        tags: ['incentive', 'urgency']
      },
      {
        day: 53,
        template: 'last_chance_reengagement',
        subject: 'Last Chance: Your African Investment Opportunity Expires Tomorrow',
        tags: ['urgency', 'reengagement']
      },

      // Week 9-12: Retention & Upselling
      {
        day: 56,
        template: 'weekly_opportunities_digest',
        subject: 'Weekly Digest: 5 New Investment Opportunities Added',
        tags: ['opportunities', 'regular']
      },
      {
        day: 63,
        template: 'market_update_quarterly',
        subject: 'Q1 African Markets Update: Trends & Opportunities',
        tags: ['market_update', 'insights']
      },
      {
        day: 70,
        template: 'community_success_stories',
        subject: 'Community Success: How Our Investors Are Building Wealth',
        tags: ['community', 'success']
      },
      {
        day: 77,
        template: 'advanced_investment_strategies',
        subject: 'Advanced Strategies: Diversification Across African Markets',
        tags: ['advanced', 'education']
      },
      {
        day: 84,
        template: 'portfolio_optimization_guide',
        subject: 'Optimize Your Portfolio: End-of-Quarter Review Guide',
        tags: ['optimization', 'guide']
      }
    ];
  }

  // ============================================
  // BEHAVIORAL TRIGGERS
  // ============================================

  /**
   * Set up behavioral email triggers
   */
  async setupBehavioralTriggers(userId) {
    const triggers = [
      {
        name: 'landing_page_visit',
        condition: 'page_view',
        page: '/invest/*',
        delay: 3600000, // 1 hour delay
        template: 'abandoned_opportunity_reminder',
        active: true
      },
      {
        name: 'investment_application_abandoned',
        condition: 'form_abandonment',
        form: 'investment_application',
        delay: 1800000, // 30 minutes delay
        template: 'complete_investment_application',
        active: true
      },
      {
        name: 'email_engagement_drop',
        condition: 'email_inactive',
        threshold: '7_days',
        template: 'reengagement_special_offer',
        active: true
      },
      {
        name: 'high_value_opportunity_match',
        condition: 'opportunity_match',
        score: 90,
        template: 'exclusive_opportunity_match',
        active: true
      }
    ];

    for (const trigger of triggers) {
      await FirebaseService.db.collection('behavioral_triggers')
        .doc(`${userId}_${trigger.name}`)
        .set({
          ...trigger,
          userId,
          createdAt: new Date().toISOString(),
          triggerCount: 0,
          lastTriggered: null
        });
    }
  }

  /**
   * Process behavioral trigger events
   */
  async processBehaviorTrigger(userId, eventType, eventData) {
    try {
      const triggersQuery = await FirebaseService.db
        .collection('behavioral_triggers')
        .where('userId', '==', userId)
        .where('condition', '==', eventType)
        .where('active', '==', true)
        .get();

      for (const triggerDoc of triggersQuery.docs) {
        const trigger = triggerDoc.data();
        
        // Check if trigger conditions are met
        if (this.evaluateTriggerCondition(trigger, eventData)) {
          await this.scheduleBehavioralEmail(userId, trigger, eventData);
          
          // Update trigger stats
          await triggerDoc.ref.update({
            triggerCount: trigger.triggerCount + 1,
            lastTriggered: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error processing behavior trigger:', error);
    }
  }

  // ============================================
  // EMAIL PERSONALIZATION
  // ============================================

  /**
   * Segment leads for personalized content
   */
  segmentLead(leadData) {
    const capacity = leadData.investmentCapacity || 0;
    const source = leadData.source || '';
    
    if (capacity >= 250000) return 'high_capacity';
    if (capacity >= 50000) return 'mid_capacity';  
    if (capacity >= 10000) return 'starter_investor';
    
    if (source.includes('referral')) return 'referred';
    if (source.includes('linkedin')) return 'professional';
    
    return 'general';
  }

  /**
   * Generate personalization data for email templates
   */
  generatePersonalizations(leadData) {
    const segment = this.segmentLead(leadData);
    
    return {
      firstName: leadData.fullName?.split(' ')[0] || 'Investor',
      investmentRange: this.getInvestmentRangeText(leadData.investmentCapacity),
      recommendedOpportunities: this.getRecommendedOpportunities(segment),
      incentiveAmount: this.getIncentiveAmount(segment),
      riskProfile: this.getRiskProfile(leadData.investmentCapacity),
      timezone: leadData.timezone || 'UTC',
      preferredIndustries: this.getPreferredIndustries(segment)
    };
  }

  /**
   * Personalize email content based on recipient data
   */
  personalizeEmailContent(template, personalizations, segmentData) {
    let content = template.content;
    let subject = template.subject;

    // Replace personalization tokens
    Object.keys(personalizations).forEach(key => {
      const token = `{{${key}}}`;
      const value = personalizations[key];
      content = content.replace(new RegExp(token, 'g'), value);
      subject = subject.replace(new RegExp(token, 'g'), value);
    });

    // Segment-specific content variations
    if (segmentData.segment === 'high_capacity') {
      content = this.addVIPContent(content);
    } else if (segmentData.segment === 'starter_investor') {
      content = this.addBeginnerContent(content);
    }

    return { content, subject };
  }

  // ============================================
  // EMAIL DELIVERY & TRACKING
  // ============================================

  /**
   * Schedule email for delivery
   */
  async scheduleEmail(recipientId, emailData, delayDays = 0) {
    const deliveryTime = new Date();
    deliveryTime.setDate(deliveryTime.getDate() + delayDays);

    const emailJob = {
      recipientId,
      template: emailData.template,
      subject: emailData.subject,
      scheduledFor: deliveryTime.toISOString(),
      status: 'scheduled',
      tags: emailData.tags || [],
      attachments: emailData.attachments || [],
      cta: emailData.cta || null,
      incentive: emailData.incentive || null,
      createdAt: new Date().toISOString()
    };

    const docRef = await FirebaseService.db.collection('scheduled_emails').add(emailJob);
    
    // Track email scheduled event
    growthEngine.trackGrowthEvent('email_scheduled', {
      emailId: docRef.id,
      recipientId,
      template: emailData.template,
      delayDays
    });

    return docRef.id;
  }

  /**
   * Track email engagement events
   */
  async trackEmailEvent(emailId, eventType, eventData = {}) {
    const event = {
      emailId,
      eventType,
      timestamp: new Date().toISOString(),
      ...eventData
    };

    await FirebaseService.db.collection('email_events').add(event);

    // Update email stats
    await this.updateEmailStats(emailId, eventType);

    // Process behavioral triggers based on engagement
    if (eventData.userId) {
      await this.processBehaviorTrigger(eventData.userId, `email_${eventType}`, event);
    }
  }

  /**
   * Update email campaign statistics
   */
  async updateEmailStats(emailId, eventType) {
    const emailDoc = await FirebaseService.db.collection('scheduled_emails').doc(emailId).get();
    
    if (emailDoc.exists) {
      const currentStats = emailDoc.data().stats || {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        unsubscribed: 0
      };

      if (eventType in currentStats) {
        currentStats[eventType]++;
        
        await emailDoc.ref.update({ stats: currentStats });
      }
    }
  }

  // ============================================
  // A/B TESTING FOR EMAILS
  // ============================================

  /**
   * Create A/B test for email templates
   */
  async createEmailABTest(testName, templateA, templateB, segment, splitRatio = 0.5) {
    const abTest = {
      testName,
      templateA,
      templateB,
      segment,
      splitRatio,
      status: 'active',
      createdAt: new Date().toISOString(),
      results: {
        variantA: { sent: 0, opened: 0, clicked: 0, converted: 0 },
        variantB: { sent: 0, opened: 0, clicked: 0, converted: 0 }
      }
    };

    const docRef = await FirebaseService.db.collection('email_ab_tests').add(abTest);
    return docRef.id;
  }

  /**
   * Select A/B test variant for recipient
   */
  selectABTestVariant(recipientId, testId, splitRatio) {
    // Use recipient ID hash to ensure consistent variant selection
    const hash = recipientId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    return Math.abs(hash) % 100 < (splitRatio * 100) ? 'A' : 'B';
  }

  // ============================================
  // EMAIL TEMPLATES
  // ============================================

  loadEmailTemplates() {
    this.templates = {
      welcome_african_investment_guide: {
        subject: 'Welcome {{firstName}}! Your African Investment Guide Inside',
        content: `
          <h1>Welcome to Bvester, {{firstName}}!</h1>
          
          <p>Thank you for joining thousands of investors who are building wealth while supporting African entrepreneurship.</p>
          
          <p>As promised, here's your exclusive <strong>African Investment Opportunity Report</strong> with:</p>
          
          <ul>
            <li>🎯 Top 10 investment opportunities currently available</li>
            <li>📊 Market analysis and growth projections for 2024</li>
            <li>🔍 Due diligence checklist for SME investments</li>
            <li>💰 Expected returns by industry and country</li>
          </ul>
          
          <p>Based on your investment capacity of {{investmentRange}}, I've identified several opportunities that match your profile. You'll receive personalized recommendations over the next few days.</p>
          
          <div class="cta-button">
            <a href="https://bvester.com/opportunities?ref={{firstName}}">View Current Opportunities</a>
          </div>
          
          <p>Best regards,<br>
          Sarah Chen, Investment Relations<br>
          Bvester Investment Platform</p>
        `,
        attachments: ['African_Investment_Opportunity_Report.pdf']
      },

      success_story_sarah_18_roi: {
        subject: 'How Sarah Earned 18% ROI Investing in Nigerian Tech',
        content: `
          <h1>Real Success Story: 18% Returns from Nigerian Fintech</h1>
          
          <p>Hi {{firstName}},</p>
          
          <p>I wanted to share an inspiring success story from one of our investors that might interest you.</p>
          
          <div class="success-story">
            <h3>Sarah Chen - Software Engineer, Toronto</h3>
            <p><strong>Investment:</strong> $25,000 across 5 African SMEs</p>
            <p><strong>Timeline:</strong> 12 months</p>
            <p><strong>Returns:</strong> 18% ROI ($4,500 profit)</p>
            
            <blockquote>
              "I was initially hesitant about investing outside of traditional markets, but Bvester's due diligence process gave me confidence. The readiness scores helped me identify businesses with strong fundamentals. My best performer was a Nigerian fintech company that grew 300% in revenue."
            </blockquote>
          </div>
          
          <p>What made Sarah successful:</p>
          <ul>
            <li>✅ Diversified across 5 different businesses</li>
            <li>✅ Focused on businesses with readiness scores above 80</li>
            <li>✅ Invested in familiar industries (technology)</li>
            <li>✅ Started with amounts she was comfortable with</li>
          </ul>
          
          <p>Similar opportunities are available for investors in your capacity range ({{investmentRange}}). Would you like to see businesses that match your profile?</p>
          
          <div class="cta-button">
            <a href="https://bvester.com/matched-opportunities?ref={{firstName}}">See My Matched Opportunities</a>
          </div>
        `
      },

      first_investment_vip_guide: {
        subject: 'VIP Investor Guide: Your First African Investment',
        content: `
          <h1>Ready to Make Your First Investment, {{firstName}}?</h1>
          
          <p>Based on your high investment capacity ({{investmentRange}}), I've prepared a personalized investment strategy for you.</p>
          
          <div class="vip-section">
            <h3>🎯 Curated Opportunities for High-Capacity Investors</h3>
            <p>I've identified 3 premium opportunities perfect for your portfolio:</p>
            
            <div class="opportunity">
              <h4>TechFlow Nigeria - Fintech Series A</h4>
              <p>Investment Range: $50,000 - $200,000<br>
              Projected ROI: 22-28%<br>
              Readiness Score: 94/100</p>
            </div>
            
            <div class="opportunity">
              <h4>AgriBoost Kenya - Smart Agriculture</h4>
              <p>Investment Range: $75,000 - $300,000<br>
              Projected ROI: 18-25%<br>
              Readiness Score: 89/100</p>
            </div>
          </div>
          
          <div class="vip-bonus">
            <h3>🎁 VIP Investment Bonus</h3>
            <p>As a high-capacity investor, you qualify for:</p>
            <ul>
              <li>💰 ${{incentiveAmount}} investment matching bonus</li>
              <li>📞 Personal investment consultant</li>
              <li>🔒 Access to pre-vetted exclusive deals</li>
              <li>📊 Quarterly portfolio review meetings</li>
            </ul>
          </div>
          
          <div class="cta-button">
            <a href="https://bvester.com/vip-investment?ref={{firstName}}">Schedule VIP Consultation</a>
          </div>
        `
      },

      abandoned_opportunity_reminder: {
        subject: 'You were looking at this opportunity...',
        content: `
          <h1>Don't miss out on this opportunity, {{firstName}}</h1>
          
          <p>I noticed you were reviewing investment opportunities earlier. The business you were looking at has limited spots remaining.</p>
          
          <div class="opportunity-reminder">
            <h3>TechFlow Nigeria</h3>
            <p>Fintech • Lagos, Nigeria<br>
            Seeking: $150,000 • Readiness Score: 87/100</p>
            <p><strong>Only 3 investment slots remaining</strong></p>
          </div>
          
          <p>This business has shown consistent growth and has a strong management team. Based on similar companies in our platform, investors have seen average returns of 19%.</p>
          
          <div class="urgency">
            <p>⏰ <strong>This opportunity closes in 48 hours</strong></p>
          </div>
          
          <div class="cta-button">
            <a href="https://bvester.com/invest/techflow-nigeria?ref={{firstName}}">Complete Your Investment</a>
          </div>
        `
      }
    };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  getInvestmentRangeText(capacity) {
    if (capacity >= 250000) return '$250,000+';
    if (capacity >= 100000) return '$100,000 - $250,000';
    if (capacity >= 50000) return '$50,000 - $100,000';
    if (capacity >= 10000) return '$10,000 - $50,000';
    return '$1,000 - $10,000';
  }

  getIncentiveAmount(segment) {
    const incentives = {
      high_capacity: '1000',
      mid_capacity: '500',
      starter_investor: '250',
      referred: '300',
      professional: '400',
      general: '100'
    };
    return incentives[segment] || '100';
  }

  getRecommendedOpportunities(segment) {
    // Return opportunities based on segment
    return [];
  }

  getRiskProfile(capacity) {
    if (capacity >= 100000) return 'moderate_aggressive';
    if (capacity >= 25000) return 'moderate';
    return 'conservative';
  }

  getPreferredIndustries(segment) {
    const preferences = {
      high_capacity: ['Technology', 'Financial Services', 'Manufacturing'],
      professional: ['Technology', 'Healthcare', 'Education'],
      general: ['Agriculture', 'Retail', 'Services']
    };
    return preferences[segment] || ['Technology', 'Agriculture'];
  }

  evaluateTriggerCondition(trigger, eventData) {
    // Implement trigger condition evaluation logic
    return true;
  }

  async scheduleBehavioralEmail(userId, trigger, eventData) {
    // Schedule behavioral trigger email
    return this.scheduleEmail(userId, {
      template: trigger.template,
      subject: `Behavioral: ${trigger.name}`,
      tags: ['behavioral', trigger.name]
    });
  }

  addVIPContent(content) {
    return content.replace('{{vip_content}}', '<div class="vip-section">VIP exclusive content here</div>');
  }

  addBeginnerContent(content) {
    return content.replace('{{beginner_content}}', '<div class="beginner-tips">Beginner-friendly tips here</div>');
  }
}

// Export singleton instance
export const emailMarketing = new EmailMarketingAutomation();