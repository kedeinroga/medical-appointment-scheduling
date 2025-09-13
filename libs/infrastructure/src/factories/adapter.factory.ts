// Domain imports
import { CountryISO } from '@medical-appointment/core-domain';

// Infrastructure imports
import { DynamoDBAppointmentRepository } from '../adapters/repositories/dynamodb-appointment.repository';
import { MySQLAppointmentRepository } from '../adapters/repositories/mysql-appointment.repository';
import { EventBridgeAdapter } from '../adapters/messaging/eventbridge.adapter';
import { MySQLScheduleRepository } from '../adapters/repositories/mysql-schedule.repository';
import { SNSAdapter } from '../adapters/messaging/sns.adapter';
import { SQSAdapter } from '../adapters/messaging/sqs.adapter';

/**
 * Factory for creating adapter instances with proper dependency injection
 * Implements the Factory pattern and Singleton pattern for infrastructure adapters
 */
export class AdapterFactory {
  private static instances: Map<string, any> = new Map();

  /**
   * Creates or gets a DynamoDB appointment repository instance
   */
  public static createAppointmentRepository(): DynamoDBAppointmentRepository {
    const key = 'appointmentRepository';
    
    if (!this.instances.has(key)) {
      this.instances.set(key, new DynamoDBAppointmentRepository());
    }
    
    return this.instances.get(key);
  }

  /**
   * Creates or gets a MySQL appointment repository instance for country-specific processing
   */
  public static createMySQLAppointmentRepository(): MySQLAppointmentRepository {
    const key = 'mysqlAppointmentRepository';
    
    if (!this.instances.has(key)) {
      this.instances.set(key, new MySQLAppointmentRepository());
    }
    
    return this.instances.get(key);
  }

  /**
   * Creates or gets a MySQL schedule repository instance for a specific country
   */
  public static createScheduleRepository(countryISO?: string): MySQLScheduleRepository {
    const key = `scheduleRepository_${countryISO || 'default'}`;
    
    if (!this.instances.has(key)) {
      this.instances.set(key, new MySQLScheduleRepository());
    }
    
    return this.instances.get(key);
  }

  /**
   * Creates or gets an SNS adapter instance
   */
  public static createSNSAdapter(): SNSAdapter {
    const key = 'snsAdapter';
    
    if (!this.instances.has(key)) {
      this.instances.set(key, new SNSAdapter());
    }
    
    return this.instances.get(key);
  }

  /**
   * Creates or gets an SQS adapter instance
   */
  public static createSQSAdapter(): SQSAdapter {
    const key = 'sqsAdapter';
    
    if (!this.instances.has(key)) {
      this.instances.set(key, new SQSAdapter());
    }
    
    return this.instances.get(key);
  }

  /**
   * Creates or gets an EventBridge adapter instance
   */
  public static createEventBridgeAdapter(): EventBridgeAdapter {
    const key = 'eventBridgeAdapter';
    
    if (!this.instances.has(key)) {
      this.instances.set(key, new EventBridgeAdapter());
    }
    
    return this.instances.get(key);
  }

  /**
   * Creates adapters specific for a country processing workflow
   */
  public static createCountryProcessingAdapters(countryISO: CountryISO) {
    return {
      appointmentRepository: this.createMySQLAppointmentRepository(),
      eventBridgeAdapter: this.createEventBridgeAdapter(),
      scheduleRepository: this.createScheduleRepository(countryISO.getValue()),
      sqsAdapter: this.createSQSAdapter()
    };
  }

  /**
   * Creates all messaging adapters
   */
  public static createMessagingAdapters() {
    return {
      eventBridgeAdapter: this.createEventBridgeAdapter(),
      snsAdapter: this.createSNSAdapter(),
      sqsAdapter: this.createSQSAdapter()
    };
  }

  /**
   * Creates all repository adapters
   */
  public static createRepositoryAdapters(countryISO?: string) {
    return {
      appointmentRepository: this.createAppointmentRepository(),
      mysqlAppointmentRepository: this.createMySQLAppointmentRepository(),
      scheduleRepository: this.createScheduleRepository(countryISO)
    };
  }

  /**
   * Resets all adapter instances (useful for testing)
   */
  public static reset(): void {
    this.instances.clear();
  }

  /**
   * Gets all current adapter instances
   */
  public static getInstances(): Map<string, any> {
    return new Map(this.instances);
  }
}
