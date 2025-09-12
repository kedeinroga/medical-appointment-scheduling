/**
 * API Gateway response utilities for AWS Lambda functions
 * Provides standardized response formatting with CORS headers
 */

import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Standard CORS headers for API Gateway responses
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json'
};

/**
 * Standard HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

/**
 * Standard error codes for the application
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  COUNTRY_NOT_SUPPORTED: 'COUNTRY_NOT_SUPPORTED',
  INSURED_ID_INVALID: 'INSURED_ID_INVALID',
  APPOINTMENT_NOT_FOUND: 'APPOINTMENT_NOT_FOUND',
  SCHEDULE_NOT_AVAILABLE: 'SCHEDULE_NOT_AVAILABLE',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

/**
 * Standard error response formatter for API Gateway
 */
export const createErrorResponse = (
  statusCode: number, 
  message: string, 
  errorCode?: string
): APIGatewayProxyResult => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify({
    error: {
      code: errorCode || ERROR_CODES.UNKNOWN_ERROR,
      message,
      timestamp: new Date().toISOString()
    }
  })
});

/**
 * Standard success response formatter for API Gateway
 */
export const createSuccessResponse = (
  statusCode: number, 
  data: any
): APIGatewayProxyResult => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify({
    data,
    timestamp: new Date().toISOString()
  })
});

/**
 * Handle OPTIONS requests for CORS preflight
 */
export const createOptionsResponse = (): APIGatewayProxyResult => ({
  statusCode: HTTP_STATUS.OK,
  headers: CORS_HEADERS,
  body: ''
});
