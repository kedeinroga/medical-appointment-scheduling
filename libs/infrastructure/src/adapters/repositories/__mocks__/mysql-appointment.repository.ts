import { Appointment, AppointmentId, IAppointmentRepository, InsuredId } from '@medical-appointment/core-domain';

/**
 * Mock implementation of MySQLAppointmentRepository for testing
 * Prevents real database connections during tests
 */
export class MySQLAppointmentRepository implements IAppointmentRepository {
  constructor() {
    // Mock constructor - no real database connection
  }

  async save(appointment: Appointment): Promise<void> {
    // Mock implementation - no actual database operation
    return Promise.resolve();
  }

  async findByAppointmentId(appointmentId: AppointmentId): Promise<Appointment> {
    // Mock implementation - throw error for tests or return a dummy Appointment
    throw new Error('Appointment not found');
  }

  async findByInsuredId(insuredId: InsuredId): Promise<Appointment[]> {
    // Mock implementation - return empty array for tests
    return Promise.resolve([]);
  }

  async update(appointment: Appointment): Promise<void> {
    // Mock implementation - no actual database operation
    return Promise.resolve();
  }

  async closeConnection(): Promise<void> {
    // Mock implementation - no actual connection to close
    return Promise.resolve();
  }
}
