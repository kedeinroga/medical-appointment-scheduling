import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Mock AWS Lambda Powertools Logger
jest.mock('@aws-lambda-powertools/logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

// Mock the use case factory
jest.mock('@medical-appointment/infrastructure', () => ({
  UseCaseFactory: {
    createCreateAppointmentUseCase: jest.fn().mockReturnValue({
      execute: jest.fn().mockResolvedValue({
        appointmentId: 'test-id',
        status: 'pending'
      })
    }),
    createGetAppointmentsByInsuredIdUseCase: jest.fn().mockReturnValue({
      execute: jest.fn().mockResolvedValue({
        appointments: [
          {
            appointmentId: 'test-id',
            countryISO: 'PE',
            createdAt: '2024-01-01T10:00:00Z',
            insuredId: '12345',
            scheduleId: 100,
            status: 'pending',
            updatedAt: '2024-01-01T10:00:00Z'
          }
        ]
      })
    })
  }
}));

// Import after mocking
import { main } from '../handler';

const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test',
  logStreamName: 'test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {}
};

describe('Appointment Lambda Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /appointments', () => {
    it('should create appointment successfully', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        resource: '/appointments',
        body: JSON.stringify({
          insuredId: '12345',
          scheduleId: 100,
          countryISO: 'PE'
        })
      };

      const result = await main(event as APIGatewayProxyEvent, mockContext, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toEqual({
        data: {
          appointmentId: 'test-id',
          status: 'pending',
          message: 'Appointment scheduling is in process'
        },
        timestamp: expect.any(String)
      });
    });

    it('should return 400 for missing body', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        resource: '/appointments',
        body: null
      };

      const result = await main(event as APIGatewayProxyEvent, mockContext, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error.code).toBe('MISSING_BODY');
    });

    it('should return 400 for invalid country', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        resource: '/appointments',
        body: JSON.stringify({
          insuredId: '12345',
          scheduleId: 100,
          countryISO: 'XX'
        })
      };

      const result = await main(event as APIGatewayProxyEvent, mockContext, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error.code).toBe('INVALID_COUNTRY_ISO');
    });
  });

  describe('GET /appointments/{insuredId}', () => {
    it('should get appointments successfully', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        resource: '/appointments/{insuredId}',
        pathParameters: {
          insuredId: '12345'
        }
      };

      const result = await main(event as APIGatewayProxyEvent, mockContext, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({
        data: {
          appointments: expect.any(Array),
          pagination: {
            count: 1
          }
        },
        timestamp: expect.any(String)
      });
    });

    it('should return 400 for missing insuredId', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        resource: '/appointments/{insuredId}',
        pathParameters: {}
      };

      const result = await main(event as APIGatewayProxyEvent, mockContext, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error.code).toBe('MISSING_INSURED_ID');
    });
  });

  describe('OPTIONS requests', () => {
    it('should handle CORS preflight', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'OPTIONS',
        resource: '/appointments'
      };

      const result = await main(event as APIGatewayProxyEvent, mockContext, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual(expect.objectContaining({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      }));
    });
  });

  describe('Unknown routes', () => {
    it('should return 404 for unknown routes', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        resource: '/unknown'
      };

      const result = await main(event as APIGatewayProxyEvent, mockContext, () => {}) as APIGatewayProxyResult;

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).error.code).toBe('ROUTE_NOT_FOUND');
    });
  });
});
