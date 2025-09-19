#!/bin/bash

# Create API Gateway REST API for Bvester
echo "Creating API Gateway..."

# Create the REST API
API_ID=$(aws apigateway create-rest-api \
    --name "BvesterAPI" \
    --description "Bvester Authentication API" \
    --endpoint-configuration types=REGIONAL \
    --query 'id' \
    --output text)

echo "API ID: $API_ID"

# Get the root resource ID
ROOT_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[0].id' \
    --output text)

echo "Root Resource ID: $ROOT_ID"

# Create /api resource
API_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part "api" \
    --query 'id' \
    --output text)

# Create /api/auth resource
AUTH_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $API_RESOURCE_ID \
    --path-part "auth" \
    --query 'id' \
    --output text)

# Create /api/auth/signup resource
SIGNUP_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $AUTH_RESOURCE_ID \
    --path-part "signup" \
    --query 'id' \
    --output text)

# Create /api/auth/login resource
LOGIN_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $AUTH_RESOURCE_ID \
    --path-part "login" \
    --query 'id' \
    --output text)

echo "Resources created"

# Lambda ARN
LAMBDA_ARN="arn:aws:lambda:eu-west-2:565871520457:function:bvester-backend"

# Create POST method for signup
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $SIGNUP_RESOURCE_ID \
    --http-method POST \
    --authorization-type NONE

# Create OPTIONS method for signup (CORS)
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $SIGNUP_RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE

# Setup integration for signup POST
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $SIGNUP_RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:eu-west-2:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"

# Setup mock integration for OPTIONS (CORS)
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $SIGNUP_RESOURCE_ID \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\": 200}"}'

# Method response for POST
aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $SIGNUP_RESOURCE_ID \
    --http-method POST \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Origin":false}'

# Method response for OPTIONS
aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $SIGNUP_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":false,"method.response.header.Access-Control-Allow-Methods":false,"method.response.header.Access-Control-Allow-Origin":false}'

# Integration response for OPTIONS
aws apigateway put-integration-response \
    --rest-api-id $API_ID \
    --resource-id $SIGNUP_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'GET,OPTIONS,POST'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' \
    --response-templates '{"application/json":""}'

# Repeat for login endpoint
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $LOGIN_RESOURCE_ID \
    --http-method POST \
    --authorization-type NONE

aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $LOGIN_RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $LOGIN_RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:eu-west-2:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"

# Deploy API
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod

echo "API Gateway URL: https://$API_ID.execute-api.eu-west-2.amazonaws.com/prod"

# Add Lambda permission for API Gateway
aws lambda add-permission \
    --function-name bvester-backend \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:apigateway:eu-west-2::/restapis/$API_ID/*/*"

echo "Setup complete!"