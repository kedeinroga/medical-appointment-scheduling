/**
 * Validation Middleware Tests
 * Comprehensive tests for the validation middleware system
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { z } from 'zod';
import {
  withValidation,
  validateBody,
  validatePath,
  validateQuery,
  validateBodyAndPath,
  validateAll,
  getValidatedData,
  isValidatedEvent,
  ValidatedEvent,
  ValidatedHandler
} from '../validation-middleware';

// Test schemas
const TestBodySchema = z.object({
  name: z.string(),
  age: z.number().min(0).max(120)
});

const TestPathSchema = z.object({
  id: z.string().uuid()
});

const TestQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
});

const TestHeadersSchema = z.object({
  authorization: z.string()
});

// Mock context
const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2023/01/01/[$LATEST]test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: jest.fn(),
  fail: jest.fn(),
  succeed: jest.fn()
};

// Helper to create mock events
function createMockEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/test',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'api-id',
      authorizer: {},
      httpMethod: 'POST',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'Test User Agent',
        userArn: null
      },
      path: '/test',
      protocol: 'HTTP/1.1',
      requestId: 'test-request-id',
      requestTime: '01/Jan/2023:12:00:00 +0000',
      requestTimeEpoch: 1672574400000,
      resourceId: '123456',
      resourcePath: '/test',
      stage: 'test'
    },
    resource: '/test',
    ...overrides
  };
}

describe('Validation Middleware', () => {
  describe('withValidation', () => {
    it('should validate request body successfully', async () => {
      const handler: ValidatedHandler<z.infer<typeof TestBodySchema>> = async (event) => {
        expect(event.validatedData.body).toEqual({
          name: 'John Doe',
          age: 30
        });
        
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true })
        };
      };

      const wrappedHandler = withValidation({
        body: TestBodySchema
      })(handler);

      const event = createMockEvent({
        body: JSON.stringify({
          name: 'John Doe',
          age: 30
        })
      });

      const result = await wrappedHandler(event, mockContext);
      
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({ success: true });
    });

    it('should validate path parameters successfully', async () => {
      const handler: ValidatedHandler<any, z.infer<typeof TestPathSchema>> = async (event) => {
        expect(event.validatedData.path).toEqual({
          id: '123e4567-e89b-12d3-a456-426614174000'
        });
        
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true })
        };
      };

      const wrappedHandler = withValidation({
        path: TestPathSchema
      })(handler);

      const event = createMockEvent({
        pathParameters: {
          id: '123e4567-e89b-12d3-a456-426614174000'
        }
      });

      const result = await wrappedHandler(event, mockContext);
      
      expect(result.statusCode).toBe(200);
    });

    it('should validate query parameters successfully', async () => {
      const SimpleQuerySchema = z.object({
        page: z.string(),
        limit: z.string()
      });

      const handler: ValidatedHandler<any, any, z.infer<typeof SimpleQuerySchema>> = async (event) => {
        expect(event.validatedData.query).toEqual({
          page: '2',
          limit: '20'
        });
        
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true })
        };
      };

      const wrappedHandler = withValidation({
        query: SimpleQuerySchema
      })(handler);

      const event = createMockEvent({
        queryStringParameters: {
          page: '2',
          limit: '20'
        }
      });

      const result = await wrappedHandler(event, mockContext);
      
      expect(result.statusCode).toBe(200);
    });

    it('should validate headers successfully', async () => {
      const SimpleHeadersSchema = z.object({
        authorization: z.string()
      });

      const handler: ValidatedHandler<any, any, any, z.infer<typeof SimpleHeadersSchema>> = async (event) => {
        expect(event.validatedData.headers).toEqual({
          authorization: 'Bearer token123'
        });
        
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true })
        };
      };

      const wrappedHandler = withValidation({
        headers: SimpleHeadersSchema
      })(handler);

      const event = createMockEvent({
        headers: {
          authorization: 'Bearer token123'
        }
      });

      const result = await wrappedHandler(event, mockContext);
      
      expect(result.statusCode).toBe(200);
    });

    it('should validate multiple parts successfully', async () => {
      const SimpleQuerySchema = z.object({
        page: z.string(),
        limit: z.string()
      });

      const handler: ValidatedHandler<
        z.infer<typeof TestBodySchema>,
        z.infer<typeof TestPathSchema>,
        z.infer<typeof SimpleQuerySchema>
      > = async (event) => {
        expect(event.validatedData.body).toBeDefined();
        expect(event.validatedData.path).toBeDefined();
        expect(event.validatedData.query).toBeDefined();
        
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true })
        };
      };

      const wrappedHandler = withValidation({
        body: TestBodySchema,
        path: TestPathSchema,
        query: SimpleQuerySchema
      })(handler);

      const event = createMockEvent({
        body: JSON.stringify({ name: 'John', age: 25 }),
        pathParameters: { id: '123e4567-e89b-12d3-a456-426614174000' },
        queryStringParameters: { page: '1', limit: '10' }
      });

      const result = await wrappedHandler(event, mockContext);
      
      expect(result.statusCode).toBe(200);
    });

    it('should return validation error with default response', async () => {
      const handler: ValidatedHandler<z.infer<typeof TestBodySchema>> = async () => {
        throw new Error('Should not reach here');
      };

      const wrappedHandler = withValidation({
        body: TestBodySchema
      })(handler);

      const event = createMockEvent({
        body: JSON.stringify({
          name: 'John',
          age: -5 // Invalid age
        })
      });

      const result = await wrappedHandler(event, mockContext);
      
      expect(result.statusCode).toBe(400);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.message).toBe('Validation failed');
      expect(responseBody.error.errorCode).toBe('VALIDATION_ERROR');
      expect(responseBody.error.fields).toBeDefined();
      expect(responseBody.error.details.errorCount).toBeGreaterThan(0);
    });

    it('should use custom validation error handler', async () => {
      const customErrorHandler = jest.fn().mockReturnValue({
        statusCode: 422,
        body: JSON.stringify({ custom: 'error' })
      });

      const handler: ValidatedHandler<z.infer<typeof TestBodySchema>> = async () => {
        throw new Error('Should not reach here');
      };

      const wrappedHandler = withValidation({
        body: TestBodySchema,
        onValidationError: customErrorHandler
      })(handler);

      const event = createMockEvent({
        body: JSON.stringify({
          name: 'John',
          age: -5 // Invalid age
        })
      });

      const result = await wrappedHandler(event, mockContext);
      
      expect(result.statusCode).toBe(422);
      expect(JSON.parse(result.body)).toEqual({ custom: 'error' });
      expect(customErrorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          isValid: false,
          errors: expect.any(Array)
        })
      );
    });

    it('should handle internal errors gracefully', async () => {
      const handler: ValidatedHandler = async () => {
        throw new Error('Handler error');
      };

      // Mock HTTPValidator to throw an error
      const originalValidateRequest = require('../validators').HTTPValidator.validateRequest;
      require('../validators').HTTPValidator.validateRequest = jest.fn().mockImplementation(() => {
        throw new Error('Validation system error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const wrappedHandler = withValidation({
        body: TestBodySchema
      })(handler);

      const event = createMockEvent({
        body: JSON.stringify({ name: 'John', age: 30 })
      });

      const result = await wrappedHandler(event, mockContext);
      
      expect(result.statusCode).toBe(500);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.message).toBe('Internal validation error');
      expect(responseBody.error.errorCode).toBe('VALIDATION_MIDDLEWARE_ERROR');
      
      expect(consoleSpy).toHaveBeenCalledWith('Validation middleware error:', expect.any(Error));

      // Restore original function
      require('../validators').HTTPValidator.validateRequest = originalValidateRequest;
      consoleSpy.mockRestore();
    });

    it('should handle empty config', async () => {
      const handler: ValidatedHandler = async (event) => {
        expect(event.validatedData).toEqual({});
        
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true })
        };
      };

      const wrappedHandler = withValidation({})(handler);

      const event = createMockEvent();

      const result = await wrappedHandler(event, mockContext);
      
      expect(result.statusCode).toBe(200);
    });
  });

  describe('Quick validation decorators', () => {
    describe('validateBody', () => {
      it('should validate body only', async () => {
        const handler: ValidatedHandler<z.infer<typeof TestBodySchema>> = async (event) => {
          expect(event.validatedData.body).toEqual({
            name: 'John',
            age: 30
          });
          
          return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
          };
        };

        const wrappedHandler = validateBody(TestBodySchema)(handler);

        const event = createMockEvent({
          body: JSON.stringify({ name: 'John', age: 30 })
        });

        const result = await wrappedHandler(event, mockContext);
        
        expect(result.statusCode).toBe(200);
      });
    });

    describe('validatePath', () => {
      it('should validate path only', async () => {
        const handler: ValidatedHandler<any, z.infer<typeof TestPathSchema>> = async (event) => {
          expect(event.validatedData.path).toEqual({
            id: '123e4567-e89b-12d3-a456-426614174000'
          });
          
          return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
          };
        };

        const wrappedHandler = validatePath(TestPathSchema)(handler);

        const event = createMockEvent({
          pathParameters: {
            id: '123e4567-e89b-12d3-a456-426614174000'
          }
        });

        const result = await wrappedHandler(event, mockContext);
        
        expect(result.statusCode).toBe(200);
      });
    });

    describe('validateQuery', () => {
      it('should validate query only', async () => {
        const handler: ValidatedHandler<any, any, z.infer<typeof TestQuerySchema>> = async (event) => {
          expect(event.validatedData.query).toEqual({
            page: 1,  // default value
            limit: 10 // default value
          });
          
          return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
          };
        };

        const wrappedHandler = validateQuery(TestQuerySchema)(handler);

        const event = createMockEvent();

        const result = await wrappedHandler(event, mockContext);
        
        expect(result.statusCode).toBe(200);
      });
    });

    describe('validateBodyAndPath', () => {
      it('should validate body and path', async () => {
        const handler: ValidatedHandler<
          z.infer<typeof TestBodySchema>,
          z.infer<typeof TestPathSchema>
        > = async (event) => {
          expect(event.validatedData.body).toBeDefined();
          expect(event.validatedData.path).toBeDefined();
          
          return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
          };
        };

        const wrappedHandler = validateBodyAndPath(TestBodySchema, TestPathSchema)(handler);

        const event = createMockEvent({
          body: JSON.stringify({ name: 'John', age: 30 }),
          pathParameters: { id: '123e4567-e89b-12d3-a456-426614174000' }
        });

        const result = await wrappedHandler(event, mockContext);
        
        expect(result.statusCode).toBe(200);
      });
    });

    describe('validateAll', () => {
      it('should validate body, path, and query', async () => {
        const SimpleQuerySchema = z.object({
          page: z.string(),
          limit: z.string()
        });

        const handler: ValidatedHandler<
          z.infer<typeof TestBodySchema>,
          z.infer<typeof TestPathSchema>,
          z.infer<typeof SimpleQuerySchema>
        > = async (event) => {
          expect(event.validatedData.body).toBeDefined();
          expect(event.validatedData.path).toBeDefined();
          expect(event.validatedData.query).toBeDefined();
          
          return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
          };
        };

        const wrappedHandler = validateAll(TestBodySchema, TestPathSchema, SimpleQuerySchema)(handler);

        const event = createMockEvent({
          body: JSON.stringify({ name: 'John', age: 30 }),
          pathParameters: { id: '123e4567-e89b-12d3-a456-426614174000' },
          queryStringParameters: { page: '2', limit: '20' }
        });

        const result = await wrappedHandler(event, mockContext);
        
        expect(result.statusCode).toBe(200);
      });
    });
  });

  describe('Utility functions', () => {
    describe('getValidatedData', () => {
      it('should extract validated body data', () => {
        const validatedEvent: ValidatedEvent = {
          ...createMockEvent(),
          validatedData: {
            body: { name: 'John', age: 30 },
            path: { id: '123' },
            query: { page: 1, limit: 10 }
          }
        };

        const bodyData = getValidatedData(validatedEvent, 'body');
        expect(bodyData).toEqual({ name: 'John', age: 30 });

        const pathData = getValidatedData(validatedEvent, 'path');
        expect(pathData).toEqual({ id: '123' });

        const queryData = getValidatedData(validatedEvent, 'query');
        expect(queryData).toEqual({ page: 1, limit: 10 });
      });

      it('should return undefined for missing data', () => {
        const validatedEvent: ValidatedEvent = {
          ...createMockEvent(),
          validatedData: {}
        };

        const bodyData = getValidatedData(validatedEvent, 'body');
        expect(bodyData).toBeUndefined();
      });
    });

    describe('isValidatedEvent', () => {
      it('should return true for validated events', () => {
        const validatedEvent: ValidatedEvent = {
          ...createMockEvent(),
          validatedData: {}
        };

        expect(isValidatedEvent(validatedEvent)).toBe(true);
      });

      it('should return false for regular events', () => {
        const regularEvent = createMockEvent();

        expect(isValidatedEvent(regularEvent)).toBe(false);
      });
    });
  });

  describe('Error response creation', () => {
    it('should create properly formatted validation error response', async () => {
      const handler: ValidatedHandler<z.infer<typeof TestBodySchema>> = async () => {
        throw new Error('Should not reach here');
      };

      const wrappedHandler = withValidation({
        body: TestBodySchema
      })(handler);

      const event = createMockEvent({
        body: JSON.stringify({
          // name missing
          age: 'invalid' // wrong type
        })
      });

      const result = await wrappedHandler(event, mockContext);
      
      expect(result.statusCode).toBe(400);
      expect(result.headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Content-Type': 'application/json'
      });
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toEqual({
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        fields: expect.any(Object),
        details: {
          errorCount: expect.any(Number),
          firstError: expect.any(String)
        }
      });
    });

    it('should group errors by field', async () => {
      const MultiErrorSchema = z.object({
        name: z.string().min(3).max(10),
        age: z.number().min(0).max(120)
      });

      const handler: ValidatedHandler<z.infer<typeof MultiErrorSchema>> = async () => {
        throw new Error('Should not reach here');
      };

      const wrappedHandler = withValidation({
        body: MultiErrorSchema
      })(handler);

      const event = createMockEvent({
        body: JSON.stringify({
          name: 'ab', // too short
          age: -5     // invalid range
        })
      });

      const result = await wrappedHandler(event, mockContext);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.fields).toBeDefined();
      expect(Object.keys(responseBody.error.fields)).toContain('name');
      expect(Object.keys(responseBody.error.fields)).toContain('age');
    });
  });
});
