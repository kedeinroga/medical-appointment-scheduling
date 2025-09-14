// Use Cases imports
import { 
  CreateAppointmentUseCase, 
  GetAppointmentsByInsuredIdUseCase,
  CompleteAppointmentUseCase 
} from '../index';

// Domain ports
import { 
  IAppointmentRepository,
  IScheduleRepository,
  IMessagingPort,
  IEventBus 
} from '@medical-appointment/core-domain';

// Shared imports
import { Singleton } from '@medical-appointment/shared';

/**
 * Factory for creating use case instances with proper dependency injection
 * This factory belongs to the application layer and receives infrastructure dependencies
 * Implements the Factory pattern to centralize object creation following Clean Architecture
 * Uses @Singleton decorator for efficient factory management
 */
@Singleton
export class UseCaseFactory {
  
  /**
   * Creates a CreateAppointmentUseCase with all dependencies injected
   * @param appointmentRepository - Repository for appointment persistence
   * @param messagingAdapter - Adapter for sending notifications
   * @param scheduleRepository - Repository for schedule management
   */
  public static createCreateAppointmentUseCase(
    appointmentRepository: IAppointmentRepository,
    messagingAdapter: IMessagingPort,
    scheduleRepository: IScheduleRepository
  ): CreateAppointmentUseCase {
    return new CreateAppointmentUseCase(
      appointmentRepository,
      messagingAdapter,
      scheduleRepository
    );
  }

  /**
   * Creates a GetAppointmentsByInsuredIdUseCase with all dependencies injected
   * Uses both DynamoDB and MySQL repositories to get complete appointment history
   * @param dynamoRepository - Primary repository for active appointments
   * @param mysqlRepository - Secondary repository for historical data
   */
  public static createGetAppointmentsByInsuredIdUseCase(
    dynamoRepository: IAppointmentRepository,
    mysqlRepository: IAppointmentRepository
  ): GetAppointmentsByInsuredIdUseCase {
    return new GetAppointmentsByInsuredIdUseCase(
      dynamoRepository,
      mysqlRepository
    );
  }

  /**
   * Creates a CompleteAppointmentUseCase with all dependencies injected
   * @param appointmentRepository - Repository for appointment persistence
   * @param eventBus - Event bus for completion notifications
   */
  public static createCompleteAppointmentUseCase(
    appointmentRepository: IAppointmentRepository,
    eventBus: IEventBus
  ): CompleteAppointmentUseCase {
    return new CompleteAppointmentUseCase(
      appointmentRepository,
      eventBus
    );
  }
}
