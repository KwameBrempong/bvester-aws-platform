/**
 * 📊 REPORT GENERATION SERVICE
 * Generate business health reports and summaries
 * Free vs Premium report tiers
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

class ReportGenerationService {
  constructor() {
    this.reportTemplates = {
      free: {
        title: 'Basic Business Health Report',
        sections: ['overview', 'score', 'basic_recommendations'],
        branding: 'Bvester - Basic Report',
        downloadable: false
      },
      premium: {
        title: 'Comprehensive Business Health Report',
        sections: ['overview', 'score', 'detailed_analysis', 'recommendations', 'action_plan', 'benchmarks'],
        branding: 'Bvester - Premium Report',
        downloadable: true
      }
    };
  }

  /**
   * Generate business health report
   */
  async generateBusinessHealthReport(assessmentResult, userProfile, isPremium = false) {
    try {
      console.log('Generating business health report...');

      const template = isPremium ? this.reportTemplates.premium : this.reportTemplates.free;
      const reportData = {
        ...assessmentResult,
        userProfile,
        generatedAt: new Date(),
        template
      };

      if (isPremium) {
        return await this.generatePremiumReport(reportData);
      } else {
        return await this.generateFreeReport(reportData);
      }

    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Generate FREE tier report (basic, non-downloadable)
   */
  async generateFreeReport(reportData) {
    const { overallScore, scoreLevel, categories, recommendations, businessInfo, generatedAt } = reportData;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Business Health Report</title>
          <style>
            ${this.getReportStyles()}
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 60px;
              color: rgba(0, 0, 0, 0.1);
              z-index: -1;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="watermark">BVESTER FREE REPORT</div>

          <div class="report-container">
            <div class="header">
              <h1>🏥 Business Health Report</h1>
              <p class="business-name">${businessInfo.name}</p>
              <p class="report-date">Generated: ${generatedAt.toLocaleDateString()}</p>
              <p class="report-tier">FREE REPORT - Upgrade for detailed analysis</p>
            </div>

            <div class="score-section">
              <div class="score-circle ${this.getScoreClass(overallScore)}">
                <span class="score-number">${overallScore}</span>
                <span class="score-total">/100</span>
              </div>
              <h2>${scoreLevel}</h2>
            </div>

            <div class="categories-section">
              <h3>📊 Score Breakdown</h3>
              ${categories.map(cat => `
                <div class="category-item">
                  <span class="category-name">${cat.name}</span>
                  <div class="category-bar">
                    <div class="category-fill ${this.getScoreClass(cat.score)}" style="width: ${cat.score}%"></div>
                  </div>
                  <span class="category-score">${cat.score}</span>
                </div>
              `).join('')}
            </div>

            <div class="recommendations-section">
              <h3>💡 Key Recommendations</h3>
              ${recommendations.slice(0, 3).map(rec => `
                <div class="recommendation-item">
                  <h4>${rec.title}</h4>
                  <p>${rec.description}</p>
                </div>
              `).join('')}

              ${recommendations.length > 3 ? `
                <div class="upgrade-prompt">
                  <p><strong>🔓 Unlock ${recommendations.length - 3} more detailed recommendations with Premium!</strong></p>
                </div>
              ` : ''}
            </div>

            <div class="footer">
              <p>📱 Download the Bvester app to improve your business health</p>
              <p>💎 Upgrade to Premium for downloadable reports and detailed analysis</p>
              <p class="website">www.bvester.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return {
      type: 'free',
      html,
      downloadable: false,
      shareText: `My business scored ${overallScore}/100 on Bvester! 🚀 Check your business health: www.bvester.com`
    };
  }

  /**
   * Generate PREMIUM tier report (comprehensive, downloadable)
   */
  async generatePremiumReport(reportData) {
    const {
      overallScore,
      scoreLevel,
      categories,
      recommendations,
      investmentReadiness,
      businessInfo,
      generatedAt
    } = reportData;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Comprehensive Business Health Report</title>
          <style>
            ${this.getReportStyles()}
            .premium-badge {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <div class="header-flex">
                <div>
                  <h1>🏥 Business Health Report</h1>
                  <p class="business-name">${businessInfo.name}</p>
                  <p class="report-date">Generated: ${generatedAt.toLocaleDateString()}</p>
                </div>
                <span class="premium-badge">PREMIUM REPORT</span>
              </div>
            </div>

            <div class="executive-summary">
              <h2>📋 Executive Summary</h2>
              <div class="summary-grid">
                <div class="summary-item">
                  <h4>Overall Health Score</h4>
                  <p class="score-large">${overallScore}/100</p>
                  <p>${scoreLevel}</p>
                </div>
                <div class="summary-item">
                  <h4>Investment Readiness</h4>
                  <p class="score-large">${investmentReadiness.score}/100</p>
                  <p>${investmentReadiness.level}</p>
                </div>
                <div class="summary-item">
                  <h4>Strongest Area</h4>
                  <p>${this.getTopCategory(categories).name}</p>
                  <p>${this.getTopCategory(categories).score}/100</p>
                </div>
              </div>
            </div>

            <div class="score-section">
              <div class="score-circle ${this.getScoreClass(overallScore)}">
                <span class="score-number">${overallScore}</span>
                <span class="score-total">/100</span>
              </div>
              <h2>${scoreLevel}</h2>
            </div>

            <div class="categories-section">
              <h3>📊 Detailed Score Analysis</h3>
              ${categories.map(cat => `
                <div class="category-detailed">
                  <div class="category-header">
                    <span class="category-name">${cat.name}</span>
                    <span class="category-score">${cat.score}/100</span>
                  </div>
                  <div class="category-bar">
                    <div class="category-fill ${this.getScoreClass(cat.score)}" style="width: ${cat.score}%"></div>
                  </div>
                  <p class="category-analysis">${this.getCategoryAnalysis(cat)}</p>
                </div>
              `).join('')}
            </div>

            <div class="investment-readiness">
              <h3>💰 Investment Readiness Analysis</h3>
              <div class="readiness-score">
                <span class="readiness-number">${investmentReadiness.score}</span>
                <span class="readiness-level">${investmentReadiness.level}</span>
              </div>

              ${investmentReadiness.requirements.length > 0 ? `
                <h4>Requirements for Investment Readiness:</h4>
                <ul>
                  ${investmentReadiness.requirements.map(req => `<li>${req}</li>`).join('')}
                </ul>
              ` : ''}
            </div>

            <div class="recommendations-section">
              <h3>🎯 Detailed Recommendations</h3>
              ${recommendations.map((rec, index) => `
                <div class="recommendation-detailed">
                  <div class="rec-header">
                    <h4>${index + 1}. ${rec.title}</h4>
                    <span class="priority-badge priority-${rec.priority}">${rec.priority.toUpperCase()}</span>
                  </div>
                  <p>${rec.description}</p>
                  ${rec.action ? `<p class="action-item"><strong>Action:</strong> ${rec.action}</p>` : ''}
                </div>
              `).join('')}
            </div>

            <div class="action-plan">
              <h3>📋 30-Day Action Plan</h3>
              ${this.generateActionPlan(recommendations).map((action, index) => `
                <div class="action-item">
                  <span class="action-number">${index + 1}</span>
                  <div class="action-content">
                    <h4>${action.title}</h4>
                    <p>${action.description}</p>
                    <p class="timeline">Timeline: ${action.timeline}</p>
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="benchmarks">
              <h3>📈 Industry Benchmarks</h3>
              <p>Compared to similar businesses in Ghana:</p>
              <div class="benchmark-grid">
                ${this.generateBenchmarks(overallScore, businessInfo.industry).map(bench => `
                  <div class="benchmark-item">
                    <h4>${bench.metric}</h4>
                    <p class="your-score">Your Score: ${bench.yourScore}</p>
                    <p class="industry-avg">Industry Avg: ${bench.industryAvg}</p>
                    <p class="performance ${bench.performance}">${bench.status}</p>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="footer">
              <p><strong>Next Steps:</strong> Schedule a consultation with our business development team</p>
              <p>📱 Continue tracking your progress with the Bvester app</p>
              <p class="website">www.bvester.com | Premium Business Development Platform</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Generate PDF for premium users
    const { uri } = await Print.createAsync({
      html,
      width: 612,
      height: 792,
      margins: {
        left: 50,
        top: 50,
        right: 50,
        bottom: 50,
      },
    });

    return {
      type: 'premium',
      html,
      pdfUri: uri,
      downloadable: true,
      shareText: `📊 Just completed my comprehensive business health assessment! Score: ${overallScore}/100 💪 Ready to grow with Bvester!`
    };
  }

  /**
   * Share/Download report
   */
  async shareReport(report) {
    try {
      if (report.type === 'premium' && report.pdfUri) {
        // Share PDF for premium users
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(report.pdfUri, {
            dialogTitle: 'Share Business Health Report',
            mimeType: 'application/pdf',
          });
        }
      } else {
        // Share text summary for free users
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(report.shareText);
        }
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      throw error;
    }
  }

  /**
   * Get report styles CSS
   */
  getReportStyles() {
    return `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background: #f8f9fa;
      }

      .report-container {
        background: white;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        text-align: center;
      }

      .header-flex {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .business-name {
        font-size: 24px;
        font-weight: bold;
        margin: 10px 0;
      }

      .report-date, .report-tier {
        opacity: 0.9;
        margin: 5px 0;
      }

      .score-section {
        text-align: center;
        padding: 40px;
        background: #f8f9fa;
      }

      .score-circle {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        border: 8px solid;
      }

      .score-circle.excellent { border-color: #48bb78; background: #f0fff4; }
      .score-circle.good { border-color: #ed8936; background: #fffaf0; }
      .score-circle.fair { border-color: #ecc94b; background: #fffff0; }
      .score-circle.poor { border-color: #e53e3e; background: #fff5f5; }

      .score-number {
        font-size: 36px;
        font-weight: bold;
        line-height: 1;
      }

      .score-total {
        font-size: 18px;
        opacity: 0.7;
      }

      .categories-section,
      .recommendations-section,
      .investment-readiness,
      .action-plan,
      .benchmarks,
      .executive-summary {
        padding: 30px;
        border-bottom: 1px solid #e2e8f0;
      }

      .category-item,
      .category-detailed {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
        gap: 15px;
      }

      .category-detailed {
        flex-direction: column;
        align-items: stretch;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 20px;
      }

      .category-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .category-name {
        font-weight: 600;
        min-width: 150px;
      }

      .category-bar {
        flex: 1;
        height: 8px;
        background: #e2e8f0;
        border-radius: 4px;
        overflow: hidden;
      }

      .category-fill {
        height: 100%;
        transition: width 0.3s ease;
      }

      .category-fill.excellent { background: #48bb78; }
      .category-fill.good { background: #ed8936; }
      .category-fill.fair { background: #ecc94b; }
      .category-fill.poor { background: #e53e3e; }

      .category-score {
        font-weight: bold;
        min-width: 40px;
        text-align: right;
      }

      .category-analysis {
        font-size: 14px;
        color: #666;
        margin-top: 5px;
      }

      .recommendation-item,
      .recommendation-detailed {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 15px;
      }

      .rec-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .priority-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
        text-transform: uppercase;
      }

      .priority-high { background: #fed7d7; color: #e53e3e; }
      .priority-medium { background: #feebc8; color: #ed8936; }
      .priority-low { background: #c6f6d5; color: #48bb78; }

      .action-item {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .action-number {
        background: #667eea;
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        flex-shrink: 0;
      }

      .timeline {
        color: #666;
        font-style: italic;
      }

      .summary-grid,
      .benchmark-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }

      .summary-item,
      .benchmark-item {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
      }

      .score-large {
        font-size: 28px;
        font-weight: bold;
        color: #667eea;
        margin: 10px 0;
      }

      .readiness-score {
        text-align: center;
        margin: 20px 0;
      }

      .readiness-number {
        font-size: 48px;
        font-weight: bold;
        color: #667eea;
      }

      .readiness-level {
        display: block;
        font-size: 18px;
        font-weight: 600;
        margin-top: 10px;
      }

      .performance.above { color: #48bb78; }
      .performance.below { color: #e53e3e; }
      .performance.average { color: #ed8936; }

      .upgrade-prompt {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        margin-top: 20px;
      }

      .footer {
        background: #f8f9fa;
        padding: 30px;
        text-align: center;
        color: #666;
      }

      .website {
        font-weight: bold;
        color: #667eea;
        margin-top: 10px;
      }

      h1, h2, h3, h4 {
        color: #2d3748;
      }

      ul {
        padding-left: 20px;
      }

      li {
        margin-bottom: 8px;
      }
    `;
  }

  /**
   * Helper methods
   */
  getScoreClass(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  getTopCategory(categories) {
    return categories.reduce((top, cat) => cat.score > top.score ? cat : top, categories[0]);
  }

  getCategoryAnalysis(category) {
    const analyses = {
      'Financial Management': {
        80: 'Excellent financial control with consistent revenue and good cash flow management.',
        60: 'Good financial practices with room for improvement in cash flow consistency.',
        40: 'Basic financial management needs significant strengthening.',
        20: 'Poor financial control requires immediate attention.'
      },
      'Operations & Efficiency': {
        80: 'Highly efficient operations with systematic processes and good inventory management.',
        60: 'Generally efficient operations with some areas for optimization.',
        40: 'Basic operational structure needs improvement in efficiency.',
        20: 'Inefficient operations require major restructuring.'
      }
    };

    const categoryAnalyses = analyses[category.name] || {};
    const score = category.score;

    if (score >= 80) return categoryAnalyses[80] || 'Excellent performance in this area.';
    if (score >= 60) return categoryAnalyses[60] || 'Good performance with room for improvement.';
    if (score >= 40) return categoryAnalyses[40] || 'Needs improvement in this area.';
    return categoryAnalyses[20] || 'Requires significant attention and improvement.';
  }

  generateActionPlan(recommendations) {
    return recommendations.slice(0, 5).map((rec, index) => ({
      title: rec.title,
      description: rec.description,
      timeline: index < 2 ? 'Week 1-2' : index < 4 ? 'Week 3-4' : 'Week 4+'
    }));
  }

  generateBenchmarks(score, industry) {
    return [
      {
        metric: 'Overall Business Health',
        yourScore: score,
        industryAvg: 65,
        performance: score > 65 ? 'above' : score < 60 ? 'below' : 'average',
        status: score > 65 ? 'Above Average' : score < 60 ? 'Below Average' : 'Average'
      },
      {
        metric: 'Financial Management',
        yourScore: Math.round(score * 0.9),
        industryAvg: 62,
        performance: score * 0.9 > 62 ? 'above' : 'below',
        status: score * 0.9 > 62 ? 'Above Average' : 'Below Average'
      },
      {
        metric: 'Investment Readiness',
        yourScore: Math.round(score * 0.8),
        industryAvg: 45,
        performance: score * 0.8 > 45 ? 'above' : 'below',
        status: score * 0.8 > 45 ? 'Above Average' : 'Below Average'
      }
    ];
  }
}

// Create singleton instance
const reportGenerationService = new ReportGenerationService();

export { reportGenerationService };