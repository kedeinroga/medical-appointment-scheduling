import { AppointmentCompletedEvent } from '../appointment-completed.event';

describe('AppointmentCompletedEvent', () => {
  describe('constructor', () => {
    it('should create event with provided data', () => {
      // Arrange
      const appointmentId = 'test-appointment-id';
      const completedAt = new Date('2024-01-01T12:00:00Z');
      const countryISO = 'PE';
      const insuredId = '12345';
      const scheduleId = 100;
      const eventId = 'test-event-id';
      const occurredOn = new Date('2024-01-01T12:30:00Z');

      // Act
      const event = new AppointmentCompletedEvent(
        appointmentId,
        completedAt,
        countryISO,
        insuredId,
        scheduleId,
        eventId,
        occurredOn
      );

      // Assert
      expect(event.appointmentId).toBe(appointmentId);
      expect(event.completedAt).toBe(completedAt);
      expect(event.countryISO).toBe(countryISO);
      expect(event.insuredId).toBe(insuredId);
      expect(event.scheduleId).toBe(scheduleId);
      expect(event.eventId).toBe(eventId);
      expect(event.occurredOn).toBe(occurredOn);
    });
  });

  describe('eventName', () => {
    it('should return correct event name', () => {
      // Arrange
      const event = new AppointmentCompletedEvent(
        'test-appointment-id',
        new Date(),
        'PE',
        '12345',
        100
      );

      // Act & Assert
      expect(event.eventName()).toBe('appointment.completed');
    });
  });

  describe('toPrimitives', () => {
    it('should serialize event to primitives', () => {
      // Arrange
      const appointmentId = 'test-appointment-id';
      const completedAt = new Date('2024-01-01T12:00:00Z');
      const countryISO = 'PE';
      const insuredId = '12345';
      const scheduleId = 100;
      const eventId = 'test-event-id';
      const occurredOn = new Date('2024-01-01T12:30:00Z');

      const event = new AppointmentCompletedEvent(
        appointmentId,
        completedAt,
        countryISO,
        insuredId,
        scheduleId,
        eventId,
        occurredOn
      );

      // Act
      const primitives = event.toPrimitives();

      // Assert
      expect(primitives).toEqual({
        appointmentId,
        completedAt: '2024-01-01T12:00:00.000Z',
        countryISO,
        eventId,
        eventName: 'appointment.completed',
        insuredId,
        occurredOn: '2024-01-01T12:30:00.000Z',
        scheduleId
      });
    });
  });

  describe('fromPrimitives', () => {
    it('should create event from primitives', () => {
      // Arrange
      const data = {
        appointmentId: 'test-appointment-id',
        completedAt: '2024-01-01T12:00:00.000Z',
        countryISO: 'PE',
        eventId: 'test-event-id',
        insuredId: '12345',
        occurredOn: '2024-01-01T12:30:00.000Z',
        scheduleId: 100
      };

      // Act
      const event = AppointmentCompletedEvent.fromPrimitives(data);

      // Assert
      expect(event.appointmentId).toBe(data.appointmentId);
      expect(event.completedAt).toEqual(new Date(data.completedAt));
      expect(event.countryISO).toBe(data.countryISO);
      expect(event.insuredId).toBe(data.insuredId);
      expect(event.scheduleId).toBe(data.scheduleId);
      expect(event.eventId).toBe(data.eventId);
      expect(event.occurredOn).toEqual(new Date(data.occurredOn));
    });
  });
});
