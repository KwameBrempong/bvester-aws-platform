/**
 * Compliance Service for Bvester Platform
 * Regulatory compliance, data protection, and audit management
 * Week 13 Implementation - Security & Compliance System
 */

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class ComplianceService {
    constructor() {
        // Compliance frameworks
        this.frameworks = {
            gdpr: {
                name: 'General Data Protection Regulation',
                jurisdiction: 'EU',
                requirements: [
                    'data_minimization',
                    'consent_management',
                    'right_to_erasure',
                    'data_portability',
                    'breach_notification',
                    'privacy_by_design'
                ]
            },
            pci_dss: {
                name: 'Payment Card Industry Data Security Standard',
                jurisdiction: 'Global',
                requirements: [
                    'secure_network',
                    'cardholder_data_protection',
                    'vulnerability_management',
                    'access_control',
                    'network_monitoring',
                    'security_policy'
                ]
            },
            sox: {
                name: 'Sarbanes-Oxley Act',
                jurisdiction: 'US',
                requirements: [
                    'financial_reporting',
                    'internal_controls',
                    'audit_trail',
                    'data_integrity',
                    'management_certification'
                ]
            },
            aml: {
                name: 'Anti-Money Laundering',
                jurisdiction: 'Global',
                requirements: [
                    'customer_identification',
                    'transaction_monitoring',
                    'suspicious_activity_reporting',
                    'record_keeping',
                    'compliance_program'
                ]
            },
            mifid: {
                name: 'Markets in Financial Instruments Directive',
                jurisdiction: 'EU',
                requirements: [
                    'investor_protection',
                    'market_transparency',
                    'conduct_of_business',
                    'record_keeping',
                    'best_execution'
                ]
            }
        };

        // African regulatory frameworks
        this.africanRegulations = {
            nigeria: {
                sec: 'Securities and Exchange Commission Nigeria',
                requirements: ['foreign_investment_approval', 'capital_market_registration']
            },
            kenya: {
                cma: 'Capital Markets Authority Kenya',
                requirements: ['investment_advisor_license', 'collective_investment_schemes']
            },
            south_africa: {
                fsca: 'Financial Sector Conduct Authority',
                requirements: ['financial_services_provider_license', 'fit_and_proper_requirements']
            },
            ghana: {
                sec: 'Securities and Exchange Commission Ghana',
                requirements: ['investment_advisor_registration', 'collective_investment_undertaking']
            }
        };

        // Compliance records storage
        this.complianceRecords = new Map();
        this.auditTrails = new Map();
        this.breachIncidents = new Map();
        this.consentRecords = new Map();
        this.dataProcessingActivities = new Map();
    }

    /**
     * Initialize compliance framework for business
     */
    async initializeCompliance(businessId, businessData) {
        try {
            const complianceId = uuidv4();
            const applicableFrameworks = this.determineApplicableFrameworks(businessData);
            
            const complianceRecord = {
                id: complianceId,
                businessId: businessId,
                applicableFrameworks: applicableFrameworks,
                status: 'initializing',
                createdAt: new Date(),
                updatedAt: new Date(),
                requirements: {},
                assessments: {},
                certifications: {},
                nextReviewDate: this.calculateNextReviewDate(),
                riskLevel: this.assessComplianceRisk(businessData),
                contactPersons: {
                    dpo: businessData.dataProtectionOfficer || null,
                    compliance: businessData.complianceOfficer || null,
                    legal: businessData.legalCounsel || null
                }
            };

            // Initialize requirements for each framework
            for (const framework of applicableFrameworks) {
                complianceRecord.requirements[framework] = await this.initializeFrameworkRequirements(framework, businessData);
            }

            this.complianceRecords.set(complianceId, complianceRecord);

            return {
                complianceId: complianceId,
                applicableFrameworks: applicableFrameworks,
                riskLevel: complianceRecord.riskLevel,
                nextSteps: this.generateNextSteps(complianceRecord)
            };
        } catch (error) {
            throw new Error(`Compliance initialization failed: ${error.message}`);
        }
    }

    /**
     * Determine applicable compliance frameworks
     */
    determineApplicableFrameworks(businessData) {
        const frameworks = [];

        // Always applicable for financial services
        frameworks.push('aml');

        // Geographic considerations
        if (businessData.operatesInEU || businessData.hasEUCustomers) {
            frameworks.push('gdpr', 'mifid');
        }

        if (businessData.operatesInUS || businessData.hasUSInvestors) {
            frameworks.push('sox');
        }

        // Payment processing
        if (businessData.processesPayments) {
            frameworks.push('pci_dss');
        }

        // African jurisdictions
        if (businessData.primaryJurisdiction) {
            const jurisdiction = businessData.primaryJurisdiction.toLowerCase();
            if (this.africanRegulations[jurisdiction]) {
                frameworks.push(`african_${jurisdiction}`);
            }
        }

        return frameworks;
    }

    /**
     * Initialize framework-specific requirements
     */
    async initializeFrameworkRequirements(framework, businessData) {
        const requirements = {
            framework: framework,
            status: 'pending',
            completedItems: [],
            pendingItems: [],
            exemptions: [],
            evidence: {},
            lastAssessment: null,
            nextAssessment: this.calculateNextAssessmentDate(framework)
        };

        switch (framework) {
            case 'gdpr':
                requirements.pendingItems = await this.getGDPRRequirements(businessData);
                break;
            case 'pci_dss':
                requirements.pendingItems = await this.getPCIRequirements(businessData);
                break;
            case 'aml':
                requirements.pendingItems = await this.getAMLRequirements(businessData);
                break;
            case 'sox':
                requirements.pendingItems = await this.getSOXRequirements(businessData);
                break;
            default:
                if (framework.startsWith('african_')) {
                    requirements.pendingItems = await this.getAfricanRequirements(framework, businessData);
                }
        }

        return requirements;
    }

    /**
     * Get GDPR compliance requirements
     */
    async getGDPRRequirements(businessData) {
        return [
            {
                id: 'gdpr_001',
                title: 'Data Processing Inventory',
                description: 'Maintain a record of all data processing activities',
                priority: 'high',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                status: 'pending',
                evidence: []
            },
            {
                id: 'gdpr_002',
                title: 'Privacy Policy',
                description: 'Create and publish comprehensive privacy policy',
                priority: 'high',
                deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
                status: 'pending',
                evidence: []
            },
            {
                id: 'gdpr_003',
                title: 'Consent Management System',
                description: 'Implement system for managing user consent',
                priority: 'high',
                deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
                status: 'pending',
                evidence: []
            },
            {
                id: 'gdpr_004',
                title: 'Data Subject Rights Procedures',
                description: 'Establish procedures for handling data subject requests',
                priority: 'medium',
                deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
                status: 'pending',
                evidence: []
            },
            {
                id: 'gdpr_005',
                title: 'Data Breach Response Plan',
                description: 'Create plan for responding to data breaches within 72 hours',
                priority: 'high',
                deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
                status: 'pending',
                evidence: []
            }
        ];
    }

    /**
     * Get AML compliance requirements
     */
    async getAMLRequirements(businessData) {
        return [
            {
                id: 'aml_001',
                title: 'Customer Due Diligence Procedures',
                description: 'Implement enhanced due diligence for high-risk customers',
                priority: 'critical',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: 'pending',
                evidence: []
            },
            {
                id: 'aml_002',
                title: 'Transaction Monitoring System',
                description: 'Deploy automated transaction monitoring for suspicious activities',
                priority: 'high',
                deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
                status: 'pending',
                evidence: []
            },
            {
                id: 'aml_003',
                title: 'Suspicious Activity Reporting',
                description: 'Establish procedures for reporting suspicious activities',
                priority: 'high',
                deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
                status: 'pending',
                evidence: []
            },
            {
                id: 'aml_004',
                title: 'AML Training Program',
                description: 'Implement AML training for all relevant staff',
                priority: 'medium',
                deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                status: 'pending',
                evidence: []
            }
        ];
    }

    /**
     * Get African jurisdiction requirements
     */
    async getAfricanRequirements(framework, businessData) {
        const jurisdiction = framework.split('_')[1];
        const regulation = this.africanRegulations[jurisdiction];
        
        if (!regulation) return [];

        const requirements = [];

        if (regulation.requirements.includes('foreign_investment_approval')) {
            requirements.push({
                id: `${jurisdiction}_001`,
                title: 'Foreign Investment Approval',
                description: 'Obtain approval for foreign investment activities',
                priority: 'critical',
                deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                status: 'pending',
                evidence: []
            });
        }

        if (regulation.requirements.includes('investment_advisor_license')) {
            requirements.push({
                id: `${jurisdiction}_002`,
                title: 'Investment Advisor License',
                description: 'Obtain license to provide investment advisory services',
                priority: 'critical',
                deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
                status: 'pending',
                evidence: []
            });
        }

        return requirements;
    }

    /**
     * Record user consent for GDPR compliance
     */
    async recordConsent(userId, consentData) {
        try {
            const consentId = uuidv4();
            const consentRecord = {
                id: consentId,
                userId: userId,
                timestamp: new Date(),
                ipAddress: consentData.ipAddress,
                userAgent: consentData.userAgent,
                consentTypes: consentData.consentTypes,
                purposes: consentData.purposes,
                legalBasis: consentData.legalBasis || 'consent',
                status: 'active',
                withdrawnAt: null,
                evidence: {
                    formVersion: consentData.formVersion,
                    language: consentData.language || 'en',
                    consentMethod: consentData.method || 'click',
                    doubleOptIn: consentData.doubleOptIn || false
                }
            };

            if (!this.consentRecords.has(userId)) {
                this.consentRecords.set(userId, []);
            }
            this.consentRecords.get(userId).push(consentRecord);

            return {
                consentId: consentId,
                status: 'recorded',
                expiresAt: this.calculateConsentExpiry(consentData.consentTypes)
            };
        } catch (error) {
            throw new Error(`Consent recording failed: ${error.message}`);
        }
    }

    /**
     * Process data subject request (GDPR Article 15-22)
     */
    async processDataSubjectRequest(requestData) {
        try {
            const requestId = uuidv4();
            const request = {
                id: requestId,
                userId: requestData.userId,
                email: requestData.email,
                requestType: requestData.type, // access, rectification, erasure, portability, restrict
                description: requestData.description,
                status: 'received',
                receivedAt: new Date(),
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days per GDPR
                assignedTo: null,
                evidence: {
                    identityVerification: requestData.identityProof,
                    communicationMethod: requestData.communicationMethod
                },
                processing: {
                    dataLocated: false,
                    dataExtracted: false,
                    responseGenerated: false,
                    responseSent: false
                }
            };

            // Auto-assign based on request type
            request.assignedTo = this.assignRequestHandler(requestData.type);

            // Start processing workflow
            await this.initiateRequestProcessing(request);

            return {
                requestId: requestId,
                status: 'received',
                deadline: request.deadline,
                referenceNumber: this.generateReferenceNumber(requestId)
            };
        } catch (error) {
            throw new Error(`Data subject request processing failed: ${error.message}`);
        }
    }

    /**
     * Conduct compliance assessment
     */
    async conductComplianceAssessment(complianceId, framework) {
        try {
            const complianceRecord = this.complianceRecords.get(complianceId);
            if (!complianceRecord) {
                throw new Error('Compliance record not found');
            }

            const assessmentId = uuidv4();
            const assessment = {
                id: assessmentId,
                complianceId: complianceId,
                framework: framework,
                assessor: 'system', // In production, would be assigned assessor
                startDate: new Date(),
                status: 'in_progress',
                scope: complianceRecord.requirements[framework]?.pendingItems || [],
                findings: [],
                recommendations: [],
                score: null,
                riskLevel: null
            };

            // Evaluate each requirement
            for (const requirement of assessment.scope) {
                const finding = await this.evaluateRequirement(requirement, complianceRecord);
                assessment.findings.push(finding);
            }

            // Calculate overall compliance score
            assessment.score = this.calculateComplianceScore(assessment.findings);
            assessment.riskLevel = this.determineRiskLevel(assessment.score);
            assessment.recommendations = this.generateRecommendations(assessment.findings);
            assessment.completedDate = new Date();
            assessment.status = 'completed';

            // Update compliance record
            complianceRecord.assessments[framework] = assessment;
            complianceRecord.updatedAt = new Date();
            this.complianceRecords.set(complianceId, complianceRecord);

            return assessment;
        } catch (error) {
            throw new Error(`Compliance assessment failed: ${error.message}`);
        }
    }

    /**
     * Report data breach incident
     */
    async reportDataBreach(breachData) {
        try {
            const breachId = uuidv4();
            const incident = {
                id: breachId,
                reportedBy: breachData.reportedBy,
                discoveredAt: new Date(breachData.discoveredAt),
                reportedAt: new Date(),
                severity: this.assessBreachSeverity(breachData),
                description: breachData.description,
                affectedDataTypes: breachData.affectedDataTypes,
                affectedRecords: breachData.affectedRecords,
                containmentActions: [],
                notifications: {
                    supervisoryAuthority: {
                        required: this.isAuthorityNotificationRequired(breachData),
                        deadline: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
                        completed: false
                    },
                    dataSubjects: {
                        required: this.isDataSubjectNotificationRequired(breachData),
                        deadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
                        completed: false
                    }
                },
                investigation: {
                    status: 'initiated',
                    findings: [],
                    rootCause: null,
                    preventiveMeasures: []
                },
                status: 'reported'
            };

            this.breachIncidents.set(breachId, incident);

            // Initiate breach response process
            await this.initiateBreachResponse(incident);

            return {
                breachId: breachId,
                severity: incident.severity,
                notificationDeadlines: incident.notifications,
                nextActions: this.getBreachNextActions(incident)
            };
        } catch (error) {
            throw new Error(`Data breach reporting failed: ${error.message}`);
        }
    }

    /**
     * Generate compliance report
     */
    async generateComplianceReport(complianceId, reportType = 'comprehensive') {
        try {
            const complianceRecord = this.complianceRecords.get(complianceId);
            if (!complianceRecord) {
                throw new Error('Compliance record not found');
            }

            const report = {
                id: uuidv4(),
                complianceId: complianceId,
                businessId: complianceRecord.businessId,
                reportType: reportType,
                generatedAt: new Date(),
                reportingPeriod: {
                    from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
                    to: new Date()
                },
                executiveSummary: {},
                frameworkStatus: {},
                keyMetrics: {},
                riskAssessment: {},
                recommendations: [],
                nextActions: []
            };

            // Generate executive summary
            report.executiveSummary = {
                overallStatus: this.calculateOverallComplianceStatus(complianceRecord),
                criticalIssues: this.getCriticalIssues(complianceRecord),
                completedRequirements: this.getCompletedRequirements(complianceRecord),
                pendingActions: this.getPendingActions(complianceRecord)
            };

            // Framework-specific status
            for (const framework of complianceRecord.applicableFrameworks) {
                const frameworkData = complianceRecord.requirements[framework];
                const assessment = complianceRecord.assessments[framework];
                
                report.frameworkStatus[framework] = {
                    status: frameworkData?.status || 'pending',
                    completionPercentage: this.calculateCompletionPercentage(frameworkData),
                    lastAssessment: assessment?.completedDate || null,
                    score: assessment?.score || null,
                    nextReview: frameworkData?.nextAssessment || null
                };
            }

            // Key compliance metrics
            report.keyMetrics = {
                totalRequirements: this.getTotalRequirements(complianceRecord),
                completedRequirements: this.getCompletedRequirementsCount(complianceRecord),
                overdue: this.getOverdueRequirements(complianceRecord),
                breachIncidents: this.getBreachIncidentsCount(complianceRecord.businessId),
                consentWithdrawals: this.getConsentWithdrawalsCount(complianceRecord.businessId),
                dataSubjectRequests: this.getDataSubjectRequestsCount(complianceRecord.businessId)
            };

            return report;
        } catch (error) {
            throw new Error(`Compliance report generation failed: ${error.message}`);
        }
    }

    // Helper methods
    assessComplianceRisk(businessData) {
        let riskScore = 0;
        
        if (businessData.dataVolume === 'high') riskScore += 3;
        if (businessData.crossBorderTransfers) riskScore += 2;
        if (businessData.sensitiveData) riskScore += 3;
        if (businessData.publicCompany) riskScore += 2;
        if (businessData.financialServices) riskScore += 2;

        if (riskScore >= 8) return 'high';
        if (riskScore >= 5) return 'medium';
        return 'low';
    }

    calculateNextReviewDate() {
        return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Annual review
    }

    calculateNextAssessmentDate(framework) {
        const intervals = {
            'gdpr': 180, // 6 months
            'pci_dss': 365, // Annual
            'sox': 90, // Quarterly
            'aml': 180 // 6 months
        };

        const days = intervals[framework] || 365;
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    generateNextSteps(complianceRecord) {
        const nextSteps = [];
        
        for (const [framework, requirements] of Object.entries(complianceRecord.requirements)) {
            const criticalItems = requirements.pendingItems?.filter(item => item.priority === 'critical') || [];
            
            criticalItems.forEach(item => {
                nextSteps.push({
                    framework: framework,
                    action: item.title,
                    deadline: item.deadline,
                    priority: item.priority
                });
            });
        }

        return nextSteps.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    }

    assessBreachSeverity(breachData) {
        let severity = 'low';
        
        if (breachData.affectedRecords > 10000 || 
            breachData.affectedDataTypes.includes('financial') ||
            breachData.affectedDataTypes.includes('health')) {
            severity = 'high';
        } else if (breachData.affectedRecords > 1000 || 
                  breachData.affectedDataTypes.includes('personal')) {
            severity = 'medium';
        }

        return severity;
    }

    isAuthorityNotificationRequired(breachData) {
        // GDPR Article 33 - notification required unless unlikely to result in risk
        return breachData.severity !== 'low' || breachData.affectedRecords > 100;
    }

    isDataSubjectNotificationRequired(breachData) {
        // GDPR Article 34 - notification required if high risk to rights and freedoms
        return breachData.severity === 'high' || 
               breachData.affectedDataTypes.includes('financial') ||
               breachData.affectedDataTypes.includes('health');
    }

    async initiateBreachResponse(incident) {
        // Automated breach response workflow
        const actions = [
            'contain_breach',
            'assess_impact',
            'notify_authorities',
            'notify_subjects',
            'investigate_cause',
            'implement_fixes'
        ];

        incident.responseWorkflow = {
            actions: actions,
            currentStep: 0,
            startedAt: new Date()
        };
    }

    generateReferenceNumber(requestId) {
        const year = new Date().getFullYear();
        const shortId = requestId.substring(0, 8).toUpperCase();
        return `DSR-${year}-${shortId}`;
    }

    calculateConsentExpiry(consentTypes) {
        // Different consent types have different validity periods
        const maxDays = Math.max(...consentTypes.map(type => {
            const periods = {
                'marketing': 365 * 2, // 2 years
                'analytics': 365 * 1, // 1 year
                'functional': 365 * 3, // 3 years
                'necessary': null // No expiry
            };
            return periods[type] || 365;
        }));

        return maxDays ? new Date(Date.now() + maxDays * 24 * 60 * 60 * 1000) : null;
    }

    async evaluateRequirement(requirement, complianceRecord) {
        // Simplified evaluation - in production would involve detailed checks
        return {
            requirementId: requirement.id,
            status: requirement.status,
            compliance: requirement.status === 'completed' ? 'compliant' : 'non-compliant',
            evidence: requirement.evidence,
            gaps: requirement.status === 'completed' ? [] : ['Implementation incomplete'],
            score: requirement.status === 'completed' ? 100 : 0
        };
    }

    calculateComplianceScore(findings) {
        if (findings.length === 0) return 0;
        
        const totalScore = findings.reduce((sum, finding) => sum + finding.score, 0);
        return Math.round(totalScore / findings.length);
    }

    determineRiskLevel(score) {
        if (score >= 90) return 'low';
        if (score >= 70) return 'medium';
        if (score >= 50) return 'high';
        return 'critical';
    }

    generateRecommendations(findings) {
        const recommendations = [];
        
        findings.forEach(finding => {
            if (finding.compliance === 'non-compliant') {
                recommendations.push({
                    requirement: finding.requirementId,
                    action: 'Complete implementation',
                    priority: 'high',
                    timeline: '30 days'
                });
            }
        });

        return recommendations;
    }
}

module.exports = ComplianceService;