/**
 * Extended Route Handlers Tests
 * Tests to improve coverage for appointment route handlers
 */

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { EnhancedAppointmentRouteHandlers } from '../route-handlers';
import { CreateAppointmentUseCase, GetAppointmentsByInsuredIdUseCase } from '@medical-appointment/core-use-cases';
import { ScheduleNotFoundError } from '@medical-appointment/shared';
import {
  InvalidInsuredIdError,
  UnsupportedCountryError,
  InvalidScheduleError
} from '@medical-appointment/core-domain';

// Mock dependencies
jest.mock('@medical-appointment/core-use-cases');
jest.mock('@aws-lambda-powertools/logger');

describe('EnhancedAppointmentRouteHandlers - Extended Coverage', () => {
  let routeHandlers: EnhancedAppointmentRouteHandlers;
  let mockLogger: jest.Mocked<Logger>;
  let mockCreateAppointmentUseCase: jest.Mocked<CreateAppointmentUseCase>;
  let mockGetAppointmentsUseCase: jest.Mocked<GetAppointmentsByInsuredIdUseCase>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    mockCreateAppointmentUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetAppointmentsUseCase = {
      execute: jest.fn(),
    } as any;

    routeHandlers = new EnhancedAppointmentRouteHandlers(
      mockLogger,
      mockCreateAppointmentUseCase,
      mockGetAppointmentsUseCase
    );
  });

  // Helper to create mock events
  const createMockEvent = (overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent => ({
    httpMethod: 'POST',
    path: '/appointments',
    body: null,
    headers: {
      'Content-Type': 'application/json',
    },
    requestContext: {
      requestId: 'test-request-id',
    },
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    isBase64Encoded: false,
    resource: '',
    stageVariables: null,
    multiValueHeaders: {},
    ...overrides
  } as any);

  describe('handleCreateAppointment - Extended Coverage', () => {
    it('should handle missing request context gracefully', async () => {
      const mockEvent = createMockEvent({
        requestContext: undefined,
        body: JSON.stringify({
          countryISO: 'PE',
          insuredId: '12345',
          scheduleId: 1
        })
      } as any);

      mockCreateAppointmentUseCase.execute.mockResolvedValue({
        appointmentId: 'test-id',
        message: 'Success',
        status: 'pending'
      });

      const result = await routeHandlers.handleCreateAppointment(mockEvent);

      expect(result.statusCode).toBe(201);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          requestId: 'unknown'
        })
      );
    });

    it('should handle body validation errors with detailed response', async () => {
      const mockEvent = createMockEvent({
        body: JSON.stringify({
          countryISO: 'INVALID_COUNTRY',
          // Missing required fields
        })
      });

      const result = await routeHandlers.handleCreateAppointment(mockEvent);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.errorCode).toBe('VALIDATION_ERROR');
      expect(responseBody.error.details).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Create appointment validation failed',
        expect.objectContaining({
          requestId: 'test-request-id',
          errors: expect.any(Array)
        })
      );
    });

    it('should handle InvalidInsuredIdError from domain', async () => {
      const mockEvent = createMockEvent({
        body: JSON.stringify({
          countryISO: 'PE',
          insuredId: '12345',
          scheduleId: 1
        })
      });

      const domainError = new InvalidInsuredIdError('abc12');
      mockCreateAppointmentUseCase.execute.mockRejectedValue(domainError);

      const result = await routeHandlers.handleCreateAppointment(mockEvent);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.errorCode).toBe('VALIDATION_ERROR');
      expect(responseBody.error.message).toContain('Invalid insured ID: abc12');
    });

    it('should handle UnsupportedCountryError from domain', async () => {
      const mockEvent = createMockEvent({
        body: JSON.stringify({
          countryISO: 'PE',
          insuredId: '12345',
          scheduleId: 1
        })
      });

      const domainError = new UnsupportedCountryError('US');
      mockCreateAppointmentUseCase.execute.mockRejectedValue(domainError);

      const result = await routeHandlers.handleCreateAppointment(mockEvent);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.errorCode).toBe('VALIDATION_ERROR');
      expect(responseBody.error.message).toContain('Country US is not supported');
    });

    it('should handle InvalidScheduleError from domain', async () => {
      const mockEvent = createMockEvent({
        body: JSON.stringify({
          countryISO: 'PE',
          insuredId: '12345',
          scheduleId: 1
        })
      });

      const domainError = new InvalidScheduleError('Schedule date cannot be in the past');
      mockCreateAppointmentUseCase.execute.mockRejectedValue(domainError);

      const result = await routeHandlers.handleCreateAppointment(mockEvent);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.errorCode).toBe('VALIDATION_ERROR');
      expect(responseBody.error.message).toContain('Invalid schedule: Schedule date cannot be in the past');
    });

    it('should handle ScheduleNotFoundError', async () => {
      const mockEvent = createMockEvent({
        body: JSON.stringify({
          countryISO: 'PE',
          insuredId: '12345',
          scheduleId: 999
        })
      });

      const notFoundError = new ScheduleNotFoundError('999 for country PE');
      mockCreateAppointmentUseCase.execute.mockRejectedValue(notFoundError);

      const result = await routeHandlers.handleCreateAppointment(mockEvent);

      expect(result.statusCode).toBe(404);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.errorCode).toBe('NOT_FOUND');
      expect(responseBody.error.message).toContain('Schedule with ID 999 for country PE not found');
    });

    it('should handle value object creation errors', async () => {
      const mockEvent = createMockEvent({
        body: JSON.stringify({
          countryISO: 'PE',
          insuredId: '12345',
          scheduleId: 1
        })
      });

      const valueObjectError = new Error('Insured ID cannot be empty');
      mockCreateAppointmentUseCase.execute.mockRejectedValue(valueObjectError);

      const result = await routeHandlers.handleCreateAppointment(mockEvent);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.errorCode).toBe('VALIDATION_ERROR');
      expect(responseBody.error.message).toContain('Insured ID cannot be empty');
    });

    it('should handle Country ISO validation errors', async () => {
      const mockEvent = createMockEvent({
        body: JSON.stringify({
          countryISO: 'PE',
          insuredId: '12345',
          scheduleId: 1
        })
      });

      const countryError = new Error('Country ISO cannot be null');
      mockCreateAppointmentUseCase.execute.mockRejectedValue(countryError);

      const result = await routeHandlers.handleCreateAppointment(mockEvent);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should handle validation errors using legacy error constructor name', async () => {
      const mockEvent = createMockEvent({
        body: JSON.stringify({
          countryISO: 'PE',
          insuredId: '12345',
          scheduleId: 1
        })
      });

      // Create error with specific constructor name
      const validationError = new Error('Validation failed');
      Object.defineProperty(validationError, 'constructor', {
        value: { name: 'ValidationError' }
      });

      mockCreateAppointmentUseCase.execute.mockRejectedValue(validationError);

      const result = await routeHandlers.handleCreateAppointment(mockEvent);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should handle infrastructure errors as 500', async () => {
      const mockEvent = createMockEvent({
        body: JSON.stringify({
          countryISO: 'PE',
          insuredId: '12345',
          scheduleId: 1
        })
      });

      const infraError = new Error('Database connection failed');
      mockCreateAppointmentUseCase.execute.mockRejectedValue(infraError);

      const result = await routeHandlers.handleCreateAppointment(mockEvent);

      expect(result.statusCode).toBe(500);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.errorCode).toBe('INTERNAL_ERROR');
      expect(responseBody.error.message).toBe('Internal server error');
    });

    it('should log successful appointment creation', async () => {
      const mockEvent = createMockEvent({
        body: JSON.stringify({
          countryISO: 'PE',
          insuredId: '12345',
          scheduleId: 1
        })
      });

      mockCreateAppointmentUseCase.execute.mockResolvedValue({
        appointmentId: 'test-appointment-id',
        message: 'Appointment scheduling is in process',
        status: 'pending'
      });

      const result = await routeHandlers.handleCreateAppointment(mockEvent);

      expect(result.statusCode).toBe(201);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Appointment created successfully',
        expect.objectContaining({
          logId: 'appointment-created-success',
          requestId: 'test-request-id',
          appointmentId: 'test-appointment-id',
          status: 'pending'
        })
      );
    });
  });

  describe('handleGetAppointments - Extended Coverage', () => {
    it('should handle missing request context gracefully', async () => {
      const mockEvent = createMockEvent({
        httpMethod: 'GET',
        pathParameters: {
          insuredId: '12345'
        },
        requestContext: undefined
      } as any);

      mockGetAppointmentsUseCase.execute.mockResolvedValue({
        appointments: []
      });

      const result = await routeHandlers.handleGetAppointments(mockEvent);

      expect(result.statusCode).toBe(200);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          requestId: 'unknown'
        })
      );
    });

    it('should handle path parameter validation errors', async () => {
      const mockEvent = createMockEvent({
        httpMethod: 'GET',
        pathParameters: {
          insuredId: 'invalid'  // Invalid format
        }
      });

      const result = await routeHandlers.handleGetAppointments(mockEvent);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.errorCode).toBe('VALIDATION_ERROR');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Get appointments path validation failed',
        expect.objectContaining({
          requestId: 'test-request-id'
        })
      );
    });

    it('should handle query parameter validation errors', async () => {
      const mockEvent = createMockEvent({
        httpMethod: 'GET',
        pathParameters: {
          insuredId: '12345'
        },
        queryStringParameters: {
          limit: '200', // Exceeds maximum
          offset: '-1'  // Below minimum
        }
      });

      const result = await routeHandlers.handleGetAppointments(mockEvent);

      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.errorCode).toBe('VALIDATION_ERROR');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Get appointments query validation failed',
        expect.objectContaining({
          requestId: 'test-request-id'
        })
      );
    });

    it('should handle use case errors', async () => {
      const mockEvent = createMockEvent({
        httpMethod: 'GET',
        pathParameters: {
          insuredId: '12345'
        }
      });

      const useCaseError = new Error('Repository connection failed');
      mockGetAppointmentsUseCase.execute.mockRejectedValue(useCaseError);

      const result = await routeHandlers.handleGetAppointments(mockEvent);

      expect(result.statusCode).toBe(500);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.errorCode).toBe('INTERNAL_ERROR');
    });

    it('should log successful appointments retrieval', async () => {
      const mockEvent = createMockEvent({
        httpMethod: 'GET',
        pathParameters: {
          insuredId: '12345'
        },
        queryStringParameters: {
          status: 'pending',
          limit: '10'
        }
      });

      const mockAppointments = [
        {
          appointmentId: 'app-1',
          insuredId: '12345',
          status: 'pending'
        }
      ];

      mockGetAppointmentsUseCase.execute.mockResolvedValue({
        appointments: mockAppointments
      });

      const result = await routeHandlers.handleGetAppointments(mockEvent);

      expect(result.statusCode).toBe(200);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.appointments).toEqual(mockAppointments);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Appointments retrieved successfully',
        expect.objectContaining({
          logId: 'appointments-retrieved-success',
          requestId: 'test-request-id',
          insuredId: expect.any(String),
          appointmentCount: 1
        })
      );
    });

    it('should handle appointments with filtering', async () => {
      const mockEvent = createMockEvent({
        httpMethod: 'GET',
        pathParameters: {
          insuredId: '12345'
        },
        queryStringParameters: {
          status: 'completed',
          limit: '5',
          offset: '0'
        }
      });

      mockGetAppointmentsUseCase.execute.mockResolvedValue({
        appointments: []
      });

      const result = await routeHandlers.handleGetAppointments(mockEvent);

      expect(result.statusCode).toBe(200);
      expect(mockGetAppointmentsUseCase.execute).toHaveBeenCalledWith({
        insuredId: '12345'
      });
    });
  });

  describe('Error logging verification', () => {
    it('should log errors with proper structure for create operations', async () => {
      const mockEvent = createMockEvent({
        body: JSON.stringify({
          countryISO: 'PE',
          insuredId: '12345',
          scheduleId: 1
        })
      });

      const error = new Error('Test error with stack');
      error.stack = 'Error: Test error\n    at test (file:1:1)';
      mockCreateAppointmentUseCase.execute.mockRejectedValue(error);

      await routeHandlers.handleCreateAppointment(mockEvent);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          requestId: 'test-request-id',
          errorType: 'Error',
          errorMessage: 'Test error with stack',
          stackTrace: expect.stringContaining('Error: Test error')
        })
      );
    });

    it('should log errors with proper structure for get operations', async () => {
      const mockEvent = createMockEvent({
        httpMethod: 'GET',
        pathParameters: {
          insuredId: '12345'
        }
      });

      const error = new Error('Get operation error');
      mockGetAppointmentsUseCase.execute.mockRejectedValue(error);

      await routeHandlers.handleGetAppointments(mockEvent);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          requestId: 'test-request-id',
          errorType: 'Error',
          errorMessage: 'Get operation error'
        })
      );
    });
  });
});
