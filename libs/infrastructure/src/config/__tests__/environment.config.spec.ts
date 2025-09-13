import { 
  getEnvironmentConfig, 
  validateEnvironmentConfig, 
  getStageConfig, 
  isProduction, 
  isDevelopment, 
  getFeatureFlags,
  EnvironmentConfig 
} from '../environment.config';

// Mock AWS_CONFIG
jest.mock('../aws.config', () => ({
  AWS_CONFIG: {
    APPOINTMENTS_TABLE_NAME: 'test-appointments-table',
    APPOINTMENTS_TOPIC_ARN: 'arn:aws:sns:us-east-1:123456789012:test-topic',
    EVENTBRIDGE_BUS_NAME: 'test-event-bus',
    AWS_REGION: 'us-east-1',
    RDS_HOST: 'test-rds-host',
    RDS_PASSWORD: 'test-password',
    RDS_PORT: 3306,
    RDS_USERNAME: 'test-username',
    STAGE: 'dev'
  }
}));

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    jest.resetModules();
    process.env = { 
      ...originalEnv,
      APPOINTMENTS_TABLE_NAME: 'test-appointments-table',
      APPOINTMENTS_TOPIC_ARN: 'arn:aws:sns:us-east-1:123456789012:test-topic',
      EVENTBRIDGE_BUS_NAME: 'test-event-bus',
      RDS_HOST: 'test-rds-host',
      RDS_USERNAME: 'test-username',
      RDS_PASSWORD: 'test-password',
      LOG_LEVEL: 'INFO',
      LOG_RETENTION_DAYS: '7'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getEnvironmentConfig', () => {
    it('should return complete environment configuration', () => {
      const config = getEnvironmentConfig();

      expect(config).toEqual({
        aws: {
          appointmentsTableName: 'test-appointments-table',
          appointmentsTopicArn: 'arn:aws:sns:us-east-1:123456789012:test-topic',
          eventBridgeBusName: 'test-event-bus',
          region: 'us-east-1'
        },
        database: {
          host: 'test-rds-host',
          password: 'test-password',
          port: 3306,
          username: 'test-username'
        },
        logging: {
          level: 'INFO',
          retentionDays: 7
        },
        stage: 'dev'
      });
    });

    it('should use default logging values when env vars are not set', () => {
      delete process.env.LOG_LEVEL;
      delete process.env.LOG_RETENTION_DAYS;

      const config = getEnvironmentConfig();

      expect(config.logging.level).toBe('INFO');
      expect(config.logging.retentionDays).toBe(7);
    });

    it('should parse LOG_RETENTION_DAYS as number', () => {
      process.env.LOG_RETENTION_DAYS = '30';

      const config = getEnvironmentConfig();

      expect(config.logging.retentionDays).toBe(30);
      expect(typeof config.logging.retentionDays).toBe('number');
    });

    it('should throw when required environment variables are missing', () => {
      delete process.env.APPOINTMENTS_TABLE_NAME;

      expect(() => getEnvironmentConfig()).toThrow(
        'Missing required environment variables: APPOINTMENTS_TABLE_NAME'
      );
    });
  });

  describe('validateEnvironmentConfig', () => {
    it('should not throw when all required environment variables are present', () => {
      expect(() => validateEnvironmentConfig()).not.toThrow();
    });

    it('should throw when APPOINTMENTS_TABLE_NAME is missing', () => {
      delete process.env.APPOINTMENTS_TABLE_NAME;

      expect(() => validateEnvironmentConfig()).toThrow(
        'Missing required environment variables: APPOINTMENTS_TABLE_NAME'
      );
    });

    it('should throw when APPOINTMENTS_TOPIC_ARN is missing', () => {
      delete process.env.APPOINTMENTS_TOPIC_ARN;

      expect(() => validateEnvironmentConfig()).toThrow(
        'Missing required environment variables: APPOINTMENTS_TOPIC_ARN'
      );
    });

    it('should throw when EVENTBRIDGE_BUS_NAME is missing', () => {
      delete process.env.EVENTBRIDGE_BUS_NAME;

      expect(() => validateEnvironmentConfig()).toThrow(
        'Missing required environment variables: EVENTBRIDGE_BUS_NAME'
      );
    });

    it('should throw when RDS_HOST is missing', () => {
      delete process.env.RDS_HOST;

      expect(() => validateEnvironmentConfig()).toThrow(
        'Missing required environment variables: RDS_HOST'
      );
    });

    it('should throw when RDS_USERNAME is missing', () => {
      delete process.env.RDS_USERNAME;

      expect(() => validateEnvironmentConfig()).toThrow(
        'Missing required environment variables: RDS_USERNAME'
      );
    });

    it('should throw when RDS_PASSWORD is missing', () => {
      delete process.env.RDS_PASSWORD;

      expect(() => validateEnvironmentConfig()).toThrow(
        'Missing required environment variables: RDS_PASSWORD'
      );
    });

    it('should throw when multiple environment variables are missing', () => {
      delete process.env.APPOINTMENTS_TABLE_NAME;
      delete process.env.RDS_HOST;

      expect(() => validateEnvironmentConfig()).toThrow(
        'Missing required environment variables: APPOINTMENTS_TABLE_NAME, RDS_HOST'
      );
    });
  });

  describe('getStageConfig', () => {
    it('should return dev configuration for dev stage', () => {
      // Mock is already set to 'dev'
      const config = getStageConfig();

      expect(config).toEqual({
        logLevel: 'DEBUG',
        retentionDays: 3
      });
    });

    it('should return prod configuration for prod stage', () => {
      // We need to mock AWS_CONFIG again with prod stage
      jest.doMock('../aws.config', () => ({
        AWS_CONFIG: {
          STAGE: 'prod'
        }
      }));

      // Re-import to get the new mock
      const { getStageConfig } = require('../environment.config');
      const config = getStageConfig();

      expect(config).toEqual({
        logLevel: 'INFO',
        retentionDays: 30
      });
    });

    it('should return staging configuration for staging stage', () => {
      jest.doMock('../aws.config', () => ({
        AWS_CONFIG: {
          STAGE: 'staging'
        }
      }));

      const { getStageConfig } = require('../environment.config');
      const config = getStageConfig();

      expect(config).toEqual({
        logLevel: 'INFO',
        retentionDays: 7
      });
    });

    it('should return dev configuration for unknown stage', () => {
      jest.doMock('../aws.config', () => ({
        AWS_CONFIG: {
          STAGE: 'unknown'
        }
      }));

      const { getStageConfig } = require('../environment.config');
      const config = getStageConfig();

      expect(config).toEqual({
        logLevel: 'DEBUG',
        retentionDays: 3
      });
    });
  });

  describe('isProduction', () => {
    it('should return false for dev stage', () => {
      expect(isProduction()).toBe(false);
    });

    it('should return true for prod stage', () => {
      jest.doMock('../aws.config', () => ({
        AWS_CONFIG: {
          STAGE: 'prod'
        }
      }));

      const { isProduction } = require('../environment.config');
      expect(isProduction()).toBe(true);
    });

    it('should return false for staging stage', () => {
      jest.doMock('../aws.config', () => ({
        AWS_CONFIG: {
          STAGE: 'staging'
        }
      }));

      const { isProduction } = require('../environment.config');
      expect(isProduction()).toBe(false);
    });
  });

  describe('isDevelopment', () => {
    it('should return true for dev stage', () => {
      expect(isDevelopment()).toBe(true);
    });

    it('should return false for prod stage', () => {
      jest.doMock('../aws.config', () => ({
        AWS_CONFIG: {
          STAGE: 'prod'
        }
      }));

      const { isDevelopment } = require('../environment.config');
      expect(isDevelopment()).toBe(false);
    });

    it('should return false for staging stage', () => {
      jest.doMock('../aws.config', () => ({
        AWS_CONFIG: {
          STAGE: 'staging'
        }
      }));

      const { isDevelopment } = require('../environment.config');
      expect(isDevelopment()).toBe(false);
    });
  });

  describe('getFeatureFlags', () => {
    it('should return feature flags for dev environment', () => {
      const flags = getFeatureFlags();

      expect(flags).toEqual({
        enableDebugLogging: true,
        enableDetailedMetrics: false,
        enableSensitiveDataMasking: true
      });
    });

    it('should return feature flags for prod environment', () => {
      jest.doMock('../aws.config', () => ({
        AWS_CONFIG: {
          STAGE: 'prod'
        }
      }));

      const { getFeatureFlags } = require('../environment.config');
      const flags = getFeatureFlags();

      expect(flags).toEqual({
        enableDebugLogging: false,
        enableDetailedMetrics: true,
        enableSensitiveDataMasking: true
      });
    });

    it('should always enable sensitive data masking', () => {
      const flags = getFeatureFlags();
      expect(flags.enableSensitiveDataMasking).toBe(true);
    });
  });
});
