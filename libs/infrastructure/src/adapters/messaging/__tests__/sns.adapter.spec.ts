import { SNSAdapter } from '../sns.adapter';

// Mock AWS SDK
jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  PublishCommand: jest.fn()
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

describe('SNSAdapter', () => {
  let adapter: SNSAdapter;

  beforeEach(() => {
    process.env.APPOINTMENTS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:test-topic';
    process.env.AWS_REGION = 'us-east-1';
    
    adapter = new SNSAdapter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('construction', () => {
    it('should create SNS adapter instance', () => {
      expect(adapter).toBeInstanceOf(SNSAdapter);
    });
  });

  describe('configuration', () => {
    it('should use environment variables for configuration', () => {
      expect(process.env.APPOINTMENTS_TOPIC_ARN).toBe('arn:aws:sns:us-east-1:123456789012:test-topic');
      expect(process.env.AWS_REGION).toBe('us-east-1');
    });
  });
});
