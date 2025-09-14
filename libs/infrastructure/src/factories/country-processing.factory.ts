// Domain imports
import { CountryISO } from '@medical-appointment/core-domain';

// Infrastructure imports
import { MySQLAppointmentRepository } from '../adapters/repositories/mysql-appointment.repository';
import { MySQLScheduleRepository } from '../adapters/repositories/mysql-schedule.repository';
import { EventBridgeAdapter } from '../adapters/messaging/eventbridge.adapter';

/**
 * Factory specifically for country-specific processing infrastructure adapters
 * This factory belongs to the infrastructure layer and creates only adapters/repositories
 * 
 * Uses MySQL repositories instead of DynamoDB for persistence according to business requirements
 * for country-specific processing (appointment_pe, appointment_cl lambdas)
 */
export class CountryProcessingFactory {
  private static mysqlAppointmentRepository: MySQLAppointmentRepository;
  private static scheduleRepository: MySQLScheduleRepository;
  private static eventBridgeAdapter: EventBridgeAdapter;

  /**
   * Gets or creates a MySQL appointment repository instance
   * This is used to persist appointments in the country-specific MySQL tables
   */
  public static getMySQLAppointmentRepository(): MySQLAppointmentRepository {
    if (!this.mysqlAppointmentRepository) {
      this.mysqlAppointmentRepository = new MySQLAppointmentRepository();
    }
    return this.mysqlAppointmentRepository;
  }

  /**
   * Gets or creates a MySQL schedule repository instance
   */
  public static getScheduleRepository(): MySQLScheduleRepository {
    if (!this.scheduleRepository) {
      this.scheduleRepository = new MySQLScheduleRepository();
    }
    return this.scheduleRepository;
  }

  /**
   * Gets or creates an EventBridge adapter instance
   */
  public static getEventBridgeAdapter(): EventBridgeAdapter {
    if (!this.eventBridgeAdapter) {
      this.eventBridgeAdapter = new EventBridgeAdapter();
    }
    return this.eventBridgeAdapter;
  }

  /**
   * Creates all infrastructure adapters needed for country processing
   * This method only creates adapters, not use cases
   */
  public static createCountryProcessingAdapters(countryISO: CountryISO) {
    return {
      appointmentRepository: this.getMySQLAppointmentRepository(),
      scheduleRepository: this.getScheduleRepository(),
      eventBridgeAdapter: this.getEventBridgeAdapter()
    };
  }

  /**
   * Resets all singleton instances (useful for testing)
   */
  public static reset(): void {
    this.mysqlAppointmentRepository = undefined as any;
    this.scheduleRepository = undefined as any;
    this.eventBridgeAdapter = undefined as any;
  }
}
