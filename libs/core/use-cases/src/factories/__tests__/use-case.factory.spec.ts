import { UseCaseFactory } from '../use-case.factory';
import { CreateAppointmentUseCase } from '../../create-appointment/create-appointment.use-case';
import { GetAppointmentsByInsuredIdUseCase } from '../../get-appointments/get-appointments.use-case';
import { ProcessAppointmentUseCase } from '../../process-appointment/process-appointment.use-case';
import { CompleteAppointmentUseCase } from '../../complete-appointment/complete-appointment.use-case';
import { IAppointmentRepository } from '../../../../domain/src/repositories/appointment.repository';
import { IScheduleRepository } from '../../../../domain/src/repositories/schedule.repository';
import { IMessagingPort } from '../../../../domain/src/ports/messaging.port';
import { IEventBus } from '../../../../domain/src/ports/event-bus.port';

// Mock the use cases
jest.mock('../../create-appointment/create-appointment.use-case');
jest.mock('../../get-appointments/get-appointments.use-case');
jest.mock('../../process-appointment/process-appointment.use-case');
jest.mock('../../complete-appointment/complete-appointment.use-case');

describe('UseCaseFactory', () => {
  let mockAppointmentRepository: jest.Mocked<IAppointmentRepository>;
  let mockScheduleRepository: jest.Mocked<IScheduleRepository>;
  let mockMessagingPort: jest.Mocked<IMessagingPort>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mocks for interfaces
    mockAppointmentRepository = {} as jest.Mocked<IAppointmentRepository>;
    mockScheduleRepository = {} as jest.Mocked<IScheduleRepository>;
    mockMessagingPort = {} as jest.Mocked<IMessagingPort>;
    mockEventBus = {} as jest.Mocked<IEventBus>;
  });

  describe('createCreateAppointmentUseCase', () => {
    it('should create CreateAppointmentUseCase with proper dependencies', () => {
      // Arrange
      const mockUseCase = {} as CreateAppointmentUseCase;
      (CreateAppointmentUseCase as jest.Mock).mockReturnValue(mockUseCase);

      // Act
      const result = UseCaseFactory.createCreateAppointmentUseCase(
        mockAppointmentRepository,
        mockMessagingPort,
        mockScheduleRepository
      );

      // Assert
      expect(CreateAppointmentUseCase).toHaveBeenCalledWith(
        mockAppointmentRepository,
        mockMessagingPort,
        mockScheduleRepository
      );
      expect(result).toBe(mockUseCase);
    });
  });

  describe('createGetAppointmentsByInsuredIdUseCase', () => {
    it('should create GetAppointmentsByInsuredIdUseCase with proper dependencies', () => {
      // Arrange
      const mockDynamoRepository = {} as IAppointmentRepository;
      const mockMySQLRepository = {} as IAppointmentRepository;
      const mockUseCase = {} as GetAppointmentsByInsuredIdUseCase;
      (GetAppointmentsByInsuredIdUseCase as jest.Mock).mockReturnValue(mockUseCase);

      // Act
      const result = UseCaseFactory.createGetAppointmentsByInsuredIdUseCase(
        mockDynamoRepository,
        mockMySQLRepository
      );

      // Assert
      expect(GetAppointmentsByInsuredIdUseCase).toHaveBeenCalledWith(
        mockDynamoRepository,
        mockMySQLRepository
      );
      expect(result).toBe(mockUseCase);
    });
  });

  describe('createProcessAppointmentUseCase', () => {
    it('should create ProcessAppointmentUseCase with proper dependencies', () => {
      // Arrange
      const mockUseCase = {} as ProcessAppointmentUseCase;
      (ProcessAppointmentUseCase as jest.Mock).mockReturnValue(mockUseCase);

      // Act
      const result = UseCaseFactory.createProcessAppointmentUseCase(
        mockAppointmentRepository,
        mockEventBus,
        mockScheduleRepository
      );

      // Assert
      expect(ProcessAppointmentUseCase).toHaveBeenCalledWith(
        mockAppointmentRepository,
        mockEventBus,
        mockScheduleRepository
      );
      expect(result).toBe(mockUseCase);
    });
  });

  describe('createCompleteAppointmentUseCase', () => {
    it('should create CompleteAppointmentUseCase with proper dependencies', () => {
      // Arrange
      const mockUseCase = {} as CompleteAppointmentUseCase;
      (CompleteAppointmentUseCase as jest.Mock).mockReturnValue(mockUseCase);

      // Act
      const result = UseCaseFactory.createCompleteAppointmentUseCase(
        mockAppointmentRepository,
        mockEventBus
      );

      // Assert
      expect(CompleteAppointmentUseCase).toHaveBeenCalledWith(
        mockAppointmentRepository,
        mockEventBus
      );
      expect(result).toBe(mockUseCase);
    });
  });

  describe('parameter validation', () => {
    it('should accept valid IAppointmentRepository interface', () => {
      // This test ensures that the factory accepts proper interface implementations
      const validRepository: IAppointmentRepository = {
        save: jest.fn(),
        update: jest.fn(),
        findByAppointmentId: jest.fn(),
        findByInsuredId: jest.fn()
      };

      expect(() => 
        UseCaseFactory.createCreateAppointmentUseCase(
          validRepository,
          mockMessagingPort,
          mockScheduleRepository
        )
      ).not.toThrow();
    });

    it('should accept valid IMessagingPort interface', () => {
      const validMessagingPort: IMessagingPort = {
        publishAppointmentCreated: jest.fn(),
        publishMessage: jest.fn(),
        publishToCountrySpecificTopic: jest.fn()
      };

      expect(() => 
        UseCaseFactory.createCreateAppointmentUseCase(
          mockAppointmentRepository,
          validMessagingPort,
          mockScheduleRepository
        )
      ).not.toThrow();
    });

    it('should accept valid IEventBus interface', () => {
      const validEventBus: IEventBus = {
        publish: jest.fn()
      };

      expect(() => 
        UseCaseFactory.createProcessAppointmentUseCase(
          mockAppointmentRepository,
          validEventBus,
          mockScheduleRepository
        )
      ).not.toThrow();
    });
  });
});
