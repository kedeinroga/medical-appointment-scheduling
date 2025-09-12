/**
 * Custom error for appointment not found
 */
export class AppointmentNotFoundError extends Error {
  constructor(appointmentId: string) {
    super(`Appointment with ID ${appointmentId} not found`);
    this.name = 'AppointmentNotFoundError';
  }
}

/**
 * Custom error for invalid country ISO
 */
export class InvalidCountryISOError extends Error {
  constructor(countryISO: string) {
    super(`Invalid country ISO: ${countryISO}. Only PE and CL are supported`);
    this.name = 'InvalidCountryISOError';
  }
}

/**
 * Custom error for AWS DynamoDB operations
 */
export class DynamoDBError extends Error {
  constructor(operation: string, originalError: Error) {
    super(`DynamoDB ${operation} operation failed: ${originalError.message}`);
    this.name = 'DynamoDBError';
  }
}

/**
 * Custom error for AWS SNS operations
 */
export class SNSError extends Error {
  constructor(operation: string, originalError: Error) {
    super(`SNS ${operation} operation failed: ${originalError.message}`);
    this.name = 'SNSError';
  }
}

/**
 * Custom error for AWS SQS operations
 */
export class SQSError extends Error {
  constructor(operation: string, originalError: Error) {
    super(`SQS ${operation} operation failed: ${originalError.message}`);
    this.name = 'SQSError';
  }
}

/**
 * Custom error for AWS EventBridge operations
 */
export class EventBridgeError extends Error {
  constructor(operation: string, originalError: Error) {
    super(`EventBridge ${operation} operation failed: ${originalError.message}`);
    this.name = 'EventBridgeError';
  }
}

/**
 * Custom error for database connection operations
 */
export class DatabaseConnectionError extends Error {
  constructor(operation: string, originalError: Error) {
    super(`Database ${operation} operation failed: ${originalError.message}`);
    this.name = 'DatabaseConnectionError';
  }
}

/**
 * Custom error for validation failures
 */
export class ValidationError extends Error {
  constructor(field: string, message: string) {
    super(`Validation error for ${field}: ${message}`);
    this.name = 'ValidationError';
  }
}
