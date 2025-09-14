/**
 * Constants for Appointment Lambda Function
 * Following medical domain conventions
 * 
 * NOTE: Common constants like SUPPORTED_COUNTRIES, HTTP_STATUS_CODES, etc.
 * are now imported from @medical-appointment/shared to follow DRY principle
 */

import { 
  SUPPORTED_COUNTRIES, 
  INSURED_ID_LENGTH, 
  INSURED_ID_PATTERN,
  COMMON_ERROR_CODES,
  HTTP_STATUS_CODES,
  CORS_HEADERS
} from '@medical-appointment/shared';

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

// Re-export shared constants for backwards compatibility
export { SUPPORTED_COUNTRIES, INSURED_ID_LENGTH, INSURED_ID_PATTERN, CORS_HEADERS };

// Re-export with local aliases for backwards compatibility
export const HTTP_STATUS = HTTP_STATUS_CODES;
export const ERROR_CODES = COMMON_ERROR_CODES;

export const APPOINTMENT_OPERATIONS = {
  CREATE_APPOINTMENT: 'create_appointment',
  GET_APPOINTMENTS: 'get_appointments'
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
