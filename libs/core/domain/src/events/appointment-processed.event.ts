import { DomainEvent } from './domain.event';

export class AppointmentProcessedEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly countryISO: string,
    public readonly insuredId: string,
    public readonly processedAt: Date,
    public readonly scheduleId: number,
    eventId?: string,
    occurredOn?: Date
  ) {
    super(appointmentId, eventId, occurredOn);
  }

  public eventName(): string {
    return 'Appointment Processed';
  }

  public toPrimitives(): {
    appointmentId: string;
    countryISO: string;
    eventId: string;
    eventName: string;
    insuredId: string;
    occurredOn: string;
    processedAt: string;
    scheduleId: number;
  } {
    return {
      appointmentId: this.appointmentId,
      countryISO: this.countryISO,
      eventId: this.eventId,
      eventName: this.eventName(),
      insuredId: this.insuredId,
      occurredOn: this.occurredOn.toISOString(),
      processedAt: this.processedAt.toISOString(),
      scheduleId: this.scheduleId
    };
  }

  public static fromPrimitives(data: {
    appointmentId: string;
    countryISO: string;
    eventId: string;
    insuredId: string;
    occurredOn: string;
    processedAt: string;
    scheduleId: number;
  }): AppointmentProcessedEvent {
    return new AppointmentProcessedEvent(
      data.appointmentId,
      data.countryISO,
      data.insuredId,
      new Date(data.processedAt),
      data.scheduleId,
      data.eventId,
      new Date(data.occurredOn)
    );
  }
}
