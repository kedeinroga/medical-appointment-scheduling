export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;

  constructor(
    public readonly aggregateId: string,
    eventId?: string,
    occurredOn?: Date
  ) {
    this.eventId = eventId || this.generateEventId();
    this.occurredOn = occurredOn || new Date();
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  abstract eventName(): string;
  abstract toPrimitives(): Record<string, any>;
}
