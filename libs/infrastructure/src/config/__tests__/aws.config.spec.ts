import { AWS_CONFIG, validateAWSConfig, getSQSUrlByCountry } from '../aws.config';

describe('AWS Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { 
      ...originalEnv,
      APPOINTMENTS_PE_TOPIC_ARN: 'arn:aws:sns:us-east-1:123456789:test-topic-pe',
      APPOINTMENTS_CL_TOPIC_ARN: 'arn:aws:sns:us-east-1:123456789:test-topic-cl'
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('AWS_CONFIG', () => {
    it('should have default values', () => {
      expect(AWS_CONFIG.AWS_REGION).toBe('us-east-1');
      expect(typeof AWS_CONFIG.RDS_PORT).toBe('number');
      expect(AWS_CONFIG.STAGE).toBe('test'); // From jest.setup.ts
    });

    it('should use environment variables when available', () => {
      expect(AWS_CONFIG.APPOINTMENTS_TABLE_NAME).toBe('test-appointments-table');
      expect(AWS_CONFIG.APPOINTMENTS_TOPIC_ARN).toBe('arn:aws:sns:us-east-1:123456789012:test-topic');
    });
  });

  describe('validateAWSConfig', () => {
    it('should not throw when all required configs are present', () => {
      // Re-import to get new config values with updated environment
      jest.resetModules();
      const { validateAWSConfig: newValidateAWSConfig } = require('../aws.config');
      
      expect(() => newValidateAWSConfig()).not.toThrow();
    });

    it('should throw when required configs are missing', () => {
      // Clear required config
      process.env.APPOINTMENTS_TABLE_NAME = '';
      
      // Re-import to get new config values
      jest.resetModules();
      const { validateAWSConfig: newValidateAWSConfig } = require('../aws.config');
      
      expect(() => newValidateAWSConfig()).toThrow('Missing required AWS configuration');
    });
  });

  describe('getSQSUrlByCountry', () => {
    it('should return PE queue URL for PE country', () => {
      const url = getSQSUrlByCountry('PE');
      expect(url).toBe(AWS_CONFIG.APPOINTMENTS_PE_QUEUE_URL);
    });

    it('should return CL queue URL for CL country', () => {
      const url = getSQSUrlByCountry('CL');
      expect(url).toBe(AWS_CONFIG.APPOINTMENTS_CL_QUEUE_URL);
    });

    it('should throw error for unsupported country', () => {
      expect(() => getSQSUrlByCountry('BR')).toThrow('Unsupported country: BR');
    });
  });
});
