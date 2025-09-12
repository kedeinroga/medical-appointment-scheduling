// External dependencies (alphabetical, @ first)
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';

// Application layer
import { 
  CreateAppointmentDto,
  CreateAppointmentUseCase, 
  GetAppointmentsByInsuredIdUseCase,
  GetAppointmentsDto 
} from '@medical-appointment/core-use-cases';
import { 
  AppointmentNotFoundError, 
  ValidationError,
  createSuccessResponse, 
  createErrorResponse, 
  createOptionsResponse,
  logBusinessError, 
  logInfrastructureError,
  maskInsuredId
} from '@medical-appointment/shared';


// Infrastructure layer
import { UseCaseFactory } from '@medical-appointment/infrastructure';

// Same layer modules (alphabetical)
import { 
  APPOINTMENT_API,
  CORS_HEADERS,
  ERROR_CODES,
  HTTP_STATUS,
  INSURED_ID_PATTERN,
  LOG_EVENTS,
  SUPPORTED_COUNTRIES 
} from './constants';
import { 
  logAppointmentCreation,
  logAppointmentGet
} from './utils';

// Initialize logger
const logger = new Logger({
  serviceName: 'medical-appointment-scheduling',
  logLevel: (process.env.LOG_LEVEL as any) || 'INFO'
});

// Initialize dependencies
const createAppointmentUseCase = UseCaseFactory.createCreateAppointmentUseCase();
const getAppointmentsUseCase = UseCaseFactory.createGetAppointmentsByInsuredIdUseCase();

/**
 * Handle POST /appointments - Create new appointment
 */
const handleCreateAppointment = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext?.requestId || 'unknown';
  
  try {
    logger.info(LOG_EVENTS.APPOINTMENT_CREATION_STARTED.message, {
      logId: LOG_EVENTS.APPOINTMENT_CREATION_STARTED.logId,
      requestId,
      operationType: 'create'
    });

    // Validate request body
    if (!event.body) {
      return createErrorResponse(HTTP_STATUS.BAD_REQUEST, 'Request body is required', ERROR_CODES.MISSING_BODY);
    }

    let requestBody: any;
    try {
      requestBody = JSON.parse(event.body);
    } catch (error) {
      return createErrorResponse(HTTP_STATUS.BAD_REQUEST, 'Invalid JSON in request body', ERROR_CODES.INVALID_JSON);
    }

    // Validate required fields (alphabetical order)
    const { countryISO, insuredId, scheduleId } = requestBody;
    
    if (!countryISO || !insuredId || !scheduleId) {
      return createErrorResponse(
        HTTP_STATUS.BAD_REQUEST, 
        'Missing required fields: countryISO, insuredId, scheduleId', 
        ERROR_CODES.MISSING_REQUIRED_FIELDS
      );
    }

    // Validate countryISO
    if (!SUPPORTED_COUNTRIES.includes(countryISO)) {
      return createErrorResponse(
        HTTP_STATUS.BAD_REQUEST, 
        'Invalid countryISO. Must be PE or CL', 
        ERROR_CODES.INVALID_COUNTRY_ISO
      );
    }

    // Create DTO (alphabetical order)
    const createAppointmentDto: CreateAppointmentDto = {
      countryISO: countryISO as 'PE' | 'CL',
      insuredId: String(insuredId).padStart(5, '0'), // Ensure 5 digits with leading zeros
      scheduleId: Number(scheduleId)
    };

    // Log appointment creation with masked PII
    logAppointmentCreation(logger, {
      requestId,
      insuredId: createAppointmentDto.insuredId,
      country: createAppointmentDto.countryISO
    });

    // Execute use case
    const result = await createAppointmentUseCase.execute(createAppointmentDto);

    logger.info('Appointment created successfully', {
      logId: 'appointment-created-success',
      requestId,
      appointmentId: result.appointmentId,
      insuredId: maskInsuredId(createAppointmentDto.insuredId),
      countryISO: createAppointmentDto.countryISO,
      status: result.status
    });

    return createSuccessResponse(HTTP_STATUS.CREATED, {
      appointmentId: result.appointmentId,
      message: 'Appointment scheduling is in process',
      status: result.status
    });

  } catch (error) {
    const errorInstance = error as Error;
    
    logger.error(LOG_EVENTS.APPOINTMENT_CREATION_FAILED.message, {
      logId: LOG_EVENTS.APPOINTMENT_CREATION_FAILED.logId,
      requestId,
      errorType: errorInstance.constructor.name,
      errorMessage: errorInstance.message
    });

    if (error instanceof ValidationError) {
      logBusinessError(logger, errorInstance, { requestId, operationType: 'create' });
      return createErrorResponse(HTTP_STATUS.BAD_REQUEST, errorInstance.message, ERROR_CODES.VALIDATION_ERROR);
    }

    logInfrastructureError(logger, errorInstance, { requestId, operationType: 'create' });
    return createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Handle GET /appointments/{insuredId} - Get appointments by insured ID
 */
const handleGetAppointments = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext?.requestId || 'unknown';
  
  try {
    logger.info(LOG_EVENTS.APPOINTMENT_GET_STARTED.message, {
      logId: LOG_EVENTS.APPOINTMENT_GET_STARTED.logId,
      requestId,
      operationType: 'get'
    });

    // Get insuredId from path parameters
    const insuredId = event.pathParameters?.insuredId;
    
    if (!insuredId) {
      return createErrorResponse(
        HTTP_STATUS.BAD_REQUEST, 
        'Missing insuredId in path parameters', 
        ERROR_CODES.MISSING_INSURED_ID
      );
    }

    // Validate insuredId format (5 digits)
    const insuredIdPadded = String(insuredId).padStart(5, '0');
    if (!INSURED_ID_PATTERN.test(insuredIdPadded)) {
      return createErrorResponse(
        HTTP_STATUS.BAD_REQUEST, 
        'Invalid insuredId format. Must be 5 digits', 
        ERROR_CODES.INVALID_INSURED_ID_FORMAT
      );
    }

    // Log appointment get with masked PII
    logAppointmentGet(logger, {
      requestId,
      insuredId: insuredIdPadded
    });

    // Create DTO
    const getAppointmentsDto: GetAppointmentsDto = {
      insuredId: insuredIdPadded
    };

    // Execute use case
    const result = await getAppointmentsUseCase.execute(getAppointmentsDto);

    logger.info('Appointments retrieved successfully', {
      logId: 'appointments-retrieved-success',
      requestId,
      insuredId: maskInsuredId(insuredIdPadded),
      appointmentCount: result.appointments.length
    });

    return createSuccessResponse(HTTP_STATUS.OK, {
      appointments: result.appointments,
      pagination: {
        count: result.appointments.length
      }
    });

  } catch (error) {
    const errorInstance = error as Error;
    
    logger.error(LOG_EVENTS.APPOINTMENT_GET_FAILED.message, {
      logId: LOG_EVENTS.APPOINTMENT_GET_FAILED.logId,
      requestId,
      errorType: errorInstance.constructor.name,
      errorMessage: errorInstance.message
    });

    if (error instanceof ValidationError) {
      logBusinessError(logger, errorInstance, { requestId, operationType: 'get' });
      return createErrorResponse(HTTP_STATUS.BAD_REQUEST, errorInstance.message, ERROR_CODES.VALIDATION_ERROR);
    }

    if (error instanceof AppointmentNotFoundError) {
      return createErrorResponse(HTTP_STATUS.NOT_FOUND, errorInstance.message, ERROR_CODES.NOT_FOUND);
    }

    logInfrastructureError(logger, errorInstance, { requestId, operationType: 'get' });
    return createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error', ERROR_CODES.INTERNAL_ERROR);
  }
};

/**
 * Main Lambda handler
 */
export const main: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext?.requestId || 'unknown';
  
  try {
    logger.info('Lambda handler invoked', {
      logId: 'lambda-handler-invoked',
      requestId,
      httpMethod: event.httpMethod,
      path: event.resource || event.path
    });

    // Handle CORS preflight
    if (event.httpMethod === APPOINTMENT_API.METHODS.OPTIONS) {
      return createOptionsResponse();
    }

    // Route based on HTTP method and path
    const method = event.httpMethod;
    const path = event.resource || event.path;

    if (method === APPOINTMENT_API.METHODS.POST && path === APPOINTMENT_API.PATHS.APPOINTMENTS) {
      return await handleCreateAppointment(event);
    }

    if (method === APPOINTMENT_API.METHODS.GET && path === APPOINTMENT_API.PATHS.APPOINTMENTS_BY_INSURED) {
      return await handleGetAppointments(event);
    }

    // Route not found
    return createErrorResponse(HTTP_STATUS.NOT_FOUND, 'Route not found', ERROR_CODES.ROUTE_NOT_FOUND);

  } catch (error) {
    const errorInstance = error as Error;
    
    logger.error(LOG_EVENTS.LAMBDA_HANDLER_ERROR.message, {
      logId: LOG_EVENTS.LAMBDA_HANDLER_ERROR.logId,
      requestId,
      errorType: errorInstance.constructor.name,
      errorMessage: errorInstance.message
    });
    
    return createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error', ERROR_CODES.UNEXPECTED_ERROR);
  }
};
