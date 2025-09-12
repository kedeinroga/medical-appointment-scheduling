import { AppointmentCreatedEvent } from './appointment-created.event';

describe('AppointmentCreatedEvent', () => {
  describe('constructor', () => {
    it('should create event with provided data', () => {
      // Arrange
      const appointmentId = 'test-appointment-id';
      const countryISO = 'PE';
      const insuredId = '12345';
      const scheduleId = 100;
      const eventId = 'test-event-id';
      const occurredOn = new Date('2024-01-01T10:00:00Z');

      // Act
      const event = new AppointmentCreatedEvent(
        appointmentId,
        countryISO,
        insuredId,
        scheduleId,
        eventId,
        occurredOn
      );

      // Assert
      expect(event.appointmentId).toBe(appointmentId);
      expect(event.countryISO).toBe(countryISO);
      expect(event.insuredId).toBe(insuredId);
      expect(event.scheduleId).toBe(scheduleId);
      expect(event.eventId).toBe(eventId);
      expect(event.occurredOn).toBe(occurredOn);
    });

    it('should generate event ID and occurred date when not provided', () => {
      // Arrange
      const appointmentId = 'test-appointment-id';
      const countryISO = 'PE';
      const insuredId = '12345';
      const scheduleId = 100;

      // Act
      const event = new AppointmentCreatedEvent(
        appointmentId,
        countryISO,
        insuredId,
        scheduleId
      );

      // Assert
      expect(event.eventId).toBeDefined();
      expect(event.occurredOn).toBeInstanceOf(Date);
    });
  });

  describe('eventName', () => {
    it('should return correct event name', () => {
      // Arrange
      const event = new AppointmentCreatedEvent(
        'test-appointment-id',
        'PE',
        '12345',
        100
      );

      // Act & Assert
      expect(event.eventName()).toBe('appointment.created');
    });
  });

  describe('toPrimitives', () => {
    it('should serialize event to primitives', () => {
      // Arrange
      const appointmentId = 'test-appointment-id';
      const countryISO = 'PE';
      const insuredId = '12345';
      const scheduleId = 100;
      const eventId = 'test-event-id';
      const occurredOn = new Date('2024-01-01T10:00:00Z');

      const event = new AppointmentCreatedEvent(
        appointmentId,
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
        countryISO,
        eventId,
        eventName: 'appointment.created',
        insuredId,
        occurredOn: '2024-01-01T10:00:00.000Z',
        scheduleId
      });
    });
  });

  describe('fromPrimitives', () => {
    it('should create event from primitives', () => {
      // Arrange
      const data = {
        appointmentId: 'test-appointment-id',
        countryISO: 'PE',
        eventId: 'test-event-id',
        insuredId: '12345',
        occurredOn: '2024-01-01T10:00:00.000Z',
        scheduleId: 100
      };

      // Act
      const event = AppointmentCreatedEvent.fromPrimitives(data);

      // Assert
      expect(event.appointmentId).toBe(data.appointmentId);
      expect(event.countryISO).toBe(data.countryISO);
      expect(event.insuredId).toBe(data.insuredId);
      expect(event.scheduleId).toBe(data.scheduleId);
      expect(event.eventId).toBe(data.eventId);
      expect(event.occurredOn).toEqual(new Date(data.occurredOn));
    });
  });
});
