// Use Case imports from core layer
import { 
  UseCaseFactory,
  CountryProcessingCompositionFactory
} from '@medical-appointment/core-use-cases';

// Infrastructure adapter factories
import { AdapterFactory } from './adapter.factory';
import { CountryProcessingFactory } from './country-processing.factory';

// Domain imports
import { CountryISO } from '@medical-appointment/core-domain';

/**
 * Infrastructure Bridge Factory
 * This factory bridges the gap between infrastructure adapters and use cases
 * It handles the proper dependency injection following Clean Architecture principles
 * 
 * This belongs to infrastructure layer as it knows about concrete implementations
 */
export class InfrastructureBridgeFactory {

  /**
   * Creates a CreateAppointmentUseCase with all infrastructure dependencies injected
   */
  public static createCreateAppointmentUseCase() {
    const appointmentRepository = AdapterFactory.createAppointmentRepository();
    const messagingAdapter = AdapterFactory.createSNSAdapter(); // Implements IMessagingPort
    const scheduleRepository = AdapterFactory.createScheduleRepository();

    return UseCaseFactory.createCreateAppointmentUseCase(
      appointmentRepository,
      messagingAdapter,
      scheduleRepository
    );
  }

  /**
   * Creates a GetAppointmentsByInsuredIdUseCase with all infrastructure dependencies injected
   */
  public static createGetAppointmentsByInsuredIdUseCase() {
    const dynamoRepository = AdapterFactory.createAppointmentRepository();
    const mysqlRepository = AdapterFactory.createMySQLAppointmentRepository();

    return UseCaseFactory.createGetAppointmentsByInsuredIdUseCase(
      dynamoRepository,
      mysqlRepository
    );
  }

  /**
   * Creates a ProcessAppointmentUseCase with all infrastructure dependencies injected
   */
  public static createProcessAppointmentUseCase() {
    const appointmentRepository = AdapterFactory.createAppointmentRepository();
    const eventBus = AdapterFactory.createEventBridgeAdapter(); // Implements IEventBus
    const scheduleRepository = AdapterFactory.createScheduleRepository();

    return UseCaseFactory.createProcessAppointmentUseCase(
      appointmentRepository,
      eventBus,
      scheduleRepository
    );
  }

  /**
   * Creates a CompleteAppointmentUseCase with all infrastructure dependencies injected
   */
  public static createCompleteAppointmentUseCase() {
    const appointmentRepository = AdapterFactory.createAppointmentRepository();
    const eventBus = AdapterFactory.createEventBridgeAdapter(); // Implements IEventBus

    return UseCaseFactory.createCompleteAppointmentUseCase(
      appointmentRepository,
      eventBus
    );
  }

  /**
   * Creates a ProcessCountryAppointmentUseCase for country-specific processing
   * Uses MySQL repositories for persistence as required by business requirements
   */
  public static createProcessCountryAppointmentUseCase(countryISO: CountryISO) {
    const countryAdapters = CountryProcessingFactory.createCountryProcessingAdapters(countryISO);

    return CountryProcessingCompositionFactory.createProcessCountryAppointmentUseCase(
      countryAdapters.appointmentRepository,
      countryAdapters.eventBridgeAdapter, // Implements IEventBus
      countryAdapters.scheduleRepository,
      countryISO
    );
  }

  /**
   * Creates all dependencies for country processing
   */
  public static createCountryProcessingComposition(countryISO: CountryISO) {
    const countryAdapters = CountryProcessingFactory.createCountryProcessingAdapters(countryISO);

    return CountryProcessingCompositionFactory.createCountryProcessingComposition(
      countryAdapters.appointmentRepository,
      countryAdapters.eventBridgeAdapter,
      countryAdapters.scheduleRepository,
      countryISO
    );
  }
}
