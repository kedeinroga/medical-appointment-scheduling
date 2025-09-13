#!/bin/bash
set -e

STAGE=${1:-dev}
PREVIOUS_VERSION=${2}

if [ -z "$PREVIOUS_VERSION" ]; then
    echo "❌ Error: Previous version not specified"
    echo "Usage: $0 <stage> <previous_version>"
    echo "Example: $0 dev 1634567890000"
    exit 1
fi

echo "🔄 Rolling back $STAGE to version $PREVIOUS_VERSION"

# Set region from environment or default
REGION=${AWS_REGION:-us-east-1}

# Check if we have AWS credentials
echo "🔗 Checking AWS connectivity..."
aws sts get-caller-identity

# Check if the previous deployment exists
echo "📋 Verifying previous deployment exists..."
if ! aws cloudformation describe-stacks --stack-name medical-appointment-scheduling-$STAGE --region $REGION > /dev/null 2>&1; then
    echo "❌ Error: Stack medical-appointment-scheduling-$STAGE does not exist"
    exit 1
fi

# Rollback application stack using Serverless Framework
echo "🔄 Rolling back application stack..."
serverless rollback --timestamp $PREVIOUS_VERSION --stage $STAGE --region $REGION

# Wait a moment for rollback to complete
echo "⏳ Waiting for rollback to complete..."
sleep 30

# Verify rollback by checking stack status
echo "🧪 Verifying rollback..."
STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name medical-appointment-scheduling-$STAGE \
    --region $REGION \
    --query 'Stacks[0].StackStatus' \
    --output text)

if [[ "$STACK_STATUS" == *"COMPLETE"* ]]; then
    echo "✅ Stack status: $STACK_STATUS"
else
    echo "⚠️  Stack status: $STACK_STATUS"
    echo "Please check CloudFormation console for details"
fi

# Run post-deployment verification
echo "🧪 Running post-rollback verification..."
if [ -f "./.github/scripts/post-deploy.sh" ]; then
    ./.github/scripts/post-deploy.sh $STAGE $REGION
else
    echo "⚠️  Post-deploy script not found, skipping verification"
fi

echo "✅ Rollback completed successfully!"
echo ""
echo "📋 Rollback Summary:"
echo "- Stage: $STAGE"
echo "- Previous Version: $PREVIOUS_VERSION" 
echo "- Region: $REGION"
echo "- Stack Status: $STACK_STATUS"
echo ""
echo "💡 Next steps:"
echo "1. Verify application functionality"
echo "2. Check logs in CloudWatch"
echo "3. Monitor metrics for any issues"
