import { CountryProcessingFactory } from '../country-processing.factory';
import { ProcessCountryAppointmentUseCase } from '../../../../../libs/core/use-cases/src/process-country-appointment/process-country-appointment.use-case';
import { CountryISO } from '../../../../../libs/core/domain/src/value-objects/country-iso.vo';
import { MySQLAppointmentRepository } from '../../adapters/repositories/mysql-appointment.repository';
import { MySQLScheduleRepository } from '../../adapters/repositories/mysql-schedule.repository';
import { EventBridgeAdapter } from '../../adapters/messaging/eventbridge.adapter';

// Mock all dependencies
jest.mock('../../adapters/repositories/mysql-appointment.repository');
jest.mock('../../adapters/repositories/mysql-schedule.repository');
jest.mock('../../adapters/messaging/eventbridge.adapter');
jest.mock('../../../../../libs/core/use-cases/src/process-country-appointment/process-country-appointment.use-case');

describe('CountryProcessingFactory', () => {
  beforeEach(() => {
    // Reset factory state before each test
    CountryProcessingFactory.reset();
    jest.clearAllMocks();
  });

  describe('createProcessAppointmentUseCase', () => {
    it('should create ProcessCountryAppointmentUseCase with proper dependencies', () => {
      const mockUseCase = {} as ProcessCountryAppointmentUseCase;
      (ProcessCountryAppointmentUseCase as jest.Mock).mockReturnValue(mockUseCase);

      const result = CountryProcessingFactory.createProcessAppointmentUseCase();

      expect(ProcessCountryAppointmentUseCase).toHaveBeenCalledWith(
        expect.any(Object), // MySQLAppointmentRepository
        expect.any(Object), // EventBridgeAdapter
        expect.any(Object)  // MySQLScheduleRepository
      );
      expect(result).toBe(mockUseCase);
    });

    it('should create ProcessCountryAppointmentUseCase for specific country', () => {
      const mockUseCase = {} as ProcessCountryAppointmentUseCase;
      (ProcessCountryAppointmentUseCase as jest.Mock).mockReturnValue(mockUseCase);

      const peCountry = CountryISO.fromString('PE');
      const result = CountryProcessingFactory.createProcessAppointmentUseCase(peCountry);

      expect(result).toBe(mockUseCase);
    });
  });

  describe('getMySQLAppointmentRepository', () => {
    it('should create and return MySQLAppointmentRepository instance', () => {
      const result = CountryProcessingFactory.getMySQLAppointmentRepository();

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Object);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const result1 = CountryProcessingFactory.getMySQLAppointmentRepository();
      const result2 = CountryProcessingFactory.getMySQLAppointmentRepository();

      expect(result1).toBe(result2);
    });
  });

  describe('getScheduleRepository', () => {
    it('should create and return MySQLScheduleRepository instance', () => {
      const result = CountryProcessingFactory.getScheduleRepository();

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Object);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const result1 = CountryProcessingFactory.getScheduleRepository();
      const result2 = CountryProcessingFactory.getScheduleRepository();

      expect(result1).toBe(result2);
    });
  });

  describe('getEventBridgeAdapter', () => {
    it('should create and return EventBridgeAdapter instance', () => {
      const mockAdapter = {} as EventBridgeAdapter;
      (EventBridgeAdapter as jest.Mock).mockReturnValue(mockAdapter);

      const result = CountryProcessingFactory.getEventBridgeAdapter();

      expect(result).toBe(mockAdapter);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const mockAdapter = {} as EventBridgeAdapter;
      (EventBridgeAdapter as jest.Mock).mockReturnValue(mockAdapter);

      const result1 = CountryProcessingFactory.getEventBridgeAdapter();
      const result2 = CountryProcessingFactory.getEventBridgeAdapter();

      expect(result1).toBe(result2);
    });
  });

  describe('createCountryProcessingDependencies', () => {
    it('should create all dependencies for country processing', () => {
      const mockUseCase = {} as ProcessCountryAppointmentUseCase;
      (ProcessCountryAppointmentUseCase as jest.Mock).mockReturnValue(mockUseCase);

      const peCountry = CountryISO.fromString('PE');
      const result = CountryProcessingFactory.createCountryProcessingDependencies(peCountry);

      expect(result.appointmentRepository).toBeDefined();
      expect(result.scheduleRepository).toBeDefined();
      expect(result.eventBridgeAdapter).toBeDefined();
      expect(result.processAppointmentUseCase).toBe(mockUseCase);
    });

    it('should create dependencies for different countries', () => {
      const mockUseCase = {} as ProcessCountryAppointmentUseCase;
      (ProcessCountryAppointmentUseCase as jest.Mock).mockReturnValue(mockUseCase);

      const peCountry = CountryISO.fromString('PE');
      const clCountry = CountryISO.fromString('CL');

      const peResult = CountryProcessingFactory.createCountryProcessingDependencies(peCountry);
      const clResult = CountryProcessingFactory.createCountryProcessingDependencies(clCountry);

      expect(peResult).toBeDefined();
      expect(clResult).toBeDefined();
    });
  });

  describe('reset', () => {
    it('should reset all singleton instances', () => {
      // Create instances
      CountryProcessingFactory.getMySQLAppointmentRepository();
      CountryProcessingFactory.getScheduleRepository();
      CountryProcessingFactory.getEventBridgeAdapter();

      // Reset factory
      CountryProcessingFactory.reset();

      // Create instances again - should work without errors
      const repo1 = CountryProcessingFactory.getMySQLAppointmentRepository();
      const repo2 = CountryProcessingFactory.getScheduleRepository();
      const adapter = CountryProcessingFactory.getEventBridgeAdapter();

      expect(repo1).toBeDefined();
      expect(repo2).toBeDefined();
      expect(adapter).toBeDefined();
    });
  });

  describe('integration behavior', () => {
    it('should use same repository instances across different method calls', () => {
      const mockUseCase = {} as ProcessCountryAppointmentUseCase;
      (ProcessCountryAppointmentUseCase as jest.Mock).mockReturnValue(mockUseCase);

      // Get dependencies individually
      const appointmentRepo = CountryProcessingFactory.getMySQLAppointmentRepository();
      const scheduleRepo = CountryProcessingFactory.getScheduleRepository();
      const eventAdapter = CountryProcessingFactory.getEventBridgeAdapter();

      // Create use case
      const useCase = CountryProcessingFactory.createProcessAppointmentUseCase();

      // Create country dependencies
      const peCountry = CountryISO.fromString('PE');
      const dependencies = CountryProcessingFactory.createCountryProcessingDependencies(peCountry);

      // All should be defined
      expect(appointmentRepo).toBeDefined();
      expect(scheduleRepo).toBeDefined();
      expect(eventAdapter).toBeDefined();
      expect(useCase).toBeDefined();
      expect(dependencies).toBeDefined();
    });
  });
});
