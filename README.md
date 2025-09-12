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

### Test Coverage Report

The project maintains high test coverage across all architectural layers:

| Layer | Coverage | Description |
|-------|----------|-------------|
| **Domain** | 95%+ | Entities, Value Objects, Domain Services |
| **Application** | 90%+ | Use Cases and orchestration |
| **Infrastructure** | 80%+ | Adapters and AWS integrations |
| **Functions** | 85%+ | Lambda handlers |

### Running Tests

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

### Test Structure

```
├── libs/core/domain/src/**/__tests__/        # Domain layer unit tests
├── libs/core/use-cases/src/**/__tests__/     # Application layer unit tests  
├── libs/infrastructure/src/**/__tests__/     # Infrastructure unit tests
├── functions/*/__tests__/                    # Lambda function tests
└── test/integration/                         # End-to-end integration tests
```

### Key Test Files

- **Domain Tests**: Entity validation, business rules, value objects
- **Use Case Tests**: Application logic with mocked dependencies
- **Integration Tests**: Complete flow validation with AWS service mocks
- **Lambda Tests**: API Gateway event handling and error responses

## 🔧 Development

### Environment Configuration

Configure environment-specific settings in `config/` directory:

```yaml
# config/dev.yml - Development environment
rds:
  host: dev-medical-rds.cluster-xxxxx.us-east-1.rds.amazonaws.com
  port: 3306
  database: medical_appointments_dev

api:
  throttling:
    rateLimit: 100
    burstLimit: 200

logging:
  level: DEBUG
  retention: 7

# config/prod.yml - Production environment  
rds:
  host: prod-medical-rds.cluster-xxxxx.us-east-1.rds.amazonaws.com
  port: 3306
  database: medical_appointments

api:
  throttling:
    rateLimit: 1000
    burstLimit: 2000

logging:
  level: INFO
  retention: 30
```

### Local Development

```bash
# Start serverless offline for local development
serverless offline start

# Install and run LocalStack for AWS services simulation
docker run -d -p 4566:4566 localstack/localstack

# Run tests against LocalStack
npm run test:integration:local
```

### Code Conventions

Following Clean Architecture and AWS best practices:

- **Clean Architecture**: Domain → Application → Infrastructure → Functions
- **SOLID Principles**: Single responsibility, Open/closed, Dependency inversion
- **TypeScript**: Strict mode, explicit types, no any
- **Naming**: Single quotes, alphabetical field ordering, descriptive names
- **Constants**: Use constants instead of magic numbers/strings
- **Error Handling**: Structured errors with correlation IDs

### Architecture Patterns Implemented

1. **Repository Pattern**: Abstract data persistence
2. **Factory Pattern**: Dependency injection and object creation
3. **Adapter Pattern**: AWS service integration
4. **Command Pattern**: Use cases as commands
5. **Event-Driven Pattern**: Domain events and async processing
6. **Saga Pattern**: Multi-step appointment workflow

### Domain-Driven Design Examples

```typescript
// Value Objects with validation
export class InsuredId {
  private constructor(private readonly value: string) {
    this.validate(value);
  }
  
  public static fromString(value: string): InsuredId {
    return new InsuredId(value);
  }
  
  private validate(value: string): void {
    if (!/^[0-9]{5}$/.test(value)) {
      throw new InvalidInsuredIdError(`Invalid insured ID: ${value}`);
    }
  }
}

// Domain entities with business logic
export class Appointment {
  public markAsProcessed(): void {
    this.validateStatusTransition(AppointmentStatus.PROCESSED);
    this.status = AppointmentStatus.PROCESSED;
    this.updatedAt = new Date();
    
    // Emit domain event
    this.addEvent(new AppointmentProcessedEvent(this.appointmentId));
  }
  
  private validateStatusTransition(newStatus: AppointmentStatus): void {
    const validTransitions = {
      [AppointmentStatus.PENDING]: [AppointmentStatus.PROCESSED],
      [AppointmentStatus.PROCESSED]: [AppointmentStatus.COMPLETED]
    };
    
    if (!validTransitions[this.status.getValue()]?.includes(newStatus)) {
      throw new InvalidStatusTransitionError(
        `Cannot transition from ${this.status.getValue()} to ${newStatus.getValue()}`
      );
    }
  }
}

// Use cases with dependency injection
export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly eventBus: IEventBus,
    private readonly scheduleRepository: IScheduleRepository
  ) {}
  
  async execute(dto: CreateAppointmentDto): Promise<CreateAppointmentResponseDto> {
    // 1. Validate business rules
    await this.validateAppointmentCreation(dto);
    
    // 2. Create domain entity
    const appointment = Appointment.create(
      InsuredId.fromString(dto.insuredId),
      dto.scheduleId,
      CountryISO.fromString(dto.countryISO)
    );
    
    // 3. Persist
    await this.appointmentRepository.save(appointment);
    
    // 4. Publish event
    await this.eventBus.publish(
      new AppointmentCreatedEvent(appointment.id, appointment.countryISO)
    );
    
    return CreateAppointmentResponseDto.fromEntity(appointment);
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

## 📄 User Documentation

This section provides comprehensive documentation for end users integrating with the Medical Appointment Scheduling API.

### 🎯 API Overview for Users

The Medical Appointment Scheduling API provides a simple, RESTful interface to:
- Create medical appointments for Peru (PE) and Chile (CL)
- Retrieve appointment history for insured patients
- Track appointment status through the processing workflow

### 🔐 Authentication & Setup

#### API Key Configuration
Contact your system administrator to obtain an API key. All requests must include the API key in the header:

```http
X-API-Key: your-api-key-here
```

#### Base URLs by Environment
- **Development**: `https://dev-api.medical-appointments.com`
- **Staging**: `https://staging-api.medical-appointments.com`
- **Production**: `https://api.medical-appointments.com`

### 📋 Data Formats & Validation

#### Supported Countries
- **PE** (Peru): Insured ID format `XXXXX` (5 digits)
- **CL** (Chile): Insured ID format `XXXXX` (5 digits)

#### Schedule ID References
Schedule IDs represent available appointment slots. Contact your integration team for the schedule catalog for each country.

### 🚀 Getting Started Guide

#### Step 1: Verify API Connectivity
```bash
curl -X GET https://api.medical-appointments.com/health \
  -H "X-API-Key: your-api-key"
```

#### Step 2: Create Your First Appointment
```bash
curl -X POST https://api.medical-appointments.com/appointments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "insuredId": "00123",
    "scheduleId": 100,
    "countryISO": "PE"
  }'
```

#### Step 3: Check Appointment Status
```bash
curl -X GET https://api.medical-appointments.com/appointments/00123 \
  -H "X-API-Key: your-api-key"
```

### �🔍 Complete API Reference

#### Create Appointment

**Endpoint**: `POST /appointments`

**Description**: Creates a new medical appointment for the specified country.

**Request Headers**:
```http
Content-Type: application/json
X-API-Key: your-api-key
```

**Request Body**:
```json
{
  "insuredId": "string (5 digits)",
  "scheduleId": "number",
  "countryISO": "PE | CL"
}
```

**Success Response (201)**:
```json
{
  "appointmentId": "uuid-v4",
  "status": "pending",
  "message": "Appointment creation in progress",
  "insuredId": "00123",
  "scheduleId": 100,
  "countryISO": "PE",
  "createdAt": "2024-09-11T10:00:00Z"
}
```

**Error Responses**:
```json
// 400 Bad Request - Invalid input
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid insured ID format",
  "details": {
    "field": "insuredId",
    "expected": "5 digits",
    "received": "123"
  }
}

// 429 Too Many Requests
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests",
  "retryAfter": 60
}

// 500 Internal Server Error
{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred",
  "correlationId": "req-12345"
}
```

#### Retrieve Appointments

**Endpoint**: `GET /appointments/{insuredId}`

**Description**: Retrieves all appointments for a specific insured person.

**Path Parameters**:
- `insuredId` (string): 5-digit insured identifier

**Query Parameters**:
- `status` (optional): Filter by status (`pending`, `processed`, `completed`)
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `country` (optional): Filter by country (`PE`, `CL`)
- `fromDate` (optional): Filter from date (ISO 8601 format)
- `toDate` (optional): Filter to date (ISO 8601 format)

**Example Requests**:
```bash
# Get all appointments
GET /appointments/00123

# Get completed appointments only
GET /appointments/00123?status=completed

# Get recent appointments with pagination
GET /appointments/00123?limit=10&offset=0&fromDate=2024-09-01T00:00:00Z

# Get Peru appointments only
GET /appointments/00123?country=PE
```

**Success Response (200)**:
```json
{
  "appointments": [
    {
      "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
      "insuredId": "00123",
      "scheduleId": 100,
      "countryISO": "PE",
      "status": "completed",
      "createdAt": "2024-09-11T10:00:00Z",
      "updatedAt": "2024-09-11T10:05:00Z",
      "processedAt": "2024-09-11T10:03:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### 🔄 Appointment Status Workflow

Understanding the appointment processing workflow:

1. **pending** → Initial status when appointment is created
2. **processing** → Appointment is being processed by country-specific service
3. **processed** → Successfully processed and stored in country database
4. **completed** → Confirmation received and appointment finalized
5. **failed** → Processing failed (check error details)

### 💡 Integration Examples

#### JavaScript/Node.js Integration

```javascript
class MedicalAppointmentClient {
  constructor(apiKey, baseURL = 'https://api.medical-appointments.com') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async createAppointment(insuredId, scheduleId, countryISO) {
    const response = await fetch(`${this.baseURL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({
        insuredId,
        scheduleId,
        countryISO
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.message}`);
    }

    return await response.json();
  }

  async getAppointments(insuredId, options = {}) {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, value);
    });

    const url = `${this.baseURL}/appointments/${insuredId}?${params}`;
    const response = await fetch(url, {
      headers: { 'X-API-Key': this.apiKey }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.message}`);
    }

    return await response.json();
  }

  async waitForCompletion(appointmentId, maxWaitTime = 300000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const appointments = await this.getAppointments(insuredId);
      const appointment = appointments.appointments.find(a => a.appointmentId === appointmentId);
      
      if (appointment && ['completed', 'failed'].includes(appointment.status)) {
        return appointment;
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }
    
    throw new Error('Appointment processing timeout');
  }
}

// Usage example
const client = new MedicalAppointmentClient('your-api-key');

async function bookAppointment() {
  try {
    // Create appointment
    const appointment = await client.createAppointment('00123', 100, 'PE');
    console.log('Appointment created:', appointment.appointmentId);
    
    // Wait for completion
    const completed = await client.waitForCompletion(appointment.appointmentId);
    console.log('Appointment completed:', completed.status);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

#### Python Integration

```python
import requests
import time
from typing import Optional, Dict, List

class MedicalAppointmentClient:
    def __init__(self, api_key: str, base_url: str = "https://api.medical-appointments.com"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        })

    def create_appointment(self, insured_id: str, schedule_id: int, country_iso: str) -> Dict:
        """Create a new medical appointment."""
        data = {
            "insuredId": insured_id,
            "scheduleId": schedule_id,
            "countryISO": country_iso
        }
        
        response = self.session.post(f"{self.base_url}/appointments", json=data)
        response.raise_for_status()
        return response.json()

    def get_appointments(self, insured_id: str, **filters) -> Dict:
        """Retrieve appointments for an insured person."""
        params = {k: v for k, v in filters.items() if v is not None}
        
        response = self.session.get(
            f"{self.base_url}/appointments/{insured_id}",
            params=params
        )
        response.raise_for_status()
        return response.json()

    def wait_for_completion(self, insured_id: str, appointment_id: str, max_wait: int = 300) -> Dict:
        """Wait for appointment to complete processing."""
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            appointments = self.get_appointments(insured_id)
            
            for appointment in appointments['appointments']:
                if appointment['appointmentId'] == appointment_id:
                    if appointment['status'] in ['completed', 'failed']:
                        return appointment
            
            time.sleep(5)  # Wait 5 seconds before checking again
        
        raise TimeoutError("Appointment processing timeout")

# Usage example
client = MedicalAppointmentClient('your-api-key')

# Create and track appointment
appointment = client.create_appointment('00123', 100, 'PE')
print(f"Created appointment: {appointment['appointmentId']}")

completed = client.wait_for_completion('00123', appointment['appointmentId'])
print(f"Appointment status: {completed['status']}")
```

#### PHP Integration

```php
<?php
class MedicalAppointmentClient {
    private $apiKey;
    private $baseUrl;

    public function __construct($apiKey, $baseUrl = 'https://api.medical-appointments.com') {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }

    public function createAppointment($insuredId, $scheduleId, $countryISO) {
        $data = [
            'insuredId' => $insuredId,
            'scheduleId' => $scheduleId,
            'countryISO' => $countryISO
        ];

        $ch = curl_init($this->baseUrl . '/appointments');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'X-API-Key: ' . $this->apiKey
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 201) {
            throw new Exception("API Error: " . $response);
        }

        return json_decode($response, true);
    }

    public function getAppointments($insuredId, $filters = []) {
        $url = $this->baseUrl . '/appointments/' . $insuredId;
        if (!empty($filters)) {
            $url .= '?' . http_build_query($filters);
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'X-API-Key: ' . $this->apiKey
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception("API Error: " . $response);
        }

        return json_decode($response, true);
    }
}

// Usage
$client = new MedicalAppointmentClient('your-api-key');
$appointment = $client->createAppointment('00123', 100, 'PE');
echo "Appointment created: " . $appointment['appointmentId'] . "\n";
?>
```

### ⚠️ Error Handling Best Practices

#### Retry Logic
Implement exponential backoff for transient errors:

```javascript
async function apiCallWithRetry(apiCall, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

#### Rate Limiting
Respect rate limits (100 requests/minute per API key):

```javascript
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async checkLimit() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}
```

### 📞 Support & Contact

#### Technical Support
- **Email**: technical-support@medical-appointments.com
- **Documentation**: https://docs.medical-appointments.com
- **Status Page**: https://status.medical-appointments.com

#### Business Hours
- **Peru Support**: Monday-Friday, 8:00 AM - 6:00 PM (PET)
- **Chile Support**: Monday-Friday, 9:00 AM - 7:00 PM (CLT)
- **Emergency Support**: 24/7 for production issues

#### SLA Commitments
- **API Uptime**: 99.9%
- **Response Time**: < 500ms (95th percentile)
- **Support Response**: < 4 hours (business hours)

---

## 🔍 Examples & Usage (Technical Examples)

### Creating an Appointment (cURL)

```bash
# Create Peru appointment
curl -X POST https://api.medical-appointments.com/appointments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "insuredId": "00123",
    "scheduleId": 100,
    "countryISO": "PE"
  }'

# Expected Response
{
  "appointmentId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Appointment creation in progress",
  "insuredId": "00123",
  "scheduleId": 100,
  "countryISO": "PE",
  "createdAt": "2024-09-11T10:00:00Z"
}
```

### Retrieving Appointments

```bash
# Get all appointments for insured
curl -X GET https://api.medical-appointments.com/appointments/00123 \
  -H "X-API-Key: your-api-key"

# Get appointments with pagination
curl -X GET "https://api.medical-appointments.com/appointments/00123?limit=10&offset=0" \
  -H "X-API-Key: your-api-key"

# Filter by status
curl -X GET "https://api.medical-appointments.com/appointments/00123?status=completed" \
  -H "X-API-Key: your-api-key"
```

### Advanced TypeScript Integration

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.medical-appointments.com',
  headers: {
    'X-API-Key': 'your-api-key',
    'Content-Type': 'application/json'
  }
});

// Create appointment
async function createAppointment(data: {
  insuredId: string;
  scheduleId: number;
  countryISO: 'PE' | 'CL';
}) {
  try {
    const response = await apiClient.post('/appointments', data);
    return response.data;
  } catch (error) {
    console.error('Error creating appointment:', error.response?.data);
    throw error;
  }
}

// Get appointments
async function getAppointments(insuredId: string, options?: {
  status?: 'pending' | 'processed' | 'completed';
  limit?: number;
  offset?: number;
}) {
  try {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    
    const response = await apiClient.get(`/appointments/${insuredId}?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching appointments:', error.response?.data);
    throw error;
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Deployment Fails

```bash
# Error: Resource limit exceeded
Error: The CloudFormation template is too large

# Solution: Deploy in stages
serverless deploy --stage dev --function appointment
serverless deploy --stage dev --function appointment-pe
serverless deploy --stage dev --function appointment-cl
```

#### 2. Lambda Cold Starts

```yaml
# serverless.yml - Add provisioned concurrency
functions:
  appointment:
    handler: functions/appointment/handler.main
    provisionedConcurrency: 2  # Pre-warm instances
    reservedConcurrency: 10    # Limit max concurrent
```

#### 3. DynamoDB Read/Write Capacity

```bash
# Monitor DynamoDB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=appointments-table-dev \
  --start-time 2024-09-11T00:00:00Z \
  --end-time 2024-09-11T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

#### 4. SQS Message Processing Delays

```bash
# Check dead letter queue
aws sqs receive-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/appointments-pe-dlq \
  --max-number-of-messages 10

# Redrive messages from DLQ
aws sqs redrive-allow-policy \
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/appointments-pe-dlq \
  --redrive-allow-policy '{"redrivePermission":"byQueue","sourceQueueArns":["arn:aws:sqs:us-east-1:123456789012:appointments-pe"]}'
```

### Performance Optimization

#### Memory and Timeout Settings

```yaml
# Optimal settings for different functions
functions:
  appointment:        # API handler - fast response
    memorySize: 256
    timeout: 15
    
  appointment-pe:     # Database operations
    memorySize: 512
    timeout: 30
    
  appointment-cl:     # Database operations  
    memorySize: 512
    timeout: 30
    
  appointment-completion:  # Simple updates
    memorySize: 128
    timeout: 10
```

#### Database Connection Pooling

```typescript
// RDS connection optimization
const connection = mysql.createConnection({
  host: process.env.RDS_HOST,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DATABASE,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});
```

### Monitoring & Alerts

#### CloudWatch Alarms

```bash
# Create alarm for API Gateway 4xx errors
aws cloudwatch put-metric-alarm \
  --alarm-name "AppointmentAPI-4xxErrors" \
  --alarm-description "High 4xx error rate" \
  --metric-name 4XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Create alarm for Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name "AppointmentLambda-Errors" \
  --alarm-description "Lambda function errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

### Deployment Best Practices

#### Blue/Green Deployment

```yaml
# serverless.yml - Gradual deployment
functions:
  appointment:
    handler: functions/appointment/handler.main
    deploymentSettings:
      type: Canary10Percent30Minutes
      alias: Live
      preTrafficHook: preTrafficValidation
      postTrafficHook: postTrafficValidation
```

#### Environment Promotion

```bash
# Promote from dev to prod
./scripts/deploy.sh dev us-east-1    # Deploy to dev first
./scripts/test.sh integration        # Run integration tests
./scripts/deploy.sh prod us-east-1   # Deploy to production
```

## 📞 Support

For support and questions, please refer to the project documentation or create an issue in the repository.

---

Built with ❤️ using Serverless Framework and Clean Architecture principles.
