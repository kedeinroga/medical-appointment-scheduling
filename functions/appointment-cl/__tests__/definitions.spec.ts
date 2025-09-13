import {
  HandlerDependencies,
  HandlerConfig,
  ProcessingResult,
  BatchProcessingSummary,
  MessageContext,
  ParsedMessageData,
  ValidationError,
  BusinessError,
  InfrastructureError,
  ProcessingError,
  AppointmentCLHandler,
  HANDLER_CONSTANTS
} from '../definitions';

describe('Appointment CL Definitions', () => {
  describe('interfaces and types', () => {
    it('should define HandlerDependencies interface correctly', () => {
      const dependencies: HandlerDependencies = {
        processAppointmentUseCase: {} as any,
        appointmentRepository: {} as any,
        logger: {} as any
      };

      expect(dependencies).toBeDefined();
      expect(typeof dependencies.processAppointmentUseCase).toBe('object');
      expect(typeof dependencies.appointmentRepository).toBe('object');
      expect(typeof dependencies.logger).toBe('object');
    });

    it('should define HandlerConfig interface correctly', () => {
      const config: HandlerConfig = {
        targetCountry: 'CL',
        batchSize: 10,
        maxRetries: 3,
        processingTimeout: 30000
      };

      expect(config.targetCountry).toBe('CL');
      expect(typeof config.batchSize).toBe('number');
      expect(typeof config.maxRetries).toBe('number');
      expect(typeof config.processingTimeout).toBe('number');
    });

    it('should define ProcessingResult interface correctly', () => {
      const successResult: ProcessingResult = {
        messageId: 'msg-123',
        success: true,
        appointmentId: 'apt-456'
      };

      const errorResult: ProcessingResult = {
        messageId: 'msg-789',
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid data',
          type: 'VALIDATION'
        }
      };

      const skippedResult: ProcessingResult = {
        messageId: 'msg-456',
        success: false,
        skipped: {
          reason: 'Wrong country',
          details: 'Expected CL but got PE'
        }
      };

      expect(successResult.success).toBe(true);
      expect(successResult.appointmentId).toBe('apt-456');
      
      expect(errorResult.success).toBe(false);
      expect(errorResult.error?.type).toBe('VALIDATION');
      
      expect(skippedResult.skipped?.reason).toBe('Wrong country');
    });

    it('should define BatchProcessingSummary interface correctly', () => {
      const summary: BatchProcessingSummary = {
        totalRecords: 5,
        processedSuccessfully: 3,
        failed: 1,
        skipped: 1,
        results: [],
        executionTime: 1500
      };

      expect(summary.totalRecords).toBe(5);
      expect(summary.processedSuccessfully + summary.failed + summary.skipped).toBe(5);
      expect(Array.isArray(summary.results)).toBe(true);
      expect(typeof summary.executionTime).toBe('number');
    });

    it('should define MessageContext interface correctly', () => {
      const context: MessageContext = {
        messageId: 'msg-123',
        receiptHandle: 'receipt-456',
        timestamp: '2025-09-13T10:00:00Z',
        requestId: 'req-789',
        country: 'CL'
      };

      expect(context.country).toBe('CL');
      expect(typeof context.messageId).toBe('string');
      expect(typeof context.receiptHandle).toBe('string');
      expect(typeof context.timestamp).toBe('string');
      expect(typeof context.requestId).toBe('string');
    });

    it('should define ParsedMessageData interface correctly', () => {
      const parsedData: ParsedMessageData = {
        snsMessage: {
          messageId: 'sns-123',
          type: 'Notification',
          timestamp: '2025-09-13T10:00:00Z',
          subject: 'Appointment Created'
        },
        appointmentPayload: {
          appointmentId: 'apt-456',
          insuredId: '12345',
          countryISO: 'CL',
          scheduleId: 100,
          status: 'PENDING',
          createdAt: '2025-09-13T10:00:00Z',
          metadata: {
            source: 'api',
            version: '1.0'
          }
        }
      };

      expect(parsedData.appointmentPayload.countryISO).toBe('CL');
      expect(typeof parsedData.snsMessage.messageId).toBe('string');
      expect(typeof parsedData.appointmentPayload.scheduleId).toBe('number');
    });
  });

  describe('error types', () => {
    it('should define ValidationError type correctly', () => {
      const validationError: ValidationError = {
        type: 'VALIDATION',
        code: 'INVALID_MESSAGE_FORMAT',
        message: 'Message format is invalid',
        details: { field: 'countryISO' }
      };

      expect(validationError.type).toBe('VALIDATION');
      expect(['INVALID_MESSAGE_FORMAT', 'INVALID_COUNTRY', 'MISSING_REQUIRED_FIELDS'])
        .toContain(validationError.code);
      expect(typeof validationError.message).toBe('string');
    });

    it('should define BusinessError type correctly', () => {
      const businessError: BusinessError = {
        type: 'BUSINESS',
        code: 'APPOINTMENT_NOT_FOUND',
        message: 'Appointment not found',
        details: { appointmentId: 'apt-123' }
      };

      expect(businessError.type).toBe('BUSINESS');
      expect(['APPOINTMENT_NOT_FOUND', 'INVALID_STATUS_TRANSITION', 'PROCESSING_RULE_VIOLATION'])
        .toContain(businessError.code);
      expect(typeof businessError.message).toBe('string');
    });

    it('should define InfrastructureError type correctly', () => {
      const infraError: InfrastructureError = {
        type: 'INFRASTRUCTURE',
        code: 'DATABASE_ERROR',
        message: 'Database connection failed',
        details: { connectionTimeout: true }
      };

      expect(infraError.type).toBe('INFRASTRUCTURE');
      expect(['DATABASE_ERROR', 'EVENT_PUBLISHING_ERROR', 'EXTERNAL_SERVICE_ERROR'])
        .toContain(infraError.code);
      expect(typeof infraError.message).toBe('string');
    });

    it('should support ProcessingError union type', () => {
      const errors: ProcessingError[] = [
        {
          type: 'VALIDATION',
          code: 'INVALID_COUNTRY',
          message: 'Invalid country'
        },
        {
          type: 'BUSINESS',
          code: 'APPOINTMENT_NOT_FOUND',
          message: 'Not found'
        },
        {
          type: 'INFRASTRUCTURE',
          code: 'DATABASE_ERROR',
          message: 'DB error'
        }
      ];

      expect(errors).toHaveLength(3);
      expect(errors[0].type).toBe('VALIDATION');
      expect(errors[1].type).toBe('BUSINESS');
      expect(errors[2].type).toBe('INFRASTRUCTURE');
    });
  });

  describe('handler function type', () => {
    it('should define AppointmentCLHandler type correctly', () => {
      const mockHandler: AppointmentCLHandler = async (event, context, dependencies) => {
        return {
          totalRecords: event.Records.length,
          processedSuccessfully: 0,
          failed: 0,
          skipped: 0,
          results: [],
          executionTime: 0
        };
      };

      expect(typeof mockHandler).toBe('function');
      expect(mockHandler.length).toBe(3); // event, context, dependencies
    });

    it('should handle optional dependencies parameter', () => {
      const mockHandler: AppointmentCLHandler = async (event, context, dependencies = {}) => {
        const deps = dependencies || {};
        return {
          totalRecords: 1,
          processedSuccessfully: 1,
          failed: 0,
          skipped: 0,
          results: [],
          executionTime: 100
        };
      };

      expect(typeof mockHandler).toBe('function');
    });
  });

  describe('constants', () => {
    it('should define HANDLER_CONSTANTS correctly', () => {
      expect(HANDLER_CONSTANTS.TARGET_COUNTRY).toBe('CL');
      expect(HANDLER_CONSTANTS.MAX_BATCH_SIZE).toBe(10);
      expect(HANDLER_CONSTANTS.DEFAULT_TIMEOUT).toBe(30000);
      expect(HANDLER_CONSTANTS.MAX_RETRIES).toBe(3);
    });

    it('should define log events constants', () => {
      const logEvents = HANDLER_CONSTANTS.LOG_EVENTS;
      
      expect(logEvents.BATCH_PROCESSING_STARTED).toBe('cl-batch-processing-started');
      expect(logEvents.RECORD_PROCESSING_STARTED).toBe('cl-record-processing-started');
      expect(logEvents.RECORD_PROCESSING_COMPLETED).toBe('cl-record-processing-completed');
      expect(logEvents.RECORD_PROCESSING_FAILED).toBe('cl-record-processing-failed');
      expect(logEvents.RECORD_SKIPPED).toBe('cl-record-skipped');
      expect(logEvents.BATCH_PROCESSING_COMPLETED).toBe('cl-batch-processing-completed');
    });

    it('should have consistent country naming in constants', () => {
      expect(HANDLER_CONSTANTS.TARGET_COUNTRY).toBe('CL');
      
      // All log events should include 'cl' prefix
      Object.values(HANDLER_CONSTANTS.LOG_EVENTS).forEach(eventName => {
        expect(eventName).toMatch(/^cl-/);
      });
    });

    it('should have reasonable default values', () => {
      expect(HANDLER_CONSTANTS.MAX_BATCH_SIZE).toBeGreaterThan(0);
      expect(HANDLER_CONSTANTS.MAX_BATCH_SIZE).toBeLessThanOrEqual(10); // SQS batch limit
      expect(HANDLER_CONSTANTS.DEFAULT_TIMEOUT).toBeGreaterThan(1000); // At least 1 second
      expect(HANDLER_CONSTANTS.DEFAULT_TIMEOUT).toBeLessThanOrEqual(900000); // Less than 15 minutes
      expect(HANDLER_CONSTANTS.MAX_RETRIES).toBeGreaterThanOrEqual(0);
      expect(HANDLER_CONSTANTS.MAX_RETRIES).toBeLessThanOrEqual(10);
    });
  });

  describe('type compatibility', () => {
    it('should ensure error codes are compatible with their types', () => {
      // Test that validation error codes are valid
      const validationCodes: ValidationError['code'][] = [
        'INVALID_MESSAGE_FORMAT',
        'INVALID_COUNTRY',
        'MISSING_REQUIRED_FIELDS'
      ];

      validationCodes.forEach(code => {
        const error: ValidationError = {
          type: 'VALIDATION',
          code,
          message: 'Test message'
        };
        expect(error.code).toBe(code);
      });

      // Test that business error codes are valid
      const businessCodes: BusinessError['code'][] = [
        'APPOINTMENT_NOT_FOUND',
        'INVALID_STATUS_TRANSITION',
        'PROCESSING_RULE_VIOLATION'
      ];

      businessCodes.forEach(code => {
        const error: BusinessError = {
          type: 'BUSINESS',
          code,
          message: 'Test message'
        };
        expect(error.code).toBe(code);
      });

      // Test that infrastructure error codes are valid
      const infraCodes: InfrastructureError['code'][] = [
        'DATABASE_ERROR',
        'EVENT_PUBLISHING_ERROR',
        'EXTERNAL_SERVICE_ERROR'
      ];

      infraCodes.forEach(code => {
        const error: InfrastructureError = {
          type: 'INFRASTRUCTURE',
          code,
          message: 'Test message'
        };
        expect(error.code).toBe(code);
      });
    });

    it('should ensure country types are consistent', () => {
      const config: HandlerConfig = {
        targetCountry: 'CL',
        batchSize: 1,
        maxRetries: 1,
        processingTimeout: 1000
      };

      const context: MessageContext = {
        messageId: 'msg-1',
        receiptHandle: 'receipt-1',
        timestamp: '2025-09-13T10:00:00Z',
        requestId: 'req-1',
        country: 'CL'
      };

      const payload: ParsedMessageData['appointmentPayload'] = {
        appointmentId: 'apt-1',
        insuredId: '12345',
        countryISO: 'CL',
        scheduleId: 1,
        status: 'PENDING',
        createdAt: '2025-09-13T10:00:00Z'
      };

      expect(config.targetCountry).toBe('CL');
      expect(context.country).toBe('CL');
      expect(payload.countryISO).toBe('CL');
      expect(HANDLER_CONSTANTS.TARGET_COUNTRY).toBe('CL');
    });
  });
});
