import { DomainEvent } from '@medical-appointment/core-domain';

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
}
