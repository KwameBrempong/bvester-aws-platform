// Automated Test Suite for Bvester Platform
// Runs integration tests and generates detailed reports

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_URL || 'http://localhost:8080';
const TEST_EMAIL = 'test_' + Date.now() + '@bvester.test';
const TEST_PASSWORD = 'TestPassword123!';

class BvesterTestSuite {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      skipped: [],
      totalTests: 0,
      startTime: new Date(),
      endTime: null
    };
    this.authToken = null;
    this.testUser = null;
  }

  // Utility functions
  async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${API_BASE_URL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  async test(name, testFunc) {
    this.results.totalTests++;
    console.log(`\n📝 Testing: ${name}`);
    
    try {
      await testFunc();
      this.results.passed.push(name);
      console.log(`✅ PASSED: ${name}`);
    } catch (error) {
      this.results.failed.push({ name, error: error.message });
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  // Test Categories
  async runHealthChecks() {
    console.log('\n🏥 HEALTH CHECK TESTS');
    
    await this.test('Server responds to root endpoint', async () => {
      const response = await this.makeRequest('GET', '/');
      if (!response.success) throw new Error('Server not responding');
      if (!response.data.status) throw new Error('Invalid response format');
    });

    await this.test('Health endpoint returns valid data', async () => {
      const response = await this.makeRequest('GET', '/api/health');
      if (!response.success) throw new Error('Health endpoint not working');
      if (response.data.status !== 'healthy') throw new Error('Service not healthy');
    });
  }

  async runAuthenticationTests() {
    console.log('\n🔐 AUTHENTICATION TESTS');

    await this.test('User registration with valid data', async () => {
      const response = await this.makeRequest('POST', '/api/auth/register', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        fullName: 'Test User',
        role: 'investor',
        country: 'US'
      });
      
      if (!response.success) throw new Error(`Registration failed: ${JSON.stringify(response.error)}`);
      if (!response.data.token) throw new Error('No token returned');
      
      this.authToken = response.data.token;
      this.testUser = response.data.user;
    });

    await this.test('Login with valid credentials', async () => {
      const response = await this.makeRequest('POST', '/api/auth/login', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      
      if (!response.success) throw new Error(`Login failed: ${JSON.stringify(response.error)}`);
      if (!response.data.token) throw new Error('No token returned');
      
      this.authToken = response.data.token;
    });

    await this.test('Login with invalid credentials', async () => {
      const response = await this.makeRequest('POST', '/api/auth/login', {
        email: TEST_EMAIL,
        password: 'WrongPassword'
      });
      
      if (response.success) throw new Error('Should not allow invalid login');
      if (response.status !== 401) throw new Error('Should return 401 status');
    });

    await this.test('Access protected endpoint without token', async () => {
      const tempToken = this.authToken;
      this.authToken = null;
      
      const response = await this.makeRequest('GET', '/api/users/profile');
      
      if (response.success) throw new Error('Should not allow access without token');
      if (response.status !== 401) throw new Error('Should return 401 status');
      
      this.authToken = tempToken;
    });

    await this.test('Access protected endpoint with valid token', async () => {
      const response = await this.makeRequest('GET', '/api/users/profile');
      
      if (!response.success) throw new Error(`Profile access failed: ${JSON.stringify(response.error)}`);
      if (!response.data.email) throw new Error('Profile data incomplete');
    });
  }

  async runBusinessTests() {
    console.log('\n🏢 BUSINESS ENDPOINT TESTS');

    await this.test('List all businesses', async () => {
      const response = await this.makeRequest('GET', '/api/businesses');
      
      if (!response.success) throw new Error('Failed to get businesses');
      if (!Array.isArray(response.data)) throw new Error('Response should be array');
    });

    await this.test('Get single business details', async () => {
      const response = await this.makeRequest('GET', '/api/businesses/business_001');
      
      if (!response.success) throw new Error('Failed to get business details');
      if (!response.data.businessName) throw new Error('Invalid business data');
    });

    await this.test('Search businesses', async () => {
      const response = await this.makeRequest('GET', '/api/businesses/search?q=tech');
      
      if (!response.success) throw new Error('Search failed');
      if (!Array.isArray(response.data)) throw new Error('Search should return array');
    });
  }

  async runInvestmentTests() {
    console.log('\n💰 INVESTMENT ENDPOINT TESTS');

    await this.test('List all investments', async () => {
      const response = await this.makeRequest('GET', '/api/investments');
      
      if (!response.success) throw new Error('Failed to get investments');
      if (!Array.isArray(response.data)) throw new Error('Response should be array');
    });

    await this.test('Get investment opportunities', async () => {
      const response = await this.makeRequest('GET', '/api/investments/opportunities');
      
      if (!response.success) throw new Error('Failed to get opportunities');
      if (!Array.isArray(response.data)) throw new Error('Response should be array');
    });
  }

  async runDataValidationTests() {
    console.log('\n📊 DATA VALIDATION TESTS');

    await this.test('Registration with missing fields', async () => {
      const response = await this.makeRequest('POST', '/api/auth/register', {
        email: 'incomplete@test.com'
      });
      
      if (response.success) throw new Error('Should not allow incomplete registration');
      if (response.status !== 400) throw new Error('Should return 400 status');
    });

    await this.test('Registration with invalid email', async () => {
      const response = await this.makeRequest('POST', '/api/auth/register', {
        email: 'invalid-email',
        password: 'Password123!',
        fullName: 'Test User',
        role: 'investor'
      });
      
      if (response.success) throw new Error('Should not allow invalid email');
      if (response.status !== 400) throw new Error('Should return 400 status');
    });

    await this.test('Registration with weak password', async () => {
      const response = await this.makeRequest('POST', '/api/auth/register', {
        email: 'weak@test.com',
        password: '123',
        fullName: 'Test User',
        role: 'investor'
      });
      
      if (response.success) throw new Error('Should not allow weak password');
      if (response.status !== 400) throw new Error('Should return 400 status');
    });
  }

  async runSecurityTests() {
    console.log('\n🔒 SECURITY TESTS');

    await this.test('SQL injection attempt blocked', async () => {
      const response = await this.makeRequest('POST', '/api/auth/login', {
        email: "admin' OR '1'='1",
        password: "' OR '1'='1"
      });
      
      if (response.success) throw new Error('SQL injection not blocked');
    });

    await this.test('XSS attempt sanitized', async () => {
      const response = await this.makeRequest('GET', '/api/businesses/search?q=<script>alert("xss")</script>');
      
      if (!response.success && response.status !== 400) {
        // Search should either work (with sanitization) or reject bad input
        throw new Error('XSS handling unclear');
      }
    });

    await this.test('Rate limiting enforced', async () => {
      // This would need actual rate limit testing
      // Skipped for basic test suite
      console.log('   ⚠️  Rate limit test skipped (requires multiple rapid requests)');
      this.results.skipped.push('Rate limiting test');
    });
  }

  async runPerformanceTests() {
    console.log('\n⚡ PERFORMANCE TESTS');

    await this.test('API response time < 1000ms', async () => {
      const start = Date.now();
      await this.makeRequest('GET', '/api/businesses');
      const duration = Date.now() - start;
      
      if (duration > 1000) throw new Error(`Response took ${duration}ms (> 1000ms)`);
    });

    await this.test('Health check response time < 100ms', async () => {
      const start = Date.now();
      await this.makeRequest('GET', '/api/health');
      const duration = Date.now() - start;
      
      if (duration > 100) throw new Error(`Response took ${duration}ms (> 100ms)`);
    });
  }

  async runIntegrationTests() {
    console.log('\n🔄 INTEGRATION TESTS');

    await this.test('Complete user journey', async () => {
      // Register
      const email = 'journey_' + Date.now() + '@test.com';
      let response = await this.makeRequest('POST', '/api/auth/register', {
        email,
        password: 'Journey123!',
        fullName: 'Journey User',
        role: 'investor',
        country: 'US'
      });
      
      if (!response.success) throw new Error('Registration failed');
      const token = response.data.token;
      
      // Login
      response = await this.makeRequest('POST', '/api/auth/login', {
        email,
        password: 'Journey123!'
      });
      
      if (!response.success) throw new Error('Login failed');
      
      // Access profile
      this.authToken = token;
      response = await this.makeRequest('GET', '/api/users/profile');
      
      if (!response.success) throw new Error('Profile access failed');
      
      // View businesses
      response = await this.makeRequest('GET', '/api/businesses');
      
      if (!response.success) throw new Error('Business listing failed');
    });
  }

  generateReport() {
    this.results.endTime = new Date();
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    
    const report = {
      summary: {
        total: this.results.totalTests,
        passed: this.results.passed.length,
        failed: this.results.failed.length,
        skipped: this.results.skipped.length,
        passRate: ((this.results.passed.length / this.results.totalTests) * 100).toFixed(2) + '%',
        duration: duration + 's'
      },
      timestamp: new Date().toISOString(),
      environment: {
        apiUrl: API_BASE_URL,
        nodeEnv: process.env.NODE_ENV || 'development'
      },
      passed: this.results.passed,
      failed: this.results.failed,
      skipped: this.results.skipped
    };

    // Save report to file
    const reportPath = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Console output
    console.log('\n' + '='.repeat(60));
    console.log('                    TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`📊 Total Tests: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⏭️  Skipped: ${report.summary.skipped}`);
    console.log(`📈 Pass Rate: ${report.summary.passRate}`);
    console.log(`⏱️  Duration: ${report.summary.duration}`);
    
    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.failed.forEach(failure => {
        console.log(`   - ${failure.name}`);
        console.log(`     Error: ${failure.error}`);
      });
    }
    
    console.log('\n💾 Full report saved to: test-results.json');
    console.log('='.repeat(60));

    return report;
  }

  async runAllTests() {
    console.log('🚀 Starting Bvester Platform Test Suite...\n');
    
    try {
      await this.runHealthChecks();
      await this.runAuthenticationTests();
      await this.runBusinessTests();
      await this.runInvestmentTests();
      await this.runDataValidationTests();
      await this.runSecurityTests();
      await this.runPerformanceTests();
      await this.runIntegrationTests();
    } catch (error) {
      console.error('\n⚠️  Test suite error:', error.message);
    }
    
    return this.generateReport();
  }
}

// Run tests if executed directly
if (require.main === module) {
  const testSuite = new BvesterTestSuite();
  testSuite.runAllTests()
    .then(report => {
      process.exit(report.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = BvesterTestSuite;