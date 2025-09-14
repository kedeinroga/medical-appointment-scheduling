import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, SQSEvent } from 'aws-lambda';
import { LambdaHandlerAdapter } from '../lambda-handler.adapter';
import { ValidationError } from '../../../errors/aws.errors';
import { InfrastructureBridgeFactory } from '../../../factories/infrastructure-bridge.factory';

// Mock dependencies
jest.mock('../../../factories/infrastructure-bridge.factory');
jest.mock('@aws-lambda-powertools/logger');

describe('LambdaHandlerAdapter - Comprehensive Tests', () => {
  let adapter: LambdaHandlerAdapter;
  let mockContext: Context;
  let mockCreateUseCase: any;
  let mockGetUseCase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    adapter = new LambdaHandlerAdapter();
    
    mockContext = {
      awsRequestId: 'test-request-id',
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'test-function',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
      logGroupName: '/aws/lambda/test',
      logStreamName: '2023/01/01/[$LATEST]123456789',
      memoryLimitInMB: '128',
      getRemainingTimeInMillis: jest.fn().mockReturnValue(30000),
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn()
    };

    mockCreateUseCase = {
      execute: jest.fn()
    };

    mockGetUseCase = {
      execute: jest.fn()
    };

    (InfrastructureBridgeFactory.createCreateAppointmentUseCase as jest.Mock)
      .mockReturnValue(mockCreateUseCase);
    (InfrastructureBridgeFactory.createGetAppointmentsByInsuredIdUseCase as jest.Mock)
      .mockReturnValue(mockGetUseCase);
  });

  describe('handleAPIGateway', () => {
    describe('POST /appointments', () => {
      it('should create appointment successfully', async () => {
        const event: APIGatewayProxyEvent = {
          httpMethod: 'POST',
          path: '/appointments',
          body: JSON.stringify({
            countryISO: 'PE',
            insuredId: '12345',
            scheduleId: 123
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

        const expectedResult = {
          appointmentId: 'test-appointment-id',
          status: 'PENDING'
        };

        mockCreateUseCase.execute.mockResolvedValue(expectedResult);

        const result = await adapter.handleAPIGateway(event, mockContext);

        expect(result.statusCode).toBe(201);
        expect(JSON.parse(result.body)).toEqual(expectedResult);
        expect(result.headers?.['Content-Type']).toBe('application/json');
        expect(mockCreateUseCase.execute).toHaveBeenCalledWith({
          countryISO: 'PE',
          insuredId: '12345',
          scheduleId: 123
        });
      });

      it('should return 400 when body is missing', async () => {
        const event: APIGatewayProxyEvent = {
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

        const result = await adapter.handleAPIGateway(event, mockContext);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).error).toBe('Request body is required');
      });

      it('should return 400 when insuredId is missing', async () => {
        const event: APIGatewayProxyEvent = {
          httpMethod: 'POST',
          path: '/appointments',
          body: JSON.stringify({
            countryISO: 'PE',
            scheduleId: 123
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

        const result = await adapter.handleAPIGateway(event, mockContext);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).error).toContain('insuredId is required');
      });

      it('should return 400 when insuredId format is invalid', async () => {
        const event: APIGatewayProxyEvent = {
          httpMethod: 'POST',
          path: '/appointments',
          body: JSON.stringify({
            countryISO: 'PE',
            insuredId: '123', // Invalid: not 5 digits
            scheduleId: 123
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

        const result = await adapter.handleAPIGateway(event, mockContext);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).error).toContain('insuredId must be exactly 5 digits');
      });

      it('should return 400 when scheduleId is missing', async () => {
        const event: APIGatewayProxyEvent = {
          httpMethod: 'POST',
          path: '/appointments',
          body: JSON.stringify({
            countryISO: 'PE',
            insuredId: '12345'
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

        const result = await adapter.handleAPIGateway(event, mockContext);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).error).toContain('scheduleId is required');
      });

      it('should return 400 when countryISO is invalid', async () => {
        const event: APIGatewayProxyEvent = {
          httpMethod: 'POST',
          path: '/appointments',
          body: JSON.stringify({
            countryISO: 'US', // Invalid: not PE or CL
            insuredId: '12345',
            scheduleId: 123
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

        const result = await adapter.handleAPIGateway(event, mockContext);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).error).toContain('countryISO must be either PE or CL');
      });

      it('should handle ValidationError correctly', async () => {
        const event: APIGatewayProxyEvent = {
          httpMethod: 'POST',
          path: '/appointments',
          body: JSON.stringify({
            countryISO: 'PE',
            insuredId: '12345',
            scheduleId: 123
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

        mockCreateUseCase.execute.mockRejectedValue(
          new ValidationError('test-field', 'Test validation error')
        );

        const result = await adapter.handleAPIGateway(event, mockContext);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).error).toBe('Validation error for test-field: Test validation error');
      });

      it('should handle unexpected errors gracefully', async () => {
        const event: APIGatewayProxyEvent = {
          httpMethod: 'POST',
          path: '/appointments',
          body: JSON.stringify({
            countryISO: 'PE',
            insuredId: '12345',
            scheduleId: 123
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

        mockCreateUseCase.execute.mockRejectedValue(new Error('Unexpected error'));

        const result = await adapter.handleAPIGateway(event, mockContext);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).error).toBe('Failed to create appointment');
      });
    });

    describe('GET /appointments/{insuredId}', () => {
      it('should get appointments successfully', async () => {
        const event: APIGatewayProxyEvent = {
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

        const expectedResult = {
          appointments: [
            { id: '1', status: 'PENDING' },
            { id: '2', status: 'COMPLETED' }
          ]
        };

        mockGetUseCase.execute.mockResolvedValue(expectedResult);

        const result = await adapter.handleAPIGateway(event, mockContext);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body)).toEqual(expectedResult);
        expect(mockGetUseCase.execute).toHaveBeenCalledWith({
          insuredId: '12345'
        });
      });

      it('should return 400 when insuredId parameter is missing', async () => {
        const event: APIGatewayProxyEvent = {
          httpMethod: 'GET',
          path: '/appointments/',
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

        const result = await adapter.handleAPIGateway(event, mockContext);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).error).toBe('insuredId path parameter is required');
      });

      it('should return 400 when insuredId format is invalid', async () => {
        const event: APIGatewayProxyEvent = {
          httpMethod: 'GET',
          path: '/appointments/123',
          body: null,
          headers: {},
          multiValueHeaders: {},
          isBase64Encoded: false,
          pathParameters: { insuredId: '123' },
          queryStringParameters: null,
          multiValueQueryStringParameters: null,
          stageVariables: null,
          requestContext: {} as any,
          resource: ''
        };

        const result = await adapter.handleAPIGateway(event, mockContext);

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).error).toBe('insuredId must be exactly 5 digits');
      });

      it('should handle unexpected errors in GET request', async () => {
        const event: APIGatewayProxyEvent = {
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

        mockGetUseCase.execute.mockRejectedValue(new Error('Database error'));

        const result = await adapter.handleAPIGateway(event, mockContext);

        expect(result.statusCode).toBe(500);
        expect(JSON.parse(result.body).error).toBe('Failed to get appointments');
      });
    });

    it('should return 405 for unsupported HTTP methods', async () => {
      const event: APIGatewayProxyEvent = {
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

      const result = await adapter.handleAPIGateway(event, mockContext);

      expect(result.statusCode).toBe(405);
      expect(JSON.parse(result.body).error).toBe('Method not allowed');
    });

    it('should handle top-level errors gracefully', async () => {
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/appointments',
        body: 'invalid json{',
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

      const result = await adapter.handleAPIGateway(event, mockContext);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Failed to create appointment');
    });
  });

  describe('handleSQS', () => {
    it('should process ProcessAppointment events successfully', async () => {
      const event: SQSEvent = {
        Records: [
          {
            messageId: 'test-message-id',
            receiptHandle: 'test-receipt-handle',
            body: JSON.stringify({
              eventType: 'ProcessAppointment',
              appointmentId: 'test-appointment-id',
              countryISO: 'PE'
            }),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890'
            },
            messageAttributes: {},
            md5OfBody: 'test-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1'
          }
        ]
      };

      await expect(adapter.handleSQS(event)).resolves.not.toThrow();
    });

    it('should process CompleteAppointment events successfully', async () => {
      const event: SQSEvent = {
        Records: [
          {
            messageId: 'test-message-id',
            receiptHandle: 'test-receipt-handle',
            body: JSON.stringify({
              eventType: 'CompleteAppointment',
              appointmentId: 'test-appointment-id'
            }),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890'
            },
            messageAttributes: {},
            md5OfBody: 'test-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1'
          }
        ]
      };

      await expect(adapter.handleSQS(event)).resolves.not.toThrow();
    });

    it('should handle unknown event types gracefully', async () => {
      const event: SQSEvent = {
        Records: [
          {
            messageId: 'test-message-id',
            receiptHandle: 'test-receipt-handle',
            body: JSON.stringify({
              eventType: 'UnknownEvent',
              data: 'test-data'
            }),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890'
            },
            messageAttributes: {},
            md5OfBody: 'test-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1'
          }
        ]
      };

      await expect(adapter.handleSQS(event)).resolves.not.toThrow();
    });

    it('should handle invalid JSON in SQS message', async () => {
      const event: SQSEvent = {
        Records: [
          {
            messageId: 'test-message-id',
            receiptHandle: 'test-receipt-handle',
            body: 'invalid json{',
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890'
            },
            messageAttributes: {},
            md5OfBody: 'test-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1'
          }
        ]
      };

      await expect(adapter.handleSQS(event)).rejects.toThrow();
    });

    it('should process multiple SQS records', async () => {
      const event: SQSEvent = {
        Records: [
          {
            messageId: 'test-message-id-1',
            receiptHandle: 'test-receipt-handle-1',
            body: JSON.stringify({
              eventType: 'ProcessAppointment',
              appointmentId: 'test-appointment-id-1'
            }),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890'
            },
            messageAttributes: {},
            md5OfBody: 'test-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1'
          },
          {
            messageId: 'test-message-id-2',
            receiptHandle: 'test-receipt-handle-2',
            body: JSON.stringify({
              eventType: 'CompleteAppointment',
              appointmentId: 'test-appointment-id-2'
            }),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890'
            },
            messageAttributes: {},
            md5OfBody: 'test-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
            awsRegion: 'us-east-1'
          }
        ]
      };

      await expect(adapter.handleSQS(event)).resolves.not.toThrow();
    });
  });
});
