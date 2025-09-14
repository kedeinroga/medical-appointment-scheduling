import { DependencyFactory } from '../factory';
import { Logger } from '@aws-lambda-powertools/logger';
import { clearSingletonInstances } from '../../../libs/shared/src/decorators/singleton/singleton.decorators';

// Mock dependencies
jest.mock('@aws-lambda-powertools/logger');
jest.mock('@medical-appointment/core-use-cases', () => ({
  ProcessCountryAppointmentUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn()
  }))
}));
jest.mock('@medical-appointment/infrastructure', () => ({
  InfrastructureBridgeFactory: {
    createProcessCountryAppointmentUseCase: jest.fn().mockReturnValue({
      execute: jest.fn()
    })
  },
  AdapterFactory: {
    createMySQLAppointmentRepository: jest.fn().mockReturnValue({
      save: jest.fn(),
      findByAppointmentId: jest.fn(),
      findByInsuredId: jest.fn(),
      update: jest.fn()
    })
  }
}));

describe(DependencyFactory.name, () => {
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Clear singleton instances between tests
    clearSingletonInstances();
    
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    } as any;

    (Logger as any).mockImplementation(() => mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('singleton behavior', () => {
    it('should return singleton instance', () => {
      const factory1 = new DependencyFactory();
      const factory2 = new DependencyFactory();
      
      expect(factory1).toBe(factory2);
    });

    it('should create new instance on first call', () => {
      const factory = new DependencyFactory();
      
      expect(factory).toBeDefined();
      expect(factory).toBeInstanceOf(DependencyFactory);
    });
  });

  describe('createDependencies', () => {
    it('should create dependencies successfully', () => {
      const factory = new DependencyFactory();
      
      // Mock environment variables
      process.env.LOG_LEVEL = 'DEBUG';
      process.env.ENVIRONMENT = 'test';
      
      const dependencies = factory.createDependencies();
      
      expect(dependencies).toBeDefined();
      expect(dependencies.logger).toBeDefined();
      expect(dependencies.processAppointmentUseCase).toBeDefined();
      expect(dependencies.appointmentRepository).toBeDefined();
    });

    it('should use default values when environment variables are not set', () => {
      delete process.env.LOG_LEVEL;
      delete process.env.ENVIRONMENT;
      
      const factory = new DependencyFactory();
      const dependencies = factory.createDependencies();
      
      expect(dependencies).toBeDefined();
      expect(dependencies.logger).toBeDefined();
      expect(dependencies.processAppointmentUseCase).toBeDefined();
      expect(dependencies.appointmentRepository).toBeDefined();
    });

    it('should return cached dependencies on subsequent calls', () => {
      const factory = new DependencyFactory();
      
      const dependencies1 = factory.createDependencies();
      const dependencies2 = factory.createDependencies();
      
      expect(dependencies1).toBe(dependencies2);
    });

    it('should create logger with proper configuration', () => {
      process.env.LOG_LEVEL = 'DEBUG';
      process.env.ENVIRONMENT = 'production';
      
      const factory = new DependencyFactory();
      factory.createDependencies();
      
      expect(Logger).toHaveBeenCalledWith({
        logLevel: 'DEBUG',
        serviceName: 'medical-appointment-cl-processor',
        environment: 'production'
      });
    });
  });

  describe('error handling', () => {
    it('should handle dependency creation errors gracefully', () => {
      // Mock implementation that throws error
      (Logger as any).mockImplementation(() => {
        throw new Error('Repository creation failed');
      });

      const factory = new DependencyFactory();
      
      expect(() => factory.createDependencies()).toThrow('Repository creation failed');
    });

    it('should handle logger creation errors', () => {
      // Mock Logger constructor to throw error
      (Logger as any).mockImplementation(() => {
        throw new Error('Logger creation failed');
      });

      const factory = new DependencyFactory();
      
      expect(() => factory.createDependencies()).toThrow('Logger creation failed');
    });
  });

  describe('singleton behavior with decorator', () => {
    it('should maintain same instance across multiple instantiations', () => {
      clearSingletonInstances(); // Reset for clean test
      
      const factory1 = new DependencyFactory();
      const factory2 = new DependencyFactory();
      const factory3 = new DependencyFactory();
      
      expect(factory1).toBe(factory2);
      expect(factory2).toBe(factory3);
    });

    it('should maintain same dependencies across multiple factory instances', () => {
      const factory1 = new DependencyFactory();
      const dependencies1 = factory1.createDependencies();
      
      const factory2 = new DependencyFactory();
      const dependencies2 = factory2.createDependencies();
      
      expect(factory1).toBe(factory2);
      expect(dependencies1).toBe(dependencies2);
    });

    it('should not recreate dependencies unnecessarily', () => {
      const factory = new DependencyFactory();
      
      // Call createDependencies multiple times
      factory.createDependencies();
      factory.createDependencies();
      factory.createDependencies();
      
      // Logger should only be called once due to caching
      expect(Logger).toHaveBeenCalledTimes(1);
    });
  });

  describe('environment configuration', () => {
    it('should handle various log levels', () => {
      const logLevels = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
      
      logLevels.forEach(level => {
        clearSingletonInstances(); // Reset for each test
        process.env.LOG_LEVEL = level;
        
        const factory = new DependencyFactory();
        factory.createDependencies();
        
        expect(Logger).toHaveBeenCalledWith(
          expect.objectContaining({
            logLevel: level
          })
        );
      });
    });

    it('should handle various environments', () => {
      const environments = ['dev', 'test', 'staging', 'production'];
      
      environments.forEach(env => {
        clearSingletonInstances(); // Reset for each test
        process.env.ENVIRONMENT = env;
        
        const factory = new DependencyFactory();
        factory.createDependencies();
        
        expect(Logger).toHaveBeenCalledWith(
          expect.objectContaining({
            serviceName: 'medical-appointment-cl-processor'
          })
        );
      });
    });

    it('should handle missing environment variables gracefully', () => {
      delete process.env.LOG_LEVEL;
      delete process.env.ENVIRONMENT;
      delete process.env.NODE_ENV;
      
      const factory = new DependencyFactory();
      
      expect(() => factory.createDependencies()).not.toThrow();
    });
  });
});