/**
 * AWS Lambda Handler for Bvester API
 */

const serverless = require('serverless-http');
const app = require('./api/index');

// Export the handler
module.exports.handler = serverless(app);