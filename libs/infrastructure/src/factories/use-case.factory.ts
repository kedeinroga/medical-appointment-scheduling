// Use Cases imports
import { 
  CreateAppointmentUseCase, 
  GetAppointmentsByInsuredIdUseCase,
  ProcessAppointmentUseCase,
  CompleteAppointmentUseCase 
} from '@medical-appointment/core-use-cases';

// Infrastructure imports
import { DynamoDBAppointmentRepository } from '../adapters/repositories/dynamodb-appointment.repository';
import { MySQLAppointmentRepository } from '../adapters/repositories/mysql-appointment.repository';
import { EventBridgeAdapter } from '../adapters/messaging/eventbridge.adapter';
import { MySQLScheduleRepository } from '../adapters/repositories/mysql-schedule.repository';
import { SNSAdapter } from '../adapters/messaging/sns.adapter';
import { SQSAdapter } from '../adapters/messaging/sqs.adapter';

/**
 * Factory for creating use case instances with proper dependency injection
 * Implements the Factory pattern to centralize object creation
 */
export class UseCaseFactory {
  private static appointmentRepository: DynamoDBAppointmentRepository;
  private static mysqlAppointmentRepository: MySQLAppointmentRepository;
  private static scheduleRepository: MySQLScheduleRepository;
  private static snsAdapter: SNSAdapter;
  private static sqsAdapter: SQSAdapter;
  private static eventBridgeAdapter: EventBridgeAdapter;

  /**
   * Creates a CreateAppointmentUseCase with all dependencies injected
   */
  public static createCreateAppointmentUseCase(): CreateAppointmentUseCase {
    return new CreateAppointmentUseCase(
      this.getAppointmentRepository(),
      this.getSNSAdapter(),
      this.getScheduleRepository()
    );
  }

  /**
   * Creates a GetAppointmentsByInsuredIdUseCase with all dependencies injected
   * Uses both DynamoDB and MySQL repositories to get complete appointment history
   */
  public static createGetAppointmentsByInsuredIdUseCase(): GetAppointmentsByInsuredIdUseCase {
    return new GetAppointmentsByInsuredIdUseCase(
      this.getAppointmentRepository(),
      this.getMySQLAppointmentRepository()
    );
  }

  /**
   * Creates a ProcessAppointmentUseCase with all dependencies injected
   * Uses DynamoDB repository for main appointment processing
   */
  public static createProcessAppointmentUseCase(): ProcessAppointmentUseCase {
    return new ProcessAppointmentUseCase(
      this.getAppointmentRepository(),
      this.getEventBridgeAdapter(),
      this.getScheduleRepository()
    );
  }

  /**
   * Creates a CompleteAppointmentUseCase with all dependencies injected
   */
  public static createCompleteAppointmentUseCase(): CompleteAppointmentUseCase {
    return new CompleteAppointmentUseCase(
      this.getAppointmentRepository(),
      this.getEventBridgeAdapter()
    );
  }

  /**
   * Gets or creates a DynamoDB appointment repository instance
   */
  public static getAppointmentRepository(): DynamoDBAppointmentRepository {
    if (!this.appointmentRepository) {
      this.appointmentRepository = new DynamoDBAppointmentRepository();
    }
    return this.appointmentRepository;
  }

  /**
   * Gets or creates a MySQL appointment repository instance
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
   * Gets or creates an SNS adapter instance
   */
  public static getSNSAdapter(): SNSAdapter {
    if (!this.snsAdapter) {
      this.snsAdapter = new SNSAdapter();
    }
    return this.snsAdapter;
  }

  /**
   * Gets or creates an SQS adapter instance
   */
  public static getSQSAdapter(): SQSAdapter {
    if (!this.sqsAdapter) {
      this.sqsAdapter = new SQSAdapter();
    }
    return this.sqsAdapter;
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
   * Resets all singleton instances (useful for testing)
   */
  public static reset(): void {
    this.appointmentRepository = undefined as any;
    this.mysqlAppointmentRepository = undefined as any;
    this.scheduleRepository = undefined as any;
    this.snsAdapter = undefined as any;
    this.sqsAdapter = undefined as any;
    this.eventBridgeAdapter = undefined as any;
  }
}
