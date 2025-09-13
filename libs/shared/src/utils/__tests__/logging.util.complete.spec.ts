import { Logger } from '@aws-lambda-powertools/logger';
import {
  LogType,
  logBusinessError,
  logInfrastructureError,
  logValidationError,
  logIntegrationError
} from '../logging.util';

describe('Logging Utilities - Complete Coverage', () => {
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('LogType enum', () => {
    it('should have all expected log types', () => {
      expect(LogType.BUSINESS_ERROR).toBe('business_error');
      expect(LogType.INFRASTRUCTURE_ERROR).toBe('infrastructure_error');
      expect(LogType.VALIDATION_ERROR).toBe('validation_error');
      expect(LogType.INTEGRATION_ERROR).toBe('integration_error');
    });

    it('should have unique values for each log type', () => {
      const values = Object.values(LogType);
      const uniqueValues = [...new Set(values)];
      expect(values).toHaveLength(uniqueValues.length);
    });
  });

  describe('logBusinessError', () => {
    it('should log business error with minimal parameters', () => {
      const error = new Error('Test business error');

      logBusinessError(mockLogger, error);

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith('Business error occurred', {
        errorType: LogType.BUSINESS_ERROR,
        errorMessage: 'Test business error',
        errorStack: error.stack
      });
    });

    it('should log business error with additional context', () => {
      const error = new Error('Business logic failed');
      const context = {
        userId: '12345',
        operation: 'createAppointment',
        appointmentId: 'apt-123'
      };

      logBusinessError(mockLogger, error, context);

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith('Business error occurred', {
        errorType: LogType.BUSINESS_ERROR,
        errorMessage: 'Business logic failed',
        errorStack: error.stack,
        userId: '12345',
        operation: 'createAppointment',
        appointmentId: 'apt-123'
      });
    });

    it('should handle error without stack trace', () => {
      const error = new Error('Test error');
      error.stack = undefined;

      logBusinessError(mockLogger, error);

      expect(mockLogger.error).toHaveBeenCalledWith('Business error occurred', {
        errorType: LogType.BUSINESS_ERROR,
        errorMessage: 'Test error',
        errorStack: undefined
      });
    });

    it('should handle empty context object', () => {
      const error = new Error('Test error');

      logBusinessError(mockLogger, error, {});

      expect(mockLogger.error).toHaveBeenCalledWith('Business error occurred', {
        errorType: LogType.BUSINESS_ERROR,
        errorMessage: 'Test error',
        errorStack: error.stack
      });
    });
  });

  describe('logInfrastructureError', () => {
    it('should log infrastructure error with minimal parameters', () => {
      const error = new Error('Database connection failed');

      logInfrastructureError(mockLogger, error);

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith('Infrastructure error occurred', {
        errorType: LogType.INFRASTRUCTURE_ERROR,
        errorMessage: 'Database connection failed',
        errorStack: error.stack
      });
    });

    it('should log infrastructure error with additional context', () => {
      const error = new Error('AWS service unavailable');
      const context = {
        service: 'RDS',
        region: 'us-east-1',
        retryAttempt: 3
      };

      logInfrastructureError(mockLogger, error, context);

      expect(mockLogger.error).toHaveBeenCalledWith('Infrastructure error occurred', {
        errorType: LogType.INFRASTRUCTURE_ERROR,
        errorMessage: 'AWS service unavailable',
        errorStack: error.stack,
        service: 'RDS',
        region: 'us-east-1',
        retryAttempt: 3
      });
    });

    it('should handle complex nested context', () => {
      const error = new Error('SNS publish failed');
      const context = {
        topic: 'appointment-events',
        messageAttributes: {
          country: 'PE',
          type: 'appointment_created'
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
          requestId: 'req-123'
        }
      };

      logInfrastructureError(mockLogger, error, context);

      expect(mockLogger.error).toHaveBeenCalledWith('Infrastructure error occurred', {
        errorType: LogType.INFRASTRUCTURE_ERROR,
        errorMessage: 'SNS publish failed',
        errorStack: error.stack,
        topic: 'appointment-events',
        messageAttributes: {
          country: 'PE',
          type: 'appointment_created'
        },
        metadata: {
          timestamp: '2024-01-01T00:00:00Z',
          requestId: 'req-123'
        }
      });
    });
  });

  describe('logValidationError', () => {
    it('should log validation error with minimal parameters', () => {
      const error = new Error('Invalid email format');

      logValidationError(mockLogger, error);

      expect(mockLogger.warn).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalledWith('Validation error occurred', {
        errorType: LogType.VALIDATION_ERROR,
        errorMessage: 'Invalid email format'
      });
    });

    it('should log validation error with additional context', () => {
      const error = new Error('Required field missing');
      const context = {
        field: 'phoneNumber',
        value: null,
        validationRule: 'required'
      };

      logValidationError(mockLogger, error, context);

      expect(mockLogger.warn).toHaveBeenCalledWith('Validation error occurred', {
        errorType: LogType.VALIDATION_ERROR,
        errorMessage: 'Required field missing',
        field: 'phoneNumber',
        value: null,
        validationRule: 'required'
      });
    });

    it('should not include error stack in validation logs', () => {
      const error = new Error('Validation failed');
      error.stack = 'some stack trace';

      logValidationError(mockLogger, error);

      const call = mockLogger.warn.mock.calls[0][1];
      expect(call).not.toHaveProperty('errorStack');
      expect(call).toEqual({
        errorType: LogType.VALIDATION_ERROR,
        errorMessage: 'Validation failed'
      });
    });

    it('should handle validation context with arrays', () => {
      const error = new Error('Multiple validation failures');
      const context = {
        failedFields: ['email', 'phone', 'country'],
        validationRules: ['format', 'required', 'enum']
      };

      logValidationError(mockLogger, error, context);

      expect(mockLogger.warn).toHaveBeenCalledWith('Validation error occurred', {
        errorType: LogType.VALIDATION_ERROR,
        errorMessage: 'Multiple validation failures',
        failedFields: ['email', 'phone', 'country'],
        validationRules: ['format', 'required', 'enum']
      });
    });
  });

  describe('logIntegrationError', () => {
    it('should log integration error with minimal parameters', () => {
      const error = new Error('API call failed');

      logIntegrationError(mockLogger, error);

      expect(mockLogger.error).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith('Integration error occurred', {
        errorType: LogType.INTEGRATION_ERROR,
        errorMessage: 'API call failed',
        errorStack: error.stack
      });
    });

    it('should log integration error with additional context', () => {
      const error = new Error('Third-party service timeout');
      const context = {
        service: 'payment-gateway',
        endpoint: '/api/v1/payments',
        timeout: 30000,
        httpStatus: 408
      };

      logIntegrationError(mockLogger, error, context);

      expect(mockLogger.error).toHaveBeenCalledWith('Integration error occurred', {
        errorType: LogType.INTEGRATION_ERROR,
        errorMessage: 'Third-party service timeout',
        errorStack: error.stack,
        service: 'payment-gateway',
        endpoint: '/api/v1/payments',
        timeout: 30000,
        httpStatus: 408
      });
    });

    it('should handle HTTP response context', () => {
      const error = new Error('HTTP 500 Internal Server Error');
      const context = {
        method: 'POST',
        url: 'https://api.external.com/webhook',
        status: 500,
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'req-456'
        },
        responseBody: {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      };

      logIntegrationError(mockLogger, error, context);

      expect(mockLogger.error).toHaveBeenCalledWith('Integration error occurred', {
        errorType: LogType.INTEGRATION_ERROR,
        errorMessage: 'HTTP 500 Internal Server Error',
        errorStack: error.stack,
        method: 'POST',
        url: 'https://api.external.com/webhook',
        status: 500,
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'req-456'
        },
        responseBody: {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        }
      });
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle errors with undefined message', () => {
      const error = new Error();
      error.message = undefined as any;

      logBusinessError(mockLogger, error);

      expect(mockLogger.error).toHaveBeenCalledWith('Business error occurred', {
        errorType: LogType.BUSINESS_ERROR,
        errorMessage: undefined,
        errorStack: error.stack
      });
    });

    it('should handle null context', () => {
      const error = new Error('Test error');

      logInfrastructureError(mockLogger, error, null as any);

      expect(mockLogger.error).toHaveBeenCalledWith('Infrastructure error occurred', {
        errorType: LogType.INFRASTRUCTURE_ERROR,
        errorMessage: 'Test error',
        errorStack: error.stack
      });
    });

    it('should handle context with undefined values', () => {
      const error = new Error('Test error');
      const context = {
        definedValue: 'test',
        undefinedValue: undefined,
        nullValue: null
      };

      logValidationError(mockLogger, error, context);

      expect(mockLogger.warn).toHaveBeenCalledWith('Validation error occurred', {
        errorType: LogType.VALIDATION_ERROR,
        errorMessage: 'Test error',
        definedValue: 'test',
        undefinedValue: undefined,
        nullValue: null
      });
    });
  });

  describe('Logger method verification', () => {
    it('should use error level for business errors', () => {
      const error = new Error('Test');
      logBusinessError(mockLogger, error);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });

    it('should use error level for infrastructure errors', () => {
      const error = new Error('Test');
      logInfrastructureError(mockLogger, error);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });

    it('should use warn level for validation errors', () => {
      const error = new Error('Test');
      logValidationError(mockLogger, error);

      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });

    it('should use error level for integration errors', () => {
      const error = new Error('Test');
      logIntegrationError(mockLogger, error);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });
  });
});
