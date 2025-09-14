/**
 * Appointment Lambda Handler - DRY Refactored
 * Uses EnhancedAppointmentRouteHandlers from route-handlers.ts 
 * for robust validation without code duplication
 */

// External dependencies
import { APIGatewayProxyEvent, SQSEvent, Handler, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';

// Application layer
import { CompleteAppointmentDto, UseCaseFactory } from '@medical-appointment/core-use-cases';
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
 * Handle SQS completion events
 */
const handleSQSEvent = async (event: SQSEvent, context: Context): Promise<void> => {
  const requestId = context.awsRequestId;
  
  try {
    logger.info('Processing appointment completion batch', {
      logId: 'appointment-completion-started',
      requestId,
      recordCount: event.Records.length
    });

    const appointmentRepository = AdapterFactory.createAppointmentRepository();
    const eventBus = AdapterFactory.createEventBridgeAdapter();

    const completeAppointmentUseCase = UseCaseFactory.createCompleteAppointmentUseCase(
      appointmentRepository,
      eventBus
    );

    for (const record of event.Records) {
      try {
        // Parse the SQS record body
        const eventData = JSON.parse(record.body);

        //TODO: Move this conditional to the use case
        // await completeAppointmentUseCase.execute(eventData);

        // Handle EventBridge format (with detail wrapper)
        let actualData = eventData;
        if (eventData.detail && eventData['detail-type']) {
          actualData = eventData.detail;
        }

        // Validate required fields
        if (!actualData.appointmentId || !actualData.insuredId || !actualData.countryISO || !actualData.scheduleId) {
          logger.warn('Skipping message - missing required fields', {
            messageId: record.messageId,
            missingFields: {
              appointmentId: !actualData.appointmentId,
              insuredId: !actualData.insuredId,
              countryISO: !actualData.countryISO,
              scheduleId: !actualData.scheduleId
            }
          });
          continue;
        }

        // Validate that status is PROCESSED
        if (actualData.status?.toLowerCase() !== 'processed') {
          logger.info('Skipping event - status not PROCESSED', {
            appointmentId: actualData.appointmentId,
            currentStatus: actualData.status,
            expectedStatus: 'PROCESSED'
          });
          continue;
        }

        // Create DTO
        const completeDto: CompleteAppointmentDto = {
          appointmentId: actualData.appointmentId,
          insuredId: actualData.insuredId,
          countryISO: actualData.countryISO,
          scheduleId: actualData.scheduleId
        };

        // Execute use case
        await completeAppointmentUseCase.execute(completeDto);

        logger.info('Appointment completed successfully', {
          logId: 'appointment-completed-success',
          appointmentId: actualData.appointmentId,
          insuredId: maskInsuredId(actualData.insuredId),
          countryISO: actualData.countryISO,
          scheduleId: actualData.scheduleId
        });

      } catch (parseError) {
        logger.error('Failed to process SQS record', {
          messageId: record.messageId,
          error: (parseError as Error).message
        });
        // Continue processing other records
      }
    }

  } catch (error) {
    logger.error('Failed to process appointment completion batch', {
      requestId,
      error: (error as Error).message
    });
    throw error;
  }
};
