import { DependencyFactory, createHandlerDependencies, createHandlerConfig } from '../factory';

// Mock AWS Lambda Powertools Logger
jest.mock('@aws-lambda-powertools/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

// Mock infrastructure dependencies
jest.mock('@medical-appointment/infrastructure', () => ({
  InfrastructureBridgeFactory: {
    createProcessCountryAppointmentUseCase: jest.fn().mockReturnValue({
      execute: jest.fn()
    })
  },
  AdapterFactory: {
    createMySQLAppointmentRepository: jest.fn().mockReturnValue({
      save: jest.fn(),
      findById: jest.fn()
    })
  }
}));

// Mock domain
jest.mock('@medical-appointment/core-domain', () => ({
  CountryISO: {
    fromString: jest.fn().mockReturnValue({ value: 'CL' })
  }
}));

describe('DependencyFactory Extended Tests', () => {
  let factory: DependencyFactory;

  beforeEach(() => {
    // Reset environment variables
    delete process.env.LOG_LEVEL;
    delete process.env.ENVIRONMENT;
    delete process.env.BATCH_SIZE;
    delete process.env.MAX_RETRIES;
    delete process.env.PROCESSING_TIMEOUT;

    factory = DependencyFactory.getInstance();
    factory.reset();
    jest.clearAllMocks();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DependencyFactory.getInstance();
      const instance2 = DependencyFactory.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('createDependencies', () => {
    it('should return cached dependencies on subsequent calls', () => {
      const deps1 = factory.createDependencies();
      const deps2 = factory.createDependencies();
      
      expect(deps1).toBe(deps2);
    });

    it('should create dependencies with custom environment variables', () => {
      process.env.LOG_LEVEL = 'DEBUG';
      process.env.ENVIRONMENT = 'production';
      
      const dependencies = factory.createDependencies();
      
      expect(dependencies.processAppointmentUseCase).toBeDefined();
      expect(dependencies.appointmentRepository).toBeDefined();
      expect(dependencies.logger).toBeDefined();
    });
  });

  describe('createConfig', () => {
    it('should create config with default values', () => {
      const config = factory.createConfig();
      
      expect(config.targetCountry).toBe('CL');
      expect(config.batchSize).toBeDefined();
      expect(config.maxRetries).toBeDefined();
      expect(config.processingTimeout).toBeDefined();
    });

    it('should create config with environment variable overrides', () => {
      process.env.BATCH_SIZE = '50';
      process.env.MAX_RETRIES = '5';
      process.env.PROCESSING_TIMEOUT = '60000';
      
      const config = factory.createConfig();
      
      expect(config.batchSize).toBe(50);
      expect(config.maxRetries).toBe(5);
      expect(config.processingTimeout).toBe(60000);
    });
  });

  describe('createTestDependencies', () => {
    it('should create test dependencies with no overrides', () => {
      const testDeps = factory.createTestDependencies();
      
      expect(testDeps.processAppointmentUseCase).toBeDefined();
      expect(testDeps.appointmentRepository).toBeDefined();
      expect(testDeps.logger).toBeDefined();
    });

    it('should create test dependencies with overrides', () => {
      const mockUseCase = { execute: jest.fn() };
      const testDeps = factory.createTestDependencies({
        processAppointmentUseCase: mockUseCase as any
      });
      
      expect(testDeps.processAppointmentUseCase).toBe(mockUseCase);
      expect(testDeps.appointmentRepository).toBeDefined();
      expect(testDeps.logger).toBeDefined();
    });

    it('should override multiple dependencies', () => {
      const mockUseCase = { execute: jest.fn() };
      const mockRepository = { save: jest.fn() };
      const mockLogger = { info: jest.fn() };
      
      const testDeps = factory.createTestDependencies({
        processAppointmentUseCase: mockUseCase as any,
        appointmentRepository: mockRepository as any,
        logger: mockLogger as any
      });
      
      expect(testDeps.processAppointmentUseCase).toBe(mockUseCase);
      expect(testDeps.appointmentRepository).toBe(mockRepository);
      expect(testDeps.logger).toBe(mockLogger);
    });
  });

  describe('reset', () => {
    it('should reset dependencies and create new ones on next call', () => {
      const deps1 = factory.createDependencies();
      factory.reset();
      const deps2 = factory.createDependencies();
      
      expect(deps1).not.toBe(deps2);
    });
  });

  describe('convenience functions', () => {
    it('should create handler dependencies via convenience function', () => {
      const deps = createHandlerDependencies();
      
      expect(deps.processAppointmentUseCase).toBeDefined();
      expect(deps.appointmentRepository).toBeDefined();
      expect(deps.logger).toBeDefined();
    });

    it('should create handler config via convenience function', () => {
      const config = createHandlerConfig();
      
      expect(config.targetCountry).toBe('CL');
      expect(config.batchSize).toBeDefined();
      expect(config.maxRetries).toBeDefined();
      expect(config.processingTimeout).toBeDefined();
    });
  });
});
