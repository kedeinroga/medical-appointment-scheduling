/**
 * Appointment Lambda Handler - Refactored with DRY principles
 * Uses shared commons and extracted route handlers
 */

// External dependencies
import { APIGatewayProxyEvent, APIGatewayProxyResult, SQSEvent, Handler, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';

// Application layer
import { CompleteAppointmentDto, CompleteAppointmentUseCase } from '@medical-appointment/core-use-cases';
import { logInfrastructureError, maskInsuredId } from '@medical-appointment/shared';

// Infrastructure layer
import { InfrastructureBridgeFactory } from '@medical-appointment/infrastructure';

// Shared utilities from functions layer
import { ApiHandlerBase, RouteConfig } from '../shared/api-handler-base';

// Same layer modules
import { APPOINTMENT_API } from './constants';
import { AppointmentRouteHandlers } from './route-handlers';

// Initialize logger
const logger = new Logger({
  serviceName: 'medical-appointment-scheduling',
  logLevel: (process.env.LOG_LEVEL as any) || 'INFO'
});

// Initialize dependencies
const createAppointmentUseCase = InfrastructureBridgeFactory.createCreateAppointmentUseCase();
const getAppointmentsUseCase = InfrastructureBridgeFactory.createGetAppointmentsByInsuredIdUseCase();

// Initialize route handlers
const routeHandlers = new AppointmentRouteHandlers(
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
];

// Initialize API handler
const apiHandler = new ApiHandlerBase(routes, logger);

/**
 * Unified handler that processes both API Gateway and SQS events
 */
export const main: Handler = async (event: any, context: Context): Promise<any> => {
  // Detect event type
  if (event.Records && Array.isArray(event.Records)) {
    // SQS Event - handle completion
    return handleSQSEvent(event as SQSEvent, context);
  } else if (event.httpMethod) {
    // API Gateway Event - handle HTTP requests using commons
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

    const completeAppointmentUseCase = InfrastructureBridgeFactory.createCompleteAppointmentUseCase();

    for (const record of event.Records) {
      try {
        // Parse the SQS record body
        const eventData = JSON.parse(record.body);
        
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
