import { AppointmentDomainService } from './appointment-domain.service';
import { Appointment } from '../entities/appointment.entity';
import { Insured } from '../entities/insured.entity';
import { Schedule } from '../entities/schedule.entity';
import { AppointmentCreatedEvent } from '../events/appointment-created.event';
import { AppointmentProcessedEvent } from '../events/appointment-processed.event';
import { AppointmentCompletedEvent } from '../events/appointment-completed.event';

describe('AppointmentDomainService', () => {
  let service: AppointmentDomainService;

  beforeEach(() => {
    service = new AppointmentDomainService();
  });

  const createValidInsured = () => {
    return Insured.fromPrimitives({
      countryISO: 'PE',
      insuredId: '12345'
    });
  };

  const createValidSchedule = () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    futureDate.setHours(10, 0, 0, 0); // 10 AM
    
    return Schedule.create({
      centerId: 1,
      date: futureDate,
      medicId: 1,
      scheduleId: 100,
      specialtyId: 1
    });
  };

  describe('createAppointment', () => {
    it('should create appointment and generate created event', () => {
      // Arrange
      const insured = createValidInsured();
      const schedule = createValidSchedule();

      // Act
      const result = service.createAppointment(insured, schedule);

      // Assert
      expect(result.appointment).toBeInstanceOf(Appointment);
      expect(result.appointment.getStatus().isPending()).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toBeInstanceOf(AppointmentCreatedEvent);
    });
  });

  describe('processAppointment', () => {
    it('should process appointment and generate processed event', () => {
      // Arrange
      const appointment = Appointment.create({
        insured: createValidInsured(),
        schedule: createValidSchedule()
      });

      // Act
      const result = service.processAppointment(appointment);

      // Assert
      expect(result.appointment.getStatus().isProcessed()).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toBeInstanceOf(AppointmentProcessedEvent);
    });
  });

  describe('completeAppointment', () => {
    it('should complete appointment and generate completed event', () => {
      // Arrange
      const appointment = Appointment.create({
        insured: createValidInsured(),
        schedule: createValidSchedule()
      });
      appointment.markAsProcessed();

      // Act
      const result = service.completeAppointment(appointment);

      // Assert
      expect(result.appointment.getStatus().isCompleted()).toBe(true);
      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toBeInstanceOf(AppointmentCompletedEvent);
    });
  });

  describe('validateAppointmentCreation', () => {
    it('should not throw error for valid appointment data', () => {
      // Arrange
      const insured = createValidInsured();
      const schedule = createValidSchedule();

      // Act & Assert
      expect(() => service.validateAppointmentCreation(insured, schedule)).not.toThrow();
    });

    it('should throw error for appointment with current time', () => {
      // Arrange
      const insured = createValidInsured();
      const currentDate = new Date();
      
      // Use a past date to ensure it's definitely in the past
      const pastDate = new Date(currentDate.getTime() - 1000); // 1 second ago
      
      // Act & Assert
      expect(() => {
        const schedule = Schedule.create({
          centerId: 1,
          date: pastDate,
          medicId: 1,
          scheduleId: 100,
          specialtyId: 1
        });
        service.validateAppointmentCreation(insured, schedule);
      }).toThrow('Schedule date cannot be in the past');
    });

    it('should throw error for past date', () => {
      // Arrange
      const insured = createValidInsured();
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      // Act & Assert
      expect(() => {
        const schedule = Schedule.create({
          centerId: 1,
          date: pastDate,
          medicId: 1,
          scheduleId: 100,
          specialtyId: 1
        });
        service.validateAppointmentCreation(insured, schedule);
      }).toThrow('Schedule date cannot be in the past');
    });

    it('should throw error for Peru appointment on Sunday', () => {
      // Arrange
      const insured = Insured.fromPrimitives({
        countryISO: 'PE',
        insuredId: '12345'
      });
      
      // Create a Sunday date
      const sundayDate = new Date();
      sundayDate.setDate(sundayDate.getDate() + (7 - sundayDate.getDay())); // Next Sunday
      
      const schedule = Schedule.create({
        centerId: 1,
        date: sundayDate,
        medicId: 1,
        scheduleId: 100,
        specialtyId: 1
      });

      // Act & Assert
      expect(() => service.validateAppointmentCreation(insured, schedule)).toThrow(
        'No appointments allowed on Sundays in Peru'
      );
    });

    it('should throw error for Chile appointment outside business hours', () => {
      // Arrange
      const insured = Insured.fromPrimitives({
        countryISO: 'CL',
        insuredId: '12345'
      });
      
      const earlyDate = new Date();
      earlyDate.setDate(earlyDate.getDate() + 1);
      earlyDate.setHours(6, 0, 0, 0); // 6 AM (outside business hours)
      
      const schedule = Schedule.create({
        centerId: 1,
        date: earlyDate,
        medicId: 1,
        scheduleId: 100,
        specialtyId: 1
      });

      // Act & Assert
      expect(() => service.validateAppointmentCreation(insured, schedule)).toThrow(
        'Appointments in Chile are only allowed between 8 AM and 5 PM'
      );
    });

    it('should throw error for Chile appointment after business hours', () => {
      // Arrange
      const insured = Insured.fromPrimitives({
        countryISO: 'CL',
        insuredId: '12345'
      });
      
      const lateDate = new Date();
      lateDate.setDate(lateDate.getDate() + 1);
      lateDate.setHours(18, 0, 0, 0); // 6 PM (outside business hours)
      
      const schedule = Schedule.create({
        centerId: 1,
        date: lateDate,
        medicId: 1,
        scheduleId: 100,
        specialtyId: 1
      });

      // Act & Assert
      expect(() => service.validateAppointmentCreation(insured, schedule)).toThrow(
        'Appointments in Chile are only allowed between 8 AM and 5 PM'
      );
    });
  });
});
