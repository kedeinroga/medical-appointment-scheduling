/**
 * Appointment-specific utilities
 * Contains business logic specific to appointment function
 */

import { Logger } from '@aws-lambda-powertools/logger';
import { APPOINTMENT_OPERATIONS } from './constants';

/**
 * Mask sensitive insured ID for logging purposes
 * Shows only first and last characters
 */
export const maskInsuredId = (insuredId: string): string => {
  if (!insuredId || insuredId.length < 3) {
    return '***';
  }
  return `${insuredId.charAt(0)}${'*'.repeat(insuredId.length - 2)}${insuredId.charAt(insuredId.length - 1)}`;
};

/**
 * Log appointment creation with structured logging
 */
export const logAppointmentCreation = (logger: Logger, data: Record<string, any>): void => {
  logger.info('Creating new medical appointment', {
    operation: APPOINTMENT_OPERATIONS.CREATE_APPOINTMENT,
    insuredId: maskInsuredId(data.insuredId || ''),
    country: data.country,
    requestId: data.requestId
  });
};

/**
 * Log appointment retrieval with structured logging
 */
export const logAppointmentGet = (logger: Logger, data: Record<string, any>): void => {
  logger.info('Retrieving appointments', {
    operation: APPOINTMENT_OPERATIONS.GET_APPOINTMENTS,
    insuredId: maskInsuredId(data.insuredId || ''),
    filters: data.filters,
    requestId: data.requestId
  });
};
