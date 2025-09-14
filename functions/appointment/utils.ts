/**
 * Appointment-specific utilities
 * Contains business logic specific to appointment function
 */

import { Logger } from '@aws-lambda-powertools/logger';
import { maskInsuredId } from '@medical-appointment/shared'; // Use shared utility
import { APPOINTMENT_OPERATIONS } from './constants';

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
