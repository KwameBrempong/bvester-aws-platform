// Elastic Beanstalk expects app.js or application.js as entry point
// This file simply exports the server for EB compatibility
// Auto-deployment via AWS CodePipeline is now configured!
module.exports = require('./server-aws.js');