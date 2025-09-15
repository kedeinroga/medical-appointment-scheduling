/**
 * Appointment Lambda Handler - DRY Refactored
 * Uses EnhancedAppointmentRouteHandlers from route-handlers.ts 
 * for robust validation without code duplication
 */

// External dependencies
import { APIGatewayProxyEvent, SQSEvent, Handler, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';

// Application layer
import { 
  CompleteAppointmentDto,
  UseCaseFactory 
} from '@medical-appointment/core-use-cases';
import { maskInsuredId } from '@medical-appointment/shared';

// Infrastructure layer
import { AdapterFactory } from '@medical-appointment/infrastructure';

// Shared utilities from functions layer
import { ApiHandlerBase, RouteConfig } from '../shared/api-handler-base';

// Same layer modules
import { APPOINTMENT_API } from './constants';
import { EnhancedAppointmentRouteHandlers } from './route-handlers';

// Initialize logger
const logger = new Logger({
  serviceName: 'medical-appointment-scheduling',
  logLevel: (process.env.LOG_LEVEL as any) || 'INFO'
});

// Initialize dependencies using Composition Root pattern
const appointmentRepository = AdapterFactory.createAppointmentRepository();
const messagingAdapter = AdapterFactory.createSNSAdapter();
const scheduleRepository = AdapterFactory.createScheduleRepository();

const createAppointmentUseCase = UseCaseFactory.createCreateAppointmentUseCase(
  appointmentRepository,
  messagingAdapter,
  scheduleRepository
);

const dynamoRepository = AdapterFactory.createAppointmentRepository();
const mysqlRepository = AdapterFactory.createMySQLAppointmentRepository();

const getAppointmentsUseCase = UseCaseFactory.createGetAppointmentsByInsuredIdUseCase(
  dynamoRepository,
  mysqlRepository
);

// Initialize completion use case for SQS events
const completionEventRepository = AdapterFactory.createAppointmentRepository();
const completionEventBus = AdapterFactory.createEventBridgeAdapter();

const completeAppointmentUseCase = UseCaseFactory.createCompleteAppointmentUseCase(
  completionEventRepository,
  completionEventBus
);

// Initialize enhanced route handlers with validation (using DRY principle)
const routeHandlers = new EnhancedAppointmentRouteHandlers(
  logger,
  createAppointmentUseCase,
  getAppointmentsUseCase
);

// Configure routes
const routes: RouteConfig[] = [
  {
    method: APPOINTMENT_API.METHODS.POST,
    path: APPOINTMENT_API.PATHS.APPOINTMENTS,
    handler: (event: APIGatewayProxyEvent, context: Context) => routeHandlers.handleCreateAppointment(event)
  },
  {
    method: APPOINTMENT_API.METHODS.GET,
    path: APPOINTMENT_API.PATHS.APPOINTMENTS_BY_INSURED,
    handler: (event: APIGatewayProxyEvent, context: Context) => routeHandlers.handleGetAppointments(event)
  }
];// Initialize API handler
const apiHandler = new ApiHandlerBase(routes, logger);

/**
 * Unified handler that processes both API Gateway and SQS events
 */
export const main: Handler = async (event: any, context: Context): Promise<any> => {
  // Detect event type
  if (event.Records && Array.isArray(event.Records)) {
    // SQS Event - handle completion (sin cambios)
    return handleSQSEvent(event as SQSEvent, context);
  } else if (event.httpMethod) {
    // API Gateway Event - handle HTTP requests with validation
    return apiHandler.handle(event as APIGatewayProxyEvent, context);
  } else {
    throw new Error('Unknown event type');
  }
};

/**
 * Handle SQS completion events - Clean Architecture compliant
 * Now only handles presentation logic, business logic moved to use case
 */
const handleSQSEvent = async (event: SQSEvent, context: Context): Promise<void> => {
  const requestId = context.awsRequestId;
  
  try {
    logger.info('Processing appointment completion batch', {
      logId: 'appointment-completion-started',
      requestId,
      recordCount: event.Records.length
    });

    let totalProcessed = 0;
    let totalSkipped = 0;

    // Process each SQS record
    for (const record of event.Records) {
      try {
        // Parse and validate the event data (helper function for cleaner code)
        const completionData = parseAndValidateCompletionEvent(record.body, record.messageId);
        
        if (!completionData) {
          logger.info('Skipping invalid completion event', {
            messageId: record.messageId
          });
          totalSkipped++;
          continue;
        }

        // Create DTO for completion use case
        const completeDto: CompleteAppointmentDto = {
          appointmentId: completionData.appointmentId,
          insuredId: completionData.insuredId,
          countryISO: completionData.countryISO,
          scheduleId: completionData.scheduleId,
          status: completionData.status
        };

        // Execute use case - business logic in application layer
        await completeAppointmentUseCase.execute(completeDto);

        logger.info('Appointment completed successfully', {
          logId: 'appointment-completed-success',
          appointmentId: completionData.appointmentId,
          insuredId: maskInsuredId(completionData.insuredId),
          countryISO: completionData.countryISO,
          scheduleId: completionData.scheduleId
        });

        totalProcessed++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Failed to process SQS record', {
          messageId: record.messageId,
          error: errorMessage
        });
        totalSkipped++;
        // Continue processing other records
      }
    }

    // Log final batch summary
    logger.info('Appointment completion batch processed', {
      logId: 'appointment-completion-finished',
      requestId,
      totalRecords: event.Records.length,
      processed: totalProcessed,
      skipped: totalSkipped
    });

  } catch (error) {
    logger.error('Failed to process appointment completion batch', {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
};

/**
 * Helper function to parse and validate completion events
 * This extracts presentation-layer parsing logic from the main handler
 * Returns null if the event should be skipped
 */
function parseAndValidateCompletionEvent(rawEventBody: string, messageId: string): any | null {
  try {
    // Parse the JSON
    const eventData = JSON.parse(rawEventBody);

    // Handle EventBridge format (with detail wrapper)
    let actualData = eventData;
    if (eventData.detail && eventData['detail-type']) {
      actualData = eventData.detail;
    }

    return actualData;

  } catch (parseError) {
    logger.error('Failed to parse event body', {
      messageId,
      error: parseError instanceof Error ? parseError.message : 'Parse error'
    });
    return null;
  }
}
