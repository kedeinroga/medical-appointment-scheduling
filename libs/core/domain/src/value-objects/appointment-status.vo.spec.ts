import { AppointmentStatus } from './appointment-status.vo';

describe('AppointmentStatus', () => {
  describe('static instances', () => {
    it('should have PENDING static instance', () => {
      // Act & Assert
      expect(AppointmentStatus.PENDING.getValue()).toBe('pending');
      expect(AppointmentStatus.PENDING.isPending()).toBe(true);
      expect(AppointmentStatus.PENDING.isProcessed()).toBe(false);
      expect(AppointmentStatus.PENDING.isCompleted()).toBe(false);
    });

    it('should have PROCESSED static instance', () => {
      // Act & Assert
      expect(AppointmentStatus.PROCESSED.getValue()).toBe('processed');
      expect(AppointmentStatus.PROCESSED.isPending()).toBe(false);
      expect(AppointmentStatus.PROCESSED.isProcessed()).toBe(true);
      expect(AppointmentStatus.PROCESSED.isCompleted()).toBe(false);
    });

    it('should have COMPLETED static instance', () => {
      // Act & Assert
      expect(AppointmentStatus.COMPLETED.getValue()).toBe('completed');
      expect(AppointmentStatus.COMPLETED.isPending()).toBe(false);
      expect(AppointmentStatus.COMPLETED.isProcessed()).toBe(false);
      expect(AppointmentStatus.COMPLETED.isCompleted()).toBe(true);
    });
  });

  describe('fromString', () => {
    it('should create PENDING status from string', () => {
      // Arrange & Act
      const status = AppointmentStatus.fromString('pending');

      // Assert
      expect(status.getValue()).toBe('pending');
      expect(status.isPending()).toBe(true);
    });

    it('should create PROCESSED status from string', () => {
      // Arrange & Act
      const status = AppointmentStatus.fromString('processed');

      // Assert
      expect(status.getValue()).toBe('processed');
      expect(status.isProcessed()).toBe(true);
    });

    it('should create COMPLETED status from string', () => {
      // Arrange & Act
      const status = AppointmentStatus.fromString('completed');

      // Assert
      expect(status.getValue()).toBe('completed');
      expect(status.isCompleted()).toBe(true);
    });

    it('should handle uppercase input', () => {
      // Arrange & Act
      const status = AppointmentStatus.fromString('PENDING');

      // Assert
      expect(status.getValue()).toBe('pending');
    });

    it('should handle mixed case input', () => {
      // Arrange & Act
      const status = AppointmentStatus.fromString('Completed');

      // Assert
      expect(status.getValue()).toBe('completed');
    });

    it('should throw error for empty string', () => {
      // Arrange
      const emptyString = '';

      // Act & Assert
      expect(() => AppointmentStatus.fromString(emptyString)).toThrow(
        'Appointment status cannot be empty'
      );
    });

    it('should throw error for invalid status', () => {
      // Arrange
      const invalidStatus = 'invalid';

      // Act & Assert
      expect(() => AppointmentStatus.fromString(invalidStatus)).toThrow(
        'Invalid appointment status: invalid'
      );
    });
  });

  describe('equals', () => {
    it('should return true for same status values', () => {
      // Arrange
      const status1 = AppointmentStatus.fromString('pending');
      const status2 = AppointmentStatus.fromString('pending');

      // Act & Assert
      expect(status1.equals(status2)).toBe(true);
    });

    it('should return false for different status values', () => {
      // Arrange
      const status1 = AppointmentStatus.fromString('pending');
      const status2 = AppointmentStatus.fromString('completed');

      // Act & Assert
      expect(status1.equals(status2)).toBe(false);
    });

    it('should work with static instances', () => {
      // Arrange
      const status = AppointmentStatus.fromString('pending');

      // Act & Assert
      expect(status.equals(AppointmentStatus.PENDING)).toBe(true);
      expect(status.equals(AppointmentStatus.COMPLETED)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const status = AppointmentStatus.fromString('processed');

      // Act & Assert
      expect(status.toString()).toBe('processed');
    });
  });
});
