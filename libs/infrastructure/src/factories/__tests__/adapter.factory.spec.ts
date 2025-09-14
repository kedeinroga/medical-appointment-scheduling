import { AdapterFactory } from '../adapter.factory';
import { CountryISO } from '../../../../core/domain/src/value-objects/country-iso.vo';
import { clearSingletonInstances } from '../../../../../libs/shared/src/decorators/singleton/singleton.decorators';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  }))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockImplementation(() => ({
      send: jest.fn()
    }))
  }
}));

jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  }))
}));

jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  }))
}));

jest.mock('@aws-sdk/client-eventbridge', () => ({
  EventBridgeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  }))
}));

jest.mock('mysql2/promise', () => ({
  createPool: jest.fn().mockImplementation(() => ({
    getConnection: jest.fn(),
    execute: jest.fn(),
    query: jest.fn(),
    end: jest.fn()
  }))
}));

describe(AdapterFactory.name, () => {
  beforeEach(() => {
    AdapterFactory.reset();
    clearSingletonInstances(); // Clear singleton instances between tests
  });

  afterEach(() => {
    AdapterFactory.reset();
  });

  describe('createAppointmentRepository', () => {
    it('should create a DynamoDB appointment repository instance', () => {
      const repository = AdapterFactory.createAppointmentRepository();
      
      expect(repository).toBeDefined();
      expect(repository.constructor.name).toBe('DynamoDBAppointmentRepository');
    });

    it('should return the same instance on subsequent calls (singleton)', () => {
      const repository1 = AdapterFactory.createAppointmentRepository();
      const repository2 = AdapterFactory.createAppointmentRepository();
      
      expect(repository1).toBe(repository2);
    });
  });

  describe('createMySQLAppointmentRepository', () => {
    it('should create a MySQL appointment repository instance', () => {
      const repository = AdapterFactory.createMySQLAppointmentRepository();
      
      expect(repository).toBeDefined();
      expect(repository.constructor.name).toBe('MySQLAppointmentRepository');
    });

    it('should return the same instance on subsequent calls (singleton)', () => {
      const repository1 = AdapterFactory.createMySQLAppointmentRepository();
      const repository2 = AdapterFactory.createMySQLAppointmentRepository();
      
      expect(repository1).toBe(repository2);
    });
  });

  describe('createScheduleRepository', () => {
    it('should create a MySQL schedule repository instance without country', () => {
      const repository = AdapterFactory.createScheduleRepository();
      
      expect(repository).toBeDefined();
      expect(repository.constructor.name).toBe('MySQLScheduleRepository');
    });

    it('should create a MySQL schedule repository instance with country', () => {
      const repository = AdapterFactory.createScheduleRepository('PE');
      
      expect(repository).toBeDefined();
      expect(repository.constructor.name).toBe('MySQLScheduleRepository');
    });

    it('should return same singleton instance for all countries (decorator pattern)', () => {
      const repositoryPE = AdapterFactory.createScheduleRepository('PE');
      const repositoryCL = AdapterFactory.createScheduleRepository('CL');
      
      // With @Singleton decorator, all instances of the same class are the same
      expect(repositoryPE).toBe(repositoryCL);
    });

    it('should return the same instance for the same country (singleton per country)', () => {
      const repository1 = AdapterFactory.createScheduleRepository('PE');
      const repository2 = AdapterFactory.createScheduleRepository('PE');
      
      expect(repository1).toBe(repository2);
    });
  });

  describe('createSNSAdapter', () => {
    it('should create an SNS adapter instance', () => {
      const adapter = AdapterFactory.createSNSAdapter();
      
      expect(adapter).toBeDefined();
      expect(adapter.constructor.name).toBe('SNSAdapter');
    });

    it('should return the same instance on subsequent calls (singleton)', () => {
      const adapter1 = AdapterFactory.createSNSAdapter();
      const adapter2 = AdapterFactory.createSNSAdapter();
      
      expect(adapter1).toBe(adapter2);
    });
  });

  describe('createSQSAdapter', () => {
    it('should create an SQS adapter instance', () => {
      const adapter = AdapterFactory.createSQSAdapter();
      
      expect(adapter).toBeDefined();
      expect(adapter.constructor.name).toBe('SQSAdapter');
    });

    it('should return the same instance on subsequent calls (singleton)', () => {
      const adapter1 = AdapterFactory.createSQSAdapter();
      const adapter2 = AdapterFactory.createSQSAdapter();
      
      expect(adapter1).toBe(adapter2);
    });
  });

  describe('createEventBridgeAdapter', () => {
    it('should create an EventBridge adapter instance', () => {
      const adapter = AdapterFactory.createEventBridgeAdapter();
      
      expect(adapter).toBeDefined();
      expect(adapter.constructor.name).toBe('EventBridgeAdapter');
    });

    it('should return the same instance on subsequent calls (singleton)', () => {
      const adapter1 = AdapterFactory.createEventBridgeAdapter();
      const adapter2 = AdapterFactory.createEventBridgeAdapter();
      
      expect(adapter1).toBe(adapter2);
    });
  });

  describe('createCountryProcessingAdapters', () => {
    it('should create all adapters needed for country processing with PE', () => {
      const adapters = AdapterFactory.createCountryProcessingAdapters(CountryISO.PERU);
      
      expect(adapters.appointmentRepository).toBeDefined();
      expect(adapters.eventBridgeAdapter).toBeDefined();
      expect(adapters.scheduleRepository).toBeDefined();
      expect(adapters.sqsAdapter).toBeDefined();
      
      expect(adapters.appointmentRepository.constructor.name).toBe('MySQLAppointmentRepository');
      expect(adapters.eventBridgeAdapter.constructor.name).toBe('EventBridgeAdapter');
      expect(adapters.scheduleRepository.constructor.name).toBe('MySQLScheduleRepository');
      expect(adapters.sqsAdapter.constructor.name).toBe('SQSAdapter');
    });

    it('should create all adapters needed for country processing with CL', () => {
      const adapters = AdapterFactory.createCountryProcessingAdapters(CountryISO.CHILE);
      
      expect(adapters.appointmentRepository).toBeDefined();
      expect(adapters.eventBridgeAdapter).toBeDefined();
      expect(adapters.scheduleRepository).toBeDefined();
      expect(adapters.sqsAdapter).toBeDefined();
    });
  });

  describe('createMessagingAdapters', () => {
    it('should create all messaging adapters', () => {
      const adapters = AdapterFactory.createMessagingAdapters();
      
      expect(adapters.eventBridgeAdapter).toBeDefined();
      expect(adapters.snsAdapter).toBeDefined();
      expect(adapters.sqsAdapter).toBeDefined();
      
      expect(adapters.eventBridgeAdapter.constructor.name).toBe('EventBridgeAdapter');
      expect(adapters.snsAdapter.constructor.name).toBe('SNSAdapter');
      expect(adapters.sqsAdapter.constructor.name).toBe('SQSAdapter');
    });

    it('should return singleton instances for messaging adapters', () => {
      const adapters1 = AdapterFactory.createMessagingAdapters();
      const adapters2 = AdapterFactory.createMessagingAdapters();
      
      expect(adapters1.eventBridgeAdapter).toBe(adapters2.eventBridgeAdapter);
      expect(adapters1.snsAdapter).toBe(adapters2.snsAdapter);
      expect(adapters1.sqsAdapter).toBe(adapters2.sqsAdapter);
    });
  });

  describe('createRepositoryAdapters', () => {
    it('should create all repository adapters without country', () => {
      const adapters = AdapterFactory.createRepositoryAdapters();
      
      expect(adapters.appointmentRepository).toBeDefined();
      expect(adapters.mysqlAppointmentRepository).toBeDefined();
      expect(adapters.scheduleRepository).toBeDefined();
      
      expect(adapters.appointmentRepository.constructor.name).toBe('DynamoDBAppointmentRepository');
      expect(adapters.mysqlAppointmentRepository.constructor.name).toBe('MySQLAppointmentRepository');
      expect(adapters.scheduleRepository.constructor.name).toBe('MySQLScheduleRepository');
    });

    it('should create all repository adapters with country', () => {
      const adapters = AdapterFactory.createRepositoryAdapters('PE');
      
      expect(adapters.appointmentRepository).toBeDefined();
      expect(adapters.mysqlAppointmentRepository).toBeDefined();
      expect(adapters.scheduleRepository).toBeDefined();
    });

    it('should return singleton instances for repository adapters', () => {
      const adapters1 = AdapterFactory.createRepositoryAdapters();
      const adapters2 = AdapterFactory.createRepositoryAdapters();
      
      expect(adapters1.appointmentRepository).toBe(adapters2.appointmentRepository);
      expect(adapters1.mysqlAppointmentRepository).toBe(adapters2.mysqlAppointmentRepository);
      expect(adapters1.scheduleRepository).toBe(adapters2.scheduleRepository);
    });
  });

  describe('reset', () => {
    it('should clear all adapter instances', () => {
      // Create some instances
      AdapterFactory.createAppointmentRepository();
      AdapterFactory.createSNSAdapter();
      AdapterFactory.createEventBridgeAdapter();
      
      expect(AdapterFactory.getInstances().size).toBeGreaterThan(0);
      
      // Reset
      AdapterFactory.reset();
      
      expect(AdapterFactory.getInstances().size).toBe(0);
    });

    it('should create new instances after reset (with singleton clearing)', () => {
      const adapter1 = AdapterFactory.createSNSAdapter();
      
      AdapterFactory.reset();
      clearSingletonInstances(); // Also clear singleton instances
      
      const adapter2 = AdapterFactory.createSNSAdapter();
      
      expect(adapter1).not.toBe(adapter2);
    });
  });

  describe('getInstances', () => {
    it('should return empty map initially', () => {
      const instances = AdapterFactory.getInstances();
      
      expect(instances.size).toBe(0);
    });

    it('should return all created instances', () => {
      AdapterFactory.createAppointmentRepository();
      AdapterFactory.createSNSAdapter();
      AdapterFactory.createEventBridgeAdapter();
      
      const instances = AdapterFactory.getInstances();
      
      expect(instances.size).toBe(3);
      expect(instances.has('appointmentRepository')).toBe(true);
      expect(instances.has('snsAdapter')).toBe(true);
      expect(instances.has('eventBridgeAdapter')).toBe(true);
    });

    it('should return a copy of instances map', () => {
      AdapterFactory.createAppointmentRepository();
      
      const instances1 = AdapterFactory.getInstances();
      const instances2 = AdapterFactory.getInstances();
      
      expect(instances1).not.toBe(instances2);
      expect(instances1.size).toBe(instances2.size);
    });
  });
});
