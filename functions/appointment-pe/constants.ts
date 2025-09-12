/**
 * Constants for Appointment PE Lambda Function
 * Following medical domain conventions
 */

export const COUNTRY_PROCESSING = {
  PERU: 'PE',
  EXPECTED_COUNTRY: 'PE'
} as const;

export const ERROR_CODES = {
  INVALID_JSON_FORMAT: 'INVALID_JSON_FORMAT',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const;

export const LOG_EVENTS = {
  PE_APPOINTMENT_PROCESSED: {
    logId: 'pe-appointment-processed',
    message: 'PE appointment processed successfully'
  },
  PE_APPOINTMENT_PROCESSING_ERROR: {
    logId: 'pe-appointment-processing-error',
    message: 'PE appointment processing failed'
  },
  PE_APPOINTMENT_PROCESSING_STARTED: {
    logId: 'pe-appointment-processing-started',
    message: 'PE appointment processing initiated'
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
