#!/bin/bash
set -e

echo "🔍 Running pre-deployment checks..."

# Check if required environment variables are set
required_vars=("AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY" "AWS_REGION")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set"
        exit 1
    fi
done

# Set default stage if not provided
STAGE=${1:-dev}
REGION=${AWS_REGION:-us-east-1}

echo "📋 Pre-deployment checks for stage: $STAGE"

# Check AWS connectivity
echo "🔗 Testing AWS connectivity..."
aws sts get-caller-identity

# Check if infrastructure stack exists
echo "🏗️  Checking infrastructure stack..."
if aws cloudformation describe-stacks --stack-name medical-appointment-infrastructure-$STAGE --region $REGION > /dev/null 2>&1; then
    echo "✅ Infrastructure stack exists"
    
    # Verify RDS is available
    RDS_IDENTIFIER="medical-appointments-db-$STAGE"
    RDS_STATUS=$(aws rds describe-db-instances --db-instance-identifier $RDS_IDENTIFIER --region $REGION --query 'DBInstances[0].DBInstanceStatus' --output text 2>/dev/null || echo "not-found")
    
    if [ "$RDS_STATUS" = "available" ]; then
        echo "✅ RDS instance is available"
    else
        echo "⚠️  RDS instance status: $RDS_STATUS"
        if [ "$RDS_STATUS" != "not-found" ]; then
            echo "⏳ Waiting for RDS to become available..."
            aws rds wait db-instance-available --db-instance-identifier $RDS_IDENTIFIER --region $REGION
        fi
    fi
    
    # Verify Parameter Store parameters exist
    echo "🔧 Checking Parameter Store..."
    PARAMS=(
        "/medical-appointment/$STAGE/rds/host"
        "/medical-appointment/$STAGE/rds/database"
        "/medical-appointment/$STAGE/rds/username"
        "/medical-appointment/$STAGE/rds/password"
        "/medical-appointment/$STAGE/deployment/bucket"
    )
    
    for param in "${PARAMS[@]}"; do
        if aws ssm get-parameter --name "$param" --region $REGION > /dev/null 2>&1; then
            echo "✅ Parameter exists: $param"
        else
            echo "❌ Missing parameter: $param"
            exit 1
        fi
    done
else
    echo "❌ Infrastructure stack not found: medical-appointment-infrastructure-$STAGE"
    echo "💡 Please deploy infrastructure first: npm run deploy:infrastructure"
    exit 1
fi

# Validate Serverless configuration
echo "📋 Validating Serverless configuration..."
npx serverless print --stage $STAGE

# Run security checks
echo "🔒 Running security checks..."
npm audit --audit-level moderate

echo "✅ Pre-deployment checks passed for stage $STAGE!"
