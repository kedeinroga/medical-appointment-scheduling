/**
 * Business-related exceptions for shared use across layers
 */

/**
 * Base business exception class
 */
export abstract class BusinessException extends Error {
  protected constructor(message: string, name: string) {
    super(message);
    this.name = name;
  }
}

/**
 * Exception thrown when an appointment is not found
 */
export class AppointmentNotFoundError extends BusinessException {
  constructor(appointmentId: string) {
    super(`Appointment with ID ${appointmentId} not found`, 'AppointmentNotFoundError');
  }
}

/**
 * Exception thrown when a schedule is not found
 */
export class ScheduleNotFoundError extends BusinessException {
  constructor(scheduleId: string) {
    super(`Schedule with ID ${scheduleId} not found`, 'ScheduleNotFoundError');
  }
}

/**
 * Exception thrown when a country is not supported
 */
export class UnsupportedCountryError extends BusinessException {
  constructor(countryISO: string) {
    super(`Country ${countryISO} is not supported. Only PE and CL are allowed`, 'UnsupportedCountryError');
  }
}

/**
 * Exception thrown when an insured ID is invalid
 */
export class InvalidInsuredIdError extends BusinessException {
  constructor(insuredId: string) {
    super(`Invalid insured ID: ${insuredId}. Must be exactly 5 digits`, 'InvalidInsuredIdError');
  }
}

/**
 * Exception thrown when validation fails
 */
export class ValidationError extends BusinessException {
  constructor(field: string, message: string) {
    super(`Validation error for ${field}: ${message}`, 'ValidationError');
  }
}
