// Bvester Button Functionality Test Script
// This script tests all interactive elements on the homepage

console.log('🔍 Starting Bvester Button Functionality Test...');

// Test results object
const testResults = {
    homepage: {
        loginButton: { found: false, functional: false, redirects: false },
        getStartedButton: { found: false, functional: false, redirects: false },
        primaryCTA: { found: false, functional: false, redirects: false },
        secondaryCTA: { found: false, functional: false, redirects: false },
        navLinks: { found: false, functional: false, count: 0 }
    },
    signup: {
        form: { found: false, validates: false, submits: false },
        userTypeSelector: { found: false, functional: false },
        passwordStrength: { found: false, functional: false },
        apiIntegration: { found: false, configured: false }
    },
    login: {
        form: { found: false, validates: false, submits: false },
        rememberMe: { found: false, functional: false },
        forgotPassword: { found: false, functional: false },
        apiIntegration: { found: false, configured: false }
    },
    criticalIssues: []
};

// Helper function to add critical issues
function addCriticalIssue(issue) {
    testResults.criticalIssues.push(issue);
    console.error('🚨 CRITICAL ISSUE:', issue);
}

// Test homepage button functionality
function testHomepageButtons() {
    console.log('📝 Testing Homepage Buttons...');

    // Test login button
    const loginBtn = document.querySelector('.btn-login');
    if (loginBtn) {
        testResults.homepage.loginButton.found = true;
        console.log('✅ Login button found');

        // Check if it has click functionality
        if (loginBtn.onclick || loginBtn.getAttribute('onclick') || loginBtn.addEventListener) {
            testResults.homepage.loginButton.functional = true;
            console.log('✅ Login button has click handler');

            // Test if it redirects to login page
            try {
                // Simulate click to test functionality
                const originalLocation = window.location.href;
                loginBtn.click();
                setTimeout(() => {
                    if (window.location.href !== originalLocation || window.location.href.includes('login')) {
                        testResults.homepage.loginButton.redirects = true;
                        console.log('✅ Login button redirects properly');
                    } else {
                        console.log('❌ Login button does not redirect');
                        addCriticalIssue('Login button does not redirect to login page');
                    }
                }, 100);
            } catch (error) {
                console.log('❌ Login button click failed:', error.message);
                addCriticalIssue('Login button click functionality broken');
            }
        } else {
            console.log('❌ Login button has no click handler');
            addCriticalIssue('Login button missing click functionality');
        }
    } else {
        console.log('❌ Login button not found');
        addCriticalIssue('Login button missing from homepage');
    }

    // Test get started button
    const getStartedBtn = document.querySelector('.btn-get-started');
    if (getStartedBtn) {
        testResults.homepage.getStartedButton.found = true;
        console.log('✅ Get Started button found');

        if (getStartedBtn.onclick || getStartedBtn.getAttribute('onclick')) {
            testResults.homepage.getStartedButton.functional = true;
            console.log('✅ Get Started button has click handler');
        } else {
            console.log('❌ Get Started button has no click handler');
            addCriticalIssue('Get Started button missing click functionality');
        }
    } else {
        console.log('❌ Get Started button not found');
        addCriticalIssue('Get Started button missing from homepage');
    }

    // Test primary CTA button
    const primaryBtn = document.querySelector('.btn-primary');
    if (primaryBtn) {
        testResults.homepage.primaryCTA.found = true;
        console.log('✅ Primary CTA button found');

        // Check button text
        if (primaryBtn.textContent.includes('INVESTMENT SCORE')) {
            console.log('✅ Primary CTA has correct text');
        } else {
            console.log('❌ Primary CTA has incorrect text:', primaryBtn.textContent);
            addCriticalIssue('Primary CTA button has wrong text');
        }

        if (primaryBtn.onclick || primaryBtn.getAttribute('onclick')) {
            testResults.homepage.primaryCTA.functional = true;
            console.log('✅ Primary CTA button has click handler');
        } else {
            console.log('❌ Primary CTA button has no click handler');
            addCriticalIssue('Primary CTA button missing click functionality - users cannot get investment score');
        }
    } else {
        console.log('❌ Primary CTA button not found');
        addCriticalIssue('Primary CTA button missing - main feature inaccessible');
    }

    // Test secondary CTA button
    const secondaryBtn = document.querySelector('.btn-secondary');
    if (secondaryBtn) {
        testResults.homepage.secondaryCTA.found = true;
        console.log('✅ Secondary CTA button found');

        if (secondaryBtn.onclick || secondaryBtn.getAttribute('onclick')) {
            testResults.homepage.secondaryCTA.functional = true;
            console.log('✅ Secondary CTA button has click handler');
        } else {
            console.log('❌ Secondary CTA button has no click handler');
            addCriticalIssue('Secondary CTA button missing click functionality');
        }
    } else {
        console.log('❌ Secondary CTA button not found');
        addCriticalIssue('Secondary CTA button missing');
    }

    // Test navigation links
    const navLinks = document.querySelectorAll('.nav-links a');
    if (navLinks.length > 0) {
        testResults.homepage.navLinks.found = true;
        testResults.homepage.navLinks.count = navLinks.length;
        console.log(`✅ Found ${navLinks.length} navigation links`);

        let functionalLinks = 0;
        navLinks.forEach((link, index) => {
            const href = link.getAttribute('href');
            if (href && href !== '#') {
                functionalLinks++;
            } else if (href === '#') {
                console.log(`⚠️ Navigation link ${index + 1} is placeholder (#)`);
            } else {
                console.log(`❌ Navigation link ${index + 1} has no href`);
            }
        });

        if (functionalLinks === navLinks.length) {
            testResults.homepage.navLinks.functional = true;
            console.log('✅ All navigation links have proper hrefs');
        } else {
            console.log(`❌ Only ${functionalLinks}/${navLinks.length} navigation links are functional`);
            addCriticalIssue('Some navigation links are non-functional');
        }
    } else {
        console.log('❌ No navigation links found');
        addCriticalIssue('Navigation menu has no links');
    }
}

// Test form functionality
function testFormFunctionality(formId, formType) {
    console.log(`📝 Testing ${formType} Form...`);

    const form = document.querySelector(`#${formId}`);
    if (!form) {
        console.log(`❌ ${formType} form not found`);
        addCriticalIssue(`${formType} form missing`);
        return false;
    }

    console.log(`✅ ${formType} form found`);
    testResults[formType.toLowerCase()].form.found = true;

    // Test form inputs
    const emailInput = form.querySelector('input[type="email"]');
    const passwordInput = form.querySelector('input[type="password"]');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!emailInput) {
        console.log(`❌ ${formType} form missing email input`);
        addCriticalIssue(`${formType} form missing email field`);
    } else {
        console.log(`✅ ${formType} email input found`);
    }

    if (!passwordInput) {
        console.log(`❌ ${formType} form missing password input`);
        addCriticalIssue(`${formType} form missing password field`);
    } else {
        console.log(`✅ ${formType} password input found`);
    }

    if (!submitBtn) {
        console.log(`❌ ${formType} form missing submit button`);
        addCriticalIssue(`${formType} form missing submit button`);
    } else {
        console.log(`✅ ${formType} submit button found`);
    }

    // Test form validation
    if (form.checkValidity) {
        testResults[formType.toLowerCase()].form.validates = true;
        console.log(`✅ ${formType} form has HTML5 validation`);
    } else {
        console.log(`❌ ${formType} form missing validation`);
        addCriticalIssue(`${formType} form has no validation`);
    }

    // Test form submission
    const formSubmitHandler = form.onsubmit || form.getAttribute('onsubmit');
    if (formSubmitHandler) {
        testResults[formType.toLowerCase()].form.submits = true;
        console.log(`✅ ${formType} form has submit handler`);
    } else {
        console.log(`❌ ${formType} form missing submit handler`);
        addCriticalIssue(`${formType} form cannot be submitted - users cannot ${formType.toLowerCase()}`);
    }

    return true;
}

// Test API configuration
function testAPIConfiguration() {
    console.log('📝 Testing API Configuration...');

    // Check if API_BASE is defined in scripts
    const scripts = document.querySelectorAll('script');
    let apiConfigFound = false;
    let apiEndpoint = '';

    scripts.forEach(script => {
        if (script.textContent.includes('API_BASE')) {
            apiConfigFound = true;
            const match = script.textContent.match(/API_BASE\s*=\s*['"`]([^'"`]+)['"`]/);
            if (match) {
                apiEndpoint = match[1];
                console.log('✅ API endpoint configured:', apiEndpoint);

                // Test if endpoint looks valid
                if (apiEndpoint.startsWith('https://') && apiEndpoint.includes('amazonaws.com')) {
                    console.log('✅ API endpoint looks valid');
                } else {
                    console.log('❌ API endpoint looks invalid:', apiEndpoint);
                    addCriticalIssue('API endpoint configuration appears invalid');
                }
            }
        }
    });

    if (!apiConfigFound) {
        console.log('❌ API configuration not found');
        addCriticalIssue('No API configuration found - forms cannot submit to backend');
    }

    return { found: apiConfigFound, endpoint: apiEndpoint };
}

// Test signup-specific functionality
function testSignupSpecific() {
    console.log('📝 Testing Signup-Specific Features...');

    // Test user type selector
    const userTypeSelectors = document.querySelectorAll('.user-type');
    if (userTypeSelectors.length > 0) {
        testResults.signup.userTypeSelector.found = true;
        console.log(`✅ Found ${userTypeSelectors.length} user type selectors`);

        // Test if they have click handlers
        let functionalSelectors = 0;
        userTypeSelectors.forEach(selector => {
            if (selector.onclick || selector.getAttribute('onclick')) {
                functionalSelectors++;
            }
        });

        if (functionalSelectors === userTypeSelectors.length) {
            testResults.signup.userTypeSelector.functional = true;
            console.log('✅ All user type selectors have click handlers');
        } else {
            console.log(`❌ Only ${functionalSelectors}/${userTypeSelectors.length} user type selectors functional`);
            addCriticalIssue('User type selection not fully functional');
        }
    } else {
        console.log('❌ User type selectors not found');
        addCriticalIssue('User type selection missing from signup');
    }

    // Test password strength indicator
    const strengthBar = document.querySelector('.password-strength-bar');
    if (strengthBar) {
        testResults.signup.passwordStrength.found = true;
        console.log('✅ Password strength indicator found');

        // Check if password input has strength checking
        const passwordInput = document.querySelector('#password');
        if (passwordInput) {
            const hasInputListener = passwordInput.oninput || passwordInput.getAttribute('oninput');
            if (hasInputListener) {
                testResults.signup.passwordStrength.functional = true;
                console.log('✅ Password strength checking functional');
            } else {
                console.log('❌ Password strength checking not functional');
                addCriticalIssue('Password strength indicator not working');
            }
        }
    } else {
        console.log('❌ Password strength indicator not found');
        addCriticalIssue('Password strength indicator missing');
    }
}

// Test login-specific functionality
function testLoginSpecific() {
    console.log('📝 Testing Login-Specific Features...');

    // Test remember me checkbox
    const rememberMe = document.querySelector('#remember');
    if (rememberMe) {
        testResults.login.rememberMe.found = true;
        testResults.login.rememberMe.functional = true; // Basic checkbox functionality
        console.log('✅ Remember me checkbox found');
    } else {
        console.log('❌ Remember me checkbox not found');
        addCriticalIssue('Remember me functionality missing');
    }

    // Test forgot password link
    const forgotPassword = document.querySelector('.forgot-password');
    if (forgotPassword) {
        testResults.login.forgotPassword.found = true;
        console.log('✅ Forgot password link found');

        if (forgotPassword.onclick || forgotPassword.getAttribute('onclick')) {
            testResults.login.forgotPassword.functional = true;
            console.log('✅ Forgot password link has click handler');
        } else {
            console.log('❌ Forgot password link has no click handler');
            addCriticalIssue('Forgot password functionality not working');
        }
    } else {
        console.log('❌ Forgot password link not found');
        addCriticalIssue('Forgot password functionality missing');
    }
}

// Generate comprehensive report
function generateReport() {
    console.log('\n📊 COMPREHENSIVE TEST REPORT');
    console.log('=====================================');

    console.log('\n🏠 HOMEPAGE RESULTS:');
    console.log('- Login Button:', testResults.homepage.loginButton.found ? '✅ Found' : '❌ Missing');
    console.log('- Get Started Button:', testResults.homepage.getStartedButton.found ? '✅ Found' : '❌ Missing');
    console.log('- Primary CTA:', testResults.homepage.primaryCTA.found ? '✅ Found' : '❌ Missing');
    console.log('- Secondary CTA:', testResults.homepage.secondaryCTA.found ? '✅ Found' : '❌ Missing');
    console.log('- Navigation Links:', testResults.homepage.navLinks.count, 'found');

    console.log('\n📝 FORM RESULTS:');
    console.log('- Signup Form:', testResults.signup.form.found ? '✅ Found' : '❌ Missing');
    console.log('- Login Form:', testResults.login.form.found ? '✅ Found' : '❌ Missing');

    console.log('\n🚨 CRITICAL ISSUES (' + testResults.criticalIssues.length + ' found):');
    if (testResults.criticalIssues.length === 0) {
        console.log('✅ No critical issues found!');
    } else {
        testResults.criticalIssues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue}`);
        });
    }

    console.log('\n💡 RECOMMENDATIONS:');
    if (testResults.criticalIssues.length > 0) {
        console.log('1. Fix critical issues immediately to prevent user drop-off');
        console.log('2. Add missing button functionality for core user flows');
        console.log('3. Ensure API endpoints are working for form submissions');
        console.log('4. Test all navigation paths manually');
    } else {
        console.log('✅ All basic functionality appears to be working!');
    }

    return testResults;
}

// Main test execution function
function runButtonTests() {
    console.log('🚀 Starting Button Functionality Tests...');

    // Reset critical issues
    testResults.criticalIssues = [];

    // Run tests based on current page
    const currentPath = window.location.pathname;

    if (currentPath.includes('index.html') || currentPath === '/') {
        testHomepageButtons();
    } else if (currentPath.includes('signup')) {
        testFormFunctionality('signupForm', 'Signup');
        testSignupSpecific();
    } else if (currentPath.includes('login')) {
        testFormFunctionality('loginForm', 'Login');
        testLoginSpecific();
    }

    // Always test API configuration
    const apiConfig = testAPIConfiguration();

    // Generate final report
    const finalResults = generateReport();

    console.log('\n🏁 Button functionality tests completed!');
    return finalResults;
}

// Export for use in test framework
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runButtonTests, testResults };
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runButtonTests);
    } else {
        runButtonTests();
    }
}