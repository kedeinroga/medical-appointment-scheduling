#!/bin/bash
set -e

STAGE=${1:-dev}
REGION=${2:-us-east-1}

echo "🧪 Running post-deployment verification for stage: $STAGE"

# Get API Gateway endpoint
API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name medical-appointment-scheduling-$STAGE \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ServiceEndpoint`].OutputValue' \
    --output text)

if [ -z "$API_ENDPOINT" ]; then
    echo "❌ Could not get API Gateway endpoint"
    exit 1
fi

echo "📡 API Endpoint: $API_ENDPOINT"

# Wait for API Gateway to be ready
echo "⏳ Waiting for API Gateway to be ready..."
sleep 30

# Test basic endpoints
echo "🧪 Testing basic endpoints..."

# Test POST /appointments
echo "Testing POST /appointments..."
TEST_RESPONSE=$(curl -s -X POST "$API_ENDPOINT/appointments" \
    -H "Content-Type: application/json" \
    -d '{"insuredId":"12345","scheduleId":1,"countryISO":"PE"}' \
    -w "HTTP_STATUS:%{http_code}" || echo "HTTP_STATUS:000")

echo "Response: $TEST_RESPONSE"

if echo "$TEST_RESPONSE" | grep -q "HTTP_STATUS:20[0-9]"; then
    echo "✅ POST /appointments endpoint working"
    
    # Extract appointment ID from response for GET test
    if echo "$TEST_RESPONSE" | grep -q '"appointmentId"'; then
        echo "✅ Appointment created successfully"
    fi
else
    echo "⚠️  POST /appointments endpoint response: $TEST_RESPONSE"
fi

# Test GET /appointments/{insuredId}
echo "Testing GET /appointments/12345..."
GET_RESPONSE=$(curl -s -X GET "$API_ENDPOINT/appointments/12345" \
    -H "Accept: application/json" \
    -w "HTTP_STATUS:%{http_code}" || echo "HTTP_STATUS:000")

echo "Response: $GET_RESPONSE"

if echo "$GET_RESPONSE" | grep -q "HTTP_STATUS:20[0-9]"; then
    echo "✅ GET /appointments/{insuredId} endpoint working"
else
    echo "⚠️  GET /appointments/{insuredId} endpoint response: $GET_RESPONSE"
fi

# Check DynamoDB table
echo "🗄️  Checking DynamoDB table..."
TABLE_NAME=$(aws cloudformation describe-stacks \
    --stack-name medical-appointment-scheduling-$STAGE \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`AppointmentsTableName`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ -n "$TABLE_NAME" ]; then
    TABLE_STATUS=$(aws dynamodb describe-table --table-name $TABLE_NAME --region $REGION --query 'Table.TableStatus' --output text 2>/dev/null || echo "NOT_FOUND")
    if [ "$TABLE_STATUS" = "ACTIVE" ]; then
        echo "✅ DynamoDB table is active: $TABLE_NAME"
    else
        echo "⚠️  DynamoDB table status: $TABLE_STATUS"
    fi
else
    echo "⚠️  Could not find DynamoDB table name in stack outputs"
fi

# Check SQS queues
echo "📬 Checking SQS queues..."
SQS_QUEUES=("appointments-pe-$STAGE" "appointments-cl-$STAGE" "appointments-completion-$STAGE")
for queue in "${SQS_QUEUES[@]}"; do
    if aws sqs get-queue-url --queue-name $queue --region $REGION > /dev/null 2>&1; then
        echo "✅ SQS queue exists: $queue"
    else
        echo "⚠️  SQS queue not found: $queue"
    fi
done

# Check SNS topic
echo "📢 Checking SNS topic..."
SNS_TOPIC_ARN=$(aws cloudformation describe-stacks \
    --stack-name medical-appointment-scheduling-$STAGE \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`AppointmentsTopicArn`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ -n "$SNS_TOPIC_ARN" ]; then
    if aws sns get-topic-attributes --topic-arn $SNS_TOPIC_ARN --region $REGION > /dev/null 2>&1; then
        echo "✅ SNS topic exists: $SNS_TOPIC_ARN"
    else
        echo "⚠️  SNS topic not accessible: $SNS_TOPIC_ARN"
    fi
else
    echo "⚠️  Could not find SNS topic ARN in stack outputs"
fi

# Check Lambda functions
echo "⚡ Checking Lambda functions..."
LAMBDA_FUNCTIONS=("medical-appointment-scheduling-$STAGE-appointment" 
                  "medical-appointment-scheduling-$STAGE-appointment-pe"
                  "medical-appointment-scheduling-$STAGE-appointment-cl"
                  "medical-appointment-scheduling-$STAGE-appointment-completion")

for func in "${LAMBDA_FUNCTIONS[@]}"; do
    if aws lambda get-function --function-name $func --region $REGION > /dev/null 2>&1; then
        echo "✅ Lambda function exists: $func"
    else
        echo "⚠️  Lambda function not found: $func"
    fi
done

echo ""
echo "✅ Post-deployment verification completed for stage $STAGE!"
echo ""
echo "📋 Summary:"
echo "- API Gateway: $API_ENDPOINT"
echo "- Stage: $STAGE"
echo "- Region: $REGION"
echo ""
echo "🔗 Available endpoints:"
echo "- POST $API_ENDPOINT/appointments"
echo "- GET $API_ENDPOINT/appointments/{insuredId}"
