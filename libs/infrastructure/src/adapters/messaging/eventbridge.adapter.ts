// Third-party imports
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { Logger } from '@aws-lambda-powertools/logger';

// Domain imports
import { 
  CountryISO,
  DomainEvent,
  IEventBus
} from '@medical-appointment/core-domain';

// Infrastructure imports
import { AWS_CONFIG } from '../../config/aws.config';
import { EventBridgeError } from '../../errors/aws.errors';

// Shared imports
import { Singleton } from '@medical-appointment/shared';

/**
 * EventBridge Adapter for event publishing
 * Implements the Adapter pattern to integrate with AWS EventBridge
 * Uses @Singleton decorator to ensure efficient EventBridge client management
 */
@Singleton
export class EventBridgeAdapter implements IEventBus {
  private readonly eventBridgeClient: EventBridgeClient;
  private readonly logger: Logger;
  private readonly eventBusName: string;

  constructor() {
    this.eventBridgeClient = new EventBridgeClient({
      region: AWS_CONFIG.AWS_REGION
    });
    this.logger = new Logger({
      serviceName: 'eventbridge-adapter'
    });
    this.eventBusName = AWS_CONFIG.EVENTBRIDGE_BUS_NAME;
  }

  async publish(event: DomainEvent): Promise<void> {
    try {
      const eventEntry = {
        Detail: JSON.stringify(event.toPrimitives()),
        DetailType: event.eventName(),
        EventBusName: this.eventBusName,
        Source: 'medical-appointment-scheduling.appointment-processor',
        Time: event.occurredOn
      };

      const command = new PutEventsCommand({
        Entries: [eventEntry]
      });

      const result = await this.eventBridgeClient.send(command);

      if (result.FailedEntryCount && result.FailedEntryCount > 0) {
        throw new Error(`Failed to publish event: ${JSON.stringify(result.Entries)}`);
      }

      this.logger.info('Domain event published successfully', {
        eventId: event.eventId,
        eventName: event.eventName(),
        eventBusName: this.eventBusName
      });

    } catch (error) {
      this.logger.error('Failed to publish domain event', {
        eventId: event.eventId,
        eventName: event.eventName(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new EventBridgeError('publish', error as Error);
    }
  }

  async publishAppointmentProcessed(
    appointmentData: {
      appointmentId: string;
      countryISO: string;
      insuredId: string;
      scheduleId: number;
    }
  ): Promise<void> {
    try {
      const eventEntry = {
        Detail: JSON.stringify({
          appointmentId: appointmentData.appointmentId,
          countryISO: appointmentData.countryISO,
          insuredId: appointmentData.insuredId,
          scheduleId: appointmentData.scheduleId,
          status: 'processed',
          timestamp: new Date().toISOString()
        }),
        DetailType: 'Appointment Processed',
        EventBusName: this.eventBusName,
        Source: 'medical-appointment-scheduling.appointment-processor',
        Time: new Date()
      };

      const command = new PutEventsCommand({
        Entries: [eventEntry]
      });

      const result = await this.eventBridgeClient.send(command);

      if (result.FailedEntryCount && result.FailedEntryCount > 0) {
        throw new Error(`Failed to publish appointment processed event: ${JSON.stringify(result.Entries)}`);
      }

      this.logger.info('Appointment processed event published successfully', {
        appointmentId: appointmentData.appointmentId,
        countryISO: appointmentData.countryISO,
        eventBusName: this.eventBusName
      });

    } catch (error) {
      this.logger.error('Failed to publish appointment processed event', {
        appointmentId: appointmentData.appointmentId,
        countryISO: appointmentData.countryISO,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new EventBridgeError('publishAppointmentProcessed', error as Error);
    }
  }

  async publishCustomEvent(
    source: string,
    detailType: string,
    detail: any,
    eventBusName?: string
  ): Promise<void> {
    try {
      const eventEntry = {
        Detail: JSON.stringify(detail),
        DetailType: detailType,
        EventBusName: eventBusName || this.eventBusName,
        Source: source,
        Time: new Date()
      };

      const command = new PutEventsCommand({
        Entries: [eventEntry]
      });

      const result = await this.eventBridgeClient.send(command);

      if (result.FailedEntryCount && result.FailedEntryCount > 0) {
        throw new Error(`Failed to publish custom event: ${JSON.stringify(result.Entries)}`);
      }

      this.logger.info('Custom event published successfully', {
        detailType,
        eventBusName: eventBusName || this.eventBusName,
        source
      });

    } catch (error) {
      this.logger.error('Failed to publish custom event', {
        detailType,
        error: error instanceof Error ? error.message : 'Unknown error',
        source
      });
      throw new EventBridgeError('publishCustomEvent', error as Error);
    }
  }

  async publishBatchEvents(events: Array<{
    detailType: string;
    detail: any;
    source: string;
  }>): Promise<void> {
    try {
      const eventEntries = events.map(event => ({
        Detail: JSON.stringify(event.detail),
        DetailType: event.detailType,
        EventBusName: this.eventBusName,
        Source: event.source,
        Time: new Date()
      }));

      const command = new PutEventsCommand({
        Entries: eventEntries
      });

      const result = await this.eventBridgeClient.send(command);

      if (result.FailedEntryCount && result.FailedEntryCount > 0) {
        throw new Error(`Failed to publish batch events: ${JSON.stringify(result.Entries)}`);
      }

      this.logger.info('Batch events published successfully', {
        count: events.length,
        eventBusName: this.eventBusName
      });

    } catch (error) {
      this.logger.error('Failed to publish batch events', {
        count: events.length,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new EventBridgeError('publishBatchEvents', error as Error);
    }
  }
}
