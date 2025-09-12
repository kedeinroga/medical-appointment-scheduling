export class InvalidInsuredIdError extends Error {
  constructor(insuredId: string) {
    super(`Invalid insured ID: ${insuredId}. Must be exactly 5 digits.`);
    this.name = 'InvalidInsuredIdError';
  }
}

export class UnsupportedCountryError extends Error {
  constructor(countryISO: string) {
    super(`Country ${countryISO} is not supported. Only PE and CL are allowed.`);
    this.name = 'UnsupportedCountryError';
  }
}

export class InvalidAppointmentStatusError extends Error {
  constructor(status: string) {
    super(`Invalid appointment status: ${status}. Must be one of: pending, processed, completed.`);
    this.name = 'InvalidAppointmentStatusError';
  }
}

export class AppointmentStatusTransitionError extends Error {
  constructor(currentStatus: string, targetStatus: string) {
    super(`Cannot transition from ${currentStatus} to ${targetStatus}.`);
    this.name = 'AppointmentStatusTransitionError';
  }
}

export class InvalidScheduleError extends Error {
  constructor(message: string) {
    super(`Invalid schedule: ${message}`);
    this.name = 'InvalidScheduleError';
  }
}

export class AppointmentNotFoundError extends Error {
  constructor(appointmentId: string) {
    super(`Appointment with ID ${appointmentId} not found.`);
    this.name = 'AppointmentNotFoundError';
  }
}
