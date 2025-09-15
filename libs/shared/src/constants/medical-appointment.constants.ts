/**
 * Shared Constants for Medical Appointment System
 * These constants are used across all layers and functions
 */

/**
 * Supported countries in the medical appointment system
 */
export const SUPPORTED_COUNTRIES = ['PE', 'CL'] as const;
export type SupportedCountry = typeof SUPPORTED_COUNTRIES[number];

/**
 * Insured ID validation constants
 */
export const INSURED_ID_LENGTH = 5;
export const INSURED_ID_PATTERN = /^\d{5}$/;

/**
 * Validation error codes used across the system
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
 * Common error codes for business logic
 */
export const COMMON_ERROR_CODES = {
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
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  // Specific error codes for appointment scheduling
  SCHEDULE_NOT_FOUND: 'SCHEDULE_NOT_FOUND',
  INVALID_SCHEDULE: 'INVALID_SCHEDULE',
  UNSUPPORTED_COUNTRY: 'UNSUPPORTED_COUNTRY',
  INVALID_INSURED_ID: 'INVALID_INSURED_ID',
  APPOINTMENT_NOT_FOUND: 'APPOINTMENT_NOT_FOUND'
} as const;

/**
 * HTTP Status codes
 */
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

/**
 * CORS configuration for API responses
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json'
} as const;
