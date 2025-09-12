import { CountryISO } from '../value-objects/country-iso.vo';

/**
 * Port for messaging operations required by the domain/application layer
 * This interface belongs to the Domain Layer as it defines
 * what the domain needs for messaging capabilities.
 */
export interface IMessagingPort {
  /**
   * Publishes a message indicating an appointment was created
   */
  publishAppointmentCreated(appointmentData: {
    appointmentId: string;
    countryISO: string;
    insuredId: string;
    scheduleId: number;
  }): Promise<void>;

  /**
   * Publishes a generic message with optional attributes
   */
  publishMessage(message: any, attributes?: Record<string, string>): Promise<void>;

  /**
   * Publishes a message to a country-specific topic
   */
  publishToCountrySpecificTopic(
    message: any, 
    countryISO: CountryISO, 
    eventType: string
  ): Promise<void>;
}
