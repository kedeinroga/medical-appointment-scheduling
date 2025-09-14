/**
 * Validators - Core validation logic for HTTP requests
 * Provides functions to validate different parts of HTTP requests
 */

import { z } from 'zod';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { ValidationResult, ValidationErrorDetails, ValidationOptions, HTTPValidationContext } from './types';

/**
 * Validation error codes
 */
export const VALIDATION_ERROR_CODES = {
  MISSING_BODY: 'MISSING_BODY',
  INVALID_JSON: 'INVALID_JSON',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  MISSING_PATH_PARAM: 'MISSING_PATH_PARAM',
  INVALID_QUERY_PARAM: 'INVALID_QUERY_PARAM',
  MISSING_REQUIRED_HEADER: 'MISSING_REQUIRED_HEADER'
} as const;

/**
 * Base validator class
 */
export class HTTPValidator {
  /**
   * Validate request body with Zod schema
   */
  static validateBody<T>(
    event: APIGatewayProxyEvent,
    schema: z.ZodSchema<T>,
    options: ValidationOptions = {}
  ): ValidationResult<T> {
    try {
      // Check if body exists
      if (!event.body) {
        return {
          isValid: false,
          errors: [{
            field: 'body',
            message: 'Request body is required',
            code: VALIDATION_ERROR_CODES.MISSING_BODY
          }]
        };
      }

      // Parse JSON
      let parsedBody: any;
      try {
        parsedBody = JSON.parse(event.body);
      } catch (error) {
        return {
          isValid: false,
          errors: [{
            field: 'body',
            message: 'Invalid JSON in request body',
            code: VALIDATION_ERROR_CODES.INVALID_JSON
          }]
        };
      }

      // Validate with schema
      const result = schema.safeParse(parsedBody);
      
      if (result.success) {
        return {
          isValid: true,
          data: result.data
        };
      }

      return {
        isValid: false,
        errors: this.formatZodErrors(result.error)
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'body',
          message: 'Unexpected validation error',
          code: VALIDATION_ERROR_CODES.VALIDATION_FAILED
        }]
      };
    }
  }

  /**
   * Validate path parameters with Zod schema
   */
  static validatePathParams<T>(
    event: APIGatewayProxyEvent,
    schema: z.ZodSchema<T>
  ): ValidationResult<T> {
    try {
      const pathParameters = event.pathParameters || {};
      
      const result = schema.safeParse(pathParameters);
      
      if (result.success) {
        return {
          isValid: true,
          data: result.data
        };
      }

      return {
        isValid: false,
        errors: this.formatZodErrors(result.error)
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'pathParameters',
          message: 'Path parameter validation failed',
          code: VALIDATION_ERROR_CODES.MISSING_PATH_PARAM
        }]
      };
    }
  }

  /**
   * Validate query parameters with Zod schema
   */
  static validateQueryParams<T>(
    event: APIGatewayProxyEvent,
    schema: z.ZodSchema<T>
  ): ValidationResult<T> {
    try {
      const queryParameters = event.queryStringParameters || {};
      
      const result = schema.safeParse(queryParameters);
      
      if (result.success) {
        return {
          isValid: true,
          data: result.data
        };
      }

      return {
        isValid: false,
        errors: this.formatZodErrors(result.error)
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'queryStringParameters',
          message: 'Query parameter validation failed',
          code: VALIDATION_ERROR_CODES.INVALID_QUERY_PARAM
        }]
      };
    }
  }

  /**
   * Validate headers with Zod schema
   */
  static validateHeaders<T>(
    event: APIGatewayProxyEvent,
    schema: z.ZodSchema<T>
  ): ValidationResult<T> {
    try {
      // Convert headers to lowercase for case-insensitive validation
      const normalizedHeaders = Object.keys(event.headers || {}).reduce((acc, key) => {
        const value = event.headers[key];
        if (value !== undefined) {
          acc[key.toLowerCase()] = value;
        }
        return acc;
      }, {} as Record<string, string>);
      
      const result = schema.safeParse(normalizedHeaders);
      
      if (result.success) {
        return {
          isValid: true,
          data: result.data
        };
      }

      return {
        isValid: false,
        errors: this.formatZodErrors(result.error)
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'headers',
          message: 'Header validation failed',
          code: VALIDATION_ERROR_CODES.MISSING_REQUIRED_HEADER
        }]
      };
    }
  }

  /**
   * Comprehensive validation of an HTTP request
   */
  static validateRequest<
    TBody = any,
    TPath = any,
    TQuery = any,
    THeaders = any
  >(
    event: APIGatewayProxyEvent,
    schemas: {
      body?: z.ZodSchema<TBody>;
      path?: z.ZodSchema<TPath>;
      query?: z.ZodSchema<TQuery>;
      headers?: z.ZodSchema<THeaders>;
    }
  ): ValidationResult<{
    body?: TBody;
    path?: TPath;
    query?: TQuery;
    headers?: THeaders;
  }> {
    const results: any = {};
    const allErrors: ValidationErrorDetails[] = [];

    // Validate body if schema provided
    if (schemas.body) {
      const bodyResult = this.validateBody(event, schemas.body);
      if (bodyResult.isValid && bodyResult.data) {
        results.body = bodyResult.data;
      } else if (bodyResult.errors) {
        allErrors.push(...bodyResult.errors);
      }
    }

    // Validate path parameters if schema provided
    if (schemas.path) {
      const pathResult = this.validatePathParams(event, schemas.path);
      if (pathResult.isValid && pathResult.data) {
        results.path = pathResult.data;
      } else if (pathResult.errors) {
        allErrors.push(...pathResult.errors);
      }
    }

    // Validate query parameters if schema provided
    if (schemas.query) {
      const queryResult = this.validateQueryParams(event, schemas.query);
      if (queryResult.isValid && queryResult.data) {
        results.query = queryResult.data;
      } else if (queryResult.errors) {
        allErrors.push(...queryResult.errors);
      }
    }

    // Validate headers if schema provided
    if (schemas.headers) {
      const headersResult = this.validateHeaders(event, schemas.headers);
      if (headersResult.isValid && headersResult.data) {
        results.headers = headersResult.data;
      } else if (headersResult.errors) {
        allErrors.push(...headersResult.errors);
      }
    }

    if (allErrors.length > 0) {
      return {
        isValid: false,
        errors: allErrors
      };
    }

    return {
      isValid: true,
      data: results
    };
  }

  /**
   * Format Zod validation errors into our ValidationErrorDetails format
   */
  private static formatZodErrors(zodError: z.ZodError): ValidationErrorDetails[] {
    return zodError.issues.map(issue => ({
      field: issue.path.join('.') || 'unknown',
      message: issue.message,
      code: VALIDATION_ERROR_CODES.VALIDATION_FAILED
    }));
  }

  /**
   * Create validation context from event
   */
  static createValidationContext(event: APIGatewayProxyEvent): HTTPValidationContext {
    // Filter out undefined values from headers
    const filteredHeaders = Object.keys(event.headers || {}).reduce((acc, key) => {
      const value = event.headers[key];
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    return {
      method: event.httpMethod,
      path: event.resource || event.path,
      headers: filteredHeaders,
      requestId: event.requestContext?.requestId || 'unknown'
    };
  }
}
