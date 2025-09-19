// Revolutionary Bvester JavaScript - LinkedIn + Mint + AngelList for African SMEs

// Global state management
const BvesterApp = {
    user: null,
    assessmentData: {
        currentQuestion: 0,
        answers: [],
        score: 0
    },
    features: {
        whatsappIntegration: false,
        aiCoach: true,
        diasporaNetwork: true,
        bankPartnership: false
    }
};

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadUserData();
    startAnimations();
});

// Initialize Application
function initializeApp() {
    console.log('🚀 Initializing Revolutionary Bvester Platform');
    
    // Setup mobile menu
    setupMobileMenu();
    
    // Setup pricing toggle
    setupPricingToggle();
    
    // Setup smooth scrolling
    setupSmoothScrolling();
    
    // Setup intersection observers for animations
    setupScrollAnimations();
    
    // Initialize assessment system
    initializeAssessment();
    
    // Setup AI coach
    initializeAICoach();
    
    console.log('✅ Bvester Platform Ready');
}

// Event Listeners
function setupEventListeners() {
    // Navigation Login/Signup Buttons
    const loginBtn = document.querySelector('.btn-login');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            window.location.href = 'login.html';
        });
    }
    
    const signupBtn = document.querySelector('.btn-signup');
    if (signupBtn) {
        signupBtn.addEventListener('click', function() {
            window.location.href = 'signup.html';
        });
    }
    
    // CTA Buttons
    const ctaButtons = document.querySelectorAll('.btn-primary');
    ctaButtons.forEach(button => {
        button.addEventListener('click', startAssessment);
    });
    
    // Demo buttons
    const demoButtons = document.querySelectorAll('.btn-secondary');
    demoButtons.forEach(button => {
        button.addEventListener('click', watchDemo);
    });
    
    // Plan buttons
    const planButtons = document.querySelectorAll('.btn-plan');
    planButtons.forEach(button => {
        button.addEventListener('click', selectPlan);
    });
    
    // Navigation
    setupNavigation();
}

// Mobile Menu
function setupMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

// Pricing Toggle
function setupPricingToggle() {
    const toggleOptions = document.querySelectorAll('.toggle-option');
    const monthlyPrices = document.querySelectorAll('.monthly-price');
    const annualPrices = document.querySelectorAll('.annual-price');
    
    toggleOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active class from all options
            toggleOptions.forEach(opt => opt.classList.remove('active'));
            // Add active class to clicked option
            option.classList.add('active');
            
            const period = option.dataset.period;
            
            if (period === 'monthly') {
                monthlyPrices.forEach(price => price.style.display = 'inline');
                annualPrices.forEach(price => price.style.display = 'none');
            } else {
                monthlyPrices.forEach(price => price.style.display = 'none');
                annualPrices.forEach(price => price.style.display = 'inline');
            }
        });
    });
}

// Smooth Scrolling
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Navigation Behavior
function setupNavigation() {
    const header = document.querySelector('.header');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }
        
        // Hide header when scrolling down, show when scrolling up
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollY = currentScrollY;
    });
}

// Scroll Animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.problem-item, .solution-item, .story-card, .pricing-card, .timeline-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Start Animations
function startAnimations() {
    // Animate hero stats
    animateNumbers();
    
    // Animate dashboard preview
    animateDashboard();
    
    // Start typing animation
    startTypingAnimation();
}

// Animate Numbers
function animateNumbers() {
    const numbers = document.querySelectorAll('.stat-number, .metric-value');
    
    numbers.forEach(number => {
        const finalValue = number.textContent;
        const numValue = parseInt(finalValue.replace(/[^0-9]/g, ''));
        
        if (numValue) {
            let currentValue = 0;
            const increment = numValue / 50;
            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= numValue) {
                    currentValue = numValue;
                    clearInterval(timer);
                }
                number.textContent = finalValue.replace(numValue, Math.floor(currentValue));
            }, 30);
        }
    });
}

// Animate Dashboard
function animateDashboard() {
    const dashboard = document.querySelector('.dashboard-preview');
    if (dashboard) {
        setTimeout(() => {
            dashboard.style.transform = 'perspective(1000px) rotateY(-2deg) rotateX(2deg)';
        }, 1000);
    }
}

// Typing Animation
function startTypingAnimation() {
    const typingElements = document.querySelectorAll('.hero-title');
    
    typingElements.forEach(element => {
        const text = element.innerHTML;
        element.innerHTML = '';
        
        let i = 0;
        const timer = setInterval(() => {
            element.innerHTML = text.slice(0, i);
            i++;
            if (i > text.length) {
                clearInterval(timer);
            }
        }, 50);
    });
}

// Assessment System
function initializeAssessment() {
    BvesterApp.assessmentQuestions = [
        {
            question: "What type of business do you run?",
            type: "multiple",
            options: [
                { text: "Restaurant/Food Service", value: 15 },
                { text: "Retail/E-commerce", value: 12 },
                { text: "Technology/Software", value: 18 },
                { text: "Manufacturing", value: 14 },
                { text: "Services (consulting, etc.)", value: 13 },
                { text: "Agriculture", value: 11 },
                { text: "Other", value: 10 }
            ]
        },
        {
            question: "How long has your business been operating?",
            type: "multiple",
            options: [
                { text: "Less than 6 months", value: 5 },
                { text: "6 months - 1 year", value: 8 },
                { text: "1-2 years", value: 12 },
                { text: "2-5 years", value: 16 },
                { text: "5+ years", value: 20 }
            ]
        },
        {
            question: "What is your monthly revenue range?",
            type: "multiple",
            options: [
                { text: "Less than ₵1,000", value: 3 },
                { text: "₵1,000 - ₵5,000", value: 8 },
                { text: "₵5,000 - ₵15,000", value: 12 },
                { text: "₵15,000 - ₵50,000", value: 16 },
                { text: "₵50,000+", value: 20 }
            ]
        },
        {
            question: "How do you currently track your finances?",
            type: "multiple",
            options: [
                { text: "I don't track them systematically", value: 0 },
                { text: "Basic notebook/paper records", value: 5 },
                { text: "Excel/Google Sheets", value: 10 },
                { text: "Accounting software", value: 15 },
                { text: "Professional accountant", value: 18 }
            ]
        },
        {
            question: "Do you have business registration/licenses?",
            type: "multiple",
            options: [
                { text: "No formal registration", value: 0 },
                { text: "Basic business registration", value: 10 },
                { text: "Full registration + licenses", value: 15 },
                { text: "Full compliance + tax records", value: 20 }
            ]
        },
        {
            question: "How much investment are you seeking?",
            type: "multiple",
            options: [
                { text: "₵5,000 - ₵25,000", value: 8 },
                { text: "₵25,000 - ₵100,000", value: 12 },
                { text: "₵100,000 - ₵500,000", value: 15 },
                { text: "₵500,000+", value: 18 },
                { text: "Not sure yet", value: 5 }
            ]
        },
        {
            question: "What would you use the investment for?",
            type: "multiple",
            options: [
                { text: "Equipment/Inventory", value: 15 },
                { text: "Business expansion", value: 18 },
                { text: "Marketing/Customer acquisition", value: 12 },
                { text: "Staff/Operations", value: 14 },
                { text: "Technology/Systems", value: 16 },
                { text: "Working capital", value: 10 }
            ]
        },
        {
            question: "Are you connected to the African diaspora?",
            type: "multiple",
            options: [
                { text: "Yes, I have family/friends abroad", value: 12 },
                { text: "Some connections but limited", value: 8 },
                { text: "No, but interested in connecting", value: 10 },
                { text: "No connections", value: 5 }
            ]
        }
    ];
}

function startAssessment() {
    console.log('🎯 Starting Investment Readiness Assessment');
    
    // Reset assessment data
    BvesterApp.assessmentData = {
        currentQuestion: 0,
        answers: [],
        score: 0
    };
    
    // Show modal
    const modal = document.getElementById('assessmentModal');
    modal.style.display = 'block';
    
    // Load first question
    loadAssessmentQuestion();
    
    // Track event
    trackEvent('assessment_started');
}

function loadAssessmentQuestion() {
    const currentQ = BvesterApp.assessmentData.currentQuestion;
    const question = BvesterApp.assessmentQuestions[currentQ];
    const content = document.getElementById('assessmentContent');
    const progress = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    // Update progress
    const progressPercent = ((currentQ + 1) / BvesterApp.assessmentQuestions.length) * 100;
    progress.style.width = progressPercent + '%';
    progressText.textContent = `Question ${currentQ + 1} of ${BvesterApp.assessmentQuestions.length}`;
    
    // Generate question HTML
    let html = `
        <div class="question">
            <h3 class="question-title">${question.question}</h3>
            <div class="question-options">
    `;
    
    question.options.forEach((option, index) => {
        html += `
            <button class="option-btn" onclick="selectAnswer(${index}, ${option.value})">
                ${option.text}
            </button>
        `;
    });
    
    html += '</div></div>';
    content.innerHTML = html;
}

function selectAnswer(optionIndex, value) {
    const currentQ = BvesterApp.assessmentData.currentQuestion;
    
    // Store answer
    BvesterApp.assessmentData.answers.push({
        question: currentQ,
        answer: optionIndex,
        value: value
    });
    
    // Add to score
    BvesterApp.assessmentData.score += value;
    
    // Move to next question or show results
    BvesterApp.assessmentData.currentQuestion++;
    
    if (BvesterApp.assessmentData.currentQuestion < BvesterApp.assessmentQuestions.length) {
        setTimeout(loadAssessmentQuestion, 500);
    } else {
        setTimeout(showAssessmentResults, 500);
    }
}

function showAssessmentResults() {
    const score = BvesterApp.assessmentData.score;
    const maxScore = 146; // Maximum possible score
    const percentage = Math.round((score / maxScore) * 100);
    
    const content = document.getElementById('assessmentContent');
    
    let level, color, message, recommendations;
    
    if (percentage >= 80) {
        level = "Investment Ready";
        color = "#34a853";
        message = "Congratulations! Your business is already well-positioned for investment.";
        recommendations = [
            "Start building your investor profile",
            "Connect with diaspora investors",
            "Prepare your pitch deck"
        ];
    } else if (percentage >= 60) {
        level = "Nearly Ready";
        color = "#fbbc05";
        message = "You're close! With some improvements, you'll be investment-ready soon.";
        recommendations = [
            "Improve your financial record-keeping",
            "Complete business registration/licensing",
            "Build your online presence"
        ];
    } else if (percentage >= 40) {
        level = "Developing";
        color = "#ff9800";
        message = "Good foundation! You need to strengthen several areas to attract investors.";
        recommendations = [
            "Implement proper financial tracking",
            "Get professional business registration",
            "Develop a clear business plan"
        ];
    } else {
        level = "Starting Journey";
        color = "#ea4335";
        message = "Every successful business starts somewhere! Let's build your investment readiness together.";
        recommendations = [
            "Start with basic financial record-keeping",
            "Register your business properly",
            "Focus on growing consistent revenue"
        ];
    }
    
    const html = `
        <div class="assessment-results">
            <div class="score-circle" style="border-color: ${color}">
                <div class="score-number" style="color: ${color}">${percentage}</div>
                <div class="score-label">Investment Score</div>
            </div>
            <div class="score-level" style="color: ${color}">${level}</div>
            <p class="score-message">${message}</p>
            
            <div class="recommendations">
                <h4>Next Steps to Improve Your Score:</h4>
                <ul>
                    ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            
            <div class="results-actions">
                <button class="btn-primary" onclick="signUpNow()">
                    Start Building Your Profile
                </button>
                <button class="btn-secondary" onclick="shareResults()">
                    Share Your Score
                </button>
            </div>
            
            <div class="ai-coach-preview">
                <div class="coach-message">
                    <span class="coach-icon">🤖</span>
                    <div class="coach-text">
                        <strong>AI Coach Tip:</strong> Based on your answers, I recommend starting with WhatsApp transaction tracking. This alone can improve your score by 15-20 points in the first month!
                    </div>
                </div>
            </div>
        </div>
        
        <style>
        .assessment-results {
            text-align: center;
            padding: 2rem 0;
        }
        
        .score-circle {
            width: 150px;
            height: 150px;
            border: 8px solid #ddd;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
        }
        
        .score-number {
            font-size: 2.5rem;
            font-weight: 800;
        }
        
        .score-label {
            font-size: 0.875rem;
            color: #666;
        }
        
        .score-level {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
        }
        
        .score-message {
            font-size: 1.125rem;
            margin-bottom: 2rem;
            color: #333;
        }
        
        .recommendations {
            text-align: left;
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 8px;
            margin-bottom: 2rem;
        }
        
        .recommendations h4 {
            margin-bottom: 1rem;
            color: #333;
        }
        
        .recommendations ul {
            list-style: none;
            padding: 0;
        }
        
        .recommendations li {
            padding: 0.5rem 0;
            position: relative;
            padding-left: 1.5rem;
        }
        
        .recommendations li::before {
            content: "✅";
            position: absolute;
            left: 0;
        }
        
        .results-actions {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .ai-coach-preview {
            background: linear-gradient(135deg, #1a73e8 0%, #34a853 100%);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            text-align: left;
        }
        
        .coach-message {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
        }
        
        .coach-icon {
            font-size: 1.5rem;
            flex-shrink: 0;
        }
        
        .coach-text {
            font-size: 0.875rem;
            line-height: 1.5;
        }
        </style>
    `;
    
    content.innerHTML = html;
    
    // Track completion
    trackEvent('assessment_completed', { score: percentage, level: level });
}

function closeModal() {
    const modal = document.getElementById('assessmentModal');
    modal.style.display = 'none';
}

// AI Coach System
function initializeAICoach() {
    console.log('🤖 Initializing AI Business Coach');
    
    // Start daily tips rotation
    startDailyTips();
    
    // Initialize coaching recommendations
    generateCoachingTips();
}

function startDailyTips() {
    const tips = [
        "💡 Upload your business license to increase credibility by 15 points",
        "📊 Your revenue is 20% above industry average - highlight this to investors",
        "🎯 Complete KYC to unlock premium investor matching",
        "📱 Connect your Mobile Money account for automatic transaction tracking",
        "📈 Add photos of your business operations to build trust with investors",
        "💰 Document your business expenses to show financial discipline",
        "🎥 Record a 60-second business introduction video",
        "📝 Update your business description to include your growth plans"
    ];
    
    const tipElements = document.querySelectorAll('.tip');
    if (tipElements.length > 0) {
        let currentTip = 0;
        setInterval(() => {
            tipElements.forEach((el, index) => {
                if (index === currentTip) {
                    el.style.opacity = '1';
                    el.style.transform = 'translateX(0)';
                } else {
                    el.style.opacity = '0.7';
                    el.style.transform = 'translateX(-10px)';
                }
            });
            currentTip = (currentTip + 1) % tipElements.length;
        }, 3000);
    }
}

function generateCoachingTips() {
    // This would integrate with AI service to generate personalized tips
    // For now, we'll use predefined intelligent tips
    return [
        {
            category: "Financial Management",
            tip: "Set up automatic expense categorization to save 5 hours per week on bookkeeping",
            impact: "15 points",
            timeframe: "1 week"
        },
        {
            category: "Compliance",
            tip: "Upload your business certificate and tax clearance to boost investor confidence",
            impact: "20 points",
            timeframe: "1 day"
        },
        {
            category: "Growth Strategy",
            tip: "Document your customer acquisition channels to show scalability potential",
            impact: "12 points",
            timeframe: "3 days"
        }
    ];
}

// WhatsApp Integration
function initializeWhatsAppIntegration() {
    console.log('📱 Initializing WhatsApp Banking Integration');
    
    // This would integrate with WhatsApp Business API
    // For demo purposes, we'll simulate the functionality
    simulateWhatsAppFeatures();
}

function simulateWhatsAppFeatures() {
    // Simulate WhatsApp transaction import
    const whatsappDemo = document.querySelector('.whatsapp-chat');
    if (whatsappDemo) {
        // Add real-time message simulation
        setTimeout(() => {
            addWhatsAppMessage('Upload my October transactions', 'sent');
        }, 2000);
        
        setTimeout(() => {
            addWhatsAppMessage('✅ Processing 52 transactions...', 'received');
        }, 3000);
        
        setTimeout(() => {
            addWhatsAppMessage('✅ Imported 52 transactions worth ₵18,750. Your score increased by 8 points! 🎉', 'received');
        }, 5000);
    }
}

function addWhatsAppMessage(text, type) {
    const chat = document.querySelector('.whatsapp-chat');
    const message = document.createElement('div');
    message.className = `chat-message ${type}`;
    message.innerHTML = `<span>${text}</span>`;
    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;
}

// Diaspora Network Features
function initializeDiasporaNetwork() {
    console.log('🌍 Initializing Diaspora Investor Network');
    
    // Simulate diaspora activity
    simulateDiasporaActivity();
}

function simulateDiasporaActivity() {
    const activities = [
        "Ama Johnson from London started following your business",
        "Michael Osei from Toronto liked your business update",
        "Sarah Mensah from New York added your business to her watchlist",
        "David Asante from Berlin requested more information about your expansion plans"
    ];
    
    // Show notifications periodically
    let activityIndex = 0;
    setInterval(() => {
        if (activityIndex < activities.length) {
            showDiasporaNotification(activities[activityIndex]);
            activityIndex++;
        }
    }, 8000);
}

function showDiasporaNotification(message) {
    // Create floating notification
    const notification = document.createElement('div');
    notification.className = 'diaspora-notification';
    notification.innerHTML = `
        <div class="notification-icon">🌍</div>
        <div class="notification-text">${message}</div>
    `;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        max-width: 300px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// Plan Selection
function selectPlan(event) {
    const button = event.target;
    const card = button.closest('.pricing-card');
    const planName = card.querySelector('h3').textContent;
    const planPrice = card.querySelector('.amount').textContent;
    
    console.log(`🎯 Selected Plan: ${planName} - ₵${planPrice}/month`);
    
    // Track plan selection
    trackEvent('plan_selected', { plan: planName, price: planPrice });
    
    // Start sign-up process
    startSignUp(planName, planPrice);
}

function startSignUp(planName, planPrice) {
    // This would open the sign-up flow
    // For now, we'll show a confirmation
    alert(`Great choice! Starting sign-up for ${planName} plan at ₵${planPrice}/month. \n\nYou'll get:\n✅ 7-day free trial\n✅ Partner bank account setup\n✅ WhatsApp integration\n✅ AI business coaching`);
    
    // Redirect to sign-up page (would be implemented)
    // window.location.href = '/signup?plan=' + planName.toLowerCase();
}

function signUpNow() {
    console.log('🚀 Starting sign-up process');
    trackEvent('signup_from_assessment');
    
    // Close modal
    closeModal();
    
    // Scroll to pricing
    document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' });
    
    // Highlight Growth plan (most popular)
    const growthPlan = document.querySelector('.pricing-card.growth');
    if (growthPlan) {
        growthPlan.style.transform = 'scale(1.1)';
        growthPlan.style.boxShadow = '0 20px 25px -5px rgba(26, 115, 232, 0.3)';
        
        setTimeout(() => {
            growthPlan.style.transform = 'scale(1.05)';
            growthPlan.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
        }, 2000);
    }
}

function shareResults() {
    const score = BvesterApp.assessmentData.score;
    const maxScore = 146;
    const percentage = Math.round((score / maxScore) * 100);
    
    const shareText = `I just got ${percentage}/100 on my Investment Readiness Score with @Bvester! 🚀\n\nReady to turn my business into an investment magnet. Join me: https://bvester.com`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My Investment Readiness Score',
            text: shareText,
            url: 'https://bvester.com'
        });
    } else {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Results copied to clipboard! Share on your social media.');
        });
    }
    
    trackEvent('assessment_shared', { score: percentage });
}

function watchDemo() {
    console.log('🎥 Starting demo video');
    
    // This would open a video modal or redirect to demo page
    // For now, we'll simulate with an alert
    alert('🎥 Demo Video Coming Soon!\n\nSee how other African SMEs transformed their businesses:\n\n✅ Kwame\'s Restaurant: 28 → 89 score in 3 months\n✅ AfriFashion Hub: 15 → 92 score, ₵340K investment interest\n✅ TechRepair Pro: 42 → 85 score, Silicon Valley investors interested\n\nSign up now to start your transformation!');
    
    trackEvent('demo_requested');
}

function scheduleDemo() {
    console.log('📅 Scheduling demo call');
    
    // This would integrate with calendar booking system
    alert('📅 Demo Call Booking\n\nOur success managers are ready to show you:\n\n✅ How to improve your investment score by 40+ points\n✅ WhatsApp banking integration demo\n✅ Live diaspora investor connections\n✅ AI coach personalization\n\nWe\'ll be in touch within 24 hours to schedule your call!');
    
    trackEvent('demo_scheduled');
}

// Analytics and Tracking
function trackEvent(eventName, properties = {}) {
    console.log('📊 Tracking Event:', eventName, properties);
    
    // This would integrate with analytics services like Google Analytics, Mixpanel, etc.
    // For now, we'll just log to console
    
    // Example integration:
    // gtag('event', eventName, properties);
    // mixpanel.track(eventName, properties);
}

// Load User Data
function loadUserData() {
    // This would load user data from localStorage or API
    const savedData = localStorage.getItem('bvester_user_data');
    if (savedData) {
        try {
            BvesterApp.user = JSON.parse(savedData);
            console.log('👤 User data loaded:', BvesterApp.user);
        } catch (e) {
            console.error('Error loading user data:', e);
        }
    }
}

// Save User Data
function saveUserData() {
    localStorage.setItem('bvester_user_data', JSON.stringify(BvesterApp.user));
}

// Utility Functions
function formatCurrency(amount, currency = '₵') {
    return currency + amount.toLocaleString();
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Initialize features when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all features
    initializeWhatsAppIntegration();
    initializeDiasporaNetwork();
    
    console.log('🎉 All Revolutionary Features Initialized');
});

// Click outside modal to close
window.onclick = function(event) {
    const modal = document.getElementById('assessmentModal');
    if (event.target == modal) {
        closeModal();
    }
};

// Export for global access
window.BvesterApp = BvesterApp;