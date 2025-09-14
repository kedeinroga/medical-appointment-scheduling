/**
 * Validation System Tests
 * Tests for the DTO validation system
 */

import { APIGatewayProxyEvent } from 'aws-lambda';
import { 
  HTTPValidator,
  CreateAppointmentBodySchema,
  GetAppointmentsPathSchema,
  GetAppointmentsQuerySchema,
  ValidationResult
} from '../index';

/**
 * Mock API Gateway Event builder
 */
function createMockEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/appointments',
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
        userAgent: 'Custom User Agent String',
        userArn: null
      },
      path: '/appointments',
      protocol: 'HTTP/1.1',
      requestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
      requestTime: '09/Apr/2015:12:34:56 +0000',
      requestTimeEpoch: 1428582896000,
      resourceId: '123456',
      resourcePath: '/appointments',
      stage: 'dev'
    },
    resource: '/appointments',
    ...overrides
  };
}

describe('Validation System', () => {
  describe('Body Validation', () => {
    describe('CreateAppointmentBodySchema', () => {
      it('should validate valid appointment data', () => {
        const validBody = {
          countryISO: 'PE',
          insuredId: '12345',
          scheduleId: 100
        };

        const event = createMockEvent({
          body: JSON.stringify(validBody)
        });

        const result = HTTPValidator.validateBody(event, CreateAppointmentBodySchema);

        expect(result.isValid).toBe(true);
        expect(result.data).toEqual(validBody);
        expect(result.errors).toBeUndefined();
      });

      it('should auto-pad insured ID', () => {
        const bodyWithShortId = {
          countryISO: 'CL',
          insuredId: '123',
          scheduleId: 200
        };

        const event = createMockEvent({
          body: JSON.stringify(bodyWithShortId)
        });

        const result = HTTPValidator.validateBody(event, CreateAppointmentBodySchema);

        expect(result.isValid).toBe(true);
        expect(result.data?.insuredId).toBe('00123'); // Auto-padded
      });

      it('should reject invalid country ISO', () => {
        const invalidBody = {
          countryISO: 'US', // Not PE or CL
          insuredId: '12345',
          scheduleId: 100
        };

        const event = createMockEvent({
          body: JSON.stringify(invalidBody)
        });

        const result = HTTPValidator.validateBody(event, CreateAppointmentBodySchema);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors![0].field).toBe('countryISO');
        expect(result.errors![0].message).toContain('Invalid enum value');
      });

      it('should reject negative schedule ID', () => {
        const invalidBody = {
          countryISO: 'PE',
          insuredId: '12345',
          scheduleId: -1 // Negative
        };

        const event = createMockEvent({
          body: JSON.stringify(invalidBody)
        });

        const result = HTTPValidator.validateBody(event, CreateAppointmentBodySchema);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors![0].field).toBe('scheduleId');
        expect(result.errors![0].message).toContain('positive');
      });

      it('should reject missing required fields', () => {
        const incompleteBody = {
          countryISO: 'PE'
          // Missing insuredId and scheduleId
        };

        const event = createMockEvent({
          body: JSON.stringify(incompleteBody)
        });

        const result = HTTPValidator.validateBody(event, CreateAppointmentBodySchema);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2); // Missing 2 fields
        expect(result.errors!.map(e => e.field)).toContain('insuredId');
        expect(result.errors!.map(e => e.field)).toContain('scheduleId');
      });

      it('should handle missing body', () => {
        const event = createMockEvent({
          body: null
        });

        const result = HTTPValidator.validateBody(event, CreateAppointmentBodySchema);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors![0].field).toBe('body');
        expect(result.errors![0].code).toBe('MISSING_BODY');
      });

      it('should handle invalid JSON', () => {
        const event = createMockEvent({
          body: '{ invalid json }'
        });

        const result = HTTPValidator.validateBody(event, CreateAppointmentBodySchema);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors![0].field).toBe('body');
        expect(result.errors![0].code).toBe('INVALID_JSON');
      });
    });
  });

  describe('Path Parameter Validation', () => {
    describe('GetAppointmentsPathSchema', () => {
      it('should validate valid insured ID', () => {
        const event = createMockEvent({
          pathParameters: {
            insuredId: '12345'
          }
        });

        const result = HTTPValidator.validatePathParams(event, GetAppointmentsPathSchema);

        expect(result.isValid).toBe(true);
        expect(result.data?.insuredId).toBe('12345');
      });

      it('should auto-pad short insured ID', () => {
        const event = createMockEvent({
          pathParameters: {
            insuredId: '123'
          }
        });

        const result = HTTPValidator.validatePathParams(event, GetAppointmentsPathSchema);

        expect(result.isValid).toBe(true);
        expect(result.data?.insuredId).toBe('00123');
      });

      it('should reject non-numeric insured ID', () => {
        const event = createMockEvent({
          pathParameters: {
            insuredId: 'abc12'
          }
        });

        const result = HTTPValidator.validatePathParams(event, GetAppointmentsPathSchema);

        expect(result.isValid).toBe(false);
        expect(result.errors![0].field).toBe('insuredId');
      });

      it('should handle missing path parameters', () => {
        const event = createMockEvent({
          pathParameters: null
        });

        const result = HTTPValidator.validatePathParams(event, GetAppointmentsPathSchema);

        expect(result.isValid).toBe(false);
        expect(result.errors![0].field).toBe('insuredId');
      });
    });
  });

  describe('Query Parameter Validation', () => {
    describe('GetAppointmentsQuerySchema', () => {
      it('should validate with default values', () => {
        const event = createMockEvent({
          queryStringParameters: {}
        });

        const result = HTTPValidator.validateQueryParams(event, GetAppointmentsQuerySchema);

        expect(result.isValid).toBe(true);
        expect(result.data?.limit).toBe(20); // Default
        expect(result.data?.offset).toBe(0); // Default
      });

      it('should validate with custom parameters', () => {
        const event = createMockEvent({
          queryStringParameters: {
            status: 'completed',
            limit: '10',
            offset: '5',
            startDate: '2024-01-01T00:00:00Z'
          }
        });

        const result = HTTPValidator.validateQueryParams(event, GetAppointmentsQuerySchema);

        expect(result.isValid).toBe(true);
        expect(result.data?.status).toBe('completed');
        expect(result.data?.limit).toBe(10); // Coerced to number
        expect(result.data?.offset).toBe(5); // Coerced to number
        expect(result.data?.startDate).toBe('2024-01-01T00:00:00Z');
      });

      it('should reject invalid status', () => {
        const event = createMockEvent({
          queryStringParameters: {
            status: 'invalid_status'
          }
        });

        const result = HTTPValidator.validateQueryParams(event, GetAppointmentsQuerySchema);

        expect(result.isValid).toBe(false);
        expect(result.errors![0].field).toBe('status');
      });

      it('should reject invalid limit', () => {
        const event = createMockEvent({
          queryStringParameters: {
            limit: '150' // Exceeds max of 100
          }
        });

        const result = HTTPValidator.validateQueryParams(event, GetAppointmentsQuerySchema);

        expect(result.isValid).toBe(false);
        expect(result.errors![0].field).toBe('limit');
        expect(result.errors![0].message).toContain('100');
      });

      it('should reject negative offset', () => {
        const event = createMockEvent({
          queryStringParameters: {
            offset: '-5'
          }
        });

        const result = HTTPValidator.validateQueryParams(event, GetAppointmentsQuerySchema);

        expect(result.isValid).toBe(false);
        expect(result.errors![0].field).toBe('offset');
        expect(result.errors![0].message).toContain('negative');
      });

      it('should handle null query parameters', () => {
        const event = createMockEvent({
          queryStringParameters: null
        });

        const result = HTTPValidator.validateQueryParams(event, GetAppointmentsQuerySchema);

        expect(result.isValid).toBe(true);
        expect(result.data?.limit).toBe(20); // Default
        expect(result.data?.offset).toBe(0); // Default
      });
    });
  });

  describe('Complete Request Validation', () => {
    it('should validate complete request successfully', () => {
      const event = createMockEvent({
        body: JSON.stringify({
          countryISO: 'PE',
          insuredId: '12345',
          scheduleId: 100
        }),
        pathParameters: {
          insuredId: '12345'
        },
        queryStringParameters: {
          status: 'pending',
          limit: '10'
        }
      });

      const result = HTTPValidator.validateRequest(event, {
        body: CreateAppointmentBodySchema,
        path: GetAppointmentsPathSchema,
        query: GetAppointmentsQuerySchema
      });

      expect(result.isValid).toBe(true);
      expect(result.data?.body).toBeDefined();
      expect(result.data?.path).toBeDefined();
      expect(result.data?.query).toBeDefined();
    });

    it('should collect all validation errors', () => {
      const event = createMockEvent({
        body: JSON.stringify({
          countryISO: 'INVALID',
          // Missing required fields
        }),
        pathParameters: {
          insuredId: 'invalid'
        },
        queryStringParameters: {
          limit: '200' // Exceeds max
        }
      });

      const result = HTTPValidator.validateRequest(event, {
        body: CreateAppointmentBodySchema,
        path: GetAppointmentsPathSchema,
        query: GetAppointmentsQuerySchema
      });

      expect(result.isValid).toBe(false);
      expect(result.errors!.length).toBeGreaterThan(1);
      
      // Should have errors from body, path, and query
      const errorFields = result.errors!.map(e => e.field);
      expect(errorFields).toContain('countryISO');
      expect(errorFields).toContain('insuredId');
      expect(errorFields).toContain('limit');
    });
  });

  describe('Performance', () => {
    it('should validate quickly', () => {
      const validBody = {
        countryISO: 'PE',
        insuredId: '12345',
        scheduleId: 100
      };

      const event = createMockEvent({
        body: JSON.stringify(validBody)
      });

      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        HTTPValidator.validateBody(event, CreateAppointmentBodySchema);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete 1000 validations in under 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});
