/**
 * Enhanced Appointment Route Handlers - WITH ROBUST VALIDATION
 * 
 * MIGRACIÓN COMPLETA del archivo route-handlers.ts original
 * con validación robusta implementada
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

// Robust validation system
import { 
  HTTPValidator,
  CreateAppointmentBodySchema,
  GetAppointmentsPathSchema,
  GetAppointmentsQuerySchema,
  ValidationResult
} from '@medical-appointment/shared';

// Infrastructure errors and utilities
import { 
  AppointmentNotFoundError,
  ScheduleNotFoundError, 
  logBusinessError, 
  logInfrastructureError,
  maskInsuredId
} from '@medical-appointment/shared';

// Domain errors
import {
  InvalidInsuredIdError,
  UnsupportedCountryError,
  InvalidScheduleError
} from '@medical-appointment/core-domain';

// Shared utilities from functions layer (keeping existing commons)
import { 
  ApiHandlerBase, 
  HTTP_STATUS, 
  ERROR_CODES
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
 * Appointment Route Handlers with Robust Validation
 *
 * MEJORAS IMPLEMENTADAS:
 * - Validación robusta con Zod schemas
 * - Tipado fuerte automático
 * - Transformaciones automáticas de datos
 * - Mensajes de error mejorados
 * - Filtros y paginación robustos
 */
export class EnhancedAppointmentRouteHandlers {
  constructor(
    private logger: Logger,
    private createAppointmentUseCase: CreateAppointmentUseCase,
    private getAppointmentsUseCase: GetAppointmentsByInsuredIdUseCase
  ) {}

  /**
   * Handle POST /appointments - Create new appointment WITH ROBUST VALIDATION
   */
  async handleCreateAppointment(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const requestId = event.requestContext?.requestId || 'unknown';
    
    try {
      this.logger.info(LOG_EVENTS.APPOINTMENT_CREATION_STARTED.message, {
        logId: LOG_EVENTS.APPOINTMENT_CREATION_STARTED.logId,
        requestId,
        operationType: 'create'
      });

      // ROBUST VALIDATION - Replaces all manual validation
      const bodyValidation = HTTPValidator.validateBody(event, CreateAppointmentBodySchema);
      if (!bodyValidation.isValid) {
        this.logger.warn('Create appointment validation failed', {
          requestId,
          errors: bodyValidation.errors,
          errorCount: bodyValidation.errors?.length || 0
        });
        return this.createValidationErrorResponse(bodyValidation);
      }

      // TYPED DATA - requestBody is now strongly typed and validated
      const requestBody = bodyValidation.data!;
      // - requestBody.countryISO: 'PE' | 'CL' (guaranteed)
      // - requestBody.insuredId: string (exactly 5 digits, auto-padded)
      // - requestBody.scheduleId: number (positive integer, guaranteed)

      // NO MANUAL TRANSFORMATIONS NEEDED - Already done by schema
      const createAppointmentDto: CreateAppointmentDto = {
        countryISO: requestBody.countryISO,  // Already validated as 'PE' | 'CL'
        insuredId: requestBody.insuredId,     // Already padded to 5 digits
        scheduleId: requestBody.scheduleId    // Already validated as positive number
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
   * Handle GET /appointments/{insuredId} - Get appointments WITH ROBUST VALIDATION
   */
  async handleGetAppointments(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const requestId = event.requestContext?.requestId || 'unknown';
    
    try {
      this.logger.info(LOG_EVENTS.APPOINTMENT_GET_STARTED.message, {
        logId: LOG_EVENTS.APPOINTMENT_GET_STARTED.logId,
        requestId,
        operationType: 'get'
      });

      // ROBUST VALIDATION - Path parameters
      const pathValidation = HTTPValidator.validatePathParams(event, GetAppointmentsPathSchema);
      if (!pathValidation.isValid) {
        this.logger.warn('Get appointments path validation failed', {
          requestId,
          errors: pathValidation.errors
        });
        return this.createValidationErrorResponse(pathValidation);
      }

      // ROBUST VALIDATION - Query parameters (optional but validated when present)
      const queryValidation = HTTPValidator.validateQueryParams(event, GetAppointmentsQuerySchema);
      if (!queryValidation.isValid) {
        this.logger.warn('Get appointments query validation failed', {
          requestId,
          errors: queryValidation.errors
        });
        return this.createValidationErrorResponse(queryValidation);
      }

      // TYPED DATA - Auto-validated and with defaults applied
      const pathParams = pathValidation.data!;
      const queryParams = queryValidation.data!;
      
      // pathParams.insuredId is guaranteed to be exactly 5 digits (auto-padded)
      // queryParams have defaults applied: limit=20, offset=0

      // Log appointment get with masked PII
      logAppointmentGet(this.logger, {
        requestId,
        insuredId: pathParams.insuredId
      });

      // Create DTO for use case
      const getAppointmentsDto: GetAppointmentsDto = {
        insuredId: pathParams.insuredId
      };

      // Execute use case
      const result = await this.getAppointmentsUseCase.execute(getAppointmentsDto);

      // APPLY ROBUST FILTERS - Using validated query parameters
      let filteredAppointments = result.appointments;

      // Status filter (validated enum)
      if (queryParams.status) {
        filteredAppointments = filteredAppointments.filter(
          appointment => appointment.status === queryParams.status
        );
      }

      // Date range filters (validated ISO datetime strings)
      if (queryParams.startDate) {
        const startDate = new Date(queryParams.startDate);
        filteredAppointments = filteredAppointments.filter(
          appointment => new Date(appointment.createdAt) >= startDate
        );
      }

      if (queryParams.endDate) {
        const endDate = new Date(queryParams.endDate);
        filteredAppointments = filteredAppointments.filter(
          appointment => new Date(appointment.createdAt) <= endDate
        );
      }

      // ROBUST PAGINATION - Using validated parameters with guaranteed defaults
      const limit = queryParams.limit ?? 20;  // guaranteed to be 1-100, default 20
      const offset = queryParams.offset ?? 0; // guaranteed to be >=0, default 0
      const paginatedAppointments = filteredAppointments.slice(offset, offset + limit);

      this.logger.info('Appointments retrieved successfully', {
        logId: 'appointments-retrieved-success',
        requestId,
        insuredId: maskInsuredId(pathParams.insuredId),
        appointmentCount: paginatedAppointments.length,
        totalCount: filteredAppointments.length,
        appliedFilters: {
          status: queryParams.status || null,
          dateRange: [queryParams.startDate, queryParams.endDate].filter(Boolean),
          pagination: { limit, offset }
        }
      });

      // ENHANCED RESPONSE with comprehensive pagination and filters info
      return this.createSuccessResponse(HTTP_STATUS.OK, {
        appointments: paginatedAppointments,
        pagination: {
          count: paginatedAppointments.length,
          total: filteredAppointments.length,
          limit,
          offset,
          hasMore: offset + limit < filteredAppointments.length,
          totalPages: Math.ceil(filteredAppointments.length / limit),
          currentPage: Math.floor(offset / limit) + 1
        },
        filters: {
          status: queryParams.status || null,
          startDate: queryParams.startDate || null,
          endDate: queryParams.endDate || null
        },
        meta: {
          totalAvailable: result.appointments.length,
          totalFiltered: filteredAppointments.length,
          filterApplied: !!(queryParams.status || queryParams.startDate || queryParams.endDate)
        }
      });

    } catch (error) {
      return this.handleError(error as Error, requestId, 'get');
    }
  }

  /**
   * NEW: Create structured validation error response
   */
  private createValidationErrorResponse(validationResult: ValidationResult): APIGatewayProxyResult {
    const errors = validationResult.errors || [];
    
    // Group errors by field for better UX
    const fieldErrors = errors.reduce((acc, error) => {
      if (!acc[error.field]) {
        acc[error.field] = [];
      }
      acc[error.field]!.push({
        message: error.message,
        code: error.code
      });
      return acc;
    }, {} as Record<string, Array<{ message: string; code: string }>>);

    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: {
          message: 'Validation failed',
          errorCode: ERROR_CODES.VALIDATION_ERROR,
          fields: fieldErrors,
          details: {
            errorCount: errors.length,
            firstError: errors[0]?.message || 'Unknown validation error',
            timestamp: new Date().toISOString()
          }
        }
      })
    };
  }

  /**
   * ENHANCED: Error handling with better categorization
   */
  private handleError(error: Error, requestId: string, operationType: string): APIGatewayProxyResult {
    const logEvent = operationType === 'create' 
      ? LOG_EVENTS.APPOINTMENT_CREATION_FAILED 
      : LOG_EVENTS.APPOINTMENT_GET_FAILED;

    this.logger.error(logEvent.message, {
      logId: logEvent.logId,
      requestId,
      errorType: error.constructor.name,
      errorMessage: error.message,
      stackTrace: error.stack
    });

    // Domain validation errors - 400 Bad Request
    if (error instanceof InvalidInsuredIdError) {
      logBusinessError(this.logger, error, { requestId, operationType });
      return this.createErrorResponse(HTTP_STATUS.BAD_REQUEST, error.message, ERROR_CODES.VALIDATION_ERROR);
    }

    if (error instanceof UnsupportedCountryError) {
      logBusinessError(this.logger, error, { requestId, operationType });
      return this.createErrorResponse(HTTP_STATUS.BAD_REQUEST, error.message, ERROR_CODES.VALIDATION_ERROR);
    }

    if (error instanceof InvalidScheduleError) {
      logBusinessError(this.logger, error, { requestId, operationType });
      return this.createErrorResponse(HTTP_STATUS.BAD_REQUEST, error.message, ERROR_CODES.VALIDATION_ERROR);
    }

    // Business logic errors
    if (error.constructor.name === 'ValidationError') {
      logBusinessError(this.logger, error, { requestId, operationType });
      return this.createErrorResponse(HTTP_STATUS.BAD_REQUEST, error.message, ERROR_CODES.VALIDATION_ERROR);
    }

    // Not found errors - 404 Not Found
    if (error instanceof AppointmentNotFoundError) {
      logBusinessError(this.logger, error, { requestId, operationType });
      return this.createErrorResponse(HTTP_STATUS.NOT_FOUND, error.message, ERROR_CODES.NOT_FOUND);
    }

    if (error instanceof ScheduleNotFoundError) {
      logBusinessError(this.logger, error, { requestId, operationType });
      return this.createErrorResponse(HTTP_STATUS.NOT_FOUND, error.message, ERROR_CODES.NOT_FOUND);
    }

    // Value object creation errors (usually validation issues)
    if (error.message.includes('Insured ID') || error.message.includes('Country ISO')) {
      logBusinessError(this.logger, error, { requestId, operationType });
      return this.createErrorResponse(HTTP_STATUS.BAD_REQUEST, error.message, ERROR_CODES.VALIDATION_ERROR);
    }

    // Infrastructure errors - 500 Internal Server Error
    logInfrastructureError(this.logger, error, { requestId, operationType });
    return this.createErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal server error', ERROR_CODES.INTERNAL_ERROR);
  }

  /**
   * Helper methods using existing commons
   */
  private createSuccessResponse(statusCode: number, data: any): APIGatewayProxyResult {
    return new ApiHandlerBase([], this.logger).createSuccessResponse(statusCode, data);
  }

  private createErrorResponse(statusCode: number, message: string, errorCode: string): APIGatewayProxyResult {
    return new ApiHandlerBase([], this.logger).createErrorResponse(statusCode, message, errorCode);
  }
}

/**
 * MIGRATION HELPER: Backward compatible export
 * Permite usar la nueva clase con el mismo nombre que antes
 */
export const AppointmentRouteHandlers = EnhancedAppointmentRouteHandlers;
