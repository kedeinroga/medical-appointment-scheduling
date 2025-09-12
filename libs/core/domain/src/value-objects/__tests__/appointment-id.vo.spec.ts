import { AppointmentId } from '../appointment-id.vo';

describe('AppointmentId', () => {
  describe('create', () => {
    it('should create a new appointment ID', () => {
      // Arrange & Act
      const appointmentId = AppointmentId.create();

      // Assert
      expect(appointmentId).toBeInstanceOf(AppointmentId);
      expect(appointmentId.getValue()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should create different IDs on subsequent calls', () => {
      // Arrange & Act
      const appointmentId1 = AppointmentId.create();
      const appointmentId2 = AppointmentId.create();

      // Assert
      expect(appointmentId1.getValue()).not.toBe(appointmentId2.getValue());
    });
  });

  describe('fromString', () => {
    it('should create appointment ID from valid UUID string', () => {
      // Arrange
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';

      // Act
      const appointmentId = AppointmentId.fromString(validUuid);

      // Assert
      expect(appointmentId.getValue()).toBe(validUuid);
    });

    it('should throw error for empty string', () => {
      // Arrange
      const emptyString = '';

      // Act & Assert
      expect(() => AppointmentId.fromString(emptyString)).toThrow(
        'Appointment ID cannot be empty'
      );
    });

    it('should throw error for invalid UUID format', () => {
      // Arrange
      const invalidUuid = 'invalid-uuid';

      // Act & Assert
      expect(() => AppointmentId.fromString(invalidUuid)).toThrow(
        'Invalid appointment ID format'
      );
    });
  });

  describe('equals', () => {
    it('should return true for appointment IDs with same value', () => {
      // Arrange
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const appointmentId1 = AppointmentId.fromString(uuid);
      const appointmentId2 = AppointmentId.fromString(uuid);

      // Act & Assert
      expect(appointmentId1.equals(appointmentId2)).toBe(true);
    });

    it('should return false for appointment IDs with different values', () => {
      // Arrange
      const appointmentId1 = AppointmentId.create();
      const appointmentId2 = AppointmentId.create();

      // Act & Assert
      expect(appointmentId1.equals(appointmentId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation of appointment ID', () => {
      // Arrange
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const appointmentId = AppointmentId.fromString(uuid);

      // Act & Assert
      expect(appointmentId.toString()).toBe(uuid);
    });
  });
});
