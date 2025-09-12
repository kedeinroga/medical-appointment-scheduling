import { DomainEvent } from './domain.event';

export class AppointmentCompletedEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly completedAt: Date,
    public readonly countryISO: string,
    public readonly insuredId: string,
    public readonly scheduleId: number,
    eventId?: string,
    occurredOn?: Date
  ) {
    super(appointmentId, eventId, occurredOn);
  }

  public eventName(): string {
    return 'appointment.completed';
  }

  public toPrimitives(): {
    appointmentId: string;
    completedAt: string;
    countryISO: string;
    eventId: string;
    eventName: string;
    insuredId: string;
    occurredOn: string;
    scheduleId: number;
  } {
    return {
      appointmentId: this.appointmentId,
      completedAt: this.completedAt.toISOString(),
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
    completedAt: string;
    countryISO: string;
    eventId: string;
    insuredId: string;
    occurredOn: string;
    scheduleId: number;
  }): AppointmentCompletedEvent {
    return new AppointmentCompletedEvent(
      data.appointmentId,
      new Date(data.completedAt),
      data.countryISO,
      data.insuredId,
      data.scheduleId,
      data.eventId,
      new Date(data.occurredOn)
    );
  }
}
