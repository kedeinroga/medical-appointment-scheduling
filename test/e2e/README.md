# E2E Test Guide

## Overview

These End-to-End (E2E) tests validate the complete information flow of the Medical Appointment Scheduling system to ensure that refactoring doesn't break the business logic.

## Information Flow Being Tested

The tests validate this complete flow:

```
1. API → appointment λ → DynamoDB (pending)
2. appointment λ → PE/CL SNS → Country SQS → PE/CL λ → MySQL(RDS) (scheduled)
3. PE/CL λ → EventBridge → Completion SQS → appointment λ → DynamoDB UPDATE (completed)
```

## Test Scenarios

### ✅ Core Flow Tests
- **PE Country Flow**: Creates appointment for Peru and validates complete lifecycle
- **CL Country Flow**: Creates appointment for Chile and validates complete lifecycle

### ✅ Error Scenarios
- Invalid country ISO codes
- Malformed request bodies  
- Non-existent insured IDs

### ✅ Flow Documentation
- Verifies expected flow stages
- Validates response data structures
- Documents critical requirements for refactoring protection

## Running the Tests

### Local Testing (Simulated)
```bash
# Run E2E tests locally with mocked responses
npm run test:e2e
```

### Dev Environment Testing (Real API)
```bash
# Test against deployed dev environment
STAGE=dev API_GATEWAY_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev npm run test:e2e:dev
```

### Production Smoke Testing
```bash
# Test critical flows in production
STAGE=prod API_GATEWAY_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod npm run test:smoke:prod
```

## Test Configuration

Tests adapt to environment:

- **Local**: Uses simulated responses, faster execution
- **Dev**: Uses real API endpoints, validates full infrastructure
- **Prod**: Limited smoke tests, validates critical flows only

## Expected Responses

### POST /appointments
```json
{
  "data": {
    "appointmentId": "397ce242-d456-4a54-b2c1-5fcabb3c9471",
    "countryISO": "PE",
    "insuredId": "10134",
    "scheduleId": 1,
    "status": "pending",
    "createdAt": "2025-09-13T23:50:45.680Z"
  },
  "timestamp": "2025-09-13T23:50:45.680Z"
}
```

### GET /appointments/{insuredId}
```json
{
  "data": {
    "appointments": [
      {
        "appointmentId": "397ce242-d456-4a54-b2c1-5fcabb3c9471",
        "countryISO": "PE",
        "createdAt": "2025-09-13T23:50:45.680Z",
        "insuredId": "10134",
        "processedAt": null,
        "schedule": {
          "centerId": 1,
          "date": "2025-09-14T23:29:13.000Z",
          "medicId": 1,
          "specialtyId": 1
        },
        "scheduleId": 1,
        "status": "completed",
        "updatedAt": "2025-09-13T23:50:46.268Z"
      }
    ],
    "pagination": {
      "count": 1
    }
  },
  "timestamp": "2025-09-13T23:51:21.528Z"
}
```

## Refactoring Protection

These tests serve as a safety net during refactoring:

1. **Flow Integrity**: Ensures the 3-stage information flow continues working
2. **Data Structure**: Validates response formats match requirements
3. **Error Handling**: Confirms edge cases are handled properly
4. **Cross-Country**: Tests both PE and CL processing paths

## Troubleshooting

### Test Failures During Refactoring

If E2E tests fail after refactoring:

1. **Check Flow Stage**: Which stage is failing?
   - Stage 1: API Gateway → Lambda → DynamoDB
   - Stage 2: SNS → SQS → Country Lambda → RDS
   - Stage 3: EventBridge → Completion → Status Update

2. **Verify Response Format**: Does the response match expected structure?

3. **Check Environment Variables**: Are all AWS resource names/ARNs correct?

4. **Validate Async Processing**: Is there sufficient wait time for message processing?

### Common Issues

- **Timeout**: Increase `waitTime` in test config for slower environments
- **Resource Not Found**: Check that AWS resources are deployed correctly
- **Permission Denied**: Verify IAM roles have necessary permissions
- **Message Not Processed**: Check SQS queues and Lambda function logs

## Adding New Tests

When adding new features, extend the E2E tests:

1. Add new test scenarios in appropriate describe blocks
2. Update the flow documentation in verification helpers
3. Add new expected response structures
4. Update this README with new requirements

## Monitoring

After refactoring, monitor:

- Test execution time (should remain under configured timeout)
- Success rate (should be 100% for valid scenarios)
- Error scenarios (should fail gracefully with expected error codes)

## Environment Variables

Required for deployed environment testing:

```bash
STAGE=dev|prod
API_GATEWAY_URL=https://your-api-id.execute-api.region.amazonaws.com/stage
```

Optional:
```bash
LOG_LEVEL=DEBUG  # For verbose test output
```
