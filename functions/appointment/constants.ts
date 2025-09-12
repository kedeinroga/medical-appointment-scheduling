/**
 * Constants for Appointment Lambda Function
 * Following medical domain conventions
 */

export const APPOINTMENT_API = {
  PATHS: {
    APPOINTMENTS: '/appointments',
    APPOINTMENTS_BY_INSURED: '/appointments/{insuredId}'
  },
  METHODS: {
    POST: 'POST',
    GET: 'GET',
    OPTIONS: 'OPTIONS'
  }
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;

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
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const;

export const SUPPORTED_COUNTRIES = ['PE', 'CL'] as const;
export const INSURED_ID_LENGTH = 5;
export const INSURED_ID_PATTERN = /^\d{5}$/;

export const APPOINTMENT_OPERATIONS = {
  CREATE_APPOINTMENT: 'create_appointment',
  GET_APPOINTMENTS: 'get_appointments'
} as const;

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json'
} as const;

export const LOG_EVENTS = {
  APPOINTMENT_CREATION_FAILED: {
    logId: 'appointment-creation-failed',
    message: 'Appointment creation process failed'
  },
  APPOINTMENT_CREATION_STARTED: {
    logId: 'appointment-creation-started',
    message: 'Appointment creation process initiated'
  },
  APPOINTMENT_GET_FAILED: {
    logId: 'appointment-get-failed',
    message: 'Get appointments process failed'
  },
  APPOINTMENT_GET_STARTED: {
    logId: 'appointment-get-started',
    message: 'Get appointments process initiated'
  },
  LAMBDA_HANDLER_ERROR: {
    logId: 'lambda-handler-error',
    message: 'Unexpected error in Lambda handler'
  }
} as const;
