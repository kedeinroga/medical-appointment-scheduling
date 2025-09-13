import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, SQSEvent } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';

import { LambdaHandlerAdapter } from '../lambda-handler.adapter';
import { ValidationError } from '../../../errors/aws.errors';
import { UseCaseFactory } from '../../../factories/use-case.factory';

// Mock dependencies
jest.mock('@aws-lambda-powertools/logger');
jest.mock('../../../factories/use-case.factory');

describe('LambdaHandlerAdapter', () => {
  let adapter: LambdaHandlerAdapter;
  let mockLogger: jest.Mocked<Logger>;
  let mockUseCaseFactory: jest.Mocked<typeof UseCaseFactory>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    (Logger as jest.MockedClass<typeof Logger>).mockImplementation(() => mockLogger);

    // Mock UseCaseFactory
    mockUseCaseFactory = UseCaseFactory as jest.Mocked<typeof UseCaseFactory>;

    adapter = new LambdaHandlerAdapter();
  });

  describe('constructor', () => {
    it('should initialize with logger', () => {
      expect(Logger).toHaveBeenCalledWith({
        serviceName: 'lambda-handler-adapter'
      });
    });
  });

  describe('handleAPIGateway', () => {
    const mockContext: Context = {
      awsRequestId: 'test-request-id',
      functionName: 'test-function',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
      memoryLimitInMB: '128',
      logGroupName: '/aws/lambda/test',
      logStreamName: '2023/01/01/[1]test',
      callbackWaitsForEmptyEventLoop: false,
      getRemainingTimeInMillis: () => 30000,
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn()
    };

    it('should handle POST request for creating appointment', async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/appointments',
        body: JSON.stringify({
          insuredId: '12345',
          scheduleId: 1,
          countryISO: 'PE'
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      const mockUseCase = {
        execute: jest.fn().mockResolvedValue({
          appointmentId: 'apt-123',
          status: 'scheduled'
        })
      };

      mockUseCaseFactory.createCreateAppointmentUseCase.mockReturnValue(mockUseCase);

      const result = await adapter.handleAPIGateway(mockEvent, mockContext);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toEqual({
        appointmentId: 'apt-123',
        status: 'scheduled'
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Processing API Gateway request', {
        awsRequestId: 'test-request-id',
        httpMethod: 'POST',
        path: '/appointments'
      });
    });

    it('should handle GET request for retrieving appointments', async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/appointments/12345',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: { insuredId: '12345' },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      const mockUseCase = {
        execute: jest.fn().mockResolvedValue({
          appointments: [
            { id: 'apt-1', status: 'scheduled' },
            { id: 'apt-2', status: 'completed' }
          ]
        })
      };

      mockUseCaseFactory.createGetAppointmentsByInsuredIdUseCase.mockReturnValue(mockUseCase);

      const result = await adapter.handleAPIGateway(mockEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({
        appointments: [
          { id: 'apt-1', status: 'scheduled' },
          { id: 'apt-2', status: 'completed' }
        ]
      });
    });

    it('should return 405 for unsupported HTTP methods', async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: 'DELETE',
        path: '/appointments',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      const result = await adapter.handleAPIGateway(mockEvent, mockContext);

      expect(result.statusCode).toBe(405);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Method not allowed',
        statusCode: 405
      });
    });

    it('should handle unhandled errors', async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/appointments',
        body: JSON.stringify({
          insuredId: '12345',
          scheduleId: 1,
          countryISO: 'PE'
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      mockUseCaseFactory.createCreateAppointmentUseCase.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await adapter.handleAPIGateway(mockEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Failed to create appointment',
        statusCode: 500
      });
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create appointment', {
        correlationId: 'test-request-id',
        error: 'Unexpected error'
      });
    });
  });

  describe('handleCreateAppointment', () => {
    const mockContext: Context = {
      awsRequestId: 'test-request-id'
    } as Context;

    it('should return 400 when body is missing', async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/appointments',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      const result = await adapter.handleAPIGateway(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Request body is required',
        statusCode: 400
      });
    });

    it('should return 400 when validation fails', async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/appointments',
        body: JSON.stringify({
          insuredId: 'invalid',
          scheduleId: 1,
          countryISO: 'PE'
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      const result = await adapter.handleAPIGateway(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toContain('insuredId must be exactly 5 digits');
    });

    it('should handle ValidationError', async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/appointments',
        body: JSON.stringify({
          insuredId: '12345',
          scheduleId: 1,
          countryISO: 'PE'
        }),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      const mockUseCase = {
        execute: jest.fn().mockRejectedValue(new ValidationError('test', 'Validation failed'))
      };

      mockUseCaseFactory.createCreateAppointmentUseCase.mockReturnValue(mockUseCase);

      const result = await adapter.handleAPIGateway(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Validation error for test: Validation failed',
        statusCode: 400
      });
    });
  });

  describe('handleGetAppointments', () => {
    const mockContext: Context = {
      awsRequestId: 'test-request-id'
    } as Context;

    it('should return 400 when insuredId is missing', async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/appointments',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      const result = await adapter.handleAPIGateway(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'insuredId path parameter is required',
        statusCode: 400
      });
    });

    it('should return 400 when insuredId format is invalid', async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/appointments/invalid',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: { insuredId: 'invalid' },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      const result = await adapter.handleAPIGateway(mockEvent, mockContext);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toEqual({
        error: 'insuredId must be exactly 5 digits',
        statusCode: 400
      });
    });

    it('should handle use case errors', async () => {
      const mockEvent: APIGatewayProxyEvent = {
        httpMethod: 'GET',
        path: '/appointments/12345',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: { insuredId: '12345' },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as any,
        resource: ''
      };

      const mockUseCase = {
        execute: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      mockUseCaseFactory.createGetAppointmentsByInsuredIdUseCase.mockReturnValue(mockUseCase);

      const result = await adapter.handleAPIGateway(mockEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        error: 'Failed to get appointments',
        statusCode: 500
      });
    });
  });

  describe('handleSQS', () => {
    it('should process SQS events successfully', async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: 'msg-1',
            receiptHandle: 'receipt-1',
            body: JSON.stringify({
              eventType: 'ProcessAppointment',
              appointmentId: 'apt-123',
              countryISO: 'PE'
            }),
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: 'hash1',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1'
          },
          {
            messageId: 'msg-2',
            receiptHandle: 'receipt-2',
            body: JSON.stringify({
              eventType: 'CompleteAppointment',
              appointmentId: 'apt-456'
            }),
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: 'hash2',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1'
          }
        ]
      };

      await adapter.handleSQS(mockEvent);

      expect(mockLogger.info).toHaveBeenCalledWith('Processing SQS event', {
        recordCount: 2
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Processing SQS message', {
        messageId: 'msg-1',
        eventType: 'ProcessAppointment'
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Processing appointment', {
        appointmentId: 'apt-123',
        countryISO: 'PE'
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Completing appointment', {
        appointmentId: 'apt-456'
      });
    });

    it('should handle unknown event types', async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: 'msg-1',
            receiptHandle: 'receipt-1',
            body: JSON.stringify({
              eventType: 'UnknownEvent',
              data: 'test'
            }),
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: 'hash1',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1'
          }
        ]
      };

      await adapter.handleSQS(mockEvent);

      expect(mockLogger.warn).toHaveBeenCalledWith('Unknown event type in SQS message', {
        eventType: 'UnknownEvent',
        messageId: 'msg-1'
      });
    });

    it('should handle message processing errors', async () => {
      const mockEvent: SQSEvent = {
        Records: [
          {
            messageId: 'msg-1',
            receiptHandle: 'receipt-1',
            body: 'invalid json',
            attributes: {} as any,
            messageAttributes: {},
            md5OfBody: 'hash1',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1'
          }
        ]
      };

      await expect(adapter.handleSQS(mockEvent)).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to process SQS message', {
        error: expect.stringContaining('Unexpected token'),
        messageId: 'msg-1'
      });
    });
  });

  describe('validation methods', () => {
    it('should validate request data correctly', () => {
      const adapter = new LambdaHandlerAdapter();
      
      // Access private method for testing
      const validateMethod = (adapter as any).validateCreateAppointmentRequest.bind(adapter);

      // Valid data should not throw
      expect(() => validateMethod({
        insuredId: '12345',
        scheduleId: 1,
        countryISO: 'PE'
      })).not.toThrow();

      // Invalid insuredId
      expect(() => validateMethod({
        insuredId: 'invalid',
        scheduleId: 1,
        countryISO: 'PE'
      })).toThrow('insuredId must be exactly 5 digits');

      // Missing scheduleId
      expect(() => validateMethod({
        insuredId: '12345',
        countryISO: 'PE'
      })).toThrow('scheduleId is required and must be a number');

      // Invalid countryISO
      expect(() => validateMethod({
        insuredId: '12345',
        scheduleId: 1,
        countryISO: 'US'
      })).toThrow('countryISO must be either PE or CL');
    });
  });

  describe('response methods', () => {
    it('should create success response correctly', () => {
      const adapter = new LambdaHandlerAdapter();
      
      // Access private method for testing
      const createSuccessResponse = (adapter as any).createSuccessResponse.bind(adapter);

      const response = createSuccessResponse(200, { success: true });

      expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({ success: true }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
        }
      });
    });

    it('should create error response correctly', () => {
      const adapter = new LambdaHandlerAdapter();
      
      // Access private method for testing
      const createErrorResponse = (adapter as any).createErrorResponse.bind(adapter);

      const response = createErrorResponse(400, 'Bad request');

      expect(response).toEqual({
        statusCode: 400,
        body: JSON.stringify({
          error: 'Bad request',
          statusCode: 400
        }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
        }
      });
    });
  });
});
