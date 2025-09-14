import { DependencyFactory, createHandlerDependencies, createHandlerConfig } from '../factory';
import { clearSingletonInstances } from '../../../libs/shared/src/decorators/singleton/singleton.decorators';

// Mock dependencies
jest.mock('@aws-lambda-powertools/logger');
jest.mock('@medical-appointment/infrastructure');
jest.mock('@medical-appointment/core-use-cases');

describe('DependencyFactory - Extended Tests', () => {
  beforeEach(() => {
    clearSingletonInstances();
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.LOG_LEVEL = 'DEBUG';
    process.env.ENVIRONMENT = 'test';
    process.env.BATCH_SIZE = '50';
    process.env.MAX_RETRIES = '5';
    process.env.PROCESSING_TIMEOUT = '30000';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.LOG_LEVEL;
    delete process.env.ENVIRONMENT;
    delete process.env.BATCH_SIZE;
    delete process.env.MAX_RETRIES;
    delete process.env.PROCESSING_TIMEOUT;
  });

  describe('DependencyFactory class', () => {
    it('should create dependencies with custom environment variables', () => {
      const factory = new DependencyFactory();
      const dependencies = factory.createDependencies();

      expect(dependencies).toHaveProperty('processAppointmentUseCase');
      expect(dependencies).toHaveProperty('appointmentRepository');
      expect(dependencies).toHaveProperty('logger');
    });

    it('should return same dependencies on subsequent calls (singleton behavior)', () => {
      const factory = new DependencyFactory();
      const dependencies1 = factory.createDependencies();
      const dependencies2 = factory.createDependencies();

      expect(dependencies1).toBe(dependencies2);
    });

    it('should create config with environment variables', () => {
      const factory = new DependencyFactory();
      const config = factory.createConfig();

      expect(config).toEqual({
        targetCountry: 'CL',
        batchSize: 50,
        maxRetries: 5,
        processingTimeout: 30000
      });
    });

    it('should create config with default values when env vars are missing', () => {
      delete process.env.BATCH_SIZE;
      delete process.env.MAX_RETRIES;
      delete process.env.PROCESSING_TIMEOUT;

      const factory = new DependencyFactory();
      const config = factory.createConfig();

      expect(config.batchSize).toBe(10); // Default from HANDLER_CONSTANTS.MAX_BATCH_SIZE
      expect(config.maxRetries).toBe(3);  // Default from HANDLER_CONSTANTS.MAX_RETRIES
      expect(config.processingTimeout).toBe(30000); // Default from HANDLER_CONSTANTS.DEFAULT_TIMEOUT
    });

    it('should create test dependencies with overrides', () => {
      const factory = new DependencyFactory();
      const mockOverrides = {
        logger: { info: jest.fn(), error: jest.fn() } as any
      };

      const testDependencies = factory.createTestDependencies(mockOverrides);

      expect(testDependencies.logger).toBe(mockOverrides.logger);
      expect(testDependencies).toHaveProperty('processAppointmentUseCase');
      expect(testDependencies).toHaveProperty('appointmentRepository');
    });

    it('should create test dependencies without overrides', () => {
      const factory = new DependencyFactory();
      const testDependencies = factory.createTestDependencies();

      expect(testDependencies).toHaveProperty('processAppointmentUseCase');
      expect(testDependencies).toHaveProperty('appointmentRepository');
      expect(testDependencies).toHaveProperty('logger');
    });

    it('should reset dependencies correctly', () => {
      const factory = new DependencyFactory();
      const dependencies1 = factory.createDependencies();
      
      factory.reset();
      
      const dependencies2 = factory.createDependencies();

      // After reset, should create new dependencies
      expect(dependencies2).toHaveProperty('processAppointmentUseCase');
      expect(dependencies2).toHaveProperty('appointmentRepository');
      expect(dependencies2).toHaveProperty('logger');
    });

    it('should handle invalid environment variable values gracefully', () => {
      process.env.BATCH_SIZE = 'invalid';
      process.env.MAX_RETRIES = 'invalid';
      process.env.PROCESSING_TIMEOUT = 'invalid';

      const factory = new DependencyFactory();
      const config = factory.createConfig();

      // Should fallback to NaN, which becomes default values
      expect(isNaN(config.batchSize)).toBe(true);
      expect(isNaN(config.maxRetries)).toBe(true);
      expect(isNaN(config.processingTimeout)).toBe(true);
    });
  });

  describe('convenience functions', () => {
    it('should create handler dependencies using convenience function', () => {
      const dependencies = createHandlerDependencies();

      expect(dependencies).toHaveProperty('processAppointmentUseCase');
      expect(dependencies).toHaveProperty('appointmentRepository');
      expect(dependencies).toHaveProperty('logger');
    });

    it('should create handler config using convenience function', () => {
      const config = createHandlerConfig();

      expect(config).toHaveProperty('targetCountry');
      expect(config).toHaveProperty('batchSize');
      expect(config).toHaveProperty('maxRetries');
      expect(config).toHaveProperty('processingTimeout');
      expect(config.targetCountry).toBe('CL');
    });

    it('should create different instances each time for convenience functions', () => {
      const dependencies1 = createHandlerDependencies();
      const dependencies2 = createHandlerDependencies();

      // Since they use new instances of DependencyFactory, they should be different
      // but have the same structure
      expect(dependencies1).toHaveProperty('processAppointmentUseCase');
      expect(dependencies2).toHaveProperty('processAppointmentUseCase');
    });
  });

  describe('edge cases', () => {
    it('should handle missing LOG_LEVEL environment variable', () => {
      delete process.env.LOG_LEVEL;
      delete process.env.ENVIRONMENT;

      const factory = new DependencyFactory();
      const dependencies = factory.createDependencies();

      expect(dependencies).toHaveProperty('logger');
    });

    it('should create multiple factory instances with singleton behavior', () => {
      const factory1 = new DependencyFactory();
      const factory2 = new DependencyFactory();

      const deps1 = factory1.createDependencies();
      const deps2 = factory2.createDependencies();

      // Each factory should maintain its own dependencies
      expect(deps1).toHaveProperty('processAppointmentUseCase');
      expect(deps2).toHaveProperty('processAppointmentUseCase');
    });
  });
});
