// Use Cases imports
import { ProcessCountryAppointmentUseCase } from '../process-country-appointment/process-country-appointment.use-case';

// Domain imports
import { 
  CountryISO, 
  IAppointmentRepository,
  IScheduleRepository,
  IEventBus 
} from '@medical-appointment/core-domain';

/**
 * Factory specifically for country-specific processing use case composition
 * This factory belongs to the application layer and orchestrates the creation of 
 * country-specific appointment processing use cases
 * 
 * This handles the composition of ProcessCountryAppointmentUseCase which is used by
 * country-specific lambdas (appointment_pe, appointment_cl) for MySQL persistence
 */
export class CountryProcessingCompositionFactory {

  /**
   * Creates a ProcessCountryAppointmentUseCase configured for country-specific processing
   * This use case handles MySQL persistence as required by the business flow
   * 
   * @param countryAppointmentRepository - MySQL repository for country-specific appointment storage
   * @param eventBus - Event bus for publishing domain events
   * @param scheduleRepository - Repository for schedule validation
   * @param countryISO - ISO code for the specific country
   */
  public static createProcessCountryAppointmentUseCase(
    countryAppointmentRepository: IAppointmentRepository,
    eventBus: IEventBus,
    scheduleRepository: IScheduleRepository,
    countryISO?: CountryISO
  ): ProcessCountryAppointmentUseCase {
    return new ProcessCountryAppointmentUseCase(
      countryAppointmentRepository,
      eventBus,
      scheduleRepository
    );
  }

  /**
   * Creates a complete composition for country processing
   * This method provides all the dependencies needed for country-specific processing
   * 
   * @param countryAppointmentRepository - MySQL repository for the specific country
   * @param eventBus - Event bus for domain events
   * @param scheduleRepository - Schedule repository for validation
   * @param countryISO - Country ISO code
   */
  public static createCountryProcessingComposition(
    countryAppointmentRepository: IAppointmentRepository,
    eventBus: IEventBus,
    scheduleRepository: IScheduleRepository,
    countryISO: CountryISO
  ) {
    return {
      processCountryAppointmentUseCase: this.createProcessCountryAppointmentUseCase(
        countryAppointmentRepository,
        eventBus,
        scheduleRepository,
        countryISO
      ),
      countryISO: countryISO.getValue()
    };
  }
}
