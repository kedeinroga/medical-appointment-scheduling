/**
 * Common logging utilities for AWS Lambda functions
 * Provides standardized logging patterns across the application
 */

import { Logger } from '@aws-lambda-powertools/logger';

/**
 * Log types for different error categories
 */
export enum LogType {
  BUSINESS_ERROR = 'business_error',
  INFRASTRUCTURE_ERROR = 'infrastructure_error',
  VALIDATION_ERROR = 'validation_error',
  INTEGRATION_ERROR = 'integration_error'
}

/**
 * Standard business error logging
 */
export const logBusinessError = (
  logger: Logger,
  error: Error,
  context: Record<string, any> = {}
): void => {
  logger.error('Business error occurred', {
    errorType: LogType.BUSINESS_ERROR,
    errorMessage: error.message,
    errorStack: error.stack,
    ...context
  });
};

/**
 * Standard infrastructure error logging
 */
export const logInfrastructureError = (
  logger: Logger,
  error: Error,
  context: Record<string, any> = {}
): void => {
  logger.error('Infrastructure error occurred', {
    errorType: LogType.INFRASTRUCTURE_ERROR,
    errorMessage: error.message,
    errorStack: error.stack,
    ...context
  });
};

/**
 * Standard validation error logging
 */
export const logValidationError = (
  logger: Logger,
  error: Error,
  context: Record<string, any> = {}
): void => {
  logger.warn('Validation error occurred', {
    errorType: LogType.VALIDATION_ERROR,
    errorMessage: error.message,
    ...context
  });
};

/**
 * Standard integration error logging
 */
export const logIntegrationError = (
  logger: Logger,
  error: Error,
  context: Record<string, any> = {}
): void => {
  logger.error('Integration error occurred', {
    errorType: LogType.INTEGRATION_ERROR,
    errorMessage: error.message,
    errorStack: error.stack,
    ...context
  });
};
