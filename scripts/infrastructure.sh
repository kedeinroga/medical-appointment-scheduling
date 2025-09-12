#!/bin/bash
# scripts/infrastructure.sh - Infrastructure management script for Medical Appointment Scheduling

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGE=${2:-dev}
REGION=${3:-us-east-1}
SERVICE_NAME="medical-appointment-scheduling"

# Function to display usage
usage() {
    echo -e "${BLUE}Usage: $0 {deploy|remove|info|validate|logs} [stage] [region]${NC}"
    echo ""
    echo -e "${YELLOW}Commands:${NC}"
    echo "  deploy   - Deploy all infrastructure components"
    echo "  remove   - Remove all infrastructure components"
    echo "  info     - Display information about deployed infrastructure"
    echo "  validate - Validate Infrastructure as Code configuration"
    echo "  logs     - Show CloudWatch logs for all Lambda functions"
    echo ""
    echo -e "${YELLOW}Parameters:${NC}"
    echo "  stage    - Environment stage (dev, staging, prod) [default: dev]"
    echo "  region   - AWS region [default: us-east-1]"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 deploy dev us-east-1"
    echo "  $0 info prod"
    echo "  $0 validate"
    echo "  $0 remove dev"
}

# Function to validate IaC configuration
validate_iac() {
    echo -e "${YELLOW}🔍 Validating Infrastructure as Code configuration...${NC}"
    
    # Check if all resource files exist
    local missing_files=()
    for resource_file in "dynamodb.yml" "sns.yml" "sqs.yml" "eventbridge.yml" "api-gateway.yml" "iam.yml"; do
        if [[ ! -f "resources/$resource_file" ]]; then
            missing_files+=("resources/$resource_file")
        fi
    done
    
    if [ ${#missing_files[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing resource files:${NC}"
        for file in "${missing_files[@]}"; do
            echo "   - $file"
        done
        return 1
    fi
    
    # Check configuration file
    if [[ ! -f "config/${STAGE}.yml" ]]; then
        echo -e "${RED}❌ Configuration file config/${STAGE}.yml not found${NC}"
        return 1
    fi
    
    # Validate serverless configuration
    echo -e "${YELLOW}   Validating Serverless configuration...${NC}"
    if ! serverless print --stage $STAGE --region $REGION > /dev/null 2>&1; then
        echo -e "${RED}❌ Serverless configuration validation failed${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Infrastructure as Code validation passed${NC}"
    return 0
}

# Function to deploy infrastructure
deploy_infrastructure() {
    echo -e "${BLUE}🚀 Deploying Infrastructure as Code for $SERVICE_NAME${NC}"
    echo -e "   Stage: $STAGE"
    echo -e "   Region: $REGION"
    echo ""
    
    # Validate first
    if ! validate_iac; then
        echo -e "${RED}❌ Validation failed. Aborting deployment.${NC}"
        exit 1
    fi
    
    # Install dependencies
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    pnpm install
    
    # Build
    echo -e "${YELLOW}🔨 Building project...${NC}"
    pnpm run build
    
    # Deploy
    echo -e "${YELLOW}🏗️  Deploying infrastructure...${NC}"
    serverless deploy --stage $STAGE --region $REGION --verbose
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Infrastructure deployment completed successfully!${NC}"
        show_info
    else
        echo -e "${RED}❌ Infrastructure deployment failed${NC}"
        exit 1
    fi
}

# Function to remove infrastructure
remove_infrastructure() {
    echo -e "${RED}🗑️  WARNING: This will remove ALL infrastructure for $SERVICE_NAME${NC}"
    echo -e "   Stage: $STAGE"
    echo -e "   Region: $REGION"
    echo ""
    
    read -p "Are you sure you want to proceed? Type 'yes' to confirm: " confirm
    if [[ $confirm != "yes" ]]; then
        echo -e "${YELLOW}❌ Operation cancelled${NC}"
        exit 0
    fi
    
    echo -e "${YELLOW}🗑️  Removing infrastructure...${NC}"
    serverless remove --stage $STAGE --region $REGION --verbose
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Infrastructure removed successfully${NC}"
    else
        echo -e "${RED}❌ Infrastructure removal failed${NC}"
        exit 1
    fi
}

# Function to show infrastructure information
show_info() {
    echo -e "${BLUE}📊 Infrastructure Information${NC}"
    echo -e "   Service: $SERVICE_NAME"
    echo -e "   Stage: $STAGE"
    echo -e "   Region: $REGION"
    echo ""
    
    serverless info --stage $STAGE --region $REGION
    
    # Show API Gateway URL if available
    API_URL=$(serverless info --stage $STAGE --region $REGION 2>/dev/null | grep "ServiceEndpoint" | cut -d' ' -f2)
    if [[ ! -z "$API_URL" ]]; then
        echo ""
        echo -e "${GREEN}🌐 API Endpoints:${NC}"
        echo -e "   POST $API_URL/appointments"
        echo -e "   GET  $API_URL/appointments/{insuredId}"
    fi
    
    echo ""
    echo -e "${BLUE}📋 Infrastructure Components:${NC}"
    echo -e "   ✅ DynamoDB: Appointments table with GSI for queries"
    echo -e "   ✅ SNS: Topic with country-based message filtering"
    echo -e "   ✅ SQS: Separate queues for PE, CL, and completion"
    echo -e "   ✅ EventBridge: Custom event bus for appointment processing"
    echo -e "   ✅ API Gateway: REST API with validation and throttling"
    echo -e "   ✅ Lambda: 4 functions (appointment, appointment-pe, appointment-cl, completion)"
    echo -e "   ✅ IAM: Least-privilege roles and policies"
    echo -e "   ✅ CloudWatch: Log groups for monitoring"
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}📝 CloudWatch Logs for $SERVICE_NAME${NC}"
    echo -e "   Stage: $STAGE"
    echo ""
    
    local functions=("appointment" "appointment-pe" "appointment-cl" "appointment-completion")
    
    for func in "${functions[@]}"; do
        echo -e "${YELLOW}📋 Logs for $func:${NC}"
        serverless logs -f $func --stage $STAGE --region $REGION --tail
        echo ""
    done
}

# Main script logic
case "$1" in
    deploy)
        deploy_infrastructure
        ;;
    remove)
        remove_infrastructure
        ;;
    info)
        show_info
        ;;
    validate)
        validate_iac
        ;;
    logs)
        show_logs
        ;;
    *)
        usage
        exit 1
        ;;
esac
