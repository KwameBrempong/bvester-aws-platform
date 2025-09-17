/**
 * 🗄️ BVESTER - DYNAMODB API ROUTES
 * Direct database operations for AWS DynamoDB
 */

const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../../middleware/authMiddleware');
const logger = require('../../utils/logger');

// Configure AWS DynamoDB
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

/**
 * 📝 CREATE RECORD
 * Generic create operation for any table
 */
router.post('/:tableName', authMiddleware, async (req, res) => {
  try {
    const { tableName } = req.params;
    const { action, data } = req.body;

    if (action !== 'create' || !data) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request format'
      });
    }

    // Add environment suffix to table name
    const fullTableName = `${tableName}-prod`;

    // Ensure required fields
    const item = {
      ...data,
      id: data.id || uuidv4(),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const params = {
      TableName: fullTableName,
      Item: item,
      ConditionExpression: 'attribute_not_exists(id)' // Prevent overwriting
    };

    await dynamodb.put(params).promise();

    res.json({
      success: true,
      data: item,
      message: 'Record created successfully'
    });

  } catch (error) {
    logger.error('DynamoDB create error:', error);

    if (error.code === 'ConditionalCheckFailedException') {
      return res.status(409).json({
        success: false,
        error: 'Record already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create record'
    });
  }
});

/**
 * 📖 GET RECORD BY ID
 * Get a single record by ID
 */
router.get('/:tableName/:id', authMiddleware, async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const fullTableName = `${tableName}-prod`;

    const params = {
      TableName: fullTableName,
      Key: { id }
    };

    const result = await dynamodb.get(params).promise();

    if (!result.Item) {
      return res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }

    res.json({
      success: true,
      data: result.Item
    });

  } catch (error) {
    logger.error('DynamoDB get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get record'
    });
  }
});

/**
 * 📋 QUERY RECORDS
 * Query records with various conditions
 */
router.get('/:tableName', authMiddleware, async (req, res) => {
  try {
    const { tableName } = req.params;
    const {
      userId,
      limit = 50,
      startDate,
      endDate,
      sortBy = 'createdAt',
      order = 'desc',
      lastEvaluatedKey
    } = req.query;

    const fullTableName = `${tableName}-prod`;

    let params = {
      TableName: fullTableName,
      Limit: parseInt(limit),
      ScanIndexForward: order === 'asc'
    };

    // If userId is provided, use GSI for efficient querying
    if (userId) {
      params.IndexName = 'userId-createdAt-index';
      params.KeyConditionExpression = 'userId = :userId';
      params.ExpressionAttributeValues = {
        ':userId': userId
      };

      // Add date range filter if provided
      if (startDate || endDate) {
        let filterExpression = '';
        const filterValues = {};

        if (startDate) {
          filterExpression += 'createdAt >= :startDate';
          filterValues[':startDate'] = startDate;
        }

        if (endDate) {
          if (filterExpression) filterExpression += ' AND ';
          filterExpression += 'createdAt <= :endDate';
          filterValues[':endDate'] = endDate;
        }

        params.FilterExpression = filterExpression;
        params.ExpressionAttributeValues = {
          ...params.ExpressionAttributeValues,
          ...filterValues
        };
      }

      // Use Query for indexed access
      const result = await dynamodb.query(params).promise();

      res.json({
        success: true,
        data: result.Items || [],
        lastEvaluatedKey: result.LastEvaluatedKey,
        count: result.Count
      });

    } else {
      // Use Scan for non-indexed queries (less efficient, use sparingly)
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = JSON.parse(lastEvaluatedKey);
      }

      const result = await dynamodb.scan(params).promise();

      res.json({
        success: true,
        data: result.Items || [],
        lastEvaluatedKey: result.LastEvaluatedKey,
        count: result.Count
      });
    }

  } catch (error) {
    logger.error('DynamoDB query error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to query records'
    });
  }
});

/**
 * ✏️ UPDATE RECORD
 * Update an existing record
 */
router.put('/:tableName/:id', authMiddleware, async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const { action, data } = req.body;

    if (action !== 'update' || !data) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request format'
      });
    }

    const fullTableName = `${tableName}-prod`;

    // Build update expression
    const updateExpressions = [];
    const attributeNames = {};
    const attributeValues = {};

    Object.entries(data).forEach(([key, value], index) => {
      if (key !== 'id' && key !== 'createdAt') { // Don't update id or createdAt
        const nameKey = `#attr${index}`;
        const valueKey = `:val${index}`;

        updateExpressions.push(`${nameKey} = ${valueKey}`);
        attributeNames[nameKey] = key;
        attributeValues[valueKey] = value;
      }
    });

    // Always update the updatedAt timestamp
    updateExpressions.push('#updatedAt = :updatedAt');
    attributeNames['#updatedAt'] = 'updatedAt';
    attributeValues[':updatedAt'] = new Date().toISOString();

    const params = {
      TableName: fullTableName,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: attributeNames,
      ExpressionAttributeValues: attributeValues,
      ReturnValues: 'ALL_NEW',
      ConditionExpression: 'attribute_exists(id)' // Ensure record exists
    };

    const result = await dynamodb.update(params).promise();

    res.json({
      success: true,
      data: result.Attributes,
      message: 'Record updated successfully'
    });

  } catch (error) {
    logger.error('DynamoDB update error:', error);

    if (error.code === 'ConditionalCheckFailedException') {
      return res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update record'
    });
  }
});

/**
 * 🗑️ DELETE RECORD
 * Delete a record by ID
 */
router.delete('/:tableName/:id', authMiddleware, async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const fullTableName = `${tableName}-prod`;

    const params = {
      TableName: fullTableName,
      Key: { id },
      ConditionExpression: 'attribute_exists(id)', // Ensure record exists
      ReturnValues: 'ALL_OLD'
    };

    const result = await dynamodb.delete(params).promise();

    res.json({
      success: true,
      data: result.Attributes,
      message: 'Record deleted successfully'
    });

  } catch (error) {
    logger.error('DynamoDB delete error:', error);

    if (error.code === 'ConditionalCheckFailedException') {
      return res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete record'
    });
  }
});

/**
 * 📦 BATCH OPERATIONS
 * Handle multiple operations in a single request
 */
router.post('/batch', authMiddleware, async (req, res) => {
  try {
    const { operations } = req.body;

    if (!operations || !Array.isArray(operations)) {
      return res.status(400).json({
        success: false,
        error: 'Operations array is required'
      });
    }

    const results = [];

    // Process operations in batches of 25 (DynamoDB limit)
    for (let i = 0; i < operations.length; i += 25) {
      const batch = operations.slice(i, i + 25);
      const batchResult = await processBatch(batch);
      results.push(...batchResult);
    }

    res.json({
      success: true,
      data: results,
      message: `${operations.length} operations processed`
    });

  } catch (error) {
    logger.error('DynamoDB batch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process batch operations'
    });
  }
});

/**
 * Helper function to process a batch of operations
 */
async function processBatch(operations) {
  const requestItems = {};

  operations.forEach(op => {
    const tableName = `${op.tableName}-prod`;

    if (!requestItems[tableName]) {
      requestItems[tableName] = [];
    }

    if (op.action === 'put') {
      requestItems[tableName].push({
        PutRequest: {
          Item: {
            ...op.data,
            id: op.data.id || uuidv4(),
            createdAt: op.data.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      });
    } else if (op.action === 'delete') {
      requestItems[tableName].push({
        DeleteRequest: {
          Key: { id: op.id }
        }
      });
    }
  });

  const params = { RequestItems: requestItems };
  const result = await dynamodb.batchWrite(params).promise();

  return {
    processed: operations.length,
    unprocessed: result.UnprocessedItems || {}
  };
}

/**
 * 🔍 SEARCH OPERATIONS
 * Full-text search across records (basic implementation)
 */
router.post('/search/:tableName', authMiddleware, async (req, res) => {
  try {
    const { tableName } = req.params;
    const { query, filters = {} } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const fullTableName = `${tableName}-prod`;

    // This is a basic implementation using scan with filter
    // For production, consider using Amazon Elasticsearch Service
    let params = {
      TableName: fullTableName,
      FilterExpression: 'contains(description, :query) OR contains(category, :query)',
      ExpressionAttributeValues: {
        ':query': query.toLowerCase()
      },
      Limit: 50
    };

    // Add additional filters
    if (filters.userId) {
      params.FilterExpression += ' AND userId = :userId';
      params.ExpressionAttributeValues[':userId'] = filters.userId;
    }

    if (filters.type) {
      params.FilterExpression += ' AND #type = :type';
      params.ExpressionAttributeNames = { '#type': 'type' };
      params.ExpressionAttributeValues[':type'] = filters.type;
    }

    const result = await dynamodb.scan(params).promise();

    res.json({
      success: true,
      data: result.Items || [],
      count: result.Count,
      query: query
    });

  } catch (error) {
    logger.error('DynamoDB search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search operation failed'
    });
  }
});

/**
 * 📊 ANALYTICS OPERATIONS
 * Get aggregated data for analytics
 */
router.get('/analytics/user/:userId/stats', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = '30' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));

    // Get transactions for the period
    const transactionParams = {
      TableName: 'bvester-transactions-prod',
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :userId AND createdAt BETWEEN :startDate AND :endDate',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':startDate': startDate.toISOString(),
        ':endDate': endDate.toISOString()
      }
    };

    const transactionResult = await dynamodb.query(transactionParams).promise();
    const transactions = transactionResult.Items || [];

    // Calculate statistics
    const stats = {
      totalTransactions: transactions.length,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlyNetIncome: 0,
      categories: {},
      transactionsByDay: {}
    };

    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        stats.monthlyIncome += transaction.amount || 0;
      } else {
        stats.monthlyExpenses += transaction.amount || 0;
      }

      // Category breakdown
      const category = transaction.category || 'other';
      if (!stats.categories[category]) {
        stats.categories[category] = { count: 0, total: 0 };
      }
      stats.categories[category].count++;
      stats.categories[category].total += transaction.amount || 0;

      // Daily breakdown
      const day = transaction.createdAt?.substring(0, 10);
      if (day) {
        if (!stats.transactionsByDay[day]) {
          stats.transactionsByDay[day] = { count: 0, income: 0, expenses: 0 };
        }
        stats.transactionsByDay[day].count++;
        if (transaction.type === 'income') {
          stats.transactionsByDay[day].income += transaction.amount || 0;
        } else {
          stats.transactionsByDay[day].expenses += transaction.amount || 0;
        }
      }
    });

    stats.monthlyNetIncome = stats.monthlyIncome - stats.monthlyExpenses;

    // Get latest business health assessment
    const assessmentParams = {
      TableName: 'bvester-business-health-assessments-prod',
      IndexName: 'userId-completedAt-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false,
      Limit: 1
    };

    const assessmentResult = await dynamodb.query(assessmentParams).promise();
    const latestAssessment = assessmentResult.Items?.[0];

    stats.businessHealthScore = latestAssessment?.score || 0;
    stats.investmentReadinessScore = latestAssessment?.investmentReadiness?.level === 'Investment Ready' ? 100 :
      latestAssessment?.investmentReadiness?.level === 'Nearly Ready' ? 75 :
      latestAssessment?.investmentReadiness?.level === 'Needs Development' ? 50 : 25;

    // Calculate active streak (days with transactions)
    const today = new Date().toISOString().substring(0, 10);
    let activeStreak = 0;
    let currentDate = new Date();

    for (let i = 0; i < 30; i++) {
      const dateStr = currentDate.toISOString().substring(0, 10);
      if (stats.transactionsByDay[dateStr]) {
        activeStreak++;
      } else {
        break;
      }
      currentDate.setDate(currentDate.getDate() - 1);
    }

    stats.activeStreak = activeStreak;

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics data'
    });
  }
});

module.exports = router;