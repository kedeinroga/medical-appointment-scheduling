# 🏥 Medical Appointment Scheduling API

A robust backend application for scheduling medical appointments built with **Serverless Framework**, **TypeScript**, **Node.js**, and **AWS** services, implementing **Clean Architecture** principles.

## 🚀 Overview

This application handles medical appointment scheduling for multiple countries (Peru and Chile) using an event-driven architecture with AWS serverless services. The system processes appointment requests asynchronously and maintains data consistency across different regional databases.

## 🏗️ Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Functions Layer                         │
│                   (AWS Lambda Handlers)                     │
├─────────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                       │
│              (AWS Adapters & External Services)             │
├─────────────────────────────────────────────────────────────┤
│                   Application Layer                         │
│                     (Use Cases)                             │
├─────────────────────────────────────────────────────────────┤
│                     Domain Layer                            │
│               (Entities & Business Logic)                   │
└─────────────────────────────────────────────────────────────┘
```

### AWS Services (Infrastructure as Code)

- **API Gateway**: REST API endpoints
- **AWS Lambda**: Serverless compute functions
- **DynamoDB**: Primary appointment storage
- **SNS**: Message distribution with country filtering
- **SQS**: Message queuing for country-specific processing
- **EventBridge**: Event-driven communication for completion flow
- **RDS MySQL**: Country-specific appointment storage

## 📋 Business Flow

1. **Request Reception**: API Gateway → Lambda `appointment` → DynamoDB (status: "pending")
2. **Distribution**: SNS with country filter → SQS (PE/CL queues)
3. **Processing**: Country-specific Lambda (PE/CL) → RDS MySQL
4. **Confirmation**: EventBridge → SQS completion → Lambda `appointment` → DynamoDB (status: "completed")

## 🛠️ Tech Stack

- **Runtime**: Node.js 18.x
- **Language**: TypeScript
- **Framework**: Serverless Framework
- **Package Manager**: pnpm
- **Cloud Provider**: AWS
- **Architecture**: Hexagonal/Clean Architecture
- **Testing**: Jest
- **Linting**: ESLint + Prettier

## 📁 Project Structure

```
medical-appointment-scheduling/
├── serverless.yml                    # 🏗️ Main IaC configuration
├── functions/                        # 🔧 Lambda function handlers
│   ├── appointment/                  # Main API handler
│   ├── appointment-pe/               # Peru processor
│   ├── appointment-cl/               # Chile processor
│   └── appointment-completion/       # Completion handler
├── libs/                             # 📚 Clean Architecture layers
│   ├── core/
│   │   ├── domain/                   # 🏢 Business entities & rules
│   │   └── use-cases/                # 🎯 Application logic
│   ├── shared/                       # 🔄 Common utilities
│   └── infrastructure/               # 🔌 AWS adapters & external services
├── resources/                        # 🏗️ Infrastructure as Code (IaC)
│   ├── dynamodb.yml                  # DynamoDB tables
│   ├── sns.yml                       # SNS topics & subscriptions
│   ├── sqs.yml                       # SQS queues & policies
│   ├── eventbridge.yml               # EventBridge rules & targets
│   └── iam.yml                       # IAM roles & policies
├── config/                           # ⚙️ Environment configurations
└── scripts/                          # 🔨 Deployment & utility scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- AWS CLI configured
- Serverless Framework

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd medical-appointment-scheduling

# Install dependencies
pnpm install

# Build the project
pnpm run build
```

### Deployment

```bash
# Deploy to development
pnpm run deploy:dev

# Deploy to production
pnpm run deploy:prod

# Or use the deployment script
./scripts/deploy.sh dev us-east-1
```

## 📡 API Endpoints

### POST /appointments

Create a new medical appointment.

**Request Body:**
```json
{
  "insuredId": "00123",
  "scheduleId": 100,
  "countryISO": "PE"
}
```

**Response:**
```json
{
  "appointmentId": "uuid-v4",
  "status": "pending",
  "message": "Appointment creation in progress"
}
```

### GET /appointments/{insuredId}

Retrieve appointments for a specific insured person.

**Response:**
```json
{
  "appointments": [
    {
      "appointmentId": "uuid-v4",
      "insuredId": "00123",
      "scheduleId": 100,
      "countryISO": "PE",
      "status": "completed",
      "createdAt": "2024-09-11T10:00:00Z",
      "updatedAt": "2024-09-11T10:05:00Z"
    }
  ],
  "total": 1
}
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm run test:unit

# Run integration tests
pnpm run test:integration

# Run tests with coverage
pnpm run test:coverage

# Or use the test script
./scripts/test.sh unit
```

## 🔧 Development

### Environment Configuration

Configure environment-specific settings in `config/` directory:

- `dev.yml` - Development environment
- `prod.yml` - Production environment

### Code Conventions

- Follow Clean Architecture principles
- Use TypeScript strict mode
- Implement SOLID principles
- Single quotes for strings
- Alphabetical field ordering in interfaces
- Use constants instead of magic numbers

### Domain-Driven Design

```typescript
// Domain entities with business logic
export class Appointment {
  constructor(
    private readonly appointmentId: AppointmentId,
    private readonly insuredId: InsuredId,
    private readonly scheduleId: number,
    private readonly countryISO: CountryISO,
    private status: AppointmentStatus,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  public complete(): void {
    this.validateCanBeCompleted();
    this.status = AppointmentStatus.COMPLETED;
    this.updatedAt = new Date();
  }
}
```

## 🏗️ Infrastructure as Code

All AWS resources are defined as code using Serverless Framework:

```yaml
# serverless.yml - Main orchestrator
resources:
  - ${file(resources/dynamodb.yml)}
  - ${file(resources/sns.yml)}
  - ${file(resources/sqs.yml)}
  - ${file(resources/eventbridge.yml)}
  - ${file(resources/iam.yml)}
```

### Deploy Infrastructure

```bash
# Deploy complete infrastructure
serverless deploy --stage dev

# Deploy specific function
serverless deploy function --function appointment --stage dev

# Remove infrastructure
serverless remove --stage dev
```

## 📊 Monitoring & Observability

- **CloudWatch Logs**: Centralized logging for all Lambda functions
- **CloudWatch Metrics**: Performance and error metrics
- **AWS X-Ray**: Distributed tracing (via Powertools)
- **Dead Letter Queues**: Error handling and retry logic

## 🔒 Security

- **IAM Roles**: Least privilege principle
- **KMS Encryption**: Data encryption at rest
- **VPC**: Network isolation (if required)
- **Parameter Store**: Secure configuration management

## 📈 Performance

- **Cold Start Optimization**: ARM64 architecture, optimized bundle size
- **Concurrent Execution**: Reserved concurrency configuration
- **Caching**: API Gateway caching for GET endpoints
- **Batch Processing**: SQS batch processing for efficiency

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow code conventions
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please refer to the project documentation or create an issue in the repository.

---

Built with ❤️ using Serverless Framework and Clean Architecture principles.
