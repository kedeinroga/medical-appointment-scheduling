// Global test setup
import { Logger } from '@aws-lambda-powertools/logger';

// Mock AWS Lambda Powertools Logger for tests
jest.mock('@aws-lambda-powertools/logger');

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-sns');
jest.mock('@aws-sdk/client-sqs');
jest.mock('@aws-sdk/client-eventbridge');
jest.mock('@aws-sdk/client-rds');

// Set test environment variables
process.env.STAGE = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.APPOINTMENTS_TABLE_NAME = 'test-appointments';
process.env.APPOINTMENTS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:test-appointments';
process.env.APPOINTMENTS_PE_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-appointments-pe';
process.env.APPOINTMENTS_CL_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-appointments-cl';
process.env.EVENTBRIDGE_BUS_NAME = 'test-medical-appointments';
process.env.RDS_HOST = 'localhost';
process.env.RDS_DATABASE = 'test_medical_appointments';
process.env.RDS_USERNAME = 'test';
process.env.RDS_PASSWORD = 'test';
process.env.LOG_LEVEL = 'SILENT';
