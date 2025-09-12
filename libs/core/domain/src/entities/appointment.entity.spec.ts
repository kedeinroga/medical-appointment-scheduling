import { Appointment } from './appointment.entity';
import { Insured } from './insured.entity';
import { Schedule } from './schedule.entity';
import { AppointmentStatus } from '../value-objects/appointment-status.vo';
import { CountryISO } from '../value-objects/country-iso.vo';
import { InsuredId } from '../value-objects/insured-id.vo';

describe('Appointment', () => {
  const createValidInsured = () => {
    return Insured.fromPrimitives({
      countryISO: 'PE',
      insuredId: '12345'
    });
  };

  const createValidSchedule = () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    
    return Schedule.create({
      centerId: 1,
      date: futureDate,
      medicId: 1,
      scheduleId: 100,
      specialtyId: 1
    });
  };

  describe('create', () => {
    it('should create new appointment with pending status', () => {
      // Arrange
      const insured = createValidInsured();
      const schedule = createValidSchedule();

      // Act
      const appointment = Appointment.create({
        insured,
        schedule
      });

      // Assert
      expect(appointment).toBeInstanceOf(Appointment);
      expect(appointment.getStatus().isPending()).toBe(true);
      expect(appointment.getInsured()).toBe(insured);
      expect(appointment.getSchedule()).toBe(schedule);
      expect(appointment.getProcessedAt()).toBeNull();
      expect(appointment.getCreatedAt()).toBeInstanceOf(Date);
      expect(appointment.getUpdatedAt()).toBeInstanceOf(Date);
    });
  });

  describe('markAsProcessed', () => {
    it('should mark pending appointment as processed', () => {
      // Arrange
      const appointment = Appointment.create({
        insured: createValidInsured(),
        schedule: createValidSchedule()
      });

      // Act
      appointment.markAsProcessed();

      // Assert
      expect(appointment.getStatus().isProcessed()).toBe(true);
      expect(appointment.getProcessedAt()).toBeInstanceOf(Date);
    });

    it('should throw error when trying to process non-pending appointment', () => {
      // Arrange
      const appointment = Appointment.create({
        insured: createValidInsured(),
        schedule: createValidSchedule()
      });
      appointment.markAsProcessed();

      // Act & Assert
      expect(() => appointment.markAsProcessed()).toThrow(
        'Only pending appointments can be marked as processed'
      );
    });
  });

  describe('markAsCompleted', () => {
    it('should mark processed appointment as completed', () => {
      // Arrange
      const appointment = Appointment.create({
        insured: createValidInsured(),
        schedule: createValidSchedule()
      });
      appointment.markAsProcessed();

      // Act
      appointment.markAsCompleted();

      // Assert
      expect(appointment.getStatus().isCompleted()).toBe(true);
    });

    it('should throw error when trying to complete non-processed appointment', () => {
      // Arrange
      const appointment = Appointment.create({
        insured: createValidInsured(),
        schedule: createValidSchedule()
      });

      // Act & Assert
      expect(() => appointment.markAsCompleted()).toThrow(
        'Only processed appointments can be marked as completed'
      );
    });
  });

  describe('toJSON', () => {
    it('should serialize appointment to JSON', () => {
      // Arrange
      const appointment = Appointment.create({
        insured: createValidInsured(),
        schedule: createValidSchedule()
      });

      // Act
      const json = appointment.toJSON();

      // Assert
      expect(json).toHaveProperty('appointmentId');
      expect(json).toHaveProperty('countryISO', 'PE');
      expect(json).toHaveProperty('insuredId', '12345');
      expect(json).toHaveProperty('status', 'pending');
      expect(json).toHaveProperty('schedule');
      expect(json.schedule).toHaveProperty('scheduleId', 100);
    });
  });

  describe('toLogSafeJSON', () => {
    it('should serialize appointment with masked insured ID', () => {
      // Arrange
      const appointment = Appointment.create({
        insured: createValidInsured(),
        schedule: createValidSchedule()
      });

      // Act
      const json = appointment.toLogSafeJSON();

      // Assert
      expect(json.insuredId).toBe('12***');
      expect(json.countryISO).toBe('PE');
    });

    it('should serialize processed appointment with processedAt in log safe format', () => {
      // Arrange
      const appointment = Appointment.create({
        insured: createValidInsured(),
        schedule: createValidSchedule()
      });
      appointment.markAsProcessed();

      // Act
      const json = appointment.toLogSafeJSON();

      // Assert
      expect(json.insuredId).toBe('12***');
      expect(json.processedAt).toBeDefined();
      expect(json.processedAt).not.toBeNull();
      expect(typeof json.processedAt).toBe('string');
    });
  });

  describe('fromPrimitives', () => {
    it('should create appointment from primitives', () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      
      const data = {
        appointmentId: '123e4567-e89b-12d3-a456-426614174000',
        countryISO: 'PE',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        insuredId: '12345',
        processedAt: new Date('2024-01-01T11:00:00Z'),
        schedule: {
          centerId: 1,
          date: futureDate,
          medicId: 1,
          scheduleId: 100,
          specialtyId: 1
        },
        status: 'processed',
        updatedAt: new Date('2024-01-01T11:30:00Z')
      };

      // Act
      const appointment = Appointment.fromPrimitives(data);

      // Assert
      expect(appointment.getAppointmentId().getValue()).toBe(data.appointmentId);
      expect(appointment.getCountryISO().getValue()).toBe('PE');
      expect(appointment.getInsuredId().getValue()).toBe('12345');
      expect(appointment.getStatus().getValue()).toBe('processed');
      expect(appointment.getCreatedAt()).toEqual(data.createdAt);
      expect(appointment.getProcessedAt()).toEqual(data.processedAt);
      expect(appointment.getUpdatedAt()).toEqual(data.updatedAt);
    });

    it('should create appointment from primitives without processedAt', () => {
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      
      const data = {
        appointmentId: '123e4567-e89b-12d3-a456-426614174000',
        countryISO: 'CL',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        insuredId: '67890',
        schedule: {
          centerId: 2,
          date: futureDate,
          medicId: 2,
          scheduleId: 200,
          specialtyId: 2
        },
        status: 'pending',
        updatedAt: new Date('2024-01-01T10:00:00Z')
      };

      // Act
      const appointment = Appointment.fromPrimitives(data);

      // Assert
      expect(appointment.getProcessedAt()).toBeNull();
      expect(appointment.getStatus().getValue()).toBe('pending');
    });
  });

  describe('getter methods', () => {
    it('should return copies of dates to prevent mutation', () => {
      // Arrange
      const appointment = Appointment.create({
        insured: createValidInsured(),
        schedule: createValidSchedule()
      });

      // Act
      const createdAt = appointment.getCreatedAt();
      const updatedAt = appointment.getUpdatedAt();
      
      createdAt.setDate(createdAt.getDate() + 1);
      updatedAt.setDate(updatedAt.getDate() + 1);

      // Assert - original dates should be unchanged
      expect(appointment.getCreatedAt()).not.toEqual(createdAt);
      expect(appointment.getUpdatedAt()).not.toEqual(updatedAt);
    });

    it('should return copy of processedAt when not null', () => {
      // Arrange
      const appointment = Appointment.create({
        insured: createValidInsured(),
        schedule: createValidSchedule()
      });
      appointment.markAsProcessed();

      // Act
      const processedAt = appointment.getProcessedAt()!;
      processedAt.setDate(processedAt.getDate() + 1);

      // Assert - original date should be unchanged
      expect(appointment.getProcessedAt()).not.toEqual(processedAt);
    });
  });

  describe('status checking methods', () => {
    it('should correctly identify pending status', () => {
      // Arrange
      const appointment = Appointment.create({
        insured: createValidInsured(),
        schedule: createValidSchedule()
      });

      // Act & Assert
      expect(appointment.isPending()).toBe(true);
      expect(appointment.isProcessed()).toBe(false);
      expect(appointment.isCompleted()).toBe(false);
    });

    it('should correctly identify processed status', () => {
      // Arrange
      const appointment = Appointment.create({
        insured: createValidInsured(),
        schedule: createValidSchedule()
      });
      appointment.markAsProcessed();

      // Act & Assert
      expect(appointment.isPending()).toBe(false);
      expect(appointment.isProcessed()).toBe(true);
      expect(appointment.isCompleted()).toBe(false);
    });

    it('should correctly identify completed status', () => {
      // Arrange
      const appointment = Appointment.create({
        insured: createValidInsured(),
        schedule: createValidSchedule()
      });
      appointment.markAsProcessed();
      appointment.markAsCompleted();

      // Act & Assert
      expect(appointment.isPending()).toBe(false);
      expect(appointment.isProcessed()).toBe(false);
      expect(appointment.isCompleted()).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for appointments with same ID', () => {
      // Arrange
      const insured = createValidInsured();
      const schedule = createValidSchedule();
      const appointment1 = Appointment.create({ insured, schedule });
      
      const appointment2 = Appointment.fromPrimitives({
        appointmentId: appointment1.getAppointmentId().getValue(),
        countryISO: 'PE',
        createdAt: new Date(),
        insuredId: '12345',
        schedule: {
          centerId: 1,
          date: schedule.getDate(),
          medicId: 1,
          scheduleId: 100,
          specialtyId: 1
        },
        status: 'pending',
        updatedAt: new Date()
      });

      // Act & Assert
      expect(appointment1.equals(appointment2)).toBe(true);
    });
  });
});
