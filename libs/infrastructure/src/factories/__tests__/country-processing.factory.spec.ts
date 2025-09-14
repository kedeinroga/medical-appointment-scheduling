import { CountryProcessingFactory } from '../country-processing.factory';
import { MySQLAppointmentRepository } from '../../adapters/repositories/mysql-appointment.repository';
import { MySQLScheduleRepository } from '../../adapters/repositories/mysql-schedule.repository';
import { EventBridgeAdapter } from '../../adapters/messaging/eventbridge.adapter';
import { CountryISO } from '../../../../../libs/core/domain/src/value-objects/country-iso.vo';
import { clearSingletonInstances } from '../../../../../libs/shared/src/decorators/singleton/singleton.decorators';

describe('CountryProcessingFactory', () => {
  beforeEach(() => {
    CountryProcessingFactory.reset();
    clearSingletonInstances(); // Clear singleton instances between tests
  });

  describe('getMySQLAppointmentRepository', () => {
    it('should create and return MySQLAppointmentRepository instance', () => {
      const result = CountryProcessingFactory.getMySQLAppointmentRepository();

      expect(result).toBeInstanceOf(MySQLAppointmentRepository);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const instance1 = CountryProcessingFactory.getMySQLAppointmentRepository();
      const instance2 = CountryProcessingFactory.getMySQLAppointmentRepository();

      expect(instance1).toBe(instance2);
    });
  });

  describe('getScheduleRepository', () => {
    it('should create and return MySQLScheduleRepository instance', () => {
      const result = CountryProcessingFactory.getScheduleRepository();

      expect(result).toBeInstanceOf(MySQLScheduleRepository);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const instance1 = CountryProcessingFactory.getScheduleRepository();
      const instance2 = CountryProcessingFactory.getScheduleRepository();

      expect(instance1).toBe(instance2);
    });
  });

  describe('getEventBridgeAdapter', () => {
    it('should create and return EventBridgeAdapter instance', () => {
      const result = CountryProcessingFactory.getEventBridgeAdapter();

      expect(result).toBeInstanceOf(EventBridgeAdapter);
    });

    it('should return same instance on subsequent calls (singleton)', () => {
      const instance1 = CountryProcessingFactory.getEventBridgeAdapter();
      const instance2 = CountryProcessingFactory.getEventBridgeAdapter();

      expect(instance1).toBe(instance2);
    });
  });

  describe('createCountryProcessingAdapters', () => {
    it('should create all adapters needed for country processing', () => {
      const peCountry = CountryISO.fromString('PE');
      const result = CountryProcessingFactory.createCountryProcessingAdapters(peCountry);

      expect(result.appointmentRepository).toBeDefined();
      expect(result.scheduleRepository).toBeDefined();
      expect(result.eventBridgeAdapter).toBeDefined();
      
      expect(result.appointmentRepository).toBeInstanceOf(MySQLAppointmentRepository);
      expect(result.scheduleRepository).toBeInstanceOf(MySQLScheduleRepository);
      expect(result.eventBridgeAdapter).toBeInstanceOf(EventBridgeAdapter);
    });

    it('should create adapters for different countries', () => {
      const peCountry = CountryISO.fromString('PE');
      const clCountry = CountryISO.fromString('CL');

      const peResult = CountryProcessingFactory.createCountryProcessingAdapters(peCountry);
      const clResult = CountryProcessingFactory.createCountryProcessingAdapters(clCountry);

      expect(peResult.appointmentRepository).toBeDefined();
      expect(clResult.appointmentRepository).toBeDefined();
      
      // Should use same instances (singleton behavior)
      expect(peResult.appointmentRepository).toBe(clResult.appointmentRepository);
      expect(peResult.scheduleRepository).toBe(clResult.scheduleRepository);
      expect(peResult.eventBridgeAdapter).toBe(clResult.eventBridgeAdapter);
    });
  });

  describe('reset', () => {
    it('should reset all singleton instances', () => {
      // Create instances
      const instance1 = CountryProcessingFactory.getMySQLAppointmentRepository();
      const instance2 = CountryProcessingFactory.getScheduleRepository();
      const instance3 = CountryProcessingFactory.getEventBridgeAdapter();

      // Reset both factory and singleton instances
      CountryProcessingFactory.reset();
      clearSingletonInstances(); // Clear singleton decorator instances

      // Create instances again - should create new ones
      const newInstance1 = CountryProcessingFactory.getMySQLAppointmentRepository();
      const newInstance2 = CountryProcessingFactory.getScheduleRepository();
      const newInstance3 = CountryProcessingFactory.getEventBridgeAdapter();

      // Should be different instances after reset
      expect(newInstance1).not.toBe(instance1);
      expect(newInstance2).not.toBe(instance2);
      expect(newInstance3).not.toBe(instance3);
    });
  });
});
