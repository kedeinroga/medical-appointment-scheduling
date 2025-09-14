# 🏥 Medical Appointment Scheduling API

A robust backend application for scheduling medical appointments built with **Serverless Framework**, **TypeScript**, **Node.js**, and **AWS** services, implementing **Clean Architecture** principles.

## 📋 Table of Contents

- [🚀 Overview](#-overview)
- [🏗️ Architecture](#️-architecture)
- [📁 Project Structure](#-project-structure)
- [⚡ Quick Start](#-quick-start)
- [🔧 Development](#-development)
- [🧪 Testing](#-testing)
- [📡 API Documentation](#-api-documentation)
- [🏗️ Infrastructure](#️-infrastructure)
- [📊 Monitoring & Observability](#-monitoring--observability)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🚀 Overview

This application handles medical appointment scheduling for multiple countries (Peru and Chile) using an event-driven architecture with AWS serverless services. The system processes appointment requests asynchronously and maintains data consistency across different regional databases.

### Business Flow

1. **Request Reception**: API Gateway → Lambda `appointment` → DynamoDB (status: "pending")
2. **Country Routing**: Lambda `appointment` determines country → Routes to specific SNS topic (PE/CL)
3. **Direct Processing**: Country-specific SNS topic → Country-specific SQS queue (no filtering)
4. **Regional Processing**: Country-specific Lambda (PE/CL) → RDS MySQL (status: "scheduled")
5. **Event Publishing**: Processing Lambda → EventBridge with completion events
6. **Status Update**: EventBridge → SQS completion → Lambda `appointment` → DynamoDB (status: "completed")

### Implemented Patterns

#### SOLID Principles
- **S**: Single Responsibility - Each class has a specific responsibility
- **O**: Open/Closed - Extensible via interfaces and abstractions
- **L**: Liskov Substitution - Interchangeable repository implementations
- **I**: Interface Segregation - Specific interfaces per responsibility
- **D**: Dependency Inversion - Dependency on abstractions, not concretions

#### Design Patterns
1. **Repository Pattern**: Persistence abstraction
2. **Factory Pattern**: Creation of use cases and dependencies
3. **Adapter Pattern**: Integration with AWS services
4. **Command Pattern**: Use cases as commands
5. **Event-Driven Pattern**: Communication via domain events

#### Clean Architecture
- **Presentation Layer**: Lambda handlers
- **Application Layer**: Use cases (define Ports)
- **Domain Layer**: Pure business logic (entities, rules)
- **Infrastructure Layer**: Adapters (implement Ports with external tech)

---

### Production Considerations

#### Security
- [ ] Implement JWT authentication
- [ ] Use IAM roles with least privilege
- [ ] Configure CORS appropriately
- [ ] Encrypt sensitive data
- [ ] Implement rate limiting

#### Performance
- [ ] Optimize DynamoDB queries
- [ ] Implement connection pooling for RDS
- [ ] Configure dead letter queues
- [ ] Implement circuit breakers

#### Monitoring
- [ ] Custom CloudWatch metrics
- [ ] Distributed X-Ray tracing
- [ ] Alarms for errors and latency
- [ ] Operational dashboard

#### Scalability
- [ ] Auto-scaling for Lambda
- [ ] Configure reserved concurrency
- [ ] Implement backpressure in SQS
- [ ] Partitioning strategy for DynamoDB

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

### Tech Stack

- **Runtime**: Node.js 18.x
- **Language**: TypeScript
- **Framework**: Serverless Framework
- **Package Manager**: npm
- **Cloud Provider**: AWS
- **Architecture**: Hexagonal/Clean Architecture
- **Testing**: Jest
- **Linting**: ESLint + Prettier

## 📁 Project Structure

```
medical-appointment-scheduling/
├── 📄 serverless.yml                 # Main IaC configuration
├── 📄 package.json                   # Root dependencies and scripts
├── 📄 tsconfig.json                  # TypeScript configuration
├── 📄 jest.config.js                 # Jest test configuration
├── 📄 README.md                      # This file
│
├── 📁 functions/                     # 🔧 Lambda function handlers
│   ├── 📁 appointment/               # Main API handler & completion
│   │   ├── handler.ts                # Main Lambda handler
│   │   ├── constants.ts              # Handler constants
│   │   ├── utils.ts                  # Handler utilities
│   │   ├── package.json              # Function dependencies
│   │   └── __tests__/                # Function tests
│   ├── 📁 appointment-pe/            # Peru processor
│   └── 📁 appointment-cl/            # Chile processor
│
├── 📁 libs/                          # 📚 Clean Architecture layers
│   ├── 📁 core/                      # Core business logic
│   │   ├── 📁 domain/                # 🏢 Business entities & rules
│   │   │   ├── src/
│   │   │   │   ├── entities/         # Domain entities
│   │   │   │   ├── value-objects/    # Value objects
│   │   │   │   ├── repositories/     # Repository interfaces
│   │   │   │   ├── ports/            # Port interfaces
│   │   │   │   ├── events/           # Domain events
│   │   │   │   └── errors/           # Domain errors
│   │   │   └── __tests__/            # Domain tests
│   │   └── 📁 use-cases/             # 🎯 Application logic
│   │       ├── src/
│   │       │   ├── create-appointment/
│   │       │   ├── get-appointments/
│   │       │   ├── process-appointment/
│   │       │   └── complete-appointment/
│   │       └── __tests__/            # Use case tests
│   ├── 📁 infrastructure/            # 🔌 AWS adapters & external services
│   │   ├── src/
│   │   │   ├── adapters/             # AWS service adapters
│   │   │   ├── config/               # Infrastructure config
│   │   │   ├── factories/            # Factory classes
│   │   │   └── errors/               # Infrastructure errors
│   │   └── __tests__/                # Infrastructure tests
│   └── 📁 shared/                    # 🔄 Common utilities
│       ├── src/utils/                # Utility functions
│       └── __tests__/                # Shared tests
│
├── 📁 resources/                     # 🏗️ Infrastructure as Code (IaC)
│   ├── api-gateway.yml               # API Gateway configuration
│   ├── dynamodb.yml                  # DynamoDB tables
│   ├── sns.yml                       # SNS topics & subscriptions
│   ├── sqs.yml                       # SQS queues & policies
│   ├── eventbridge.yml               # EventBridge rules & targets
│   └── iam.yml                       # IAM roles & policies
│
├── 📁 config/                        # ⚙️ Environment configurations
│   ├── dev.yml                       # Development config
│   ├── staging.yml                   # Staging config
│   └── prod.yml                      # Production config
│
├── 📁 scripts/                       # 🔨 Deployment & utility scripts
│   ├── deploy.sh                     # Deployment script
│   ├── infrastructure.sh             # Infrastructure setup
│   └── test.sh                       # Testing script
│
├── 📁 test/                          # 🧪 Integration tests
│   └── integration/                  # End-to-end tests
│
├── 📁 docs/                          # 📖 Documentation
│   ├── openapi.yml                   # OpenAPI/Swagger spec
│   └── INFRASTRUCTURE.md             # Infrastructure docs
│
└── 📁 assets/                        # 📋 Project assets
    ├── REQUIREMENTS.md               # Business requirements
    └── diagrama.png                  # Architecture diagram
```

## ⚡ Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **AWS CLI** configured with appropriate permissions
- **Serverless Framework** >= 3.0.0

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Install Serverless Framework globally
npm install -g serverless

# Verify AWS CLI configuration
aws configure list
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/kedeinroga/medical-appointment-scheduling.git
cd medical-appointment-scheduling
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install function dependencies
npm run install:functions

# Build all packages
npm run build
```

### Environment Setup

1. **Configure AWS credentials**
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

2. **Set up environment variables**
```bash
# Copy environment template (if exists)
cp config/dev.yml.template config/dev.yml

# Edit the configuration file with your values
```

### Deployment

```bash
# Deploy to development environment
npm run deploy:dev

# Deploy to production environment
npm run deploy:prod

# Or use the deployment script with specific region
./scripts/deploy.sh dev us-east-1
```

## 🔧 Development

### Running Locally

For local development, you can use Serverless Offline:

```bash
# Start serverless offline
npm run start:local

# The API will be available at:
# http://localhost:3000
```

### Available Scripts

```bash
# 🏗️ Build & Development
npm run build              # Build all packages
npm run build:functions    # Build only functions
npm run build:libs         # Build only libraries
npm run clean              # Clean all build artifacts
npm run lint               # Run ESLint on all packages
npm run lint:fix           # Fix ESLint issues automatically

# 🧪 Testing
npm run test               # Run all tests
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests only
npm run test:coverage      # Run tests with coverage report
npm run test:watch         # Run tests in watch mode

# 🚀 Deployment
npm run deploy:dev         # Deploy to development
npm run deploy:staging     # Deploy to staging
npm run deploy:prod        # Deploy to production

# 🛠️ Utilities
npm run logs:appointment   # View appointment function logs
npm run logs:pe           # View Peru processor logs
npm run logs:cl           # View Chile processor logs
npm run start:local       # Start serverless offline

# More scripts available in package.json
```

### Environment Variables

The application uses environment-specific configuration files:

**config/dev.yml**
```yaml
# Development configuration
rds:
  host: dev-medical-rds.cluster-xxxxx.us-east-1.rds.amazonaws.com
  port: 3306
  database: medical_appointments_dev
  username: dev_user

api:
  throttling:
    rateLimit: 100
    burstLimit: 200

logging:
  level: DEBUG
  retention: 7

# AWS service configurations
dynamodb:
  appointmentsTable: appointments-table-dev

sns:
  appointmentTopic: appointment-notifications-dev        # Legacy/backup topic
  peAppointmentTopic: appointments-pe-dev               # Peru topic
  clAppointmentTopic: appointments-cl-dev               # Chile topic

sqs:
  peQueue: appointments-pe-dev
  clQueue: appointments-cl-dev
  completionQueue: appointments-completion-dev
```

**Environment Variables Reference:**

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Deployment environment | `development` |
| `LOG_LEVEL` | Logging level | `INFO` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `APPOINTMENTS_TABLE_NAME` | DynamoDB table name | Set by serverless |
| `RDS_HOST` | RDS MySQL host | From config |
| `RDS_PORT` | RDS MySQL port | `3306` |
| `RDS_DATABASE` | Database name | From config |
| `RDS_USERNAME` | Database username | From config |
| `RDS_PASSWORD` | Database password | From SSM |

## 🧪 Testing

### Running Tests

The project includes comprehensive testing at all architectural layers:

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:unit                    # Unit tests only
npm run test:integration            # Integration tests only
npm run test:coverage              # With coverage report

# Run tests for specific packages
npm run test libs/core/domain         # Domain layer tests
npm run test libs/core/use-cases      # Use case tests
npm run test libs/infrastructure      # Infrastructure tests
npm run test functions/appointment    # Main function tests
npm run test functions/appointment-pe # Peru function tests
npm run test functions/appointment-cl # Chile function tests

# Watch mode for development
npm run test:watch

# Debug mode
npm run test:debug
```

### Test Coverage

The project maintains high test coverage across all architectural layers:

| Layer | Coverage | Files | Description |
|-------|----------|-------|-------------|
| **Domain** | 95%+ | 15+ | Entities, Value Objects, Domain Services |
| **Application** | 90%+ | 12+ | Use Cases and orchestration |
| **Infrastructure** | 80%+ | 18+ | Adapters and AWS integrations |
| **Functions** | 85%+ | 8+ | Lambda handlers |
| **Overall** | 87%+ | 50+ | Complete codebase |

**View Coverage Report:**
```bash
# Generate and open coverage report
npm run test:coverage
open coverage/index.html
```

### Test Types

**1. Unit Tests**
- Domain entities and value objects
- Use case business logic
- Utility functions
- Pure functions without external dependencies

```bash
# Examples of unit test files
libs/core/domain/src/__tests__/entities/appointment.entity.test.ts
libs/core/use-cases/src/__tests__/create-appointment.use-case.test.ts
libs/shared/src/__tests__/utils/validation.util.test.ts
```

**2. Integration Tests**
- Repository implementations with AWS services
- Message publishing and consumption
- Database operations
- External service integrations

```bash
# Examples of integration test files
libs/infrastructure/src/__tests__/adapters/dynamodb-appointment.repository.test.ts
test/integration/appointment-workflow.test.ts
```

**3. Function Tests**
- Lambda handler testing
- API Gateway event processing
- SQS event processing
- Error handling and responses

```bash
# Examples of function test files
functions/appointment/__tests__/handler.test.ts
functions/appointment-pe/__tests__/handler.test.ts
```

**4. End-to-End Tests**
- Complete workflow testing
- Multi-service integration
- Error scenarios and edge cases

## 📡 API Documentation

### Endpoints

The API provides the following endpoints:

| Method | Endpoint | Description | Status |
|--------|----------|-------------|---------|
| `POST` | `/appointments` | Create new appointment | ✅ Implemented |
| `GET` | `/appointments/{insuredId}` | Get appointments by insured ID | ✅ Implemented |
| `OPTIONS` | `/*` | CORS preflight requests | ✅ Implemented |

### Request/Response Examples

#### Create Appointment

**Request:**
```http
POST /appointments
Content-Type: application/json

{
  "insuredId": "00123",
  "scheduleId": 100,
  "countryISO": "PE"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "message": "Appointment scheduling is in process"
  },
  "timestamp": "2024-09-11T10:00:00Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid insured ID format. Must be 5 digits",
    "timestamp": "2024-09-11T10:00:00Z"
  }
}
```

#### Get Appointments

**Request:**
```http
GET /appointments/00123
```

**Response (200 OK):**
```json
{
    "data": {
        "appointments": [
            {
                "appointmentId": "b81fbb9f-d76e-4361-b06a-9e1b7d87f27b",
                "countryISO": "PE",
                "createdAt": "2025-09-14T12:08:36.519Z",
                "insuredId": "10133",
                "processedAt": null,
                "schedule": {
                    "centerId": 1,
                    "date": "2025-09-17T04:29:13.000Z",
                    "medicId": 1,
                    "specialtyId": 1
                },
                "scheduleId": 5,
                "status": "completed",
                "updatedAt": "2025-09-14T12:08:38.300Z"
            }
        ],
        "pagination": {
            "count": 1,
            "total": 1,
            "limit": 20,
            "offset": 0,
            "hasMore": false,
            "totalPages": 1,
            "currentPage": 1
        },
        "filters": {
            "status": null,
            "startDate": null,
            "endDate": null
        },
        "meta": {
            "totalAvailable": 1,
            "totalFiltered": 1,
            "filterApplied": false
        }
    }
```

### OpenAPI/Swagger Documentation

Complete API documentation is available in OpenAPI 3.0 format:

```bash
# View the OpenAPI specification
cat docs/openapi.yml

# View Swagger docs
cat docs/swagger.json

# Generate interactive documentation (if you have swagger-ui)
npx swagger-ui-serve docs/openapi.yml

# Generate swagger.json
npm run docs:generate
```

## 🏗️ Infrastructure

### AWS Services

The application uses the following AWS services:

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **API Gateway** | REST API endpoints | `resources/api-gateway.yml` |
| **AWS Lambda** | Serverless compute (3 functions) | Function definitions in `functions/` |
| **DynamoDB** | Primary appointment storage | `resources/dynamodb.yml` |
| **SNS** | Message distribution (3 topics - main + per country) | `resources/sns.yml` |
| **SQS** | Message queuing for processing | `resources/sqs.yml` |
| **EventBridge** | Event-driven communication | `resources/eventbridge.yml` |
| **RDS MySQL** | Country-specific appointment storage | External `infrastructure/serverless.yml` |
| **IAM** | Security and permissions | `resources/iam.yml` |
| **CloudWatch** | Logging and monitoring | Built-in |

### Lambda Functions Overview

The system consists of **3 Lambda functions**, each with specific responsibilities:

| Function | Purpose | Event Sources | Key Features |
|----------|---------|---------------|--------------|
| **`appointment`** | Main API handler + Completion processor | API Gateway, SQS (completion) | Creates appointments, handles completion events |
| **`appointment-pe`** | Peru region processor | SQS (PE queue) | Processes PE appointments, writes to RDS |
| **`appointment-cl`** | Chile region processor | SQS (CL queue) | Processes CL appointments, writes to RDS |

**Function Flow:**
1. `appointment` receives API requests → Creates DynamoDB record → Routes to country-specific SNS topic
2. `appointment-pe`/`appointment-cl` process country-specific messages → Update RDS → Publish events
3. `appointment` receives completion events → Updates DynamoDB status to "completed"

### Infrastructure as Code

All AWS resources are defined as code using Serverless Framework:

**Main Configuration:**
```yaml
# serverless.yml - Main orchestrator
service: medical-appointment-scheduling

provider:
  name: aws
  runtime: nodejs18.x
  region: ${opt:region, 'us-east-1'}
  stage: ${opt:stage, 'dev'}

resources:
  - ${file(resources/dynamodb.yml)}
  - ${file(resources/sns.yml)}
  - ${file(resources/sqs.yml)}
  - ${file(resources/eventbridge.yml)}
  - ${file(resources/iam.yml)}
  - ${file(resources/api-gateway.yml)}
```

**Deploy Infrastructure:**
```bash
# Deploy complete infrastructure
npm run deploy:dev

# Deploy specific function
serverless deploy function --function appointment --stage dev

# Remove infrastructure
npm run remove:dev
```

**Infrastructure Commands:**
```bash
# View deployed resources
serverless info --stage dev

# View function logs
serverless logs --function appointment --stage dev

# Invoke function locally
serverless invoke local --function appointment --path test/fixtures/create-appointment.json

# Invoke deployed function
serverless invoke --function appointment --stage dev --path test/fixtures/create-appointment.json
```

## 📊 Monitoring & Observability

### Logging

The application uses structured logging with AWS PowerTools:

```typescript
// Example logging in use cases
logger.info('Creating appointment', {
  countryISO: dto.countryISO,
  insuredId: maskInsuredId(dto.insuredId),
  scheduleId: dto.scheduleId
});
```

**Log Levels:**
- `DEBUG`: Development debugging
- `INFO`: General information
- `WARN`: Warning conditions
- `ERROR`: Error conditions

### Metrics & Alarms

CloudWatch metrics and alarms are configured for:

- **API Gateway**: Request count, latency, 4xx/5xx errors
- **Lambda Functions**: Duration, errors, concurrent executions
- **DynamoDB**: Read/write capacity, throttling
- **SQS**: Message count, age, dead letter queue
- **SNS**: Published messages, delivery failures

### Health Checks

```bash
# Check API health (if health endpoint is implemented)
curl https://your-api-gateway-url/health

# Check individual function health
serverless invoke --function appointment --stage dev --data '{"healthCheck": true}'
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
```bash
git clone https://github.com/your-username/medical-appointment-scheduling.git
cd medical-appointment-scheduling
```

2. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Install dependencies and setup**
```bash
npm install
npm run build
```

4. **Make your changes**
- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed

5. **Run tests and checks**
```bash
npm run test
npm run lint
npm run test:coverage
```

6. **Commit your changes**
```bash
git add .
git commit -m "feat: add your feature description"
```

7. **Push and create PR**
```bash
git push origin feature/your-feature-name
# Create a Pull Request on GitHub
```

### Code Standards

- **TypeScript**: Strict mode, explicit types, no `any`
- **Naming**: camelCase for variables, PascalCase for classes
- **Imports**: Alphabetical ordering, group by source
- **Testing**: Minimum 80% coverage for new code
- **Documentation**: JSDoc for public APIs

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using Clean Architecture, Serverless Framework, and AWS**

## 📞 Support & Contact

- **Documentation**: [Project Wiki](https://github.com/kedeinroga/medical-appointment-scheduling/wiki)
- **Issues**: [GitHub Issues](https://github.com/kedeinroga/medical-appointment-scheduling/issues)
- **Discussions**: [GitHub Discussions](https://github.com/kedeinroga/medical-appointment-scheduling/discussions)

---

### 🔗 Related Documentation

- [Business Requirements](static/REQUIREMENTS.md)
- [Infrastructure Setup](docs/INFRASTRUCTURE.md)
- [OpenAPI Specification](docs/openapi.yml)
- [Architecture Diagram](static/diagrama.png)
