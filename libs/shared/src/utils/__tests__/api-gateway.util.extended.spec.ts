import { 
  createErrorResponse, 
  createSuccessResponse, 
  createOptionsResponse,
  CORS_HEADERS,
  HTTP_STATUS,
  ERROR_CODES
} from '../api-gateway.util';

describe('ApiGatewayUtil - Extended Tests', () => {
  describe('createErrorResponse', () => {
    it('should create error response with all parameters', () => {
      const response = createErrorResponse(400, 'Validation failed', ERROR_CODES.VALIDATION_ERROR);
      
      expect(response.statusCode).toBe(400);
      expect(response.headers).toEqual(CORS_HEADERS);
      
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(body.error.message).toBe('Validation failed');
      expect(body.error.timestamp).toBeDefined();
    });

    it('should create error response without error code', () => {
      const response = createErrorResponse(500, 'Internal server error');
      
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
      expect(body.error.message).toBe('Internal server error');
    });

    it('should create error response with empty message', () => {
      const response = createErrorResponse(400, '');
      
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toBe('');
    });

    it('should create error response with custom error code', () => {
      const response = createErrorResponse(404, 'Not found', 'CUSTOM_ERROR');
      
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('CUSTOM_ERROR');
    });

    it('should include valid timestamp in error response', () => {
      const response = createErrorResponse(400, 'Test error');
      
      const body = JSON.parse(response.body);
      const timestamp = new Date(body.error.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 1000); // Within last second
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response with object data', () => {
      const data = { id: 1, name: 'Test' };
      const response = createSuccessResponse(200, data);
      
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual(CORS_HEADERS);
      
      const body = JSON.parse(response.body);
      expect(body.data).toEqual(data);
      expect(body.timestamp).toBeDefined();
    });

    it('should create success response with array data', () => {
      const data = [1, 2, 3];
      const response = createSuccessResponse(200, data);
      
      const body = JSON.parse(response.body);
      expect(body.data).toEqual(data);
    });

    it('should create success response with null data', () => {
      const response = createSuccessResponse(200, null);
      
      const body = JSON.parse(response.body);
      expect(body.data).toBeNull();
    });

    it('should create success response with string data', () => {
      const response = createSuccessResponse(201, 'Created successfully');
      
      const body = JSON.parse(response.body);
      expect(body.data).toBe('Created successfully');
    });

    it('should create success response with number data', () => {
      const response = createSuccessResponse(200, 42);
      
      const body = JSON.parse(response.body);
      expect(body.data).toBe(42);
    });

    it('should create success response with boolean data', () => {
      const response = createSuccessResponse(200, true);
      
      const body = JSON.parse(response.body);
      expect(body.data).toBe(true);
    });

    it('should include valid timestamp in success response', () => {
      const response = createSuccessResponse(200, {});
      
      const body = JSON.parse(response.body);
      const timestamp = new Date(body.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 1000); // Within last second
    });
  });

  describe('createOptionsResponse', () => {
    it('should create OPTIONS response for CORS preflight', () => {
      const response = createOptionsResponse();
      
      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      expect(response.headers).toEqual(CORS_HEADERS);
      expect(response.body).toBe('');
    });
  });

  describe('constants', () => {
    it('should have proper CORS headers', () => {
      expect(CORS_HEADERS).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Content-Type': 'application/json'
      });
    });

    it('should have proper HTTP status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    });

    it('should have proper error codes', () => {
      expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ERROR_CODES.COUNTRY_NOT_SUPPORTED).toBe('COUNTRY_NOT_SUPPORTED');
      expect(ERROR_CODES.INSURED_ID_INVALID).toBe('INSURED_ID_INVALID');
      expect(ERROR_CODES.APPOINTMENT_NOT_FOUND).toBe('APPOINTMENT_NOT_FOUND');
      expect(ERROR_CODES.SCHEDULE_NOT_AVAILABLE).toBe('SCHEDULE_NOT_AVAILABLE');
      expect(ERROR_CODES.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle complex nested objects in success response', () => {
      const complexData = {
        level1: {
          level2: {
            array: [1, 2, { nested: true }],
            date: new Date().toISOString()
          }
        }
      };
      
      const response = createSuccessResponse(200, complexData);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual(complexData);
    });

    it('should handle undefined data in success response', () => {
      const response = createSuccessResponse(200, undefined);
      
      const body = JSON.parse(response.body);
      expect(body.data).toBeUndefined();
    });

    it('should handle very long error messages', () => {
      const longMessage = 'x'.repeat(1000);
      const response = createErrorResponse(400, longMessage);
      
      const body = JSON.parse(response.body);
      expect(body.error.message).toBe(longMessage);
    });

    it('should handle special characters in error messages', () => {
      const specialMessage = 'Error with "quotes" and \n newlines and 中文';
      const response = createErrorResponse(400, specialMessage);
      
      const body = JSON.parse(response.body);
      expect(body.error.message).toBe(specialMessage);
    });
  });
});
