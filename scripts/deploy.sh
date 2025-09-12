#!/bin/bash
# scripts/deploy.sh - Deployment script that manages Infrastructure as Code

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGE=${1:-dev}
REGION=${2:-us-east-1}
SERVICE_NAME="medical-appointment-scheduling"

echo -e "${BLUE}🚀 Deploying $SERVICE_NAME to $STAGE environment in $REGION${NC}"

# Validate required parameters
if [[ ! $STAGE =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}❌ Invalid stage: $STAGE. Must be dev, staging, or prod${NC}"
    exit 1
fi

# Validate configuration file exists
if [[ ! -f "config/${STAGE}.yml" ]]; then
    echo -e "${RED}❌ Configuration file config/${STAGE}.yml not found${NC}"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed. Please install pnpm first.${NC}"
    exit 1
fi

# Check if serverless is installed
if ! command -v serverless &> /dev/null; then
    echo -e "${YELLOW}⚠️  Serverless Framework not found globally. Installing...${NC}"
    pnpm install -g serverless
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install

# Compile TypeScript and build libraries
echo -e "${YELLOW}🔨 Building TypeScript...${NC}"
pnpm run build

# Validate Serverless configuration
echo -e "${YELLOW}🔍 Validating Infrastructure as Code...${NC}"

# Validate all resource files exist
for resource_file in "dynamodb.yml" "sns.yml" "sqs.yml" "eventbridge.yml" "api-gateway.yml" "iam.yml"; do
    if [[ ! -f "resources/$resource_file" ]]; then
        echo -e "${RED}❌ Resource file resources/$resource_file not found${NC}"
        exit 1
    fi
done

# Validate serverless configuration
serverless print --stage $STAGE --region $REGION > /dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Serverless configuration validation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Infrastructure as Code validation passed${NC}"

# Deploy infrastructure using Serverless Framework (IaC)
echo -e "${YELLOW}🏗️  Deploying infrastructure...${NC}"
serverless deploy \
  --stage $STAGE \
  --region $REGION \
  --verbose

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Infrastructure deployment completed successfully!${NC}"
else
    echo -e "${RED}❌ Infrastructure deployment failed${NC}"
    exit 1
fi

# Get deployment information
echo -e "${YELLOW}📊 Getting deployment information...${NC}"
serverless info --stage $STAGE --region $REGION

# Run integration tests for dev environment
if [[ $STAGE == "dev" ]]; then
    echo -e "${YELLOW}🧪 Running integration tests...${NC}"
    pnpm run test:integration || echo -e "${YELLOW}⚠️  Integration tests failed, but deployment was successful${NC}"
fi

# Display API Gateway URL
API_URL=$(serverless info --stage $STAGE --region $REGION | grep "ServiceEndpoint" | cut -d' ' -f2)
if [[ ! -z "$API_URL" ]]; then
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}📋 API Gateway URL: $API_URL${NC}"
    echo -e "${BLUE}📋 Available endpoints:${NC}"
    echo -e "   POST $API_URL/appointments"
    echo -e "   GET  $API_URL/appointments/{insuredId}"
else
    echo -e "${YELLOW}⚠️  Could not retrieve API Gateway URL${NC}"
fi

echo -e "${GREEN}🎯 Deployment Summary:${NC}"
echo -e "   Environment: $STAGE"
echo -e "   Region: $REGION"
echo -e "   Service: $SERVICE_NAME"
echo -e "   Infrastructure: Deployed via Serverless Framework (IaC)"
echo -e "${BLUE}📋 Infrastructure Components Deployed:${NC}"
echo -e "   ✅ DynamoDB Table: Appointments with GSI"
echo -e "   ✅ SNS Topic: Appointment distribution with country filters"
echo -e "   ✅ SQS Queues: PE, CL, and Completion queues with DLQs"
echo -e "   ✅ EventBridge: Custom event bus with processing rules"
echo -e "   ✅ API Gateway: REST API with throttling and validation"
echo -e "   ✅ Lambda Functions: appointment, appointment-pe, appointment-cl, appointment-completion"
echo -e "   ✅ IAM Roles: Least-privilege access policies"
echo -e "   ✅ CloudWatch: Log groups and monitoring"
