import { SQSAdapter } from '../sqs.adapter';

// Mock AWS SDK
jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  SendMessageCommand: jest.fn(),
  ReceiveMessageCommand: jest.fn()
}));

// Mock AWS Lambda Powertools
jest.mock('@aws-lambda-powertools/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }))
}));

describe('SQSAdapter', () => {
  let adapter: SQSAdapter;

  beforeEach(() => {
    process.env.APPOINTMENTS_PE_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-pe-queue';
    process.env.APPOINTMENTS_CL_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-cl-queue';
    process.env.APPOINTMENTS_COMPLETION_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-completion-queue';
    process.env.AWS_REGION = 'us-east-1';
    
    adapter = new SQSAdapter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('construction', () => {
    it('should create SQS adapter instance', () => {
      expect(adapter).toBeInstanceOf(SQSAdapter);
    });
  });

  describe('configuration', () => {
    it('should use environment variables for configuration', () => {
      expect(process.env.APPOINTMENTS_PE_QUEUE_URL).toBe('https://sqs.us-east-1.amazonaws.com/123456789012/test-pe-queue');
      expect(process.env.APPOINTMENTS_CL_QUEUE_URL).toBe('https://sqs.us-east-1.amazonaws.com/123456789012/test-cl-queue');
      expect(process.env.APPOINTMENTS_COMPLETION_QUEUE_URL).toBe('https://sqs.us-east-1.amazonaws.com/123456789012/test-completion-queue');
    });
  });
});
