import { 
  InvalidInsuredIdError,
  UnsupportedCountryError,
  InvalidAppointmentStatusError,
  AppointmentStatusTransitionError,
  InvalidScheduleError,
  AppointmentNotFoundError 
} from './appointment.errors';

describe('Appointment Errors', () => {
  describe('InvalidInsuredIdError', () => {
    it('should create error with correct message and name', () => {
      // Arrange
      const insuredId = '123';

      // Act
      const error = new InvalidInsuredIdError(insuredId);

      // Assert
      expect(error.message).toBe('Invalid insured ID: 123. Must be exactly 5 digits.');
      expect(error.name).toBe('InvalidInsuredIdError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('UnsupportedCountryError', () => {
    it('should create error with correct message and name', () => {
      // Arrange
      const countryISO = 'US';

      // Act
      const error = new UnsupportedCountryError(countryISO);

      // Assert
      expect(error.message).toBe('Country US is not supported. Only PE and CL are allowed.');
      expect(error.name).toBe('UnsupportedCountryError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('InvalidAppointmentStatusError', () => {
    it('should create error with correct message and name', () => {
      // Arrange
      const status = 'invalid-status';

      // Act
      const error = new InvalidAppointmentStatusError(status);

      // Assert
      expect(error.message).toBe('Invalid appointment status: invalid-status. Must be one of: pending, processed, completed.');
      expect(error.name).toBe('InvalidAppointmentStatusError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('AppointmentStatusTransitionError', () => {
    it('should create error with correct message and name', () => {
      // Arrange
      const currentStatus = 'completed';
      const targetStatus = 'pending';

      // Act
      const error = new AppointmentStatusTransitionError(currentStatus, targetStatus);

      // Assert
      expect(error.message).toBe('Cannot transition from completed to pending.');
      expect(error.name).toBe('AppointmentStatusTransitionError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('InvalidScheduleError', () => {
    it('should create error with correct message and name', () => {
      // Arrange
      const message = 'Schedule date cannot be in the past';

      // Act
      const error = new InvalidScheduleError(message);

      // Assert
      expect(error.message).toBe('Invalid schedule: Schedule date cannot be in the past');
      expect(error.name).toBe('InvalidScheduleError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('AppointmentNotFoundError', () => {
    it('should create error with correct message and name', () => {
      // Arrange
      const appointmentId = 'test-appointment-id';

      // Act
      const error = new AppointmentNotFoundError(appointmentId);

      // Assert
      expect(error.message).toBe('Appointment with ID test-appointment-id not found.');
      expect(error.name).toBe('AppointmentNotFoundError');
      expect(error).toBeInstanceOf(Error);
    });
  });
});
