import { CountryProcessingFactory } from '../country-processing.factory';
import { ProcessAppointmentUseCase } from '../../../../../libs/core/use-cases/src/process-appointment/process-appointment.use-case';
import { CountryISO } from '../../../../../libs/core/domain/src/value-objects/country-iso.vo';
import { MySQLAppointmentRepository } from '../../adapters/repositories/mysql-appointment.repository';
import { MySQLScheduleRepository } from '../../adapters/repositories/mysql-schedule.repository';
import { EventBridgeAdapter } from '../../adapters/messaging/eventbridge.adapter';

// Mock all dependencies
jest.mock('../../adapters/repositories/mysql-appointment.repository');
jest.mock('../../adapters/repositories/mysql-schedule.repository');
jest.mock('../../adapters/messaging/eventbridge.adapter');
jest.mock('../../../../../libs/core/use-cases/src/process-appointment/process-appointment.use-case');

describe('CountryProcessingFactory', () => {
  beforeEach(() => {
    // Reset factory state before each test
    CountryProcessingFactory.reset();
    jest.clearAllMocks();
  });

  describe('createProcessAppointmentUseCase', () => {
    it('should create ProcessAppointmentUseCase with proper dependencies', () => {
      const mockUseCase = {} as ProcessAppointmentUseCase;
      (ProcessAppointmentUseCase as jest.Mock).mockReturnValue(mockUseCase);

      const result = CountryProcessingFactory.createProcessAppointmentUseCase();

      expect(ProcessAppointmentUseCase).toHaveBeenCalledWith(
        expect.any(MySQLAppointmentRepository),
        expect.any(EventBridgeAdapter),
        expect.any(MySQLScheduleRepository)
      );
      expect(result).toBe(mockUseCase);
    });

    it('should create ProcessAppointmentUseCase with country ISO parameter', () => {
      const mockUseCase = {} as ProcessAppointmentUseCase;
      (ProcessAppointmentUseCase as jest.Mock).mockReturnValue(mockUseCase);
      const countryISO = CountryISO.fromString('CL');

      const result = CountryProcessingFactory.createProcessAppointmentUseCase(countryISO);

      expect(ProcessAppointmentUseCase).toHaveBeenCalledWith(
        expect.any(MySQLAppointmentRepository),
        expect.any(EventBridgeAdapter),
        expect.any(MySQLScheduleRepository)
      );
      expect(result).toBe(mockUseCase);
    });
  });

  describe('getMySQLAppointmentRepository', () => {
    it('should create and return MySQLAppointmentRepository instance', () => {
      const mockRepository = {} as MySQLAppointmentRepository;
      (MySQLAppointmentRepository as jest.Mock).mockReturnValue(mockRepository);

      const result = CountryProcessingFactory.getMySQLAppointmentRepository();

      expect(MySQLAppointmentRepository).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockRepository);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const mockRepository = {} as MySQLAppointmentRepository;
      (MySQLAppointmentRepository as jest.Mock).mockReturnValue(mockRepository);

      const result1 = CountryProcessingFactory.getMySQLAppointmentRepository();
      const result2 = CountryProcessingFactory.getMySQLAppointmentRepository();

      expect(MySQLAppointmentRepository).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
      expect(result1).toBe(mockRepository);
    });
  });

  describe('getScheduleRepository', () => {
    it('should create and return MySQLScheduleRepository instance', () => {
      const mockRepository = {} as MySQLScheduleRepository;
      (MySQLScheduleRepository as jest.Mock).mockReturnValue(mockRepository);

      const result = CountryProcessingFactory.getScheduleRepository();

      expect(MySQLScheduleRepository).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockRepository);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const mockRepository = {} as MySQLScheduleRepository;
      (MySQLScheduleRepository as jest.Mock).mockReturnValue(mockRepository);

      const result1 = CountryProcessingFactory.getScheduleRepository();
      const result2 = CountryProcessingFactory.getScheduleRepository();

      expect(MySQLScheduleRepository).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
      expect(result1).toBe(mockRepository);
    });
  });

  describe('getEventBridgeAdapter', () => {
    it('should create and return EventBridgeAdapter instance', () => {
      const mockAdapter = {} as EventBridgeAdapter;
      (EventBridgeAdapter as jest.Mock).mockReturnValue(mockAdapter);

      const result = CountryProcessingFactory.getEventBridgeAdapter();

      expect(EventBridgeAdapter).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockAdapter);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const mockAdapter = {} as EventBridgeAdapter;
      (EventBridgeAdapter as jest.Mock).mockReturnValue(mockAdapter);

      const result1 = CountryProcessingFactory.getEventBridgeAdapter();
      const result2 = CountryProcessingFactory.getEventBridgeAdapter();

      expect(EventBridgeAdapter).toHaveBeenCalledTimes(1);
      expect(result1).toBe(result2);
      expect(result1).toBe(mockAdapter);
    });
  });

  describe('createCountryProcessingDependencies', () => {
    it('should create all dependencies for country processing', () => {
      const mockAppointmentRepo = {} as MySQLAppointmentRepository;
      const mockScheduleRepo = {} as MySQLScheduleRepository;
      const mockEventBridge = {} as EventBridgeAdapter;
      const mockUseCase = {} as ProcessAppointmentUseCase;

      (MySQLAppointmentRepository as jest.Mock).mockReturnValue(mockAppointmentRepo);
      (MySQLScheduleRepository as jest.Mock).mockReturnValue(mockScheduleRepo);
      (EventBridgeAdapter as jest.Mock).mockReturnValue(mockEventBridge);
      (ProcessAppointmentUseCase as jest.Mock).mockReturnValue(mockUseCase);

      const countryISO = CountryISO.fromString('PE');
      const result = CountryProcessingFactory.createCountryProcessingDependencies(countryISO);

      expect(result).toEqual({
        appointmentRepository: mockAppointmentRepo,
        scheduleRepository: mockScheduleRepo,
        eventBridgeAdapter: mockEventBridge,
        processAppointmentUseCase: mockUseCase
      });
    });

    it('should create dependencies for different countries', () => {
      const mockAppointmentRepo = {} as MySQLAppointmentRepository;
      const mockScheduleRepo = {} as MySQLScheduleRepository;
      const mockEventBridge = {} as EventBridgeAdapter;
      const mockUseCase = {} as ProcessAppointmentUseCase;

      (MySQLAppointmentRepository as jest.Mock).mockReturnValue(mockAppointmentRepo);
      (MySQLScheduleRepository as jest.Mock).mockReturnValue(mockScheduleRepo);
      (EventBridgeAdapter as jest.Mock).mockReturnValue(mockEventBridge);
      (ProcessAppointmentUseCase as jest.Mock).mockReturnValue(mockUseCase);

      const countryCL = CountryISO.fromString('CL');
      const resultCL = CountryProcessingFactory.createCountryProcessingDependencies(countryCL);

      const countryPE = CountryISO.fromString('PE');
      const resultPE = CountryProcessingFactory.createCountryProcessingDependencies(countryPE);

      expect(resultCL.appointmentRepository).toBe(mockAppointmentRepo);
      expect(resultPE.appointmentRepository).toBe(mockAppointmentRepo);
      expect(resultCL.processAppointmentUseCase).toBe(mockUseCase);
      expect(resultPE.processAppointmentUseCase).toBe(mockUseCase);
    });
  });

  describe('reset', () => {
    it('should reset all singleton instances', () => {
      // First, create instances
      const mockAppointmentRepo = {} as MySQLAppointmentRepository;
      const mockScheduleRepo = {} as MySQLScheduleRepository;
      const mockEventBridge = {} as EventBridgeAdapter;

      (MySQLAppointmentRepository as jest.Mock).mockReturnValue(mockAppointmentRepo);
      (MySQLScheduleRepository as jest.Mock).mockReturnValue(mockScheduleRepo);
      (EventBridgeAdapter as jest.Mock).mockReturnValue(mockEventBridge);

      // Create instances
      CountryProcessingFactory.getMySQLAppointmentRepository();
      CountryProcessingFactory.getScheduleRepository();
      CountryProcessingFactory.getEventBridgeAdapter();

      // Clear mock calls from initial creation
      jest.clearAllMocks();

      // Reset factory
      CountryProcessingFactory.reset();

      // Create instances again - should create new ones
      CountryProcessingFactory.getMySQLAppointmentRepository();
      CountryProcessingFactory.getScheduleRepository();
      CountryProcessingFactory.getEventBridgeAdapter();

      // Verify new instances were created
      expect(MySQLAppointmentRepository).toHaveBeenCalledTimes(1);
      expect(MySQLScheduleRepository).toHaveBeenCalledTimes(1);
      expect(EventBridgeAdapter).toHaveBeenCalledTimes(1);
    });
  });

  describe('integration behavior', () => {
    it('should use same repository instances across different method calls', () => {
      const mockAppointmentRepo = {} as MySQLAppointmentRepository;
      const mockScheduleRepo = {} as MySQLScheduleRepository;
      const mockEventBridge = {} as EventBridgeAdapter;
      const mockUseCase = {} as ProcessAppointmentUseCase;

      (MySQLAppointmentRepository as jest.Mock).mockReturnValue(mockAppointmentRepo);
      (MySQLScheduleRepository as jest.Mock).mockReturnValue(mockScheduleRepo);
      (EventBridgeAdapter as jest.Mock).mockReturnValue(mockEventBridge);
      (ProcessAppointmentUseCase as jest.Mock).mockReturnValue(mockUseCase);

      // Create use case first
      const useCase = CountryProcessingFactory.createProcessAppointmentUseCase();
      
      // Get individual repositories
      const appointmentRepo = CountryProcessingFactory.getMySQLAppointmentRepository();
      const scheduleRepo = CountryProcessingFactory.getScheduleRepository();
      const eventBridge = CountryProcessingFactory.getEventBridgeAdapter();

      // All should be same instances (singleton behavior)
      expect(MySQLAppointmentRepository).toHaveBeenCalledTimes(1);
      expect(MySQLScheduleRepository).toHaveBeenCalledTimes(1);
      expect(EventBridgeAdapter).toHaveBeenCalledTimes(1);
      expect(ProcessAppointmentUseCase).toHaveBeenCalledTimes(1);

      expect(appointmentRepo).toBe(mockAppointmentRepo);
      expect(scheduleRepo).toBe(mockScheduleRepo);
      expect(eventBridge).toBe(mockEventBridge);
      expect(useCase).toBe(mockUseCase);
    });
  });
});
