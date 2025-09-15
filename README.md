# 🏥 Medical Appointment Scheduling API

[![CI/CD Pipeline](https://github.com/kedeinroga/medical-appointment-scheduling/actions/workflows/deploy.yml/badge.svg)](https://github.com/kedeinroga/medical-appointment-scheduling/actions)
[![Test Coverage](https://img.shields.io/badge/coverage-90%25-brightgreen.svg)](./coverage/index.html)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Serverless](https://img.shields.io/badge/Serverless-Framework-orange.svg)](https://www.serverless.com/)
[![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20DynamoDB%20%7C%20SNS-yellow.svg)](https://aws.amazon.com/)

A robust medical appointment scheduling system built with **Serverless Framework**, **TypeScript**, **Node.js** and **AWS** services, implementing **Clean Architecture** principles and **SOLID** patterns.

## 📋 Table of Contents

- [🚀 Overview](#-overview)
- [🏗️ Architecture](#️-architecture)
- [📁 Project Structure](#-project-structure)
- [⚡ Quick Start](#-quick-start)
- [🔧 Development](#-development)
- [🧪 Testing](#-testing)
- [📡 API Documentation](#-api-documentation)
- [🏗️ Infrastructure](#️-infrastructure)
- [📊 Monitoring](#-monitoring)
- [🤝 Contributing](#-contributing)

## 🚀 Overview

### What does this system do?
A medical appointment scheduling system that handles **multiple countries** (Peru and Chile) using an **event-driven architecture** with AWS serverless services. The system processes appointment requests **asynchronously** and maintains data consistency across different regional databases.

### Simplified Business Flow

```mermaid
graph LR
    A[📱 POST /appointments] --> B[💾 DynamoDB pending]
    B --> C[📨 SNS PE/CL]
    C --> D[⚡ Country Lambda]
    D --> E[🗄️ MySQL scheduled]
    E --> F[🔔 EventBridge]
    F --> G[✅ DynamoDB completed]
```

**Appointment States:**
- `pending` → Request received and in process
- `scheduled` → Scheduled in country system  
- `completed` → Process completed successfully

### Key Features
- ✅ **Clean Architecture**: Clear separation of concerns
- ✅ **Event-Driven**: Asynchronous communication via events
- ✅ **Multi-Country**: Native support for PE and CL with specific logic
- ✅ **High Availability**: No single points of failure
- ✅ **Auto-Scaling**: Adapts to demand automatically
- ✅ **Robust Validation**: Zod schemas with strong typing
- ✅ **Complete Monitoring**: Structured logging and metrics
- ✅ **Comprehensive Testing**: +90% code coverage

### Implemented Patterns

#### 🔧 SOLID Principles
- **S**ingle Responsibility: Each class has a specific responsibility
- **O**pen/Closed: Extensible via interfaces and abstractions
- **L**iskov Substitution: Interchangeable repository implementations
- **I**nterface Segregation: Specific interfaces per responsibility
- **D**ependency Inversion: Dependency on abstractions, not concretions

#### 🏗️ Design Patterns
- **Repository Pattern**: Persistence abstraction
- **Factory Pattern**: Use case and dependency creation
- **Adapter Pattern**: AWS service integration
- **Use Case Pattern**: Business logic encapsulation
- **Event-Driven Pattern**: Domain event communication

## 🏗️ Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                   📱 Functions Layer                        │
│                 (Lambda Handlers - AWS)                     │
├─────────────────────────────────────────────────────────────┤
│                🔧 Infrastructure Layer                      │
│            (Adapters - DynamoDB, SNS, MySQL)               │
├─────────────────────────────────────────────────────────────┤
│                  🎯 Application Layer                       │
│                   (Use Cases)                               │
├─────────────────────────────────────────────────────────────┤
│                   🏢 Domain Layer                           │
│             (Entities & Business Logic)                     │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack
- **Runtime**: Node.js 18.x ARM64
- **Language**: TypeScript 5.0+
- **Framework**: Serverless Framework 3.x
- **Cloud**: AWS (Lambda, DynamoDB, SNS, SQS, EventBridge, RDS)
- **Testing**: Jest + >90% coverage
- **Validation**: Zod schemas
- **Architecture**: Hexagonal/Clean Architecture + DDD
- **CI/CD**: GitHub Actions + AWS

### AWS Services

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **🌐 API Gateway** | REST API endpoints | CORS, throttling, validation |
| **⚡ Lambda (3)** | Serverless compute | appointment, appointment-pe, appointment-cl |
| **💾 DynamoDB** | Primary storage | Appointments table + GSI |
| **📨 SNS (3)** | Message distribution | Country-specific + main topics |
| **📋 SQS (3)** | Message queuing | PE, CL, completion queues + DLQ |
| **🔔 EventBridge** | Event routing | Custom bus + rules |
| **🗄️ RDS MySQL** | Country storage | appointment_pe, appointment_cl tables |
| **🔐 IAM** | Security & permissions | Service-specific roles |

## 📁 Project Structure

```
medical-appointment-scheduling/
├── 📄 serverless.yml                 # Main IaC configuration
├── 📄 package.json                   # Root dependencies & scripts
├── 📄 PROJECT-DOCUMENTATION.md       # 📖 Complete documentation
│
├── 📁 functions/                     # 📱 Lambda Handlers (Presentation)
│   ├── 📁 appointment/               # Main API + completion
│   │   ├── handler.ts                # Main handler (API + SQS)
│   │   ├── route-handlers.ts         # Robust validation & routing
│   │   ├── constants.ts              # Handler constants
│   │   └── __tests__/                # Function tests
│   ├── 📁 appointment-pe/            # Peru processor
│   ├── 📁 appointment-cl/            # Chile processor
│   └── 📁 shared/                    # Common utilities
│
├── 📁 infrastructure/                # 🔌 Infrastructure as Code (IaC)
│   ├── 📁 resources/                 # 📦 Cloud resources
│   │   ├── outputs.yml               # CloudFormation outputs
│   │   ├── parameter-store.yml       # DynamoDB tables
│   │   ├── rds.yml                   # RDS instances
│   │   └── s3.yml                    # S3 buckets
│   ├── 📁 scripts/                   # 🔨 Deployment & utility scripts
│   │   ├── create-database.sql       # Database creation script
│   │   └── seed-data.sql             # Database seeding script
│   └── serverless.yml                # Infrastructure stack
│
├── 📁 libs/                          # 🏗️ Clean Architecture Layers
│   ├── 📁 core/
│   │   ├── 📁 domain/                # 🏢 Business entities & rules
│   │   │   ├── entities/             # Appointment, Schedule, Insured
│   │   │   ├── value-objects/        # AppointmentId, CountryISO
│   │   │   ├── ports/                # Repository interfaces
│   │   │   └── events/               # Domain events
│   │   └── 📁 use-cases/             # 🎯 Application logic
│   │       ├── create-appointment/   # POST /appointments logic
│   │       ├── get-appointments/     # GET /appointments/{id} logic
│   │       ├── process-country-appointment/  # Country processing
│   │       ├── complete-appointment/ # Completion logic
│   │       └── factories/            # Dependency injection
│   ├── 📁 infrastructure/            # 🔧 AWS Adapters
│   │   ├── adapters/
│   │   │   ├── repositories/         # DynamoDB, MySQL implementations
│   │   │   └── messaging/            # SNS, EventBridge adapters
│   │   ├── config/                   # AWS configuration
│   │   └── factories/                # Infrastructure factories
│   └── 📁 shared/                    # 🔄 Common utilities
│
├── 📁 resources/                     # 🏛️ Infrastructure as Code
│   ├── api-gateway.yml               # API Gateway config
│   ├── dynamodb.yml                  # DynamoDB tables
│   ├── sns.yml                       # SNS topics (3)
│   ├── sqs.yml                       # SQS queues (3) + DLQ
│   ├── eventbridge.yml               # EventBridge rules
│   └── iam.yml                       # IAM roles & policies
│
├── 📁 config/                        # ⚙️ Environment configs
│   ├── dev.yml                       # Development
│   ├── staging.yml                   # Staging  
│   └── prod.yml                      # Production
│
├── 📁 test/                          # 🧪 Testing
│   ├── e2e/                          # End-to-end tests
│   └── integration/                  # Integration tests
│
├── 📁 docs/                          # 📖 Documentation
│   ├── openapi.yml                   # OpenAPI/Swagger spec
│   └── INFRASTRUCTURE.md             # Infrastructure docs
│
└── 📁 static/                        # 📋 Business docs
    ├── REQUIREMENTS.md               # Business requirements
    └── diagrama.png                  # Architecture diagram
```

## ⚡ Quick Start

### Prerequisites

```bash
# Check required versions
node --version    # >= 18.0.0
npm --version     # >= 8.0.0
aws --version     # >= 2.0.0

# Install Serverless Framework
npm install -g serverless@3

# Verify AWS configuration
aws configure list
```

### Installation

```bash
# 1. Clone repository
git clone https://github.com/kedeinroga/medical-appointment-scheduling.git
cd medical-appointment-scheduling

# 2. Install dependencies
npm install

# 3. Build project
npm run build

# 4. Run tests
npm test
```

### Quick Deployment

```bash
# Development
npm run deploy:dev

# Production
npm run deploy:prod

# Verify deployment
npm run test:e2e
```

## 🔧 Development

### Available Scripts

```bash
# 🏗️ Build & Development
npm run build                # Complete build
npm run build:functions      # Functions only
npm run clean               # Clean artifacts

# 🧪 Testing
npm test                    # All tests
npm run test:unit           # Unit tests
npm run test:integration    # Integration tests  
npm run test:coverage       # With coverage report
npm run test:watch          # Watch mode
npm run test:e2e           # End-to-end tests

# 🚀 Deployment
npm run deploy:dev          # Deploy to development
npm run deploy:staging      # Deploy to staging
npm run deploy:prod         # Deploy to production

# 🛠️ Utilities
npm run logs:appointment    # View main function logs
npm run logs:pe            # View Peru processor logs
npm run logs:cl            # View Chile processor logs
npm run start:local        # Serverless offline
npm run lint               # ESLint check
npm run lint:fix           # ESLint auto-fix
```

### Local Development

```bash
# Start local development
npm run start:local

# API available at:
# http://localhost:3000

# Local endpoints:
# POST http://localhost:3000/dev/appointments
# GET  http://localhost:3000/dev/appointments/{insuredId}
```

### Environment Variables

```yaml
# config/dev.yml - Development configuration
logging:
  level: DEBUG
  retentionDays: 7

database:
  mysql:
    connectionLimit: 5

api:
  throttling:
    rateLimit: 100
    burstLimit: 200

# Main environment variables:
STAGE: dev
LOG_LEVEL: DEBUG
APPOINTMENTS_TABLE_NAME: appointments-table-dev
RDS_HOST: dev-medical-rds.cluster-xxxxx.us-east-1.rds.amazonaws.com
```

## 🧪 Testing

### Test Coverage

| Layer | Coverage | Files | Description |
|-------|----------|-------|-------------|
| **🏢 Domain** | 95%+ | 15+ | Entities, Value Objects, Domain Services |
| **🎯 Application** | 90%+ | 12+ | Use Cases and orchestration |
| **🔧 Infrastructure** | 80%+ | 18+ | Adapters and AWS integrations |
| **📱 Functions** | 85%+ | 8+ | Lambda handlers |
| **📊 Overall** | 90%+ | 50+ | Complete codebase |

### Running Tests

```bash
# Complete tests with coverage
npm run test:coverage

# View HTML report
open coverage/index.html

# Specific tests by layer
npm test libs/core/domain         # Domain tests
npm test libs/core/use-cases      # Use case tests  
npm test libs/infrastructure      # Infrastructure tests
npm test functions/appointment    # Function tests

# Watch mode
npm run test:watch

# E2E tests (requires previous deployment)
npm run test:e2e
```

### Test Types

**🔬 Unit Tests**: Entities, Value Objects, Use Cases
**🔗 Integration Tests**: Repositories, AWS services, Database
**📱 Function Tests**: Lambda handlers, API responses
**🌐 E2E Tests**: Complete business flows

## 📡 API Documentation

### Available Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|---------|
| `POST` | `/appointments` | Create new appointment | ✅ Implemented |
| `GET` | `/appointments/{insuredId}` | Get appointments by insured ID | ✅ Implemented |

### Usage Examples

#### 📝 Create Appointment

```http
POST /appointments
Content-Type: application/json

{
  "insuredId": "12345",
  "scheduleId": 100,
  "countryISO": "PE"
}
```

**Response (201 Created):**
```json
{
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Appointment scheduling is in process",
  "status": "pending"
}
```

#### 📋 Get Appointments

```http
GET /appointments/12345?status=completed&limit=10&offset=0
```

**Response (200 OK):**
```json
{
  "appointments": [
    {
      "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
      "insuredId": "12345",
      "countryISO": "PE",
      "status": "completed",
      "schedule": {
        "scheduleId": 100,
        "centerId": 1,
        "specialtyId": 3,
        "medicId": 4,
        "date": "2024-09-20T14:30:00Z"
      },
      "createdAt": "2024-09-15T10:30:00Z",
      "processedAt": "2024-09-15T10:35:00Z"
    }
  ],
  "pagination": {
    "count": 1,
    "total": 5,
    "limit": 10,
    "offset": 0,
    "hasMore": false,
    "totalPages": 1,
    "currentPage": 1
  },
  "filters": {
    "status": "completed",
    "startDate": null,
    "endDate": null
  }
}
```

### API Validations

- **insuredId**: Exactly 5 digits (auto-padding with zeros)
- **scheduleId**: Positive integer
- **countryISO**: Only "PE" or "CL"
- **Query filters**: status, startDate, endDate, limit (1-100), offset (≥0)

### Complete Documentation

```bash
# View OpenAPI/Swagger specification
cat docs/openapi.yml

# View complete project documentation
cat PROJECT-DOCUMENTATION.md
```

## 🏗️ Infrastructure

### AWS Lambda Functions

| Function | Purpose | Event Sources | Responsibilities |
|----------|---------|---------------|------------------|
| **`appointment`** | Main handler | API Gateway, SQS completion | API endpoints, appointment completion |
| **`appointment-pe`** | Peru processor | SQS PE queue | PE-specific logic, MySQL PE |
| **`appointment-cl`** | Chile processor | SQS CL queue | CL-specific logic, MySQL CL |

### Data Flow

```mermaid
sequenceDiagram
    participant API as API Gateway
    participant LAM as appointment λ
    participant DDB as DynamoDB
    participant SNS as SNS PE/CL
    participant SQS as SQS PE/CL  
    participant PE as appointment-pe λ
    participant RDS as MySQL RDS
    participant EB as EventBridge
    participant SQC as SQS Completion

    API->>LAM: POST /appointments
    LAM->>DDB: Save (status: pending)
    LAM->>SNS: Publish country event
    SNS->>SQS: Route to country queue
    SQS->>PE: Process country appointment
    PE->>RDS: Save (status: scheduled)
    PE->>EB: Publish completion event
    EB->>SQC: Route completion
    SQC->>LAM: Process completion
    LAM->>DDB: Update (status: completed)
```

### Database Schema

#### DynamoDB - Appointments Table
```yaml
Partition Key: appointmentId (String)
GSI: insuredId-index
  - PK: insuredId (String)  
  - SK: createdAt (String)

Attributes:
  appointmentId: UUID v4
  insuredId: "12345" (5 digits)
  countryISO: "PE" | "CL"
  status: "pending" | "completed"
  schedule: { complete object }
  timestamps: createdAt, updatedAt, processedAt
```

#### MySQL - Country Tables
```sql
-- Tables: appointment_pe, appointment_cl
CREATE TABLE appointment_pe (
  appointment_id VARCHAR(36) PRIMARY KEY,
  insured_id VARCHAR(5) NOT NULL,
  schedule_id INT NOT NULL,
  country_iso CHAR(2) DEFAULT 'PE',
  center_id INT NOT NULL,
  specialty_id INT NOT NULL,
  medic_id INT NOT NULL,
  appointment_date DATETIME NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_insured_id (insured_id),
  INDEX idx_appointment_date (appointment_date)
);
```

### Infrastructure Commands

```bash
# Complete deployment
npm run deploy:dev

# Deploy specific function
serverless deploy function --function appointment --stage dev

# View stack information
serverless info --stage dev

# View logs
serverless logs --function appointment --stage dev --tail

# Invoke function locally
serverless invoke local --function appointment --path test/fixtures/create-appointment.json

# Remove complete stack
npm run remove:dev
```

## 📊 Monitoring

### Structured Logging

```typescript
// Example logging with AWS PowerTools
logger.info('Appointment created successfully', {
  logId: 'appointment-created-success',
  appointmentId: result.appointmentId,
  insuredId: maskInsuredId(dto.insuredId), // PII masking
  countryISO: dto.countryISO,
  requestId: context.awsRequestId
});
```

### CloudWatch Metrics

- **🌐 API Gateway**: Request count, latency, 4xx/5xx errors
- **⚡ Lambda**: Duration, errors, concurrent executions
- **💾 DynamoDB**: Read/write capacity, throttling
- **📋 SQS**: Message count, age, dead letter queue
- **📨 SNS**: Published messages, delivery failures

### Health Checks

```bash
# Check API health
curl https://your-api-gateway-url/health

# Check error logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/medical-appointment-scheduling-dev-appointment \
  --filter-pattern "ERROR"

# Check SQS queue depth
aws sqs get-queue-attributes \
  --queue-url https://sqs.region.amazonaws.com/account/appointments-pe-dev \
  --attribute-names ApproximateNumberOfMessages
```

### Configured Alerts

- **Lambda Errors** > 5 in 5 minutes
- **DynamoDB Throttling** > 0
- **SQS Dead Letter Queue** > 0
- **API Gateway 5xx Errors** > 1%

## 🤝 Contributing

### Development Workflow

```bash
# 1. Fork and clone
git clone https://github.com/your-username/medical-appointment-scheduling.git
cd medical-appointment-scheduling

# 2. Create feature branch
git checkout -b feature/new-feature

# 3. Install and setup
npm install
npm run build

# 4. Develop with tests
npm run test:watch

# 5. Pre-commit checks
npm test
npm run lint
npm run test:coverage

# 6. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 7. Create Pull Request
```

### Code Standards

- **TypeScript**: Strict mode, explicit types, no `any`
- **Naming**: camelCase variables, PascalCase classes
- **Testing**: Minimum 80% coverage for new code
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/)
- **Documentation**: JSDoc for public APIs

### Commit Convention

```
feat: new feature
fix: bug fix  
docs: documentation changes
style: formatting
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

---

## 📚 Additional Documentation

- 📖 **[Complete Documentation](PROJECT-DOCUMENTATION.md)** - Complete technical and business guide
- 🏗️ **[Infrastructure Documentation](docs/INFRASTRUCTURE.md)** - AWS setup and configuration
- 📋 **[Business Requirements](static/REQUIREMENTS.md)** - Original specifications
- 🔌 **[OpenAPI Specification](docs/openapi.yml)** - API documentation
- 📊 **[Architecture Diagram](static/diagrama.png)** - System visual diagram

## 🤝 Support

### Report Issues
- **GitHub Issues**: [Repository Issues](https://github.com/kedeinroga/medical-appointment-scheduling/issues)

### Contributing
See [contributing guide](#-contributing) above for complete process details.

---

**🏥 Built with ❤️ using Clean Architecture, SOLID Principles, and AWS Serverless**

**📅 Last updated**: September 2024  
**🔄 Version**: 1.2.0  
**📝 Maintained by**: Medical Appointments Development Team