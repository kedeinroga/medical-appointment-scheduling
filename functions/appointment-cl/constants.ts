/**
 * Constants for Appointment CL Lambda Function
 * Following medical domain conventions
 */

export const COUNTRY_PROCESSING = {
  CHILE: 'CL',
  EXPECTED_COUNTRY: 'CL'
} as const;

export const ERROR_CODES = {
  INVALID_JSON_FORMAT: 'INVALID_JSON_FORMAT',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const;

export const LOG_EVENTS = {
  CL_APPOINTMENT_PROCESSED: {
    logId: 'cl-appointment-processed',
    message: 'CL appointment processed successfully'
  },
  CL_APPOINTMENT_PROCESSING_ERROR: {
    logId: 'cl-appointment-processing-error',
    message: 'CL appointment processing failed'
  },
  CL_APPOINTMENT_PROCESSING_STARTED: {
    logId: 'cl-appointment-processing-started',
    message: 'CL appointment processing initiated'
  },
  WRONG_COUNTRY_MESSAGE: {
    logId: 'wrong-country-message',
    message: 'Received message for incorrect country'
  }
} as const;

export const REQUIRED_MESSAGE_FIELDS = [
  'appointmentId',
  'countryISO', 
  'insuredId',
  'scheduleId'
] as const;
