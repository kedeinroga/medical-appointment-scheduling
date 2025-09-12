/**
 * Constants for Appointment Completion Lambda Function
 * Following medical domain conventions
 */

export const APPOINTMENT_STATUS = {
  COMPLETED: 'completed',
  PROCESSED: 'processed'
} as const;

export const ERROR_CODES = {
  INVALID_JSON_FORMAT: 'INVALID_JSON_FORMAT',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const;

export const LOG_EVENTS = {
  APPOINTMENT_COMPLETED: {
    logId: 'appointment-completed',
    message: 'Appointment completed successfully'
  },
  APPOINTMENT_COMPLETION_ERROR: {
    logId: 'appointment-completion-error',
    message: 'Appointment completion failed'
  },
  APPOINTMENT_COMPLETION_STARTED: {
    logId: 'appointment-completion-started',
    message: 'Appointment completion processing initiated'
  },
  NON_PROCESSED_STATUS: {
    logId: 'non-processed-status',
    message: 'Received completion message for non-processed appointment'
  }
} as const;

export const REQUIRED_MESSAGE_FIELDS = [
  'appointmentId',
  'countryISO',
  'insuredId',
  'scheduleId'
] as const;
