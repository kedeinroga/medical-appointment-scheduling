import { DomainEvent } from '../events/domain.event';

/**
 * Port for publishing domain events to external systems.
 * This interface belongs to the Domain Layer as it defines
 * what the domain needs for event publishing capabilities.
 */
export interface IEventBus {
  /**
   * Publishes a domain event to the event bus
   * @param event The domain event to publish
   */
  publish(event: DomainEvent): Promise<void>;
}
