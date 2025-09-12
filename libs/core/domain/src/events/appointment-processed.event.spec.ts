import { AppointmentProcessedEvent } from './appointment-processed.event';

describe('AppointmentProcessedEvent', () => {
  describe('constructor', () => {
    it('should create event with provided data', () => {
      // Arrange
      const appointmentId = 'test-appointment-id';
      const countryISO = 'CL';
      const insuredId = '67890';
      const processedAt = new Date('2024-01-01T11:00:00Z');
      const scheduleId = 200;
      const eventId = 'test-event-id';
      const occurredOn = new Date('2024-01-01T11:30:00Z');

      // Act
      const event = new AppointmentProcessedEvent(
        appointmentId,
        countryISO,
        insuredId,
        processedAt,
        scheduleId,
        eventId,
        occurredOn
      );

      // Assert
      expect(event.appointmentId).toBe(appointmentId);
      expect(event.countryISO).toBe(countryISO);
      expect(event.insuredId).toBe(insuredId);
      expect(event.processedAt).toBe(processedAt);
      expect(event.scheduleId).toBe(scheduleId);
      expect(event.eventId).toBe(eventId);
      expect(event.occurredOn).toBe(occurredOn);
    });
  });

  describe('eventName', () => {
    it('should return correct event name', () => {
      // Arrange
      const event = new AppointmentProcessedEvent(
        'test-appointment-id',
        'CL',
        '67890',
        new Date(),
        200
      );

      // Act & Assert
      expect(event.eventName()).toBe('appointment.processed');
    });
  });

  describe('toPrimitives', () => {
    it('should serialize event to primitives', () => {
      // Arrange
      const appointmentId = 'test-appointment-id';
      const countryISO = 'CL';
      const insuredId = '67890';
      const processedAt = new Date('2024-01-01T11:00:00Z');
      const scheduleId = 200;
      const eventId = 'test-event-id';
      const occurredOn = new Date('2024-01-01T11:30:00Z');

      const event = new AppointmentProcessedEvent(
        appointmentId,
        countryISO,
        insuredId,
        processedAt,
        scheduleId,
        eventId,
        occurredOn
      );

      // Act
      const primitives = event.toPrimitives();

      // Assert
      expect(primitives).toEqual({
        appointmentId,
        countryISO,
        eventId,
        eventName: 'appointment.processed',
        insuredId,
        occurredOn: '2024-01-01T11:30:00.000Z',
        processedAt: '2024-01-01T11:00:00.000Z',
        scheduleId
      });
    });
  });

  describe('fromPrimitives', () => {
    it('should create event from primitives', () => {
      // Arrange
      const data = {
        appointmentId: 'test-appointment-id',
        countryISO: 'CL',
        eventId: 'test-event-id',
        insuredId: '67890',
        occurredOn: '2024-01-01T11:30:00.000Z',
        processedAt: '2024-01-01T11:00:00.000Z',
        scheduleId: 200
      };

      // Act
      const event = AppointmentProcessedEvent.fromPrimitives(data);

      // Assert
      expect(event.appointmentId).toBe(data.appointmentId);
      expect(event.countryISO).toBe(data.countryISO);
      expect(event.insuredId).toBe(data.insuredId);
      expect(event.processedAt).toEqual(new Date(data.processedAt));
      expect(event.scheduleId).toBe(data.scheduleId);
      expect(event.eventId).toBe(data.eventId);
      expect(event.occurredOn).toEqual(new Date(data.occurredOn));
    });
  });
});
