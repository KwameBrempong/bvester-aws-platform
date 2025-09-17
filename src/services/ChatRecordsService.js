/**
 * 🤖 CHAT RECORDS SERVICE
 * AI-powered transaction parsing from natural language
 * Designed for Ghanaian business owners
 */

import { dynamoDBService } from './aws/DynamoDBService';

class ChatRecordsService {
  constructor() {
    this.transactionKeywords = {
      income: [
        'sold', 'sale', 'sales', 'received', 'payment', 'paid', 'income', 'earn', 'made',
        'customer', 'client', 'buyer', 'profit', 'revenue', 'cash', 'money',
        // Ghanaian specific
        'akoko', 'adeɛ', 'sika', 'customer pay', 'customer paid'
      ],
      expense: [
        'bought', 'buy', 'purchase', 'spent', 'cost', 'expense', 'paid for', 'bill',
        'fuel', 'transport', 'taxi', 'trotro', 'supplies', 'stock', 'goods',
        'rent', 'salary', 'wages', 'electricity', 'water', 'phone'
      ]
    };

    this.categories = {
      // Income categories
      sales: ['sold', 'sale', 'customer', 'client', 'profit'],
      services: ['service', 'work', 'job', 'repair', 'fix'],
      other_income: ['gift', 'loan', 'investment', 'interest'],

      // Expense categories
      inventory: ['bought', 'stock', 'goods', 'supplies', 'materials'],
      transport: ['fuel', 'taxi', 'trotro', 'transport', 'car', 'bus'],
      utilities: ['electricity', 'water', 'phone', 'internet', 'bill'],
      rent: ['rent', 'office', 'shop', 'store'],
      salaries: ['salary', 'wages', 'staff', 'worker', 'employee'],
      other_expenses: ['other', 'misc', 'miscellaneous']
    };

    this.ghanaianCurrencyRegex = /(?:GHC|GHS|GH₵|₵)\s*(\d+(?:\.\d{2})?)/i;
    this.amountRegex = /(\d+(?:\.\d{2})?)/g;
  }

  /**
   * Process a natural language transaction message
   */
  async processTransactionMessage(message, userId) {
    try {
      console.log('Processing message:', message);

      // Parse the transaction from natural language
      const transaction = this.parseTransaction(message);

      if (!transaction) {
        return {
          success: false,
          error: 'Could not parse transaction from message'
        };
      }

      // Save to database
      const savedTransaction = await this.saveTransaction(transaction, userId);

      // Save chat message
      await this.saveChatMessage({
        userId,
        message,
        transaction: savedTransaction,
        timestamp: new Date(),
        processed: true
      });

      return {
        success: true,
        transaction: savedTransaction,
        message: 'Transaction recorded successfully!'
      };

    } catch (error) {
      console.error('Error processing transaction message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse transaction from natural language
   */
  parseTransaction(message) {
    const lowerMessage = message.toLowerCase();

    // Extract amount
    const amount = this.extractAmount(message);
    if (!amount) return null;

    // Determine transaction type
    const type = this.determineTransactionType(lowerMessage);

    // Extract description and category
    const description = this.extractDescription(message);
    const category = this.determineCategory(lowerMessage, type);

    return {
      type,
      amount,
      description,
      category,
      originalMessage: message,
      timestamp: new Date(),
      currency: 'GHS'
    };
  }

  /**
   * Extract monetary amount from message
   */
  extractAmount(message) {
    // First try to find Ghanaian currency format
    const ghcMatch = message.match(this.ghanaianCurrencyRegex);
    if (ghcMatch) {
      return parseFloat(ghcMatch[1]);
    }

    // Look for standalone numbers that could be amounts
    const numbers = message.match(this.amountRegex);
    if (numbers) {
      // Take the largest number as the amount (assumes it's the transaction amount)
      const amounts = numbers.map(n => parseFloat(n)).filter(n => n > 0);
      if (amounts.length > 0) {
        return Math.max(...amounts);
      }
    }

    return null;
  }

  /**
   * Determine if transaction is income or expense
   */
  determineTransactionType(message) {
    const incomeScore = this.transactionKeywords.income.reduce((score, keyword) => {
      return score + (message.includes(keyword) ? 1 : 0);
    }, 0);

    const expenseScore = this.transactionKeywords.expense.reduce((score, keyword) => {
      return score + (message.includes(keyword) ? 1 : 0);
    }, 0);

    return incomeScore >= expenseScore ? 'income' : 'expense';
  }

  /**
   * Extract transaction description
   */
  extractDescription(message) {
    // Remove currency symbols and amounts to get cleaner description
    let description = message
      .replace(this.ghanaianCurrencyRegex, '')
      .replace(/\d+(\.\d{2})?/g, '')
      .trim();

    // Capitalize first letter
    description = description.charAt(0).toUpperCase() + description.slice(1);

    // If description is too short, use original message
    if (description.length < 5) {
      description = message;
    }

    return description;
  }

  /**
   * Determine transaction category
   */
  determineCategory(message, type) {
    const categoryScores = {};

    // Score each category based on keyword matches
    for (const [category, keywords] of Object.entries(this.categories)) {
      categoryScores[category] = keywords.reduce((score, keyword) => {
        return score + (message.includes(keyword) ? 1 : 0);
      }, 0);
    }

    // Find category with highest score
    const bestCategory = Object.entries(categoryScores)
      .sort(([,a], [,b]) => b - a)[0];

    if (bestCategory[1] > 0) {
      return bestCategory[0];
    }

    // Default categories if no match found
    return type === 'income' ? 'sales' : 'other_expenses';
  }

  /**
   * Save transaction to database
   */
  async saveTransaction(transaction, userId) {
    try {
      const transactionData = {
        ...transaction,
        source: 'chat'
      };

      return await dynamoDBService.createTransaction(userId, transactionData);

    } catch (error) {
      console.error('Error saving transaction:', error);
      throw error;
    }
  }

  /**
   * Save chat message to database
   */
  async saveChatMessage(messageData) {
    try {
      return await dynamoDBService.saveChatMessage(messageData);
    } catch (error) {
      console.error('Error saving chat message:', error);
      throw error;
    }
  }

  /**
   * Get chat history for user
   */
  async getChatHistory(userId, limitCount = 50) {
    try {
      const history = await dynamoDBService.getChatHistory(userId, limitCount);
      return history.map(message => ({
        ...message,
        timestamp: new Date(message.createdAt)
      }));

    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  /**
   * Get transaction summary for user
   */
  async getTransactionSummary(userId, days = 30) {
    try {
      const transactions = await dynamoDBService.getUserTransactions(userId, {
        limit: 1000,
        days: days
      });

      // Calculate summary
      const summary = {
        totalTransactions: transactions.length,
        totalIncome: 0,
        totalExpenses: 0,
        netIncome: 0,
        categories: {}
      };

      transactions.forEach(transaction => {
        if (transaction.type === 'income') {
          summary.totalIncome += transaction.amount;
        } else {
          summary.totalExpenses += transaction.amount;
        }

        // Category breakdown
        if (!summary.categories[transaction.category]) {
          summary.categories[transaction.category] = {
            count: 0,
            total: 0,
            type: transaction.type
          };
        }
        summary.categories[transaction.category].count++;
        summary.categories[transaction.category].total += transaction.amount;
      });

      summary.netIncome = summary.totalIncome - summary.totalExpenses;

      return summary;

    } catch (error) {
      console.error('Error getting transaction summary:', error);
      throw error;
    }
  }

  /**
   * Generate helpful suggestions for user
   */
  getSuggestions() {
    return [
      "Try: 'Sold 5 bags of rice for GHC 250'",
      "Try: 'Customer paid GHC 120 for foodstuff'",
      "Try: 'Bought fuel for GHC 50'",
      "Try: 'Transport cost GHC 15'",
      "Try: 'Received payment GHC 300'",
      "Try: 'Shop rent GHC 200'",
      "Try: 'Staff salary GHC 400'"
    ];
  }

  /**
   * Validate transaction before saving
   */
  validateTransaction(transaction) {
    const errors = [];

    if (!transaction.amount || transaction.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
      errors.push('Transaction type must be income or expense');
    }

    if (!transaction.description || transaction.description.trim().length < 2) {
      errors.push('Description is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Create singleton instance
const chatRecordsService = new ChatRecordsService();

export { chatRecordsService };