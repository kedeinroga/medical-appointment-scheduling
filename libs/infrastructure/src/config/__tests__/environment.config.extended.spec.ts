import { 
  getEnvironmentConfig, 
  validateEnvironmentConfig, 
  getStageConfig, 
  isProduction, 
  isDevelopment, 
  getFeatureFlags 
} from '../environment.config';

describe('EnvironmentConfig - Extended Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
    
    // Set required environment variables for tests
    process.env.APPOINTMENTS_TABLE_NAME = 'test-appointments-table';
    process.env.APPOINTMENTS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:test-topic';
    process.env.EVENTBRIDGE_BUS_NAME = 'test-eventbridge-bus';
    process.env.RDS_HOST = 'test-host';
    process.env.RDS_USERNAME = 'test-user';
    process.env.RDS_PASSWORD = 'test-password';
    process.env.RDS_PORT = '3306';
    
    // Set stage to dev initially (but tests can override this)
    process.env.STAGE = 'dev';
    
    // Clear module cache to ensure fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('getEnvironmentConfig', () => {
    it('should return complete environment configuration', () => {
      process.env.STAGE = 'dev';
      process.env.LOG_LEVEL = 'DEBUG';
      process.env.LOG_RETENTION_DAYS = '14';
      
      const config = getEnvironmentConfig();
      
      expect(config).toHaveProperty('aws');
      expect(config).toHaveProperty('database');
      expect(config).toHaveProperty('logging');
      expect(config).toHaveProperty('stage');
      expect(config.logging.level).toBe('DEBUG');
      expect(config.logging.retentionDays).toBe(14);
    });

    it('should use default values when optional env vars are not set', () => {
      delete process.env.LOG_LEVEL;
      delete process.env.LOG_RETENTION_DAYS;
      
      const config = getEnvironmentConfig();
      
      expect(config.logging.level).toBe('INFO');
      expect(config.logging.retentionDays).toBe(7);
    });

    it('should handle invalid LOG_RETENTION_DAYS gracefully', () => {
      process.env.LOG_RETENTION_DAYS = 'invalid';
      
      const config = getEnvironmentConfig();
      
      expect(isNaN(config.logging.retentionDays)).toBe(true);
    });
  });

  describe('validateEnvironmentConfig', () => {
    it('should pass validation when all required vars are present', () => {
      expect(() => validateEnvironmentConfig()).not.toThrow();
    });

    it('should throw error when APPOINTMENTS_TABLE_NAME is missing', () => {
      delete process.env.APPOINTMENTS_TABLE_NAME;
      
      expect(() => validateEnvironmentConfig()).toThrow(
        'Missing required environment variables: APPOINTMENTS_TABLE_NAME'
      );
    });

    it('should throw error when multiple vars are missing', () => {
      delete process.env.APPOINTMENTS_TABLE_NAME;
      delete process.env.RDS_HOST;
      
      expect(() => validateEnvironmentConfig()).toThrow(
        'Missing required environment variables: APPOINTMENTS_TABLE_NAME, RDS_HOST'
      );
    });

    it('should throw error when all required vars are missing', () => {
      delete process.env.APPOINTMENTS_TABLE_NAME;
      delete process.env.APPOINTMENTS_TOPIC_ARN;
      delete process.env.EVENTBRIDGE_BUS_NAME;
      delete process.env.RDS_HOST;
      delete process.env.RDS_USERNAME;
      delete process.env.RDS_PASSWORD;
      
      expect(() => validateEnvironmentConfig()).toThrow(
        'Missing required environment variables:'
      );
    });
  });

  describe('getStageConfig', () => {
    it('should return dev config for dev stage', () => {
      process.env.STAGE = 'dev';
      
      const config = getStageConfig();
      
      expect(config.logLevel).toBe('DEBUG');
      expect(config.retentionDays).toBe(3);
    });

    it('should return prod config for prod stage', async () => {
      process.env.STAGE = 'prod';
      
      // Re-import to get fresh instance with new env vars
      const { getStageConfig } = await import('../environment.config');
      const config = getStageConfig();
      
      expect(config.logLevel).toBe('INFO');
      expect(config.retentionDays).toBe(30);
    });

    it('should return staging config for staging stage', async () => {
      process.env.STAGE = 'staging';
      
      // Re-import to get fresh instance with new env vars
      const { getStageConfig } = await import('../environment.config');
      const config = getStageConfig();
      
      expect(config.logLevel).toBe('INFO');
      expect(config.retentionDays).toBe(7);
    });

    it('should return dev config for unknown stage', () => {
      process.env.STAGE = 'unknown';
      
      const config = getStageConfig();
      
      expect(config.logLevel).toBe('DEBUG');
      expect(config.retentionDays).toBe(3);
    });
  });

  describe('isProduction', () => {
    it('should return true when stage is prod', async () => {
      process.env.STAGE = 'prod';
      
      // Re-import to get fresh instance with new env vars
      const { isProduction } = await import('../environment.config');
      expect(isProduction()).toBe(true);
    });

    it('should return false when stage is dev', async () => {
      process.env.STAGE = 'dev';
      
      // Re-import to get fresh instance with new env vars
      const { isProduction } = await import('../environment.config');
      expect(isProduction()).toBe(false);
    });

    it('should return false when stage is staging', async () => {
      process.env.STAGE = 'staging';
      
      // Re-import to get fresh instance with new env vars
      const { isProduction } = await import('../environment.config');
      expect(isProduction()).toBe(false);
    });
  });

  describe('isDevelopment', () => {
    it('should return true when stage is dev', async () => {
      process.env.STAGE = 'dev';
      
      // Re-import to get fresh instance with new env vars
      const { isDevelopment } = await import('../environment.config');
      expect(isDevelopment()).toBe(true);
    });

    it('should return false when stage is prod', async () => {
      process.env.STAGE = 'prod';
      
      // Re-import to get fresh instance with new env vars
      const { isDevelopment } = await import('../environment.config');
      expect(isDevelopment()).toBe(false);
    });

    it('should return false when stage is staging', async () => {
      process.env.STAGE = 'staging';
      
      // Re-import to get fresh instance with new env vars
      const { isDevelopment } = await import('../environment.config');
      expect(isDevelopment()).toBe(false);
    });
  });

  describe('getFeatureFlags', () => {
    it('should return feature flags for development', async () => {
      process.env.STAGE = 'dev';
      
      // Re-import to get fresh instance with new env vars
      const { getFeatureFlags } = await import('../environment.config');
      const flags = getFeatureFlags();
      
      expect(flags.enableDebugLogging).toBe(true);
      expect(flags.enableDetailedMetrics).toBe(false);
      expect(flags.enableSensitiveDataMasking).toBe(true);
    });

    it('should return feature flags for production', async () => {
      process.env.STAGE = 'prod';
      
      // Re-import to get fresh instance with new env vars
      const { getFeatureFlags } = await import('../environment.config');
      const flags = getFeatureFlags();
      
      expect(flags.enableDebugLogging).toBe(false);
      expect(flags.enableDetailedMetrics).toBe(true);
      expect(flags.enableSensitiveDataMasking).toBe(true);
    });

    it('should return feature flags for staging', async () => {
      process.env.STAGE = 'staging';
      
      // Re-import to get fresh instance with new env vars
      const { getFeatureFlags } = await import('../environment.config');
      const flags = getFeatureFlags();
      
      expect(flags.enableDebugLogging).toBe(false);
      expect(flags.enableDetailedMetrics).toBe(false);
      expect(flags.enableSensitiveDataMasking).toBe(true);
    });
  });
});
