/**
 * Appointment Route Handlers - Refactored with DRY principles
 * Extracted specific route logic from main handler
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';

// Application layer
import { 
  CreateAppointmentDto,
  CreateAppointmentUseCase, 
  GetAppointmentsByInsuredIdUseCase,
  GetAppointmentsDto,
  CompleteAppointmentDto,
  CompleteAppointmentUseCase 
} from '@medical-appointment/core-use-cases';
import { 
  AppointmentNotFoundError, 
  ValidationError,
  logBusinessError, 
  logInfrastructureError,
  maskInsuredId
} from '@medical-appointment/shared';

// Shared utilities from functions layer
import { 
  ApiHandlerBase, 
  HTTP_STATUS, 
  ERROR_CODES,
  SUPPORTED_COUNTRIES,
  INSURED_ID_PATTERN
} from '../shared/api-handler-base';

// Same layer modules
import { 
  APPOINTMENT_API,
  LOG_EVENTS
} from './constants';
import { 
  logAppointmentCreation,
  logAppointmentGet
} from './utils';

/**
 * Appointment Route Handlers
 */
export class AppointmentRouteHandlers {
  constructor(
    private logger: Logger,
    private createAppointmentUseCase: CreateAppointmentUseCase,
    private getAppointmentsUseCase: GetAppointmentsByInsuredIdUseCase
  ) {}

  /**
   * Handle POST /appointments - Create new appointment
   */
  async handleCreateAppointment(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const requestId = event.requestContext?.requestId || 'unknown';
    
    try {
      this.logger.info(LOG_EVENTS.APPOINTMENT_CREATION_STARTED.message, {
        logId: LOG_EVENTS.APPOINTMENT_CREATION_STARTED.logId,
        requestId,
        operationType: 'create'
      });

      // Validate request body using commons
      const bodyValidation = ApiHandlerBase.validateJsonBody(event);
      if (!bodyValidation.isValid) {
        return this.createErrorResponse(
          bodyValidation.error!.statusCode,
          bodyValidation.error!.message,
          bodyValidation.error!.errorCode
        );
      }

      const requestBody = bodyValidation.data;

      // Validate required fields using commons
      const fieldsValidation = ApiHandlerBase.validateRequiredFields(
        requestBody, 
        ['countryISO', 'insuredId', 'scheduleId']
      );
      if (!fieldsValidation.isValid) {
        return this.createErrorResponse(
          fieldsValidation.error!.statusCode,
          fieldsValidation.error!.message,
          fieldsValidation.error!.errorCode
        );
      }

      const { countryISO, insuredId, scheduleId } = requestBody;

      // Validate countryISO
      if (!SUPPORTED_COUNTRIES.includes(countryISO)) {
        return this.createErrorResponse(
          HTTP_STATUS.BAD_REQUEST, 
          'Invalid countryISO. Must be PE or CL', 
          ERROR_CODES.INVALID_COUNTRY_ISO
        );
      }

      // Create DTO
      const createAppointmentDto: CreateAppointmentDto = {
        countryISO: countryISO as 'PE' | 'CL',
        insuredId: String(insuredId).padStart(5, '0'),
        scheduleId: Number(scheduleId)
      };

      // Log appointment creation with masked PII
      logAppointmentCreation(this.logger, {
        requestId,
        insuredId: createAppointmentDto.insuredId,
        country: createAppointmentDto.countryISO
      });

      // Execute use case
      const result = await this.createAppointmentUseCase.execute(createAppointmentDto);

      this.logger.info('Appointment created successfully', {
        logId: 'appointment-created-success',
        requestId,
        appointmentId: result.appointmentId,
        insuredId: maskInsuredId(createAppointmentDto.insuredId),
        countryISO: createAppointmentDto.countryISO,
        status: result.status
      });

      return this.createSuccessResponse(HTTP_STATUS.CREATED, {
        appointmentId: result.appointmentId,
        message: 'Appointment scheduling is in process',
        status: result.status
      });

    } catch (error) {
      return this.handleError(error as Error, requestId, 'create');
    }
  }

  /**
   * Handle GET /appointments/{insuredId} - Get appointments by insured ID
   */
  async handleGetAppointments(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const requestId = event.requestContext?.requestId || 'unknown';
    
    try {
      this.logger.info(LOG_EVENTS.APPOINTMENT_GET_STARTED.message, {
        logId: LOG_EVENTS.APPOINTMENT_GET_STARTED.logId,
        requestId,
        operationType: 'get'
      });

      // Get insuredId from path parameters
      const insuredId = event.pathParameters?.insuredId;
      
      if (!insuredId) {
        return this.createErrorResponse(
          HTTP_STATUS.BAD_REQUEST, 
          'Missing insuredId in path parameters', 
          ERROR_CODES.MISSING_INSURED_ID
        );
      }

      // Validate insuredId format
      const insuredIdPadded = String(insuredId).padStart(5, '0');
      if (!INSURED_ID_PATTERN.test(insuredIdPadded)) {
        return this.createErrorResponse(
          HTTP_STATUS.BAD_REQUEST, 
          'Invalid insuredId format. Must be 5 digits', 
          ERROR_CODES.INVALID_INSURED_ID_FORMAT
        );
      }

      // Log appointment get with masked PII
      logAppointmentGet(this.logger, {
        requestId,
        insuredId: insuredIdPadded
      });

      // Create DTO
      const getAppointmentsDto: GetAppointmentsDto = {
        insuredId: insuredIdPadded
      };

      // Execute use case
      const result = await this.getAppointmentsUseCase.execute(getAppointmentsDto);

      this.logger.info('Appointments retrieved successfully', {
        logId: 'appointments-retrieved-success',
        requestId,
        insuredId: maskInsuredId(insuredIdPadded),
        appointmentCount: result.appointments.length
      });

      return this.createSuccessResponse(HTTP_STATUS.OK, {
        appointments: result.appointments,
        pagination: {
          count: result.appointments.length
        }
      });

    } catch (error) {
      return this.handleError(error as Error, requestId, 'get');
    }
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: Error, requestId: string, operationType: string): APIGatewayProxyResult {
    const logEvent = operationType === 'create' 
      ? LOG_EVENTS.APPOINTMENT_CREATION_FAILED 
      : LOG_EVENTS.APPOINTMENT_GET_FAILED;

    this.logger.error(logEvent.message, {
      logId: logEvent.logId,
      requestId,
      errorType: error.constructor.name,
      errorMessage: error.message
    });

    if (error instanceof ValidationError) {
      logBusinessError(this.logger, error, { requestId, operationType });
      return this.createErrorResponse(HTTP_STATUS.BAD_REQUEST, error.message, ERROR_CODES.VALIDATION_ERROR);
    }

    if (error instanceof AppointmentNotFoundError) {
      return this.createErrorResponse(HTTP_STATUS.NOT_FOUND, error.message, ERROR_CODES.NOT_FOUND);
    }

    logInfrastructureError(this.logger, error, { requestId, operationType });
    return this.createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error', ERROR_CODES.INTERNAL_ERROR);
  }

  /**
   * Helper methods using commons
   */
  private createSuccessResponse(statusCode: number, data: any): APIGatewayProxyResult {
    return new ApiHandlerBase([], this.logger).createSuccessResponse(statusCode, data);
  }

  private createErrorResponse(statusCode: number, message: string, errorCode: string): APIGatewayProxyResult {
    return new ApiHandlerBase([], this.logger).createErrorResponse(statusCode, message, errorCode);
  }
}
