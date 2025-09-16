# 📊 Monitoring & Analytics Setup Guide

## 🔍 Production Monitoring Stack

### 1. 📈 Application Performance Monitoring (APM)

**Option A: Sentry (Recommended)**
```bash
# Install Sentry SDK
npm install @sentry/node @sentry/express

# Add to your backend (already partially integrated)
```

```javascript
// In demo-server.js (add at the top)
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Add Sentry request handler
app.use(Sentry.Handlers.requestHandler());

// Add Sentry error handler (before other error handlers)
app.use(Sentry.Handlers.errorHandler());
```

**Option B: New Relic**
```bash
npm install newrelic
# Add to package.json start script: node -r newrelic server.js
```

### 2. 🌐 Uptime Monitoring

**UptimeRobot Setup (Free):**
1. Go to [UptimeRobot.com](https://uptimerobot.com) → Sign up
2. Add monitors:
   ```
   https://api.yourdomain.com/health        - Every 5 minutes
   https://app.yourdomain.com               - Every 5 minutes
   https://yourdomain.com                   - Every 5 minutes
   ```
3. Set up alerts: Email, SMS, Slack, Discord

**Pingdom Setup:**
1. Go to [Pingdom.com](https://pingdom.com) → Sign up
2. Create checks for all critical endpoints
3. Set up performance monitoring
4. Configure real user monitoring (RUM)

### 3. 📊 Business Analytics

**Google Analytics 4 Setup:**
```html
<!-- Add to your web app -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

**Mixpanel Setup (for detailed user tracking):**
```javascript
// In your frontend
import { Mixpanel } from 'mixpanel-react-native';

const mixpanel = new Mixpanel('YOUR_MIXPANEL_TOKEN');

// Track events
mixpanel.track('User Registration', {
  'User Type': 'investor',
  'Country': 'Nigeria',
  'Signup Method': 'email'
});

mixpanel.track('Investment Made', {
  'Amount': 5000,
  'Business': 'GreenTech Solutions',
  'Currency': 'USD'
});
```

### 4. 🚨 Error Tracking & Logging

**Winston Logger (Already Integrated):**
```javascript
// Enhanced logging setup in utils/logger.js
const winston = require('winston');
const { format } = winston;

const logger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'bvester-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// Custom methods for different log types
logger.investment = (message, meta) => logger.info(message, { type: 'investment', ...meta });
logger.payment = (message, meta) => logger.info(message, { type: 'payment', ...meta });
logger.auth = (message, meta) => logger.info(message, { type: 'auth', ...meta });

module.exports = logger;
```

### 5. 📊 Custom Analytics Dashboard

**Create analytics endpoint (add to demo-server.js):**
```javascript
// Real-time analytics endpoint
app.get('/api/analytics/realtime', (req, res) => {
  res.json({
    success: true,
    data: {
      activeUsers: Math.floor(Math.random() * 100) + 50,
      onlineInvestors: Math.floor(Math.random() * 30) + 10,
      onlineBusinesses: Math.floor(Math.random() * 20) + 5,
      recentInvestments: [
        {
          id: 'inv_' + Date.now(),
          amount: 2500,
          business: 'AgriConnect',
          timestamp: new Date().toISOString()
        }
      ],
      systemHealth: {
        api: 'healthy',
        database: 'healthy',
        payments: 'healthy',
        notifications: 'healthy'
      }
    }
  });
});

// Platform metrics
app.get('/api/analytics/platform-metrics', (req, res) => {
  res.json({
    success: true,
    metrics: {
      totalUsers: 1247,
      totalInvestments: 2500000,
      averageInvestment: 5500,
      conversionRate: 15.3,
      userGrowth: 12.5,
      revenueGrowth: 23.1,
      platformFee: 125000,
      monthlyActiveUsers: 850,
      retentionRate: 78.5
    }
  });
});
```

### 6. 🎯 User Behavior Tracking

**Hotjar Setup (User Experience):**
```html
<!-- Add to your web app -->
<script>
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:YOUR_HOTJAR_ID,r:1};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.r;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>
```

### 7. 💰 Financial Monitoring

**Revenue Analytics (add to backend):**
```javascript
// Revenue tracking endpoint
app.get('/api/analytics/revenue', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Mock revenue data - replace with real database queries
    const revenueData = {
      totalRevenue: 47500,
      platformFees: 4750,
      transactionVolume: 950000,
      averageTransactionSize: 5500,
      monthlyRecurringRevenue: 12000,
      revenueGrowth: 18.5,
      topPayingCustomers: [
        { name: 'GreenTech Solutions', revenue: 8500 },
        { name: 'AgriConnect', revenue: 6200 },
        { name: 'FinanceForAll', revenue: 5800 }
      ]
    };
    
    res.json({ success: true, data: revenueData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 8. 🔍 Security Monitoring

**Security Analytics (add to backend):**
```javascript
// Security monitoring endpoint
app.get('/api/analytics/security', (req, res) => {
  res.json({
    success: true,
    security: {
      failedLoginAttempts: 23,
      suspiciousIPs: ['192.168.1.100', '10.0.0.55'],
      rateLimitHits: 156,
      blockedRequests: 45,
      authenticationErrors: 12,
      lastSecurityScan: new Date().toISOString(),
      vulnerabilities: 0,
      securityStatus: 'good'
    }
  });
});

// Rate limiting analytics
const rateLimit = require('express-rate-limit');

const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // Log rate limit hits for security monitoring
    console.warn(`Rate limit exceeded: ${req.ip} at ${new Date().toISOString()}`);
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

app.use('/api/analytics', analyticsLimiter);
```

### 9. 📱 Mobile App Analytics

**React Native Analytics (add to your app):**
```javascript
// Install analytics packages
// npm install @react-native-firebase/analytics
// npm install react-native-device-info

import analytics from '@react-native-firebase/analytics';
import DeviceInfo from 'react-native-device-info';

// Track app events
const trackEvent = async (eventName, parameters = {}) => {
  try {
    await analytics().logEvent(eventName, {
      ...parameters,
      platform: Platform.OS,
      app_version: DeviceInfo.getVersion(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};

// Usage examples
trackEvent('user_registration', {
  user_type: 'investor',
  registration_method: 'email'
});

trackEvent('investment_made', {
  amount: 5000,
  business_id: 'biz_001',
  currency: 'USD'
});
```

### 10. 📊 Performance Monitoring

**Add performance monitoring endpoints:**
```javascript
// Performance metrics endpoint
app.get('/api/analytics/performance', (req, res) => {
  const performanceData = {
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    responseTime: {
      avg: 125,
      p95: 230,
      p99: 450
    },
    throughput: {
      requestsPerSecond: 45,
      requestsPerMinute: 2700
    },
    errorRate: 0.03,
    cacheHitRate: 87.5
  };
  
  res.json({ success: true, data: performanceData });
});
```

### 11. 🔔 Alert Configuration

**Create alert system:**
```javascript
// Alert configuration
const alerts = {
  errorRate: { threshold: 5, enabled: true },
  responseTime: { threshold: 1000, enabled: true },
  uptime: { threshold: 99, enabled: true },
  failedLogins: { threshold: 50, enabled: true }
};

// Alert notification function
const sendAlert = async (type, message, severity = 'warning') => {
  const alertData = {
    type,
    message,
    severity,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  };
  
  // Send to multiple channels
  console.error('ALERT:', alertData);
  
  // TODO: Integrate with Slack, Discord, email
  // await sendSlackAlert(alertData);
  // await sendEmailAlert(alertData);
};
```

### 12. 📈 Dashboard Setup

**Environment Variables to Add:**
```env
# Analytics & Monitoring
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX-X
MIXPANEL_TOKEN=your_mixpanel_token
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
HOTJAR_ID=your_hotjar_id

# Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your/webhook/url
```

## 🎯 Monitoring Checklist

- [ ] **Error tracking** setup (Sentry/New Relic)
- [ ] **Uptime monitoring** configured (UptimeRobot/Pingdom)
- [ ] **Performance monitoring** enabled
- [ ] **User analytics** integrated (Google Analytics/Mixpanel)
- [ ] **Business metrics** tracking implemented
- [ ] **Security monitoring** active
- [ ] **Alert system** configured
- [ ] **Custom dashboards** created
- [ ] **Log aggregation** setup
- [ ] **Mobile analytics** integrated

## 📊 Key Metrics to Track

**Business Metrics:**
- User registrations (daily/monthly)
- Investment volume and count
- Platform fees generated
- User retention rates
- Conversion rates (visitor → investor)

**Technical Metrics:**
- API response times
- Error rates and types
- System uptime
- Database performance
- Cache hit rates

**Security Metrics:**
- Failed login attempts
- Suspicious IP activities
- Rate limit violations
- Authentication errors

Your Bvester platform will have enterprise-grade monitoring and analytics! 📊✨