# Backend Context

## Infrastructure
- **Service**: AWS Lambda
- **Database**: DynamoDB
- **Deployment**: SAM CLI or Serverless Framework

## Important Constraints
- **NO Elastic Beanstalk references should exist**
- Focus exclusively on serverless architecture
- All backend services must be Lambda-based
- Database operations limited to DynamoDB only

## Architecture Overview
This backend is built on a fully serverless architecture using AWS Lambda functions and DynamoDB for data persistence. The system is designed for scalability, cost-effectiveness, and optimal performance in the African fintech market.

## Key Technologies
- **Compute**: AWS Lambda (Node.js runtime)
- **Database**: Amazon DynamoDB
- **API**: AWS API Gateway
- **Authentication**: JWT with AWS Cognito (optional)
- **Monitoring**: AWS CloudWatch
- **Deployment**: AWS SAM CLI or Serverless Framework

## Development Guidelines
- All functions should be stateless
- Use environment variables for configuration
- Implement proper error handling and logging
- Follow DynamoDB single-table design patterns where appropriate
- Optimize for cold start performance
- Use AWS SDK v3 for better performance and tree-shaking