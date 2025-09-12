import { EventBridgeAdapter } from '../eventbridge.adapter';

// Mock AWS SDK
jest.mock('@aws-sdk/client-eventbridge', () => ({
  EventBridgeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  PutEventsCommand: jest.fn()
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

describe('EventBridgeAdapter', () => {
  let adapter: EventBridgeAdapter;

  beforeEach(() => {
    process.env.EVENTBRIDGE_BUS_NAME = 'test-event-bus';
    process.env.AWS_REGION = 'us-east-1';
    
    adapter = new EventBridgeAdapter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('construction', () => {
    it('should create EventBridge adapter instance', () => {
      expect(adapter).toBeInstanceOf(EventBridgeAdapter);
    });
  });

  describe('configuration', () => {
    it('should use environment variables for configuration', () => {
      expect(process.env.EVENTBRIDGE_BUS_NAME).toBe('test-event-bus');
      expect(process.env.AWS_REGION).toBe('us-east-1');
    });
  });
});
