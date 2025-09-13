import { UseCaseFactory } from '../use-case.factory';
import { 
  CreateAppointmentUseCase, 
  GetAppointmentsByInsuredIdUseCase,
  ProcessAppointmentUseCase,
  CompleteAppointmentUseCase 
} from '../../../../../libs/core/use-cases/src';
import { DynamoDBAppointmentRepository } from '../../adapters/repositories/dynamodb-appointment.repository';
import { MySQLAppointmentRepository } from '../../adapters/repositories/mysql-appointment.repository';
import { MySQLScheduleRepository } from '../../adapters/repositories/mysql-schedule.repository';
import { EventBridgeAdapter } from '../../adapters/messaging/eventbridge.adapter';
import { SNSAdapter } from '../../adapters/messaging/sns.adapter';
import { SQSAdapter } from '../../adapters/messaging/sqs.adapter';

// Mock all dependencies
jest.mock('../../../../../libs/core/use-cases/src');
jest.mock('../../adapters/repositories/dynamodb-appointment.repository');
jest.mock('../../adapters/repositories/mysql-appointment.repository');
jest.mock('../../adapters/repositories/mysql-schedule.repository');
jest.mock('../../adapters/messaging/eventbridge.adapter');
jest.mock('../../adapters/messaging/sns.adapter');
jest.mock('../../adapters/messaging/sqs.adapter');

describe('UseCaseFactory', () => {
  beforeEach(() => {
    // Reset factory state before each test
    UseCaseFactory.reset();
    jest.clearAllMocks();
  });

  describe('createCreateAppointmentUseCase', () => {
    it('should create CreateAppointmentUseCase with proper dependencies', () => {
      const mockUseCase = {} as CreateAppointmentUseCase;
      (CreateAppointmentUseCase as jest.Mock).mockReturnValue(mockUseCase);

      const result = UseCaseFactory.createCreateAppointmentUseCase();

      expect(CreateAppointmentUseCase).toHaveBeenCalledWith(
        expect.any(DynamoDBAppointmentRepository),
        expect.any(EventBridgeAdapter),
        expect.any(MySQLScheduleRepository)
      );
      expect(result).toBe(mockUseCase);
    });
  });

  describe('createGetAppointmentsByInsuredIdUseCase', () => {
    it('should create GetAppointmentsByInsuredIdUseCase with proper dependencies', () => {
      const mockUseCase = {} as GetAppointmentsByInsuredIdUseCase;
      (GetAppointmentsByInsuredIdUseCase as jest.Mock).mockReturnValue(mockUseCase);

      const result = UseCaseFactory.createGetAppointmentsByInsuredIdUseCase();

      expect(GetAppointmentsByInsuredIdUseCase).toHaveBeenCalledWith(
        expect.any(DynamoDBAppointmentRepository)
      );
      expect(result).toBe(mockUseCase);
    });
  });

  describe('createProcessAppointmentUseCase', () => {
    it('should create ProcessAppointmentUseCase with MySQL dependencies', () => {
      const mockUseCase = {} as ProcessAppointmentUseCase;
      (ProcessAppointmentUseCase as jest.Mock).mockReturnValue(mockUseCase);

      const result = UseCaseFactory.createProcessAppointmentUseCase();

      expect(ProcessAppointmentUseCase).toHaveBeenCalledWith(
        expect.any(MySQLAppointmentRepository),
        expect.any(EventBridgeAdapter),
        expect.any(MySQLScheduleRepository)
      );
      expect(result).toBe(mockUseCase);
    });
  });

  describe('createCompleteAppointmentUseCase', () => {
    it('should create CompleteAppointmentUseCase with proper dependencies', () => {
      const mockUseCase = {} as CompleteAppointmentUseCase;
      (CompleteAppointmentUseCase as jest.Mock).mockReturnValue(mockUseCase);

      const result = UseCaseFactory.createCompleteAppointmentUseCase();

      expect(CompleteAppointmentUseCase).toHaveBeenCalledWith(
        expect.any(DynamoDBAppointmentRepository),
        expect.any(EventBridgeAdapter)
      );
      expect(result).toBe(mockUseCase);
    });
  });

  describe('getAppointmentRepository', () => {
    it('should create and return DynamoDBAppointmentRepository instance', () => {
      const mockRepository = {} as DynamoDBAppointmentRepository;
      (DynamoDBAppointmentRepository as jest.Mock).mockReturnValue(mockRepository);

      const result = UseCaseFactory.getAppointmentRepository();

      expect(DynamoDBAppointmentRepository).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockRepository);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const mockRepository = {} as DynamoDBAppointmentRepository;
      (DynamoDBAppointmentRepository as jest.Mock).mockReturnValue(mockRepository);

      const result1 = UseCaseFactory.getAppointmentRepository();
      const result2 = UseCaseFactory.getAppointmentRepository();

      expect(DynamoDBAppointmentRepository).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
      expect(result1).toBe(mockRepository);
    });
  });

  describe('getMySQLAppointmentRepository', () => {
    it('should create and return MySQLAppointmentRepository instance', () => {
      const mockRepository = {} as MySQLAppointmentRepository;
      (MySQLAppointmentRepository as jest.Mock).mockReturnValue(mockRepository);

      const result = UseCaseFactory.getMySQLAppointmentRepository();

      expect(MySQLAppointmentRepository).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockRepository);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const mockRepository = {} as MySQLAppointmentRepository;
      (MySQLAppointmentRepository as jest.Mock).mockReturnValue(mockRepository);

      const result1 = UseCaseFactory.getMySQLAppointmentRepository();
      const result2 = UseCaseFactory.getMySQLAppointmentRepository();

      expect(MySQLAppointmentRepository).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
      expect(result1).toBe(mockRepository);
    });
  });

  describe('getScheduleRepository', () => {
    it('should create and return MySQLScheduleRepository instance', () => {
      const mockRepository = {} as MySQLScheduleRepository;
      (MySQLScheduleRepository as jest.Mock).mockReturnValue(mockRepository);

      const result = UseCaseFactory.getScheduleRepository();

      expect(MySQLScheduleRepository).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockRepository);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const mockRepository = {} as MySQLScheduleRepository;
      (MySQLScheduleRepository as jest.Mock).mockReturnValue(mockRepository);

      const result1 = UseCaseFactory.getScheduleRepository();
      const result2 = UseCaseFactory.getScheduleRepository();

      expect(MySQLScheduleRepository).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
      expect(result1).toBe(mockRepository);
    });
  });

  describe('getSNSAdapter', () => {
    it('should create and return SNSAdapter instance', () => {
      const mockAdapter = {} as SNSAdapter;
      (SNSAdapter as jest.Mock).mockReturnValue(mockAdapter);

      const result = UseCaseFactory.getSNSAdapter();

      expect(SNSAdapter).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockAdapter);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const mockAdapter = {} as SNSAdapter;
      (SNSAdapter as jest.Mock).mockReturnValue(mockAdapter);

      const result1 = UseCaseFactory.getSNSAdapter();
      const result2 = UseCaseFactory.getSNSAdapter();

      expect(SNSAdapter).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
      expect(result1).toBe(mockAdapter);
    });
  });

  describe('getSQSAdapter', () => {
    it('should create and return SQSAdapter instance', () => {
      const mockAdapter = {} as SQSAdapter;
      (SQSAdapter as jest.Mock).mockReturnValue(mockAdapter);

      const result = UseCaseFactory.getSQSAdapter();

      expect(SQSAdapter).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockAdapter);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const mockAdapter = {} as SQSAdapter;
      (SQSAdapter as jest.Mock).mockReturnValue(mockAdapter);

      const result1 = UseCaseFactory.getSQSAdapter();
      const result2 = UseCaseFactory.getSQSAdapter();

      expect(SQSAdapter).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
      expect(result1).toBe(mockAdapter);
    });
  });

  describe('getEventBridgeAdapter', () => {
    it('should create and return EventBridgeAdapter instance', () => {
      const mockAdapter = {} as EventBridgeAdapter;
      (EventBridgeAdapter as jest.Mock).mockReturnValue(mockAdapter);

      const result = UseCaseFactory.getEventBridgeAdapter();

      expect(EventBridgeAdapter).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockAdapter);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const mockAdapter = {} as EventBridgeAdapter;
      (EventBridgeAdapter as jest.Mock).mockReturnValue(mockAdapter);

      const result1 = UseCaseFactory.getEventBridgeAdapter();
      const result2 = UseCaseFactory.getEventBridgeAdapter();

      expect(EventBridgeAdapter).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
      expect(result1).toBe(mockAdapter);
    });
  });

  describe('reset', () => {
    it('should reset all singleton instances', () => {
      // First, create instances
      const mockDynamoRepo = {} as DynamoDBAppointmentRepository;
      const mockMySQLRepo = {} as MySQLAppointmentRepository;
      const mockScheduleRepo = {} as MySQLScheduleRepository;
      const mockSNS = {} as SNSAdapter;
      const mockSQS = {} as SQSAdapter;
      const mockEventBridge = {} as EventBridgeAdapter;

      (DynamoDBAppointmentRepository as jest.Mock).mockReturnValue(mockDynamoRepo);
      (MySQLAppointmentRepository as jest.Mock).mockReturnValue(mockMySQLRepo);
      (MySQLScheduleRepository as jest.Mock).mockReturnValue(mockScheduleRepo);
      (SNSAdapter as jest.Mock).mockReturnValue(mockSNS);
      (SQSAdapter as jest.Mock).mockReturnValue(mockSQS);
      (EventBridgeAdapter as jest.Mock).mockReturnValue(mockEventBridge);

      // Create instances
      UseCaseFactory.getAppointmentRepository();
      UseCaseFactory.getMySQLAppointmentRepository();
      UseCaseFactory.getScheduleRepository();
      UseCaseFactory.getSNSAdapter();
      UseCaseFactory.getSQSAdapter();
      UseCaseFactory.getEventBridgeAdapter();

      // Clear mock calls from initial creation
      jest.clearAllMocks();

      // Reset factory
      UseCaseFactory.reset();

      // Create instances again - should create new ones
      UseCaseFactory.getAppointmentRepository();
      UseCaseFactory.getMySQLAppointmentRepository();
      UseCaseFactory.getScheduleRepository();
      UseCaseFactory.getSNSAdapter();
      UseCaseFactory.getSQSAdapter();
      UseCaseFactory.getEventBridgeAdapter();

      // Verify new instances were created
      expect(DynamoDBAppointmentRepository).toHaveBeenCalledTimes(1);
      expect(MySQLAppointmentRepository).toHaveBeenCalledTimes(1);
      expect(MySQLScheduleRepository).toHaveBeenCalledTimes(1);
      expect(SNSAdapter).toHaveBeenCalledTimes(1);
      expect(SQSAdapter).toHaveBeenCalledTimes(1);
      expect(EventBridgeAdapter).toHaveBeenCalledTimes(1);
    });
  });

  describe('integration behavior', () => {
    it('should use same repository instances across different use case creations', () => {
      const mockDynamoRepo = {} as DynamoDBAppointmentRepository;
      const mockMySQLRepo = {} as MySQLAppointmentRepository;
      const mockScheduleRepo = {} as MySQLScheduleRepository;
      const mockEventBridge = {} as EventBridgeAdapter;
      const mockCreateUseCase = {} as CreateAppointmentUseCase;
      const mockGetUseCase = {} as GetAppointmentsByInsuredIdUseCase;
      const mockProcessUseCase = {} as ProcessAppointmentUseCase;
      const mockCompleteUseCase = {} as CompleteAppointmentUseCase;

      (DynamoDBAppointmentRepository as jest.Mock).mockReturnValue(mockDynamoRepo);
      (MySQLAppointmentRepository as jest.Mock).mockReturnValue(mockMySQLRepo);
      (MySQLScheduleRepository as jest.Mock).mockReturnValue(mockScheduleRepo);
      (EventBridgeAdapter as jest.Mock).mockReturnValue(mockEventBridge);
      (CreateAppointmentUseCase as jest.Mock).mockReturnValue(mockCreateUseCase);
      (GetAppointmentsByInsuredIdUseCase as jest.Mock).mockReturnValue(mockGetUseCase);
      (ProcessAppointmentUseCase as jest.Mock).mockReturnValue(mockProcessUseCase);
      (CompleteAppointmentUseCase as jest.Mock).mockReturnValue(mockCompleteUseCase);

      // Create multiple use cases
      const createUseCase = UseCaseFactory.createCreateAppointmentUseCase();
      const getUseCase = UseCaseFactory.createGetAppointmentsByInsuredIdUseCase();
      const processUseCase = UseCaseFactory.createProcessAppointmentUseCase();
      const completeUseCase = UseCaseFactory.createCompleteAppointmentUseCase();

      // Verify singleton behavior - repositories should be created only once
      expect(DynamoDBAppointmentRepository).toHaveBeenCalledTimes(1);
      expect(MySQLAppointmentRepository).toHaveBeenCalledTimes(1);
      expect(MySQLScheduleRepository).toHaveBeenCalledTimes(1);
      expect(EventBridgeAdapter).toHaveBeenCalledTimes(1);

      // Verify use cases were created
      expect(CreateAppointmentUseCase).toHaveBeenCalledTimes(1);
      expect(GetAppointmentsByInsuredIdUseCase).toHaveBeenCalledTimes(1);
      expect(ProcessAppointmentUseCase).toHaveBeenCalledTimes(1);
      expect(CompleteAppointmentUseCase).toHaveBeenCalledTimes(1);

      expect(createUseCase).toBe(mockCreateUseCase);
      expect(getUseCase).toBe(mockGetUseCase);
      expect(processUseCase).toBe(mockProcessUseCase);
      expect(completeUseCase).toBe(mockCompleteUseCase);
    });

    it('should properly inject dependencies for CreateAppointmentUseCase', () => {
      const mockCreateUseCase = {} as CreateAppointmentUseCase;
      (CreateAppointmentUseCase as jest.Mock).mockReturnValue(mockCreateUseCase);

      UseCaseFactory.createCreateAppointmentUseCase();

      expect(CreateAppointmentUseCase).toHaveBeenCalledWith(
        {},
        {},
        {}
      );
    });

    it('should properly inject dependencies for ProcessAppointmentUseCase', () => {
      const mockProcessUseCase = {} as ProcessAppointmentUseCase;
      (ProcessAppointmentUseCase as jest.Mock).mockReturnValue(mockProcessUseCase);

      UseCaseFactory.createProcessAppointmentUseCase();

      expect(ProcessAppointmentUseCase).toHaveBeenCalledWith(
        {},
        {},
        {}
      );
    });

    it('should allow independent access to adapters', () => {
      const mockSNS = {} as SNSAdapter;
      const mockSQS = {} as SQSAdapter;
      const mockEventBridge = {} as EventBridgeAdapter;

      (SNSAdapter as jest.Mock).mockReturnValue(mockSNS);
      (SQSAdapter as jest.Mock).mockReturnValue(mockSQS);
      (EventBridgeAdapter as jest.Mock).mockReturnValue(mockEventBridge);

      const snsAdapter = UseCaseFactory.getSNSAdapter();
      const sqsAdapter = UseCaseFactory.getSQSAdapter();
      const eventBridgeAdapter = UseCaseFactory.getEventBridgeAdapter();

      expect(snsAdapter).toBe(mockSNS);
      expect(sqsAdapter).toBe(mockSQS);
      expect(eventBridgeAdapter).toBe(mockEventBridge);

      expect(SNSAdapter).toHaveBeenCalledTimes(1);
      expect(SQSAdapter).toHaveBeenCalledTimes(1);
      expect(EventBridgeAdapter).toHaveBeenCalledTimes(1);
    });
  });
});
