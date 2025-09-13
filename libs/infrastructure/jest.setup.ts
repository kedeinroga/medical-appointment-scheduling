// Jest setup file for infrastructure tests

// Mock AWS SDK environment
process.env.AWS_REGION = 'us-east-1';
process.env.APPOINTMENTS_TABLE_NAME = 'test-appointments-table';
process.env.APPOINTMENTS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:test-topic';
process.env.APPOINTMENTS_PE_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:test-appointments-pe';
process.env.APPOINTMENTS_CL_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:test-appointments-cl';
process.env.APPOINTMENTS_PE_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-appointments-pe';
process.env.APPOINTMENTS_CL_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-appointments-cl';
process.env.APPOINTMENTS_COMPLETION_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-appointments-completion';
process.env.EVENTBRIDGE_BUS_NAME = 'test-medical-appointments';
process.env.RDS_HOST = 'test-rds-host';
process.env.RDS_USERNAME = 'test-user';
process.env.RDS_PASSWORD = 'test-password';
process.env.RDS_PORT = '3306';
process.env.STAGE = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
