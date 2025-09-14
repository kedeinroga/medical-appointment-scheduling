/**
 * Validation Middleware - Decorator-style validation for Lambda handlers
 * Provides clean integration with existing Lambda architecture
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { z } from 'zod';
import { HTTPValidator } from './validators';
import { ValidationResult } from './types';

/**
 * HTTP status codes for validation errors
 */
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500
} as const;

/**
 * CORS headers for responses
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json'
} as const;

/**
 * Validation middleware configuration
 */
export interface ValidationConfig<TBody = any, TPath = any, TQuery = any, THeaders = any> {
  body?: z.ZodSchema<TBody>;
  path?: z.ZodSchema<TPath>;
  query?: z.ZodSchema<TQuery>;
  headers?: z.ZodSchema<THeaders>;
  onValidationError?: (errors: ValidationResult) => APIGatewayProxyResult;
}

/**
 * Enhanced event with validated data
 */
export interface ValidatedEvent<TBody = any, TPath = any, TQuery = any, THeaders = any> 
  extends APIGatewayProxyEvent {
  validatedData: {
    body?: TBody;
    path?: TPath;
    query?: TQuery;
    headers?: THeaders;
  };
}

/**
 * Lambda handler type with validation
 */
export type ValidatedHandler<TBody = any, TPath = any, TQuery = any, THeaders = any> = (
  event: ValidatedEvent<TBody, TPath, TQuery, THeaders>,
  context: Context
) => Promise<APIGatewayProxyResult>;

/**
 * Validation middleware function
 */
export function withValidation<TBody = any, TPath = any, TQuery = any, THeaders = any>(
  config: ValidationConfig<TBody, TPath, TQuery, THeaders>
) {
  return function(
    handler: ValidatedHandler<TBody, TPath, TQuery, THeaders>
  ): (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult> {
    
    return async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
      try {
        // Perform validation
        const schemas: any = {};
        if (config.body) schemas.body = config.body;
        if (config.path) schemas.path = config.path;
        if (config.query) schemas.query = config.query;
        if (config.headers) schemas.headers = config.headers;
        
        const validationResult = HTTPValidator.validateRequest(event, schemas);

        // Handle validation errors
        if (!validationResult.isValid) {
          if (config.onValidationError) {
            return config.onValidationError(validationResult);
          }
          
          return createValidationErrorResponse(validationResult);
        }

        // Create enhanced event with validated data
        const validatedEvent: ValidatedEvent<TBody, TPath, TQuery, THeaders> = {
          ...event,
          validatedData: validationResult.data || {}
        };

        // Call the original handler with validated data
        return await handler(validatedEvent, context);

      } catch (error) {
        console.error('Validation middleware error:', error);
        
        return {
          statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: {
              message: 'Internal validation error',
              errorCode: 'VALIDATION_MIDDLEWARE_ERROR'
            }
          })
        };
      }
    };
  };
}

/**
 * Quick validation decorators for common patterns
 */

/**
 * Validate request body only
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return withValidation<T>({ body: schema });
}

/**
 * Validate path parameters only
 */
export function validatePath<T>(schema: z.ZodSchema<T>) {
  return withValidation<any, T>({ path: schema });
}

/**
 * Validate query parameters only
 */
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return withValidation<any, any, T>({ query: schema });
}

/**
 * Validate body and path parameters
 */
export function validateBodyAndPath<TBody, TPath>(
  bodySchema: z.ZodSchema<TBody>,
  pathSchema: z.ZodSchema<TPath>
) {
  return withValidation<TBody, TPath>({ 
    body: bodySchema, 
    path: pathSchema 
  });
}

/**
 * Validate all common request parts
 */
export function validateAll<TBody, TPath, TQuery>(
  bodySchema: z.ZodSchema<TBody>,
  pathSchema: z.ZodSchema<TPath>,
  querySchema: z.ZodSchema<TQuery>
) {
  return withValidation<TBody, TPath, TQuery>({ 
    body: bodySchema, 
    path: pathSchema, 
    query: querySchema 
  });
}

/**
 * Create standardized validation error response
 */
function createValidationErrorResponse(validationResult: ValidationResult): APIGatewayProxyResult {
  const errors = validationResult.errors || [];
  
  // Group errors by field for better UX
  const fieldErrors = errors.reduce((acc, error) => {
    if (!acc[error.field]) {
      acc[error.field] = [];
    }
    acc[error.field]!.push({
      message: error.message,
      code: error.code
    });
    return acc;
  }, {} as Record<string, Array<{ message: string; code: string }>>);

  return {
    statusCode: HTTP_STATUS.BAD_REQUEST,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      error: {
        message: 'Validation failed',
        errorCode: 'VALIDATION_ERROR',
        fields: fieldErrors,
        details: {
          errorCount: errors.length,
          firstError: errors[0]?.message || 'Unknown validation error'
        }
      }
    })
  };
}

/**
 * Utility to extract validated data from event
 */
export function getValidatedData<T = any>(
  event: ValidatedEvent,
  source: 'body' | 'path' | 'query' | 'headers'
): T | undefined {
  return event.validatedData[source] as T;
}

/**
 * Type guard to check if event has validation data
 */
export function isValidatedEvent(event: APIGatewayProxyEvent): event is ValidatedEvent {
  return 'validatedData' in event;
}
