import { DomainEvent } from './domain.event';

export class AppointmentCreatedEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly countryISO: string,
    public readonly insuredId: string,
    public readonly scheduleId: number,
    eventId?: string,
    occurredOn?: Date
  ) {
    super(appointmentId, eventId, occurredOn);
  }

  public eventName(): string {
    return 'appointment.created';
  }

  public toPrimitives(): {
    appointmentId: string;
    countryISO: string;
    eventId: string;
    eventName: string;
    insuredId: string;
    occurredOn: string;
    scheduleId: number;
  } {
    return {
      appointmentId: this.appointmentId,
      countryISO: this.countryISO,
      eventId: this.eventId,
      eventName: this.eventName(),
      insuredId: this.insuredId,
      occurredOn: this.occurredOn.toISOString(),
      scheduleId: this.scheduleId
    };
  }

  public static fromPrimitives(data: {
    appointmentId: string;
    countryISO: string;
    eventId: string;
    insuredId: string;
    occurredOn: string;
    scheduleId: number;
  }): AppointmentCreatedEvent {
    return new AppointmentCreatedEvent(
      data.appointmentId,
      data.countryISO,
      data.insuredId,
      data.scheduleId,
      data.eventId,
      new Date(data.occurredOn)
    );
  }
}
