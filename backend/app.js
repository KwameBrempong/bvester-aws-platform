// Elastic Beanstalk expects app.js or application.js as entry point
// This file simply exports the server for EB compatibility
module.exports = require('./server-aws.js');