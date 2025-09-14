// Use cases layer exports
// This file serves as the main entry point for the use cases layer

// Create Appointment Use Case
export * from './create-appointment/create-appointment.dto';
export * from './create-appointment/create-appointment.use-case';

// Get Appointments Use Case
export * from './get-appointments/get-appointments.dto';
export * from './get-appointments/get-appointments.use-case';

// Process Appointment Use Case
export * from './process-appointment/process-appointment.dto';
export * from './process-appointment/process-appointment.use-case';

// Process Country Appointment Use Case
export * from './process-country-appointment/process-country-appointment.dto';
export * from './process-country-appointment/process-country-appointment.use-case';

// Complete Appointment Use Case
export * from './complete-appointment/complete-appointment.dto';
export * from './complete-appointment/complete-appointment.use-case';

// Factories
export * from './factories/use-case.factory';
export * from './factories/country-processing-composition.factory';

export const USE_CASES_LAYER_VERSION = '1.0.0';
