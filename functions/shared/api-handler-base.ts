/**
 * API Handler Base - Clean Architecture Compliant
 * Functions/Presentation Layer - Pure presentation logic
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

/**
 * Common HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

/**
 * Common error codes
 */
export const ERROR_CODES = {
  INVALID_COUNTRY_ISO: 'INVALID_COUNTRY_ISO',
  INVALID_INSURED_ID_FORMAT: 'INVALID_INSURED_ID_FORMAT',
  INVALID_JSON: 'INVALID_JSON',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  MISSING_BODY: 'MISSING_BODY',
  MISSING_INSURED_ID: 'MISSING_INSURED_ID',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  NOT_FOUND: 'NOT_FOUND',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const;

/**
 * CORS headers
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json'
} as const;

/**
 * Supported countries and validation patterns
 */
export const SUPPORTED_COUNTRIES = ['PE', 'CL'] as const;
export const INSURED_ID_PATTERN = /^\d{5}$/;

/**
 * Request validation result
 */
export interface RequestValidationResult {
  isValid: boolean;
  error?: {
    statusCode: number;
    message: string;
    errorCode: string;
  };
  data?: any;
}

/**
 * Route handler function type
 */
export interface RouteHandler {
  (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult>;
}

/**
 * Route configuration
 */
export interface RouteConfig {
  method: string;
  path: string;
  handler: RouteHandler;
}

/**
 * API Handler Base - Presentation Layer
 * Pure functions for HTTP handling
 */
export class ApiHandlerBase {
  constructor(
    private routes: RouteConfig[],
    private logger: any
  ) {}

  /**
   * Main handler method
   */
  async handle(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    const requestId = event.requestContext?.requestId || 'unknown';
    
    try {
      this.logger.info('Lambda handler invoked', {
        logId: 'lambda-handler-invoked',
        requestId,
        httpMethod: event.httpMethod,
        path: event.resource || event.path
      });

      // Handle CORS preflight
      if (event.httpMethod === 'OPTIONS') {
        return this.createOptionsResponse();
      }

      // Find matching route
      const route = this.findRoute(event.httpMethod, event.resource || event.path);
      if (!route) {
        return this.createErrorResponse(
          HTTP_STATUS.NOT_FOUND, 
          'Route not found', 
          ERROR_CODES.ROUTE_NOT_FOUND
        );
      }

      // Execute route handler
      return await route.handler(event, context);

    } catch (error) {
      const errorInstance = error as Error;
      
      this.logger.error('Unexpected error in Lambda handler', {
        logId: 'lambda-handler-error',
        requestId,
        errorType: errorInstance.constructor.name,
        errorMessage: errorInstance.message
      });
      
      return this.createErrorResponse(
        HTTP_STATUS.INTERNAL_SERVER_ERROR, 
        'Internal server error', 
        ERROR_CODES.INTERNAL_ERROR
      );
    }
  }

  /**
   * Find matching route
   */
  private findRoute(method: string, path: string): RouteConfig | undefined {
    return this.routes.find(route => 
      route.method === method && this.pathMatches(route.path, path)
    );
  }

  /**
   * Check if path matches route pattern
   */
  private pathMatches(routePath: string, requestPath: string): boolean {
    // Simple pattern matching - can be enhanced for more complex patterns
    const routePattern = routePath.replace(/\{[^}]+\}/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}$`);
    return regex.test(requestPath);
  }

  /**
   * Create success response
   */
  createSuccessResponse(statusCode: number, data: any): APIGatewayProxyResult {
    return {
      statusCode,
      headers: CORS_HEADERS,
      body: JSON.stringify(data)
    };
  }

  /**
   * Create error response
   */
  createErrorResponse(statusCode: number, message: string, errorCode: string): APIGatewayProxyResult {
    return {
      statusCode,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: {
          message,
          errorCode
        }
      })
    };
  }

  /**
   * Create OPTIONS response for CORS
   */
  createOptionsResponse(): APIGatewayProxyResult {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  /**
   * Validate JSON request body
   */
  static validateJsonBody(event: APIGatewayProxyEvent): RequestValidationResult {
    if (!event.body) {
      return {
        isValid: false,
        error: {
          statusCode: HTTP_STATUS.BAD_REQUEST,
          message: 'Request body is required',
          errorCode: ERROR_CODES.MISSING_BODY
        }
      };
    }

    try {
      const data = JSON.parse(event.body);
      return { isValid: true, data };
    } catch (error) {
      return {
        isValid: false,
        error: {
          statusCode: HTTP_STATUS.BAD_REQUEST,
          message: 'Invalid JSON in request body',
          errorCode: ERROR_CODES.INVALID_JSON
        }
      };
    }
  }

  /**
   * Validate required fields
   */
  static validateRequiredFields(data: any, requiredFields: string[]): RequestValidationResult {
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return {
        isValid: false,
        error: {
          statusCode: HTTP_STATUS.BAD_REQUEST,
          message: `Missing required fields: ${missingFields.join(', ')}`,
          errorCode: ERROR_CODES.MISSING_REQUIRED_FIELDS
        }
      };
    }

    return { isValid: true, data };
  }
}
