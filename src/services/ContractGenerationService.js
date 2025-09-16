/**
 * Automated Contract Generation Service
 * Generates legal documents for investment agreements, terms sheets, and contracts
 */
class ContractGenerationService {
  constructor() {
    this.templates = new Map();
    this.initialized = false;
    this.legalTemplates = {
      termSheet: new TermSheetTemplate(),
      investmentAgreement: new InvestmentAgreementTemplate(),
      shareholderAgreement: new ShareholderAgreementTemplate(),
      nda: new NDATemplate(),
      convertibleNote: new ConvertibleNoteTemplate(),
      safeAgreement: new SAFETemplate(),
    };
  }

  /**
   * Initialize the contract generation service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize all templates
      await Promise.all(
        Object.values(this.legalTemplates).map(template => template.initialize())
      );

      // Load custom templates
      await this.loadCustomTemplates();

      this.initialized = true;
      console.log('✅ Contract Generation Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Contract Generation Service:', error);
    }
  }

  /**
   * Generate investment term sheet
   */
  async generateTermSheet(investmentData) {
    try {
      const {
        companyName,
        investorName,
        investmentAmount,
        valuation,
        investmentType,
        equity,
        liquidationPreference,
        boardSeats,
        votingRights,
        antiDilution,
        dragAlong,
        tagAlong,
        preemptiveRights,
        informationRights,
        restrictions,
        closingDate,
        jurisdiction
      } = investmentData;

      const template = this.legalTemplates.termSheet;
      const document = await template.generate({
        companyName,
        investorName,
        investmentAmount,
        valuation,
        investmentType,
        equity,
        liquidationPreference,
        boardSeats,
        votingRights,
        antiDilution,
        dragAlong,
        tagAlong,
        preemptiveRights,
        informationRights,
        restrictions,
        closingDate,
        jurisdiction,
        generatedDate: new Date().toISOString(),
      });

      return {
        success: true,
        document,
        documentType: 'term_sheet',
        metadata: {
          id: this.generateDocumentId(),
          companyName,
          investorName,
          amount: investmentAmount,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Failed to generate term sheet:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate investment agreement
   */
  async generateInvestmentAgreement(agreementData) {
    try {
      const template = this.legalTemplates.investmentAgreement;
      const document = await template.generate(agreementData);

      return {
        success: true,
        document,
        documentType: 'investment_agreement',
        metadata: {
          id: this.generateDocumentId(),
          parties: [agreementData.companyName, agreementData.investorName],
          amount: agreementData.investmentAmount,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Failed to generate investment agreement:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate Non-Disclosure Agreement (NDA)
   */
  async generateNDA(ndaData) {
    try {
      const template = this.legalTemplates.nda;
      const document = await template.generate(ndaData);

      return {
        success: true,
        document,
        documentType: 'nda',
        metadata: {
          id: this.generateDocumentId(),
          parties: [ndaData.disclosingParty, ndaData.receivingParty],
          type: ndaData.type || 'mutual',
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Failed to generate NDA:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate Convertible Note Agreement
   */
  async generateConvertibleNote(noteData) {
    try {
      const template = this.legalTemplates.convertibleNote;
      const document = await template.generate(noteData);

      return {
        success: true,
        document,
        documentType: 'convertible_note',
        metadata: {
          id: this.generateDocumentId(),
          company: noteData.companyName,
          investor: noteData.investorName,
          amount: noteData.principalAmount,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Failed to generate convertible note:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate SAFE Agreement
   */
  async generateSAFE(safeData) {
    try {
      const template = this.legalTemplates.safeAgreement;
      const document = await template.generate(safeData);

      return {
        success: true,
        document,
        documentType: 'safe',
        metadata: {
          id: this.generateDocumentId(),
          company: safeData.companyName,
          investor: safeData.investorName,
          amount: safeData.purchaseAmount,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Failed to generate SAFE agreement:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate document data
   */
  validateDocumentData(documentType, data) {
    const validators = {
      termSheet: this.validateTermSheetData,
      investmentAgreement: this.validateInvestmentAgreementData,
      nda: this.validateNDAData,
      convertibleNote: this.validateConvertibleNoteData,
      safe: this.validateSAFEData,
    };

    const validator = validators[documentType];
    if (!validator) {
      throw new Error(`No validator found for document type: ${documentType}`);
    }

    return validator.call(this, data);
  }

  validateTermSheetData(data) {
    const required = ['companyName', 'investorName', 'investmentAmount', 'valuation'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    if (data.investmentAmount <= 0) {
      throw new Error('Investment amount must be positive');
    }

    if (data.valuation <= data.investmentAmount) {
      throw new Error('Valuation must be greater than investment amount');
    }

    return true;
  }

  validateInvestmentAgreementData(data) {
    // Similar validation logic
    return true;
  }

  validateNDAData(data) {
    const required = ['disclosingParty', 'receivingParty', 'effectiveDate'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    return true;
  }

  validateConvertibleNoteData(data) {
    // Validation logic for convertible notes
    return true;
  }

  validateSAFEData(data) {
    // Validation logic for SAFE agreements
    return true;
  }

  /**
   * Generate custom contract from template
   */
  async generateCustomContract(templateId, data) {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const document = await template.generate(data);
      
      return {
        success: true,
        document,
        documentType: 'custom',
        templateId,
        metadata: {
          id: this.generateDocumentId(),
          templateId,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Failed to generate custom contract:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Preview document before generation
   */
  async previewDocument(documentType, data) {
    try {
      // Validate data first
      this.validateDocumentData(documentType, data);

      // Generate preview with placeholder styling
      const template = this.legalTemplates[documentType];
      if (!template) {
        throw new Error(`Template not found: ${documentType}`);
      }

      const preview = await template.generatePreview(data);
      
      return {
        success: true,
        preview,
        estimatedLength: preview.length,
        warnings: this.checkDocumentWarnings(documentType, data),
      };
    } catch (error) {
      console.error('❌ Failed to generate document preview:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check for potential issues in document data
   */
  checkDocumentWarnings(documentType, data) {
    const warnings = [];

    // Common warnings
    if (data.jurisdiction && !this.isValidJurisdiction(data.jurisdiction)) {
      warnings.push('Jurisdiction may not be supported');
    }

    // Document-specific warnings
    if (documentType === 'termSheet') {
      if (data.equity > 0.5) {
        warnings.push('Equity percentage over 50% - consider implications');
      }
      
      if (data.investmentAmount > 1000000 && !data.boardSeats) {
        warnings.push('Large investment without board representation');
      }
    }

    return warnings;
  }

  /**
   * Export document in different formats
   */
  async exportDocument(document, format = 'pdf') {
    try {
      const exporters = {
        pdf: this.exportToPDF,
        docx: this.exportToDocx,
        html: this.exportToHTML,
        txt: this.exportToText,
      };

      const exporter = exporters[format];
      if (!exporter) {
        throw new Error(`Unsupported export format: ${format}`);
      }

      const exportedDocument = await exporter.call(this, document);
      
      return {
        success: true,
        format,
        data: exportedDocument,
        filename: `contract_${Date.now()}.${format}`,
      };
    } catch (error) {
      console.error('❌ Failed to export document:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async exportToPDF(document) {
    // In a real implementation, this would use a PDF generation library
    console.log('📄 Exporting to PDF...');
    return `PDF_DATA_${document.length}_BYTES`;
  }

  async exportToDocx(document) {
    console.log('📄 Exporting to DOCX...');
    return `DOCX_DATA_${document.length}_BYTES`;
  }

  async exportToHTML(document) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Legal Document</title>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 20px; }
          .signature-block { margin-top: 50px; }
        </style>
      </head>
      <body>
        ${document}
      </body>
      </html>
    `;
  }

  async exportToText(document) {
    // Strip HTML tags and return plain text
    return document.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Save generated document
   */
  async saveDocument(document, metadata) {
    try {
      const savedDocument = {
        id: metadata.id,
        content: document,
        metadata,
        savedAt: new Date().toISOString(),
        version: '1.0',
      };

      // In a real implementation, this would save to database
      console.log('💾 Document saved:', metadata.id);
      
      return {
        success: true,
        documentId: metadata.id,
        savedDocument,
      };
    } catch (error) {
      console.error('❌ Failed to save document:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Helper methods
  generateDocumentId() {
    return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  isValidJurisdiction(jurisdiction) {
    const supportedJurisdictions = [
      'nigeria', 'kenya', 'south africa', 'ghana', 'uganda',
      'tanzania', 'rwanda', 'zambia', 'botswana', 'mauritius'
    ];
    return supportedJurisdictions.includes(jurisdiction.toLowerCase());
  }

  async loadCustomTemplates() {
    // Load custom templates from storage
    console.log('📋 Loading custom templates...');
  }

  /**
   * Get available document types
   */
  getAvailableDocumentTypes() {
    return [
      {
        type: 'termSheet',
        name: 'Term Sheet',
        description: 'Investment term sheet outlining key terms',
        category: 'investment',
      },
      {
        type: 'investmentAgreement',
        name: 'Investment Agreement',
        description: 'Comprehensive investment agreement',
        category: 'investment',
      },
      {
        type: 'nda',
        name: 'Non-Disclosure Agreement',
        description: 'Confidentiality agreement',
        category: 'legal',
      },
      {
        type: 'convertibleNote',
        name: 'Convertible Note',
        description: 'Convertible debt instrument',
        category: 'investment',
      },
      {
        type: 'safe',
        name: 'SAFE Agreement',
        description: 'Simple Agreement for Future Equity',
        category: 'investment',
      },
    ];
  }
}

/**
 * Base Template Class
 */
class BaseTemplate {
  async initialize() {
    console.log(`📄 ${this.constructor.name} initialized`);
  }

  async generate(data) {
    throw new Error('Generate method must be implemented by subclass');
  }

  async generatePreview(data) {
    const fullDocument = await this.generate(data);
    return fullDocument.substring(0, 500) + '...';
  }

  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

/**
 * Term Sheet Template
 */
class TermSheetTemplate extends BaseTemplate {
  async generate(data) {
    return `
      <div class="header">
        <h1>TERM SHEET</h1>
        <h2>${data.companyName}</h2>
        <p>Investment by ${data.investorName}</p>
      </div>

      <div class="section">
        <h3>INVESTMENT TERMS</h3>
        <table>
          <tr>
            <td><strong>Company:</strong></td>
            <td>${data.companyName}</td>
          </tr>
          <tr>
            <td><strong>Investor:</strong></td>
            <td>${data.investorName}</td>
          </tr>
          <tr>
            <td><strong>Investment Amount:</strong></td>
            <td>${this.formatCurrency(data.investmentAmount)}</td>
          </tr>
          <tr>
            <td><strong>Pre-money Valuation:</strong></td>
            <td>${this.formatCurrency(data.valuation)}</td>
          </tr>
          <tr>
            <td><strong>Post-money Valuation:</strong></td>
            <td>${this.formatCurrency(data.valuation + data.investmentAmount)}</td>
          </tr>
          <tr>
            <td><strong>Equity Percentage:</strong></td>
            <td>${((data.investmentAmount / (data.valuation + data.investmentAmount)) * 100).toFixed(2)}%</td>
          </tr>
          <tr>
            <td><strong>Investment Type:</strong></td>
            <td>${data.investmentType || 'Equity'}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h3>GOVERNANCE TERMS</h3>
        <ul>
          <li><strong>Board Composition:</strong> ${data.boardSeats || 'To be determined'}</li>
          <li><strong>Voting Rights:</strong> ${data.votingRights || 'Standard voting rights'}</li>
          <li><strong>Information Rights:</strong> ${data.informationRights || 'Standard information rights'}</li>
        </ul>
      </div>

      <div class="section">
        <h3>LIQUIDATION PREFERENCE</h3>
        <p>${data.liquidationPreference || '1x non-participating preferred'}</p>
      </div>

      <div class="section">
        <h3>PROTECTIVE PROVISIONS</h3>
        <ul>
          <li><strong>Anti-dilution:</strong> ${data.antiDilution || 'Weighted average broad-based'}</li>
          <li><strong>Drag-along Rights:</strong> ${data.dragAlong ? 'Yes' : 'No'}</li>
          <li><strong>Tag-along Rights:</strong> ${data.tagAlong ? 'Yes' : 'No'}</li>
          <li><strong>Preemptive Rights:</strong> ${data.preemptiveRights ? 'Yes' : 'No'}</li>
        </ul>
      </div>

      <div class="section">
        <h3>CLOSING CONDITIONS</h3>
        <ul>
          <li>Completion of legal due diligence</li>
          <li>Execution of definitive agreements</li>
          <li>Board and shareholder approvals</li>
          <li>No material adverse changes</li>
        </ul>
      </div>

      <div class="section">
        <h3>OTHER TERMS</h3>
        <p><strong>Closing Date:</strong> ${this.formatDate(data.closingDate || new Date())}</p>
        <p><strong>Governing Law:</strong> ${data.jurisdiction || 'Nigeria'}</p>
        <p><strong>Confidentiality:</strong> This term sheet is confidential</p>
      </div>

      <div class="signature-block">
        <p>This term sheet is not legally binding except for the confidentiality provisions.</p>
        <br><br>
        <table style="width: 100%">
          <tr>
            <td style="width: 50%">
              <strong>${data.companyName}</strong><br><br>
              _________________________<br>
              Signature<br><br>
              Date: _______________
            </td>
            <td style="width: 50%">
              <strong>${data.investorName}</strong><br><br>
              _________________________<br>
              Signature<br><br>
              Date: _______________
            </td>
          </tr>
        </table>
      </div>
    `;
  }
}

/**
 * Investment Agreement Template
 */
class InvestmentAgreementTemplate extends BaseTemplate {
  async generate(data) {
    return `
      <div class="header">
        <h1>INVESTMENT AGREEMENT</h1>
        <p>Between ${data.companyName} and ${data.investorName}</p>
      </div>

      <div class="section">
        <h3>1. INVESTMENT TERMS</h3>
        <p>This Investment Agreement governs the investment of ${this.formatCurrency(data.investmentAmount)} 
        by ${data.investorName} in ${data.companyName}.</p>
        
        <p>The investment shall be made in exchange for equity representing 
        ${((data.investmentAmount / (data.valuation + data.investmentAmount)) * 100).toFixed(2)}% 
        of the company's outstanding shares.</p>
      </div>

      <div class="section">
        <h3>2. REPRESENTATIONS AND WARRANTIES</h3>
        <p>Each party represents and warrants that they have the authority to enter into this agreement.</p>
      </div>

      <div class="section">
        <h3>3. CONDITIONS PRECEDENT</h3>
        <ul>
          <li>Completion of due diligence</li>
          <li>Board and shareholder approvals</li>
          <li>No material adverse changes</li>
        </ul>
      </div>

      <div class="signature-block">
        <table style="width: 100%">
          <tr>
            <td style="width: 50%">
              <strong>${data.companyName}</strong><br><br>
              _________________________<br>
              Authorized Signatory<br><br>
              Date: _______________
            </td>
            <td style="width: 50%">
              <strong>${data.investorName}</strong><br><br>
              _________________________<br>
              Authorized Signatory<br><br>
              Date: _______________
            </td>
          </tr>
        </table>
      </div>
    `;
  }
}

/**
 * NDA Template
 */
class NDATemplate extends BaseTemplate {
  async generate(data) {
    return `
      <div class="header">
        <h1>NON-DISCLOSURE AGREEMENT</h1>
        <p>Between ${data.disclosingParty} and ${data.receivingParty}</p>
      </div>

      <div class="section">
        <h3>1. CONFIDENTIAL INFORMATION</h3>
        <p>For purposes of this Agreement, "Confidential Information" means any and all information 
        disclosed by the Disclosing Party to the Receiving Party.</p>
      </div>

      <div class="section">
        <h3>2. OBLIGATIONS</h3>
        <p>The Receiving Party agrees to:</p>
        <ul>
          <li>Hold all Confidential Information in strict confidence</li>
          <li>Not disclose Confidential Information to third parties</li>
          <li>Use Confidential Information solely for evaluation purposes</li>
        </ul>
      </div>

      <div class="section">
        <h3>3. TERM</h3>
        <p>This Agreement shall remain in effect for ${data.term || '2 years'} from the Effective Date.</p>
      </div>

      <div class="signature-block">
        <table style="width: 100%">
          <tr>
            <td style="width: 50%">
              <strong>Disclosing Party:</strong><br>
              ${data.disclosingParty}<br><br>
              _________________________<br>
              Signature<br><br>
              Date: _______________
            </td>
            <td style="width: 50%">
              <strong>Receiving Party:</strong><br>
              ${data.receivingParty}<br><br>
              _________________________<br>
              Signature<br><br>
              Date: _______________
            </td>
          </tr>
        </table>
      </div>
    `;
  }
}

/**
 * Convertible Note Template
 */
class ConvertibleNoteTemplate extends BaseTemplate {
  async generate(data) {
    return `
      <div class="header">
        <h1>CONVERTIBLE PROMISSORY NOTE</h1>
        <p>${data.companyName}</p>
      </div>

      <div class="section">
        <h3>PRINCIPAL AMOUNT AND TERMS</h3>
        <p><strong>Principal Amount:</strong> ${this.formatCurrency(data.principalAmount)}</p>
        <p><strong>Interest Rate:</strong> ${data.interestRate || '8'}% per annum</p>
        <p><strong>Maturity Date:</strong> ${this.formatDate(data.maturityDate)}</p>
        <p><strong>Discount Rate:</strong> ${data.discountRate || '20'}%</p>
        <p><strong>Valuation Cap:</strong> ${data.valuationCap ? this.formatCurrency(data.valuationCap) : 'None'}</p>
      </div>

      <div class="section">
        <h3>CONVERSION EVENTS</h3>
        <p>This note shall automatically convert upon:</p>
        <ul>
          <li>Qualified financing round</li>
          <li>Sale of the company</li>
          <li>Maturity date</li>
        </ul>
      </div>

      <div class="signature-block">
        <table style="width: 100%">
          <tr>
            <td style="width: 50%">
              <strong>Company:</strong><br>
              ${data.companyName}<br><br>
              _________________________<br>
              Authorized Signatory<br><br>
              Date: _______________
            </td>
            <td style="width: 50%">
              <strong>Investor:</strong><br>
              ${data.investorName}<br><br>
              _________________________<br>
              Signature<br><br>
              Date: _______________
            </td>
          </tr>
        </table>
      </div>
    `;
  }
}

/**
 * SAFE Template
 */
class SAFETemplate extends BaseTemplate {
  async generate(data) {
    return `
      <div class="header">
        <h1>SIMPLE AGREEMENT FOR FUTURE EQUITY</h1>
        <p>${data.companyName}</p>
      </div>

      <div class="section">
        <h3>SAFE TERMS</h3>
        <p><strong>Purchase Amount:</strong> ${this.formatCurrency(data.purchaseAmount)}</p>
        <p><strong>Valuation Cap:</strong> ${data.valuationCap ? this.formatCurrency(data.valuationCap) : 'None'}</p>
        <p><strong>Discount Rate:</strong> ${data.discountRate || 'None'}</p>
        <p><strong>SAFE Type:</strong> ${data.safeType || 'Pre-money valuation cap'}</p>
      </div>

      <div class="section">
        <h3>EQUITY CONVERSION</h3>
        <p>This SAFE will convert into shares of the Company's capital stock upon certain events 
        as defined in the agreement.</p>
      </div>

      <div class="signature-block">
        <table style="width: 100%">
          <tr>
            <td style="width: 50%">
              <strong>Company:</strong><br>
              ${data.companyName}<br><br>
              _________________________<br>
              Authorized Signatory<br><br>
              Date: _______________
            </td>
            <td style="width: 50%">
              <strong>Investor:</strong><br>
              ${data.investorName}<br><br>
              _________________________<br>
              Signature<br><br>
              Date: _______________
            </td>
          </tr>
        </table>
      </div>
    `;
  }
}

/**
 * Shareholder Agreement Template
 */
class ShareholderAgreementTemplate extends BaseTemplate {
  async generate(data) {
    return `
      <div class="header">
        <h1>SHAREHOLDER AGREEMENT</h1>
        <p>${data.companyName}</p>
      </div>

      <div class="section">
        <h3>SHAREHOLDERS</h3>
        <p>This agreement governs the rights and obligations between the shareholders of ${data.companyName}.</p>
      </div>

      <div class="section">
        <h3>BOARD COMPOSITION</h3>
        <p>The Board of Directors shall consist of ${data.boardSize || '5'} members.</p>
      </div>

      <div class="section">
        <h3>TRANSFER RESTRICTIONS</h3>
        <p>Shares may not be transferred without prior written consent of the majority shareholders.</p>
      </div>

      <div class="signature-block">
        <p><strong>Signatures of all shareholders required</strong></p>
      </div>
    `;
  }
}

// Export singleton instance
const contractGenerationService = new ContractGenerationService();
export default contractGenerationService;