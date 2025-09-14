import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, SQSEvent } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';

import { LambdaHandlerAdapter } from '../lambda-handler.adapter';
import { ValidationError } from '../../../errors/aws.errors';
import { AdapterFactory } from '../../../factories/adapter.factory';

// Mock dependencies
jest.mock('@aws-lambda-powertools/logger');
jest.mock('../../../factories/adapter.factory');
jest.mock('@medical-appointment/core-use-cases', () => ({
  UseCaseFactory: {
    createCreateAppointmentUseCase: jest.fn(),
    createGetAppointmentsByInsuredIdUseCase: jest.fn()
  }
}));

describe('LambdaHandlerAdapter', () => {
  let adapter: LambdaHandlerAdapter;
  let mockLogger: jest.Mocked<Logger>;
  let mockContext: Context;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as any;

    mockContext = {
      functionName: 'test-function',
      functionVersion: '1',
      invokedFunctionArn: 'test-arn',
      memoryLimitInMB: '128',
      awsRequestId: 'test-aws-request-id',
      logGroupName: 'test-log-group',
      logStreamName: 'test-log-stream',
      getRemainingTimeInMillis: () => 30000,
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn(),
      callbackWaitsForEmptyEventLoop: false,
    };

    adapter = new LambdaHandlerAdapter();
  });

  describe('basic functionality', () => {
    it('should be instantiated correctly', () => {
      expect(adapter).toBeInstanceOf(LambdaHandlerAdapter);
    });

    it('should have required methods', () => {
      expect(typeof adapter.handleAPIGateway).toBe('function');
      expect(typeof adapter.handleSQS).toBe('function');
    });
  });

  describe('response creation', () => {
    it('should create success response correctly', () => {
      const result = (adapter as any).createSuccessResponse(200, { success: true });

      expect(result).toEqual({
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
      const result = (adapter as any).createErrorResponse(400, 'Bad request');

      expect(result).toEqual({
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