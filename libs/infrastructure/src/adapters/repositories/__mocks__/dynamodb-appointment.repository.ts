import { Appointment, AppointmentId, IAppointmentRepository, InsuredId } from '@medical-appointment/core-domain';

/**
 * Mock implementation of DynamoDBAppointmentRepository for testing
 * Prevents real database connections during tests
 */
export class DynamoDBAppointmentRepository implements IAppointmentRepository {
  constructor() {
    // Mock constructor - no real database connection
  }

  async save(appointment: Appointment): Promise<void> {
    // Mock implementation - no actual database operation
    return Promise.resolve();
  }

  async findByAppointmentId(appointmentId: AppointmentId): Promise<Appointment> {
    // Mock implementation - throw error for tests to indicate not found
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
}
