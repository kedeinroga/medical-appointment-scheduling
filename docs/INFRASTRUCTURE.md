# Infrastructure as Code (IaC) Documentation

## Overview

This project implements complete Infrastructure as Code using **Serverless Framework** for the Medical Appointment Scheduling system. All AWS resources are defined declaratively in YAML files, ensuring reproducible and version-controlled infrastructure deployments.

## Infrastructure Architecture

### Core Components

The infrastructure consists of the following AWS services, all created through code:

1. **API Gateway** - REST API with throttling, validation, and CORS
2. **Lambda Functions** - 4 serverless functions for different purposes
3. **DynamoDB** - Main appointments table with Global Secondary Indexes
4. **SNS** - Topic for appointment distribution with country-based filtering
5. **SQS** - Separate queues for PE, CL, and completion processing (with DLQs)
6. **EventBridge** - Custom event bus for appointment processing events
7. **IAM** - Least-privilege roles and policies
8. **CloudWatch** - Log groups for monitoring and debugging

### Infrastructure Files Structure

```
resources/
├── dynamodb.yml      # DynamoDB tables and indexes
├── sns.yml          # SNS topics and subscriptions
├── sqs.yml          # SQS queues and dead letter queues
├── eventbridge.yml  # EventBridge custom bus and rules
├── api-gateway.yml  # API Gateway configuration and models
└── iam.yml          # IAM roles, policies, and log groups
```

## Deployment Strategy

### Environment Configuration

Each environment (dev, staging, prod) has its own configuration file:

```
config/
├── dev.yml      # Development environment settings
├── staging.yml  # Staging environment settings
└── prod.yml     # Production environment settings
```

### Deployment Scripts

Two scripts are provided for infrastructure management:

- `scripts/deploy.sh` - Main deployment script
- `scripts/infrastructure.sh` - Advanced infrastructure management

## Usage

### Deploy Infrastructure

```bash
# Deploy to development environment
./scripts/deploy.sh dev us-east-1

# Deploy to staging environment
./scripts/deploy.sh staging us-east-1

# Deploy to production environment
./scripts/deploy.sh prod us-east-1
```

### Validate Infrastructure

```bash
# Validate configuration before deployment
./scripts/infrastructure.sh validate dev us-east-1
```

### Get Infrastructure Information

```bash
# Display deployed infrastructure details
./scripts/infrastructure.sh info dev us-east-1
```

### Remove Infrastructure

```bash
# Remove all infrastructure (requires confirmation)
./scripts/infrastructure.sh remove dev us-east-1
```

### View Logs

```bash
# Show CloudWatch logs for all functions
./scripts/infrastructure.sh logs dev us-east-1
```

## Infrastructure Components Detail

### 1. DynamoDB Table (dynamodb.yml)

**Table: Appointments**
- **Primary Key**: `appointmentId` (String)
- **Global Secondary Indexes**:
  - `insuredId-createdAt-index` - For querying appointments by insured
  - `status-createdAt-index` - For querying by status
  - `countryISO-createdAt-index` - For querying by country
- **Features**:
  - Point-in-time recovery enabled
  - Server-side encryption with KMS
  - DynamoDB Streams for change tracking
  - Pay-per-request billing mode

### 2. SNS Topic (sns.yml)

**Topic: AppointmentsTopic**
- Distributes appointment creation events
- **Subscriptions**:
  - PE Queue (with `countryISO: "PE"` filter)
  - CL Queue (with `countryISO: "CL"` filter)
- KMS encryption enabled
- Automatic retry and dead letter queue support

### 3. SQS Queues (sqs.yml)

**Peru Processing Queue**: `AppointmentsPEQueue`
**Chile Processing Queue**: `AppointmentsCLQueue`
**Completion Queue**: `AppointmentsCompletionQueue`

All queues include:
- Dead Letter Queues (DLQ) for failed messages
- KMS encryption
- Long polling (20 seconds)
- 14-day message retention
- Visibility timeout: 180 seconds (3x Lambda timeout)

### 4. EventBridge (eventbridge.yml)

**Custom Event Bus**: `MedicalAppointmentsEventBus`
- **Rules**:
  - `AppointmentProcessedPERule` - Routes PE processed events
  - `AppointmentProcessedCLRule` - Routes CL processed events
  - `AppointmentProcessingErrorRule` - Routes error events
- All rules target the completion SQS queue
- KMS encryption enabled

### 5. API Gateway (api-gateway.yml)

**REST API**: Medical Appointment Scheduling API
- **Request Validation**: Schema-based validation for all endpoints
- **Response Models**: Structured response schemas
- **Error Handling**: Custom gateway responses for 4xx/5xx errors
- **Throttling**: Configurable rate limiting per environment
- **CORS**: Configurable cross-origin resource sharing
- **Usage Plans**: API key management and quotas

### 6. Lambda Functions

**Functions Created**:
1. `appointment` - Main API handler (POST/GET endpoints)
2. `appointment-pe` - Peru appointment processor
3. `appointment-cl` - Chile appointment processor
4. `appointment-completion` - Completion handler

**Common Configuration**:
- Runtime: Node.js 18.x
- Architecture: ARM64 (Graviton2)
- Memory: Configurable per environment
- Timeout: 30 seconds
- Environment variables injected from config

### 7. IAM Security (iam.yml)

**Roles Created**:
- `MedicalAppointmentLambdaExecutionRole` - For Lambda functions
- `EventBridgeExecutionRole` - For EventBridge to SQS access
- `ApiGatewayCloudWatchLogsRole` - For API Gateway logging

**Security Principles**:
- Least privilege access
- Resource-specific permissions
- Cross-service access control
- KMS encryption permissions

## Environment Variables

The following environment variables are automatically configured for Lambda functions:

```yaml
STAGE: ${self:provider.stage}
AWS_REGION: ${self:provider.region}
LOG_LEVEL: # From config file
APPOINTMENTS_TABLE_NAME: # DynamoDB table name
APPOINTMENTS_TOPIC_ARN: # SNS topic ARN
APPOINTMENTS_PE_QUEUE_URL: # Peru SQS queue URL
APPOINTMENTS_CL_QUEUE_URL: # Chile SQS queue URL
EVENTBRIDGE_BUS_NAME: # EventBridge bus name
RDS_HOST: # RDS hostname
RDS_DATABASE: # Database name
RDS_PORT: # Database port
RDS_USERNAME: # Database username
RDS_PASSWORD: # Database password
```

## Monitoring and Logging

### CloudWatch Log Groups

Automatic log groups created for:
- `/aws/lambda/medical-appointment-scheduling-{stage}-appointment`
- `/aws/lambda/medical-appointment-scheduling-{stage}-appointment-pe`
- `/aws/lambda/medical-appointment-scheduling-{stage}-appointment-cl`
- `/aws/lambda/medical-appointment-scheduling-{stage}-appointment-completion`
- `/aws/apigateway/medical-appointment-scheduling-{stage}`

### Log Retention

- **Development**: 7 days
- **Staging**: 14 days
- **Production**: 30 days

## Cost Optimization

### DynamoDB
- Pay-per-request billing mode
- Auto-scaling disabled (using on-demand)

### Lambda
- ARM64 architecture (20% cost reduction)
- Right-sized memory allocation per environment
- Reserved concurrency to prevent runaway costs

### SQS/SNS
- Long polling to reduce empty receives
- Dead letter queues to prevent infinite retries

## Security Features

### Encryption
- All data encrypted at rest using KMS
- Separate KMS keys per environment
- In-transit encryption for all services

### Access Control
- IAM roles with least privilege
- Resource-based policies
- VPC endpoints for private communication (when needed)

### API Security
- API keys for usage tracking
- Request validation and sanitization
- Rate limiting and throttling
- CORS configuration

## Backup and Recovery

### DynamoDB
- Point-in-time recovery enabled
- Continuous backups for 35 days
- Cross-region replication (configurable)

### Data Retention
- Message retention in SQS: 14 days
- Log retention: Environment-specific
- Dead letter queue retention: 14 days

## Troubleshooting

### Common Issues

1. **Validation Errors**
   ```bash
   ./scripts/infrastructure.sh validate dev
   ```

2. **Deployment Failures**
   ```bash
   serverless logs -f appointment --stage dev --tail
   ```

3. **Permission Issues**
   - Check IAM policies in `resources/iam.yml`
   - Verify resource ARNs in environment variables

### Debug Commands

```bash
# Check Serverless configuration
serverless print --stage dev

# View stack events
aws cloudformation describe-stack-events --stack-name medical-appointment-scheduling-dev

# Test API endpoints
curl -X POST https://api-url/appointments -d '{"insuredId":"12345","scheduleId":100,"countryISO":"PE"}'
```

## Migration and Updates

### Infrastructure Updates
1. Update resource files in `resources/`
2. Validate changes: `./scripts/infrastructure.sh validate`
3. Deploy: `./scripts/deploy.sh`

### Environment Promotion
1. Deploy to staging: `./scripts/deploy.sh staging`
2. Run tests
3. Deploy to production: `./scripts/deploy.sh prod`

## Dependencies

- **Node.js** 18+
- **Serverless Framework** 3.x
- **AWS CLI** (for advanced operations)
- **pnpm** (package manager)

## Support

For infrastructure-related issues:
1. Check the validation output
2. Review CloudWatch logs
3. Verify AWS service limits
4. Check IAM permissions
