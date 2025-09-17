/**
 * 🤖 BVESTER - CHAT RECORDS API ROUTES
 * API endpoints for AI-powered transaction recording
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { dynamoDBService } = require('../../services/aws/DynamoDBService');
const authMiddleware = require('../../middleware/authMiddleware');
const logger = require('../../utils/logger');

/**
 * 💬 PROCESS CHAT MESSAGE
 * Process a natural language transaction message
 */
router.post('/process', authMiddleware, async (req, res) => {
  try {
    const { message, timestamp } = req.body;
    const userId = req.user.uid;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Parse transaction from message
    const transaction = parseTransactionFromMessage(message);

    if (!transaction) {
      return res.status(400).json({
        success: false,
        error: 'Could not parse transaction from message. Please try a different format.',
        suggestions: [
          "Try: 'Sold 5 bags of rice for GHC 250'",
          "Try: 'Customer paid GHC 120 for foodstuff'",
          "Try: 'Bought fuel for GHC 50'"
        ]
      });
    }

    // Save transaction
    const transactionData = {
      id: uuidv4(),
      userId: userId,
      ...transaction,
      source: 'chat',
      originalMessage: message,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoDBService.create('bvester-transactions-prod', transactionData);

    // Save chat message
    const chatMessage = {
      id: uuidv4(),
      userId: userId,
      message: message,
      transaction: transactionData,
      timestamp: timestamp || new Date().toISOString(),
      processed: true,
      createdAt: new Date().toISOString()
    };

    await dynamoDBService.create('bvester-chat-messages-prod', chatMessage);

    res.json({
      success: true,
      message: 'Transaction recorded successfully!',
      transaction: transactionData,
      chatMessage: chatMessage
    });

  } catch (error) {
    logger.error('Chat processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
});

/**
 * 📝 GET CHAT HISTORY
 * Get chat message history for user
 */
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { limit = 50, startDate, endDate } = req.query;

    // Query chat messages for user
    const messages = await dynamoDBService.queryByUserId('bvester-chat-messages-prod', userId, {
      limit: parseInt(limit),
      startDate,
      endDate
    });

    res.json({
      success: true,
      messages: messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });

  } catch (error) {
    logger.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat history'
    });
  }
});

/**
 * 📊 GET TRANSACTION SUMMARY
 * Get transaction summary from chat records
 */
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { days = 30 } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    // Get transactions
    const transactions = await dynamoDBService.queryByUserId('bvester-transactions-prod', userId, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    // Calculate summary
    const summary = {
      totalTransactions: transactions.length,
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      categories: {},
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: parseInt(days)
      }
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

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    logger.error('Get summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction summary'
    });
  }
});

/**
 * 💡 GET SUGGESTIONS
 * Get helpful message format suggestions
 */
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const suggestions = [
      "Try: 'Sold 5 bags of rice for GHC 250'",
      "Try: 'Customer paid GHC 120 for foodstuff'",
      "Try: 'Bought fuel for GHC 50'",
      "Try: 'Transport cost GHC 15'",
      "Try: 'Received payment GHC 300'",
      "Try: 'Shop rent GHC 200'",
      "Try: 'Staff salary GHC 400'",
      "Try: 'Electricity bill GHC 80'",
      "Try: 'Sold phone credit GHC 30'",
      "Try: 'Water bill GHC 25'"
    ];

    res.json({
      success: true,
      suggestions
    });

  } catch (error) {
    logger.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions'
    });
  }
});

/**
 * Helper function to parse transaction from natural language
 */
function parseTransactionFromMessage(message) {
  const lowerMessage = message.toLowerCase();

  // Transaction keywords
  const transactionKeywords = {
    income: [
      'sold', 'sale', 'sales', 'received', 'payment', 'paid', 'income', 'earn', 'made',
      'customer', 'client', 'buyer', 'profit', 'revenue', 'cash', 'money',
      'akoko', 'adeɛ', 'sika', 'customer pay', 'customer paid'
    ],
    expense: [
      'bought', 'buy', 'purchase', 'spent', 'cost', 'expense', 'paid for', 'bill',
      'fuel', 'transport', 'taxi', 'trotro', 'supplies', 'stock', 'goods',
      'rent', 'salary', 'wages', 'electricity', 'water', 'phone'
    ]
  };

  const categories = {
    sales: ['sold', 'sale', 'customer', 'client', 'profit'],
    services: ['service', 'work', 'job', 'repair', 'fix'],
    other_income: ['gift', 'loan', 'investment', 'interest'],
    inventory: ['bought', 'stock', 'goods', 'supplies', 'materials'],
    transport: ['fuel', 'taxi', 'trotro', 'transport', 'car', 'bus'],
    utilities: ['electricity', 'water', 'phone', 'internet', 'bill'],
    rent: ['rent', 'office', 'shop', 'store'],
    salaries: ['salary', 'wages', 'staff', 'worker', 'employee'],
    other_expenses: ['other', 'misc', 'miscellaneous']
  };

  // Extract amount
  const ghcMatch = message.match(/(?:GHC|GHS|GH₵|₵)\s*(\d+(?:\.\d{2})?)/i);
  let amount = null;

  if (ghcMatch) {
    amount = parseFloat(ghcMatch[1]);
  } else {
    // Look for standalone numbers
    const numbers = message.match(/(\d+(?:\.\d{2})?)/g);
    if (numbers) {
      const amounts = numbers.map(n => parseFloat(n)).filter(n => n > 0);
      if (amounts.length > 0) {
        amount = Math.max(...amounts);
      }
    }
  }

  if (!amount || amount <= 0) {
    return null;
  }

  // Determine transaction type
  const incomeScore = transactionKeywords.income.reduce((score, keyword) => {
    return score + (lowerMessage.includes(keyword) ? 1 : 0);
  }, 0);

  const expenseScore = transactionKeywords.expense.reduce((score, keyword) => {
    return score + (lowerMessage.includes(keyword) ? 1 : 0);
  }, 0);

  const type = incomeScore >= expenseScore ? 'income' : 'expense';

  // Determine category
  const categoryScores = {};
  for (const [category, keywords] of Object.entries(categories)) {
    categoryScores[category] = keywords.reduce((score, keyword) => {
      return score + (lowerMessage.includes(keyword) ? 1 : 0);
    }, 0);
  }

  const bestCategory = Object.entries(categoryScores)
    .sort(([,a], [,b]) => b - a)[0];

  const category = bestCategory[1] > 0 ? bestCategory[0] : (type === 'income' ? 'sales' : 'other_expenses');

  // Extract description
  let description = message
    .replace(/(?:GHC|GHS|GH₵|₵)\s*(\d+(?:\.\d{2})?)/gi, '')
    .replace(/\d+(\.\d{2})?/g, '')
    .trim();

  description = description.charAt(0).toUpperCase() + description.slice(1);

  if (description.length < 5) {
    description = message;
  }

  return {
    type,
    amount,
    description,
    category,
    currency: 'GHS',
    timestamp: new Date().toISOString()
  };
}

module.exports = router;