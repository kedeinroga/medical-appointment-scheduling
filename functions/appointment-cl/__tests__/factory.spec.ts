import { DependencyFactory } from '../factory';
import { Logger } from '@aws-lambda-powertools/logger';

// Mock dependencies
jest.mock('@aws-lambda-powertools/logger');
jest.mock('@medical-appointment/core-use-cases');
jest.mock('@medical-appointment/infrastructure');

describe(DependencyFactory.name, () => {
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Clear singleton instance
    (DependencyFactory as any).instance = undefined;
    
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

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const factory1 = DependencyFactory.getInstance();
      const factory2 = DependencyFactory.getInstance();
      
      expect(factory1).toBe(factory2);
    });

    it('should create new instance on first call', () => {
      const factory = DependencyFactory.getInstance();
      
      expect(factory).toBeDefined();
      expect(factory).toBeInstanceOf(DependencyFactory);
    });
  });

  describe('createDependencies', () => {
    it('should create dependencies successfully', () => {
      const factory = DependencyFactory.getInstance();
      
      // Mock environment variables
      process.env.LOG_LEVEL = 'DEBUG';
      process.env.ENVIRONMENT = 'test';
      
      const dependencies = factory.createDependencies();
      
      expect(dependencies).toBeDefined();
      expect(Logger).toHaveBeenCalledWith({
        serviceName: 'medical-appointment-cl-processor',
        logLevel: 'DEBUG',
        environment: 'test'
      });
    });

    it('should use default values when environment variables are not set', () => {
      delete process.env.LOG_LEVEL;
      delete process.env.ENVIRONMENT;
      
      const factory = DependencyFactory.getInstance();
      const dependencies = factory.createDependencies();
      
      expect(dependencies).toBeDefined();
      expect(Logger).toHaveBeenCalledWith({
        serviceName: 'medical-appointment-cl-processor',
        logLevel: 'INFO',
        environment: 'development'
      });
    });

    it('should return cached dependencies on subsequent calls', () => {
      const factory = DependencyFactory.getInstance();
      
      const dependencies1 = factory.createDependencies();
      const dependencies2 = factory.createDependencies();
      
      expect(dependencies1).toBe(dependencies2);
    });

    it('should create logger with proper configuration', () => {
      process.env.LOG_LEVEL = 'WARN';
      process.env.ENVIRONMENT = 'production';
      
      const factory = DependencyFactory.getInstance();
      factory.createDependencies();
      
      expect(Logger).toHaveBeenCalledWith({
        serviceName: 'medical-appointment-cl-processor',
        logLevel: 'WARN',
        environment: 'production'
      });
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      // Clear previous mocks to isolate error tests
      jest.clearAllMocks();
    });

    it('should handle dependency creation errors gracefully', () => {
      const mockUseCaseFactory = require('@medical-appointment/infrastructure');
      mockUseCaseFactory.UseCaseFactory = {
        getAppointmentRepository: jest.fn().mockImplementation(() => {
          throw new Error('Repository creation failed');
        }),
        createProcessAppointmentUseCase: jest.fn()
      };

      const factory = DependencyFactory.getInstance();
      
      expect(() => factory.createDependencies()).toThrow('Repository creation failed');
    });

    it('should handle logger creation errors', () => {
      // Reset DependencyFactory to allow new error case
      (DependencyFactory as any).instance = null;
      (DependencyFactory as any).dependencies = null;
      
      (Logger as any).mockImplementation(() => {
        throw new Error('Logger creation failed');
      });

      const factory = DependencyFactory.getInstance();
      
      expect(() => factory.createDependencies()).toThrow('Logger creation failed');
    });
  });

  describe('singleton behavior', () => {
    beforeEach(() => {
      // Reset factory for clean state
      (DependencyFactory as any).instance = null;
      (DependencyFactory as any).dependencies = null;
      jest.clearAllMocks();
      
      // Setup successful mocks
      const mockUseCaseFactory = require('@medical-appointment/infrastructure');
      mockUseCaseFactory.UseCaseFactory = {
        getAppointmentRepository: jest.fn().mockReturnValue({}),
        createProcessAppointmentUseCase: jest.fn().mockReturnValue({})
      };
    });

    it('should maintain same dependencies across multiple getInstance calls', () => {
      const factory1 = DependencyFactory.getInstance();
      const dependencies1 = factory1.createDependencies();
      
      const factory2 = DependencyFactory.getInstance();
      const dependencies2 = factory2.createDependencies();
      
      expect(factory1).toBe(factory2);
      expect(dependencies1).toBe(dependencies2);
    });

    it('should not recreate dependencies unnecessarily', () => {
      const factory = DependencyFactory.getInstance();
      
      // Call createDependencies multiple times
      factory.createDependencies();
      factory.createDependencies();
      factory.createDependencies();
      
      // Logger should only be created once
      expect(Logger).toHaveBeenCalledTimes(1);
    });
  });

  describe('environment configuration', () => {
    it('should handle various log levels', () => {
      const logLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
      
      logLevels.forEach(level => {
        // Reset factory for each test
        (DependencyFactory as any).instance = undefined;
        process.env.LOG_LEVEL = level;
        
        const factory = DependencyFactory.getInstance();
        factory.createDependencies();
        
        expect(Logger).toHaveBeenCalledWith(
          expect.objectContaining({
            logLevel: level
          })
        );
        
        jest.clearAllMocks();
      });
    });

    it('should handle various environments', () => {
      const environments = ['development', 'staging', 'production'];
      
      environments.forEach(env => {
        // Reset factory for each test
        (DependencyFactory as any).instance = undefined;
        process.env.ENVIRONMENT = env;
        
        const factory = DependencyFactory.getInstance();
        factory.createDependencies();
        
        expect(Logger).toHaveBeenCalledWith(
          expect.objectContaining({
            environment: env
          })
        );
        
        jest.clearAllMocks();
      });
    });

    it('should handle missing environment variables gracefully', () => {
      delete process.env.LOG_LEVEL;
      delete process.env.ENVIRONMENT;
      delete process.env.NODE_ENV;
      
      const factory = DependencyFactory.getInstance();
      
      expect(() => factory.createDependencies()).not.toThrow();
    });
  });
});
